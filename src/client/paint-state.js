import { textureByName } from '../assets/assets.js'
import { renderDialogBox, renderStatus, renderTextBox } from '../client/client-util.js'
import { renderTouch } from '../client/render-touch.js'
import { compress, decompress } from '../compress/huffman.js'
import { calcBottomBarHeight, calcFontScale, calcThickness, calcTopBarHeight, defaultFont } from '../editor/editor-util.js'
import { exportPixels, exportToCanvas, PaintEdit, SPRITE_TOOL } from '../editor/paint.js'
import {
  black0f,
  black1f,
  black2f,
  closestInPalette,
  lavender0f,
  lavender1f,
  lavender2f,
  lavenderf,
  red0f,
  red1f,
  red2f,
  redf,
  silverf,
  slatef,
  white0f,
  white1f,
  white2f,
} from '../editor/palette.js'
import { flexBox, flexSolve } from '../gui/flex.js'
import { identity, multiply } from '../math/matrix.js'
import { spr, sprcol } from '../render/pico.js'
import { drawHollowRectangle, drawImage, drawRectangle, drawTextFont, drawTextFontSpecial } from '../render/render.js'
import { bufferZero } from '../webgl/buffer.js'
import { rendererBindTexture, rendererSetProgram, rendererSetView, rendererUpdateAndDraw, rendererUpdateUniformMatrix } from '../webgl/renderer.js'
import { createPixelsToTexture } from '../webgl/webgl.js'

function updatePixelsToTexture(gl, texture, width, height, pixels) {
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, gl.RGB, gl.UNSIGNED_BYTE, pixels, 0)
  gl.bindTexture(gl.TEXTURE_2D, null)
  return texture
}

function convertImageToText(palette, image, name) {
  const width = image.width
  const height = image.height

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  canvas.width = width
  canvas.height = height
  context.drawImage(image, 0, 0)
  const pixels = context.getImageData(0, 0, width, height).data

  let text = `paint ${name} ${width} ${height}`
  for (let h = 0; h < height; h++) {
    text += '\n'
    for (let c = 0; c < width; c++) {
      const index = (c + h * width) * 4
      const red = pixels[index]
      const green = pixels[index + 1]
      const blue = pixels[index + 2]
      text += closestInPalette(palette, red, green, blue) + ' '
    }
  }
  text += '\nend paint'
  return text
}

export class PaintState {
  constructor(client) {
    this.client = client
    this.keys = client.keys

    this.view = new Float32Array(16)
    this.projection = new Float32Array(16)

    const paint = new PaintEdit(this, client.width, client.height - client.top, client.scale, client.input)
    this.paint = paint

    const rows = paint.sheetRows
    const columns = paint.sheetColumns
    const pixels = exportPixels(paint)

    const gl = client.gl
    this.texture = createPixelsToTexture(gl, columns, rows, pixels, gl.RGB, gl.RGB, gl.NEAREST, gl.CLAMP_TO_EDGE).texture
  }

  reset() {
    this.paint.reset()
  }

  resize(width, height, scale) {
    this.paint.resize(width, height, scale)
  }

  keyEvent(code, down) {
    const paint = this.paint
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
    const button = document.createElement('input')
    button.type = 'file'
    button.onchange = (e) => {
      const file = e.target.files[0]
      console.info(file)
      const reader = new FileReader()
      if (file.type === 'image/png') {
        reader.readAsDataURL(file)
        reader.onload = (event) => {
          let content = event.target.result
          const image = new Image()
          image.src = content
          image.onload = () => {
            const dot = file.name.indexOf('.')
            const name = dot <= 0 ? file.name : file.name.substring(0, dot)
            content = convertImageToText(this.paint.palette, image, name)
            this.paint.read(content)
            this.updateTexture()
          }
        }
      } else if (file.name.endsWith('.huff')) {
        reader.readAsArrayBuffer(file)
        reader.onload = (event) => {
          const content = new Uint8Array(event.target.result)
          this.paint.read(decompress(content))
          this.updateTexture()
        }
      } else {
        reader.readAsText(file, 'utf-8')
        reader.onload = (event) => {
          const content = event.target.result
          this.paint.read(content)
          this.updateTexture()
        }
      }
    }
    button.click()
  }

  saveSheet() {
    const blob = this.paint.export()
    localStorage.setItem('paint.txt', blob)
    console.info(blob)
    console.info('saved to local storage!')
  }

  exportPlain() {
    const blob = this.paint.export()
    const download = document.createElement('a')
    download.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(blob)
    download.download = this.paint.name + '.txt'
    download.click()
  }

  exportHuffman() {
    const blob = compress(this.paint.export())
    const download = document.createElement('a')
    download.href = window.URL.createObjectURL(new Blob([blob], { type: 'application/octet-stream' }))
    download.download = this.paint.name + '.huff'
    download.click()
  }

  exportPng() {
    const paint = this.paint
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.width = paint.sheetColumns
    canvas.height = paint.sheetRows
    const data = context.createImageData(canvas.width, canvas.height)
    exportToCanvas(paint, data.data)
    context.putImageData(data, 0, 0)
    const blob = canvas.toDataURL('image/png')
    const download = document.createElement('a')
    download.href = blob
    download.download = this.paint.name + '.png'
    download.click()
  }

  updateTexture() {
    const paint = this.paint
    const rows = paint.sheetRows
    const columns = paint.sheetColumns
    const pixels = exportPixels(paint)
    updatePixelsToTexture(this.client.gl, this.texture, columns, rows, pixels)
  }

  update(timestamp) {
    const paint = this.paint
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

    const font = defaultFont()
    const fontScale = calcFontScale(scale)
    const fontWidth = fontScale * font.width
    const fontHeight = fontScale * font.base

    const thickness = calcThickness(scale)
    const doubleThick = 2 * thickness

    const width = client.width
    const height = client.height - client.top

    const brushSize = paint.brushSize
    const canvasZoom = paint.canvasZoom

    const posOffsetC = paint.positionOffsetC
    const posOffsetR = paint.positionOffsetR

    const posC = paint.positionC
    const posR = paint.positionR

    const paletteRows = paint.paletteRows
    const paletteColumns = paint.paletteColumns
    const palette = paint.paletteFloat

    const sheetRows = paint.sheetRows
    const sheetColumns = paint.sheetColumns

    const toolColumns = paint.toolColumns

    let magnify, top, left, boxWidth, boxHeight, box, x, y

    rendererSetProgram(rendering, 'texture2d')
    rendererSetView(rendering, 0, client.top, width, height)
    rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

    gl.clearColor(slatef(0), slatef(1), slatef(2), 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)

    bufferZero(client.bufferGUI)

    const sheetBox = paint.sheetBox
    const viewBox = paint.viewBox
    const miniBox = paint.miniBox
    const toolBox = paint.toolBox
    const paletteBox = paint.paletteBox

    // sheet

    magnify = 2 * scale
    left = sheetBox.x
    top = sheetBox.y
    boxWidth = sheetBox.width
    boxHeight = sheetBox.height

    drawImage(client.bufferGUI, left, top, boxWidth, boxHeight, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0)

    // mini view

    const sl = posOffsetC / sheetColumns
    const st = posOffsetR / sheetRows
    const sr = (posOffsetC + canvasZoom) / sheetColumns
    const sb = (posOffsetR + canvasZoom) / sheetRows

    drawImage(client.bufferGUI, miniBox.x, miniBox.y, miniBox.width, miniBox.height, 1.0, 1.0, 1.0, 1.0, sl, st, sr, sb)

    // view

    magnify = scale
    if (canvasZoom === 8) magnify *= 16
    if (canvasZoom === 16) magnify *= 8
    if (canvasZoom === 32) magnify *= 4
    if (canvasZoom === 64) magnify *= 2

    left = viewBox.x
    top = viewBox.y
    boxWidth = viewBox.width
    boxHeight = viewBox.height

    drawImage(client.bufferGUI, left, top, boxWidth, boxHeight, 1.0, 1.0, 1.0, 1.0, sl, st, sr, sb)

    rendererBindTexture(rendering, gl.TEXTURE0, this.texture)
    rendererUpdateAndDraw(rendering, client.bufferGUI)

    rendererSetProgram(rendering, 'color2d')
    rendererSetView(rendering, 0, client.top, width, height)
    rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

    // box around view

    bufferZero(client.bufferColor)

    drawHollowRectangle(client.bufferColor, left - thickness, top - thickness, boxWidth + doubleThick, boxHeight + doubleThick, thickness, black0f, black1f, black2f, 1.0)

    // focus in view

    x = left + posC * magnify
    y = top + boxHeight - posR * magnify
    box = magnify * brushSize
    drawHollowRectangle(client.bufferColor, x, y - box, box, box, thickness, black0f, black1f, black2f, 1.0)
    drawHollowRectangle(client.bufferColor, x - thickness, y - thickness - box, box + doubleThick, box + doubleThick, thickness, white0f, white1f, white2f, 1.0)

    // selection in view

    if (paint.selectL !== null) {
      let selectX, selectY, selectWidth, selectHeight
      if (paint.selectR === null) {
        let l = paint.selectL
        let t = paint.selectT
        let r = posC + posOffsetC
        let b = posR + posOffsetR
        if (r < l) {
          const temp = l
          l = r
          r = temp
        }
        if (b < t) {
          const temp = t
          t = b
          b = temp
        }
        selectWidth = (r - l + 1) * magnify
        selectHeight = (b - t + 1) * magnify
        selectX = left + l * magnify
        selectY = top + boxHeight - t * magnify - selectHeight
      } else {
        selectWidth = (paint.selectR - paint.selectL + 1) * magnify
        selectHeight = (paint.selectB - paint.selectT + 1) * magnify
        selectX = left + paint.selectL * magnify
        selectY = top + boxHeight - paint.selectT * magnify - selectHeight
      }
      const rectWidth = selectWidth + doubleThick
      const rectHeight = selectHeight + doubleThick
      if (selectX < x + box && selectY < y + box) {
        selectX -= thickness
        selectY -= thickness
        drawRectangle(client.bufferColor, selectX, selectY, rectWidth, thickness, red0f, red1f, red2f, 1.0)
        drawRectangle(client.bufferColor, selectX, selectY, thickness, rectHeight, red0f, red1f, red2f, 1.0)
        drawRectangle(client.bufferColor, selectX + rectWidth - thickness, selectY, thickness, rectHeight, red0f, red1f, red2f, 1.0)
        drawRectangle(client.bufferColor, selectX, selectY + rectHeight - thickness, rectWidth, thickness, red0f, red1f, red2f, 1.0)
      }
    }

    // sheet

    magnify = 2 * scale
    left = sheetBox.x
    top = sheetBox.y
    boxWidth = sheetBox.width
    boxHeight = sheetBox.height

    // box around sheet

    drawHollowRectangle(client.bufferColor, left - thickness, top - thickness, boxWidth + doubleThick, boxHeight + doubleThick, thickness, black0f, black1f, black2f, 1.0)

    // sprites in sheet

    if (paint.tool === SPRITE_TOOL) {
      for (const sprite of paint.sprites) {
        const w = (sprite.r - sprite.l + 1) * magnify
        const h = (sprite.b - sprite.t + 1) * magnify
        x = left + sprite.l * magnify
        y = top + boxHeight - sprite.t * magnify - h
        drawHollowRectangle(client.bufferColor, x - thickness, y - thickness, w + doubleThick, h + doubleThick, thickness, lavender0f, lavender1f, lavender2f, 1.0)
      }
    }

    // focus in sheet

    x = left + posOffsetC * magnify
    y = top + boxHeight - posOffsetR * magnify
    box = canvasZoom * magnify
    drawHollowRectangle(client.bufferColor, x - thickness, y - thickness - box, box + doubleThick, box + doubleThick, thickness, white0f, white1f, white2f, 1.0)

    // selection in sheet

    if (paint.selectL !== null) {
      let selectionWidth, selectionHeight
      if (paint.selectR === null) {
        let l = paint.selectL
        let t = paint.selectT
        let r = posC + posOffsetC
        let b = posR + posOffsetR
        if (r < l) {
          const temp = l
          l = r
          r = temp
        }
        if (b < t) {
          const temp = t
          t = b
          b = temp
        }
        selectionWidth = (r - l + 1) * magnify
        selectionHeight = (b - t + 1) * magnify
        x = left + l * magnify
        y = top + boxHeight - t * magnify - selectionHeight
      } else {
        selectionWidth = (paint.selectR - paint.selectL + 1) * magnify
        selectionHeight = (paint.selectB - paint.selectT + 1) * magnify
        x = left + paint.selectL * magnify
        y = top + boxHeight - paint.selectT * magnify - selectionHeight
      }
      drawHollowRectangle(client.bufferColor, x - thickness, y - thickness, selectionWidth + doubleThick, selectionHeight + doubleThick, thickness, red0f, red1f, red2f, 1.0)
    }

    // pallete

    magnify = 16 * scale
    boxWidth = paletteBox.width
    boxHeight = paletteBox.height
    left = paletteBox.x
    top = paletteBox.y
    for (let r = 0; r < paletteRows; r++) {
      for (let c = 0; c < paletteColumns; c++) {
        const x = left + c * magnify
        const y = top + boxHeight - (r + 1) * magnify
        const index = (c + r * paletteColumns) * 3
        const red = palette[index]
        const green = palette[index + 1]
        const blue = palette[index + 2]
        drawRectangle(client.bufferColor, x, y, magnify, magnify, red, green, blue, 1.0)
      }
    }

    // box around palette

    drawHollowRectangle(client.bufferColor, left - thickness, top - thickness, boxWidth + doubleThick, boxHeight + doubleThick, thickness, black0f, black1f, black2f, 1.0)

    // focus in palette

    x = left + paint.paletteC * magnify
    y = top + boxHeight - (paint.paletteR + 1) * magnify
    drawHollowRectangle(client.bufferColor, x, y, magnify, magnify, thickness, black0f, black1f, black2f, 1.0)
    drawHollowRectangle(client.bufferColor, x - thickness, y - thickness, magnify + doubleThick, magnify + doubleThick, thickness, white0f, white1f, white2f, 1.0)

    // top and bottom bar

    const topBarHeight = calcTopBarHeight(scale)
    drawRectangle(client.bufferColor, 0, height - topBarHeight, width, topBarHeight, redf(0), redf(1), redf(2), 1.0)

    const bottomBarHeight = calcBottomBarHeight(scale)
    drawRectangle(client.bufferColor, 0, 0, width, bottomBarHeight, redf(0), redf(1), redf(2), 1.0)

    rendererUpdateAndDraw(rendering, client.bufferColor)

    // special textures

    rendererSetProgram(rendering, 'texture2d-rgb')
    rendererSetView(rendering, 0, client.top, width, height)
    rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

    bufferZero(client.bufferGUI)

    // tools

    const toolMagnify = 16 * scale
    const toolLeft = toolBox.x
    const toolTop = toolBox.y
    y = toolTop
    for (let c = 0; c < toolColumns; c++) {
      const x = toolLeft + c * toolMagnify
      if (c === paint.tool) {
        spr(client.bufferGUI, c, 1.0, 1.0, x, y - 2 * scale, toolMagnify, toolMagnify)
      } else {
        sprcol(client.bufferGUI, c, 1.0, 1.0, x, y - 2 * scale, toolMagnify, toolMagnify, lavenderf(0), lavenderf(1), lavenderf(2), 1.0)
      }
    }

    rendererBindTexture(rendering, gl.TEXTURE0, textureByName('editor-sprites').texture)
    rendererUpdateAndDraw(rendering, client.bufferGUI)

    // text

    rendererSetProgram(rendering, 'texture2d-font')
    rendererSetView(rendering, 0, client.top, width, height) // FIXME
    rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

    bufferZero(client.bufferGUI)

    let displayC = '' + (posC + posOffsetC)
    let displayR = '' + (posR + posOffsetR)
    while (displayC.length < 3) displayC = '0' + displayC
    while (displayR.length < 3) displayR = '0' + displayR
    const text = 'x:' + displayC + ' y:' + displayR
    const posBox = flexBox(fontWidth * text.length, fontHeight)
    posBox.funX = 'center'
    posBox.fromX = viewBox
    posBox.funY = 'above'
    posBox.fromY = viewBox
    flexSolve(0, 0, posBox)
    drawTextFont(client.bufferGUI, posBox.x, posBox.y, text, fontScale, silverf(0), silverf(1), silverf(2), 1.0, font)

    const displaySheet = paint.name
    const sheetNumBox = flexBox(fontWidth * displaySheet.length, fontHeight)
    sheetNumBox.funX = 'align-left'
    sheetNumBox.fromX = sheetBox
    sheetNumBox.funY = 'above'
    sheetNumBox.fromY = sheetBox
    flexSolve(0, 0, sheetNumBox)
    drawTextFont(client.bufferGUI, sheetNumBox.x, sheetNumBox.y, displaySheet, fontScale, silverf(0), silverf(1), silverf(2), 1.0, font)

    const spriteIndex = posOffsetC / 8 + 2 * posOffsetR
    const displayIndex = ' index:' + (spriteIndex < 10 ? '00' + spriteIndex : spriteIndex < 100 ? '0' + spriteIndex : '' + spriteIndex)
    const positionBox = flexBox(fontWidth * displayIndex.length, fontHeight)
    positionBox.funX = 'align-right'
    positionBox.fromX = sheetBox
    positionBox.funY = 'above'
    positionBox.fromY = sheetBox
    flexSolve(0, 0, positionBox)
    drawTextFont(client.bufferGUI, positionBox.x, positionBox.y, displayIndex, fontScale, silverf(0), silverf(1), silverf(2), 1.0, font)

    //  status text

    renderStatus(client, width, height, font, fontWidth, fontScale, topBarHeight, paint)

    rendererBindTexture(rendering, gl.TEXTURE0, textureByName(font.name).texture)
    rendererUpdateAndDraw(rendering, client.bufferGUI)

    // dialog box or text box

    if (paint.dialog !== null) renderDialogBox(this, scale, font, paint.dialog)
    else if (paint.activeTextBox) {
      const box = paint.textBox
      renderTextBox(this, scale, font, box, 200, 200)

      bufferZero(client.bufferGUI)
      drawTextFontSpecial(client.bufferGUI, 200, 500, box.text, fontScale, white0f, white1f, white2f, font)
      rendererUpdateAndDraw(rendering, client.bufferGUI)
    }
  }
}
