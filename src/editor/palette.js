export function black() {
  return 0
}

export function blackf() {
  return 0.0
}

export function darkblue(i) {
  if (i === 0) return 29
  if (i === 1) return 43
  return 83
}

export function darkbluef(i) {
  return darkblue(i) / 255.0
}

export function darkpurple(i) {
  if (i === 0) return 126
  if (i === 1) return 37
  return 83
}

export function darkpurplef(i) {
  return darkpurple(i) / 255.0
}

export function darkgreen(i) {
  if (i === 0) return 0
  if (i === 1) return 135
  return 81
}

export function darkgreenf(i) {
  return darkgreen(i) / 255.0
}

export function brown(i) {
  if (i === 0) return 171
  if (i === 1) return 82
  return 54
}

export function brownf(i) {
  return brown(i) / 255.0
}

export function darkgrey(i) {
  if (i === 0) return 95
  if (i === 1) return 87
  return 79
}

export function darkgreyf(i) {
  return darkgrey(i) / 255.0
}

export function lightgrey(i) {
  if (i === 0) return 194
  if (i === 1) return 195
  return 199
}

export function lightgreyf(i) {
  return lightgrey(i) / 255.0
}

export function white(i) {
  if (i === 0) return 255
  if (i === 1) return 241
  return 232
}

export function whitef(i) {
  return white(i) / 255.0
}

export function red(i) {
  if (i === 0) return 255
  if (i === 1) return 0
  return 77
}

export function redf(i) {
  return red(i) / 255.0
}

export function orange(i) {
  if (i === 0) return 255
  if (i === 1) return 163
  return 0
}

export function orangef(i) {
  return orange(i) / 255.0
}

export function yellow(i) {
  if (i === 0) return 255
  if (i === 1) return 236
  return 39
}

export function yellowf(i) {
  return yellow(i) / 255.0
}

export function green(i) {
  if (i === 0) return 0
  if (i === 1) return 228
  return 54
}

export function greenf(i) {
  return green(i) / 255.0
}

export function blue(i) {
  if (i === 0) return 41
  if (i === 1) return 173
  return 255
}

export function bluef(i) {
  return blue(i) / 255.0
}

export function lavender(i) {
  if (i === 0) return 131
  if (i === 1) return 118
  return 156
}

export function lavenderf(i) {
  return lavender(i) / 255.0
}

export function pink(i) {
  if (i === 0) return 255
  if (i === 1) return 119
  return 168
}

export function pinkf(i) {
  return pink(i) / 255.0
}

export function lightpeach(i) {
  if (i === 0) return 255
  if (i === 1) return 204
  return 170
}

export function lightpeachf(i) {
  return lightpeach(i) / 255.0
}

export function luminosity(red, green, blue) {
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

export function luminosityTable(palette) {
  let table = []
  for (let i = 0; i < palette.length; i += 3) {
    let index = i / 3
    table[index] = [luminosity(palette[i], palette[i + 1], palette[i + 2]), index]
  }
  table.sort((a, b) => {
    return a[0] - b[0]
  })
  return table
}

export function newPalette() {
  let palette = new Uint8Array(4 * 4 * 3)
  let index = 0

  palette[index] = black()
  palette[index + 1] = black()
  palette[index + 2] = black()
  index += 3

  palette[index] = darkblue(0)
  palette[index + 1] = darkblue(1)
  palette[index + 2] = darkblue(2)
  index += 3

  palette[index] = darkpurple(0)
  palette[index + 1] = darkpurple(1)
  palette[index + 2] = darkpurple(2)
  index += 3

  palette[index] = darkgreen(0)
  palette[index + 1] = darkgreen(1)
  palette[index + 2] = darkgreen(2)
  index += 3

  palette[index] = brown(0)
  palette[index + 1] = brown(1)
  palette[index + 2] = brown(2)
  index += 3

  palette[index] = darkgrey(0)
  palette[index + 1] = darkgrey(1)
  palette[index + 2] = darkgrey(2)
  index += 3

  palette[index] = lightgrey(0)
  palette[index + 1] = lightgrey(1)
  palette[index + 2] = lightgrey(2)
  index += 3

  palette[index] = white(0)
  palette[index + 1] = white(1)
  palette[index + 2] = white(2)
  index += 3

  palette[index] = red(0)
  palette[index + 1] = red(1)
  palette[index + 2] = red(2)
  index += 3

  palette[index] = orange(0)
  palette[index + 1] = orange(1)
  palette[index + 2] = orange(2)
  index += 3

  palette[index] = yellow(0)
  palette[index + 1] = yellow(1)
  palette[index + 2] = yellow(2)
  index += 3

  palette[index] = green(0)
  palette[index + 1] = green(1)
  palette[index + 2] = green(2)
  index += 3

  palette[index] = blue(0)
  palette[index + 1] = blue(1)
  palette[index + 2] = blue(2)
  index += 3

  palette[index] = lavender(0)
  palette[index + 1] = lavender(1)
  palette[index + 2] = lavender(2)
  index += 3

  palette[index] = pink(0)
  palette[index + 1] = pink(1)
  palette[index + 2] = pink(2)
  index += 3

  palette[index] = lightpeach(0)
  palette[index + 1] = lightpeach(1)
  palette[index + 2] = lightpeach(2)

  return palette
}

export function newPaletteFloat(source) {
  let palettef = new Float32Array(source.length)
  let i = source.length
  while (i--) palettef[i] = source[i] / 255.0
  return palettef
}

export function describeColor(i) {
  switch (i) {
    case 0:
      return 'black'
    case 1:
      return 'dark blue'
    case 2:
      return 'dark purple'
    case 3:
      return 'dark green'
    case 4:
      return 'brown'
    case 5:
      return 'dark grey'
    case 6:
      return 'light grey'
    case 7:
      return 'white'
    case 8:
      return 'red'
    case 9:
      return 'orange'
    case 10:
      return 'yellow'
    case 11:
      return 'green'
    case 12:
      return 'blue'
    case 13:
      return 'lavender'
    case 14:
      return 'pink'
    case 15:
      return 'light peach'
  }
}
