const Dependency = require('webpack/lib/Dependency')

class ContainerEntryDependency extends Dependency {

  constructor(name, exposes, shareScope) {
    super()
    this.name = name
    this.exposes = exposes
    this.optional = true
    this.shareScope = shareScope
  }

  get type() {
    return 'container entry'
  }

  /**
   * @returns {string | null} an identifier to merge equal requests
   */
  getResourceIdentifier() {
    return `container-entry-${this.name}`
  }

}

module.exports = ContainerEntryDependency
