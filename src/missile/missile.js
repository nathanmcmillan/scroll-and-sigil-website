import { cellPushMissile, cellRemoveMissile } from '../world/cell.js'
import { worldFindSector, WORLD_CELL_SHIFT } from '../world/world.js'

export class Missile {
  constructor() {
    this.world = null
    this.sector = null
    this.x = 0.0
    this.y = 0.0
    this.z = 0.0
    this.deltaX = 0.0
    this.deltaY = 0.0
    this.deltaZ = 0.0
    this.box = 0.0
    this.height = 0.0
    this.ground = false
    this.texture = 0
    this.sprite = null
    this.minC = 0
    this.maxC = 0
    this.minR = 0
    this.maxR = 0
    this.damage = 0
    this.update = null
    this.hit = null
  }
}

export function missileHit(self, thing) {
  if (thing) thing.damage(self, self.damage)
}

export function missileInitialize(self, world, x, y, z) {
  self.world = world
  self.x = x
  self.y = y
  self.z = z
}

export function missileSetup(self) {
  missilePushToCells(self)
  missileUpdateSector(self)
}

export function missilePushToCells(self) {
  const box = self.box
  const minC = Math.floor(self.x - box) >> WORLD_CELL_SHIFT
  const maxC = Math.floor(self.x + box) >> WORLD_CELL_SHIFT
  const minR = Math.floor(self.z - box) >> WORLD_CELL_SHIFT
  const maxR = Math.floor(self.z + box) >> WORLD_CELL_SHIFT

  const world = self.world
  const columns = world.columns

  if (minC < 0 || minR < 0 || maxC >= columns || maxR >= world.rows) return true

  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      cellPushMissile(world.cells[c + r * columns], self)
    }
  }

  self.minC = minC
  self.maxC = maxC
  self.minR = minR
  self.maxR = maxR

  return false
}

export function missileRemoveFromCells(self) {
  const world = self.world
  for (let r = self.minR; r <= self.maxR; r++) {
    for (let c = self.minC; c <= self.maxC; c++) {
      cellRemoveMissile(world.cells[c + r * world.columns], self)
    }
  }
}

export function missileUpdateSector(self) {
  self.sector = worldFindSector(self.world, self.x, self.z)
  return self.sector === null
}

export function missileOverlap(self, thing) {
  const box = self.box + thing.box
  return Math.abs(self.x - thing.x) <= box && Math.abs(self.z - thing.z) <= box
}

export function missileLineOverlap(self, line) {
  if (!line.physical) {
    const max = self.y + self.height
    if (line.plus && self.y > line.plus.floor && max < line.plus.ceiling) return false
    if (line.minus && self.y > line.minus.floor && max < line.minus.ceiling) return false
  }
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
  return px * px + pz * pz <= box * box
}

export function missileCheck(self) {
  if (missileUpdateSector(self)) {
    self.hit(null)
    return true
  } else if (self.y < self.sector.floor) {
    self.hit(null)
    return true
  } else if (self.y + self.height > self.sector.ceiling) {
    self.hit(null)
    return true
  }
  const box = self.box
  const minC = Math.floor(self.x - box) >> WORLD_CELL_SHIFT
  const maxC = Math.floor(self.x + box) >> WORLD_CELL_SHIFT
  const minR = Math.floor(self.z - box) >> WORLD_CELL_SHIFT
  const maxR = Math.floor(self.z + box) >> WORLD_CELL_SHIFT
  const world = self.world
  const columns = world.columns
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      const cell = world.cells[c + r * columns]
      let i = cell.thingCount
      while (i--) {
        const thing = cell.things[i]
        if (self === thing) continue
        if (thing.isPhysical && missileOverlap(self, thing)) {
          self.hit(thing)
          return true
        }
      }
      i = cell.lines.length
      while (i--) {
        if (missileLineOverlap(self, cell.lines[i])) {
          self.hit(null)
          return true
        }
      }
    }
  }
}

export function missileIntegrate(self) {
  if (missileCheck(self)) return true
  self.x += self.deltaX
  self.y += self.deltaY
  self.z += self.deltaZ
  missileRemoveFromCells(self)
  if (missilePushToCells(self)) return true
  return missileCheck(self)
}
