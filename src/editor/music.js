// import {fetchText} from '/src/client/net.js'
// import {newPalette, newPaletteFloat} from '/src/editor/palette.js'
// import {flexBox, flexSolve, flexSize} from '/src/flex/flex.js'
// import {FONT_WIDTH, FONT_HEIGHT} from '/src/render/render.js'

import {zzfx} from '/src/external/zzfx.js'

export const SEMITONES = 49

const INPUT_RATE = 128

const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B']

class Track {
  constructor(name) {
    this.name = name
    this.instrument = null
    this.tuning = 0
    this.notes = [[2, 0, 49, 0]]
  }
}

export function semitoneName(semitone) {
  semitone += 9
  let note = semitone % 12
  while (note < 0) note += 12
  let octave = 4 + Math.floor(semitone / 12)
  return NOTE_NAMES[note] + octave
}

export function diatonic(semitone) {
  return 440 * 2 ** (semitone / 12)
}

export class MusicEdit {
  constructor(width, height, scale, input) {
    this.width = width
    this.height = height
    this.scale = scale
    this.input = input
    this.shadowInput = true
    this.doPaint = true

    this.pitcheRows = 3
    this.noteRows = this.pitcheRows + 1
    this.maxDuration = 6

    this.noteC = 0
    this.noteR = 2

    this.tempo = 120
    this.transpose = 0 // each instrument should have a base frequency that can be set
    this.play = false
    this.noteTimestamp = 0

    let guitar = new Track('Guitar')

    this.tracks = [guitar]
    this.trackIndex = 0
  }

  resize(width, height, scale) {
    this.width = width
    this.height = height
    this.scale = scale
    this.shadowInput = true
    this.doPaint = true
  }

  async load() {}

  playAndCalculateNote(timestamp) {
    let note = this.tracks[this.trackIndex].notes[this.noteC]
    for (let r = 1; r < this.noteRows; r++) {
      let pitch = diatonic(note[r] - SEMITONES)
      zzfx(1, 0.05, pitch, 0.01, 0, 0.15, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 5)
    }
    let duration = note[0]
    // 16 ms tick update
    // timestamp is in milliseconds
    // tempo = 120
    // 30 whole notes per minute | 1 whole note == 2 seconds
    // 60 half notes per minute | 1 half note == 1 second
    // 120 quarter notes per minute | 1 quarter note ==  0.5 seconds
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
    length /= 60
    length *= 1000
    this.noteTimestamp = timestamp + length
  }

  updatePlay(timestamp) {
    let input = this.input
    if (input.pressX()) {
      this.play = false
      this.doPaint = true
      return
    }
    if (timestamp >= this.noteTimestamp) {
      this.doPaint = true
      this.noteC++
      if (this.noteC === this.tracks[this.trackIndex].notes.length) {
        this.noteC = 0
        this.play = false
      } else {
        this.playAndCalculateNote(timestamp)
      }
    } else {
      this.doPaint = false
    }
  }

  update(timestamp) {
    if (this.play) {
      this.updatePlay(timestamp)
      return
    }

    this.doPaint = false
    if (this.input.nothingOn()) {
      if (this.shadowInput) this.shadowInput = false
      else return
    } else this.shadowInput = true
    this.doPaint = true

    let input = this.input

    if (input.timerLeftUp(timestamp, INPUT_RATE)) {
      if (this.noteR > 0) this.noteR--
    } else if (input.timerLeftDown(timestamp, INPUT_RATE)) {
      if (this.noteR < this.noteRows - 1) this.noteR++
    }

    if (input.timerLeftLeft(timestamp, INPUT_RATE)) {
      if (this.noteC > 0) this.noteC--
    } else if (input.timerLeftRight(timestamp, INPUT_RATE)) {
      this.noteC++
      let notes = this.tracks[this.trackIndex].notes
      if (this.noteC === notes.length) {
        notes.push([2, 0, 49, 0])
      }
    }

    // need insert note in middle of track
    // need copy paste section of notes

    if (input.timerA(timestamp, INPUT_RATE)) {
      let row = this.noteR
      let track = this.tracks[this.trackIndex]
      let note = track.notes[this.noteC]
      if (row === 0) {
        if (note[row] > 0) {
          note[row]--
          // plain sawtooth: zzfx(...[1.52,0,174.6141,,,1,2,0])
          // violin: zzfx(...[1.98,0,261.6256,.03,1.85,.39,2,1.43,,,,,.34,.2,,,.06,.82,.01,.11]);
          zzfx(1, 0.05, 537, 0.02, 0.22, 1, 1.59, -6.98, 4.97, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 5)
        }
      } else {
        if (note[row] > 0) {
          note[row]--
          let pitch = diatonic(note[row] - SEMITONES)
          zzfx(1, 0.05, pitch, 0.01, 0, 0.15, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 5)
        }
      }
    } else if (input.timerB(timestamp, INPUT_RATE)) {
      let row = this.noteR
      let track = this.tracks[this.trackIndex]
      let note = track.notes[this.noteC]
      if (row === 0) {
        if (note[row] < this.maxDuration - 1) {
          note[row]++
          zzfx(1, 0.05, 537, 0.02, 0.22, 1, 1.59, -6.98, 4.97, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 5)
        }
      } else {
        if (note[row] < 99) {
          note[row]++
          let pitch = diatonic(note[row] - SEMITONES)
          zzfx(1, 0.05, pitch, 0.01, 0, 0.15, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 5)
        }
      }
    }

    if (input.pressX()) {
      this.play = true
      this.playAndCalculateNote(timestamp)
    }

    if (input.pressY()) {
      let notes = this.tracks[this.trackIndex].notes
      notes.splice(this.noteC + 1, 0, [2, 0, 49, 0])
    }
  }

  export() {
    const noteRows = this.noteRows
    const tracks = this.tracks
    let content = tracks.length + '\n'
    for (let track of tracks) {
      const notes = track.notes
      content += track.name + '\n'
      content += track.tuning + ' ' + notes.length
      for (let c = 0; c < notes.length; c++) {
        let note = notes[c]
        for (let r = 0; r < noteRows; r++) {
          if (r === 0) content += '\n'
          else content += ' '
          let num = note[r]
          content += num
        }
      }
      content += '\n'
    }
    return content
  }
}
