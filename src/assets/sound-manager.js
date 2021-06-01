/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { fetchText } from '../client/net.js'
import { SynthMusic, SynthSound } from '../sound/sound.js'

const SOUNDS = new Map()
const MUSIC_TABLE = new Map()

let MUSIC = null
let MUSIC_VOLUME = 5

let SOUND_VOLUME = 5

export function soundList() {
  return SOUNDS
}

export function soundVolume() {
  return SOUND_VOLUME
}

export function setSoundVolume(value) {
  SOUND_VOLUME = value
}

export function musicVolume() {
  return MUSIC_VOLUME
}

export function setMusicVolume(value) {
  MUSIC_VOLUME = value
}
export function saveSynthSound(name, content) {
  SOUNDS.set(name, new SynthSound(content))
}

export async function saveSound(name, path) {
  const dot = name.lastIndexOf('.')
  if (dot > 0) {
    path += name
    name = name.substring(0, dot)
  } else {
    path += name + '.wad'
  }
  if (SOUNDS.has(name)) return
  if (path.endsWith('.wav')) SOUNDS.set(name, new Audio(path))
  else {
    const content = await fetchText(path)
    saveSynthSound(name, content)
  }
}

export function playSound(name) {
  const sound = SOUNDS.get(name)
  if (!sound) {
    console.error('Sound not loaded:', name)
    return
  }
  if (sound instanceof Audio) {
    sound.pause()
    sound.volume = 0.1
    sound.currentTime = 0
    const promise = sound.play()
    if (promise) promise.then(() => {}).catch(() => {})
  } else {
    sound.play()
  }
}

export async function saveMusic(name, path) {
  const dot = name.lastIndexOf('.')
  if (dot > 0) {
    path += name
    name = name.substring(0, dot)
  } else {
    path += name + '.wad'
  }
  if (MUSIC_TABLE.has(name)) return
  if (path.endsWith('.wav')) MUSIC_TABLE.set(name, new Audio(path))
  else {
    const contents = await fetchText(path)
    MUSIC_TABLE.set(name, new SynthMusic(contents))
  }
}

export function playMusic(name) {
  const music = MUSIC_TABLE.get(name)
  if (!music) {
    console.error('Music not loaded:', name)
    return
  }
  music_pause()
  MUSIC = music
  if (MUSIC_VOLUME === 0) return
  if (music instanceof Audio) {
    music.loop = true
    music.volume = MUSIC_VOLUME / 10.0
    music.currentTime = 0
    const promise = music.play()
    if (promise) promise.then(() => {}).catch(() => {})
  } else {
    music.play()
  }
}

export function music_tick() {
  if (!MUSIC || MUSIC_VOLUME === 0) return
  if (MUSIC instanceof Audio) return
  MUSIC.update()
}

export function music_resume() {
  if (!MUSIC || MUSIC_VOLUME === 0) return
  if (MUSIC instanceof Audio) MUSIC.play()
  else MUSIC.resume()
}

export function music_pause() {
  if (!MUSIC || MUSIC_VOLUME === 0) return
  MUSIC.pause()
}
