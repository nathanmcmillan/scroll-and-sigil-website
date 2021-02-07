import {Sprite} from '../render/sprite.js'

const SCALE = 1.0 / 20.0

export function createSpriteSheet(texture, wad) {
  let sheetWidth = 1.0 / texture.width
  let sheetHeight = 1.0 / texture.height
  let sprites = new Map()
  for (const [name, sprite] of wad) {
    let left = parseInt(sprite[0])
    let top = parseInt(sprite[1])
    let width = parseInt(sprite[2])
    let height = parseInt(sprite[3])
    sprites.set(name, new Sprite(left, top, width, height, 0.0, 0.0, sheetWidth, sheetHeight, SCALE))
  }
  return sprites
}
