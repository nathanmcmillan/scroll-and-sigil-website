/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Dialog } from '../gui/dialog.js'
import { BUTTON_A, BUTTON_B, BUTTON_X, BUTTON_Y } from '../input/input.js'
import { FREQ, LENGTH, newSynthParameters, SUSTAIN, synth, synthTime, VOLUME, WAVE, WAVEFORMS } from '../sound/synth.js'

const INPUT_RATE = 128

class Track {
  constructor(name) {
    this.name = name
    this.parameters = newSynthParameters()
    this.parameters[WAVE] = WAVEFORMS.indexOf(name)
    this.parameters[SUSTAIN] = 1.0
    this.parameters[SUSTAIN] = 1.0
    this.parameters[VOLUME] = 1.0
    this.tuning = 0
    this.notes = [[2, 0, 49, 0]]
  }
}

export function lengthName(num) {
  switch (num) {
    case 0:
      return 'whole'
    case 1:
      return 'half'
    case 2:
      return 'quarter'
    case 3:
      return 'eigth'
    case 4:
      return 'sixteenth'
    case 5:
      return 'thirty second'
    default:
      return null
  }
}

export class MusicEdit {
  constructor(parent, width, height, scale, input) {
    this.parent = parent
    this.width = width
    this.height = height
    this.scale = scale
    this.input = input
    this.shadowInput = true
    this.doPaint = true
    this.forcePaint = false

    this.pitcheRows = 3
    this.noteRows = this.pitcheRows + 1
    this.maxDuration = 6
    this.maxPitch = 99

    this.noteC = 0
    this.noteR = 2

    this.tempo = 120
    this.transpose = 0
    this.play = false
    this.noteTimestamp = 0

    this.name = 'untitled'

    this.tracks = [new Track('Sine')]
    this.trackIndex = 0

    this.sounds = []

    this.dialog = null
    this.dialogStack = []

    this.startMenuDialog = new Dialog('start', null, ['name', 'new', 'open', 'save', 'export', 'exit'])
    this.subMenuDialog = new Dialog('sub', null, ['new track', 'edit track', 'tempo', 'transpose'])
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

  async load() {}

  noteSeconds(duration) {
    // 16 ms tick update
    // timestamp is in milliseconds
    // tempo = 120
    // 30 whole notes per minute | 1 whole note === 2 seconds
    // 60 half notes per minute | 1 half note === 1 second
    // 120 quarter notes per minute | 1 quarter note ===  0.5 seconds
    // 240 eight notes per minute
    // 480 sixteenth notes per minute
    // 960 thirty-second notes per minute
    let length = 0
    if (duration === 0) length = this.tempo * 4
    else if (duration === 1) length = this.tempo * 2
    else if (duration === 2) length = this.tempo
    else if (duration === 3) length = this.tempo / 2
    else if (duration === 4) length = this.tempo / 4
    else if (duration === 5) length = this.tempo / 8
    return length / 60
  }

  playOneNote(row) {
    for (const sound of this.sounds) sound.stop()
    this.sounds.length = 0
    const track = this.tracks[this.trackIndex]
    const note = track.notes[this.noteC]
    const length = this.noteSeconds(note[0]) * 1000
    if (row === 0) {
      for (let r = 1; r < this.noteRows; r++) {
        const num = note[r]
        if (num === 0) continue
        const parameters = track.parameters.slice()
        parameters[FREQ] = num
        parameters[LENGTH] = length
        this.sounds.push(synth(parameters))
      }
    } else {
      const num = note[row]
      if (num > 0) {
        const parameters = track.parameters.slice()
        parameters[FREQ] = num
        parameters[LENGTH] = length
        this.sounds.push(synth(parameters))
      }
    }
  }

  playAndCalculateNote(timestamp) {
    const time = synthTime()
    const when = time + (1.0 / 1000.0) * 16.0
    const track = this.tracks[this.trackIndex]
    const note = track.notes[this.noteC]
    const length = this.noteSeconds(note[0]) * 1000
    for (let r = 1; r < this.noteRows; r++) {
      const num = note[r]
      if (num === 0) continue
      const parameters = track.parameters.slice()
      parameters[FREQ] = num
      parameters[LENGTH] = length
      this.sounds.push(synth(parameters, when))
    }
    this.noteTimestamp = timestamp + length
  }

  updatePlay(timestamp) {
    const input = this.input
    if (input.pressX()) {
      for (const sound of this.sounds) sound.stop()
      this.sounds.length = 0
      this.play = false
      this.doPaint = true
      return
    }
    if (timestamp >= this.noteTimestamp) {
      this.doPaint = true
      this.noteC++
      if (this.noteC === this.tracks[this.trackIndex].notes.length) {
        this.sounds.length = 0
        this.play = false
        this.noteC = 0
      } else {
        this.playAndCalculateNote(timestamp)
      }
    } else {
      this.doPaint = false
    }
  }

  topLeftStatus() {
    return 'MUSIC'
  }

  topRightStatus() {
    return null
  }

  bottomLeftStatus() {
    return null
  }

  bottomRightStatus() {
    const input = this.input
    let content = null
    if (this.noteR === 0) content = `${input.name(BUTTON_A)}/DURATION UP ${input.name(BUTTON_B)}/DURATION DOWN `
    else content = `${input.name(BUTTON_A)}/PITCH UP ${input.name(BUTTON_B)}/PITCH DOWN `
    content += `${input.name(BUTTON_Y)}/OPTIONS `
    content += `${input.name(BUTTON_X)}`
    content += this.play ? '/STOP' : '/PLAY'
    return content
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

    if (this.play) {
      this.updatePlay(timestamp)
      return
    }

    if (this.forcePaint) {
      this.doPaint = true
      this.forcePaint = false
    } else this.doPaint = false
    if (this.input.nothingOn()) {
      if (this.shadowInput) this.shadowInput = false
      else return
    } else this.shadowInput = true
    this.doPaint = true

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

    if (input.pressSelect()) {
      this.dialog = this.subMenuDialog
      return
    }

    if (input.timerStickUp(timestamp, INPUT_RATE)) {
      if (this.noteR > 0) this.noteR--
    } else if (input.timerStickDown(timestamp, INPUT_RATE)) {
      if (this.noteR < this.noteRows - 1) this.noteR++
    }

    if (input.timerStickLeft(timestamp, INPUT_RATE)) {
      if (this.noteC > 0) this.noteC--
    } else if (input.timerStickRight(timestamp, INPUT_RATE)) {
      this.noteC++
      const notes = this.tracks[this.trackIndex].notes
      if (this.noteC === notes.length) {
        notes.push([2, 0, 49, 0])
      }
    }

    // need insert note in middle of track
    // need copy paste section of notes

    if (input.timerA(timestamp, INPUT_RATE)) {
      const row = this.noteR
      const track = this.tracks[this.trackIndex]
      const note = track.notes[this.noteC]
      if (row === 0) {
        if (input.leftTrigger()) note[row] = this.maxDuration - 1
        else if (note[row] < this.maxDuration - 1) note[row]++
      } else {
        if (input.leftTrigger()) note[row] = Math.min(note[row] + 12, this.maxPitch)
        else if (note[row] < this.maxPitch) note[row]++
      }
      this.playOneNote(this.noteR)
    } else if (input.timerB(timestamp, INPUT_RATE)) {
      const row = this.noteR
      const track = this.tracks[this.trackIndex]
      const note = track.notes[this.noteC]
      if (input.leftTrigger()) note[row] = Math.max(note[row] - 12, 0)
      else if (note[row] > 0) note[row]--
      this.playOneNote(this.noteR)
    }

    if (input.pressRightTrigger()) this.playOneNote(0)

    if (input.pressX()) {
      this.play = true
      this.playAndCalculateNote(timestamp)
    }

    if (input.pressY()) {
      // todo
      // open dialog box with options for insert / delete note
      //
      // insert note
      // let notes = this.tracks[this.trackIndex].notes
      // notes.splice(this.noteC + 1, 0, [2, 0, 49, 0])
      // this.noteC++
    }
  }

  export() {
    const noteRows = this.noteRows
    const tracks = this.tracks
    let content = `music ${this.name}\n`
    for (const track of tracks) {
      const notes = track.notes
      content += `track ${track.name}\n`
      content += `tuning ${track.tuning}`
      for (let c = 0; c < notes.length; c++) {
        const note = notes[c]
        for (let r = 0; r < noteRows; r++) {
          if (r === 0) content += '\n'
          else content += ' '
          content += note[r]
        }
      }
      content += '\nend track\n'
    }
    return content
  }
}
