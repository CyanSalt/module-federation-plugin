const ContainerPlugin = require('./ContainerPlugin')
const ContainerReferencePlugin = require('./ContainerReferencePlugin')
const createSchemaValidation = require('./webpack/util/create-schema-validation')

/** @typedef {import('webpack/lib/Compiler')} Compiler */

const validate = createSchemaValidation(
  () => require('../schemas/ModuleFederationPlugin.json'),
  {
    name: 'Module Federation Plugin',
    baseDataPath: 'options',
  },
)

const PLUGIN_NAME = 'ModuleFederationPlugin'

class ModuleFederationPlugin {

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
    const { _options: options } = this
    const library = {
      type: options.library && options.library.type || 'var',
      name: options.library && options.library.name || options.name,
    }
    const filename = options.filename
    const remoteType = options.library && options.library.type || 'script'

    compiler.hooks.afterPlugins.tap(PLUGIN_NAME, () => {
      if (options.exposes && Object.keys(options.exposes).length > 0) {
        new ContainerPlugin({
          name: options.name,
          library,
          filename,
          exposes: options.exposes,
        }).apply(compiler)
      }
      if (options.remotes && Object.keys(options.remotes).length > 0) {
        new ContainerReferencePlugin({
          remoteType,
          remotes: options.remotes,
          additionalFeatures: options.additionalFeatures,
        }).apply(compiler)
      }
    })

  }

}


module.exports = ModuleFederationPlugin
