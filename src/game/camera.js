import {lineIntersectAt, Float} from '/src/math/vector.js'
import {WORLD_CELL_SHIFT} from '/src/world/world.js'

const out = [0.0, 0.0]

export class Camera {
  constructor(x, y, z, rx, ry, radius, ox = 0.0, oy = 0.0) {
    this.x = x
    this.y = y
    this.z = z
    this.rx = rx
    this.ry = ry
    this.radius = radius
    this.ox = ox
    this.oy = oy
    this.target = null
  }
}

function cameraFixView(self, world) {
  let target = self.target
  let minC = Math.floor(self.x) >> WORLD_CELL_SHIFT
  let maxC = Math.floor(target.x) >> WORLD_CELL_SHIFT
  let minR = Math.floor(self.z) >> WORLD_CELL_SHIFT
  let maxR = Math.floor(target.z) >> WORLD_CELL_SHIFT

  if (maxC < minC) {
    let c = minC
    minC = maxC
    maxC = c
  }

  if (maxR < minR) {
    let r = minR
    minR = maxR
    maxR = r
  }

  let columns = world.columns

  if (minC < 0) minC = 0
  if (minR < 0) minR = 0
  if (maxC >= columns) maxC = columns - 1
  if (maxR >= world.rows) maxR = world.rows - 1

  const fudge = 0.05

  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      let cell = world.cells[c + r * world.columns]
      let i = cell.lines.length
      while (i--) {
        let line = cell.lines[i]
        if (line.physical && lineIntersectAt(out, self.x, self.z, target.x, target.z, line.a.x, line.a.y, line.b.x, line.b.y)) {
          let angle = Math.atan2(target.z - self.z, target.x - self.x)
          let dx = Math.cos(angle)
          let dz = Math.sin(angle)
          self.x = out[0] + fudge * dx
          self.z = out[1] + fudge * dz
        }
      }
    }
  }

  let sector = world.findSector(self.x, self.z)
  if (sector === null) return
  if (sector.hasFloor() && self.y < sector.floor + fudge) self.y = sector.floor + fudge
  if (sector.hasCeiling() && self.y > sector.ceiling - fudge) self.y = sector.ceiling - fudge
}

export function cameraFollowOrbit(self) {
  let target = self.target
  let sinX = Math.sin(self.rx)
  let cosX = Math.cos(self.rx)
  let sinY = Math.sin(self.ry)
  let cosY = Math.cos(self.ry)
  self.x = target.x - self.radius * cosX * sinY
  self.y = target.y + self.radius * sinX + target.height
  self.z = target.z + self.radius * cosX * cosY
}

export function cameraFollowCinema(self, world) {
  let target = self.target
  const offset = Math.PI / 16.0
  let sinX = Math.sin(self.rx)
  let cosX = Math.cos(self.rx)
  let sinY = Math.sin(self.ry - offset)
  let cosY = Math.cos(self.ry - offset)
  let x = target.x
  let y = target.y + target.height
  let z = target.z
  self.x = x - self.radius * cosX * sinY
  self.y = y + self.radius * sinX
  self.z = z + self.radius * cosX * cosY
  cameraFixView(self, world)
}

export function cameraTowardsTarget(self) {
  let target = self.target
  if (!target) return
  if (Float.eq(self.x, target.x) && Float.eq(self.z, target.z)) return
  let x = target.x - self.x
  let z = target.z - self.z
  let angle = Math.atan2(z, x)
  let distance = Math.sqrt(x * x + z * z)
  let speed = Math.min(0.2, distance)
  let dx = speed * Math.cos(angle)
  let dz = speed * Math.sin(angle)
  self.x += dx
  self.z += dz
}
