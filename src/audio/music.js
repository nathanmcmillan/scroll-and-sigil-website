import {zzfxm} from '/src/external/zzfxm.js'
import {zzfxb, zzfxt} from '/src/external/zzfx.js'

export function parse(str) {
  let music = []
  let stack = [music]
  let value = ''
  let pc = ''
  let len = str.length
  for (let i = 0; i < len; i++) {
    let c = str[i]
    if (c === '\n') {
      continue
    } else if (c === ',') {
      if (pc !== ']') {
        if (value === '') {
          stack[0].push(undefined)
        } else {
          stack[0].push(parseFloat(value))
          value = ''
        }
      }
      pc = c
    } else if (c === '[') {
      let array = []
      stack[0].push(array)
      stack.unshift(array)
      pc = c
    } else if (c === ']') {
      if (pc !== ',' && pc !== '[' && pc !== ']' && pc !== '\n') {
        if (value === '') {
          stack[0].push(undefined)
        } else {
          stack[0].push(parseFloat(value))
          value = ''
        }
      }
      stack.shift()
      pc = c
    } else {
      pc = c
      value += c
    }
  }
  music = music[0]
  music.push(undefined)
  return music
}

export class MusicNode {
  constructor(music) {
    this.contents = music
    this.music = null
    this.audio = null
    this.start = 0
    this.paused = 0
  }

  play() {
    this.start = 0
    this.paused = 0
    this.resume()
  }

  resume() {
    if (!this.music) this.music = zzfxm(...this.contents)
    let audio = this.audio
    if (audio) {
      audio.disconnect()
      audio.stop()
    }
    audio = zzfxb(...this.music)
    audio.loop = true
    this.audio = audio
    audio.start(0, this.paused)
    this.start = zzfxt() - this.paused
    this.paused = 0
  }

  pause() {
    let audio = this.audio
    if (!audio) return
    audio.disconnect()
    audio.stop()
    this.audio = null
    this.paused = zzfxt() - this.start
    if (this.paused < 0) this.paused = 0
  }
}
