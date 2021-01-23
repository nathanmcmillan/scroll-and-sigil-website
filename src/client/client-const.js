import {FONT_HEIGHT_BASE} from '/src/render/render.js'

export function calcFontScale(scale) {
  return Math.floor(2 * scale)
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
