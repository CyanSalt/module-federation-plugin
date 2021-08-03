/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/

/** @template T @typedef {(string | Record<string, string | string[] | T>)[] | Record<string, string | string[] | T>} ContainerOptionsFormat */

/**
 * @template T
 * @template N
 * @param {ContainerOptionsFormat<T>} options options passed by the user
 * @param {function(string | string[], string) : N} normalizeSimple normalize a simple item
 * @param {function(T, string) : N} normalizeOptions normalize a complex item
 * @param {function(string, N): void} fn processing function
 * @returns {void}
 */
const process = (options, normalizeSimple, normalizeOptions, fn) => {
  const object = obj => {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' || Array.isArray(value)) {
        fn(key, normalizeSimple(value, key))
      } else {
        fn(key, normalizeOptions(value, key))
      }
    }
  }
  const array = items => {
    for (const item of items) {
      if (typeof item === 'string') {
        fn(item, normalizeSimple(item, item))
      } else if (item && typeof item === 'object') {
        object(item)
      } else {
        throw new Error('Unexpected options format')
      }
    }
  }
  if (!options) {
    return
  } else if (Array.isArray(options)) {
    array(options)
  } else if (typeof options === 'object') {
    object(options)
  } else {
    throw new Error('Unexpected options format')
  }
}

/**
 * @template T
 * @template R
 * @param {ContainerOptionsFormat<T>} options options passed by the user
 * @param {function(string | string[], string) : R} normalizeSimple normalize a simple item
 * @param {function(T, string) : R} normalizeOptions normalize a complex item
 * @returns {[string, R][]} parsed options
 */
const parseOptions = (options, normalizeSimple, normalizeOptions) => {
  /** @type {[string, R][]} */
  const items = []
  process(options, normalizeSimple, normalizeOptions, (key, value) => {
    items.push([key, value])
  })
  return items
}

exports.parseOptions = parseOptions
