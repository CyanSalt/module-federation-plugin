/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/

'use strict'

/** @typedef {import('webpack/lib/Dependency')} Dependency */
/** @typedef {import('webpack/lib/Module')} Module */

/**
 * @typedef {Object} ModuleFactoryResult
 * @property {Module=} module the created module or unset if no module was created
 * @property {Set<string>=} fileDependencies
 * @property {Set<string>=} contextDependencies
 * @property {Set<string>=} missingDependencies
 */

/**
 * @typedef {Object} ModuleFactoryCreateDataContextInfo
 * @property {string} issuer
 * @property {string} compiler
 */

/**
 * @typedef {Object} ModuleFactoryCreateData
 * @property {ModuleFactoryCreateDataContextInfo} contextInfo
 * @property {any=} resolveOptions
 * @property {string} context
 * @property {Dependency[]} dependencies
 */

class ModuleFactory {
  /**
   * @abstract
   * @param {ModuleFactoryCreateData} data data object
   * @param {function(Error=, ModuleFactoryResult=): void} callback callback
   * @returns {void}
   */
  create(data, callback) {
    const AbstractMethodError = require('webpack/lib/AbstractMethodError')
    throw new AbstractMethodError()
  }
}

module.exports = ModuleFactory
