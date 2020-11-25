import {TwoWayMap} from '/src/util/collections.js'
import {exportSheetPixels, Painter} from '/src/editor/painter.js'
import {textureByName} from '/src/assets/assets.js'
import {drawText, drawRectangle, drawHollowRectangle, drawImage, FONT_HEIGHT} from '/src/render/render.js'
import {identity, multiply} from '/src/math/matrix.js'
import * as In from '/src/editor/editor-input.js'

function drawTextSpecial(b, x, y, text, scale, red, green, blue) {
  drawText(b, x + scale, y - scale, text, scale, 0.0, 0.0, 0.0, 1.0)
  drawText(b, x, y, text, scale, red, green, blue, 1.0)
}

function newPixelsToTexture(gl, width, height, pixels) {
  let texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, pixels, 0)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.bindTexture(gl.TEXTURE_2D, null)
  return texture
}

function updatePixelsToTexture(gl, texture, width, height, pixels) {
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, gl.RGB, gl.UNSIGNED_BYTE, pixels, 0)
  gl.bindTexture(gl.TEXTURE_2D, null)
  return texture
}

export class PainterState {
  constructor(client) {
    this.client = client

    let keys = new TwoWayMap()
    keys.set('KeyW', In.MOVE_FORWARD)
    keys.set('KeyA', In.MOVE_LEFT)
    keys.set('KeyS', In.MOVE_BACKWARD)
    keys.set('KeyD', In.MOVE_RIGHT)
    keys.set('KeyQ', In.MOVE_UP)
    keys.set('KeyE', In.MOVE_DOWN)
    keys.set('ArrowLeft', In.LOOK_LEFT)
    keys.set('ArrowRight', In.LOOK_RIGHT)
    keys.set('ArrowUp', In.LOOK_UP)
    keys.set('ArrowDown', In.LOOK_DOWN)
    keys.set('Enter', In.BUTTON_A)
    keys.set('KeyC', In.BUTTON_B)
    keys.set('KeyN', In.BUTTON_X)
    keys.set('KeyM', In.BUTTON_Y)
    keys.set('KeyI', In.OPEN_MENU)
    keys.set('KeyM', In.OPEN_TOOL_MENU)
    keys.set('KeyV', In.SWITCH_MODE)
    keys.set('KeyZ', In.ZOOM_IN)
    keys.set('KeyX', In.ZOOM_OUT)
    keys.set('KeyU', In.UNDO)
    keys.set('KeyR', In.REDO)
    keys.set('KeyG', In.SNAP_TO_GRID)
    keys.set('ShiftLeft', In.LEFT_TRIGGER)
    keys.set('ShiftRight', In.RIGHT_TRIGGER)

    this.keys = keys

    this.view = new Float32Array(16)
    this.projection = new Float32Array(16)

    let painter = new Painter(client.width, client.height)
    this.painter = painter

    let rows = painter.sheetRows
    let columns = painter.sheetColumns
    let pixels = exportSheetPixels(painter, 0)
    this.texture = newPixelsToTexture(client.gl, columns, rows, pixels)
  }

  resize(width, height) {
    this.painter.resize(width, height)
  }

  keyEvent(code, down) {
    if (this.keys.has(code)) {
      this.painter.input.set(this.keys.get(code), down)
    }
    if (down && code === 'Digit0') {
      console.log(this.painter.export())
    }
  }

  async initialize(file) {
    await this.painter.load(file)
  }

  update() {
    let painter = this.painter
    painter.update()
    if (painter.updates) {
      let rows = painter.sheetRows
      let columns = painter.sheetColumns
      let pixels = exportSheetPixels(painter, 0)
      updatePixelsToTexture(this.client.gl, this.texture, columns, rows, pixels)
    }
  }

  render() {
    const painter = this.painter
    if (!painter.doPaint) return

    const client = this.client
    const gl = client.gl
    const rendering = client.rendering
    const view = this.view
    const projection = this.projection

    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.clear(gl.DEPTH_BUFFER_BIT)

    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)

    identity(view)
    multiply(projection, client.orthographic, view)

    let buffer = client.bufferColor
    buffer.zero()

    let scale = 2.0
    let fontHeight = scale * FONT_HEIGHT

    let viewMultiplier = painter.viewMultiplier

    let posOffsetC = painter.positionOffsetC
    let posOffsetR = painter.positionOffsetR

    let posC = painter.positionC
    let posR = painter.positionR

    let paletteRows = painter.paletteRows
    let paletteColumns = painter.paletteColumns
    let palette = painter.paletteFloat

    let sheetRows = painter.sheetRows
    let sheetColumns = painter.sheetColumns
    let sheetIndex = painter.sheetIndex

    let rows = painter.rows
    let columns = painter.columns

    let magnify, top, left, width, height

    rendering.setProgram(1)
    rendering.setView(0, 0, client.width, client.height)
    rendering.updateUniformMatrix('u_mvp', projection)

    client.bufferGUI.zero()

    // sheet
    magnify = 4
    height = sheetRows * magnify
    top = client.height - 100 - height
    left = 100

    drawImage(client.bufferGUI, left, top, sheetColumns * magnify, height, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0)

    // view
    magnify = 32
    height = rows * magnify
    width = columns * magnify
    top = client.height - 100 - height
    left = client.width - 100 - width

    let sl = posOffsetC / sheetColumns
    let st = posOffsetR / sheetRows
    let sr = (posOffsetC + viewMultiplier) / sheetColumns
    let sb = (posOffsetR + viewMultiplier) / sheetRows

    drawImage(client.bufferGUI, left, top, width, height, 1.0, 1.0, 1.0, 1.0, sl, st, sr, sb)

    rendering.bindTexture(gl.TEXTURE0, this.texture)
    rendering.updateAndDraw(client.bufferGUI)

    rendering.setProgram(0)
    rendering.setView(0, 0, client.width, client.height)
    rendering.updateUniformMatrix('u_mvp', projection)

    let x = left + posC * magnify
    let y = top + height - (posR + 1) * magnify

    // box around view focus
    drawHollowRectangle(buffer, x, y, magnify, magnify, 2.0, 1.0, 1.0, 1.0, 1.0)

    // box around view
    drawHollowRectangle(buffer, left, top, width, height, 2.0, 1.0, 1.0, 1.0, 1.0)

    // sheet
    magnify = 4
    height = sheetRows * magnify
    top = client.height - 100 - height
    left = 100

    x = left + posOffsetC * magnify
    y = top + height - (posOffsetR + 1) * magnify

    // box around sheet focus
    let box = viewMultiplier * magnify
    drawHollowRectangle(buffer, x, y - box, box, box, 2.0, 1.0, 1.0, 1.0, 1.0)

    // box around sheet
    drawHollowRectangle(buffer, left, top, sheetColumns * magnify, height, 2.0, 1.0, 1.0, 1.0, 1.0)

    // pallete
    magnify = 32
    top = 70
    left = 600
    for (let r = 0; r < paletteRows; r++) {
      for (let c = 0; c < paletteColumns; c++) {
        let x = left + c * magnify
        let y = top - r * magnify
        let index = (c + r * columns) * 3
        let red = palette[index]
        let green = palette[index + 1]
        let blue = palette[index + 2]
        drawRectangle(buffer, x, y, magnify, magnify, red, green, blue, 1.0)
      }
    }

    x = left + painter.paletteC * magnify
    y = top - painter.paletteR * magnify
    drawHollowRectangle(buffer, x, y, magnify, magnify, 2.0, 1.0, 1.0, 1.0, 1.0)

    height = paletteRows * magnify
    drawHollowRectangle(buffer, left, top - height + magnify, paletteColumns * magnify, height, 2.0, 1.0, 1.0, 1.0, 1.0)

    // top bar
    drawRectangle(buffer, 0, client.height - fontHeight, client.width, fontHeight, 1.0, 241.0 / 255.0, 232.0 / 255.0, 1.0)

    rendering.updateAndDraw(buffer)

    // fonts
    rendering.setProgram(1)
    rendering.setView(0, 0, client.width, client.height)
    rendering.updateUniformMatrix('u_mvp', projection)

    client.bufferGUI.zero()

    let displayC = posC < 10 ? '0' + posC : '' + posC
    let displayR = posR < 10 ? '0' + posR : '' + posR
    let text = 'x = ' + displayC + ' y =' + displayR
    drawTextSpecial(client.bufferGUI, 10, client.height - fontHeight, text, 2.0, 1.0, 1.0, 1.0)

    let displaySheet = '#' + sheetIndex < 10 ? '00' + sheetIndex : sheetIndex < 100 ? '0' + sheetIndex : '' + sheetIndex
    drawTextSpecial(client.bufferGUI, 10, client.height - fontHeight * 3, displaySheet, 2.0, 1.0, 1.0, 1.0)

    drawTextSpecial(client.bufferGUI, 10, 10, 'painter', 2.0, 1.0, 1.0, 1.0)

    rendering.bindTexture(gl.TEXTURE0, textureByName('font').texture)
    rendering.updateAndDraw(client.bufferGUI)
  }
}
