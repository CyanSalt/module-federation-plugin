const Template = require('webpack/lib/Template')
const RuntimeGlobals = require('./webpack/RuntimeGlobals')

/** @typedef {import('webpack/lib/Compiler')} Compiler */

const PLUGIN_NAME = 'MainTemplateLoadScriptPlugin'

const basicFunction = (args, body) => {
  return `function (${args}) {\n${Template.indent(body)}\n}`
}

class MainTemplateLoadScriptPlugin {

  constructor(options) {
    this._options = options
  }

  /**
   * Apply the plugin
   * @param {Compiler} compiler the compiler instance
   * @returns {void}
   */
  apply(compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
      const mainTemplate = compilation.mainTemplate
      const {
        jsonpScriptType,
        chunkLoadTimeout,
        crossOriginLoading,
      } = mainTemplate.outputOptions
      mainTemplate.hooks.requireExtensions.tap(PLUGIN_NAME, (source, chunk, hash) => {
        return Template.asString([
          source,
          '',
          '// The script loading function',
          'var inProgress = {};',
          `${RuntimeGlobals.loadScript} = ${basicFunction('url, done, key, chunkId', [
            'if (inProgress[url]) { inProgress[url].push(done); return; }',
            'var script, needAttach;',
            'if (key !== undefined) {',
            Template.indent([
              'var scripts = document.getElementsByTagName("script");',
              'for (var i = 0; i < scripts.length; i++) {',
              Template.indent([
                'var s = scripts[i];',
                `if (s.getAttribute("src") == url) { script = s; break; }`,
              ]),
              '}',
            ]),
            '}',
            'if (!script) {',
            Template.indent([
              'needAttach = true;',
              'script = document.createElement(\'script\');',
              jsonpScriptType ? `script.type = ${JSON.stringify(jsonpScriptType)};` : '',
              `script.charset = 'utf-8';`,
              `script.timeout = ${chunkLoadTimeout / 1000};`,
              `if (${RuntimeGlobals.scriptNonce}) {`,
              Template.indent(
                `script.setAttribute("nonce", ${RuntimeGlobals.scriptNonce});`
              ),
              '}',
              `script.src = url;`,
              crossOriginLoading
                ? Template.asString([
                  'if (script.src.indexOf(window.location.origin + \'/\') !== 0) {',
                  Template.indent(
                    `script.crossOrigin = ${JSON.stringify(crossOriginLoading)};`
                  ),
                  '}',
                ])
                : '',
            ]),
            '}',
            'inProgress[url] = [done];',
            'var onScriptComplete = '
              + basicFunction(
                'prev, event',
                Template.asString([
                  '// avoid mem leaks in IE.',
                  'script.onerror = script.onload = null;',
                  'clearTimeout(timeout);',
                  'var doneFns = inProgress[url];',
                  'delete inProgress[url];',
                  'script.parentNode && script.parentNode.removeChild(script);',
                  `doneFns && doneFns.forEach(${basicFunction('fn', 'return fn(event);')});`,
                  'if (prev) return prev(event);',
                ])
              ),
            ';',
            `var timeout = setTimeout(onScriptComplete.bind(null, undefined, { type: 'timeout', target: script }), ${chunkLoadTimeout});`,
            'script.onerror = onScriptComplete.bind(null, script.onerror);',
            'script.onload = onScriptComplete.bind(null, script.onload);',
            'needAttach && document.head.appendChild(script);',
          ])}`,
        ])
      })
    })
  }

}


module.exports = MainTemplateLoadScriptPlugin
