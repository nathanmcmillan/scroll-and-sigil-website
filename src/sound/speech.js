export const SYNTH_SPEECH_FREQ = 44100

const pi = Math.PI
const tau = 2.0 * pi

const phonemes = {
  o: {f: [12, 15, 0], w: [10, 10, 0], len: 3, amp: 6, osc: false, plosive: false},
  i: {f: [5, 56, 0], w: [10, 10, 0], len: 3, amp: 3, osc: false, plosive: false},
  j: {f: [5, 56, 0], w: [10, 10, 0], len: 1, amp: 3, osc: false, plosive: false},
  u: {f: [5, 14, 0], w: [10, 10, 0], len: 3, amp: 3, osc: false, plosive: false},
  a: {f: [18, 30, 0], w: [10, 10, 0], len: 3, amp: 15, osc: false, plosive: false},
  e: {f: [14, 50, 0], w: [10, 10, 0], len: 3, amp: 15, osc: false, plosive: false},
  E: {f: [20, 40, 0], w: [10, 10, 0], len: 3, amp: 12, osc: false, plosive: false},
  w: {f: [3, 14, 0], w: [10, 10, 0], len: 3, amp: 1, osc: false, plosive: false},
  v: {f: [2, 20, 0], w: [20, 10, 0], len: 3, amp: 3, osc: false, plosive: false},
  T: {f: [2, 20, 0], w: [40, 1, 0], len: 3, amp: 5, osc: false, plosive: false},
  z: {f: [5, 28, 80], w: [10, 5, 10], len: 3, amp: 3, osc: false, plosive: false},
  Z: {f: [4, 30, 60], w: [50, 1, 5], len: 3, amp: 5, osc: false, plosive: false},
  b: {f: [4, 0, 0], w: [10, 0, 0], len: 1, amp: 2, osc: false, plosive: false},
  d: {f: [4, 40, 80], w: [10, 10, 10], len: 1, amp: 2, osc: false, plosive: false},
  m: {f: [4, 20, 0], w: [10, 10, 0], len: 3, amp: 2, osc: false, plosive: false},
  n: {f: [4, 40, 0], w: [10, 10, 0], len: 3, amp: 2, osc: false, plosive: false},
  r: {f: [3, 10, 20], w: [30, 8, 1], len: 3, amp: 3, osc: false, plosive: false},
  l: {f: [8, 20, 0], w: [10, 10, 0], len: 3, amp: 5, osc: false, plosive: false},
  g: {f: [2, 10, 26], w: [15, 5, 2], len: 2, amp: 1, osc: false, plosive: false},
  f: {f: [8, 20, 34], w: [10, 10, 10], len: 3, amp: 4, osc: true, plosive: false},
  h: {f: [22, 26, 32], w: [30, 10, 30], len: 1, amp: 10, osc: true, plosive: false},
  s: {f: [80, 110, 0], w: [80, 40, 0], len: 3, amp: 5, osc: true, plosive: false},
  S: {f: [20, 30, 0], w: [100, 100, 0], len: 3, amp: 10, osc: true, plosive: false},
  p: {f: [4, 10, 20], w: [5, 10, 10], len: 1, amp: 2, osc: true, plosive: true},
  t: {f: [4, 20, 40], w: [10, 20, 5], len: 1, amp: 3, osc: true, plosive: true},
  k: {f: [20, 80, 0], w: [10, 10, 0], len: 1, amp: 3, osc: true, plosive: true},
}

function sawtooth(x) {
  return 0.5 - (x - Math.floor(x / tau) * tau) / tau
}

export function speech(buffer, text, base, speed, position) {
  for (let c = 0; c < text.length; c++) {
    let l = text.charAt(c)
    let p = phonemes[l]
    if (!p) {
      if (l == ' ' || l == '\n') {
        position += Math.floor(SYNTH_SPEECH_FREQ * 0.2 * speed)
      }
      continue
    }
    let v = p.amp
    let sl = p.len * (SYNTH_SPEECH_FREQ / 15) * speed
    for (let f = 0; f < 3; f++) {
      let ff = p.f[f]
      let freq = ff * (50 / SYNTH_SPEECH_FREQ)
      if (!ff) continue
      let one = 0
      let two = 0
      let q = 1.0 - p.w[f] * ((pi * 10) / SYNTH_SPEECH_FREQ)
      let current = position
      let xp = 0
      for (let s = 0; s < sl; s++) {
        let n = Math.random() - 0.5
        let x = n
        if (!p.osc) {
          x = sawtooth(s * ((base * tau) / SYNTH_SPEECH_FREQ))
          xp = 0
        }
        x = x + 2 * Math.cos(tau * freq) * one * q - two * q * q
        two = one
        one = x
        x = 0.75 * xp + x * v
        xp = x
        let y = Math.sin((pi * s) / sl) * 5
        if (y > 1.0) y = 1.0
        if (y < -1.0) y = -1.0
        x *= y * 10
        buffer[current++] = buffer[current] / 2 + x
        buffer[current++] = buffer[current] / 2 + x
      }
    }
    position += ((3 * sl) / 4) << 1
    if (p.plosive) position += sl & 0xfffffe
  }
}
