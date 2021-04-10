import { createSpriteSheet } from '../assets/sprite-sheet.js'
import { fetchText } from '../client/net.js'
import { Entity, spriteName } from '../entity/entity.js'
import * as Wad from '../wad/wad.js'

const PROMISES = []

const TEXTURE_NAME_TO_INDEX = new Map()
const TEXTURES = []

export function readPaintFile(text, palette) {
  const image = text.split('\n')

  const info = image[0].split(' ')

  const name = info[1]
  const width = parseInt(info[2])
  const height = parseInt(info[3])
  const pixels = new Uint8Array(width * height * 3)

  let index = 1
  let transparency = 0

  if (image[index].startsWith('transparency')) {
    transparency = parseInt(image[index].split(' ')[1])
    index++
  }

  for (let h = 0; h < height; h++) {
    const row = image[index].split(' ')
    for (let c = 0; c < width; c++) {
      let p = parseInt(row[c])
      let red, green, blue
      if (p === transparency) {
        red = 255
        green = 255
        blue = 255
      } else {
        p *= 3
        red = palette[p]
        green = palette[p + 1]
        blue = palette[p + 2]
      }
      const i = (c + h * width) * 3
      pixels[i] = red
      pixels[i + 1] = green
      pixels[i + 2] = blue
    }
    index++
  }

  let sprites = null
  if (index < image.length) {
    if (image[index] === 'sprites') {
      index++
      while (index < image.length) {
        if (image[index] === 'end sprites') break
        const sprite = image[index].split(' ')
        if (sprites === null) sprites = []
        sprites.push(sprite)
        index++
      }
    }
  }

  return { name: name, wrap: 'clamp', width: width, height: height, pixels: pixels, sprites: sprites }
}

export function readPaintFileAsLookup(text) {
  const image = text.split('\n')

  const info = image[0].split(' ')

  const name = info[1]
  const width = parseInt(info[2])
  const height = parseInt(info[3])
  const pixels = new Uint8Array(width * height)

  let index = 1
  let transparency = 0

  if (image[index].startsWith('transparency')) {
    transparency = parseInt(image[index].split(' ')[1])
    index++
  }

  for (let h = 0; h < height; h++) {
    const row = image[index].split(' ')
    for (let c = 0; c < width; c++) {
      const i = c + h * width
      const p = parseInt(row[c])
      if (p === transparency) pixels[i] = 255
      else pixels[i] = p
    }
    index++
  }

  let sprites = null
  if (index < image.length) {
    if (image[index] === 'sprites') {
      index++
      while (index < image.length) {
        if (image[index] === 'end sprites') break
        const sprite = image[index].split(' ')
        if (sprites === null) sprites = []
        sprites.push(sprite)
        index++
      }
    }
  }

  return { name: name, wrap: 'clamp', width: width, height: height, pixels: pixels, sprites: sprites }
}

export function saveTexture(name, texture) {
  const index = TEXTURES.length
  TEXTURE_NAME_TO_INDEX.set(name, index)
  TEXTURES.push(texture)
  return index
}

export function textureByIndex(index) {
  return TEXTURES[index]
}

export function textureIndexForName(name) {
  return TEXTURE_NAME_TO_INDEX.get(name)
}

export function textureNameFromIndex(search) {
  for (const [name, index] of TEXTURE_NAME_TO_INDEX) {
    if (search === index) return name
  }
  return null
}

export function textureByName(name) {
  const index = TEXTURE_NAME_TO_INDEX.get(name)
  return TEXTURES[index]
}

export function textureList() {
  return Array.from(TEXTURE_NAME_TO_INDEX.keys())
}

export function textureCount() {
  return TEXTURES.length
}

const TILES = []

export function saveTile(name, texture) {
  TILES.push(name)
  return saveTexture(name, texture)
}

export function tileList() {
  return TILES
}

export function tileCount() {
  return TILES.length
}

const SPRITE_IMAGES = new Map()

async function promiseImage(sprite, directory) {
  if (SPRITE_IMAGES.has(sprite)) return
  const image = await fetchText(directory + '/' + sprite + '.txt')
  SPRITE_IMAGES.set(sprite, image)
}

const ENTITIES = new Map()
const ASYNC_SPRITE_NAMES = new Set()

async function promiseEntity(name, directory, path) {
  if (ENTITIES.has(name)) {
    return
  }

  const text = await fetchText(directory + path)

  const wad = Wad.parse(text)
  wad.set('_wad', name)

  ENTITIES.set(name, new Entity(wad))

  const set = new Set()

  const sprite = wad.get('sprite')
  if (sprite) {
    set.add(spriteName(sprite))
  } else {
    const sprites = wad.get('sprites')
    if (Array.isArray(sprites)) {
      for (const sprite of sprites) {
        set.add(spriteName(sprite))
      }
    } else {
      for (const value of sprites.values()) {
        for (const sprite of value) set.add(spriteName(sprite))
      }
    }
  }

  directory += '/sprites'

  for (const sprite of set) {
    const image = promiseImage(sprite, directory)
    ASYNC_SPRITE_NAMES.add(sprite)
    await image
  }
}

export function saveEntity(name, directory, path) {
  PROMISES.push(promiseEntity(name, directory, path))
}

export function entityByName(name) {
  return ENTITIES.get(name)
}

export function entityList() {
  return Array.from(ENTITIES.keys())
}

export async function waitForResources() {
  await Promise.all(PROMISES)
  PROMISES.length = 0
}

const SPRITE_SHEETS = new Map()

export function saveSprites(name, sprites) {
  SPRITE_SHEETS.set(name, sprites)
}

export function spritesByName(name) {
  return SPRITE_SHEETS.get(name)
}

const trueColor = false

export function createNewTexturesAndSpriteSheets(palette, closure) {
  for (const sprite of ASYNC_SPRITE_NAMES) {
    if (SPRITE_SHEETS.has(sprite)) continue
    const image = SPRITE_IMAGES.get(sprite)
    let paint
    if (trueColor) paint = readPaintFile(image, palette)
    else paint = readPaintFileAsLookup(image)
    const texture = closure(paint)
    saveTexture(sprite, texture)
    if (paint.sprites) {
      const sheet = createSpriteSheet(texture.width, texture.height, paint.sprites)
      saveSprites(sprite, sheet)
    }
  }
  ASYNC_SPRITE_NAMES.clear()
}
