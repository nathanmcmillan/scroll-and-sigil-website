import {lineIntersect, Float} from '/src/math/vector.js'
import {toCell, toFloatCell, WORLD_CELL_SHIFT, GRAVITY, RESISTANCE, ANIMATION_RATE, ANIMATION_NOT_DONE, ANIMATION_ALMOST_DONE, ANIMATION_DONE} from '/src/world/world.js'

let collided = new Set()
let collisions = new Set()

export class Thing {
  constructor(world, x, z) {
    this.world = world
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
    this.texture = 0
    this.sprite = null
    this.minC = 0
    this.maxC = 0
    this.minR = 0
    this.maxR = 0
    this.animationMod = 0
    this.animationFrame = 0
    this.animation = null
    this.isPhysical = true
    this.isItem = false
    this.wasOnLine = false
    this.name = null
    this.group = null
    this.interaction = null
    this.experience = 1
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
  if (self.ground === false || !Float.zero(self.deltaY)) {
    self.deltaY -= GRAVITY
    self.y += self.deltaY
  }
  thingUpdateY(self)
}

function thingLineCollision(self, line) {
  let box = self.box
  let vx = line.b.x - line.a.x
  let vz = line.b.y - line.a.y
  let wx = self.x - line.a.x
  let wz = self.z - line.a.y
  let t = (wx * vx + wz * vz) / (vx * vx + vz * vz)
  let endpoint = false
  if (t < 0.0) {
    t = 0.0
    endpoint = true
  } else if (t > 1.0) {
    t = 1.0
    endpoint = true
  }
  let px = line.a.x + vx * t - self.x
  let pz = line.a.y + vz * t - self.z
  if (px * px + pz * pz > box * box) return false
  if (!line.physical) {
    const step = 1.0
    let min = self.y + step
    let max = self.y + self.height
    if (line.plus && min > line.plus.floor && max < line.plus.ceiling) return true
    if (line.minus && min > line.minus.floor && max < line.minus.ceiling) return true
  }
  if (endpoint) {
    let ex = -px
    let ez = -pz
    let em = Math.sqrt(ex * ex + ez * ez)
    ex /= em
    ez /= em
    let overlap = Math.sqrt((px + box * ex) * (px + box * ex) + (pz + box * ez) * (pz + box * ez))
    self.x += ex * overlap
    self.z += ez * overlap
  } else {
    let x = line.normal.x
    let z = line.normal.y
    if (vx * wz - vz * wx < 0.0) {
      x = -x
      z = -z
    }
    let overlap = Math.sqrt((px + box * x) * (px + box * x) + (pz + box * z) * (pz + box * z))
    self.x += x * overlap
    self.z += z * overlap
  }
  return false
}

function thingLineFloorAndCeiling(self, line) {
  let box = self.box
  let vx = line.b.x - line.a.x
  let vz = line.b.y - line.a.y
  let wx = self.x - line.a.x
  let wz = self.z - line.a.y
  let t = (wx * vx + wz * vz) / (vx * vx + vz * vz)
  if (t < 0.0) t = 0.0
  else if (t > 1.0) t = 1.0
  let px = line.a.x + vx * t - self.x
  let pz = line.a.y + vz * t - self.z
  if (px * px + pz * pz > box * box) return false
  if (line.plus) {
    if (line.plus.floor > self.floor) {
      self.sector = line.plus
      self.floor = line.plus.floor
    }
    if (line.plus.ceiling < self.ceiling) self.ceiling = line.plus.ceiling
  }
  if (line.minus) {
    if (line.minus.floor > self.floor) {
      self.sector = line.minus
      self.floor = line.minus.floor
    }
    if (line.minus.ceiling < self.ceiling) self.ceiling = line.minus.ceiling
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
      let cell = cells[c + r * columns]
      let i = cell.lines.length
      while (i--) {
        on = thingLineFloorAndCeiling(self, cell.lines[i]) || on
      }
    }
  }
  return on
}

export function thingFindSector(self) {
  let sector = self.sector
  if (sector === null) sector = self.world.findSector(self.x, self.z)
  else sector = sector.searchFor(self.x, self.z)
  self.sector = sector
  self.floor = sector.floor
  self.ceiling = sector.ceiling
}

export function thingUpdateAnimation(self) {
  self.animationMod++
  if (self.animationMod === ANIMATION_RATE) {
    self.animationMod = 0
    self.animationFrame++
    let frames = self.animation.length
    if (self.animationFrame === frames - 1) return ANIMATION_ALMOST_DONE
    else if (self.animationFrame === frames) return ANIMATION_DONE
  }
  return ANIMATION_NOT_DONE
}

export function thingUpdateSprite(self) {
  self.sprite = self.animation[self.animationFrame]
}

export function thingSetAnimation(self, name) {
  self.animationMod = 0
  self.animationFrame = 0
  self.animation = self.animations.get(name)
  thingUpdateSprite(self)
}

export function thingCheckSight(self, thing) {
  let xf = toFloatCell(self.x)
  let yf = toFloatCell(self.z)
  let dx = Math.abs(toFloatCell(thing.x) - xf)
  let dy = Math.abs(toFloatCell(thing.z) - yf)
  let x = toCell(self.x)
  let y = toCell(self.z)
  let xb = toCell(thing.x)
  let yb = toCell(thing.z)
  let n = 1
  let error = 0.0
  let incrementX = 0
  let incrementY = 0
  if (Float.zero(dx)) {
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
  if (Float.zero(dy)) {
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
  let cells = self.world.cells
  let columns = self.world.columns
  for (; n > 0; n--) {
    let cell = cells[x + y * columns]
    let i = cell.lines.length
    while (i--) {
      let line = cell.lines[i]
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
  let dx = Math.abs(self.x - thing.x)
  let dz = Math.abs(self.z - thing.z)
  if (dx > dz) {
    return dx + dz - dz * 0.5
  }
  return dx + dz - dx * 0.5
}

function thingCollision(self, thing) {
  let box = self.box + thing.box
  return Math.abs(self.x - thing.x) <= box && Math.abs(self.z - thing.z) <= box
}

export function thingSetup(self) {
  thingPushToCells(self)
  if (!thingFindSectorFromLine(self)) thingFindSector(self)
  thingUpdateY(self)
  self.world.pushThing(self)
}

export function thingSet(self, x, z) {
  self.x = self.previousX = x
  self.z = self.previousZ = z
  thingPushToCells(self)
  self.sector = null
  if (!thingFindSectorFromLine(self)) thingFindSector(self)
  thingUpdateY(self)
  self.world.pushThing(self)
}

export function thingTeleport(self, x, z) {
  thingRemoveFromCells(self)
  self.x = self.previousX = x
  self.z = self.previousZ = z
  thingPushToCells(self)
  self.sector = null
  if (!thingFindSectorFromLine(self)) thingFindSector(self)
  thingUpdateY(self)
}

export function thingPushToCells(self) {
  let box = self.box
  let minC = Math.floor(self.x - box) >> WORLD_CELL_SHIFT
  let maxC = Math.floor(self.x + box) >> WORLD_CELL_SHIFT
  let minR = Math.floor(self.z - box) >> WORLD_CELL_SHIFT
  let maxR = Math.floor(self.z + box) >> WORLD_CELL_SHIFT
  let world = self.world
  let columns = world.columns
  if (minC < 0) minC = 0
  if (minR < 0) minR = 0
  if (maxC >= columns) maxC = columns - 1
  if (maxR >= world.rows) maxR = world.rows - 1
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      world.cells[c + r * columns].pushThing(self)
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
      cells[c + r * columns].removeThing(self)
    }
  }
}

function thingDamage() {}

function thingResolveCollision(self, thing) {
  let box = self.box + thing.box
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

  if (!Float.zero(self.deltaX) || !Float.zero(self.deltaZ)) {
    self.previousX = self.x
    self.previousZ = self.z

    self.x += self.deltaX
    self.z += self.deltaZ

    thingRemoveFromCells(self)

    let box = self.box
    let minC = Math.floor(self.x - box) >> WORLD_CELL_SHIFT
    let maxC = Math.floor(self.x + box) >> WORLD_CELL_SHIFT
    let minR = Math.floor(self.z - box) >> WORLD_CELL_SHIFT
    let maxR = Math.floor(self.z + box) >> WORLD_CELL_SHIFT
    let world = self.world
    let columns = world.columns
    if (minC < 0) minC = 0
    if (minR < 0) minR = 0
    if (maxC >= columns) maxC = columns - 1
    if (maxR >= world.rows) maxR = world.rows - 1

    collided.clear()
    collisions.clear()

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        let cell = world.cells[c + r * columns]
        let i = cell.thingCount
        while (i--) {
          let thing = cell.things[i]
          if (!thing.isPhysical || collisions.has(thing)) continue
          if (thingCollision(self, thing)) collided.add(thing)
          collisions.add(thing)
        }
      }
    }

    while (collided.size > 0) {
      let closest = null
      let manhattan = Number.MAX_VALUE
      for (const thing of collided) {
        let distance = Math.abs(self.previousX - thing.x) + Math.abs(self.previousZ - thing.z)
        if (distance < manhattan) {
          manhattan = distance
          closest = thing
        }
      }
      thingResolveCollision(self, closest)
      collided.delete(closest)
    }

    let on = false
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        let cell = world.cells[c + r * world.columns]
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
}
