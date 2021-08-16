const Template = require('webpack/lib/Template')

/** @typedef {import('webpack/lib/Compiler')} Compiler */

const PLUGIN_NAME = 'RuntimePlugin'

class RuntimePlugin {

  constructor(runtimeRequirements) {
    this.runtimeRequirements = runtimeRequirements
  }

  /**
   * Apply the plugin
   * @param {Compiler} compiler the compiler instance
   * @returns {void}
   */
  apply(compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
      for (const requirement of this.runtimeRequirements) {
        requirement.attach(compilation)
        compilation.mainTemplate.hooks.requireExtensions.tap(PLUGIN_NAME, (source, chunk, hash) => {
          return Template.asString([
            source,
            '',
            requirement.generate(),
          ])
        })
      }
    })
  }

}


module.exports = RuntimePlugin
