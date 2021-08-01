const { ConcatSource } = require('webpack-sources')
const Template = require('webpack/lib/Template')
const ContainerEntryDependency = require('./ContainerEntryDependency')
const ContainerEntryModuleFactory = require('./ContainerEntryModuleFactory')
const ContainerExposedDependency = require('./ContainerExposedDependency')
const createSchemaValidation = require('./webpack/util/create-schema-validation')
const propertyAccess = require('./webpack/util/propertyAccess')

/** @typedef {import('webpack/lib/Compiler')} Compiler */

const validate = createSchemaValidation(
  () => require('../schemas/ContainerPlugin.json'),
  {
    name: 'Container Plugin',
    baseDataPath: 'options',
  }
)

const PLUGIN_NAME = 'ContainerPlugin'

class ContainerPlugin {

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
    const { name, exposes, filename, library } = this._options

    compiler.hooks.make.tapAsync(PLUGIN_NAME, (compilation, callback) => {
      const deps = Object.entries(exposes).map(([exposedName, request], index) => {
        const dep = new ContainerExposedDependency(exposedName, request)
        dep.loc = {
          name: exposedName,
          index,
        }
        return dep
      })

      compilation.addEntry(
        compilation.context,
        new ContainerEntryDependency(
          deps,
          name,
        ),
        name,
        callback,
      )

    })

    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation, { normalModuleFactory }) => {
      compilation.dependencyFactories.set(
        ContainerEntryDependency,
        new ContainerEntryModuleFactory()
      )

      compilation.dependencyFactories.set(
        ContainerExposedDependency,
        normalModuleFactory
      )

      compilation.hooks.afterOptimizeChunkAssets.tap(PLUGIN_NAME, chunks => {

        for (const chunk of chunks) {
          if (!chunk.rendered) {
            // Skip already rendered (cached) chunks
            // to avoid rebuilding unchanged code.
            continue
          }

          for (const file of chunk.files) {
            const source = compilation.assets[file]

            let result = source

            if (chunk.name === name) {
              const libName = Template.toIdentifier(
                compilation.getPath(library.name, {
                  chunk,
                }),
              )

              switch (library.type) {
                case 'var':
                  result = new ConcatSource(`var ${libName} =`, source)
                  break
                case 'this':
                case 'window':
                case 'self':
                  result = new ConcatSource(
                    `${library.type}${propertyAccess([libName])} =`,
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
                case 'commonjs2':
                  result = new ConcatSource(
                    `exports${propertyAccess([libName])} =`,
                    source,
                  )
                  break
                default:
                  throw new Error(
                    `${library.type} is not a valid Library target`,
                  )

              }

            }
            compilation.assets[file] = result

          }
        }
      })


      compilation.hooks.afterChunks.tap(PLUGIN_NAME, chunks => {
        for (const chunk of chunks) {
          if (chunk.name === name) {
            chunk.filenameTemplate = filename
          }
        }
      })
    })
  }
}

module.exports = ContainerPlugin