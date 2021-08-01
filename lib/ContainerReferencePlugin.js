const RemoteModule = require('./RemoteModule')

/** @typedef {import('webpack/lib/Compiler')} Compiler */

const PLUGIN_NAME = 'ContainerReferencePlugin'

class ContainerReferencePlugin {

  constructor(options) {
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
