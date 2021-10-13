const Template = require('webpack/lib/Template')
const { basicFunction, returningFunction } = require('../runtime-template')
const RuntimeGlobals = require('../webpack/RuntimeGlobals')
const RuntimeModule = require('./RuntimeModule')

class LoadScriptRuntimeModule extends RuntimeModule {

  /**
   * Apply the plugin
   * @param {Compiler} compiler the compiler instance
   * @returns {void}
   */
  generate() {
    const { compilation } = this
    const {
      jsonpScriptType,
      chunkLoadTimeout,
      crossOriginLoading,
    } = compilation.mainTemplate.outputOptions
    return Template.asString([
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
            `script.setAttribute("nonce", ${RuntimeGlobals.scriptNonce});`,
          ),
          '}',
          `script.src = url;`,
          crossOriginLoading
            ? Template.asString([
              'if (script.src.indexOf(window.location.origin + \'/\') !== 0) {',
              Template.indent(
                `script.crossOrigin = ${JSON.stringify(crossOriginLoading)};`,
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
              `doneFns && doneFns.forEach(${returningFunction('fn(event)', 'fn')});`,
              'if (prev) return prev(event);',
            ]),
          ),
        ';',
        `var timeout = setTimeout(onScriptComplete.bind(null, undefined, { type: 'timeout', target: script }), ${chunkLoadTimeout});`,
        'script.onerror = onScriptComplete.bind(null, script.onerror);',
        'script.onload = onScriptComplete.bind(null, script.onload);',
        'needAttach && document.head.appendChild(script);',
      ])}`,
    ])
  }

}


module.exports = LoadScriptRuntimeModule
