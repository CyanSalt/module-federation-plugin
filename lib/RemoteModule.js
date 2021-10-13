const { OriginalSource, RawSource } = require('webpack-sources')
const Module = require('webpack/lib/Module')
const Template = require('webpack/lib/Template')
const ConstDependency = require('webpack/lib/dependencies/ConstDependency')
const { basicFunction, returningFunction } = require('./runtime-template')
const RuntimeGlobals = require('./webpack/RuntimeGlobals')
const extractUrlAndGlobal = require('./webpack/util/extract-url-and-global')

const TYPES = new Set(['javascript'])

const getSourceForGlobalVariableExternal = (variableName, globalObject, externalRequest) => {
  if (!Array.isArray(variableName)) {
    // make it an array as the look up works the same basically
    variableName = [variableName]
  }

  const objectLookup = variableName
    .map(r => `${JSON.stringify(r)}`)
    .join('')

  return Template.asString([
    '(function() {',
    `module.exports = typeof ${globalObject}["${externalRequest}"] !== 'undefined'`,
    Template.indent([
      `? ${globalObject}["${externalRequest}"].get(${objectLookup})`,
      `: Promise.reject('Missing Remote Runtime: "${externalRequest}" cannot be found when trying to import ${objectLookup}'); `,
    ]),
    `${RuntimeGlobals.makeNamespaceObject}(module.exports);`,
    '}());',
  ])
}

const getExternalSourceForScriptExternal = (variableName, externalRequest) => {
  if (!Array.isArray(variableName)) {
    // make it an array as the look up works the same basically
    variableName = [variableName]
  }

  const objectLookup = variableName
    .map(r => `${JSON.stringify(r)}`)
    .join('')

  const [url, globalName] = extractUrlAndGlobal(externalRequest)

  return Template.asString([
    '(function() {',
    `module.exports = new Promise(${basicFunction('resolve, reject', [
      `if(typeof ${globalName} !== "undefined") return resolve();`,
      `${RuntimeGlobals.loadScript}(${JSON.stringify(
        url,
      )}, ${basicFunction('event', [
        `if(typeof ${globalName} !== "undefined") return resolve();`,
        'var errorType = event && (event.type === \'load\' ? \'missing\' : event.type);',
        'var realSrc = event && event.target && event.target.src;',
        'var __webpack_error__ = new Error();',
        '__webpack_error__.message = \'Loading script failed.\\n(\' + errorType + \': \' + realSrc + \')\';',
        '__webpack_error__.name = \'ScriptExternalLoadError\';',
        '__webpack_error__.type = errorType;',
        '__webpack_error__.request = realSrc;',
        'reject(__webpack_error__);',
      ])}, ${JSON.stringify(globalName)});`,
    ])})`,
    `.then(${returningFunction(`${globalName}.get(${objectLookup})`)});`,
    `${RuntimeGlobals.makeNamespaceObject}(module.exports);`,
    '}());',
  ])
}

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

    // Require __webpack_require__
    this.addDependency(new ConstDependency('', 0))

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
      case 'script':
        return getExternalSourceForScriptExternal(
          this.internalRequest,
          this.externalRequest,
        )
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
