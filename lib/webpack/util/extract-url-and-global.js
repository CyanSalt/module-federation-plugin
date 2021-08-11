/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Sam Chen @chenxsan
*/

/**
 * @param {string} urlAndGlobal the script request
 * @returns {string[]} script url and its global variable
 */
module.exports = function extractUrlAndGlobal(urlAndGlobal) {
  const index = urlAndGlobal.indexOf('@')
  return [urlAndGlobal.slice(Math.max(0, index + 1)), urlAndGlobal.slice(0, Math.max(0, index))]
}
