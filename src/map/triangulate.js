import { Triangle } from '../map/triangle.js'
import { Float } from '../math/vector.js'

const debug = false

const debugFloor = false
const debugCeiling = false
const debugEditor = true

let debugIsForFloor = false
let debugIsForCeiling = false
let debugIsForEditor = false

export function clockwiseReflex(a, b, c) {
  return (b.x - c.x) * (a.y - b.y) - (a.x - b.x) * (b.y - c.y) > 0.0
}

export function clockwiseInterior(a, b, c) {
  let angle = Math.atan2(b.y - c.y, b.x - c.x) - Math.atan2(b.y - a.y, b.x - a.x)
  if (angle < 0.0) angle += 2.0 * Math.PI
  else if (angle >= 2.0 * Math.PI) angle -= 2.0 * Math.PI
  return angle
}

function doDebug() {
  return debug && ((debugFloor && debugIsForFloor) || (debugCeiling && debugIsForCeiling) || (debugEditor && debugIsForEditor))
}

function strvec(vec) {
  return JSON.stringify({ x: vec.x, y: vec.y })
}

class PolygonPoint {
  constructor(vec) {
    this.index = -1
    this.start = false
    this.merge = false
    this.vec = vec
    this.previous = null
    this.next = null
    this.diagonals = []
  }
}

function polygonSort(n, o) {
  const a = n.vec
  const b = o.vec
  if (a.y > b.y) return -1
  if (a.y < b.y) return 1
  if (a.x > b.x) return 1
  if (a.x < b.x) return -1
  return 0
}

function strpoint(point) {
  return JSON.stringify(point, (key, value) => {
    if (key === 'previous' || key === 'merge') return
    if (key === 'vec') return { x: value.x, y: value.y }
    if (key === 'next') {
      if (value === null) return null
      else return { index: value.index, point: value.point }
    } else if (key === 'diagonals') {
      if (value === null) return null
      else return []
    } else return value
  })
}

class Start {
  constructor(a, b) {
    this.a = a
    this.b = b
  }
}

function strstart(start) {
  return JSON.stringify(start, (key, value) => {
    if (key === 'a' || key === 'b') return { x: value.vec.x, y: value.vec.y }
    return value
  })
}

class Vertex {
  constructor(vec) {
    this.vec = vec
    this.next = null
  }
}

function strvert(vert) {
  return JSON.stringify(vert, (key, value) => {
    if (key === 'next') {
      if (value === null) return null
      else return { vec: value.vec }
    } else return value
  })
}

function lineIntersect(a, b, c, d) {
  const a1 = b.y - a.y
  const b1 = a.x - b.x
  const c1 = b.x * a.y - a.x * b.y
  const r3 = a1 * c.x + b1 * c.y + c1
  const r4 = a1 * d.x + b1 * d.y + c1
  if (!Float.zero(r3) && !Float.zero(r4) && r3 * r4 >= 0.0) return false
  const a2 = d.y - c.y
  const b2 = c.x - d.x
  const c2 = d.x * c.y - c.x * d.y
  const r1 = a2 * a.x + b2 * a.y + c2
  const r2 = a2 * b.x + b2 * b.y + c2
  if (!Float.zero(r1) && !Float.zero(r2) && r1 * r2 >= 0.0) return false
  const denominator = a1 * b2 - a2 * b1
  if (Float.zero(denominator)) return false
  return true
}

function safeDiagonal(polygon, a, b) {
  for (const point of polygon) {
    const c = point.vec
    const d = point.previous.vec
    if (a === c || a === d || b === c || b === d) continue
    if (lineIntersect(a, b, c, d)) return false
  }
  return true
}

function triangleContains(a, b, c, p) {
  const x = p.x - a.x
  const y = p.y - a.y
  const pab = (b.x - a.x) * y - (b.y - a.y) * x > 0
  if ((c.x - a.x) * y - (c.y - a.y) * x > 0 === pab) return false
  if ((c.x - b.x) * (p.y - b.y) - (c.y - b.y) * (p.x - b.x) > 0 !== pab) return false
  return true
}

function safeTriangle(verts, a, b, c) {
  let i = verts.length
  while (i--) {
    const p = verts[i].vec
    if (p === a || p === b || p === c) continue
    if (triangleContains(a, b, c, p)) return false
  }
  return true
}

function add(sector, floor, scale, triangles, a, b, c) {
  let triangle = null
  if (floor) triangle = new Triangle(sector.floor, sector.getFloorTexture(), c, b, a, floor, scale)
  else triangle = new Triangle(sector.ceiling, sector.getCeilingTexture(), a, b, c, floor, scale)
  triangles.push(triangle)
}

function clip(sector, floor, scale, triangles, verts) {
  let size = verts.length
  if (size === 3) {
    if (doDebug()) console.debug('$ no clip (only 3 vertices)')
    add(sector, floor, scale, triangles, verts[0].vec, verts[1].vec, verts[2].vec)
    return
  }
  if (doDebug()) console.debug('^ start clip')
  for (let i = 0; i < size; i++) {
    const vert = verts[i]
    if (i + 1 === size) vert.next = verts[0]
    else vert.next = verts[i + 1]
  }
  verts.sort(polygonSort)
  for (let i = 0; i < size; i++) {
    if (doDebug()) console.debug(' ', strvert(verts[i]))
  }
  const points = verts.slice()
  let i = 0
  let protect = size * 2
  while (size > 3) {
    if (--protect <= 0) throw 'Too many clip iterations'
    if (i >= size) i = 0
    const va = verts[i]
    if (va === undefined) {
      console.debug(size, '|', i, '|', verts)
    }
    const vb = va.next
    const vc = vb.next
    const a = va.vec
    const b = vb.vec
    const c = vc.vec
    if (doDebug()) console.debug('(triangle)', strvec(a), strvec(b), strvec(c))
    if (clockwiseReflex(a, b, c)) {
      if (safeTriangle(points, a, b, c)) {
        if (doDebug()) console.debug('(add)', strvec(a), strvec(b), strvec(c))
        add(sector, floor, scale, triangles, a, b, c)
        for (let x = 0; x < size; x++) {
          if (verts[x] === vb) {
            verts.splice(x, 1)
            break
          }
        }
        va.next = vc
        size--
        continue
      }
    }
    i++
  }
  const a = verts[0]
  if (doDebug()) console.debug('(add remaining)', strvec(a.vec), strvec(a.next.vec), strvec(a.next.next.vec))
  add(sector, floor, scale, triangles, a.vec, a.next.vec, a.next.next.vec)
  if (doDebug()) console.debug('$ end clip')
}

function monotone(sector, floor, scale, starting, triangles) {
  if (doDebug()) console.debug('^ monotone')
  const verts = []
  for (const start of starting) {
    if (doDebug()) console.debug('^ monotone polygon starting with', strstart(start))
    const initial = start.a
    let current = start.b
    let previous = initial.vec
    verts.push(new Vertex(previous))
    let protect = 100
    while (true) {
      if (--protect <= 0) throw 'Too many monotone iterations'
      const vec = current.vec
      const next = current.next
      verts.push(new Vertex(current.vec))
      if (current.diagonals.length > 0) {
        let best = next
        let angle = clockwiseInterior(previous, vec, next.vec)
        if (doDebug()) console.debug('interior (1)', strvec(previous), strvec(vec), strvec(next.vec), angle)
        for (const diagonal of current.diagonals) {
          if (previous === diagonal.vec) continue
          const other = clockwiseInterior(previous, vec, diagonal.vec)
          if (doDebug()) console.debug('compare interior (2)', strvec(previous), strvec(vec), strvec(diagonal.vec), '=', other, ', better:', other < angle)
          if (other < angle) {
            best = diagonal
            angle = other
          }
        }
        current = best
      } else {
        if (doDebug()) console.debug('(3) no diagonals, going to next')
        current = next
      }
      if (current === initial) break
      previous = vec
    }
    clip(sector, floor, scale, triangles, verts)
    if (doDebug()) console.debug('$ end monotone polygon')
    verts.length = 0
  }
  if (doDebug()) console.debug('$ end monotone')
}

function classify(points) {
  if (doDebug()) console.debug('^ classify')
  const monotone = []
  const merge = []
  const split = []
  for (const current of points) {
    const vec = current.vec
    const previous = current.previous.vec
    const next = current.next.vec
    const reflex = clockwiseReflex(previous, vec, next)
    if (reflex) {
      const above = previous.y < vec.y && next.y <= vec.y
      if (doDebug()) console.debug(' ', strpoint(current), 'reflex', reflex, 'above', above)
      if (above) {
        current.start = true
        monotone.push(new Start(current, current.next))
      }
    } else {
      const above = previous.y <= vec.y && next.y < vec.y
      const below = previous.y >= vec.y && next.y > vec.y
      if (doDebug()) console.debug(' ', strpoint(current), 'reflex', reflex, 'above', above, 'below', below)
      if (above) {
        split.push(current)
      } else if (below) {
        merge.push(current)
      }
    }
  }
  for (const mono of monotone) if (doDebug()) console.debug('start', strstart(mono))
  for (const point of merge) {
    const vec = point.vec
    for (let k = point.index + 1; k < points.length; k++) {
      const diagonal = points[k]
      if (!safeDiagonal(points, vec, diagonal.vec)) continue
      point.merge = true
      point.diagonals.push(diagonal)
      diagonal.diagonals.push(point)
      if (doDebug()) console.debug('merge', strvec(point.vec), 'with', strvec(diagonal.vec))
      break
    }
  }
  for (const point of split) {
    const vec = point.vec
    for (let k = point.index - 1; k >= 0; k--) {
      const diagonal = points[k]
      if (!safeDiagonal(points, vec, diagonal.vec)) continue
      if (diagonal.merge) break
      point.diagonals.push(diagonal)
      diagonal.diagonals.push(point)
      if (doDebug()) console.debug('split', strvec(point.vec), 'with', strvec(diagonal.vec))
      if (diagonal.start) {
        monotone.push(new Start(diagonal, point))
      } else {
        if (diagonal.vec.x > vec.x) monotone.push(new Start(point, diagonal))
        else monotone.push(new Start(diagonal, point))
      }
      break
    }
  }
  if (doDebug()) console.debug('$ end classify')
  return monotone
}

function find(points, vec) {
  for (const point of points) {
    if (vec === point.vec) return point
  }
  return null
}

function skip(sector, floor) {
  if (floor === null) return false
  if (floor) return !sector.hasFloor()
  return !sector.hasCeiling()
}

class InnerReference {
  constructor(inner) {
    this.vecSet = [inner.vecs]
    this.vecs = null
  }

  add(inner) {
    this.vecSet.push(inner.vecs)
  }

  has(d) {
    for (const vecs of this.vecSet) {
      for (const vec of vecs) {
        if (vec === d) return true
      }
    }
    return false
  }

  topLeft() {
    let top = null
    for (const vecs of this.vecSet) {
      for (const vec of vecs) {
        if (top === null) {
          top = vec
          continue
        }
        if (vec.y < top.y) continue
        if (Float.eq(vec.y, top.y) && vec.x > top.x) continue
        top = vec
      }
    }
    return top
  }

  startOf(top) {
    let start = null
    for (let v = 0; v < this.vecSet.length; v++) {
      const vecs = this.vecSet[v]
      for (let i = 0; i < vecs.length; i++) {
        const vec = vecs[i]
        if (vec === top) continue
        const n = i + 1 === vecs.length ? 0 : i + 1
        const next = vecs[n]
        if (next === top) {
          if (start === null) {
            start = vec
            continue
          }
          if (vec.x > start.x) continue
          if (Float.eq(vec.x, start.x) && vec.y < start.y) continue
          start = vec
        }
      }
    }
    return start
  }

  next(previous, current) {
    let result = null
    for (let v = 0; v < this.vecSet.length; v++) {
      const vecs = this.vecSet[v]
      for (let i = 0; i < vecs.length; i++) {
        const vec = vecs[i]
        if (vec !== current) continue
        const n = i + 1 === vecs.length ? 0 : i + 1
        const next = vecs[n]
        if (result === null) result = next
        else {
          const one = clockwiseInterior(previous, current, result)
          const two = clockwiseInterior(previous, current, next)
          if (two > one) result = next
        }
      }
    }
    return result
  }
}

function populateInside(inside, floor) {
  const clusters = []
  const remaining = inside.filter((inner) => !skip(inner, floor))
  for (let i = 0; i < remaining.length; i++) {
    const inner = remaining[i]
    const reference = new InnerReference(inner)
    clusters.push(reference)
    for (let r = i + 1; r < remaining.length; r++) {
      const other = remaining[r]
      iter: for (const d of other.vecs) {
        if (reference.has(d)) {
          reference.add(other)
          remaining.splice(r, 1)
          r--
          break iter
        }
      }
    }
  }
  for (const cluster of clusters) {
    if (cluster.vecSet.length === 1) {
      cluster.vecs = cluster.vecSet[0]
      continue
    }
    const top = cluster.topLeft()
    const start = cluster.startOf(top)
    if (doDebug()) console.debug('@ cluster', strvec(start), strvec(top))
    const vecs = [start, top]
    let previous = start
    let current = top
    let protect = 1000
    while (true) {
      if (--protect <= 0) throw 'Too many population iterations'
      const next = cluster.next(previous, current)
      if (next === start) break
      vecs.push(next)
      previous = current
      current = next
    }
    cluster.vecs = vecs
  }
  return clusters.map((cluster) => cluster.vecs)
}

function populateReferences(vecs, points, clockwise) {
  const size = vecs.length
  for (let i = 0; i < size; i++) {
    let p = i === 0 ? size - 1 : i - 1
    let n = i === size - 1 ? 0 : i + 1
    if (!clockwise) {
      const t = p
      p = n
      n = t
    }
    const next = find(points, vecs[n])
    const previous = find(points, vecs[p])
    const original = find(points, vecs[i])
    if (original.previous === null) original.previous = previous
    else console.warn('Multiple previous references:', strvec(original.vec), '|', strvec(original.previous.vec), '|', strvec(previous.vec))
    if (original.next === null) original.next = next
    else console.warn('Multiple next references:', strvec(original.vec), '|', strvec(original.next.vec), '|', strvec(next.vec))
  }
}

function populateVectors(vecs, points) {
  for (const vec of vecs) {
    let exists = false
    for (const point of points) {
      if (vec === point.vec) {
        exists = true
        break
      }
    }
    if (!exists) points.push(new PolygonPoint(vec))
  }
  points.sort(polygonSort)
}

function populate(sector, floor) {
  const points = []
  if (doDebug()) console.debug(`^ populate (${sector.inside.length})`)
  const inside = populateInside(sector.inside, floor)
  for (const inner of inside) populateVectors(inner, points)
  for (const inner of inside) populateReferences(inner, points, false)
  populateVectors(sector.vecs, points)
  populateReferences(sector.vecs, points, true)
  for (let i = 0; i < points.length; i++) points[i].index = i
  if (doDebug()) console.debug('$ end populate')
  return points
}

function floorCeil(sector, floor, scale, triangles) {
  if (skip(sector, floor)) return
  const points = populate(sector, floor)
  const starting = classify(points)
  monotone(sector, floor, scale, starting, triangles)
}

export function sectorTriangulate(sector, scale) {
  debugIsForFloor = true
  floorCeil(sector, true, scale, sector.triangles)
  debugIsForFloor = false
  debugIsForCeiling = true
  floorCeil(sector, false, scale, sector.triangles)
  debugIsForCeiling = false
}

export function sectorTriangulateForEditor(sector, scale) {
  if (debug) console.debug('^ start compute triangles for sector')
  sectorTriangulate(sector, scale)
  debugIsForEditor = true
  floorCeil(sector, null, scale, sector.view)
  debugIsForEditor = false
  if (debug) console.debug('$ end compute triangles for sector')
}
