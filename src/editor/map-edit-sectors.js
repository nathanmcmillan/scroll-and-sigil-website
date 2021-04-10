import { sectorInsideOutside, sectorLineNeighbors } from '../map/sector.js'
import { clockwiseInterior, clockwiseReflex, sectorTriangulateForEditor } from '../map/triangulate.js'
import { WORLD_SCALE } from '../world/world.js'
import { SectorReference } from './map-edit-sector-reference.js'

function resetLineFacing(lines) {
  for (const line of lines) {
    line.plus = null
    line.minus = null
  }
}

function checkLines(lines) {
  for (const line of lines) {
    if (line.plus === null && line.minus === null) {
      console.warn('Line not linked to sectors:', line)
    }
  }
}

function match(src, dest) {
  if (src.vecs.length !== dest.vecs.length) return false
  for (const a of src.vecs) {
    if (dest.vecs.indexOf(a) === -1) return false
  }
  return true
}

function transfer(previous, sectors) {
  let s = sectors.length
  while (s--) {
    const sector = sectors[s]
    let i = previous.length
    while (i--) {
      const old = previous[i]
      if (match(old, sector)) {
        old.copy(sector)
        previous.splice(i, 1)
        break
      }
    }
  }
}

function isDuplicate(sectors, vecs) {
  for (const sector of sectors) {
    if (vecs.length !== sector.vecs.length) continue
    let duplicate = true
    for (const s of sector.vecs) {
      if (vecs.indexOf(s) === -1) {
        duplicate = false
        break
      }
    }
    if (duplicate) return true
  }
  return false
}

function isClockwise(vecs) {
  let sum = 0.0
  const len = vecs.length
  for (let i = 0; i < len; i++) {
    const k = i + 1 === len ? 0 : i + 1
    sum += (vecs[k].x - vecs[i].x) * (vecs[k].y + vecs[i].y)
  }
  return sum >= 0.0
}

function isFirstTop(a, b) {
  return a.y < b.y
}

function isSecondTop(a, b, c) {
  return c.y <= b.y && clockwiseReflex(a, b, c)
}

function construct(editor, sectors, start) {
  let a = start.a
  let b = start.b
  if (!isFirstTop(a, b)) {
    a = start.b
    b = start.a
  }
  const vecs = [a, b]
  const lines = [start]
  let origin = a
  let initial = true
  while (true) {
    let second = null
    let next = null
    let best = Number.MAX_VALUE
    let reverse = false
    for (const line of editor.lines) {
      if (line === start || !line.has(b)) continue
      const c = line.other(b)
      if (initial && !isSecondTop(a, b, c)) continue
      let interior = clockwiseInterior(a, b, c)
      let winding = false
      if (initial && interior >= Math.PI) {
        interior = clockwiseInterior(c, b, a)
        winding = true
      }
      if (interior < best) {
        second = line
        next = c
        best = interior
        reverse = winding
      }
    }
    if (second === null) return [null, null]
    if (initial) {
      if (reverse) {
        a = next
        origin = a
        vecs[0] = a
        next = start.a
        lines[0] = second
        second = start
        start = lines[0]
      }
      initial = false
    }
    if (next === origin) {
      lines.push(second)
      return [vecs, lines]
    }
    if (vecs.indexOf(next) >= 0) return [null, null]
    vecs.push(next)
    lines.push(second)
    a = b
    b = next
    start = second
  }
}

export function computeSectors(editor) {
  const sectors = []
  for (const line of editor.lines) {
    const [vecs, lines] = construct(editor, sectors, line)
    if (vecs === null || lines.length < 3) continue
    if (isDuplicate(sectors, vecs)) continue
    if (!isClockwise(vecs)) continue
    let bottom = 0.0
    let floor = 0.0
    let ceiling = 0.0
    let top = 0.0
    let floorTexture = null
    let ceilingTexture = null
    let type = null
    let trigger = null
    if (editor.defaultSector) {
      const sector = editor.defaultSector
      bottom = sector.bottom
      floor = sector.floor
      ceiling = sector.ceiling
      top = sector.top
      floorTexture = sector.floorTexture
      ceilingTexture = sector.ceilingTexture
      type = sector.type
      trigger = sector.trigger
    }
    sectors.push(new SectorReference(bottom, floor, ceiling, top, floorTexture, ceilingTexture, type, trigger, vecs, lines))
  }

  transfer(editor.sectors, sectors)
  sectorInsideOutside(sectors)

  for (const sector of sectors) {
    try {
      sectorTriangulateForEditor(sector, WORLD_SCALE)
    } catch (e) {
      console.error(e)
    }
  }

  resetLineFacing(editor.lines)
  sectorLineNeighbors(sectors, editor.lines, WORLD_SCALE)
  checkLines(editor.lines)

  editor.sectors = sectors
}
