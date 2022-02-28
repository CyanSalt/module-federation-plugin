const MagicCommentsPlugin = require('./MagicCommentsPlugin')
const RemoteModule = require('./RemoteModule')
const RuntimePlugin = require('./RuntimePlugin')
const { parseOptions } = require('./options')
const LoadScriptRuntimeModule = require('./runtime/LoadScriptRuntimeModule')
const createSchemaValidation = require('./webpack/util/create-schema-validation')

/** @typedef {import('webpack/lib/Compiler')} Compiler */

const validate = createSchemaValidation(
  () => require('../schemas/ContainerReferencePlugin.json'),
  {
    name: 'Container Reference Plugin',
    baseDataPath: 'options',
  },
)

const slashCode = '/'.charCodeAt(0)

const PLUGIN_NAME = 'ContainerReferencePlugin'

class ContainerReferencePlugin {

  constructor(options) {
    validate(options)
    this._options = options
    this._options.remotes = parseOptions(
      options.remotes,
      item => ({
        external: item,
      }),
      item => ({
        external: item.external,
      }),
    )
    this._options.additionalFeatures = options.additionalFeatures || {}
  }

  /**
   * Apply the plugin
   * @param {Compiler} compiler the compiler instance
   * @returns {void}
   */
  apply(compiler) {
    const { remotes, remoteType, additionalFeatures } = this._options
    const { asyncChunkMode, keepAsync } = additionalFeatures

    if (remoteType === 'script') {
      new RuntimePlugin([
        new LoadScriptRuntimeModule(),
      ]).apply(compiler)
    }

    compiler.hooks.normalModuleFactory.tap(PLUGIN_NAME, (nmf) => {

      nmf.hooks.factory.tap(PLUGIN_NAME, (fn) => {
        return (data, callback) => {
          for (const [key, config] of remotes) {
            if (data.request.startsWith(key)
              && data.request.charCodeAt(key.length) === slashCode
            ) {
              callback(
                null,
                new RemoteModule(
                  data.request,
                  config.external,
                  `.${data.request.slice(key.length)}`,
                  remoteType,
                  keepAsync,
                ),
              )
              return
            }
            fn(data, callback)
          }
        }
      })

    })

    // Supports a non-standard option `asyncChunkMode`
    // to help set chunk mode of remote modules globally
    if (asyncChunkMode) {
      new MagicCommentsPlugin({
        rules: [
          {
            test: remotes.map(([key]) => `${key}/`),
            comments: {
              webpackMode: asyncChunkMode,
            },
          },
        ],
      }).apply(compiler)
    }
  }
}

module.exports = ContainerReferencePlugin
