/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { TIC_FONT } from '../render/render.js'

export function defaultFont() {
  return TIC_FONT
}

export function calcFontScale(scale) {
  return Math.floor(scale * 1.5)
}

export function calcFontPad(fontHeight) {
  return Math.floor(0.4 * fontHeight)
}

export function calcThickness(scale) {
  return 2 * scale
}

export function calcTopBarHeight(scale) {
  return (defaultFont().base + 2) * calcFontScale(scale)
}

export function calcBottomBarHeight(scale) {
  return (defaultFont().base + 2) * calcFontScale(scale)
}

export function calcLongest(list) {
  let high = list[0].length
  for (let i = 1; i < list.length; i++) {
    const len = list[i].length
    if (len > high) high = len
  }
  return high
}
