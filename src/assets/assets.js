import {Entity} from '../entity/entity.js'
import {fetchText, fetchImage} from '../client/net.js'
import {createSpriteSheet} from '../assets/sprite-sheet.js'
import * as Wad from '../wad/wad.js'

const PROMISES = []

const TEXTURE_NAME_TO_INDEX = new Map()
const TEXTURES = []

export function saveTexture(name, texture) {
  let index = TEXTURES.length
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
  let index = TEXTURE_NAME_TO_INDEX.get(name)
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
  let image = await fetchImage(directory + '/' + sprite + '/' + sprite + '.png')
  SPRITE_IMAGES.set(sprite, image)
}

const SPRITE_ATLASES = new Map()

async function promiseAtlas(sprite, directory) {
  if (SPRITE_ATLASES.has(sprite)) return
  let text = await fetchText(directory + '/' + sprite + '/' + sprite + '.wad')
  SPRITE_ATLASES.set(sprite, Wad.parse(text))
}

const ENTITIES = new Map()
const ASYNC_SPRITE_NAMES = new Set()

async function promiseEntity(name, directory, path) {
  if (ENTITIES.has(name)) {
    return
  }

  let text = await fetchText(directory + path)

  let wad = Wad.parse(text)
  wad.set('_wad', name)

  let sprite = wad.get('sprite')

  ENTITIES.set(name, new Entity(wad))

  directory += '/sprites'

  let image = promiseImage(sprite, directory)
  let atlas = promiseAtlas(sprite, directory)

  ASYNC_SPRITE_NAMES.add(sprite)

  await image
  await atlas
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

export function createNewTexturesAndSpriteSheets(closure) {
  for (const sprite of ASYNC_SPRITE_NAMES) {
    if (SPRITE_SHEETS.has(sprite)) continue
    let image = SPRITE_IMAGES.get(sprite)
    let texture = closure(image)
    let sheet = createSpriteSheet(texture, SPRITE_ATLASES.get(sprite))
    saveTexture(sprite, texture)
    saveSprites(sprite, sheet)
  }
  ASYNC_SPRITE_NAMES.clear()
}
