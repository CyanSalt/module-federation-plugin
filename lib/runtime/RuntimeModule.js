/** @typedef {import('webpack/lib/Compilation')} Compilation */

class RuntimeModule {

  constructor() {
    /** @type {Compilation} */
    this.compilation = undefined
  }

  /**
   * @param {Compilation} compilation the compilation
   */
  attach(compilation) {
    this.compilation = compilation
  }

  /**
   * @abstract
   * @returns {string} runtime code
   */
  generate() {
    const AbstractMethodError = require('webpack/lib/AbstractMethodError')
    throw new AbstractMethodError()
  }

}

module.exports = RuntimeModule
