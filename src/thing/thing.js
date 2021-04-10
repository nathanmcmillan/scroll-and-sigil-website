import { floatZero, lineIntersect } from '../math/vector.js'
import { cellPushThing, cellRemoveThing } from '../world/cell.js'
import { FLAG_LAVA } from '../world/flags.js'
import { TRIGGER_ENTER, TRIGGER_EXIT } from '../world/trigger.js'
import {
  ANIMATION_ALMOST_DONE,
  ANIMATION_DONE,
  ANIMATION_NOT_DONE,
  ANIMATION_RATE,
  GRAVITY,
  RESISTANCE,
  toCell,
  toFloatCell,
  worldEventTrigger,
  worldFindSector,
  worldPushThing,
  WORLD_CELL_SHIFT,
} from '../world/world.js'

let THING_UID = 0

const COLLIDED = []
const COLLISIONS = []

export class Thing {
  constructor(world, entity, x, z) {
    this.world = world
    this.entity = entity
    this.uid = THING_UID++
    this.sector = null
    this.floor = 0.0
    this.ceiling = 0.0
    this.x = this.previousX = x
    this.z = this.previousZ = z
    this.y = 0.0
    this.deltaX = 0.0
    this.deltaY = 0.0
    this.deltaZ = 0.0
    this.box = 0.0
    this.height = 0.0
    this.rotation = 0.0
    this.ground = false
    this.speed = 0.0
    this.health = 0.0
    this.minC = 0
    this.maxC = 0
    this.minR = 0
    this.maxR = 0
    this.stamp = null
    this.animation = null
    this.animations = null
    this.animationMod = 0
    this.animationFrame = 0
    this.isPhysical = true
    this.isItem = false
    this.wasOnLine = false
    this.name = null
    this.group = null
    this.interaction = null
    this.experience = 0
    this.damage = thingDamage
  }
}

function thingUpdateY(self) {
  if (self.y < self.floor) {
    self.ground = true
    self.deltaY = 0.0
    self.y = self.floor
  } else if (self.y > self.floor) {
    self.ground = false
    if (self.y + self.height > self.ceiling) {
      self.deltaY = 0.0
      self.y = self.ceiling - self.height
    }
  }
}

export function thingY(self) {
  if (self.ground === false || !floatZero(self.deltaY)) {
    self.deltaY -= GRAVITY
    self.y += self.deltaY
  }
  thingUpdateY(self)
}

export function thingSpecialSector(self) {
  const flags = self.sector.flags
  if (flags === null) return
  if (self.ground && (self.world.tick & 63) === 0) {
    const lava = flags.get(FLAG_LAVA)
    if (lava) self.damage(self, null, lava.values[1])
  }
}

function thingLineCollision(self, line) {
  const box = self.box
  const vx = line.b.x - line.a.x
  const vz = line.b.y - line.a.y
  const wx = self.x - line.a.x
  const wz = self.z - line.a.y
  let t = (wx * vx + wz * vz) / (vx * vx + vz * vz)
  let endpoint = false
  if (t < 0.0) {
    t = 0.0
    endpoint = true
  } else if (t > 1.0) {
    t = 1.0
    endpoint = true
  }
  const px = line.a.x + vx * t - self.x
  const pz = line.a.y + vz * t - self.z
  if (px * px + pz * pz > box * box) return false
  if (!line.physical) {
    const step = 1.0
    const min = self.y + step
    const max = self.y + self.height
    if (line.plus && min > line.plus.floor && max < line.plus.ceiling) return true
    if (line.minus && min > line.minus.floor && max < line.minus.ceiling) return true
  }
  if (endpoint) {
    let ex = -px
    let ez = -pz
    const em = Math.sqrt(ex * ex + ez * ez)
    ex /= em
    ez /= em
    const overlap = Math.sqrt((px + box * ex) * (px + box * ex) + (pz + box * ez) * (pz + box * ez))
    self.x += ex * overlap
    self.z += ez * overlap
  } else {
    let x = line.normal.x
    let z = line.normal.y
    if (vx * wz - vz * wx < 0.0) {
      x = -x
      z = -z
    }
    const overlap = Math.sqrt((px + box * x) * (px + box * x) + (pz + box * z) * (pz + box * z))
    self.x += x * overlap
    self.z += z * overlap
  }
  return false
}

function thingLineFloorAndCeiling(self, line) {
  const box = self.box
  const vx = line.b.x - line.a.x
  const vz = line.b.y - line.a.y
  const wx = self.x - line.a.x
  const wz = self.z - line.a.y
  let t = (wx * vx + wz * vz) / (vx * vx + vz * vz)
  if (t < 0.0) t = 0.0
  else if (t > 1.0) t = 1.0
  const px = line.a.x + vx * t - self.x
  const pz = line.a.y + vz * t - self.z
  if (px * px + pz * pz > box * box) return false
  const old = self.sector
  let sector = old
  if (line.plus) {
    if (line.plus.floor > self.floor) {
      sector = line.plus
      self.floor = line.plus.floor
    }
    if (line.plus.ceiling < self.ceiling) self.ceiling = line.plus.ceiling
  }
  if (line.minus) {
    if (line.minus.floor > self.floor) {
      sector = line.minus
      self.floor = line.minus.floor
    }
    if (line.minus.ceiling < self.ceiling) self.ceiling = line.minus.ceiling
  }
  if (sector !== old) {
    self.sector = sector
    if (old && old.trigger) worldEventTrigger(self.world, TRIGGER_EXIT, old.trigger, self)
    if (sector.trigger) worldEventTrigger(self.world, TRIGGER_ENTER, sector.trigger, self)
  }
  return true
}

export function thingFindSectorFromLine(self) {
  self.floor = -Number.MAX_VALUE
  self.ceiling = Number.MAX_VALUE
  const cells = self.world.cells
  const columns = self.world.columns
  let on = false
  for (let r = self.minR; r <= self.maxR; r++) {
    for (let c = self.minC; c <= self.maxC; c++) {
      const cell = cells[c + r * columns]
      let i = cell.lines.length
      while (i--) {
        on = thingLineFloorAndCeiling(self, cell.lines[i]) || on
      }
    }
  }
  return on
}

export function thingFindSector(self) {
  const old = self.sector
  let sector = old
  if (sector === null) sector = worldFindSector(self.world, self.x, self.z)
  else sector = sector.searchFor(self.x, self.z)
  if (sector !== old) {
    self.sector = sector
    if (old && old.trigger) worldEventTrigger(self.world, TRIGGER_EXIT, old.trigger, self)
    if (sector.trigger) worldEventTrigger(self.world, TRIGGER_ENTER, sector.trigger, self)
  }
  self.floor = sector.floor
  self.ceiling = sector.ceiling
}

export function thingUpdateAnimation(self) {
  self.animationMod++
  if (self.animationMod === ANIMATION_RATE) {
    self.animationMod = 0
    self.animationFrame++
    const frames = self.animation.length
    if (self.animationFrame === frames - 1) return ANIMATION_ALMOST_DONE
    else if (self.animationFrame === frames) return ANIMATION_DONE
  }
  return ANIMATION_NOT_DONE
}

export function thingUpdateSprite(self) {
  self.stamp = self.animation[self.animationFrame]
}

export function thingSetAnimation(self, name) {
  self.animationMod = 0
  self.animationFrame = 0
  self.animation = self.animations.get(name)
  thingUpdateSprite(self)
}

export function thingCheckSight(self, thing) {
  const xf = toFloatCell(self.x)
  const yf = toFloatCell(self.z)
  const dx = Math.abs(toFloatCell(thing.x) - xf)
  const dy = Math.abs(toFloatCell(thing.z) - yf)
  let x = toCell(self.x)
  let y = toCell(self.z)
  const xb = toCell(thing.x)
  const yb = toCell(thing.z)
  let n = 1
  let error = 0.0
  let incrementX = 0
  let incrementY = 0
  if (floatZero(dx)) {
    incrementX = 0
    error = Number.MAX_VALUE
  } else if (thing.x > self.x) {
    incrementX = 1
    n += xb - x
    error = (x + 1.0 - xf) * dy
  } else {
    incrementX = -1
    n += x - xb
    error = (xf - x) * dy
  }
  if (floatZero(dy)) {
    incrementY = 0
    error = -Number.MAX_VALUE
  } else if (thing.z > self.z) {
    incrementY = 1
    n += yb - y
    error -= (y + 1.0 - yf) * dx
  } else {
    incrementY = -1
    n += y - yb
    error -= (yf - y) * dx
  }
  const cells = self.world.cells
  const columns = self.world.columns
  for (; n > 0; n--) {
    const cell = cells[x + y * columns]
    let i = cell.lines.length
    while (i--) {
      const line = cell.lines[i]
      if (line.physical && lineIntersect(self.x, self.z, thing.x, thing.z, line.a.x, line.a.y, line.b.x, line.b.y)) return false
    }
    if (error > 0.0) {
      y += incrementY
      error -= dx
    } else {
      x += incrementX
      error += dy
    }
  }
  return true
}

export function thingApproximateDistance(self, thing) {
  const dx = Math.abs(self.x - thing.x)
  const dz = Math.abs(self.z - thing.z)
  if (dx > dz) return dx + dz - dz * 0.5
  return dx + dz - dx * 0.5
}

function thingCollision(self, thing) {
  const box = self.box + thing.box
  return Math.abs(self.x - thing.x) <= box && Math.abs(self.z - thing.z) <= box
}

export function thingSetup(self) {
  thingPushToCells(self)
  if (!thingFindSectorFromLine(self)) thingFindSector(self)
  thingUpdateY(self)
  worldPushThing(self.world, self)
}

export function thingSet(self, x, z) {
  self.x = self.previousX = x
  self.z = self.previousZ = z
  self.deltaX = 0.0
  self.deltaY = 0.0
  self.deltaZ = 0.0
  thingPushToCells(self)
  self.sector = null
  if (!thingFindSectorFromLine(self)) thingFindSector(self)
  self.ground = true
  self.y = self.floor
  worldPushThing(self.world, self)
}

export function thingTeleport(self, x, z) {
  thingRemoveFromCells(self)
  self.x = self.previousX = x
  self.z = self.previousZ = z
  thingPushToCells(self)
  if (!thingFindSectorFromLine(self)) thingFindSector(self)
  thingUpdateY(self)
}

export function thingPushToCells(self) {
  const box = self.box
  let minC = Math.floor(self.x - box) >> WORLD_CELL_SHIFT
  let maxC = Math.floor(self.x + box) >> WORLD_CELL_SHIFT
  let minR = Math.floor(self.z - box) >> WORLD_CELL_SHIFT
  let maxR = Math.floor(self.z + box) >> WORLD_CELL_SHIFT
  const world = self.world
  const columns = world.columns
  if (minC < 0) minC = 0
  if (minR < 0) minR = 0
  if (maxC >= columns) maxC = columns - 1
  if (maxR >= world.rows) maxR = world.rows - 1
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      cellPushThing(world.cells[c + r * columns], self)
    }
  }
  self.minC = minC
  self.maxC = maxC
  self.minR = minR
  self.maxR = maxR
}

export function thingRemoveFromCells(self) {
  const cells = self.world.cells
  const columns = self.world.columns
  for (let r = self.minR; r <= self.maxR; r++) {
    for (let c = self.minC; c <= self.maxC; c++) {
      cellRemoveThing(cells[c + r * columns], self)
    }
  }
}

function thingDamage() {}

function thingResolveCollision(self, thing) {
  const box = self.box + thing.box
  if (Math.abs(self.x - thing.x) > box || Math.abs(self.z - thing.z) > box) return
  if (Math.abs(self.previousX - thing.x) > Math.abs(self.previousZ - thing.z)) {
    if (self.previousX - thing.x < 0.0) {
      self.x = thing.x - box
    } else {
      self.x = thing.x + box
    }
    self.deltaX = 0.0
  } else {
    if (self.previousZ - thing.z < 0.0) {
      self.z = thing.z - box
    } else {
      self.z = thing.z + box
    }
    self.deltaZ = 0.0
  }
}

export function thingIntegrate(self) {
  if (self.ground) {
    self.deltaX *= RESISTANCE
    self.deltaZ *= RESISTANCE
  }

  if (!floatZero(self.deltaX) || !floatZero(self.deltaZ)) {
    self.previousX = self.x
    self.previousZ = self.z

    self.x += self.deltaX
    self.z += self.deltaZ

    thingRemoveFromCells(self)

    const box = self.box
    let minC = Math.floor(self.x - box) >> WORLD_CELL_SHIFT
    let maxC = Math.floor(self.x + box) >> WORLD_CELL_SHIFT
    let minR = Math.floor(self.z - box) >> WORLD_CELL_SHIFT
    let maxR = Math.floor(self.z + box) >> WORLD_CELL_SHIFT
    const world = self.world
    const columns = world.columns
    if (minC < 0) minC = 0
    if (minR < 0) minR = 0
    if (maxC >= columns) maxC = columns - 1
    if (maxR >= world.rows) maxR = world.rows - 1

    COLLIDED.length = 0
    COLLISIONS.length = 0

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const cell = world.cells[c + r * columns]
        let i = cell.thingCount
        while (i--) {
          const thing = cell.things[i]
          if (!thing.isPhysical || COLLISIONS.includes(thing)) continue
          COLLISIONS.push(thing)
          if (thingCollision(self, thing)) COLLIDED.push(thing)
        }
      }
    }

    while (COLLIDED.length > 0) {
      let closest = null
      let manhattan = Number.MAX_VALUE
      for (let c = 0; c < COLLIDED.length; c++) {
        const thing = COLLIDED[c]
        const distance = Math.abs(self.previousX - thing.x) + Math.abs(self.previousZ - thing.z)
        if (distance < manhattan) {
          manhattan = distance
          closest = thing
        }
      }
      thingResolveCollision(self, closest)
      COLLIDED.splice(COLLIDED.indexOf(closest), 1)
    }

    let on = false
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const cell = world.cells[c + r * world.columns]
        let i = cell.lines.length
        while (i--) {
          on = thingLineCollision(self, cell.lines[i]) || on
        }
      }
    }
    if (on) on = thingFindSectorFromLine(self)
    if (!on && self.wasOnLine) thingFindSector(self)
    self.wasOnLine = on

    thingPushToCells(self)
  }

  thingY(self)
  thingSpecialSector(self)
}
