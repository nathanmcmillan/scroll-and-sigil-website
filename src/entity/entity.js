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
  }

  has(key) {
    return this.wad.has(key)
  }

  get(key) {
    return this.wad.get(key)
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

  spriteName() {
    return spriteName(this.wad.get('sprite'))
  }

  spriteInfo() {
    return spriteInfo(this.wad.get('sprite'))
  }

  stamp() {
    const info = this.spriteInfo()
    const sheet = spritesByName(info[0])
    const texture = textureIndexForName(info[0])
    const sprite = sheet.get(info[1])
    return new Stamp(texture, sprite)
  }

  stamps() {
    const sprites = this.wad.get('sprites')
    if (Array.isArray(sprites)) {
      const list = []
      for (const item of sprites) {
        const info = spriteInfo(item)
        const sheet = spritesByName(info[0])
        const texture = textureIndexForName(info[0])
        const sprite = sheet.get(info[1])
        list.push(new Stamp(texture, sprite))
      }
      return list
    } else {
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
      return map
    }
  }
}

export function entityWadToTape(wad) {
  let content = ''
  for (const [key, value] of wad) {
    content += `${key} ${value}\n`
  }
  return content
}
