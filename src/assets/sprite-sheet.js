/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Sprite } from '../render/sprite.js'

const SPRITE_SCALE = 1.0 / 10.0

export function createSpriteSheet(width, height, list) {
  width = 1.0 / width
  height = 1.0 / height
  const sprites = new Map()
  for (let s = 0; s < list.length; s++) {
    const sprite = list[s]
    const name = sprite[0]
    const left = parseInt(sprite[1])
    const top = parseInt(sprite[2])
    const right = parseInt(sprite[3])
    const bottom = parseInt(sprite[4])
    sprites.set(name, new Sprite(left, top, right - left, bottom - top, 0.0, 0.0, width, height, SPRITE_SCALE))
  }
  return sprites
}
