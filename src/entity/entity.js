/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { spritesByName, textureIndexForName } from '../assets/assets.js'

export function spriteInfo(value) {
  return value.split('|')
}

export function spriteName(value) {
  return spriteInfo(value)[0]
}

export class Stamp {
  constructor(texture, sprite) {
    this.texture = texture
    this.sprite = sprite
  }
}

export class Entity {
  constructor(wad) {
    this.wad = wad
    this.cache = null
  }

  has(key) {
    return this.wad.has(key)
  }

  get(key) {
    return this.wad.get(key)
  }

  id() {
    return this.wad.get('_wad')
  }

  name() {
    return this.wad.get('name')
  }

  group() {
    return this.wad.get('group')
  }

  box() {
    return parseFloat(this.wad.get('box'))
  }

  height() {
    return parseFloat(this.wad.get('height'))
  }

  speed() {
    return parseFloat(this.wad.get('speed'))
  }

  sight() {
    return parseFloat(this.wad.get('sight'))
  }

  health() {
    return parseInt(this.wad.get('health'))
  }

  stamina() {
    return parseInt(this.wad.get('stamina'))
  }

  experience() {
    const experience = this.wad.get('experience')
    if (experience) return parseInt(experience)
    return 0
  }

  spriteName() {
    return spriteName(this.wad.get('sprite'))
  }

  spriteInfo() {
    return spriteInfo(this.wad.get('sprite'))
  }

  stamp() {
    if (this.cache) return this.cache
    const info = this.spriteInfo()
    const sheet = spritesByName(info[0])
    const texture = textureIndexForName(info[0])
    const sprite = sheet.get(info[1])
    const stamp = new Stamp(texture, sprite)
    this.cache = stamp
    return stamp
  }

  stamps() {
    if (this.cache) return this.cache
    const sprites = this.wad.get('sprites')
    if (Array.isArray(sprites)) {
      const list = []
      for (let i = 0; i < sprites.length; i++) {
        const item = sprites[i]
        const info = spriteInfo(item)
        const sheet = spritesByName(info[0])
        const texture = textureIndexForName(info[0])
        const sprite = sheet.get(info[1])
        list.push(new Stamp(texture, sprite))
      }
      this.cache = list
      return list
    }
    const map = new Map()
    for (const [name, value] of sprites) {
      const entry = []
      for (const item of value) {
        const info = spriteInfo(item)
        const sheet = spritesByName(info[0])
        const texture = textureIndexForName(info[0])
        const sprite = sheet.get(info[1])
        entry.push(new Stamp(texture, sprite))
      }
      map.set(name, entry)
    }
    this.cache = map
    return map
  }
}

export function entityWadToTape(wad) {
  let content = ''
  for (const [key, value] of wad) {
    content += `${key} ${value}\n`
  }
  return content
}
