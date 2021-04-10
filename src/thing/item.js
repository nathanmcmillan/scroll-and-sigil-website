import { Thing, thingSetup } from '../thing/thing.js'

export class Item extends Thing {
  constructor(world, entity, x, z) {
    super(world, entity, x, z)
    this.box = entity.box()
    this.height = entity.height()
    this.name = entity.name()
    this.group = entity.group()
    this.stamp = entity.stamp()
    this.isPhysical = false
    this.isItem = true
    this.pickedUp = false
    thingSetup(this)
  }

  update() {
    return this.pickedUp
  }
}
