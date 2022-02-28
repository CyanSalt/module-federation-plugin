const { OriginalSource, RawSource } = require('webpack-sources')
const AsyncDependenciesBlock = require('webpack/lib/AsyncDependenciesBlock')
const Module = require('webpack/lib/Module')
const Template = require('webpack/lib/Template')
const ContainerExposedDependency = require('./ContainerExposedDependency')
const { basicFunction, returningFunction } = require('./runtime-template')
const RuntimeGlobals = require('./webpack/RuntimeGlobals')

/** @typedef {import('webpack/lib/RequestShortener')} RequestShortener */

const SOURCE_TYPES = new Set(['javascript'])

class ContainerEntryModule extends Module {

  constructor(name, exposes, shareScope) {
    super('javascript/dynamic', null)
    this._name = name
    this._exposes = exposes
    this._shareScope = shareScope
  }

  /**
   * @returns {Set<string>} types available (do not mutate)
   */
  getSourceTypes() {
    return SOURCE_TYPES
  }

  /**
   * @returns {string} a unique identifier of the module
   */
  identifier() {
    return `container entry ${JSON.stringify(this._exposes)}`
  }

  /**
   * @param {RequestShortener} requestShortener the request shortener
   * @returns {string} a user readable identifier of the module
   */
  readableIdentifier(requestShortener) {
    return `container entry`
  }

  /**
   * Removes all dependencies and blocks
   * @returns {void}
   */
  clearDependenciesAndBlocks() {
    this.dependencies.length = 0
    this.blocks.length = 0
  }

  /**
   * @returns {void}
   */
  build(config, compilation, resolver, fs, callback) {
    this.buildMeta = {}
    this.buildInfo = {
      strict: true,
    }

    this.clearDependenciesAndBlocks()

    for (const [name, options] of this._exposes) {
      const block = new AsyncDependenciesBlock(
        { name: options.name },
        undefined,
        { name },
        options.import,
      )

      const dep = new ContainerExposedDependency(name, options.import)
      dep.loc = {
        name,
      }

      block.addDependency(dep)
      this.addBlock(block)
    }

    callback()
  }

  getSourceString(runtimeTemplate) {
    const getters = []

    for (const block of this.blocks) {
      const {
        dependencies: [dep],
      } = block
      const name = dep.exposedName
      const mod = dep.module
      const request = dep.userRequest

      let str

      if (!mod) {
        str = runtimeTemplate.throwMissingModuleErrorBlock({
          request: dep.userRequest,
        })
      } else {
        str = `return ${runtimeTemplate.blockPromise({
          block,
          message: request,
        })}.then(${returningFunction(
          returningFunction(
            `(${runtimeTemplate.moduleRaw({
              module: mod,
              request,
            })})`,
          ),
        )});`
      }

      getters.push(
        `${JSON.stringify(name)}: ${basicFunction('', str)}`,
      )
    }

    return Template.asString([
      `var moduleMap = {`,
      Template.indent(getters.join(',\n')),
      '};',
      `var get = ${basicFunction('module, getScope', [
        `${RuntimeGlobals.currentRemoteGetScope} = getScope;`,
        'getScope = (',
        Template.indent([
          `${RuntimeGlobals.hasOwnProperty}(moduleMap, module)`,
          Template.indent([
            '? moduleMap[module]()',
            `: Promise.resolve().then(${basicFunction(
              '',
              `throw new Error('Module "' + module + '" does not exist in container.');`,
            )})`,
          ]),
        ]),
        ');',
        `${RuntimeGlobals.currentRemoteGetScope} = undefined;`,
        'return getScope;',
      ])};`,
      `var init = ${basicFunction('shareScope, initScope', [
        `if (!${RuntimeGlobals.shareScopeMap}) return;`,
        `var oldScope = ${RuntimeGlobals.shareScopeMap}[${JSON.stringify(
          this._shareScope,
        )}];`,
        `var name = ${JSON.stringify(this._shareScope)}`,
        `if(oldScope && oldScope !== shareScope) throw new Error("Container initialization failed as it has already been initialized with a different share scope");`,
        `${RuntimeGlobals.shareScopeMap}[name] = shareScope;`,
        `return ${RuntimeGlobals.initializeSharing}(name, initScope);`,
      ])};`,
      '',
      '// This exports getters to disallow modifications',
      `${RuntimeGlobals.definePropertyGetter}(exports, 'get', ${returningFunction('get')});`,
      `${RuntimeGlobals.definePropertyGetter}(exports, 'init', ${returningFunction('init')});`,
    ])
  }

  getSource(sourceString) {
    if (this.useSourceMap) {
      return new OriginalSource(sourceString, this.identifier())
    }

    return new RawSource(sourceString)
  }

  source(dependencyTemplates, runtime) {
    return this.getSource(this.getSourceString(runtime))
  }

  /**
   * @param {string=} type the source type for which the size should be estimated
   * @returns {number} the estimated size of the module (must be non-zero)
   */
  size() {
    return 42
  }

}

module.exports = ContainerEntryModule
