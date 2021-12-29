const ModuleDependency = require('webpack/lib/dependencies/ModuleDependency')

class ContainerExposedDependency extends ModuleDependency {

  constructor(exposedName, request) {
    super(request)
    this.exposedName = exposedName
  }

  get type() {
    return 'container exposed'
  }

  /**
   * @returns {string | null} an identifier to merge equal requests
   */
  getResourceIdentifier() {
    return `exposed dependency ${this.exposedName}=${this.request}`
  }

}

module.exports = ContainerExposedDependency
