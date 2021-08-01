const { validate } = require('schema-utils')

const createSchemaValidation = (getSchema, options) => {
  return value => {
    validate(getSchema(), value, options)
  }
}

module.exports = createSchemaValidation
