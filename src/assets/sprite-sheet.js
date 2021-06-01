/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Sprite } from '../render/sprite.js'

const SPRITE_SCALE = 1.0 / 10.0

export class SpriteBox {
  constructor(name, left, top, right, bottom, tile) {
    this.name = name
    this.left = left
    this.top = top
    this.right = right
    this.bottom = bottom
    this.tile = tile
  }

  select(c, r) {
    return c >= this.left && c <= this.right && r >= this.top && r <= this.bottom
  }
}

export function createSpriteSheet(width, height, list) {
  width = 1.0 / width
  height = 1.0 / height
  const sprites = new Map()
  for (let s = 0; s < list.length; s++) {
    const sprite = list[s]
    sprites.set(sprite.name, new Sprite(sprite.left, sprite.top, sprite.right - sprite.left, sprite.bottom - sprite.top, 0.0, 0.0, width, height, SPRITE_SCALE))
  }
  return sprites
}
