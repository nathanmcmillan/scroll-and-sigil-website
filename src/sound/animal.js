export const SYNTH_ANIMAL_RATE = 44100

const rate = 1.0 / SYNTH_ANIMAL_RATE
const pi = Math.PI
const tau = 2.0 * pi
const context = new AudioContext()
const secondsPerChar = 0.075
const samplesPerChar = Math.floor(secondsPerChar * SYNTH_ANIMAL_RATE)

function short(str) {
  if (str.length > 1) return str[0] + str[str.length - 1]
  return str
}

const table = [440, 460, 470, 480, 490, 430, 420, 410, 400, 540, 550, 560, 570, 580, 590, 300, 310, 320, 330, 340, 350, 360, 370, 380, 390, 600]

function algo(data, text, pitch) {
  const a = 'a'.charCodeAt(0)
  const z = 'z'.charCodeAt(0)
  let position = 0
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i)
    if (c >= a && c <= z) {
      const increment = tau * table[c - a] * pitch * rate
      let phase = 0
      for (let k = 0; k < samplesPerChar; k++) {
        data[position++] = 1.0 - (1.0 / pi) * phase
        phase += increment
        if (phase > tau) phase -= tau
      }
    }
  }
}

export function animal(text, pitch, shorten, when = 0) {
  text = text.toLowerCase()
  if (shorten) {
    let small = ''
    for (let i = 0; i < text.length; i++) {
      const c = text[i]
      if (c >= 'a' && c <= 'z') small += text[i]
      else small += ' '
    }
    let words = small.split(' ')
    for (let i = 0; i < words.length; i++) words[i] = short(words[i])
    text = words.join('')
  }
  let samples = text.length * samplesPerChar
  let buffer = context.createBuffer(1, samples, SYNTH_ANIMAL_RATE)
  let data = buffer.getChannelData(0)
  algo(data, text, pitch)
  let source = context.createBufferSource()
  source.buffer = buffer
  source.connect(context.destination)
  source.start(when)
}
