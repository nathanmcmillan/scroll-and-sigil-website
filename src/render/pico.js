import {drawImage} from '../render/render.js'

const SW = 8
const SH = 8

const W = 128
const H = 128

const IW = 1.0 / W
const IH = 1.0 / H

const C = W / SW

export function sprcol(g, n, w, h, dx, dy, dw, dh, rd, grn, blu, alph) {
  let l = (n % C) * SW * IW
  let t = Math.floor(n / C) * SH * IH
  let r = l + w * SW * IW
  let b = t + h * SH * IH
  drawImage(g, dx, dy, dw, dh, rd, grn, blu, alph, l, t, r, b)
}

export function spr(g, n, w, h, dx, dy, dw, dh) {
  let l = (n % C) * SW * IW
  let t = Math.floor(n / C) * SH * IH
  let r = l + w * SW * IW
  let b = t + h * SH * IH
  drawImage(g, dx, dy, dw, dh, 1.0, 1.0, 1.0, 1.0, l, t, r, b)
}

export function sspr(g, sx, sy, sw, sh, dx, dy, dw, dh) {
  let l = sx * IW
  let t = sy * IH
  let r = l + sw * IW
  let b = t + sh * IH
  drawImage(g, dx, dy, dw, dh, 1.0, 1.0, 1.0, 1.0, l, t, r, b)
}
