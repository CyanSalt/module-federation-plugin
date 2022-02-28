const { ConcatSource } = require('webpack-sources')
const Template = require('webpack/lib/Template')
const ContainerEntryDependency = require('./ContainerEntryDependency')
const ContainerEntryModuleFactory = require('./ContainerEntryModuleFactory')
const ContainerExposedDependency = require('./ContainerExposedDependency')
const { parseOptions } = require('./options')
const createSchemaValidation = require('./webpack/util/create-schema-validation')
const propertyAccess = require('./webpack/util/property-access')

/** @typedef {import('webpack/lib/Compiler')} Compiler */

const validate = createSchemaValidation(
  () => require('../schemas/ContainerPlugin.json'),
  {
    name: 'Container Plugin',
    baseDataPath: 'options',
  },
)

const PLUGIN_NAME = 'ContainerPlugin'

class ContainerPlugin {

  constructor(options) {
    validate(options)
    this._options = options
    this._options.shareScope = options.shareScope || 'default'
    this._options.exposes = parseOptions(
      options.exposes,
      item => ({
        import: item,
        name: undefined,
      }),
      item => ({
        import: item.import,
        name: item.name || undefined,
      }),
    )
  }

  /**
   * Apply the plugin
   * @param {Compiler} compiler the compiler instance
   * @returns {void}
   */
  apply(compiler) {
    const { name, exposes, shareScope, filename, library } = this._options

    compiler.options.output.jsonpFunction = `${compiler.options.output.jsonpFunction}__${name}`

    compiler.hooks.make.tapAsync(PLUGIN_NAME, (compilation, callback) => {
      const dep = new ContainerEntryDependency(name, exposes, shareScope)
      dep.loc = { name }
      compilation.addEntry(
        compilation.context,
        dep,
        name,
        callback,
      )
    })

    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation, { normalModuleFactory }) => {
      compilation.dependencyFactories.set(
        ContainerEntryDependency,
        new ContainerEntryModuleFactory(),
      )

      compilation.dependencyFactories.set(
        ContainerExposedDependency,
        normalModuleFactory,
      )

      compilation.hooks.afterChunks.tap(PLUGIN_NAME, chunks => {
        for (const chunk of chunks) {
          if (chunk.name === name) {
            chunk.filenameTemplate = filename
          }
        }
      })

      compilation.hooks.optimizeChunkAssets.tap(PLUGIN_NAME, chunks => {

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
                  result = new ConcatSource(
                    `var ${libName} =`,
                    source,
                  )
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
                    `${library.type} is not a valid library type`,
                  )

              }

            }
            compilation.assets[file] = result

          }
        }
      })
    })
  }
}

module.exports = ContainerPlugin
