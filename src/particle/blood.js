import {WORLD_CELL_SHIFT} from '/src/world/world.js'
import {textureIndexForName, spritesByName} from '/src/assets/assets.js'
import {randomInt} from '/src/math/random.js'
import {particleSetup, particleUpdateSector} from '/src/particle/particle.js'

function bloodHitFloor(self) {
  let sector = self.sector
  let decal = self.world.newDecal(self.texture)

  let sprite = self.sprite
  let width = sprite.halfWidth
  let height = 0.5 * sprite.height

  let x = Math.round(self.x * 16.0) / 16.0
  let z = Math.round(self.z * 16.0) / 16.0

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
  let sector = self.sector
  let decal = self.world.newDecal(self.texture)

  let sprite = self.sprite
  let width = sprite.halfWidth
  let height = 0.5 * sprite.height

  let x = Math.round(self.x * 16.0) / 16.0
  let z = Math.round(self.z * 16.0) / 16.0

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
    let max = self.y + self.height
    if (line.plus && self.y > line.plus.floor && max < line.plus.ceiling) return false
    if (line.minus && self.y > line.minus.floor && max < line.minus.ceiling) return false
  }

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

  let decal = self.world.newDecal(self.texture)

  let x = px + self.x
  let z = pz + self.z

  let sprite = self.sprite
  let width = sprite.halfWidth
  let height = sprite.height

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
  let box = self.box
  let minC = Math.floor(self.x - box) >> WORLD_CELL_SHIFT
  let maxC = Math.floor(self.x + box) >> WORLD_CELL_SHIFT
  let minR = Math.floor(self.z - box) >> WORLD_CELL_SHIFT
  let maxR = Math.floor(self.z + box) >> WORLD_CELL_SHIFT
  let world = self.world
  let columns = world.columns
  if (minC < 0 || minR < 0 || maxC >= columns || maxR >= world.rows) return true
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      let cell = world.cells[c + r * columns]
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
  self.texture = textureIndexForName(entity.get('sprite'))
  let types = entity.get('animation')
  self.sprite = spritesByName(entity.get('sprite')).get(types[randomInt(types.length)])
  self.deltaX = dx
  self.deltaY = dy
  self.deltaZ = dz
  particleSetup(self)
}

export function newBlood(world, entity, x, y, z, dx, dy, dz) {
  let particle = world.newParticle(x, y, z)
  bloodInit(particle, entity, dx, dy, dz)
  return particle
}
