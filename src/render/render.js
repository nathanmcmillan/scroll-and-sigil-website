const FONT = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'

class Font {
  constructor(name, width, height, base) {
    this.name = name
    this.width = width
    this.height = height
    this.base = base
    this.grid = Math.floor(128.0 / width)
    this.column = width / 128.0
    this.row = height / 128.0
  }
}

export const TIC_FONT_WIDTH = 6
export const TIC_FONT_HEIGHT = 6
export const TIC_FONT_HEIGHT_BASE = 5

export const TIC_FONT = new Font('tic-80-wide-font', 6, 6, 5)
export const WIN_FONT = new Font('win-9-font', 8, 15, 14)
export const EGA_FONT = new Font('ega-8-font', 9, 8, 8)
export const VGA_FONT = new Font('vga-437-font', 9, 16, 15)
export const DINA_FONT = new Font('dina-10-font', 8, 16, 15)
export const SUPER_FONT = new Font('super-font', 8, 9, 8)
export const SUPER_OUTLINE_FONT = new Font('super-outline-font', 8, 8, 8)
export const SUPER_TITLE_FONT = new Font('super-title-font', 8, 16, 15)

export function index3(b) {
  const pos = b.indexPosition
  const offset = b.indexOffset
  const indices = b.indices

  indices[pos] = offset
  indices[pos + 1] = offset + 1
  indices[pos + 2] = offset + 2

  b.indexPosition = pos + 3
  b.indexOffset = offset + 3
}

export function index4(b) {
  const pos = b.indexPosition
  const offset = b.indexOffset
  const indices = b.indices

  indices[pos] = offset
  indices[pos + 1] = offset + 1
  indices[pos + 2] = offset + 2
  indices[pos + 3] = offset + 2
  indices[pos + 4] = offset + 3
  indices[pos + 5] = offset

  b.indexPosition = pos + 6
  b.indexOffset = offset + 4
}

export function screen(b, x, y, width, height) {
  const pos = b.vertexPosition
  const vertices = b.vertices

  vertices[pos] = x
  vertices[pos + 1] = y
  vertices[pos + 2] = x + width
  vertices[pos + 3] = y
  vertices[pos + 4] = x + width
  vertices[pos + 5] = y + height
  vertices[pos + 6] = x
  vertices[pos + 7] = y + height

  b.vertexPosition = pos + 8
  index4(b)
}

export function drawLine(b, x1, y1, x2, y2, thickness, red, green, blue, alpha) {
  const pos = b.vertexPosition
  const vertices = b.vertices

  let x = y1 - y2
  let y = -(x1 - x2)
  const magnitude = Math.sqrt(x * x + y * y)
  x /= magnitude
  y /= magnitude

  vertices[pos] = x1 - x * thickness
  vertices[pos + 1] = y1 - y * thickness
  vertices[pos + 2] = red
  vertices[pos + 3] = green
  vertices[pos + 4] = blue
  vertices[pos + 5] = alpha

  vertices[pos + 6] = x1 + x * thickness
  vertices[pos + 7] = y1 + y * thickness
  vertices[pos + 8] = red
  vertices[pos + 9] = green
  vertices[pos + 10] = blue
  vertices[pos + 11] = alpha

  vertices[pos + 12] = x2 + x * thickness
  vertices[pos + 13] = y2 + y * thickness
  vertices[pos + 14] = red
  vertices[pos + 15] = green
  vertices[pos + 16] = blue
  vertices[pos + 17] = alpha

  vertices[pos + 18] = x2 - x * thickness
  vertices[pos + 19] = y2 - y * thickness
  vertices[pos + 20] = red
  vertices[pos + 21] = green
  vertices[pos + 22] = blue
  vertices[pos + 23] = alpha

  b.vertexPosition = pos + 24
  index4(b)
}

export function drawTriangle(b, x1, y1, x2, y2, x3, y3, red, green, blue, alpha) {
  const pos = b.vertexPosition
  const vertices = b.vertices

  vertices[pos] = x1
  vertices[pos + 1] = y1
  vertices[pos + 2] = red
  vertices[pos + 3] = green
  vertices[pos + 4] = blue
  vertices[pos + 5] = alpha

  vertices[pos + 6] = x2
  vertices[pos + 7] = y2
  vertices[pos + 8] = red
  vertices[pos + 9] = green
  vertices[pos + 10] = blue
  vertices[pos + 11] = alpha

  vertices[pos + 12] = x3
  vertices[pos + 13] = y3
  vertices[pos + 14] = red
  vertices[pos + 15] = green
  vertices[pos + 16] = blue
  vertices[pos + 17] = alpha

  b.vertexPosition = pos + 18
  index3(b)
}

export function drawRectangle(b, x, y, width, height, red, green, blue, alpha) {
  const pos = b.vertexPosition
  const vertices = b.vertices

  vertices[pos] = x
  vertices[pos + 1] = y
  vertices[pos + 2] = red
  vertices[pos + 3] = green
  vertices[pos + 4] = blue
  vertices[pos + 5] = alpha

  vertices[pos + 6] = x + width
  vertices[pos + 7] = y
  vertices[pos + 8] = red
  vertices[pos + 9] = green
  vertices[pos + 10] = blue
  vertices[pos + 11] = alpha

  vertices[pos + 12] = x + width
  vertices[pos + 13] = y + height
  vertices[pos + 14] = red
  vertices[pos + 15] = green
  vertices[pos + 16] = blue
  vertices[pos + 17] = alpha

  vertices[pos + 18] = x
  vertices[pos + 19] = y + height
  vertices[pos + 20] = red
  vertices[pos + 21] = green
  vertices[pos + 22] = blue
  vertices[pos + 23] = alpha

  b.vertexPosition = pos + 24
  index4(b)
}

export function drawHollowRectangle(b, x, y, width, height, thickness, red, green, blue, alpha) {
  drawRectangle(b, x, y, width, thickness, red, green, blue, alpha)
  drawRectangle(b, x, y, thickness, height, red, green, blue, alpha)
  drawRectangle(b, x + width - thickness, y, thickness, height, red, green, blue, alpha)
  drawRectangle(b, x, y + height - thickness, width, thickness, red, green, blue, alpha)
}

export function drawImage(b, x, y, width, height, red, green, blue, alpha, left, top, right, bottom) {
  const pos = b.vertexPosition
  const vertices = b.vertices

  vertices[pos] = x
  vertices[pos + 1] = y
  vertices[pos + 2] = red
  vertices[pos + 3] = green
  vertices[pos + 4] = blue
  vertices[pos + 5] = alpha
  vertices[pos + 6] = left
  vertices[pos + 7] = bottom

  vertices[pos + 8] = x + width
  vertices[pos + 9] = y
  vertices[pos + 10] = red
  vertices[pos + 11] = green
  vertices[pos + 12] = blue
  vertices[pos + 13] = alpha
  vertices[pos + 14] = right
  vertices[pos + 15] = bottom

  vertices[pos + 16] = x + width
  vertices[pos + 17] = y + height
  vertices[pos + 18] = red
  vertices[pos + 19] = green
  vertices[pos + 20] = blue
  vertices[pos + 21] = alpha
  vertices[pos + 22] = right
  vertices[pos + 23] = top

  vertices[pos + 24] = x
  vertices[pos + 25] = y + height
  vertices[pos + 26] = red
  vertices[pos + 27] = green
  vertices[pos + 28] = blue
  vertices[pos + 29] = alpha
  vertices[pos + 30] = left
  vertices[pos + 31] = top

  b.vertexPosition = pos + 32
  index4(b)
}

export function drawSprite(b, x, y, z, sprite, sine, cosine) {
  const pos = b.vertexPosition
  const vertices = b.vertices

  sine = sprite.halfWidth * sine
  cosine = sprite.halfWidth * cosine

  vertices[pos] = x - cosine
  vertices[pos + 1] = y
  vertices[pos + 2] = z + sine
  vertices[pos + 3] = sprite.left
  vertices[pos + 4] = sprite.bottom
  vertices[pos + 5] = sine
  vertices[pos + 6] = 0.0
  vertices[pos + 7] = cosine

  vertices[pos + 8] = x + cosine
  vertices[pos + 9] = y
  vertices[pos + 10] = z - sine
  vertices[pos + 11] = sprite.right
  vertices[pos + 12] = sprite.bottom
  vertices[pos + 13] = sine
  vertices[pos + 14] = 0.0
  vertices[pos + 15] = cosine

  vertices[pos + 16] = x + cosine
  vertices[pos + 17] = y + sprite.height
  vertices[pos + 18] = z - sine
  vertices[pos + 19] = sprite.right
  vertices[pos + 20] = sprite.top
  vertices[pos + 21] = sine
  vertices[pos + 22] = 0.0
  vertices[pos + 23] = cosine

  vertices[pos + 24] = x - cosine
  vertices[pos + 25] = y + sprite.height
  vertices[pos + 26] = z + sine
  vertices[pos + 27] = sprite.left
  vertices[pos + 28] = sprite.top
  vertices[pos + 29] = sine
  vertices[pos + 30] = 0.0
  vertices[pos + 31] = cosine

  b.vertexPosition = pos + 32
  index4(b)
}

export function drawTextFont(b, x, y, text, scale, red, green, blue, alpha, font) {
  let currentX = x
  let currentY = y
  const fontWidth = font.width * scale
  const fontHeight = font.height * scale
  for (let i = 0; i < text.length; i++) {
    const c = text.charAt(i)
    if (c === ' ') {
      currentX += fontWidth
      continue
    } else if (c === '\n') {
      currentX = x
      currentY += fontHeight
      continue
    }
    const index = FONT.indexOf(c)
    const left = Math.floor(index % font.grid) * font.column
    const top = Math.floor(index / font.grid) * font.row
    const right = left + font.column
    const bottom = top + font.row
    drawImage(b, currentX, currentY, fontWidth, fontHeight, red, green, blue, alpha, left, top, right, bottom)
    currentX += fontWidth
  }
}

export function drawText(b, x, y, text, scale, red, green, blue, alpha) {
  drawTextFont(b, x, y, text, scale, red, green, blue, alpha, TIC_FONT)
}

export function drawTextSpecial(b, x, y, text, scale, red, green, blue) {
  drawTextFont(b, x, y - scale, text, scale, 0.0, 0.0, 0.0, 1.0, TIC_FONT)
  drawTextFont(b, x, y, text, scale, red, green, blue, 1.0, TIC_FONT)
}

export function drawTextFontSpecial(b, x, y, text, scale, red, green, blue, font) {
  drawTextFont(b, x, y - scale, text, scale, 0.0, 0.0, 0.0, 1.0, font)
  drawTextFont(b, x, y, text, scale, red, green, blue, 1.0, font)
}

export function drawCubeSide(b, side, x, y, z, size) {
  const pos = b.vertexPosition
  const vertices = b.vertices

  switch (side) {
    case 0:
      vertices[pos] = x + size
      vertices[pos + 1] = y - size
      vertices[pos + 2] = z - size
      vertices[pos + 3] = 0.0
      vertices[pos + 4] = 1.0

      vertices[pos + 5] = x + size
      vertices[pos + 6] = y + size
      vertices[pos + 7] = z - size
      vertices[pos + 8] = 0.0
      vertices[pos + 9] = 0.0

      vertices[pos + 10] = x + size
      vertices[pos + 11] = y + size
      vertices[pos + 12] = z + size
      vertices[pos + 13] = 1.0
      vertices[pos + 14] = 0.0

      vertices[pos + 15] = x + size
      vertices[pos + 16] = y - size
      vertices[pos + 17] = z + size
      vertices[pos + 18] = 1.0
      vertices[pos + 19] = 1.0
      break
    case 1:
      vertices[pos] = x - size
      vertices[pos + 1] = y - size
      vertices[pos + 2] = z - size
      vertices[pos + 3] = 1.0
      vertices[pos + 4] = 1.0

      vertices[pos + 5] = x - size
      vertices[pos + 6] = y - size
      vertices[pos + 7] = z + size
      vertices[pos + 8] = 0.0
      vertices[pos + 9] = 1.0

      vertices[pos + 10] = x - size
      vertices[pos + 11] = y + size
      vertices[pos + 12] = z + size
      vertices[pos + 13] = 0.0
      vertices[pos + 14] = 0.0

      vertices[pos + 15] = x - size
      vertices[pos + 16] = y + size
      vertices[pos + 17] = z - size
      vertices[pos + 18] = 1.0
      vertices[pos + 19] = 0.0
      break
    case 2:
      vertices[pos] = x - size
      vertices[pos + 1] = y + size
      vertices[pos + 2] = z - size
      vertices[pos + 3] = 0.0
      vertices[pos + 4] = 0.0

      vertices[pos + 5] = x - size
      vertices[pos + 6] = y + size
      vertices[pos + 7] = z + size
      vertices[pos + 8] = 0.0
      vertices[pos + 9] = 1.0

      vertices[pos + 10] = x + size
      vertices[pos + 11] = y + size
      vertices[pos + 12] = z + size
      vertices[pos + 13] = 1.0
      vertices[pos + 14] = 1.0

      vertices[pos + 15] = x + size
      vertices[pos + 16] = y + size
      vertices[pos + 17] = z - size
      vertices[pos + 18] = 1.0
      vertices[pos + 19] = 0.0
      break
    case 3:
      vertices[pos] = x - size
      vertices[pos + 1] = y - size
      vertices[pos + 2] = z - size
      vertices[pos + 3] = 0.0
      vertices[pos + 4] = 0.0

      vertices[pos + 5] = x + size
      vertices[pos + 6] = y - size
      vertices[pos + 7] = z - size
      vertices[pos + 8] = 1.0
      vertices[pos + 9] = 0.0

      vertices[pos + 10] = x + size
      vertices[pos + 11] = y - size
      vertices[pos + 12] = z + size
      vertices[pos + 13] = 1.0
      vertices[pos + 14] = 1.0

      vertices[pos + 15] = x - size
      vertices[pos + 16] = y - size
      vertices[pos + 17] = z + size
      vertices[pos + 18] = 0.0
      vertices[pos + 19] = 1.0
      break
    case 4:
      vertices[pos] = x + size
      vertices[pos + 1] = y - size
      vertices[pos + 2] = z + size
      vertices[pos + 3] = 0.0
      vertices[pos + 4] = 1.0

      vertices[pos + 5] = x + size
      vertices[pos + 6] = y + size
      vertices[pos + 7] = z + size
      vertices[pos + 8] = 0.0
      vertices[pos + 9] = 0.0

      vertices[pos + 10] = x - size
      vertices[pos + 11] = y + size
      vertices[pos + 12] = z + size
      vertices[pos + 13] = 1.0
      vertices[pos + 14] = 0.0

      vertices[pos + 15] = x - size
      vertices[pos + 16] = y - size
      vertices[pos + 17] = z + size
      vertices[pos + 18] = 1.0
      vertices[pos + 19] = 1.0
      break
    case 5:
      vertices[pos] = x - size
      vertices[pos + 1] = y - size
      vertices[pos + 2] = z - size
      vertices[pos + 3] = 0.0
      vertices[pos + 4] = 1.0

      vertices[pos + 5] = x - size
      vertices[pos + 6] = y + size
      vertices[pos + 7] = z - size
      vertices[pos + 8] = 0.0
      vertices[pos + 9] = 0.0

      vertices[pos + 10] = x + size
      vertices[pos + 11] = y + size
      vertices[pos + 12] = z - size
      vertices[pos + 13] = 1.0
      vertices[pos + 14] = 0.0

      vertices[pos + 15] = x + size
      vertices[pos + 16] = y - size
      vertices[pos + 17] = z - size
      vertices[pos + 18] = 1.0
      vertices[pos + 19] = 1.0
      break
  }

  b.vertexPosition = pos + 20
  index4(b)
}

export function drawSkyBox(b) {
  const x = 0.0
  const y = 0.0
  const z = 0.0
  const size = 0.5
  for (let i = 0; i < 6; i++) drawCubeSide(b, i, x, y, z, size)
}
