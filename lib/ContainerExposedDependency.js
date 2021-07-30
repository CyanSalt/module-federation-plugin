const ModuleDependency = require('webpack/lib/dependencies/ModuleDependency')

class ContainerExposedDependency extends ModuleDependency {
  constructor(name, request) {
    super(request)
    this._name = name
  }

  get exposedName() {
    return this._name
  }

  getResourceIdentifier() {
    return `exposed dependency ${this._name}`
  }
}

module.exports = ContainerExposedDependency
