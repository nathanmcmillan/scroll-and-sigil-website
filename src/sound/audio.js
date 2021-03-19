import { zzfxb, zzfxt } from '../external/zzfx.js'
import { zzfxm } from '../external/zzfxm.js'
import { SEMITONES, diatonic, pulse, waveFromName } from '../sound/synth.js'

export function parse(str) {
  let music = []
  const stack = [music]
  let value = ''
  let pc = ''
  const len = str.length
  for (let i = 0; i < len; i++) {
    const c = str[i]
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
      const array = []
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
    const audio = this.audio
    if (!audio) return
    audio.disconnect()
    audio.stop()
    this.audio = null
    this.paused = zzfxt() - this.start
    if (this.paused < 0) this.paused = 0
  }
}

export class SynthSound {
  constructor(content) {
    this.waveform = null
    this.pitch = 0.0
    this.seconds = 0.0
    this.amplitude = 0.0
    this.cycle = 0.0
    try {
      const sfx = content.split('\n')
      for (let i = 1; i < sfx.length; i++) {
        if (sfx[i] === 'end sound') break
        const line = sfx[i].split(' ')
        const key = line[0]
        const value = line[line.length - 1]
        if (key === 'wave') this.waveform = waveFromName(value.toLowerCase())
        else if (key === 'frequency') this.pitch = diatonic(parseInt(value) - SEMITONES)
        else if (key === 'duration') this.seconds = parseInt(value) / 1000.0
        else if (key === 'volume') this.amplitude = parseFloat(value)
        else if (key === 'pulse_cycle') this.cycle = parseFloat(value)
      }
    } catch (e) {
      console.error(e)
    }
  }

  play() {
    if (this.waveform === pulse) this.waveform(this.amplitude, this.pitch, this.cycle, this.seconds)
    else this.waveform(this.amplitude, this.pitch, this.seconds)
  }
}
