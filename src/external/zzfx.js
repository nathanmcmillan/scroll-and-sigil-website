// ZzFX - Zuper Zmall Zound Zynth | MIT License - Copyright 2019 Frank Force | https://github.com/KilledByAPixel/ZzFX

export const zzfxv = 0.1
export const zzfxr = 44100

const context = new AudioContext()

export function zzfxt() {
  return context.currentTime
}

export function zzfxb(...t) {
  let source = context.createBufferSource()
  let buffer = context.createBuffer(t.length, t[0].length, zzfxr)
  t.map((d, i) => buffer.getChannelData(i).set(d))
  source.buffer = buffer
  source.connect(context.destination)
  return source
}

export function zzfxp(...t) {
  let source = zzfxb(...t)
  source.start()
  return source
}

export function zzfxpd(when, ...t) {
  let source = zzfxb(...t)
  source.start(when)
  return source
}

export function zzfxg(q = 1, k = 0.05, c = 220, e = 0, t = 0, u = 0.1, r = 0, F = 1, v = 0, z = 0, w = 0, A = 0, l = 0, B = 0, x = 0, G = 0, d = 0, y = 1, m = 0, C = 0) {
  let b = 2 * Math.PI
  let H = (v *= (500 * b) / zzfxr ** 2)
  let I = ((0 < x ? 1 : -1) * b) / 4
  let D = (c *= ((1 + 2 * k * Math.random() - k) * b) / zzfxr)
  let Z = []
  let g = 0
  let E = 0
  let a = 0
  let n = 1
  let J = 0
  let K = 0
  let f = 0
  let p
  let h
  e = 99 + zzfxr * e
  m *= zzfxr
  t *= zzfxr
  u *= zzfxr
  d *= zzfxr
  z *= (500 * b) / zzfxr ** 3
  x *= b / zzfxr
  w *= b / zzfxr
  A *= zzfxr
  l = (zzfxr * l) | 0
  for (h = (e + m + t + u + d) | 0; a < h; Z[a++] = f)
    ++K % ((100 * G) | 0) ||
      ((f = r
        ? 1 < r
          ? 2 < r
            ? 3 < r
              ? Math.sin((g % b) ** 3)
              : Math.max(Math.min(Math.tan(g), 1), -1)
            : 1 - (((((2 * g) / b) % 2) + 2) % 2)
          : 1 - 4 * Math.abs(Math.round(g / b) - g / b)
        : Math.sin(g)),
      (f =
        (l ? 1 - C + C * Math.sin((2 * Math.PI * a) / l) : 1) *
        (0 < f ? 1 : -1) *
        Math.abs(f) ** F *
        q *
        zzfxv *
        (a < e ? a / e : a < e + m ? 1 - ((a - e) / m) * (1 - y) : a < e + m + t ? y : a < h - d ? ((h - a - d) / u) * y : 0)),
      (f = d ? f / 2 + (d > a ? 0 : ((a < h - d ? 1 : (h - a) / d) * Z[(a - d) | 0]) / 2) : f)),
      (p = (c += v += z) * Math.sin(E * x - I)),
      (g += p - p * B * (1 - ((1e9 * (Math.sin(a) + 1)) % 2))),
      (E += p - p * B * (1 - ((1e9 * (Math.sin(a) ** 2 + 1)) % 2))),
      n && ++n > A && ((c += w), (D += w), (n = 0)),
      !l || ++J % l || ((c = D), (v = H), (n = n || 1))
  return Z
}

export function zzfx(...t) {
  return zzfxp(zzfxg(...t))
}

export function zzfxd(when, ...t) {
  return zzfxpd(when, zzfxg(...t))
}
