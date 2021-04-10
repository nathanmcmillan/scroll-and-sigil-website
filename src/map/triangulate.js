import { Triangle } from '../map/triangle.js'
import { floatEq, floatZero } from '../math/vector.js'

export function clockwiseReflex(a, b, c) {
  return (b.x - c.x) * (a.y - b.y) - (a.x - b.x) * (b.y - c.y) > 0.0
}

export function clockwiseInterior(a, b, c) {
  let angle = Math.atan2(b.y - c.y, b.x - c.x) - Math.atan2(b.y - a.y, b.x - a.x)
  if (angle < 0.0) angle += 2.0 * Math.PI
  else if (angle >= 2.0 * Math.PI) angle -= 2.0 * Math.PI
  return angle
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

class Start {
  constructor(a, b) {
    this.a = a
    this.b = b
  }
}

class Vertex {
  constructor(vec) {
    this.vec = vec
    this.next = null
  }
}

function lineIntersect(a, b, c, d) {
  const a1 = b.y - a.y
  const b1 = a.x - b.x
  const c1 = b.x * a.y - a.x * b.y
  const r3 = a1 * c.x + b1 * c.y + c1
  const r4 = a1 * d.x + b1 * d.y + c1
  if (!floatZero(r3) && !floatZero(r4) && r3 * r4 >= 0.0) return false
  const a2 = d.y - c.y
  const b2 = c.x - d.x
  const c2 = d.x * c.y - c.x * d.y
  const r1 = a2 * a.x + b2 * a.y + c2
  const r2 = a2 * b.x + b2 * b.y + c2
  if (!floatZero(r1) && !floatZero(r2) && r1 * r2 >= 0.0) return false
  const denominator = a1 * b2 - a2 * b1
  if (floatZero(denominator)) return false
  return true
}

function safeDiagonal(polygon, a, b) {
  for (let p = 0; p < polygon.length; p++) {
    const point = polygon[p]
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
  if (floor) triangle = new Triangle(sector.floorRenderHeight(), sector.getFloorTexture(), c, b, a, floor, scale)
  else triangle = new Triangle(sector.ceiling, sector.getCeilingTexture(), a, b, c, floor, scale)
  triangles.push(triangle)
}

function clip(sector, floor, scale, triangles, verts) {
  let size = verts.length
  if (size === 3) {
    add(sector, floor, scale, triangles, verts[0].vec, verts[1].vec, verts[2].vec)
    return
  }
  for (let i = 0; i < size; i++) {
    const vert = verts[i]
    if (i + 1 === size) vert.next = verts[0]
    else vert.next = verts[i + 1]
  }
  verts.sort(polygonSort)
  const points = verts.slice()
  let i = 0
  let protect = size * 2
  while (size > 3) {
    if (--protect <= 0) throw 'Too many clip iterations'
    if (i >= size) i = 0
    const va = verts[i]
    const vb = va.next
    const vc = vb.next
    const a = va.vec
    const b = vb.vec
    const c = vc.vec
    if (clockwiseReflex(a, b, c)) {
      if (safeTriangle(points, a, b, c)) {
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
  add(sector, floor, scale, triangles, a.vec, a.next.vec, a.next.next.vec)
}

function monotone(sector, floor, scale, starting, triangles) {
  const verts = []
  for (let s = 0; s < starting.length; s++) {
    const start = starting[s]
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
        for (let d = 0; d < current.diagonals.length; d++) {
          const diagonal = current.diagonals[d]
          if (previous === diagonal.vec) continue
          const other = clockwiseInterior(previous, vec, diagonal.vec)
          if (other < angle) {
            best = diagonal
            angle = other
          }
        }
        current = best
      } else {
        current = next
      }
      if (current === initial) break
      previous = vec
    }
    clip(sector, floor, scale, triangles, verts)
    verts.length = 0
  }
}

function classify(points) {
  const monotone = []
  const merge = []
  const split = []
  for (let c = 0; c < points.length; c++) {
    const current = points[c]
    const vec = current.vec
    const previous = current.previous.vec
    const next = current.next.vec
    const reflex = clockwiseReflex(previous, vec, next)
    if (reflex) {
      const above = previous.y < vec.y && next.y <= vec.y
      if (above) {
        current.start = true
        monotone.push(new Start(current, current.next))
      }
    } else {
      const above = previous.y <= vec.y && next.y < vec.y
      const below = previous.y >= vec.y && next.y > vec.y
      if (above) split.push(current)
      else if (below) merge.push(current)
    }
  }
  for (let m = 0; m < merge.length; m++) {
    const point = merge[m]
    const vec = point.vec
    for (let k = point.index + 1; k < points.length; k++) {
      const diagonal = points[k]
      if (!safeDiagonal(points, vec, diagonal.vec)) continue
      point.merge = true
      point.diagonals.push(diagonal)
      diagonal.diagonals.push(point)
      break
    }
  }
  for (let s = 0; s < split.length; s++) {
    const point = split[s]
    const vec = point.vec
    for (let k = point.index - 1; k >= 0; k--) {
      const diagonal = points[k]
      if (!safeDiagonal(points, vec, diagonal.vec)) continue
      if (diagonal.merge) break
      point.diagonals.push(diagonal)
      diagonal.diagonals.push(point)
      if (diagonal.start) {
        monotone.push(new Start(diagonal, point))
      } else {
        if (diagonal.vec.x > vec.x) monotone.push(new Start(point, diagonal))
        else monotone.push(new Start(diagonal, point))
      }
      break
    }
  }
  return monotone
}

function find(points, vec) {
  for (let p = 0; p < points.length; p++) if (vec === points[p].vec) return points[p]
  return null
}

function skip(sector, floor) {
  if (floor === null) return false
  if (floor) return !sector.hasFloor()
  return !sector.hasCeiling()
}

class InnerReference {
  constructor(inner) {
    this.vecList = [inner.vecs]
    this.vecs = null
  }

  add(inner) {
    this.vecList.push(inner.vecs)
  }

  has(d) {
    for (let i = 0; i < this.vecList.length; i++) {
      const vecs = this.vecList[i]
      for (let v = 0; v < vecs.length; v++) if (vecs[v] === d) return true
    }
    return false
  }

  topLeft() {
    let top = null
    for (let i = 0; i < this.vecList.length; i++) {
      const vecs = this.vecList[i]
      for (let v = 0; v < vecs.length; v++) {
        const vec = vecs[v]
        if (top === null) {
          top = vec
          continue
        }
        if (vec.y < top.y) continue
        if (floatEq(vec.y, top.y) && vec.x > top.x) continue
        top = vec
      }
    }
    return top
  }

  startOf(top) {
    let start = null
    for (let v = 0; v < this.vecList.length; v++) {
      const vecs = this.vecList[v]
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
          if (floatEq(vec.x, start.x) && vec.y < start.y) continue
          start = vec
        }
      }
    }
    return start
  }

  next(previous, current) {
    let result = null
    for (let v = 0; v < this.vecList.length; v++) {
      const vecs = this.vecList[v]
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
      iter: for (let o = 0; o < other.vecs.length; o++) {
        const d = other.vecs[o]
        if (reference.has(d)) {
          reference.add(other)
          remaining.splice(r, 1)
          r--
          break iter
        }
      }
    }
  }
  for (let c = 0; c < clusters.length; c++) {
    const cluster = clusters[c]
    if (cluster.vecList.length === 1) {
      cluster.vecs = cluster.vecList[0]
      continue
    }
    const top = cluster.topLeft()
    const start = cluster.startOf(top)
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
    else console.warn('Multiple previous references:', original.vec)
    if (original.next === null) original.next = next
    else console.warn('Multiple next references:', original.vec)
  }
}

function populateVectors(vecs, points) {
  for (let v = 0; v < vecs.length; v++) {
    const vec = vecs[v]
    let exists = false
    for (let p = 0; p < points.length; p++) {
      const point = points[p]
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
  const inside = populateInside(sector.inside, floor)
  for (let i = 0; i < inside.length; i++) populateVectors(inside[i], points)
  for (let i = 0; i < inside.length; i++) populateReferences(inside[i], points, false)
  populateVectors(sector.vecs, points)
  populateReferences(sector.vecs, points, true)
  for (let i = 0; i < points.length; i++) points[i].index = i
  return points
}

function floorCeil(sector, floor, scale, triangles) {
  if (skip(sector, floor)) return
  const points = populate(sector, floor)
  const starting = classify(points)
  monotone(sector, floor, scale, starting, triangles)
}

export function sectorTriangulate(sector, scale) {
  floorCeil(sector, true, scale, sector.triangles)
  floorCeil(sector, false, scale, sector.triangles)
}

export function sectorTriangulateForEditor(sector, scale) {
  sectorTriangulate(sector, scale)
  floorCeil(sector, null, scale, sector.view)
}
