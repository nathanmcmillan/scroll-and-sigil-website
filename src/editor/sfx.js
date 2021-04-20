/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { fetchText } from '../client/net.js'
import { Dialog } from '../gui/dialog.js'
import { BUTTON_A, BUTTON_B, BUTTON_X } from '../input/input.js'
import {
  ACCEL,
  ATTACK,
  BIT_CRUSH,
  CYCLE,
  DECAY,
  DISTORTION,
  FREQ,
  HIGH_PASS,
  JERK,
  LENGTH,
  LOW_PASS,
  newSynthParameters,
  NOISE,
  RELEASE,
  REPEAT,
  SPEED,
  SUSTAIN,
  synth,
  SYNTH_ARGUMENTS,
  TREMOLO_FREQ,
  TREMOLO_PERC,
  TREMOLO_WAVE,
  VIBRATO_FREQ,
  VIBRATO_PERC,
  VIBRATO_WAVE,
  VOLUME,
  WAVE,
  WAVEFORMS,
} from '../sound/synth.js'
import { dusk0, dusk1, dusk2, silver0, silver1, silver2 } from './palette.js'

const INPUT_RATE = 128

export class SfxEdit {
  constructor(parent, width, height, scale, input) {
    this.parent = parent
    this.width = width
    this.height = height
    this.scale = scale
    this.input = input
    this.shadowInput = true
    this.doPaint = true
    this.forcePaint = false

    this.row = 0

    this.name = 'untitled'

    this.parameters = newSynthParameters()

    this.parameters[WAVE] = 1
    this.parameters[CYCLE] = 0.25

    this.parameters[FREQ] = 49
    this.parameters[SPEED] = 0.0
    this.parameters[ACCEL] = 0.0
    this.parameters[JERK] = 0.0

    this.parameters[ATTACK] = 0
    this.parameters[DECAY] = 0
    this.parameters[SUSTAIN] = 0.5
    this.parameters[LENGTH] = 1000
    this.parameters[RELEASE] = 0
    this.parameters[VOLUME] = 1.0

    this.parameters[VIBRATO_WAVE] = 0
    this.parameters[VIBRATO_FREQ] = 5.0
    this.parameters[VIBRATO_PERC] = 0.5

    this.parameters[TREMOLO_WAVE] = 0
    this.parameters[TREMOLO_FREQ] = 9.0
    this.parameters[TREMOLO_PERC] = 0.5

    this.parameters[BIT_CRUSH] = 0.0
    this.parameters[NOISE] = 0.0
    this.parameters[DISTORTION] = 0.0
    this.parameters[LOW_PASS] = 0.0
    this.parameters[HIGH_PASS] = 0.0
    this.parameters[REPEAT] = 0.0

    this.range = newSynthParameters()

    this.range[WAVE] = [1, 1, WAVEFORMS.length - 1, WAVEFORMS.length]
    this.range[CYCLE] = [0.05, 0.0, 1.0, 0.2]

    this.range[FREQ] = [1, 1, 99, 12]
    this.range[SPEED] = [0.001, -1.0, 1.0, 0.1]
    this.range[ACCEL] = [0.001, -1.0, 1.0, 0.1]
    this.range[JERK] = [0.001, -1.0, 1.0, 0.1]

    this.range[ATTACK] = [10, 0, 5000, 500]
    this.range[DECAY] = [10, 0, 5000, 500]
    this.range[SUSTAIN] = [0.05, 0.05, 1.0, 500]
    this.range[LENGTH] = [10, 10, 10000, 500]
    this.range[RELEASE] = [10, 0, 5000, 500]
    this.range[VOLUME] = [0.1, 0.1, 2.0, 0.25]

    this.range[VIBRATO_WAVE] = [1, 0, WAVEFORMS.length - 1, WAVEFORMS.length]
    this.range[VIBRATO_FREQ] = [1.0, 1.0, 36.0, 2.0]
    this.range[VIBRATO_PERC] = [0.05, 0.05, 1.0, 0.2]

    this.range[TREMOLO_WAVE] = [1, 0, WAVEFORMS.length - 1, WAVEFORMS.length]
    this.range[TREMOLO_FREQ] = [1.0, 1.0, 36.0, 2.0]
    this.range[TREMOLO_PERC] = [0.05, 0.05, 1.0, 0.2]

    this.range[BIT_CRUSH] = [0.05, 0.0, 1.0, 0.2]
    this.range[NOISE] = [0.05, 0.0, 1.0, 0.2]
    this.range[DISTORTION] = [0.05, 0.0, 4.0, 0.2]
    this.range[LOW_PASS] = [0.05, 0.0, 1.0, 0.2]
    this.range[HIGH_PASS] = [0.05, 0.0, 1.0, 0.2]
    this.range[REPEAT] = [0.05, 0.0, 1.0, 0.2]

    this.visualWidth = 200
    this.visualHeight = 80
    this.visualPixels = new Uint8Array(this.visualWidth * this.visualHeight * 3)
    for (let p = 0; p < this.visualPixels.length; p += 3) {
      this.visualPixels[p] = silver0
      this.visualPixels[p + 1] = silver1
      this.visualPixels[p + 2] = silver2
    }
    this.refreshPixels = false

    this.sounds = []

    this.dialog = null
    this.dialogStack = []

    this.startMenuDialog = new Dialog('start', null, ['name', 'new', 'open', 'save', 'export', 'exit'])
    this.askToSaveDialog = new Dialog('ask', 'save current file?', ['save', 'export', 'no'])
    this.saveOkDialog = new Dialog('ok', 'file saved', ['ok'])
    this.errorOkDialog = new Dialog('error', null, ['ok'])
  }

  clear() {}

  reset() {
    this.dialogResetAll()
  }

  handleDialog(event) {
    if (event === 'ask-no') {
      const poll = this.dialogStack[0]
      if (poll === 'start-new') this.clear()
      else this.parent.eventCall(poll)
      this.dialogEnd()
    } else if (event === 'ask-save') {
      const poll = this.dialogStack[0]
      if (poll === 'start-exit') {
        this.parent.eventCall('start-save')
        this.dialogStack.push(event)
        this.dialog = this.saveOkDialog
        this.forcePaint = true
      } else this.dialogEnd()
    } else if (event === 'ask-export') {
      const poll = this.dialogStack[0]
      if (poll === 'start-exit') {
        this.parent.eventCall('start-export')
        this.parent.eventCall('start-exit')
      }
      this.dialogEnd()
    } else if (event === 'start-name') {
      this.textBox.reset(this.name)
      this.askName = true
      this.dialogEnd()
    } else if (event === 'start-save') {
      this.parent.eventCall(event)
      this.dialog = this.saveOkDialog
      this.forcePaint = true
    } else if (event === 'start-new' || event === 'start-open' || event === 'start-exit') {
      this.dialogStack.push(event)
      this.dialog = this.askToSaveDialog
      this.forcePaint = true
    } else if (event === 'start-export') {
      this.parent.eventCall(event)
      this.dialogEnd()
    } else if (event === 'ok-ok') {
      const poll = this.dialogStack[0]
      if (poll === 'start-exit') this.parent.eventCall(poll)
      this.dialogEnd()
    } else if (event === 'error-ok') {
      this.dialogEnd()
    }
  }

  handleDialogSpecial() {}

  dialogResetAll() {
    this.startMenuDialog.reset()
    this.askToSaveDialog.reset()
    this.saveOkDialog.reset()
    this.errorOkDialog.reset()
  }

  dialogEnd() {
    this.dialogResetAll()
    this.dialog = null
    this.dialogStack.length = 0
    this.forcePaint = true
  }

  resize(width, height, scale) {
    this.width = width
    this.height = height
    this.scale = scale
    this.shadowInput = true
    this.doPaint = true
  }

  read(content) {
    this.clear()
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
      this.errorOkDialog.title = 'Failed reading file'
      this.dialog = this.errorOkDialog
    }

    this.shadowInput = true
    this.doPaint = true
  }

  async load(file) {
    let content = null
    if (file) content = await fetchText(file)
    else content = localStorage.getItem('sfx.txt')
    if (content === null || content === undefined) return this.clear()
    this.read(content)
  }

  topLeftStatus() {
    return 'SOUND EFFECTS'
  }

  topRightStatus() {
    return null
  }

  bottomLeftStatus() {
    return null
  }

  bottomRightStatus() {
    const input = this.input
    return `${input.name(BUTTON_A)}/INCREASE ${input.name(BUTTON_B)}/DECREASE ${input.name(BUTTON_X)}/PLAY`
  }

  immediate() {}

  events() {
    if (this.dialog === null) return
    const input = this.input
    if (input.pressB()) {
      this.dialog = null
      this.dialogStack.length = 0
      this.forcePaint = true
    }
    if (input.pressA() || input.pressStart() || input.pressSelect()) {
      const id = this.dialog.id
      const option = this.dialog.options[this.dialog.pos]
      this.handleDialog(id + '-' + option)
    }
  }

  update(timestamp) {
    this.events()

    if (this.forcePaint) {
      this.doPaint = true
      this.forcePaint = false
    } else this.doPaint = false
    if (this.input.nothingOn()) {
      if (this.shadowInput) this.shadowInput = false
      else return
    } else this.shadowInput = true
    this.doPaint = true
    this.refreshPixels = false

    const input = this.input

    if (this.dialog !== null) {
      if (input.timerStickUp(timestamp, INPUT_RATE)) {
        if (this.dialog.pos > 0) this.dialog.pos--
      } else if (input.timerStickDown(timestamp, INPUT_RATE)) {
        if (this.dialog.pos < this.dialog.options.length - 1) this.dialog.pos++
      } else if (input.timerStickLeft(timestamp, INPUT_RATE)) this.handleDialogSpecial(true)
      else if (input.timerStickRight(timestamp, INPUT_RATE)) this.handleDialogSpecial(false)
      return
    }

    if (input.pressStart()) {
      this.dialog = this.startMenuDialog
      return
    }

    if (input.pressX()) {
      for (const sound of this.sounds) sound.stop()
      this.sounds.length = 0
      const source = synth(this.parameters)
      this.sounds.push(source)
      this.updatePixels(source)
    }

    if (input.timerStickUp(timestamp, INPUT_RATE)) {
      if (this.row > 0) this.row--
    } else if (input.timerStickDown(timestamp, INPUT_RATE)) {
      if (this.row < this.parameters.length - 1) this.row++
    }

    if (input.timerStickLeft(timestamp, INPUT_RATE)) {
      const row = this.row
      const range = this.range[row]
      if (input.leftTrigger()) this.parameters[row] -= range[3]
      else this.parameters[row] -= range[0]
      if (this.parameters[row] < range[1]) this.parameters[row] = range[1]
    } else if (input.timerStickRight(timestamp, INPUT_RATE)) {
      const row = this.row
      const range = this.range[row]
      if (input.leftTrigger()) this.parameters[row] += range[3]
      else this.parameters[row] += range[0]
      if (this.parameters[row] > range[2]) this.parameters[row] = range[2]
    }
  }

  updatePixels(source) {
    const data = source.buffer.getChannelData(0)
    const samples = data.length
    const width = this.visualWidth
    const height = this.visualHeight
    const pixels = this.visualPixels

    const parition = Math.floor(samples / width)
    let n = 0
    let e = parition

    const average = false

    for (let c = 0; c < width; c++) {
      let b, t

      if (average) {
        let pos = 0
        let neg = 0
        let posc = 0
        let negc = 0
        for (let s = n; s < e; s++) {
          const sample = data[s]
          if (sample > 0) {
            pos += sample
            posc++
          } else {
            neg += sample
            negc++
          }
        }
        if (posc > 0) pos /= posc
        if (negc > 0) neg /= negc
        b = Math.floor(height - (pos + 1.0) * 0.5 * height)
        t = Math.ceil(height - (neg + 1.0) * 0.5 * height)
      } else {
        let min = Number.MAX_VALUE
        let max = -Number.MAX_VALUE
        for (let s = n; s < e; s++) {
          const sample = data[s]
          if (sample < min) min = sample
          if (sample > max) max = sample
        }
        b = Math.floor(height - (max + 1.0) * 0.5 * height)
        t = Math.ceil(height - (min + 1.0) * 0.5 * height)
      }

      if (b < 0) b = 0
      if (t >= height) t = height - 1

      for (let r = 0; r < b; r++) {
        const i = (c + r * width) * 3
        pixels[i] = silver0
        pixels[i + 1] = silver1
        pixels[i + 2] = silver2
      }

      for (let r = b; r < t; r++) {
        const i = (c + r * width) * 3
        pixels[i] = dusk0
        pixels[i + 1] = dusk1
        pixels[i + 2] = dusk2
      }

      for (let r = t; r < height; r++) {
        const i = (c + r * width) * 3
        pixels[i] = silver0
        pixels[i + 1] = silver1
        pixels[i + 2] = silver2
      }

      n = e
      e += parition
      if (e > samples) e = samples
    }

    this.refreshPixels = true
  }

  export() {
    let content = `sound ${this.name}\n`
    for (let i = 0; i < this.parameters.length; i++) {
      if (i === WAVE) content += `wave ${WAVEFORMS[this.parameters[i]].toLowerCase()}\n`
      else content += `${SYNTH_ARGUMENTS[i].toLowerCase().replace(' ', '_')} ${this.parameters[i]}\n`
    }
    content += 'end sound\n'
    return content
  }
}
