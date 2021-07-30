const { OriginalSource, RawSource } = require('webpack-sources')
const Module = require('webpack/lib/Module')
const Template = require('webpack/lib/Template')
const RuntimeGlobals = require('./webpack/RuntimeGlobals')

const getSourceForGlobalVariableExternal = (
  variableName,
  type,
  requestScope,
) => {
  if (!Array.isArray(variableName)) {
    // make it an array as the look up works the same basically
    variableName = [variableName]
  }

  const objectLookup = variableName.map(r => `${JSON.stringify(r)}`).join('')

  // will output the following:
  // (function() {
  //   module.exports =
  //     typeof self["websiteTwo"] !== "undefined" ? self["websiteTwo"].get("Title") :
  //       Promise.reject("Missing Remote Runtime: self[\"websiteTwo\"] cannot be found when trying to import \"Title\"");
  // }());

  return Template.asString([
    '(function() {',
    'module.exports =',
    `typeof ${type}["${requestScope}"] !== 'undefined' ? ${type}["${requestScope}"].get(${objectLookup}) : `,
    `Promise.reject('Missing Remote Runtime: ${type}["${requestScope}"] cannot be found when trying to import ${objectLookup}'); `,
    '}());',
  ])
}

/**
 * @param {string|string[]} moduleAndSpecifiers the module request
 * @param {string|string[]} requestScope the module request namespace scope
 * @returns {string} the generated source
 */
const getSourceForCommonJsExternal = (moduleAndSpecifiers, requestScope) => {
  if (!Array.isArray(moduleAndSpecifiers)) {
    // returns module.exports = require("websiteTwo").get("Title");
    return `module.exports = require(${JSON.stringify(
      requestScope,
    )}).get(${JSON.stringify(moduleAndSpecifiers)});`
  }

  const moduleName = moduleAndSpecifiers[0]
  const objectLookup = moduleAndSpecifiers
    .slice(1)
    .map(r => `[${JSON.stringify(r)}]`)
    .join('')

  return `module.exports = require(${JSON.stringify(
    requestScope,
  )}).get(${JSON.stringify(moduleName)})${objectLookup};`
}

const TYPES = new Set(['javascript'])

class RemoteModule extends Module {
  constructor(request, type, userRequest, remotes, shared) {
    super('javascript/dynamic', null)

    this.requestScope = request.split('/')[0]

    // Info from Factory
    /** @type {string | string[] | Record<string, string | string[]>} */
    this.request = request.split(`${this.requestScope}/`)[1]

    if (remotes[this.requestScope]) {
      this.requestScope = remotes[this.requestScope]
    }

    this.shared = shared

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
          this.requestScope,
        )
      case 'global':
        return getSourceForGlobalVariableExternal(
          request,
          runtimeTemplate.outputOptions.globalObject,
          this.requestScope,
        )
      case 'commonjs':
      case 'commonjs2':
        return getSourceForCommonJsExternal(request, this.requestScope)
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


  /**
   * Get a list of runtime requirements
   * @param {SourceContext} context context for code generation
   * @returns {Iterable<string> | null} required runtime modules
   */
  getRuntimeRequirements(context) {
    return [RuntimeGlobals.module, RuntimeGlobals.require]
  }


  /**
   * @param {CodeGenerationContext} context context for code generation
   * @returns {CodeGenerationResult} result
   */
  source(depTemplates, runtimeTemplate) {
    let sourceString = this.getSourceString(
      runtimeTemplate,
    )

    let sources
    if (this.useSourceMap) {
      sources = new OriginalSource(sourceString, this.identifier())
    } else {
      sources = new RawSource(sourceString)
    }

    return sources
  }

  /**
   * @param {string=} type the source type for which the size should be estimated
   * @returns {number} the estimated size of the module (must be non-zero)
   */
  size(type) {
    return 42
  }

  /**
   * @param {Hash} hash the hash used to track dependencies
   * @param {ChunkGraph} chunkGraph the chunk graph
   * @returns {void}
   */
  updateHash(hash, chunkGraph) {
    hash.update(JSON.stringify(this.request))
    super.updateHash(hash)
  }

}

module.exports = RemoteModule
