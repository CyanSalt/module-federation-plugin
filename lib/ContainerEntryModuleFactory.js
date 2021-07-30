const ContainerEntryModule = require('./ContainerEntryModule')
const ModuleFactory = require('./webpack/ModuleFactory')

class ContainerEntryModuleFactory extends ModuleFactory {
  create({ dependencies: [dependency] }, callback) {
    callback(null, new ContainerEntryModule(dependency))
  }
}

module.exports = ContainerEntryModuleFactory
