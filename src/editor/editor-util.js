import {FONT_HEIGHT_BASE} from '/src/render/render.js'

export function calcFontScale(scale) {
  return Math.floor(2 * scale)
}

export function calcFontPad(fontHeight) {
  return Math.floor(0.2 * fontHeight)
}

export function calcThickness(scale) {
  return 2 * scale
}

export function calcTopBarHeight(scale) {
  //   return 16 * scale
  return (FONT_HEIGHT_BASE + 2) * calcFontScale(scale)
}

export function calcBottomBarHeight(scale) {
  return (FONT_HEIGHT_BASE + 2) * calcFontScale(scale)
}

export function calcLongest(list) {
  let high = list[0].length
  for (let i = 1; i < list.length; i++) {
    let len = list[i].length
    if (len > high) high = len
  }
  return high
}

export class Dialogue {
  constructor(id, title, options, callbacks = null) {
    this.id = id
    this.title = title
    this.options = options
    this.callbacks = callbacks
    this.pos = 0
  }

  reset() {
    this.pos = 0
  }
}
