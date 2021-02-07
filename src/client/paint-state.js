import {exportSheetPixels, exportSheetToCanvas, PaintEdit} from '../editor/paint.js'
import {textureByName} from '../assets/assets.js'
import {drawText, drawRectangle, drawHollowRectangle, drawImage, FONT_WIDTH, FONT_HEIGHT_BASE} from '../render/render.js'
import {renderTouch} from '../client/render-touch.js'
import {spr, sprcol} from '../render/pico.js'
import {identity, multiply} from '../math/matrix.js'
import {flexBox, flexSolve} from '../gui/flex.js'
import {compress, decompress} from '../compress/huffman.js'
import {createPixelsToTexture} from '../webgl/webgl.js'
import {calcFontScale, calcThickness, calcTopBarHeight, calcBottomBarHeight} from '../editor/editor-util.js'
import {renderDialogBox} from '../client/client-util.js'
import {
  black0f,
  black1f,
  black2f,
  white0f,
  white1f,
  white2f,
  lightgreyf,
  lavenderf,
  lightpeachf,
  redf,
  darkpurplef,
  darkgreyf,
  luminosity,
  luminosityTable,
} from '../editor/palette.js'

function updatePixelsToTexture(gl, texture, width, height, pixels) {
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, gl.RGB, gl.UNSIGNED_BYTE, pixels, 0)
  gl.bindTexture(gl.TEXTURE_2D, null)
  return texture
}

function guessColor(table, red, green, blue) {
  let lumin = luminosity(red, green, blue)
  for (let i = 0; i < table.length - 1; i++) {
    let c = table[i][0]
    let n = table[i + 1][0]
    if (lumin >= c && lumin <= n) {
      if (lumin - c < n - lumin) return table[i][1]
      else return table[i + 1][1]
    }
  }
  return table[table.length - 1][1]
}

function convertImageToText(palette, image) {
  const width = image.width
  const height = image.height

  let canvas = document.createElement('canvas')
  let context = canvas.getContext('2d')
  canvas.width = width
  canvas.height = height
  context.drawImage(image, 0, 0)
  let pixels = context.getImageData(0, 0, width, height).data

  let table = luminosityTable(palette)

  let text = width + ' ' + height
  for (let h = 0; h < height; h++) {
    text += '\n'
    for (let c = 0; c < width; c++) {
      let index = (c + h * width) * 4
      let red = pixels[index]
      let green = pixels[index + 1]
      let blue = pixels[index + 2]
      text += guessColor(table, red, green, blue) + ' '
    }
  }
  return text
}

export class PaintState {
  constructor(client) {
    this.client = client
    this.keys = client.keys

    this.view = new Float32Array(16)
    this.projection = new Float32Array(16)

    let paint = new PaintEdit(this, client.width, client.height - client.top, client.scale, client.input)
    this.paint = paint

    let rows = paint.sheetRows
    let columns = paint.sheetColumns
    let pixels = exportSheetPixels(paint, 0)

    let gl = client.gl
    this.texture = createPixelsToTexture(gl, columns, rows, pixels, gl.RGB, gl.NEAREST, gl.CLAMP_TO_EDGE).texture
  }

  reset() {
    this.paint.reset()
  }

  resize(width, height, scale) {
    this.paint.resize(width, height, scale)
  }

  keyEvent(code, down) {
    let paint = this.paint
    if (this.keys.has(code)) {
      paint.input.set(this.keys.get(code), down)
      paint.immediateInput()
    }
  }

  mouseEvent(left, down) {
    this.paint.input.mouseEvent(left, down)
  }

  mouseMove(x, y) {
    this.paint.input.mouseMove(x, y)
  }

  async initialize(file) {
    await this.paint.load(file)
    this.updateTexture()
  }

  eventCall(event) {
    if (event === 'export-plain text') this.exportPlain()
    else if (event === 'export-png') this.exportPng()
    else if (event === 'export-huffman') this.exportHuffman()
    else if (event === 'save-save') this.saveSheet()
    else if (event === 'start-open') this.importSheet()
    else if (event === 'start-save') this.saveSheet()
    else if (event === 'start-exit') this.returnToDashboard()
  }

  returnToDashboard() {
    this.client.openState('dashboard')
  }

  importSheet() {
    let button = document.createElement('input')
    button.type = 'file'
    button.onchange = (e) => {
      let file = e.target.files[0]
      console.info(file)
      let reader = new FileReader()
      if (file.type === 'image/png') {
        reader.readAsDataURL(file)
        reader.onload = (event) => {
          let content = event.target.result
          let image = new Image()
          image.src = content
          image.onload = () => {
            content = convertImageToText(this.paint.palette, image)
            this.paint.read(content, 0)
            this.updateTexture()
          }
        }
      } else if (file.name.endsWith('.huff')) {
        reader.readAsArrayBuffer(file)
        reader.onload = (event) => {
          let content = new Uint8Array(event.target.result)
          this.paint.read(decompress(content), 0)
          this.updateTexture()
        }
      } else {
        reader.readAsText(file, 'UTF-8')
        reader.onload = (event) => {
          let content = event.target.result
          this.paint.read(content, 0)
          this.updateTexture()
        }
      }
    }
    button.click()
  }

  saveSheet() {
    let blob = this.paint.export()
    localStorage.setItem('paint.txt', blob)
    console.info(blob)
    console.info('saved to local storage!')
  }

  exportPlain() {
    let blob = this.paint.export()
    let download = document.createElement('a')
    download.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(blob)
    download.download = 'sheet' + this.paint.sheetIndex + '.txt'
    download.click()
  }

  exportHuffman() {
    let blob = compress(this.paint.export())
    let download = document.createElement('a')
    download.href = window.URL.createObjectURL(new Blob([blob], {type: 'application/octet-stream'}))
    download.download = 'sheet' + this.paint.sheetIndex + '.huff'
    download.click()
  }

  exportPng() {
    let paint = this.paint
    let canvas = document.createElement('canvas')
    let context = canvas.getContext('2d')
    canvas.width = paint.sheetColumns
    canvas.height = paint.sheetRows
    let data = context.createImageData(canvas.width, canvas.height)
    exportSheetToCanvas(paint, paint.sheetIndex, data.data)
    context.putImageData(data, 0, 0)
    let blob = canvas.toDataURL('image/png')
    let download = document.createElement('a')
    download.href = blob
    download.download = 'sheet' + paint.sheetIndex + '.png'
    download.click()
  }

  updateTexture() {
    let paint = this.paint
    let rows = paint.sheetRows
    let columns = paint.sheetColumns
    let pixels = exportSheetPixels(paint, 0)
    updatePixelsToTexture(this.client.gl, this.texture, columns, rows, pixels)
  }

  update(timestamp) {
    let paint = this.paint
    paint.update(timestamp)
    if (paint.hasUpdates) this.updateTexture()
  }

  render() {
    const paint = this.paint
    if (!paint.doPaint) return

    const client = this.client
    const gl = client.gl
    const rendering = client.rendering
    const view = this.view
    const projection = this.projection
    const scale = paint.scale

    if (client.touch) renderTouch(client.touchRender)

    identity(view)
    multiply(projection, client.orthographic, view)

    const fontScale = calcFontScale(scale)
    const fontWidth = fontScale * FONT_WIDTH
    const fontHeight = fontScale * FONT_HEIGHT_BASE

    const thickness = calcThickness(scale)
    const doubleThick = 2 * thickness

    const canvasWidth = client.width
    const canvasHeight = client.height - client.top

    let brushSize = paint.brushSize
    let canvasZoom = paint.canvasZoom

    let posOffsetC = paint.positionOffsetC
    let posOffsetR = paint.positionOffsetR

    let posC = paint.positionC
    let posR = paint.positionR

    let paletteRows = paint.paletteRows
    let paletteColumns = paint.paletteColumns
    let palette = paint.paletteFloat

    let sheetRows = paint.sheetRows
    let sheetColumns = paint.sheetColumns
    let sheetIndex = paint.sheetIndex

    let toolColumns = paint.toolColumns

    let magnify, top, left, width, height, box, x, y

    rendering.setProgram(1)
    rendering.setView(0, client.top, canvasWidth, canvasHeight)
    rendering.updateUniformMatrix('u_mvp', projection)

    gl.clearColor(darkgreyf(0), darkgreyf(1), darkgreyf(2), 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)

    client.bufferGUI.zero()

    let sheetBox = paint.sheetBox
    let viewBox = paint.viewBox
    let toolBox = paint.toolBox
    let paletteBox = paint.paletteBox

    // sheet

    magnify = 2 * scale
    left = sheetBox.x
    top = sheetBox.y
    width = sheetBox.width
    height = sheetBox.height

    drawImage(client.bufferGUI, left, top, width, height, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0)

    // mini view

    let sl = posOffsetC / sheetColumns
    let st = posOffsetR / sheetRows
    let sr = (posOffsetC + canvasZoom) / sheetColumns
    let sb = (posOffsetR + canvasZoom) / sheetRows

    width = 16 * scale
    height = 16 * scale
    left = viewBox.x
    top = toolBox.y

    drawImage(client.bufferGUI, left, top, width, height, 1.0, 1.0, 1.0, 1.0, sl, st, sr, sb)

    // view

    magnify = scale
    if (canvasZoom === 8) magnify *= 16
    if (canvasZoom === 16) magnify *= 8
    if (canvasZoom === 32) magnify *= 4
    if (canvasZoom === 64) magnify *= 2

    left = viewBox.x
    top = viewBox.y
    width = viewBox.width
    height = viewBox.height

    drawImage(client.bufferGUI, left, top, width, height, 1.0, 1.0, 1.0, 1.0, sl, st, sr, sb)

    rendering.bindTexture(gl.TEXTURE0, this.texture)
    rendering.updateAndDraw(client.bufferGUI)

    rendering.setProgram(0)
    rendering.setView(0, client.top, canvasWidth, canvasHeight)
    rendering.updateUniformMatrix('u_mvp', projection)

    // box around view

    client.bufferColor.zero()

    drawHollowRectangle(client.bufferColor, left - thickness, top - thickness, width + doubleThick, height + doubleThick, thickness, black0f, black1f, black2f, 1.0)

    // focus box around view

    x = left + posC * magnify
    y = top + height - posR * magnify
    box = magnify * brushSize
    drawHollowRectangle(client.bufferColor, x, y - box, box, box, thickness, black0f, black1f, black2f, 1.0)
    drawHollowRectangle(client.bufferColor, x - thickness, y - thickness - box, box + doubleThick, box + doubleThick, thickness, white0f, white1f, white2f, 1.0)

    // sheet

    magnify = 2 * scale
    left = sheetBox.x
    top = sheetBox.y
    width = sheetBox.width
    height = sheetBox.height

    // box around sheet

    drawHollowRectangle(client.bufferColor, left - thickness, top - thickness, width + doubleThick, height + doubleThick, thickness, black0f, black1f, black2f, 1.0)

    // focus box around sheet

    x = left + posOffsetC * magnify
    y = top + height - posOffsetR * magnify
    box = canvasZoom * magnify
    drawHollowRectangle(client.bufferColor, x - thickness, y - thickness - box, box + doubleThick, box + doubleThick, thickness, white0f, white1f, white2f, 1.0)

    // pallete

    magnify = 16 * scale
    width = paletteBox.width
    height = paletteBox.height
    left = paletteBox.x
    top = paletteBox.y
    for (let r = 0; r < paletteRows; r++) {
      for (let c = 0; c < paletteColumns; c++) {
        let x = left + c * magnify
        let y = top + height - (r + 1) * magnify
        let index = (c + r * paletteColumns) * 3
        let red = palette[index]
        let green = palette[index + 1]
        let blue = palette[index + 2]
        drawRectangle(client.bufferColor, x, y, magnify, magnify, red, green, blue, 1.0)
      }
    }

    // box around palette

    drawHollowRectangle(client.bufferColor, left - thickness, top - thickness, width + doubleThick, height + doubleThick, thickness, black0f, black1f, black2f, 1.0)

    // focus box around palette

    x = left + paint.paletteC * magnify
    y = top + height - (paint.paletteR + 1) * magnify
    drawHollowRectangle(client.bufferColor, x, y, magnify, magnify, thickness, black0f, black1f, black2f, 1.0)
    drawHollowRectangle(client.bufferColor, x - thickness, y - thickness, magnify + doubleThick, magnify + doubleThick, thickness, white0f, white1f, white2f, 1.0)

    // top and bottom bar

    const topBarHeight = calcTopBarHeight(scale)
    drawRectangle(client.bufferColor, 0, canvasHeight - topBarHeight, canvasWidth, topBarHeight, redf(0), redf(1), redf(2), 1.0)

    const bottomBarHeight = calcBottomBarHeight(scale)
    drawRectangle(client.bufferColor, 0, 0, canvasWidth, bottomBarHeight, redf(0), redf(1), redf(2), 1.0)

    rendering.updateAndDraw(client.bufferColor)

    // special textures

    rendering.setProgram(3)
    rendering.setView(0, client.top, canvasWidth, canvasHeight)
    rendering.updateUniformMatrix('u_mvp', projection)

    client.bufferGUI.zero()

    // tools

    let toolMagnify = 16 * scale
    let toolLeft = toolBox.x
    let toolTop = toolBox.y
    y = toolTop
    for (let c = 0; c < toolColumns; c++) {
      let x = toolLeft + c * toolMagnify
      if (c === paint.tool) {
        spr(client.bufferGUI, c, 1.0, 1.0, x, y - 2 * scale, toolMagnify, toolMagnify)
      } else {
        sprcol(client.bufferGUI, c, 1.0, 1.0, x, y - 2 * scale, toolMagnify, toolMagnify, lavenderf(0), lavenderf(1), lavenderf(2), 1.0)
      }
    }

    // right top bar

    let spriteSize = 16 * scale
    x = canvasWidth - fontWidth
    y = canvasHeight - topBarHeight - Math.floor(0.2 * spriteSize)
    for (let c = 17; c < 21; c++) {
      if (c === 17) sprcol(client.bufferGUI, c, 1.0, 1.0, x - (21 - c) * spriteSize, y, spriteSize, spriteSize, lightpeachf(0), lightpeachf(1), lightpeachf(2), 1.0)
      else sprcol(client.bufferGUI, c, 1.0, 1.0, x - (21 - c) * spriteSize, y, spriteSize, spriteSize, darkpurplef(0), darkpurplef(1), darkpurplef(2), 1.0)
    }

    rendering.bindTexture(gl.TEXTURE0, textureByName('editor-sprites').texture)
    rendering.updateAndDraw(client.bufferGUI)

    // text

    rendering.setProgram(4)
    rendering.setView(0, client.top, canvasWidth, canvasHeight)
    rendering.updateUniformMatrix('u_mvp', projection)

    client.bufferGUI.zero()

    let displayC = posC < 10 ? '0' + posC : '' + posC
    let displayR = posR < 10 ? '0' + posR : '' + posR
    let text = 'x:' + displayC + ' y:' + displayR
    let posBox = flexBox(fontWidth * text.length, fontHeight)
    posBox.funX = 'center'
    posBox.fromX = viewBox
    posBox.funY = 'above'
    posBox.fromY = viewBox
    flexSolve(0, 0, posBox)
    drawText(client.bufferGUI, posBox.x, posBox.y, text, fontScale, lightgreyf(0), lightgreyf(1), lightgreyf(2), 1.0)

    let displaySheet = 'sheet #' + (sheetIndex < 10 ? '00' + sheetIndex : sheetIndex < 100 ? '0' + sheetIndex : '' + sheetIndex)
    let sheetNumBox = flexBox(fontWidth * displaySheet.length, fontHeight)
    sheetNumBox.funX = 'align-left'
    sheetNumBox.fromX = sheetBox
    sheetNumBox.funY = 'above'
    sheetNumBox.fromY = sheetBox
    flexSolve(0, 0, sheetNumBox)
    drawText(client.bufferGUI, sheetNumBox.x, sheetNumBox.y, displaySheet, fontScale, lightgreyf(0), lightgreyf(1), lightgreyf(2), 1.0)

    let spriteIndex = posOffsetC / 8 + 2 * posOffsetR
    let displayIndex = ' index:' + (spriteIndex < 10 ? '00' + spriteIndex : spriteIndex < 100 ? '0' + spriteIndex : '' + spriteIndex)
    let positionBox = flexBox(fontWidth * displayIndex.length, fontHeight)
    positionBox.funX = 'align-right'
    positionBox.fromX = sheetBox
    positionBox.funY = 'above'
    positionBox.fromY = sheetBox
    flexSolve(0, 0, positionBox)
    drawText(client.bufferGUI, positionBox.x, positionBox.y, displayIndex, fontScale, lightgreyf(0), lightgreyf(1), lightgreyf(2), 1.0)

    // left top bar text

    y = canvasHeight - topBarHeight // Math.floor(0.5 * (topBarHeight + fontHeight))

    const leftTopBar = 'PAINT'
    drawText(client.bufferGUI, fontWidth, y, leftTopBar, fontScale, darkpurplef(0), darkpurplef(1), darkpurplef(2), 1.0)

    // bottom bar text

    y = 0

    const leftStatusBar = paint.leftStatusBar()
    if (leftStatusBar) drawText(client.bufferGUI, fontWidth, y, leftStatusBar, fontScale, darkpurplef(0), darkpurplef(1), darkpurplef(2), 1.0)

    const rightStatusBar = paint.rightStatusBar()
    if (rightStatusBar)
      drawText(client.bufferGUI, canvasWidth - (rightStatusBar.length + 1) * fontWidth, y, rightStatusBar, fontScale, darkpurplef(0), darkpurplef(1), darkpurplef(2), 1.0)

    rendering.bindTexture(gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
    rendering.updateAndDraw(client.bufferGUI)

    // dialog box

    if (paint.dialog != null) renderDialogBox(this, scale, paint.dialog)
  }
}
