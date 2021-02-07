import {Wall} from '../map/wall.js'

export function lineNullSectors(lines) {
  for (const line of lines) {
    line.plus = null
    line.minus = null
  }
}

export class Line {
  constructor(top, middle, bottom, a, b) {
    this.plus = null
    this.minus = null
    this.a = a
    this.b = b
    this.normal = this.a.normal(this.b)
    this.top = top >= 0 ? new Wall(top) : null
    this.middle = middle >= 0 ? new Wall(middle) : null
    this.bottom = bottom >= 0 ? new Wall(bottom) : null
    this.physical = this.middle !== null
  }

  updateSectors(plus, minus, scale) {
    this.plus = plus
    this.minus = minus

    let x = this.a.x - this.b.x
    let y = this.a.y - this.b.y
    let uv = 0.0
    let st = uv + Math.sqrt(x * x + y * y) * scale

    if (this.top) {
      let flip = false
      let a = this.a
      let b = this.b
      let ceiling = null
      let top = null
      if (plus) {
        ceiling = plus.ceiling
        top = plus.top
      }
      if (minus) {
        if (ceiling === null) {
          ceiling = minus.ceiling
          top = minus.top
        } else if (ceiling < minus.ceiling) {
          ceiling = minus.ceiling
          top = minus.top
        }
      }
      if (ceiling >= top) console.error('invalid top wall:', ceiling, top)
      if (flip) {
        let temp = a
        a = b
        b = temp
      }
      this.top.update(ceiling, top, uv, ceiling * scale, st, top * scale, a, b)
    }

    if (this.middle) {
      let flip = false
      let a = this.a
      let b = this.b
      let floor = null
      let ceiling = null
      if (plus) {
        floor = plus.floor
        ceiling = plus.ceiling
      }
      if (minus) {
        if (floor === null) {
          floor = minus.floor
          ceiling = minus.ceiling
        } else if (floor < minus.floor) {
          floor = minus.floor
          ceiling = minus.ceiling
        }
      }
      if (floor >= ceiling) console.error('invalid middle wall:', floor, ceiling)
      if (flip) {
        let temp = a
        a = b
        b = temp
      }
      this.middle.update(floor, ceiling, uv, floor * scale, st, ceiling * scale, a, b)
    }

    if (this.bottom) {
      let flip = false
      let a = this.a
      let b = this.b
      let bottom = null
      let floor = null
      if (plus) {
        bottom = plus.bottom
        floor = plus.floor
      }
      if (minus) {
        if (bottom === null) {
          bottom = minus.bottom
          floor = minus.floor
        } else {
          if (minus.floor > floor) floor = minus.floor
          if (minus.bottom < bottom) bottom = minus.bottom
          flip = true
        }
      }
      if (bottom >= floor) console.error('invalid bottom wall:', bottom, floor)
      if (flip) {
        let temp = a
        a = b
        b = temp
      }
      this.bottom.update(bottom, floor, uv, bottom * scale, st, floor * scale, a, b)
    }
  }
}
