export class Sector {
  constructor(bottom, floor, ceiling, top, floorTexture, ceilingTexture, vecs, lines) {
    this.bottom = bottom
    this.floor = floor
    this.ceiling = ceiling
    this.top = top
    this.floorTexture = floorTexture
    this.ceilingTexture = ceilingTexture
    this.vecs = vecs
    this.lines = lines
    this.triangles = []
    this.inside = []
    this.outside = null
    this.neighbors = []
  }

  hasFloor() {
    return this.floorTexture >= 0
  }

  hasCeiling() {
    return this.ceilingTexture >= 0
  }

  contains(x, z) {
    let odd = false
    let len = this.vecs.length
    let k = len - 1
    for (let i = 0; i < len; i++) {
      let a = this.vecs[i]
      let b = this.vecs[k]
      if (a.y > z != b.y > z) {
        let val = ((b.x - a.x) * (z - a.y)) / (b.y - a.y) + a.x
        if (x < val) {
          odd = !odd
        }
      }
      k = i
    }
    return odd
  }

  find(x, z) {
    let i = this.inside.length
    while (i--) {
      let inside = this.inside[i]
      if (inside.contains(x, z)) {
        return inside.find(x, z)
      }
    }
    return this
  }

  searchFor(x, z) {
    if (this.contains(x, z)) return this.find(x, z)
    let queue = this.neighbors.slice()
    let done = []
    while (queue.length > 0) {
      let current = queue.shift()
      if (current.contains(x, z)) return current.find(x, z)
      let neighbors = current.neighbors
      for (let i = 0; i < neighbors.length; i++) {
        let neighbor = neighbors[i]
        if (neighbor === current || queue.includes(neighbor) || done.includes(neighbor)) continue
        queue.push(neighbor)
      }
      done.push(current)
    }
    return null
  }

  otherIsInside(other) {
    for (const inside of this.inside) {
      if (inside === other) return true
      if (inside.otherIsInside(other)) return true
    }
  }
}

function deleteNestedInside(set, inside) {
  for (const nested of inside.inside) {
    set.add(nested)
    deleteNestedInside(nested)
  }
}

export function sectorInsideOutside(sectors) {
  for (const sector of sectors) {
    for (const other of sectors) {
      if (sector === other) continue
      let inside = 0
      let outside = 0
      for (const o of other.vecs) {
        let shared = false
        for (const s of sector.vecs) {
          if (s === o) {
            shared = true
            break
          }
        }
        if (shared) continue
        if (sector.contains(o.x, o.y)) inside++
        else outside++
      }
      if (outside === 0 && inside > 0) sector.inside.push(other)
    }
  }
  for (const sector of sectors) {
    let dead = new Set()
    for (const inside of sector.inside) deleteNestedInside(dead, inside)
    for (const other of dead) {
      let index = sector.inside.indexOf(other)
      if (index >= 0) sector.inside.splice(index, 1)
    }
    for (const inside of sector.inside) inside.outside = sector
  }
}

export function sectorLineNeighbors(sectors, scale) {
  for (const sector of sectors) {
    for (const other of sectors) {
      if (sector === other) continue
      if (other.neighbors.includes(sector)) continue
      iter: for (const o of other.lines) {
        for (const line of sector.lines) {
          if (line === o) {
            sector.neighbors.push(other)
            other.neighbors.push(sector)
            line.updateSectors(sector, other, scale)
            break iter
          }
        }
      }
    }
    let plus, minus
    if (sector.outside) {
      plus = sector
      minus = sector.outside
    } else {
      plus = null
      minus = sector
    }
    for (const line of sector.lines) {
      if (line.plus !== null || line.minus !== null) continue
      line.updateSectors(plus, minus, scale)
    }
  }
}
