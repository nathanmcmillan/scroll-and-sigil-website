/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { newAudioContext } from '../sound/web-audio-context.js'

export const SYNTH_RATE = 44100

export const SEMITONES = 49

export const WAVE = 0
export const CYCLE = 1

export const FREQ = 2
export const SPEED = 3
export const ACCEL = 4
export const JERK = 5

export const ATTACK = 6
export const DECAY = 7
export const SUSTAIN = 8
export const LENGTH = 9
export const RELEASE = 10
export const VOLUME = 11

export const VIBRATO_WAVE = 12
export const VIBRATO_FREQ = 13
export const VIBRATO_PERC = 14

export const TREMOLO_WAVE = 15
export const TREMOLO_FREQ = 16
export const TREMOLO_PERC = 17

export const BIT_CRUSH = 18
export const NOISE = 19
export const DISTORTION = 20
export const LOW_PASS = 21
export const HIGH_PASS = 22
export const REPEAT = 23

export const PARAMETER_COUNT = 24

export const WAVE_GROUP = ['Wave', 'Cycle']
export const FREQ_GROUP = ['Frequency', 'Speed', 'Accel', 'Jerk']
export const VOLUME_GROUP = ['Attack', 'Decay', 'Sustain', 'Length', 'Release', 'Volume']
export const VIBRATO_GROUP = ['Vibrato Wave', 'Vibrato Freq', 'Vibrato %']
export const TREMOLO_GROUP = ['Tremolo Wave', 'Tremolo Freq', 'Tremolo %']
export const OTHER_GROUP = ['Bit Crush', 'Noise', 'Distortion', 'Low Pass', 'High Pass', 'Repeat']

export const SYNTH_ARGUMENTS = [].concat(WAVE_GROUP).concat(FREQ_GROUP).concat(VOLUME_GROUP).concat(VIBRATO_GROUP).concat(TREMOLO_GROUP).concat(OTHER_GROUP)

const _INTERVAL = 0

const _COUNT = 1

const rate = 1.0 / SYNTH_RATE
const pi = Math.PI
const tau = 2.0 * pi
const deg = pi / 180

const context = newAudioContext()

export function synthTime() {
  return context.currentTime
}

export function newSynthParameters() {
  return new Array(PARAMETER_COUNT).fill(0)
}

// function noise(data, amplitude, frequency) {
//   const len = data.length
//   const increment = tau * frequency * rate
//   let phase = 0
//   for (let i = 0; i < len; i++) {
//     phase += increment
//     if (phase > tau) {
//       data[i] = amplitude * (2.0 * Math.random() - 1.0)
//       phase -= tau
//     }
//   }
// }

// function process(data, algo, parameters) {
//   let attack = parameters[ATTACK]
//   let decay = parameters[DECAY]
//   let length = parameters[LENGTH]
//   let release = parameters[RELEASE]

//   if (attack === 0) attack = 4
//   if (decay === 0) decay = 4
//   if (release === 0) release = 4

//   attack = Math.floor((attack / 1000) * SYNTH_RATE)
//   decay = Math.floor((decay / 1000) * SYNTH_RATE)
//   length = Math.floor((length / 1000) * SYNTH_RATE)
//   release = Math.floor((release / 1000) * SYNTH_RATE)

//   const volume = parameters[VOLUME]
//   const sustain = parameters[SUSTAIN]
//   const hold = volume * sustain

//   const attackRate = volume / attack
//   const decayRate = (volume - hold) / decay
//   const releaseRate = hold / release

//   const decayEnd = attack + decay
//   const lengthEnd = decayEnd + length

//   let amplitude = 0

//   let frequency = diatonic(parameters[FREQ] - SEMITONES)
//   let speed = parameters[SPEED]
//   let acceleration = parameters[ACCEL] / SYNTH_RATE
//   const jerk = parameters[JERK] / SYNTH_RATE / SYNTH_RATE

//   const extra = new Array(_COUNT)
//   extra[_INTERVAL] = tau * parameters[CYCLE]

//   const size = data.length
//   let phase = 0

//   for (let i = 0; i < size; i++) {
//     if (i < attack) amplitude += attackRate
//     else if (i < decayEnd) amplitude -= decayRate
//     else if (i > lengthEnd) amplitude -= releaseRate
//     else amplitude = hold

//     data[i] = algo(amplitude, phase, extra)

//     const increment = tau * frequency * rate
//     phase += increment
//     if (phase > tau) phase -= tau

//     frequency += speed
//     speed += acceleration
//     acceleration += jerk
//   }
// }

function normalize(min, max, value) {
  return ((value + 1.0) * (max - min)) / 2.0 + min
}

const DISTORTION_CURVE = new Float32Array(SYNTH_RATE)

function distortionCurve(amount) {
  const curve = DISTORTION_CURVE
  for (let i = 0; i < SYNTH_RATE; i++) {
    const x = (i * 2.0) / SYNTH_RATE - 1.0
    curve[i] = ((3.0 + amount) * Math.atan(Math.sinh(x * 0.25) * 5.0)) / (pi + amount * Math.abs(x))
  }
  return curve
}

function processCurve(input, curve) {
  const samples = curve.length - 1
  const index = (samples * (input + 1.0)) / 2.0
  if (index < 0.0) {
    return curve[0]
  } else {
    const low = Math.floor(index)
    if (low >= samples) {
      return curve[samples]
    } else {
      const high = low + 1
      const factor = index - low
      return (1.0 - factor) * curve[low] + factor * curve[high]
    }
  }
}

function processSine(amplitude, phase) {
  return amplitude * Math.sin(phase)
}

function processSquare(amplitude, phase) {
  return phase < pi ? amplitude : -amplitude
}

function processPulse(amplitude, phase, extra) {
  return phase < extra[_INTERVAL] ? amplitude : -amplitude
}

function processTriangle(amplitude, phase) {
  const cycle = (2.0 * amplitude) / pi
  if (phase < pi) return -amplitude + cycle * phase
  return 3 * amplitude - cycle * phase
}

function processSawtooth(amplitude, phase) {
  return amplitude - (amplitude / pi) * phase
}

function processNoise(amplitude, phase) {
  return phase > tau ? amplitude * (2.0 * Math.random() - 1.0) : 0.0
}

function processStatic(amplitude) {
  return amplitude * (2.0 * Math.random() - 1.0)
}

function process(data, parameters) {
  const proc = processFromIndex(parameters[WAVE])

  let attack = parameters[ATTACK]
  let decay = parameters[DECAY]
  let length = parameters[LENGTH]
  let release = parameters[RELEASE]

  if (attack === 0) attack = 4
  if (decay === 0) decay = 4
  if (release === 0) release = 4

  attack = Math.floor((attack / 1000) * SYNTH_RATE)
  decay = Math.floor((decay / 1000) * SYNTH_RATE)
  length = Math.floor((length / 1000) * SYNTH_RATE)
  release = Math.floor((release / 1000) * SYNTH_RATE)

  const volume = parameters[VOLUME]
  const sustain = parameters[SUSTAIN]
  const hold = volume * sustain

  const attackRate = volume / attack
  const decayRate = (volume - hold) / decay
  const releaseRate = hold / release

  const decayEnd = attack + decay
  const lengthEnd = decayEnd + length

  let amplitude = 0

  const startFrequency = diatonic(parameters[FREQ] - SEMITONES)
  const startSpeed = parameters[SPEED]
  const startAcceleration = parameters[ACCEL] / SYNTH_RATE
  const jerk = parameters[JERK] / SYNTH_RATE / SYNTH_RATE

  let frequency = startFrequency
  let speed = startSpeed
  let acceleration = startAcceleration

  const vibratoWave = parameters[VIBRATO_WAVE]
  const vibratoFreq = parameters[VIBRATO_FREQ]
  const vibratoPerc = parameters[VIBRATO_PERC]

  let vibratoPhase = 0

  const tremoloWave = parameters[TREMOLO_WAVE]
  const tremoloFreq = parameters[TREMOLO_FREQ]
  const tremoloPerc = parameters[TREMOLO_PERC]

  let tremoloPhase = 0

  const crush = parameters[BIT_CRUSH]
  const noise = parameters[NOISE]
  const distortion = parameters[DISTORTION]
  const low = parameters[LOW_PASS]
  const high = parameters[HIGH_PASS]
  const repeat = Math.floor(parameters[REPEAT] * SYNTH_RATE)

  let lpfid1 = 0.0
  let lpfid2 = 0.0
  let lpfod1 = 0.0
  let lpfod2 = 0.0

  let lpfcb0 = 0.0
  let lpfcb1 = 0.0
  let lpfcb2 = 0.0
  let lpfca1 = 0.0
  let lpfca2 = 0.0

  if (low !== 0.0) {
    const cutoff = low
    const q = 1.0

    const g = Math.pow(10.0, -0.05 * q)
    const w0 = pi * cutoff
    const cosw0 = Math.cos(w0)
    const alpha = 0.5 * Math.sin(w0) * g

    const b1 = 1.0 - cosw0
    const b0 = 0.5 * b1
    const b2 = b0
    const a0 = 1.0 + alpha
    const a1 = -2.0 * cosw0
    const a2 = 1.0 - alpha

    const inverse = 1.0 / a0

    lpfcb0 = b0 * inverse
    lpfcb1 = b1 * inverse
    lpfcb2 = b2 * inverse
    lpfca1 = a1 * inverse
    lpfca2 = a2 * inverse
  }

  let hpfid1 = 0.0
  let hpfid2 = 0.0
  let hpfod1 = 0.0
  let hpfod2 = 0.0

  let hpfcb0 = 0.0
  let hpfcb1 = 0.0
  let hpfcb2 = 0.0
  let hpfca1 = 0.0
  let hpfca2 = 0.0

  if (high !== 0.0) {
    const cutoff = high
    const q = 1.0

    const g = Math.pow(10.0, -0.05 * q)
    const w0 = pi * cutoff
    const cosw0 = Math.cos(w0)
    const alpha = 0.5 * Math.sin(w0) * g

    const b1 = -1.0 - cosw0
    const b0 = -0.5 * b1
    const b2 = b0
    const a0 = 1.0 + alpha
    const a1 = -2.0 * cosw0
    const a2 = 1.0 - alpha

    const inverse = 1.0 / a0

    hpfcb0 = b0 * inverse
    hpfcb1 = b1 * inverse
    hpfcb2 = b2 * inverse
    hpfca1 = a1 * inverse
    hpfca2 = a2 * inverse
  }

  let distort = null
  if (distortion !== 0.0) {
    distort = distortionCurve(Math.ceil(distortion * 100.0))
  }

  const extra = new Array(_COUNT)
  extra[_INTERVAL] = tau * parameters[CYCLE]

  const size = data.length
  let phase = 0

  let out = 0.0

  for (let i = 0; i < size; i++) {
    if (i < attack) amplitude += attackRate
    else if (i < decayEnd) amplitude -= decayRate
    else if (i > lengthEnd) amplitude -= releaseRate
    else amplitude = hold

    let calculate = true

    if (crush !== 0.0) {
      if (i % Math.floor(crush * 100) !== 0) calculate = false
    }

    if (calculate) {
      let sound = 1.0 // amplitude

      if (vibratoWave !== 0) {
        const proc = processFromIndex(vibratoWave)
        const vibrato = proc(vibratoPerc, vibratoPhase, extra)
        // ???

        const increment = tau * vibratoFreq * rate
        vibratoPhase += increment
        if (vibratoPhase > tau) vibratoPhase -= tau
      }

      if (tremoloWave !== 0) {
        const proc = processFromIndex(tremoloWave)
        const tremolo = proc(1.0, tremoloPhase, extra)
        sound *= 1.0 - normalize(0.0, tremoloPerc, tremolo)

        const increment = tau * tremoloFreq * rate
        tremoloPhase += increment
        if (tremoloPhase > tau) tremoloPhase -= tau
      }

      out = proc(sound, phase, extra)

      if (noise !== 0.0) {
        out = out - out * noise * (1.0 - (((Math.sin(i) + 1.0) * 1e9) % 2))
      }

      if (distort !== null) {
        out = processCurve(out, distort)
      }

      if (low !== 0.0) {
        const pure = out
        out = lpfcb0 * pure + lpfcb1 * lpfid1 + lpfcb2 * lpfid2 - lpfca1 * lpfod1 - lpfca2 * lpfod2

        lpfid2 = lpfid1
        lpfid1 = pure
        lpfod2 = lpfod1
        lpfod1 = out
      }

      if (high !== 0.0) {
        const pure = out
        out = hpfcb0 * pure + hpfcb1 * hpfid1 + hpfcb2 * hpfid2 - hpfca1 * hpfod1 - hpfca2 * hpfod2

        hpfid2 = hpfid1
        hpfid1 = pure
        hpfod2 = hpfod1
        hpfod1 = out
      }
    }

    data[i] = out * amplitude // out

    const increment = tau * frequency * rate
    phase += increment
    if (phase > tau) phase -= tau

    frequency += speed
    speed += acceleration
    acceleration += jerk

    if (repeat !== 0) {
      if (i % repeat === 0) {
        frequency = startFrequency
        speed = startSpeed
        acceleration = startAcceleration
      }
    }
  }
}

export function synth(parameters, when = 0) {
  const seconds = (parameters[ATTACK] + parameters[DECAY] + parameters[LENGTH] + parameters[RELEASE]) / 1000
  const buffer = context.createBuffer(1, Math.ceil(SYNTH_RATE * seconds), SYNTH_RATE)
  const data = buffer.getChannelData(0)
  process(data, parameters)
  const source = context.createBufferSource()
  source.buffer = buffer
  source.connect(context.destination)
  source.start(when)
  return source
}

export const WAVEFORMS = ['None', 'Sine', 'Square', 'Pulse', 'Triangle', 'Sawtooth', 'Noise', 'Static']

function processFromIndex(index) {
  switch (index) {
    case 0:
      return null
    case 1:
      return processSine
    case 2:
      return processSquare
    case 3:
      return processPulse
    case 4:
      return processTriangle
    case 5:
      return processSawtooth
    case 6:
      return processNoise
    case 7:
      return processStatic
  }
  console.error('Bad process index: ' + index)
  return null
}

const notes = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B']

export function semitoneName(semitone) {
  semitone += 9
  let note = semitone % 12
  while (note < 0) note += 12
  const octave = 4 + Math.floor(semitone / 12)
  return notes[note] + octave
}

export function diatonic(semitone) {
  return 440 * Math.pow(2, semitone / 12)
}
