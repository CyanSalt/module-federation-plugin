const { OriginalSource, RawSource } = require('webpack-sources')
const Module = require('webpack/lib/Module')
const Template = require('webpack/lib/Template')

const getSourceForGlobalVariableExternal = (
  variableName,
  type,
  externalRequest,
) => {
  if (!Array.isArray(variableName)) {
    // make it an array as the look up works the same basically
    variableName = [variableName]
  }

  const objectLookup = variableName
    .map(r => `${JSON.stringify(r)}`)
    .join('')

  return Template.asString([
    '(function() {',
    'module.exports =',
    `typeof ${type}["${externalRequest}"] !== 'undefined' ? ${type}["${externalRequest}"].get(${objectLookup}) : `,
    `Promise.reject('Missing Remote Runtime: "${externalRequest}" cannot be found when trying to import ${objectLookup}'); `,
    `Object.defineProperty(module.exports, '__esModule', { value: true });`,
    '}());',
  ])
}

/**
 * @param {string|string[]} moduleAndSpecifiers the module request
 * @param {string|string[]} externalRequest the module request namespace scope
 * @returns {string} the generated source
 */
const getSourceForCommonJsExternal = (moduleAndSpecifiers, externalRequest) => {
  if (!Array.isArray(moduleAndSpecifiers)) {
    // returns module.exports = require("websiteTwo").get("Title");
    return `module.exports = require(${JSON.stringify(
      externalRequest,
    )}).get(${JSON.stringify(moduleAndSpecifiers)});`
  }

  const moduleName = moduleAndSpecifiers[0]
  const objectLookup = moduleAndSpecifiers
    .slice(1)
    .map(r => `[${JSON.stringify(r)}]`)
    .join('')

  return `module.exports = require(${JSON.stringify(
    externalRequest,
  )}).get(${JSON.stringify(moduleName)})${objectLookup};`
}

const TYPES = new Set(['javascript'])

class RemoteModule extends Module {

  /**
   * @param {string} request request string
   * @param {string} externalRequest external request to containers
   * @param {string} internalRequest name of exposed module in container
   */
  constructor(request, externalRequest, internalRequest, remoteType) {
    super('javascript/dynamic', null)
    this.request = request
    this.externalRequest = externalRequest
    this.internalRequest = internalRequest
    this.remoteType = remoteType
    this._identifier = `remote ${this.externalRequest} ${this.internalRequest}`
  }

  /**
   * @returns {string} a unique identifier of the module
   */
  identifier() {
    return this._identifier
  }

  /**
   * @param {RequestShortener} requestShortener the request shortener
   * @returns {string} a user readable identifier of the module
   */
  readableIdentifier(requestShortener) {
    return `remote ${this.request}`
  }

  /**
   * @param {LibIdentOptions} options options
   * @returns {string | null} an identifier for library inclusion
   */
  libIdent(options) {
    return `webpack/container/remote/${this.request}`
  }

  /**
   * @returns {void}
   */
  build(options, compilation, resolver, fs, callback) {
    this.buildMeta = {}
    this.buildInfo = {
      strict: true,
    }

    callback()
  }

  getSourceString(runtimeTemplate) {
    switch (this.remoteType) {
      case 'this':
      case 'window':
      case 'self':
        return getSourceForGlobalVariableExternal(
          this.internalRequest,
          this.remoteType,
          this.externalRequest,
        )
      case 'global':
        return getSourceForGlobalVariableExternal(
          this.internalRequest,
          runtimeTemplate.outputOptions.globalObject,
          this.externalRequest,
        )
      case 'commonjs':
      case 'commonjs2':
        return getSourceForCommonJsExternal(this.internalRequest, this.externalRequest)
      default:
        throw new Error(
          `${this.remoteType} is not supported with ContainerReferencePlugin`,
        )
    }
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
  size(type) {
    return 42
  }

  /**
   * @returns {Set<string>} types availiable (do not mutate)
   */
  getSourceTypes() {
    return TYPES
  }

  /**
   * @param {Hash} hash the hash used to track dependencies
   * @returns {void}
   */
  updateHash(hash) {
    hash.update(JSON.stringify(this.request))
    super.updateHash(hash)
  }

}

module.exports = RemoteModule
