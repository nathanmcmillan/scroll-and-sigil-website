/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { drawImage } from '../render/render.js'

const SW = 8
const SH = 8

const W = 128
const H = 128

const IW = 1.0 / W
const IH = 1.0 / H

const C = W / SW

export function sprcol(g, n, w, h, dx, dy, dw, dh, rd, grn, blu, alph) {
  const l = (n % C) * SW * IW
  const t = Math.floor(n / C) * SH * IH
  const r = l + w * SW * IW
  const b = t + h * SH * IH
  drawImage(g, dx, dy, dw, dh, rd, grn, blu, alph, l, t, r, b)
}

export function spr(g, n, w, h, dx, dy, dw, dh) {
  const l = (n % C) * SW * IW
  const t = Math.floor(n / C) * SH * IH
  const r = l + w * SW * IW
  const b = t + h * SH * IH
  drawImage(g, dx, dy, dw, dh, 1.0, 1.0, 1.0, 1.0, l, t, r, b)
}

export function sspr(g, sx, sy, sw, sh, dx, dy, dw, dh) {
  const l = sx * IW
  const t = sy * IH
  const r = l + sw * IW
  const b = t + sh * IH
  drawImage(g, dx, dy, dw, dh, 1.0, 1.0, 1.0, 1.0, l, t, r, b)
}
