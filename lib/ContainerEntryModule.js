const { OriginalSource, RawSource } = require('webpack-sources')
const AsyncDependenciesBlock = require('webpack/lib/AsyncDependenciesBlock')
const Module = require('webpack/lib/Module')
const Template = require('webpack/lib/Template')

/** @typedef {import('webpack/lib/RequestShortener')} RequestShortener */

const SOURCE_TYPES = new Set(['javascript'])

class ContainerEntryModule extends Module {

  constructor(dependency) {
    super('javascript/dynamic', null)
    this.exposes = dependency.exposedDependencies
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
    return `container entry ${JSON.stringify(
      this.exposes.map(item => item.exposedName),
    )}`
  }

  /**
   * @param {RequestShortener} requestShortener the request shortener
   * @returns {string} a user readable identifier of the module
   */
  readableIdentifier(requestShortener) {
    return `container entry`
  }

  basicFunction(args, body) {
    return `function(${args}) {\n${Template.indent(body)}\n}`
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
      ]),
      `};`,
    ].join('')
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

  size() {
    return 42
  }
}

module.exports = ContainerEntryModule
