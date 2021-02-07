import {thingSetup, Thing} from '../thing/thing.js'
import {textureIndexForName, spritesByName} from '../assets/assets.js'

export class Tree extends Thing {
  constructor(world, entity, x, z) {
    super(world, x, z)
    this.box = entity.box()
    this.height = entity.height()
    this.texture = textureIndexForName(entity.get('sprite'))
    this.sprite = spritesByName(entity.get('sprite')).get(entity.get('animation'))
    this.update = treeUpdate
    thingSetup(this)
  }
}

function treeUpdate() {
  return false
}

function treeInit(self, entity) {
  this.box = entity.box()
  this.height = entity.height()
  this.texture = textureIndexForName(entity.get('sprite'))
  this.sprite = spritesByName(entity.get('sprite')).get(entity.get('animation'))
  this.update = treeUpdate
  thingSetup(this)
}

export function newTree(world, entity, x, z) {
  let thing = world.newThing(x, 0.0, z)
  treeInit(thing, entity)
  return thing
}
