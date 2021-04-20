/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { HashSet, setAdd, setClear, setIter, setIterHasNext, setIterNext } from '../collections/set.js'
import { FLAG_LAVA, FLAG_WATER } from '../world/flags.js'

const SEARCH_DONE = []
const NEIGHBOR_QUEUE = []

let SECTOR_UID = 0

function sectorHashCode(sector) {
  return sector.uid
}

const DEAD_NEST = new HashSet(sectorHashCode)

export class Sector {
  constructor(bottom, floor, ceiling, top, floorTexture, ceilingTexture, flags, trigger, vecs, lines) {
    this.uid = SECTOR_UID++
    this.bottom = Math.min(bottom, floor)
    this.floor = Math.max(bottom, floor)
    this.ceiling = Math.min(ceiling, top)
    this.top = Math.max(ceiling, top)
    this.floorTexture = floorTexture
    this.ceilingTexture = ceilingTexture
    this.flags = flags
    this.trigger = trigger
    this.vecs = vecs
    this.lines = lines
    this.triangles = []
    this.inside = []
    this.outside = null
    this.neighbors = []
    this.liquid = false
    this.depth = 0
    if (this.flags) {
      const water = this.flags.get(FLAG_WATER)
      if (water) {
        this.liquid = true
        this.depth = water.values[0]
      } else {
        const lava = this.flags.get(FLAG_LAVA)
        if (lava) {
          this.liquid = true
          this.depth = lava.values[0]
        }
      }
      if (this.depth !== 0) this.floor -= this.depth
    }
  }

  floorRenderHeight() {
    if (this.liquid) return this.floor + this.depth
    return this.floor
  }

  hasFloor() {
    return this.floorTexture >= 0
  }

  hasCeiling() {
    return this.ceilingTexture >= 0
  }

  getFloorTexture() {
    return this.floorTexture
  }

  getCeilingTexture() {
    return this.ceilingTexture
  }

  contains(x, z) {
    let odd = false
    const len = this.vecs.length
    let k = len - 1
    for (let i = 0; i < len; i++) {
      const a = this.vecs[i]
      const b = this.vecs[k]
      if (a.y > z !== b.y > z) {
        const val = ((b.x - a.x) * (z - a.y)) / (b.y - a.y) + a.x
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
      const inside = this.inside[i]
      if (inside.contains(x, z)) return inside.find(x, z)
    }
    return this
  }

  searchFor(x, z) {
    if (this.contains(x, z)) return this.find(x, z)
    SEARCH_DONE.length = 0
    NEIGHBOR_QUEUE.length = 0
    for (let n = 0; n < this.neighbors.length; n++) NEIGHBOR_QUEUE.push(this.neighbors[n])
    while (NEIGHBOR_QUEUE.length > 0) {
      const current = NEIGHBOR_QUEUE.shift()
      if (current.contains(x, z)) return current.find(x, z)
      const neighbors = current.neighbors
      for (let i = 0; i < neighbors.length; i++) {
        const neighbor = neighbors[i]
        if (neighbor === current || NEIGHBOR_QUEUE.includes(neighbor) || SEARCH_DONE.includes(neighbor)) continue
        NEIGHBOR_QUEUE.push(neighbor)
      }
      SEARCH_DONE.push(current)
    }
    return null
  }

  otherIsInside(other) {
    for (let i = 0; i < this.inside.length; i++) {
      const inside = this.inside[i]
      if (inside === other) return true
      if (inside.otherIsInside(other)) return true
    }
  }
}

function deleteNestedInside(set, inner) {
  for (let i = 0; i < inner.inside.length; i++) {
    const nested = inner.inside[i]
    setAdd(set, nested)
    deleteNestedInside(set, nested)
  }
}

export function sectorInsideOutside(sectors) {
  for (let ts = 0; ts < sectors.length; ts++) {
    const sector = sectors[ts]
    for (let os = 0; os < sectors.length; os++) {
      if (ts === os) continue
      const other = sectors[os]
      let inside = 0
      let outside = 0
      for (let ov = 0; ov < other.vecs.length; ov++) {
        const o = other.vecs[ov]
        let shared = false
        for (let sv = 0; sv < sector.vecs.length; sv++) {
          const s = sector.vecs[sv]
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
  for (let ts = 0; ts < sectors.length; ts++) {
    const sector = sectors[ts]
    const inside = sector.inside
    setClear(DEAD_NEST)
    for (let i = 0; i < inside.length; i++) deleteNestedInside(DEAD_NEST, inside[i])
    const iter = setIter(DEAD_NEST)
    while (setIterHasNext(iter)) {
      const other = setIterNext(iter)
      const index = inside.indexOf(other)
      if (index >= 0) inside.splice(index, 1)
    }
    for (let i = 0; i < inside.length; i++) inside[i].outside = sector
  }
}

function sectorLineFacing(sector, line) {
  const a = line.a
  const vecs = sector.vecs
  const size = vecs.length
  for (let i = 0; i < size; i++) {
    const vec = vecs[i]
    if (vec !== a) continue
    i++
    if (i === size) i = 0
    if (vecs[i] === line.b) line.plus = sector
    else line.minus = sector
    return
  }
}

export function sectorLineNeighbors(sectors, lines, scale) {
  const size = sectors.length
  for (let s = 0; s < size; s++) {
    const sector = sectors[s]
    for (let i = 0; i < sector.lines.length; i++) sectorLineFacing(sector, sector.lines[i])
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const plus = line.plus
    const minus = line.minus
    if (plus !== null && minus !== null) {
      if (!plus.neighbors.includes(minus)) plus.neighbors.push(minus)
      if (!minus.neighbors.includes(plus)) minus.neighbors.push(plus)
    }
  }
  for (let s = 0; s < size; s++) {
    const sector = sectors[s]
    const outside = sector.outside
    if (outside) {
      if (!sector.neighbors.includes(sector.outside)) sector.neighbors.push(sector.outside)
      if (!sector.outside.neighbors.includes(sector)) sector.outside.neighbors.push(sector)
      for (let i = 0; i < sector.lines.length; i++) {
        const line = sector.lines[i]
        if (line.plus !== null) {
          if (line.minus === null) line.minus = outside
        } else {
          if (line.plus === null) line.plus = outside
        }
      }
    }
  }
  for (let i = 0; i < lines.length; i++) lines[i].updateSectorsForLine(scale)
}
