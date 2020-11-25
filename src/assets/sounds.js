import {fetchText} from '/src/client/net.js'
import {MusicNode} from '/src/audio/music.js'
import * as Music from '/src/audio/music.js'

const SOUNDS = new Map()
const MUSIC_TABLE = new Map()

let MUSIC = null

export function saveSound(name, path) {
  if (SOUNDS.has(name)) return
  SOUNDS.set(name, new Audio(path))
}

export function playSound(name) {
  let sound = SOUNDS.get(name)
  sound.pause()
  sound.volume = 0.25
  sound.currentTime = 0
  let promise = sound.play()
  if (promise) promise.then(() => {}).catch(() => {})
}

export async function saveMusic(name, path) {
  if (MUSIC_TABLE.has(name)) return
  let dot = path.lastIndexOf('.')
  if (dot === -1) throw 'Extension missing: ' + path
  let extension = path.substring(dot + 1)
  if (extension === 'zzfxm') {
    let contents = Music.parse(await fetchText(path))
    MUSIC_TABLE.set(name, new MusicNode(contents))
  } else {
    MUSIC_TABLE.set(name, new Audio(path))
  }
}

export function playMusic(name) {
  let music = MUSIC_TABLE.get(name)
  if (!music) {
    console.error('Music not loaded yet:', name)
    return
  }
  pauseMusic()
  MUSIC = music
  if (music.constructor === MusicNode) {
    music.play()
  } else {
    music.loop = true
    music.volume = 0.25
    music.currentTime = 0
    let promise = music.play()
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
