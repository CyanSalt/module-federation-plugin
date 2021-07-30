const { OriginalSource, RawSource } = require('webpack-sources')
const AsyncDependenciesBlock = require('webpack/lib/AsyncDependenciesBlock')
const Module = require('webpack/lib/Module')
const Template = require('webpack/lib/Template')
const RuntimeGlobals = require('./webpack/RuntimeGlobals')

const SOURCE_TYPES = new Set(['javascript'])
const RUNTIME_REQUIREMENTS = new Set([
  RuntimeGlobals.definePropertyGetters,
  RuntimeGlobals.exports,
  RuntimeGlobals.returnExportsFromRuntime,
])

class ContainerEntryModule extends Module {
  constructor(dependency) {
    super('javascript/dynamic', null)
    this.exposes = dependency.exposedDependencies
  }

  getSourceTypes() {
    return SOURCE_TYPES
  }

  basicFunction(args, body) {
    return `function(${args}) {\n${Template.indent(body)}\n}`
  }

  identifier() {
    return `container entry ${JSON.stringify(
      this.exposes.map(item => item.exposedName),
    )}`
  }

  readableIdentifier() {
    return `container entry`
  }

  needBuild(context, callback) {
    return callback(null, !this.buildMeta)
  }

  /**
   * Removes all dependencies and blocks
   * @returns {void}
   */
  clearDependenciesAndBlocks() {
    this.dependencies.length = 0
    this.blocks.length = 0
  }

  build(options, compilation, resolver, fs, callback) {
    this.buildMeta = {}
    this.buildInfo = {
      strict: true,
    }

    this.clearDependenciesAndBlocks()

    for (const dep of (this.exposes || [])) {
      const block = new AsyncDependenciesBlock(
        undefined,
        dep.loc,
        dep.userRequest,
      )
      block.addDependency(dep)
      this.addBlock(block)
    }

    callback()
  }

  getSourceString(runtimeTemplate) {
    const runtimeRequirements = RUNTIME_REQUIREMENTS
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
        })}.then(${this.basicFunction(
          '',
          `return ${runtimeTemplate.moduleRaw({
            module: mod,
            request,
            weak: false,
            runtimeRequirements,
          })}`,
        )});`
      }

      getters.push(
        `${Template.toNormalComment(
          `[${name}] => ${request}`,
        )}"${name}": ${this.basicFunction('', str)}`,
      )
    }

    return [
      `\n${'var'} __MODULE_MAP__ = {${getters.join(',')}};`,
      `\n${'var'} __GET_MODULE__ = ${this.basicFunction(
        ['module'],
        `return typeof __MODULE_MAP__[module] === 'function' ? __MODULE_MAP__[module].apply(null) : Promise.reject(new Error('Module ' + module + ' does not exist.'))`,
      )};`,
      `\n\n module.exports = {\n`,
      Template.indent([
        `get: ${this.basicFunction(
          'id',
          'return __GET_MODULE__(id)',
        )},`,

        `override: ${this.basicFunction(
          'obj',
          `Object.assign(__MODULE_MAP__, obj)`,
        )},`,
      ]),
      `};`,
      // `)`,
    ].join('')
  }

  getSource(sourceString) {
    if (this.useSourceMap) {
      return new OriginalSource(sourceString, this.identifier());
    }

    return new RawSource(sourceString);
  }

  source(dependencyTemplates, runtime) {
    return this.getSource(this.getSourceString(runtime));
  }

  size() {
    return 42
  }
}

module.exports = ContainerEntryModule
