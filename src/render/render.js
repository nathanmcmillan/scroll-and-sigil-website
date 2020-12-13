export const FONT_WIDTH = 6
export const FONT_HEIGHT = 6

const FONT = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,""\'\'"\'?!@_*#$%&()+-/:;<=>[]\\^`{}|~'
const FONT_GRID = Math.floor(128.0 / FONT_WIDTH)
const FONT_COLUMN = FONT_WIDTH / 128.0
const FONT_ROW = FONT_HEIGHT / 128.0

export function index3(b) {
  let pos = b.indexPosition
  let offset = b.indexOffset
  let indices = b.indices

  indices[pos] = offset
  indices[pos + 1] = offset + 1
  indices[pos + 2] = offset + 2

  b.indexPosition = pos + 3
  b.indexOffset = offset + 3
}

export function index4(b) {
  let pos = b.indexPosition
  let offset = b.indexOffset
  let indices = b.indices

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
  let pos = b.vertexPosition
  let vertices = b.vertices

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
  let pos = b.vertexPosition
  let vertices = b.vertices

  let x = y1 - y2
  let y = -(x1 - x2)
  let magnitude = Math.sqrt(x * x + y * y)
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
  let pos = b.vertexPosition
  let vertices = b.vertices

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
  let pos = b.vertexPosition
  let vertices = b.vertices

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
  let pos = b.vertexPosition
  let vertices = b.vertices

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
  let pos = b.vertexPosition
  let vertices = b.vertices

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

export function drawText(b, x, y, text, scale, red, green, blue, alpha) {
  let currentX = x
  let currentY = y
  const fontWidth = FONT_WIDTH * scale
  const fontHeight = FONT_HEIGHT * scale
  for (let i = 0; i < text.length; i++) {
    let c = text.charAt(i)
    if (c === ' ') {
      currentX += fontWidth
      continue
    } else if (c === '\n') {
      currentX = x
      currentY += fontHeight
      continue
    }
    let index = FONT.indexOf(c)
    let left = Math.floor(index % FONT_GRID) * FONT_COLUMN
    let top = Math.floor(index / FONT_GRID) * FONT_ROW
    let right = left + FONT_COLUMN
    let bottom = top + FONT_ROW
    drawImage(b, currentX, currentY, fontWidth, fontHeight, red, green, blue, alpha, left, top, right, bottom)
    currentX += fontWidth
  }
}

export function drawTextSpecial(b, x, y, text, scale, red, green, blue) {
  drawText(b, x, y - scale, text, scale, 0.0, 0.0, 0.0, 1.0)
  drawText(b, x, y, text, scale, red, green, blue, 1.0)
}

export function drawCubeSide(b, side, x, y, z, size) {
  let pos = b.vertexPosition
  let vertices = b.vertices

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
