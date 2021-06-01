/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Dialog } from '../gui/dialog.js'
import { TextBox } from '../gui/text-box.js'
import { BUTTON_A, BUTTON_B, BUTTON_X, INPUT_RATE } from '../io/input.js'
import { read_sound_wad } from '../sound/sound.js'
import {
  ACCEL,
  ATTACK,
  BIT_CRUSH,
  CYCLE,
  DECAY,
  DISTORTION,
  export_synth_parameters,
  FREQ,
  HARMONIC_GAIN_A,
  HARMONIC_GAIN_B,
  HARMONIC_GAIN_C,
  HARMONIC_MULT_A,
  HARMONIC_MULT_B,
  HARMONIC_MULT_C,
  HIGH_PASS,
  JERK,
  LENGTH,
  LOW_PASS,
  new_synth_parameters,
  NOISE,
  RELEASE,
  REPEAT,
  SPEED,
  SUSTAIN,
  synth,
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

export class SoundEdit {
  constructor(parent, width, height, scale, input) {
    this.parent = parent
    this.width = width
    this.height = height
    this.scale = scale
    this.input = input
    this.shadowInput = true
    this.doPaint = true
    this.forcePaint = false

    this.name = ''

    this.parameters = new_synth_parameters()
    this.range = new_synth_parameters()

    this.visualWidth = 200
    this.visualHeight = 80
    this.visualPixels = new Uint8Array(this.visualWidth * this.visualHeight * 3)
    this.refreshPixels = false

    this.row = 0

    this.sounds = []

    this.dialog = null
    this.dialogStack = []

    this.startMenuDialog = new Dialog('Start', 'Start Menu', ['Name', 'New', 'Open', 'Save', 'Export', 'Exit'])
    this.askToSaveDialog = new Dialog('Ask', 'Save Current File?', ['Save', 'Export', 'No'])
    this.saveOkDialog = new Dialog('Ok', 'File Saved', ['Ok'])
    this.errorOkDialog = new Dialog('Error', null, ['Ok'])

    this.activeTextBox = false
    this.textBox = new TextBox('', 20)

    this.clear()
  }

  clear() {
    this.name = 'untitled'

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

    this.parameters[HARMONIC_MULT_A] = 1.0
    this.parameters[HARMONIC_GAIN_A] = 0.5

    this.parameters[HARMONIC_MULT_B] = 1.0
    this.parameters[HARMONIC_GAIN_B] = 0.25

    this.parameters[HARMONIC_MULT_C] = 1.0
    this.parameters[HARMONIC_GAIN_C] = 0.125

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
    this.range[VIBRATO_FREQ] = [0.2, 0.2, 24.0, 1.0]
    this.range[VIBRATO_PERC] = [0.05, 0.05, 1.0, 0.2]

    this.range[TREMOLO_WAVE] = [1, 0, WAVEFORMS.length - 1, WAVEFORMS.length]
    this.range[TREMOLO_FREQ] = [0.2, 0.2, 24.0, 1.0]
    this.range[TREMOLO_PERC] = [0.05, 0.05, 1.0, 0.2]

    this.range[BIT_CRUSH] = [0.05, 0.0, 1.0, 0.2]
    this.range[NOISE] = [0.05, 0.0, 1.0, 0.2]
    this.range[DISTORTION] = [0.05, 0.0, 4.0, 0.2]
    this.range[LOW_PASS] = [0.05, 0.0, 1.0, 0.2]
    this.range[HIGH_PASS] = [0.05, 0.0, 1.0, 0.2]
    this.range[REPEAT] = [0.05, 0.0, 1.0, 0.2]

    this.range[HARMONIC_MULT_A] = [0.25, 1.0, 12.0, 1.0]
    this.range[HARMONIC_GAIN_A] = [0.005, -1.0, 1.0, 0.1]

    this.range[HARMONIC_MULT_B] = [0.25, 1.0, 12.0, 1.0]
    this.range[HARMONIC_GAIN_B] = [0.005, -1.0, 1.0, 0.1]

    this.range[HARMONIC_MULT_C] = [0.25, 1.0, 12.0, 1.0]
    this.range[HARMONIC_GAIN_C] = [0.005, -1.0, 1.0, 0.1]

    for (let p = 0; p < this.visualPixels.length; p += 3) {
      this.visualPixels[p] = silver0
      this.visualPixels[p + 1] = silver1
      this.visualPixels[p + 2] = silver2
    }

    this.row = 0
  }

  reset() {
    this.dialogResetAll()
  }

  gotoDialog(dialog, from = null) {
    this.dialog = dialog
    this.forcePaint = true
    if (from === null) this.dialogStack.length = 0
    else this.dialogStack.push(from)
  }

  handleDialog() {
    const dialog = this.dialog
    const option = dialog.options[dialog.pos]
    const event = dialog.id + '-' + option
    if (dialog === this.askToSaveDialog) {
      if (option === 'No') {
        const poll = this.dialogStack[0]
        if (poll === 'Start-New') this.clear()
        else this.parent.eventCall(poll)
        this.dialogEnd()
      } else if (option === 'Save') {
        const poll = this.dialogStack[0]
        if (poll === 'Start-Exit') {
          this.parent.eventCall('Start-Save')
          this.gotoDialog(this.saveOkDialog, event)
        } else this.dialogEnd()
      } else if (option === 'Export') {
        const poll = this.dialogStack[0]
        if (poll === 'Start-Exit') {
          this.parent.eventCall('Start-Export')
          this.parent.eventCall('Start-Exit')
        }
        this.dialogEnd()
      }
    } else if (dialog === this.startMenuDialog) {
      if (option === 'Name') {
        this.textBox.reset(this.name)
        this.activeTextBox = true
        this.dialogEnd()
      } else if (option === 'Save') {
        this.parent.eventCall(event)
        this.gotoDialog(this.saveOkDialog)
      } else if (option === 'New' || option === 'Open' || option === 'Exit') {
        this.gotoDialog(this.askToSaveDialog, event)
      } else if (option === 'Export') {
        this.parent.eventCall(event)
        this.dialogEnd()
      }
    } else if (dialog === this.saveOkDialog && option === 'Ok') {
      const poll = this.dialogStack[0]
      if (poll === 'Start-Exit') this.parent.eventCall(poll)
      this.dialogEnd()
    } else this.dialogEnd()
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

  pause() {}

  resume() {}

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
      const wad = read_sound_wad(this.parameters, content)
      this.name = wad.get('sound')
    } catch (e) {
      console.error(e)
      this.clear()
      this.errorOkDialog.title = 'Failed reading file'
      this.dialog = this.errorOkDialog
    }

    this.shadowInput = true
    this.doPaint = true
  }

  async load(sound) {
    if (sound === null || sound === undefined) return this.clear()
    this.read(sound)
  }

  topLeftStatus() {
    return 'SOUND - ' + this.name.toUpperCase()
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
    const input = this.input
    if (this.activeTextBox) {
      if (input.pressY()) {
        this.textBox.erase()
        this.forcePaint = true
      } else if (input.pressA()) {
        if (this.textBox.end()) {
          this.name = this.textBox.text
          this.activeTextBox = false
          this.forcePaint = true
        } else {
          this.textBox.apply()
          this.forcePaint = true
        }
      }
      return
    }
    if (this.dialog === null) return
    if (input.pressB()) {
      this.dialog = null
      this.dialogStack.length = 0
      this.forcePaint = true
    }
    if (input.pressA() || input.pressStart() || input.pressSelect()) this.handleDialog()
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
    } else if (this.activeTextBox) {
      if (input.timerStickUp(timestamp, INPUT_RATE)) this.textBox.up()
      else if (input.timerStickDown(timestamp, INPUT_RATE)) this.textBox.down()
      else if (input.timerStickLeft(timestamp, INPUT_RATE)) this.textBox.left()
      else if (input.timerStickRight(timestamp, INPUT_RATE)) this.textBox.right()
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
    return 'sound = ' + this.name + '\n' + export_synth_parameters(this.parameters)
  }
}
