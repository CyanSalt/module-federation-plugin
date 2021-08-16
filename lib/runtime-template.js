const Template = require('webpack/lib/Template')

const basicFunction = (args, body) => {
  return `function (${args}) {\n${Template.indent(body)}\n}`
}

const returningFunction = (returnValue, args = '') => {
  return basicFunction(args, `return ${returnValue};`)
}

module.exports = {
  basicFunction,
  returningFunction,
}
