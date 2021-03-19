import { randomInt } from '../math/random.js'
import { particleSetup, particleUpdateSector } from '../particle/particle.js'
import { worldNewParticle, WORLD_CELL_SHIFT } from '../world/world.js'

function bloodHitFloor(self) {
  const sector = self.sector
  const decal = self.world.newDecal(self.stamp.texture)

  const sprite = self.stamp.sprite
  const width = sprite.halfWidth
  const height = 0.5 * sprite.height

  const x = Math.round(self.x * 16.0) / 16.0
  const z = Math.round(self.z * 16.0) / 16.0

  decal.x1 = x - width
  decal.y1 = sector.floor
  decal.z1 = z - height

  decal.u1 = sprite.left
  decal.v1 = sprite.top

  decal.x2 = x - width
  decal.y2 = sector.floor
  decal.z2 = z + height

  decal.u2 = sprite.left
  decal.v2 = sprite.bottom

  decal.x3 = x + width
  decal.y3 = sector.floor
  decal.z3 = z + height

  decal.u3 = sprite.right
  decal.v3 = sprite.bottom

  decal.x4 = x + width
  decal.y4 = sector.floor
  decal.z4 = z - height

  decal.u4 = sprite.right
  decal.v4 = sprite.top

  decal.nx = 0.0
  decal.ny = 1.0
  decal.nz = 0.0
}

function bloodHitCeiling(self) {
  const sector = self.sector
  const decal = self.world.newDecal(self.stamp.texture)

  const sprite = self.stamp.sprite
  const width = sprite.halfWidth
  const height = 0.5 * sprite.height

  const x = Math.round(self.x * 16.0) / 16.0
  const z = Math.round(self.z * 16.0) / 16.0

  decal.x1 = x + width
  decal.y1 = sector.ceiling
  decal.z1 = z - height

  decal.u1 = sprite.left
  decal.v1 = sprite.top

  decal.x2 = x + width
  decal.y2 = sector.ceiling
  decal.z2 = z + height

  decal.u2 = sprite.left
  decal.v2 = sprite.bottom

  decal.x3 = x - width
  decal.y3 = sector.ceiling
  decal.z3 = z + height

  decal.u3 = sprite.right
  decal.v3 = sprite.bottom

  decal.x4 = x - width
  decal.y4 = sector.ceiling
  decal.z4 = z - height

  decal.u4 = sprite.right
  decal.v4 = sprite.top

  decal.nx = 0.0
  decal.ny = -1.0
  decal.nz = 0.0
}

function bloodHitLine(self, line) {
  if (!line.physical) {
    const max = self.y + self.height
    if (line.plus && self.y > line.plus.floor && max < line.plus.ceiling) return false
    if (line.minus && self.y > line.minus.floor && max < line.minus.ceiling) return false
  }

  const box = self.box
  const vx = line.b.x - line.a.x
  const vz = line.b.y - line.a.y
  let wx = self.x - line.a.x
  let wz = self.z - line.a.y
  let t = (wx * vx + wz * vz) / (vx * vx + vz * vz)
  if (t < 0.0) t = 0.0
  else if (t > 1.0) t = 1.0
  const px = line.a.x + vx * t - self.x
  const pz = line.a.y + vz * t - self.z
  if (px * px + pz * pz > box * box) return false

  const decal = self.world.newDecal(self.stamp.texture)

  const x = px + self.x
  const z = pz + self.z

  const sprite = self.stamp.sprite
  const width = sprite.halfWidth
  const height = sprite.height

  decal.x1 = x - line.normal.y * width
  decal.y1 = self.y + height
  decal.z1 = z + line.normal.x * width

  wx = decal.x1 - line.a.x
  wz = decal.z1 - line.a.y

  t = (wx * vx + wz * vz) / (vx * vx + vz * vz)

  if (t < 0.0) {
    decal.x1 = line.a.x
    decal.z1 = line.a.y
  }

  decal.u1 = sprite.left
  decal.v1 = sprite.top

  decal.x2 = decal.x1
  decal.y2 = self.y
  decal.z2 = decal.z1

  decal.u2 = sprite.left
  decal.v2 = sprite.bottom

  decal.x3 = x + line.normal.y * width
  decal.y3 = self.y
  decal.z3 = z - line.normal.x * width

  wx = decal.x3 - line.a.x
  wz = decal.z3 - line.a.y

  t = (wx * vx + wz * vz) / (vx * vx + vz * vz)

  if (t > 1.0) {
    decal.x3 = line.b.x
    decal.z3 = line.b.y
  }

  decal.u3 = sprite.right
  decal.v3 = sprite.bottom

  decal.x4 = decal.x3
  decal.y4 = decal.y1
  decal.z4 = decal.z3

  decal.u4 = sprite.right
  decal.v4 = sprite.top

  decal.nx = line.normal.x
  decal.ny = 0.0
  decal.nz = line.normal.y

  return true
}

function bloodCheck(self) {
  if (particleUpdateSector(self)) return true
  if (self.y < self.sector.floor) {
    bloodHitFloor(self)
    return true
  } else if (self.y + self.height > self.sector.ceiling) {
    bloodHitCeiling(self)
    return true
  }
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
      const cell = world.cells[c + r * columns]
      let i = cell.lines.length
      while (i--) {
        if (bloodHitLine(self, cell.lines[i])) {
          return true
        }
      }
    }
  }
  return false
}

function bloodUpdate() {
  this.deltaX *= 0.97
  this.deltaY -= 0.015
  this.deltaZ *= 0.97
  this.x += this.deltaX
  this.y += this.deltaY
  this.z += this.deltaZ
  return bloodCheck(this)
}

function bloodInit(self, entity, dx, dy, dz) {
  self.update = bloodUpdate
  self.box = entity.box()
  self.height = entity.height()
  const sprites = entity.stamps()
  self.stamp = sprites[randomInt(sprites.length)]
  self.deltaX = dx
  self.deltaY = dy
  self.deltaZ = dz
  particleSetup(self)
}

export function newBlood(world, entity, x, y, z, dx, dy, dz) {
  const particle = worldNewParticle(world, x, y, z)
  bloodInit(particle, entity, dx, dy, dz)
  return particle
}
