/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { soundList } from '../assets/sound-manager.js'
import { Dialog } from '../gui/dialog.js'
import { TextBox } from '../gui/text-box.js'
import { BUTTON_A, BUTTON_B, BUTTON_X, BUTTON_Y, INPUT_RATE } from '../io/input.js'
import { music_note_duration, music_scale, MUSIC_SCALE_LIST, NOTES, Track } from '../sound/music-theory.js'
import { music_calc_timing, music_play_note, MUSIC_SLICE, NOTE_ROWS, NOTE_START, read_synth_parameters } from '../sound/sound.js'
import { export_synth_parameters, FREQ, LENGTH, SUSTAIN, synth, synth_time, VOLUME, WAVE, WAVEFORMS } from '../sound/synth.js'
import { wad_parse } from '../wad/wad.js'

const DEFAULT_NOTE_LENGTH = 3

function newNote() {
  return [DEFAULT_NOTE_LENGTH, 0, 49, 0, 0]
}

function defaultTrack() {
  const track = new Track('untitled')
  track.parameters[WAVE] = WAVEFORMS.indexOf('Sine')
  track.parameters[SUSTAIN] = 1.0
  track.parameters[VOLUME] = 0.5
  track.notes.push(newNote())
  return track
}

export function lengthName(num) {
  switch (num) {
    case 0:
      return 'Whole'
    case 1:
      return 'Half'
    case 2:
      return 'Quarter'
    case 3:
      return 'Eigth'
    case 4:
      return 'Sixteenth'
    case 5:
      return 'Thirty Second'
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

    this.maxDuration = 6
    this.maxPitch = 99

    this.play = false
    this.musicOrigin = 0
    this.noteTime = 0
    this.musicTime = 0
    this.musicFrom = 0
    this.musicTo = 0

    this.name = ''
    this.tempo = 0

    this.scaleRoot = ''
    this.scaleMode = ''
    this.scaleNotes = null

    this.track = null
    this.tracks = []

    this.sounds = []

    this.dialog = null
    this.dialogStack = []

    this.startMenuDialog = new Dialog('Start', 'Start Menu', ['Name', 'New', 'Open', 'Save', 'Export', 'Exit'])
    this.trackDialog = new Dialog('Track', 'Song Menu', ['Switch Track', 'Instrument', 'Tuning', 'Mute', 'New Track', 'Delete Track', 'Tempo', 'Signature'])
    this.noteDialog = new Dialog('Note', 'Note Menu', ['Insert Note', 'Delete Note'])
    this.tuningDialog = new Dialog('Tuning', 'Tuning', [''])
    this.tempoDialog = new Dialog('Tempo', 'Tempo', [''])
    this.signatureDialog = new Dialog('Signature', 'Music Signature', ['Root Note', 'Music Scale'])
    this.rootNoteDialog = new Dialog('Root', 'Root Note', null)
    this.scaleDialog = new Dialog('Scale', 'Music Scale', null)
    this.switchDialog = new Dialog('Switch', 'Track', null)
    this.instrumentDialog = new Dialog('Instrument', 'Instrument', null)
    this.askToSaveDialog = new Dialog('Ask', 'Save Current File?', ['Save', 'Export', 'No'])
    this.deleteOkDialog = new Dialog('Delete', 'Delete Current Track?', ['Continue', 'Cancel'])
    this.saveOkDialog = new Dialog('Ok', 'File Saved', ['Ok'])
    this.errorOkDialog = new Dialog('Error', null, ['Ok'])

    this.activeTextBox = false
    this.textBox = new TextBox('', 20)

    this.clear()
  }

  clear() {
    this.play = false
    this.noteTime = 0
    this.musicOrigin = 0
    this.musicTime = 0
    this.musicPaused = 0
    this.musicFrom = 0
    this.musicTo = 0
    this.musicLength = 0
    this.musicDone = 0

    this.name = 'untitled'
    this.tempo = 120

    this.scaleRoot = 'C'
    this.scaleMode = 'Major'
    this.scaleNotes = music_scale(this.scaleRoot, this.scaleMode)

    this.track = defaultTrack()
    this.tracks.length = 0
    this.tracks.push(this.track)
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

  handleBackDialog() {
    const dialog = this.dialog
    if (dialog === this.switchDialog) this.gotoDialog(this.trackDialog)
    else if (dialog === this.instrumentDialog) this.gotoDialog(this.trackDialog)
    else if (dialog === this.tuningDialog) this.gotoDialog(this.trackDialog)
    else if (dialog === this.tempoDialog) this.gotoDialog(this.trackDialog)
    else if (dialog === this.signatureDialog) this.gotoDialog(this.trackDialog)
    else if (dialog === this.rootNoteDialog) this.gotoDialog(this.signatureDialog)
    else if (dialog === this.scaleDialog) this.gotoDialog(this.signatureDialog)
    else this.gotoDialog(null)
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
    } else if (dialog === this.noteDialog) {
      if (option === 'Insert Note') {
        const notes = this.track.notes
        notes.splice(this.track.c + 1, 0, newNote())
        this.track.c++
      } else if (option === 'Delete Note') {
        const notes = this.track.notes
        if (notes.length > 1) {
          notes.splice(this.track.c, 1)
          this.track.c = Math.min(this.track.c, this.track.notes.length - 1)
        }
      }
      this.dialogEnd()
    } else if (dialog === this.deleteOkDialog && option === 'Continue') {
      if (this.tracks.length === 1) {
        this.track = defaultTrack()
        this.tracks[0] = this.track
      } else {
        const index = this.tracks.indexOf(this.track)
        if (index >= 0) {
          this.tracks.splice(index, 1)
          this.track = this.tracks[Math.min(index, this.tracks.length - 1)]
        }
      }
      this.dialogEnd()
    } else if (dialog === this.trackDialog) {
      if (option === 'Instrument') {
        const sounds = soundList()
        const options = []
        for (const [name, value] of sounds) {
          if (!(value instanceof Audio)) options.push(name)
        }
        this.instrumentDialog.options = options
        this.gotoDialog(this.instrumentDialog)
      } else if (option === 'New Track') {
        this.track = defaultTrack()
        this.tracks.push(this.track)
        this.dialogEnd()
      } else if (option === 'Delete Track') {
        this.gotoDialog(this.deleteOkDialog)
      } else if (option === 'Switch Track') {
        const options = new Array(this.tracks.length)
        for (let i = 0; i < options.length; i++) options[i] = this.tracks[i].name
        this.switchDialog.options = options
        this.gotoDialog(this.switchDialog)
      } else if (option === 'Tuning') {
        this.tuningDialog.options[0] = '' + this.track.tuning
        this.gotoDialog(this.tuningDialog)
      } else if (option === 'Tempo') {
        this.tempoDialog.options[0] = '' + this.tempo
        this.gotoDialog(this.tempoDialog)
      } else if (option === 'Signature') {
        this.gotoDialog(this.signatureDialog)
      }
    } else if (dialog === this.switchDialog) {
      this.track = this.tracks[this.switchDialog.pos]
      this.dialogEnd()
    } else if (dialog === this.signatureDialog) {
      if (option === 'Root Note') {
        this.rootNoteDialog.options = NOTES
        this.gotoDialog(this.rootNoteDialog)
      } else if (option === 'Music Scale') {
        this.scaleDialog.options = MUSIC_SCALE_LIST
        this.gotoDialog(this.scaleDialog)
      }
    } else if (dialog === this.rootNoteDialog) {
      this.scaleRoot = NOTES[this.dialog.pos]
      this.scaleNotes = music_scale(this.scaleRoot, this.scaleMode)
      this.handleBackDialog()
    } else if (dialog === this.scaleDialog) {
      this.scaleMode = MUSIC_SCALE_LIST[this.dialog.pos]
      this.scaleNotes = music_scale(this.scaleRoot, this.scaleMode)
      this.handleBackDialog()
    } else if (dialog === this.instrumentDialog) {
      const sounds = soundList()
      const parameters = sounds.get(this.dialog.options[this.dialog.pos]).parameters
      for (let i = 0; i < parameters.length; i++) this.track.parameters[i] = parameters[i]
      this.handleBackDialog()
    } else if (dialog === this.tuningDialog) this.handleBackDialog()
    else if (dialog === this.tempoDialog) this.handleBackDialog()
    else this.dialogEnd()
  }

  handleDialogSpecial(left) {
    const dialog = this.dialog
    if (dialog === this.tuningDialog) {
      const track = this.track
      let tuning = track.tuning
      if (left) {
        if (tuning > -12) tuning--
      } else if (tuning < 12) tuning++
      this.dialog.options[0] = '' + tuning
      track.tuning = tuning
    } else if (dialog === this.tempoDialog) {
      let tempo = this.tempo
      if (left) {
        if (tempo > 60) tempo--
      } else if (tempo < 240) tempo++
      this.dialog.options[0] = '' + tempo
      this.tempo = tempo
    }
  }

  dialogResetAll() {
    this.startMenuDialog.reset()
    this.trackDialog.reset()
    this.noteDialog.reset()
    this.tuningDialog.reset()
    this.tempoDialog.reset()
    this.signatureDialog.reset()
    this.rootNoteDialog.reset()
    this.scaleDialog.reset()
    this.switchDialog.reset()
    this.instrumentDialog.reset()
    this.askToSaveDialog.reset()
    this.deleteOkDialog.reset()
    this.saveOkDialog.reset()
    this.errorOkDialog.reset()
  }

  dialogEnd() {
    this.dialogResetAll()
    this.dialog = null
    this.dialogStack.length = 0
    this.forcePaint = true
  }

  pause() {
    for (const sound of this.sounds) sound.stop()
    this.sounds.length = 0
    this.musicPaused = Date.now()
  }

  resume() {
    const difference = Date.now() - this.musicPaused
    this.noteTime += difference
    this.musicTime += difference
    this.musicOrigin += difference / 1000.0
    this.musicDone += difference
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
      const wad = wad_parse(content)

      this.name = wad.get('music')
      this.tempo = parseInt(wad.get('tempo'))

      const signature = wad.get('signature')

      this.scaleRoot = signature.substring(0, signature.indexOf(' '))
      this.scaleMode = signature.substring(signature.indexOf(' ') + 1)
      this.scaleNotes = music_scale(this.scaleRoot, this.scaleMode)

      this.tracks.length = 0
      for (const data of wad.get('tracks')) {
        const name = data.get('name')
        const parameters = data.get('parameters')
        const notes = data.get('notes')
        const track = new Track(name)
        track.tuning = parseInt(data.get('tuning'))
        read_synth_parameters(track.parameters, parameters)
        for (const note of notes) {
          const a = parseInt(note[0])
          const b = parseInt(note[1])
          const c = parseInt(note[2])
          const d = parseInt(note[3])
          track.notes.push([a, b, c, d])
        }
        this.tracks.push(track)
      }
      this.track = this.tracks[0]
    } catch (e) {
      console.error(e)
      this.clear()
      this.errorOkDialog.title = 'Failed reading file'
      this.dialog = this.errorOkDialog
    }

    this.shadowInput = true
    this.doPaint = true
  }

  async load(music) {
    if (music === null || music === undefined) return this.clear()
    this.read(music)
  }

  playRowNote(row) {
    for (const sound of this.sounds) sound.stop()
    this.sounds.length = 0
    const track = this.track
    const note = track.notes[track.c]
    const parameters = track.parameters.slice()
    parameters[LENGTH] = music_note_duration(this.tempo, note[0])
    if (row === 0) {
      for (let r = 1; r < NOTE_ROWS; r++) {
        const num = note[r]
        if (num === 0) continue
        parameters[FREQ] = num + track.tuning
        this.sounds.push(synth(parameters))
      }
    } else {
      const num = note[row]
      if (num > 0) {
        parameters[FREQ] = num + track.tuning
        this.sounds.push(synth(parameters))
      }
    }
  }

  timeAtNote() {
    const track = this.track
    const note = track.notes[track.c]
    return note[NOTE_START]
  }

  calcNoteTime(now) {
    const track = this.track
    const note = track.notes[track.c]
    this.noteTime = now + music_note_duration(this.tempo, note[0])
  }

  updateMusic(now) {
    if (now < this.musicTime) return

    const origin = this.musicOrigin
    const start = this.musicFrom
    const end = this.musicTo

    const tracks = this.tracks
    const size = tracks.length
    for (let t = 0; t < size; t++) {
      const track = tracks[t]
      const notes = track.notes
      const count = notes.length
      for (let n = track.i; n < count; n++) {
        const note = notes[n]
        const current = note[NOTE_START]
        if (current < start) continue
        else if (current >= end) {
          track.i = n
          break
        }
        const when = origin + current / 1000.0
        music_play_note(this.tempo, track, note, when, this.sounds)
      }
    }

    this.musicTime += MUSIC_SLICE
    this.musicFrom = this.musicTo
    this.musicTo += MUSIC_SLICE
  }

  beginMusic() {
    const now = Date.now()
    this.play = true
    this.track.saved = this.track.c
    this.musicLength = music_calc_timing(this.tempo, this.tracks)
    this.musicTime = now
    this.musicFrom = this.timeAtNote()
    this.musicTo = this.musicFrom + MUSIC_SLICE * 2
    this.musicOrigin = synth_time() - this.musicFrom / 1000.0
    this.musicDone = this.musicTime + this.musicLength
    this.updateMusic(now)
    this.calcNoteTime(now)
  }

  topLeftStatus() {
    return 'MUSIC - ' + this.name.toUpperCase()
  }

  topRightStatus() {
    const track = this.track
    return 'TRACK ' + track.name.toUpperCase() + ' TUNING ' + track.tuning + ' TEMPO ' + this.tempo
  }

  bottomLeftStatus() {
    return null
  }

  bottomRightStatus() {
    const input = this.input
    let content = null
    if (this.track.r === 0) content = input.name(BUTTON_A) + '/DURATION UP ' + input.name(BUTTON_Y) + '/DURATION DOWN '
    else content = input.name(BUTTON_A) + '/PITCH UP ' + input.name(BUTTON_Y) + '/PITCH DOWN '
    content += input.name(BUTTON_B) + '/NOTE '
    content += input.name(BUTTON_X) + (this.play ? '/STOP' : '/START')
    return content
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
    if (input.pressB()) this.handleBackDialog()
    else if (input.pressA() || input.pressStart() || input.pressSelect()) this.handleDialog()
  }

  updatePlay() {
    const input = this.input

    if (input.pressX()) {
      for (const sound of this.sounds) sound.stop()
      this.sounds.length = 0
      this.track.c = this.track.saved
      this.play = false
      this.doPaint = true
      return
    }

    const now = Date.now()

    if (now >= this.musicDone) {
      this.sounds.length = 0
      this.track.c = this.track.saved
      this.play = false
    } else {
      this.updateMusic(now)

      if (now >= this.noteTime) {
        if (this.track.c + 1 < this.track.notes.length) {
          this.track.c++
          this.calcNoteTime(now)
          this.doPaint = true
        }
      }
    }
  }

  update(timestamp) {
    this.events()

    if (this.play) {
      this.updatePlay()
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

    if (input.pressSelect()) {
      this.dialog = this.trackDialog
      return
    }

    if (input.timerStickUp(timestamp, INPUT_RATE)) {
      if (this.track.r > 0) this.track.r--
    } else if (input.timerStickDown(timestamp, INPUT_RATE)) {
      if (this.track.r < NOTE_ROWS - 1) this.track.r++
    }

    if (input.timerStickLeft(timestamp, INPUT_RATE)) {
      if (this.track.c > 0) this.track.c--
    } else if (input.timerStickRight(timestamp, INPUT_RATE)) {
      this.track.c++
      const notes = this.track.notes
      if (this.track.c === notes.length) {
        notes.push(newNote())
      }
    }

    if (input.timerA(timestamp, INPUT_RATE)) {
      const track = this.track
      const row = track.r
      const note = track.notes[track.c]
      if (row === 0) {
        if (input.leftTrigger()) note[row] = this.maxDuration - 1
        else if (note[row] < this.maxDuration - 1) note[row]++
      } else {
        if (input.leftTrigger()) note[row] = Math.min(note[row] + 12, this.maxPitch)
        else if (note[row] < this.maxPitch) note[row]++
      }
      this.playRowNote(this.track.r)
    } else if (input.timerY(timestamp, INPUT_RATE)) {
      const track = this.track
      const row = track.r
      const note = track.notes[track.c]
      if (row === 0) {
        if (input.leftTrigger()) note[row] = 0
        else if (note[row] > 0) note[row]--
      } else {
        if (input.leftTrigger()) note[row] = Math.max(note[row] - 12, 0)
        else if (note[row] > 0) note[row]--
      }
      this.playRowNote(this.track.r)
    }

    if (input.pressB()) this.playRowNote(0)

    if (input.pressX()) this.beginMusic()

    if (input.pressRightTrigger()) {
      this.dialog = this.noteDialog
      return
    }
  }

  export() {
    const tracks = this.tracks
    let content = 'music = ' + this.name
    content += '\ntempo = ' + this.tempo
    content += '\nsignature = "' + this.scaleRoot + ' ' + this.scaleMode + '"'
    content += '\ntracks ['
    for (const track of tracks) {
      const notes = track.notes
      content += '\n  {\n    name = ' + track.name
      content += '\n    tuning = ' + track.tuning
      const synth = export_synth_parameters(track.parameters).split('\n')
      content += '\n'
      for (const parameter of synth) {
        content += '    ' + parameter + '\n'
      }
      content += '    notes ['
      for (let c = 0; c < notes.length; c++) {
        const note = notes[c]
        if (c % 20 === 0) content += '\n      '
        else content += ' '
        content += '['
        for (let r = 0; r < NOTE_ROWS; r++) {
          if (r !== 0) content += ' '
          content += note[r]
        }
        content += ']'
      }
      content += '\n    ]\n  }'
    }
    content += '\n]'
    return content
  }
}
