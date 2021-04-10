import { Wall } from '../map/wall.js'
import { FLAG_NOT_PHYSICAL, FLAG_PHYSICAL } from '../world/flags.js'

export class Line {
  constructor(top, middle, bottom, a, b, flags, trigger) {
    this.plus = null
    this.minus = null
    this.a = a
    this.b = b
    this.flags = flags
    this.trigger = trigger
    this.normal = this.a.normal(this.b)
    this.top = top >= 0 ? new Wall(top) : null
    this.middle = middle >= 0 ? new Wall(middle) : null
    this.bottom = bottom >= 0 ? new Wall(bottom) : null
    this.physical = this.middle !== null
    if (flags) {
      if (flags.get(FLAG_PHYSICAL)) this.physical = true
      else if (flags.get(FLAG_NOT_PHYSICAL)) this.physical = false
    }
  }

  updateSectorsForLine(scale) {
    const plus = this.plus
    const minus = this.minus
    const a = this.a
    const b = this.b
    const x = a.x - b.x
    const y = a.y - b.y
    const uv = 0.0
    const st = uv + Math.sqrt(x * x + y * y) * scale

    if (this.top) {
      let ceiling, top
      if (minus) {
        ceiling = minus.ceiling
        top = minus.top
      } else {
        ceiling = plus.ceiling
        top = plus.top
      }
      if (ceiling >= top) console.error(`Invalid top wall: ceiling := ${ceiling}, top := ${top}`)
      this.top.update(ceiling, top, uv, ceiling * scale, st, top * scale, a, b)
    }

    if (this.middle) {
      let floor, ceiling
      if (minus) {
        floor = minus.floorRenderHeight()
        ceiling = minus.ceiling
      } else {
        floor = plus.floorRenderHeight()
        ceiling = plus.ceiling
      }
      if (floor >= ceiling) console.error(`Invalid middle wall: floor := ${floor}, ceiling := ${ceiling}`)
      this.middle.update(floor, ceiling, uv, floor * scale, st, ceiling * scale, a, b)
    }

    if (this.bottom) {
      let bottom, floor
      if (plus && minus && plus.floorRenderHeight() < minus.floorRenderHeight()) {
        bottom = plus.floorRenderHeight()
        floor = minus.floorRenderHeight()
      } else if (minus) {
        bottom = minus.bottom
        floor = minus.floorRenderHeight()
      } else {
        bottom = plus.bottom
        floor = plus.floorRenderHeight()
      }
      if (bottom >= floor) console.error(`Invalid bottom wall: bottom := ${bottom}, floor := ${floor}`)
      this.bottom.update(bottom, floor, uv, bottom * scale, st, floor * scale, a, b)
    }
  }
}
