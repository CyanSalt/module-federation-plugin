const MagicCommentsPlugin = require('./MagicCommentsPlugin')
const RemoteModule = require('./RemoteModule')
const createSchemaValidation = require('./webpack/util/create-schema-validation')

/** @typedef {import('webpack/lib/Compiler')} Compiler */

const validate = createSchemaValidation(
  () => require('../schemas/ContainerReferencePlugin.json'),
  {
    name: 'Container Reference Plugin',
    baseDataPath: 'options',
  }
)

const slashCode = '/'.charCodeAt(0)

const PLUGIN_NAME = 'ContainerReferencePlugin'

class ContainerReferencePlugin {

  constructor(options) {
    validate(options)
    this._options = options
  }

  /**
   * Apply the plugin
   * @param {Compiler} compiler the compiler instance
   * @returns {void}
   */
  apply(compiler) {
    const { remotes, remoteType, asyncChunkMode } = this._options

    compiler.hooks.normalModuleFactory.tap(PLUGIN_NAME, (nmf) => {

      nmf.hooks.factory.tap(PLUGIN_NAME, (fn) => {
        return (data, callback) => {
          for (const [key, external] of Object.entries(remotes)) {
            if (data.request.startsWith(key)
              && data.request.charCodeAt(key.length) === slashCode
            ) {
              callback(
                null,
                new RemoteModule(
                  data.request,
                  external,
                  data.request.slice(key.length + 1),
                  remoteType
                )
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
            test: Object.keys(remotes).map(key => `${key}/`),
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
