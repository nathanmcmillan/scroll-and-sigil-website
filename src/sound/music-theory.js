/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { new_synth_parameters } from '../sound/synth.js'

export const NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B']

export const MUSIC_SCALE_LIST = [
  'Major',
  'Minor',
  'Pentatonic Major',
  'Pentatonic Minor',
  'Harmonic Major',
  'Harmonic Minor',
  'Melodic Minor',
  'Augmented',
  'Blues',
  'Whole Tone',
  'Algerian',
]

export const MUSIC_SCALE = new Map()

MUSIC_SCALE.set('Major', [2, 2, 1, 2, 2, 2, 1])
MUSIC_SCALE.set('Minor', [2, 1, 2, 2, 1, 2, 2])
MUSIC_SCALE.set('Pentatonic Major', [2, 2, 3, 2, 3])
MUSIC_SCALE.set('Pentatonic Minor', [3, 2, 2, 3, 2])
MUSIC_SCALE.set('Harmonic Major', [2, 2, 1, 2, 1, 3, 1])
MUSIC_SCALE.set('Harmonic Minor', [2, 1, 2, 2, 1, 3, 1])
MUSIC_SCALE.set('Melodic Minor', [2, 1, 2, 2, 2, 2, 1])
MUSIC_SCALE.set('Augmented', [3, 1, 3, 1, 3, 1])
MUSIC_SCALE.set('Blues', [3, 2, 1, 1, 3, 2])
MUSIC_SCALE.set('Whole Tone', [2, 2, 2, 2, 2, 2])
MUSIC_SCALE.set('Algerian', [2, 1, 3, 1, 1, 3, 1, 2, 1, 2])

export class Track {
  constructor(name) {
    this.name = name
    this.tuning = 0
    this.parameters = new_synth_parameters()
    this.notes = []
    this.c = 0
    this.r = 2
    this.save = 0
    this.i = 0
  }
}

export function music_scale(root, mode) {
  const steps = MUSIC_SCALE.get(mode)
  const out = [root]
  let index = NOTES.indexOf(root)
  for (let i = 0; i < steps.length; i++) {
    index += steps[i]
    if (index >= NOTES.length) index -= NOTES.length
    out.push(NOTES[index])
  }
  return out
}

export function music_note_duration(tempo, note) {
  if (note === 0) return (240 / tempo) * 1000
  else if (note === 1) return (120 / tempo) * 1000
  else if (note === 2) return (60 / tempo) * 1000
  else if (note === 3) return (30 / tempo) * 1000
  else if (note === 4) return (15 / tempo) * 1000
  else return (7.5 / tempo) * 1000
}
