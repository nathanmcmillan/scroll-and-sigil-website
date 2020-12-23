export const SYNTH_ANIMAL_FREQ = 44100

function short(str) {
  if (str.length > 1) return str[0] + str[str.length - 1]
  return str
}

export function animal(text, shorten, pitch) {
  if (shorten) {
    text = text
      .replace(/[^a-z]/gi, ' ')
      .split(' ')
      .map(short)
      .join('')
  }

  const library = new Uint8Array()

  let data = []

  const secondsPerChar = 0.15
  const samplesPerChar = Math.floor(secondsPerChar * SYNTH_ANIMAL_FREQ)
  const letterSeconds = 0.075
  const samplesPerLetter = Math.floor(letterSeconds * SYNTH_ANIMAL_FREQ)
  const a = 'A'.charCodeAt(0)

  for (let i = 0; i < text.length; i++) {
    const c = text.toUpperCase()[i]
    if (c >= 'A' && c <= 'Z') {
      const start = samplesPerChar * (c.charCodeAt(0) - a)
      for (let k = 0; k < samplesPerLetter; k++) data[k * samplesPerLetter + k] = library[44 + start + Math.floor(k * pitch)]
    } else {
      for (let k = 0; k < samplesPerLetter; k++) data[k * samplesPerLetter + k] = 127
    }
  }

  return data
}
