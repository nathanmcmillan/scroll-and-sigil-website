import {thingSetup, Thing} from '../thing/thing.js'
import {textureIndexForName, spritesByName} from '../assets/assets.js'

export class Medkit extends Thing {
  constructor(world, entity, x, z) {
    super(world, x, z)
    this.box = entity.box()
    this.height = entity.height()
    this.name = entity.name()
    this.group = entity.group()
    this.texture = textureIndexForName(entity.get('sprite'))
    this.sprite = spritesByName(entity.get('sprite')).get(entity.get('animation'))
    this.isPhysical = false
    this.isItem = true
    this.pickedUp = false
    thingSetup(this)
  }

  update() {
    return this.pickedUp
  }
}
