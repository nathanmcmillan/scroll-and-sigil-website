import {noise, sine, square, pulse, triangle, sawtooth, synthTime} from '/src/sound/synth.js'

export const SEMITONES = 49

const INPUT_RATE = 128
const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B']

class Track {
  constructor(name) {
    this.name = name
    this.instrument = name.toLowerCase()
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
    this.maxPitch = 99

    this.noteC = 0
    this.noteR = 2

    this.tempo = 120
    this.transpose = 0 // each instrument should have a base frequency that can be set
    this.play = false
    this.noteTimestamp = 0

    this.tracks = [new Track('Sine')]
    this.trackIndex = 0

    this.subMenu = null

    this.sounds = []
  }

  resize(width, height, scale) {
    this.width = width
    this.height = height
    this.scale = scale
    this.shadowInput = true
    this.doPaint = true
  }

  async load() {}

  noteWaveform(name) {
    switch (name) {
      case 'noise':
        return noise
      case 'sine':
        return sine
      case 'square':
        return square
      case 'pulse':
        return pulse
      case 'triangle':
        return triangle
      case 'sawtooth':
        return sawtooth
    }
    return sine
  }

  noteSeconds(duration) {
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
    return length / 60
  }

  playOneNote(row) {
    for (let sound of this.sounds) sound.stop()
    this.sounds.length = 0
    let track = this.tracks[this.trackIndex]
    let waveform = this.noteWaveform(track.instrument)
    let note = track.notes[this.noteC]
    let seconds = this.noteSeconds(note[0])
    if (row === 0) {
      for (let r = 1; r < this.noteRows; r++) {
        let num = note[r]
        if (num === 0) continue
        let pitch = diatonic(num - SEMITONES)
        this.sounds.push(waveform(0.25, pitch, seconds))
      }
    } else {
      let num = note[row]
      if (num > 0) {
        let pitch = diatonic(num - SEMITONES)
        this.sounds.push(waveform(0.25, pitch, seconds))
      }
    }
  }

  playAndCalculateNote(timestamp) {
    const time = synthTime()
    const when = time + (1.0 / 1000.0) * 16.0
    let track = this.tracks[this.trackIndex]
    let waveform = this.noteWaveform(track.instrument)
    let note = track.notes[this.noteC]
    let seconds = this.noteSeconds(note[0])
    for (let r = 1; r < this.noteRows; r++) {
      let num = note[r]
      if (num === 0) continue
      let pitch = diatonic(num - SEMITONES)
      this.sounds.push(waveform(0.25, pitch, seconds, when))
    }
    this.noteTimestamp = timestamp + seconds * 1000
  }

  updatePlay(timestamp) {
    let input = this.input
    if (input.pressX()) {
      for (let sound of this.sounds) sound.stop()
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

    if (input.timerStickUp(timestamp, INPUT_RATE)) {
      if (this.noteR > 0) this.noteR--
    } else if (input.timerStickDown(timestamp, INPUT_RATE)) {
      if (this.noteR < this.noteRows - 1) this.noteR++
    }

    if (input.timerStickLeft(timestamp, INPUT_RATE)) {
      if (this.noteC > 0) this.noteC--
    } else if (input.timerStickRight(timestamp, INPUT_RATE)) {
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
        if (input.leftTrigger()) note[row] = this.maxDuration - 1
        else if (note[row] < this.maxDuration - 1) note[row]++
      } else {
        if (input.leftTrigger()) note[row] = Math.min(note[row] + 12, this.maxPitch)
        else if (note[row] < this.maxPitch) note[row]++
      }
      this.playOneNote(this.noteR)
    } else if (input.timerB(timestamp, INPUT_RATE)) {
      let row = this.noteR
      let track = this.tracks[this.trackIndex]
      let note = track.notes[this.noteC]
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

    if (input.pressSelect()) {
      if (this.subMenu !== null) {
        this.subMenu = null
      } else {
        // open submenu
        // tempo / transpose
        // new track / delete track
        // change track name / change track instrument
        this.subMenu = 'New track'
      }
    }

    if (input.pressStart()) {
      // open main menu
      // save / import / export
      // back to home editor screen
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
