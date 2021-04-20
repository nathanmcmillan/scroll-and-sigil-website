/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

const AudioContext = window.AudioContext || window.webkitAudioContext

function makeDistortionCurve(amount) {
  const k = amount
  const samples = 44100
  const curve = new Float32Array(samples)
  const pi = Math.PI
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1
    curve[i] = ((3 + k) * Math.atan(Math.sinh(x * 0.25) * 5)) / (pi + k * Math.abs(x))
  }
  return curve
}

function makeDistortionCurve2(amount) {
  const k = amount
  const samples = 44100
  const curve = new Float32Array(samples)
  const pi = Math.PI
  const deg = pi / 180
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1
    curve[i] = ((3 + k) * x * 20 * deg) / (pi + k * Math.abs(x))
  }
  return curve
}

// eslint-disable-next-line no-unused-vars
function simple() {
  console.log('simple')
  const context = new AudioContext()

  const oscillator = context.createOscillator()
  const end = context.destination

  const oscillatorGain = context.createGain()
  oscillatorGain.gain.value = 1.0

  oscillator.connect(oscillatorGain)
  oscillatorGain.connect(end)

  oscillator.start(0)

  setTimeout(() => {
    oscillator.stop()
  }, 600)
}

// eslint-disable-next-line no-unused-vars
function distortion() {
  console.log('distortion')
  const context = new AudioContext()

  const oscillator = context.createOscillator()
  const end = context.destination

  const oscillatorGain = context.createGain()
  oscillatorGain.gain.value = 1.0

  const distortion = context.createWaveShaper()
  distortion.curve = makeDistortionCurve(50)

  oscillator.connect(oscillatorGain)
  oscillatorGain.connect(distortion)
  distortion.connect(end)

  oscillator.start(0)

  setTimeout(() => {
    oscillator.stop()
  }, 600)
}

// eslint-disable-next-line no-unused-vars
function distortion2() {
  console.log('distortion 2')
  const context = new AudioContext()

  const oscillator = context.createOscillator()
  const end = context.destination

  const oscillatorGain = context.createGain()
  oscillatorGain.gain.value = 1.0

  const distortion = context.createWaveShaper()
  distortion.curve = makeDistortionCurve2(50)

  oscillator.connect(oscillatorGain)
  oscillatorGain.connect(distortion)
  distortion.connect(end)

  oscillator.start(0)

  setTimeout(() => {
    oscillator.stop()
  }, 600)
}

// eslint-disable-next-line no-unused-vars
function gain2() {
  console.log('gain 2')
  const context = new AudioContext()

  const oscillator = context.createOscillator()
  const end = context.destination

  const oscillatorGain = context.createGain()
  oscillatorGain.gain.value = 1.0

  const distortionGain = context.createGain()
  distortionGain.gain.value = 2.0

  const distortion = context.createWaveShaper()
  distortion.curve = makeDistortionCurve2(50)

  oscillator.connect(oscillatorGain)
  oscillatorGain.connect(distortionGain)
  distortionGain.connect(distortion)
  distortion.connect(end)

  oscillator.start(0)

  setTimeout(() => {
    oscillator.stop()
  }, 600)
}

// eslint-disable-next-line no-unused-vars
function gain() {
  console.log('gain')
  const context = new AudioContext()

  const oscillator = context.createOscillator()
  const end = context.destination

  const oscillatorGain = context.createGain()
  oscillatorGain.gain.value = 1.0

  const distortionGain = context.createGain()
  distortionGain.gain.value = 2.0

  const distortion = context.createWaveShaper()
  distortion.curve = makeDistortionCurve(50)

  oscillator.connect(oscillatorGain)
  oscillatorGain.connect(distortionGain)
  distortionGain.connect(distortion)
  distortion.connect(end)

  oscillator.start(0)

  setTimeout(() => {
    oscillator.stop()
  }, 600)
}

// eslint-disable-next-line no-unused-vars
function filter() {
  console.log('filter')
  const context = new AudioContext()

  const oscillator = context.createOscillator()
  const end = context.destination

  const oscillatorGain = context.createGain()
  oscillatorGain.gain.value = 1.0

  const distortionGain = context.createGain()
  distortionGain.gain.value = 2.0

  const distortion = context.createWaveShaper()
  distortion.curve = makeDistortionCurve(50)

  const lowPass = context.createBiquadFilter()
  lowPass.type = 'lowpass'
  lowPass.frequency.value = 440

  oscillator.connect(oscillatorGain)
  oscillatorGain.connect(distortionGain)
  distortionGain.connect(distortion)
  distortion.connect(lowPass)
  lowPass.connect(end)

  oscillator.start(0)

  setTimeout(() => {
    oscillator.stop()
  }, 600)
}
