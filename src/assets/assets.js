/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { createSpriteSheet, SpriteBox } from '../assets/sprite-sheet.js'
import { fetchText } from '../client/net.js'
import { Entity, spriteName } from '../entity/entity.js'
import { wad_parse } from '../wad/wad.js'

const PROMISES = []

const TEXTURE_NAME_TO_INDEX = new Map()
const TEXTURES = []

export const TRUE_COLOR = true

export function readPaintFile(content, palette) {
  const wad = wad_parse(content)

  const name = wad.get('paint')
  const width = parseInt(wad.get('columns'))
  const height = parseInt(wad.get('rows'))

  let transparency = 0

  if (wad.has('transparency')) {
    transparency = parseInt(wad.get('transparency'))
  }

  const pixels = wad.get('pixels')

  const out = new Uint8Array(width * height * 3)

  for (let h = 0; h < height; h++) {
    const row = h * width
    for (let c = 0; c < width; c++) {
      const i = c + row
      let p = parseInt(pixels[i])
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
      const o = i * 3
      out[o] = red
      out[o + 1] = green
      out[o + 2] = blue
    }
  }

  let sprites = null

  if (wad.has('sprites')) {
    const array = wad.get('sprites')
    for (const sprite of array) {
      const name = sprite.get('id')
      const left = parseInt(sprite.get('left'))
      const top = parseInt(sprite.get('top'))
      const right = parseInt(sprite.get('right'))
      const bottom = parseInt(sprite.get('bottom'))
      const tile = sprite.has('tile')

      if (sprites === null) sprites = []
      sprites.push(new SpriteBox(name, left, top, right, bottom, tile))
    }
  }

  return { name: name, wrap: 'clamp', width: width, height: height, pixels: out, sprites: sprites }
}

export function readPaintFileAsLookup(content) {
  const wad = wad_parse(content)

  const name = wad.get('paint')
  const width = parseInt(wad.get('columns'))
  const height = parseInt(wad.get('rows'))

  let transparency = 0

  if (wad.has('transparency')) {
    transparency = parseInt(wad.get('transparency'))
  }

  const pixels = wad.get('pixels')

  const out = new Uint8Array(width * height)

  for (let h = 0; h < height; h++) {
    const row = h * width
    for (let c = 0; c < width; c++) {
      const i = c + row
      const p = parseInt(pixels[c])
      if (p === transparency) out[i] = 255
      else out[i] = p
    }
  }

  let sprites = null

  if (wad.has('sprites')) {
    const array = wad.get('sprites')
    for (const sprite of array) {
      const name = sprite.get('id')
      const left = parseInt(sprite.get('left'))
      const top = parseInt(sprite.get('top'))
      const right = parseInt(sprite.get('right'))
      const bottom = parseInt(sprite.get('bottom'))
      const tile = sprite.has('tile')

      if (sprites === null) sprites = []
      sprites.push(new SpriteBox(name, left, top, right, bottom, tile))
    }
  }

  return { name: name, wrap: 'clamp', width: width, height: height, pixels: out, sprites: sprites }
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
  const image = await fetchText(directory + '/' + sprite + '.wad')
  SPRITE_IMAGES.set(sprite, image)
}

const ENTITIES = new Map()
const ASYNC_SPRITE_NAMES = new Set()

async function promiseEntity(name, directory, path) {
  if (ENTITIES.has(name)) {
    return
  }

  const text = await fetchText(directory + path)

  const wad = wad_parse(text)
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

export function createNewTexturesAndSpriteSheets(palette, closure) {
  for (const sprite of ASYNC_SPRITE_NAMES) {
    if (SPRITE_SHEETS.has(sprite)) continue
    const image = SPRITE_IMAGES.get(sprite)
    let paint
    if (TRUE_COLOR) paint = readPaintFile(image, palette)
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
