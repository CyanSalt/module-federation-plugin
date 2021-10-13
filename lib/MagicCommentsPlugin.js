const ModuleFilenameHelpers = require('webpack/lib/ModuleFilenameHelpers')

/** @typedef {import('webpack/lib/Compiler')} Compiler */

const types = ['javascript/auto', 'javascript/dynamic', 'javascript/esm']

const PLUGIN_NAME = 'MagicCommentsPlugin'

class MagicCommentsPlugin {

  constructor(options) {
    this._options = options
  }

  /**
   * Apply the plugin
   * @param {Compiler} compiler the compiler instance
   * @returns {void}
   */
  apply(compiler) {
    const { rules } = this._options

    compiler.hooks.normalModuleFactory.tap(PLUGIN_NAME, (nmf) => {
      for (const type of types) {
        nmf.hooks.parser.for(type).tap(PLUGIN_NAME, (parser, parserOptions) => {
          parser.hooks.importCall.tap(PLUGIN_NAME, expr => {
            if (expr.arguments.length === 1) {
              const param = parser.evaluateExpression(expr.arguments[0])
              if (param.isString()) {
                for (const rule of rules) {
                  if (ModuleFilenameHelpers.matchObject(rule, param.string)) {
                    const parseCommentOptions = parser.parseCommentOptions
                    parser.parseCommentOptions = function (...args) {
                      const { options, errors } = parseCommentOptions.apply(parser, args)
                      return {
                        options: { ...rule.comments, ...options },
                        errors,
                      }
                    }
                  }
                }
              }
            }
          })
        })
      }
    })
  }

}


module.exports = MagicCommentsPlugin
