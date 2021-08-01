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
    const { remotes, remoteType } = this._options


    compiler.hooks.normalModuleFactory.tap(PLUGIN_NAME, (nmf) => {
      nmf.hooks.factory.tap(PLUGIN_NAME, (fn) => {
        return (result, callback) => {
          const requestScope = result.request.split('/')[0]

          const libraryName = remotes[requestScope]
          if (libraryName) {
            const request = result.request.split(`${requestScope}/`)[1]
            callback(
              null,
              new RemoteModule(
                libraryName,
                request,
                remoteType,
                result.request,
              ),
            )
            return
          }
          fn(result, callback)
        }
      })

    })
  }
}

module.exports = ContainerReferencePlugin
