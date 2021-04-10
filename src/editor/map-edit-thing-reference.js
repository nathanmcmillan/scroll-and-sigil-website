import { triggerExport } from '../world/trigger.js'
import { flagsExport } from '../world/flags.js'

export class ThingReference {
  constructor(entity, x, z, flags, trigger) {
    this.x = x
    this.y = 0.0
    this.z = z
    this.entity = null
    this.flags = flags
    this.trigger = trigger
    this.setEntity(entity)
  }

  setEntity(entity) {
    this.entity = entity
    this.box = entity.box()
    this.height = entity.height()
    if (entity.has('sprite')) this.stamp = entity.stamp()
    else {
      const stamps = entity.stamps()
      if (Array.isArray(stamps)) this.stamp = stamps[0]
      else this.stamp = stamps.values().next().value[0]
    }
  }

  export() {
    let content = `${this.x} ${this.z} ${this.entity.id()}`
    if (this.flags) content += ` flags ${flagsExport(this.flags.join)} end`
    if (this.trigger) content += ` trigger ${triggerExport(this.trigger)} end`
    return content
  }
}
