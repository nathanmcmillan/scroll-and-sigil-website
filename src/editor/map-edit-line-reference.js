import { WallReference } from '../editor/map-edit-wall-reference.js'
import { triggerExport } from '../world/trigger.js'
import { flagsExport } from '../world/flags.js'

export class LineReference {
  constructor(bottom, middle, top, a, b, flags, trigger) {
    this.plus = null
    this.minus = null
    this.a = a
    this.b = b
    this.flags = flags
    this.trigger = trigger
    this.bottom = new WallReference(bottom)
    this.middle = new WallReference(middle)
    this.top = new WallReference(top)
    this.index = 0
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

    if (this.top.use()) {
      let ceiling, top
      if (minus) {
        ceiling = minus.ceiling
        top = minus.top
      } else {
        ceiling = plus.ceiling
        top = plus.top
      }
      if (ceiling >= top) console.warn(`Invalid top wall: ceiling := ${ceiling}, top := ${top}, ${this.top.texture}`)
      this.top.update(ceiling, top, uv, ceiling * scale, st, top * scale, a, b)
    }

    if (this.middle.use()) {
      let floor, ceiling
      if (minus) {
        floor = minus.floorRenderHeight()
        ceiling = minus.ceiling
      } else {
        floor = plus.floorRenderHeight()
        ceiling = plus.ceiling
      }
      if (floor >= ceiling) console.warn(`Invalid middle wall: floor := ${floor}, ceiling := ${ceiling}, ${this.middle.texture}`)
      this.middle.update(floor, ceiling, uv, floor * scale, st, ceiling * scale, a, b)
    }

    if (this.bottom.use()) {
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
      if (bottom >= floor) console.warn(`Invalid bottom wall: bottom := ${bottom}, floor := ${floor}, ${this.bottom.texture}`)
      this.bottom.update(bottom, floor, uv, bottom * scale, st, floor * scale, a, b)
    }
  }

  has(vec) {
    return this.a === vec || this.b === vec
  }

  other(vec) {
    if (this.a === vec) return this.b
    if (this.b === vec) return this.a
    return null
  }

  topTextureName() {
    return this.top.textureName()
  }

  middleTextureName() {
    return this.middle.textureName()
  }

  bottomTextureName() {
    return this.bottom.textureName()
  }

  topOffset() {
    return this.top.offset
  }

  middleOffset() {
    return this.middle.offset
  }

  bottomOffset() {
    return this.bottom.offset
  }

  export() {
    let content = `${this.a.index} ${this.b.index}`
    content += ` ${this.topTextureName()}`
    content += ` ${this.middleTextureName()}`
    content += ` ${this.bottomTextureName()}`
    content += ` ${this.topOffset()}`
    content += ` ${this.middleOffset()}`
    content += ` ${this.bottomOffset()}`
    if (this.flags) content += ` flags ${flagsExport(this.flags)} end`
    if (this.trigger) content += ` trigger ${triggerExport(this.trigger)} end`
    return content
  }

  static copy(line) {
    const top = line.top ? line.top.texture : -1
    const middle = line.middle ? line.middle.texture : -1
    const bottom = line.bottom ? line.bottom.texture : -1
    const copy = new LineReference(bottom, middle, top, line.a, line.b, line.flags, line.trigger)
    WallReference.transfer(line.bottom, copy.bottom)
    WallReference.transfer(line.middle, copy.middle)
    WallReference.transfer(line.top, copy.top)
    return copy
  }
}
