const { ConcatSource } = require('webpack-sources')
const Template = require('webpack/lib/Template')
const ContainerEntryDependency = require('./ContainerEntryDependency')
const ContainerEntryModuleFactory = require('./ContainerEntryModuleFactory')
const ContainerExposedDependency = require('./ContainerExposedDependency')
const RemoteModule = require('./RemoteModule')
const propertyAccess = require('./utils/property-access')

const globalType = 'global'

class ModuleFederationPlugin {

  constructor(options) {
    this.options = options
  }

  apply(compiler) {
    const pluginName = this.constructor.name
    const options = this.options

    if (compiler.options.optimization.runtimeChunk) {
      throw new Error(
        'This plugin cannot integrate with RuntimeChunk plugin, please remove `optimization.runtimeChunk`.',
      )
    }

    compiler.options.output.jsonpFunction = `${
      compiler.options.output.jsonpFunction
    }${compiler.name || ''}${options.name}`

    if (options.exposes) {

      compiler.hooks.make.tapAsync(pluginName, (compilation, callback) => {

        const deps = Object.entries(options.exposes).map(([name, request], index) => {
          const dep = new ContainerExposedDependency(name, request)
          dep.loc = {
            name,
            index,
          }
          return dep
        })

        compilation.addEntry(
          compilation.context,
          new ContainerEntryDependency(
            deps,
            options.name,
          ),
          options.name,
          callback,
        )

      })

    }

    if (options.remotes) {

      const handleRemote = (value, type, callback) => {
        let externalConfig = value

        callback(
          null,
          new RemoteModule(
            externalConfig,
            type || globalType,
            value,
            this.options.remotes,
          ),
        )
      }


      compiler.hooks.normalModuleFactory.tap(pluginName, (nmf) => {
        nmf.hooks.factory.tap(pluginName, (fn) => {
          return (result, callback) => {
            const requestScope = result.request.split('/')[0]

            if (this.options.remotes[requestScope]) {
              handleRemote(result.request, null, callback)
              return
            }
            fn(result, (error, mod) => {

              callback(error, mod)
            })
          }
        })

      })

    }


    compiler.hooks.thisCompilation.tap(
      pluginName,
      (compilation, { normalModuleFactory }) => {
        compilation.dependencyFactories.set(
          ContainerEntryDependency,
          new ContainerEntryModuleFactory(),
        )

        compilation.dependencyFactories.set(
          ContainerExposedDependency,
          normalModuleFactory,
        )

        compilation.hooks.afterOptimizeChunkAssets.tap(
          pluginName,
          (chunks) => {

            for (let chunk of chunks) {
              if (!chunk.rendered) {
                // Skip already rendered (cached) chunks
                // to avoid rebuilding unchanged code.
                continue
              }

              for (const fileName of chunk.files) {
                const source = compilation.assets[fileName]

                let result = source

                if (chunk.name === this.options.name) {
                  const libName = Template.toIdentifier(
                    compilation.getPath(this.options.library.name, {
                      chunk,
                    }),
                  )

                  switch (this.options.library.type) {
                    case 'var': {
                      result = new ConcatSource(`var ${libName} =`, source)
                      break
                    }
                    case 'this':
                    case 'window':
                    case 'self':
                      result = new ConcatSource(
                        `${this.options.library.type}${propertyAccess([libName])} =`,
                        source,
                      )
                      break
                    case 'global':
                      result = new ConcatSource(
                        `${compiler.options.output.globalObject}${propertyAccess([
                          libName,
                        ])} =`,
                        source,
                      )
                      break
                    case 'commonjs':
                    case 'commonjs2': {
                      result = new ConcatSource(
                        `exports${propertyAccess([libName])} =`,
                        source,
                      )
                      break

                    }
                    case 'amd':
                    case 'amd-require':
                    case 'umd':
                    case 'umd2':
                    case 'system':
                    default:
                      throw new Error(
                        `${this.options.library.type} is not a valid Library target`,
                      )

                  }

                }
                compilation.assets[fileName] = result

              }
            }
          }
        )


        compilation.hooks.afterChunks.tap(pluginName, chunks => {
          for (const chunk of chunks) {
            if (chunk.name === this.options.name) {
              chunk.filenameTemplate = this.options.filename
            }
          }
        })
      },
    )
  }

}

module.exports = ModuleFederationPlugin
