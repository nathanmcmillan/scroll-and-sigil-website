export const SYNTH_RATE = 44100

const rate = 1.0 / SYNTH_RATE
const pi = Math.PI
const tau = 2.0 * pi
const context = new AudioContext()

// todo: envelope
// attack
// decay
// sustain
// release

// todo: combined wave forms

// todo:
// slide
// pitch jump
// modulation
// repeat time
// extra noise
// bit crush
// delay
// tremolo

// gain
// overdrive / distortion  (clipping)
// compression
// low pass filter
// high pass filter

export function synthTime() {
  return context.currentTime
}

function algoNoise(data, amplitude) {
  const len = data.length
  for (let i = 0; i < len; i++) {
    data[i] = amplitude * (2.0 * Math.random() - 1.0)
  }
}

function algoNoiseFrequency(data, amplitude, frequency) {
  const len = data.length
  const increment = tau * frequency * rate
  let phase = 0
  for (let i = 0; i < len; i++) {
    phase += increment
    if (phase > tau) {
      data[i] = amplitude * (2.0 * Math.random() - 1.0)
      phase -= tau
    }
  }
}

const debugDistortion = 0.7

function algoSine(data, amplitude, frequency) {
  const len = data.length
  const increment = tau * frequency * rate
  let phase = 0
  for (let i = 0; i < len; i++) {
    // debug
    let num = Math.sin(phase)
    if (num >= 0) {
      if (num > debugDistortion) num = debugDistortion
    } else {
      if (num < -debugDistortion) num = -debugDistortion
    }
    data[i] = amplitude * num
    //
    // data[i] = amplitude * Math.sin(phase)
    phase += increment
    if (phase > tau) phase -= tau
  }
}

function algoSquare(data, amplitude, frequency) {
  const len = data.length
  const increment = tau * frequency * rate
  let phase = 0
  for (let i = 0; i < len; i++) {
    data[i] = phase < pi ? amplitude : -amplitude
    phase += increment
    if (phase > tau) phase -= tau
  }
}

function algoPulse(data, amplitude, frequency, cycle) {
  const len = data.length
  const interval = tau * cycle
  const increment = tau * frequency * rate
  let phase = 0
  for (let i = 0; i < len; i++) {
    data[i] = phase < interval ? amplitude : -amplitude
    phase += increment
    if (phase > tau) phase -= tau
  }
}

function algoTriangle(data, amplitude, frequency) {
  const len = data.length
  const increment = tau * frequency * rate
  const cycle = (2.0 * amplitude) / pi
  let phase = 0
  for (let i = 0; i < len; i++) {
    if (phase < pi) data[i] = -amplitude + cycle * phase
    else data[i] = 3 * amplitude - cycle * phase
    phase += increment
    if (phase > tau) phase -= tau
  }
}

function algoSawtooth(data, amplitude, frequency) {
  const len = data.length
  const increment = tau * frequency * rate
  let phase = 0
  for (let i = 0; i < len; i++) {
    data[i] = amplitude - (amplitude / pi) * phase
    phase += increment
    if (phase > tau) phase -= tau
  }
}

function play(amplitude, frequency, parameters, seconds, algo, when = 0) {
  let buffer = context.createBuffer(1, Math.ceil(SYNTH_RATE * seconds), SYNTH_RATE)
  let data = buffer.getChannelData(0)
  algo(data, amplitude, frequency, parameters)
  let source = context.createBufferSource()
  source.buffer = buffer
  source.connect(context.destination)
  source.start(when)
  return source
}

export function noise(amplitude, frequency, seconds, when = 0) {
  // return play(amplitude, frequency, null, seconds, algoNoise, when)
  return play(amplitude, frequency, null, seconds, algoNoiseFrequency, when)
}

export function sine(amplitude, frequency, seconds, when = 0) {
  return play(amplitude, frequency, null, seconds, algoSine, when)
}

export function square(amplitude, frequency, seconds, when = 0) {
  return play(amplitude, frequency, null, seconds, algoSquare, when)
}

export function pulse(amplitude, frequency, cycle, seconds, when = 0) {
  return play(amplitude, frequency, cycle, seconds, algoPulse, when)
}

export function triangle(amplitude, frequency, seconds, when = 0) {
  return play(amplitude, frequency, null, seconds, algoTriangle, when)
}

export function sawtooth(amplitude, frequency, seconds, when = 0) {
  return play(amplitude, frequency, null, seconds, algoSawtooth, when)
}
