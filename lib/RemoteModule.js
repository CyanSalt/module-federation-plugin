const { OriginalSource, RawSource } = require('webpack-sources')
const Module = require('webpack/lib/Module')
const Template = require('webpack/lib/Template')
const RuntimeGlobals = require('./webpack/RuntimeGlobals')

const getSourceForGlobalVariableExternal = (
  variableName,
  type,
  library,
) => {
  if (!Array.isArray(variableName)) {
    // make it an array as the look up works the same basically
    variableName = [variableName]
  }

  const objectLookup = variableName
    .map(r => `${JSON.stringify(r)}`)
    .join('')

  // will output the following:
  // (function() {
  //   module.exports =
  //     typeof self["websiteTwo"] !== "undefined" ? self["websiteTwo"].get("Title") :
  //       Promise.reject('Missing Remote Runtime: "websiteTwo" cannot be found when trying to import "Title"');
  // }());

  return Template.asString([
    '(function() {',
    'module.exports =',
    `typeof ${type}["${library}"] !== 'undefined' ? ${type}["${library}"].get(${objectLookup}) : `,
    `Promise.reject('Missing Remote Runtime: "${library}" cannot be found when trying to import ${objectLookup}'); `,
    '}());',
  ])
}

/**
 * @param {string|string[]} moduleAndSpecifiers the module request
 * @param {string|string[]} library the module request namespace scope
 * @returns {string} the generated source
 */
const getSourceForCommonJsExternal = (moduleAndSpecifiers, library) => {
  if (!Array.isArray(moduleAndSpecifiers)) {
    // returns module.exports = require("websiteTwo").get("Title");
    return `module.exports = require(${JSON.stringify(
      library,
    )}).get(${JSON.stringify(moduleAndSpecifiers)});`
  }

  const moduleName = moduleAndSpecifiers[0]
  const objectLookup = moduleAndSpecifiers
    .slice(1)
    .map(r => `[${JSON.stringify(r)}]`)
    .join('')

  return `module.exports = require(${JSON.stringify(
    library,
  )}).get(${JSON.stringify(moduleName)})${objectLookup};`
}

const TYPES = new Set(['javascript'])

class RemoteModule extends Module {
  constructor(library, request, type, userRequest) {
    super('javascript/dynamic', null)

    // Info from Factory
    this.library = library
    /** @type {string | string[] | Record<string, string | string[]>} */
    this.request = request

    /** @type {string} */
    this.remoteType = type
    /** @type {string} */
    this.userRequest = userRequest

  }


  /**
   * @returns {Set<string>} types availiable (do not mutate)
   */
  getSourceTypes() {
    return TYPES
  }

  /**
   * @param {LibIdentOptions} options options
   * @returns {string | null} an identifier for library inclusion
   */
  libIdent(options) {
    return this.userRequest
  }

  /**
   * @returns {string} a unique identifier of the module
   */
  identifier() {
    return `remote ${JSON.stringify(this.request)}`
  }

  /**
   * @param {RequestShortener} requestShortener the request shortener
   * @returns {string} a user readable identifier of the module
   */
  readableIdentifier(requestShortener) {
    return `remote ${JSON.stringify(this.request)}`
  }

  /**
   * @param {NeedBuildContext} context context info
   * @param {function(WebpackError=, boolean=): void} callback callback function, returns true, if the module needs a rebuild
   * @returns {void}
   */
  needBuild(context, callback) {
    callback(null, !this.buildMeta)
  }

  /**
   * @param {WebpackOptions} options webpack options
   * @param {Compilation} compilation the compilation
   * @param {ResolverWithOptions} resolver the resolver
   * @param {InputFileSystem} fs the file system
   * @param {function(WebpackError=): void} callback callback function
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
    const request
      = typeof this.request === 'object' && !Array.isArray(this.request)
        ? this.request[this.remoteType]
        : this.request
    switch (this.remoteType) {
      case 'this':
      case 'window':
      case 'self':
        return getSourceForGlobalVariableExternal(
          request,
          this.remoteType,
          this.library,
        )
      case 'global':
        return getSourceForGlobalVariableExternal(
          request,
          runtimeTemplate.outputOptions.globalObject,
          this.library,
        )
      case 'commonjs':
      case 'commonjs2':
        return getSourceForCommonJsExternal(request, this.library)
      case 'amd':
      case 'amd-require':
      case 'umd':
      case 'umd2':
      case 'system':
      default:
        throw new Error(
          `${this.remoteType} is not supported with ContainerReferencePlugin`,
        )
    }
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
