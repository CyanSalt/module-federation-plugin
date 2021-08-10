const ContainerEntryModule = require('./ContainerEntryModule')
const ModuleFactory = require('./webpack/ModuleFactory')

class ContainerEntryModuleFactory extends ModuleFactory {

  create({ dependencies: [dependency] }, callback) {
    const dep = dependency
    callback(null, new ContainerEntryModule(dep.name, dep.exposes, dep.shareScope))
  }

}

module.exports = ContainerEntryModuleFactory
