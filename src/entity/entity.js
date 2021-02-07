import {spritesByName} from '../assets/assets.js'

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

  animations() {
    let sheet = spritesByName(this.wad.get('sprite'))
    if (this.wad.has('animation')) {
      let animation = this.wad.get('animation')
      if (Array.isArray(animation)) {
        let list = []
        for (const sprite of animation) {
          list.push(sheet.get(sprite))
        }
        return list
      } else {
        return sheet.get(animation)
      }
    } else {
      let map = new Map()
      for (const [name, animation] of this.wad.get('animations')) {
        let entry = []
        for (const sprite of animation) {
          entry.push(sheet.get(sprite))
        }
        map.set(name, entry)
      }
      return map
    }
  }
}
