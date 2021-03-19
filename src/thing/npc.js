import { playSound } from '../assets/sounds.js'
import { cos, sin } from '../math/approximate.js'
import { redBloodExplode, redBloodTowards } from '../thing/thing-util.js'
import { Thing, thingFindSector, thingIntegrate, thingPushToCells, thingRemoveFromCells, thingSetup, thingUpdateAnimation, thingUpdateSprite } from '../thing/thing.js'
import { WORLD_CELL_SHIFT } from '../world/world.js'

const STATUS_STAND = 0
const STATUS_DEAD = 1
const STATUS_FINAL = 2

let tempSector = null
let tempFloor = 0.0
let tempCeiling = 0.0

export class NonPlayerCharacter extends Thing {
  constructor(world, entity, x, z) {
    super(world, x, z)
    this.box = entity.box()
    this.height = entity.height()
    this.name = entity.name()
    this.group = entity.group()
    this.health = entity.health()
    this.speed = entity.speed()
    this.animations = entity.stamps()
    this.animation = this.animations.get('idle')
    this.stamp = this.animation[0]
    this.target = null
    this.moveCount = 0
    this.status = STATUS_STAND
    this.reaction = 0
    this.interaction = entity.get('interaction')
    this.update = npcUpdate
    this.damage = npcDamage
    thingSetup(this)
  }
}

function npcDead(self) {
  if (self.animationFrame === self.animation.length - 1) {
    self.isPhysical = false
    self.status = STATUS_FINAL
    return
  }
  thingUpdateAnimation(self)
  thingUpdateSprite(self)
}

function npcDamage(source, health) {
  if (this.status === STATUS_DEAD || this.status === STATUS_FINAL) return
  this.health -= health
  if (this.health <= 0) {
    this.health = 0
    this.status = STATUS_DEAD
    this.animationFrame = 0
    this.animation = this.animations.get('death')
    thingUpdateSprite(this)
    playSound('baron-death')
    redBloodExplode(this)
  } else {
    playSound('baron-pain')
    redBloodTowards(this, source)
  }
}

function npcUpdate() {
  switch (this.status) {
    case STATUS_DEAD:
      npcDead(this)
      break
    case STATUS_FINAL:
      return false
  }
  thingIntegrate(this)
  return false
}

function thingTryOverlap(self, x, z, box, thing) {
  box += thing.box
  const overlap = Math.abs(x - thing.x) <= box && Math.abs(z - thing.z) <= box
  if (overlap) {
    const previous = Math.abs(self.x - thing.x) <= box && Math.abs(self.z - thing.z) <= box
    if (previous) return self.uid < thing.uid
    return true
  }
  return false
}

function thingTryLineOverlap(self, x, z, line) {
  if (!line.physical) {
    if (line.plus) {
      if (line.plus.floor > tempFloor) {
        tempSector = line.plus
        tempFloor = line.plus.floor
      }
      if (line.plus.ceiling < tempCeiling) tempCeiling = line.plus.ceiling
    }
    if (line.minus) {
      if (line.minus.floor > tempFloor) {
        tempSector = line.minus
        tempFloor = line.minus.floor
      }
      if (line.minus.ceiling < tempCeiling) tempCeiling = line.minus.ceiling
    }
    const step = 1.0
    const min = self.y + step
    const max = self.y + self.height
    if (line.plus && min > line.plus.floor && max < line.plus.ceiling) return false
    if (line.minus && min > line.minus.floor && max < line.minus.ceiling) return false
  }
  const box = self.box
  const vx = line.b.x - line.a.x
  const vz = line.b.y - line.a.y
  const wx = x - line.a.x
  const wz = z - line.a.y
  let t = (wx * vx + wz * vz) / (vx * vx + vz * vz)
  if (t < 0.0) t = 0.0
  else if (t > 1.0) t = 1.0
  const px = line.a.x + vx * t - x
  const pz = line.a.y + vz * t - z
  return px * px + pz * pz <= box * box
}

function thingTryMove(self, x, z) {
  tempSector = null
  tempFloor = -Number.MAX_VALUE
  tempCeiling = Number.MAX_VALUE
  const box = self.box
  const minC = Math.floor(x - box) >> WORLD_CELL_SHIFT
  const maxC = Math.floor(x + box) >> WORLD_CELL_SHIFT
  const minR = Math.floor(z - box) >> WORLD_CELL_SHIFT
  const maxR = Math.floor(z + box) >> WORLD_CELL_SHIFT
  const world = self.world
  const columns = world.columns
  if (minC < 0 || minR < 0 || maxC >= columns || maxR >= world.rows) return false
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      const cell = world.cells[c + r * columns]
      let i = cell.thingCount
      while (i--) {
        const thing = cell.things[i]
        if (self === thing) continue
        if (thingTryOverlap(self, x, z, box, thing)) return false
      }
      i = cell.lines.length
      while (i--) {
        if (thingTryLineOverlap(self, x, z, cell.lines[i])) return false
      }
    }
  }
  return true
}

export function thingMove(self) {
  const x = self.x + cos(self.rotation) * self.speed
  const z = self.z + sin(self.rotation) * self.speed
  if (thingTryMove(self, x, z)) {
    thingRemoveFromCells(self)
    self.previousX = self.x
    self.previousZ = self.z
    self.x = x
    self.z = z
    thingPushToCells(self)
    if (tempSector === null) {
      if (self.wasOnLine) thingFindSector(self)
    } else {
      self.sector = tempSector
      self.floor = tempFloor
      self.ceiling = tempCeiling
    }
    self.wasOnLine = tempSector !== null
    return true
  }
  return false
}
