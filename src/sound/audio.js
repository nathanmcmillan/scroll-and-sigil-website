/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { zzfxb, zzfxt } from '../external/zzfx.js'
import { zzfxm } from '../external/zzfxm.js'
import { newSynthParameters, synth, SYNTH_ARGUMENTS, WAVEFORMS } from '../sound/synth.js'

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
    this.parameters = newSynthParameters()
    try {
      const sfx = content.split('\n')
      for (let i = 1; i < sfx.length; i++) {
        if (sfx[i] === 'end sound') break
        const line = sfx[i].split(' ')
        const name = line[0]
        const value = line[1]
        for (let a = 0; a < SYNTH_ARGUMENTS.length; a++) {
          if (SYNTH_ARGUMENTS[a].toLowerCase() === name) {
            if (name === 'wave') {
              for (let w = 0; w < WAVEFORMS.length; w++) {
                if (WAVEFORMS[w].toLowerCase() === value) {
                  this.parameters[a] = w
                  break
                }
              }
            } else {
              this.parameters[a] = parseFloat(value)
            }
            break
          }
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  play() {
    synth(this.parameters)
  }
}
