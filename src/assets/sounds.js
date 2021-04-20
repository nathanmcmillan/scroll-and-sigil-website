/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { fetchText } from '../client/net.js'
import { MusicNode, parse, SynthSound } from '../sound/audio.js'

const SOUNDS = new Map()
const MUSIC_TABLE = new Map()

let MUSIC = null

export async function saveSound(name, path) {
  const dot = name.lastIndexOf('.')
  if (dot > 0) {
    path += name
    name = name.substring(0, dot)
  } else {
    path += name + '.wav'
  }
  if (SOUNDS.has(name)) return
  if (path.endsWith('.wav')) SOUNDS.set(name, new Audio(path))
  else {
    const contents = await fetchText(path)
    SOUNDS.set(name, new SynthSound(contents))
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
  if (MUSIC_TABLE.has(name)) return
  const dot = path.lastIndexOf('.')
  if (dot === -1) throw 'Extension missing: ' + path
  const extension = path.substring(dot + 1)
  if (extension === 'zzfxm') {
    const contents = parse(await fetchText(path))
    MUSIC_TABLE.set(name, new MusicNode(contents))
  } else {
    MUSIC_TABLE.set(name, new Audio(path))
  }
}

export function playMusic(name) {
  const music = MUSIC_TABLE.get(name)
  if (!music) {
    console.error('Music not loaded:', name)
    return
  }
  pauseMusic()
  MUSIC = music
  if (music.constructor === MusicNode) {
    music.play()
  } else {
    music.loop = true
    music.volume = 0.1
    music.currentTime = 0
    const promise = music.play()
    if (promise) promise.then(() => {}).catch(() => {})
  }
}

export function resumeMusic() {
  if (!MUSIC) return
  if (MUSIC.constructor === MusicNode) MUSIC.resume()
  else MUSIC.play()
}

export function pauseMusic() {
  if (!MUSIC) return
  MUSIC.pause()
}
