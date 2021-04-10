import { closestInPalette } from '../editor/palette.js'

export function shadePalette(shades, colors, palette) {
  const pixels = new Uint8Array(shades * colors * 3)
  for (let c = 0; c < colors; c++) {
    const b = c * 3
    const red = palette[b]
    const green = palette[b + 1]
    const blue = palette[b + 2]
    for (let s = 0; s < shades; s++) {
      const light = s / shades + 0.5
      const i = closestInPalette(palette, red * light, green * light, blue * light) * 3
      const p = (s + c * shades) * 3
      pixels[p] = palette[i]
      pixels[p + 1] = palette[i + 1]
      pixels[p + 2] = palette[i + 2]
    }
  }
  return pixels
}
