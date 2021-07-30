const Dependency = require('webpack/lib/Dependency')

class ContainerEntryDependency extends Dependency {
  constructor(dependencies, name) {
    super()
    this.exposedDependencies = dependencies
    this.optional = true
    this.loc = { name }
  }
}

module.exports = ContainerEntryDependency
