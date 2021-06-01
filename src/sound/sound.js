/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { FREQ, LENGTH, new_synth_parameters, synth, SYNTH_IO, synth_time, WAVEFORMS } from '../sound/synth.js'
import { wad_parse } from '../wad/wad.js'
import { music_note_duration, Track } from './music-theory.js'

export const PITCH_ROWS = 3
export const NOTE_START = 4
export const NOTE_ROWS = PITCH_ROWS + 1

export const MUSIC_SLICE = 100

export class SynthSound {
  constructor(content) {
    this.parameters = new_synth_parameters()
    try {
      read_sound_wad(this.parameters, content)
    } catch (e) {
      console.error(e)
    }
  }

  play() {
    synth(this.parameters)
  }
}

export class SynthMusic {
  constructor(content) {
    this.origin = 0
    this.time = 0
    this.paused = 0
    this.from = 0
    this.to = 0
    this.length = 0
    this.done = 0
    this.sounds = []

    try {
      const wad = wad_parse(content)

      this.name = wad.get('music')
      this.tempo = parseInt(wad.get('tempo'))

      this.tracks = []
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
    } catch (e) {
      console.error(e)
    }

    this.length = music_calc_timing(this.tempo, this.tracks)
  }

  update() {
    const now = Date.now()

    if (now >= this.done) {
      this.play()
      return
    }

    if (now < this.time) return

    const origin = this.origin
    const start = this.from
    const end = this.to

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

    this.time += MUSIC_SLICE
    this.from = this.to
    this.to += MUSIC_SLICE
  }

  play() {
    for (const sound of this.sounds) sound.stop()
    this.sounds.length = 0

    const tracks = this.tracks
    const size = tracks.length
    for (let t = 0; t < size; t++) tracks[t].i = 0

    this.time = Date.now()
    this.from = 0
    this.to = this.from + MUSIC_SLICE * 2
    this.origin = synth_time() - this.from / 1000.0
    this.done = this.time + this.length
    this.update()
  }

  pause() {
    for (const sound of this.sounds) sound.stop()
    this.sounds.length = 0
    this.paused = Date.now()
  }

  resume() {
    const difference = Date.now() - this.paused
    this.time += difference
    this.origin += difference / 1000.0
    this.done += difference
  }
}

export function music_calc_timing(tempo, tracks) {
  let end = 0
  const size = tracks.length
  for (let t = 0; t < size; t++) {
    const track = tracks[t]
    track.i = 0
    const notes = track.notes
    const count = notes.length
    let time = 0
    for (let n = 0; n < count; n++) {
      const note = notes[n]
      note[NOTE_START] = time
      time += music_note_duration(tempo, note[0])
    }
    end = Math.max(end, time)
  }
  return end
}

export function music_play_note(tempo, track, note, when, out) {
  const parameters = track.parameters.slice()
  parameters[LENGTH] = music_note_duration(tempo, note[0])
  for (let r = 1; r < NOTE_ROWS; r++) {
    const num = note[r]
    if (num === 0) continue
    parameters[FREQ] = num + track.tuning
    out.push(synth(parameters, when))
  }
}

export function read_synth_parameters(out, parameters) {
  for (const [name, value] of parameters) {
    for (let a = 0; a < SYNTH_IO.length; a++) {
      if (SYNTH_IO[a] === name) {
        if (name === 'wave') {
          for (let w = 0; w < WAVEFORMS.length; w++) {
            if (WAVEFORMS[w] === value) {
              out[a] = w
              break
            }
          }
        } else {
          out[a] = parseFloat(value)
        }
        break
      }
    }
  }
}

export function read_sound_wad(out, content) {
  const wad = wad_parse(content)
  const parameters = wad.get('parameters')
  read_synth_parameters(out, parameters)
  return wad
}
