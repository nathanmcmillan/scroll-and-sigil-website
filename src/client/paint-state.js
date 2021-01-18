import {exportSheetPixels, exportSheetToCanvas, PaintEdit} from '/src/editor/paint.js'
import {textureByName} from '/src/assets/assets.js'
import {drawText, drawTextSpecial, drawRectangle, drawHollowRectangle, drawImage, FONT_WIDTH, FONT_HEIGHT} from '/src/render/render.js'
import {renderTouch} from '/src/client/render-touch.js'
import {spr, sprcol} from '/src/render/pico.js'
import {identity, multiply} from '/src/math/matrix.js'
import {blackf, whitef, redf, darkpurplef, darkgreyf, luminosity, luminosityTable} from '/src/editor/palette.js'
import {flexBox, flexSolve} from '/src/flex/flex.js'
import {compress, decompress} from '/src/compress/huffman.js'
import {createPixelsToTexture} from '/src/webgl/webgl.js'

// TODO: Need a sprite mode, selection rectangle + name = sprite

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

    let painter = new PaintEdit(client.width, client.height, client.scale, client.input)
    this.painter = painter

    let rows = painter.sheetRows
    let columns = painter.sheetColumns
    let pixels = exportSheetPixels(painter, 0)

    let gl = client.gl
    this.texture = createPixelsToTexture(gl, columns, rows, pixels, gl.RGB, gl.NEAREST, gl.CLAMP_TO_EDGE).texture
  }

  reset() {}

  resize(width, height, scale) {
    this.painter.resize(width, height, scale)
  }

  keyEvent(code, down) {
    let painter = this.painter
    if (this.keys.has(code)) painter.input.set(this.keys.get(code), down)
    if (down && code === 'Digit0') {
      // local storage
      let blob = painter.export()
      localStorage.setItem('paint-edit', blob)
      console.info('saved to local storage!')
    } else if (down && code === 'Digit6') {
      // compressed text
      let blob = compress(painter.export())
      let download = document.createElement('a')
      download.href = window.URL.createObjectURL(new Blob([blob], {type: 'application/octet-stream'}))
      download.download = 'sheet' + painter.sheetIndex + '.huff'
      download.click()
    } else if (down && code === 'Digit8') {
      // plain text
      let blob = painter.export()
      let download = document.createElement('a')
      download.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(blob)
      download.download = 'sheet' + painter.sheetIndex + '.txt'
      download.click()
    } else if (down && code === 'Digit9') {
      // png
      let canvas = document.createElement('canvas')
      let context = canvas.getContext('2d')
      canvas.width = painter.sheetColumns
      canvas.height = painter.sheetRows
      let data = context.createImageData(canvas.width, canvas.height)
      exportSheetToCanvas(painter, painter.sheetIndex, data.data)
      context.putImageData(data, 0, 0)
      let blob = canvas.toDataURL('image/png')
      let download = document.createElement('a')
      download.href = blob
      download.download = 'sheet' + painter.sheetIndex + '.png'
      download.click()
    } else if (down && code === 'Digit7') {
      // import
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
              content = convertImageToText(painter.palette, image)
              this.painter.read(content, 0)
              this.updateTexture()
            }
          }
        } else if (file.name.endsWith('.huff')) {
          reader.readAsArrayBuffer(file)
          reader.onload = (event) => {
            let content = new Uint8Array(event.target.result)
            this.painter.read(decompress(content), 0)
            this.updateTexture()
          }
        } else {
          reader.readAsText(file, 'UTF-8')
          reader.onload = (event) => {
            let content = event.target.result
            this.painter.read(content, 0)
            this.updateTexture()
          }
        }
      }
      button.click()
    } else if (down && code === 'Digit1') {
      this.client.openState('dashboard')
    }
  }

  mouseEvent(left, down) {
    this.painter.input.mouseEvent(left, down)
  }

  mouseMove(x, y) {
    this.painter.input.mouseMove(x, y)
  }

  async initialize(file) {
    await this.painter.load(file)
    this.updateTexture()
  }

  updateTexture() {
    let painter = this.painter
    let rows = painter.sheetRows
    let columns = painter.sheetColumns
    let pixels = exportSheetPixels(painter, 0)
    updatePixelsToTexture(this.client.gl, this.texture, columns, rows, pixels)
  }

  update(timestamp) {
    let painter = this.painter
    painter.update(timestamp)
    if (painter.hasUpdates) this.updateTexture()
  }

  render() {
    const painter = this.painter
    if (!painter.doPaint) return

    const client = this.client
    const gl = client.gl
    const rendering = client.rendering
    const view = this.view
    const projection = this.projection
    const scale = painter.scale

    if (client.touch) renderTouch(client.touchRender)

    identity(view)
    multiply(projection, client.orthographic, view)

    let buffer = client.bufferColor
    buffer.zero()

    const fontScale = Math.floor(1.5 * scale)
    const fontWidth = fontScale * FONT_WIDTH
    const fontHeight = fontScale * FONT_HEIGHT

    const thickness = scale
    const doubleThick = 2 * thickness
    const fourThick = 2 * doubleThick
    const pad = 2 * scale

    let canvasWidth = client.width
    let canvasHeight = client.height - client.top

    let brushSize = painter.brushSize
    let canvasZoom = painter.canvasZoom

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

    let toolColumns = painter.toolColumns

    let magnify, top, left, width, height, box, x, y

    let black0 = blackf()
    let black1 = blackf()
    let black2 = blackf()

    let white0 = whitef(0)
    let white1 = whitef(1)
    let white2 = whitef(2)

    rendering.setProgram(1)
    rendering.setView(0, client.top, canvasWidth, canvasHeight)
    rendering.updateUniformMatrix('u_mvp', projection)

    gl.clearColor(darkgreyf(0), darkgreyf(1), darkgreyf(2), 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)

    client.bufferGUI.zero()

    let sheetBox = painter.sheetBox
    let viewBox = painter.viewBox
    let toolBox = painter.toolBox
    let paletteBox = painter.paletteBox

    // sheet
    magnify = 2 * scale
    left = sheetBox.x
    top = sheetBox.y
    width = sheetBox.width
    height = sheetBox.height

    drawImage(client.bufferGUI, left, top, width, height, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0)

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

    let sl = posOffsetC / sheetColumns
    let st = posOffsetR / sheetRows
    let sr = (posOffsetC + canvasZoom) / sheetColumns
    let sb = (posOffsetR + canvasZoom) / sheetRows

    drawImage(client.bufferGUI, left, top, width, height, 1.0, 1.0, 1.0, 1.0, sl, st, sr, sb)

    rendering.bindTexture(gl.TEXTURE0, this.texture)
    rendering.updateAndDraw(client.bufferGUI)

    rendering.setProgram(0)
    rendering.setView(0, client.top, canvasWidth, canvasHeight)
    rendering.updateUniformMatrix('u_mvp', projection)

    // box around view
    drawHollowRectangle(buffer, left - thickness, top - thickness, width + doubleThick, height + doubleThick, thickness, black0, black1, black2, 1.0)
    drawHollowRectangle(buffer, left - doubleThick, top - doubleThick, width + fourThick, height + fourThick, thickness, white0, white1, white2, 1.0)
    drawRectangle(buffer, left - doubleThick, top - doubleThick - thickness, width + fourThick, thickness, blackf(0), blackf(1), blackf(2), 1.0)

    // box around view focus
    x = left + posC * magnify
    y = top + height - posR * magnify
    box = magnify * brushSize
    drawHollowRectangle(buffer, x - thickness, y - thickness - box, box + doubleThick, box + doubleThick, thickness, black0, black1, black2, 1.0)
    drawHollowRectangle(buffer, x - doubleThick, y - doubleThick - box, box + fourThick, box + fourThick, thickness, white0, white1, white2, 1.0)

    // sheet
    magnify = 2 * scale
    left = sheetBox.x
    top = sheetBox.y
    width = sheetBox.width
    height = sheetBox.height

    // box around sheet
    drawHollowRectangle(buffer, left - thickness, top - thickness, width + doubleThick, height + doubleThick, thickness, black0, black1, black2, 1.0)
    drawHollowRectangle(buffer, left - doubleThick, top - doubleThick, width + fourThick, height + fourThick, thickness, white0, white1, white2, 1.0)
    drawRectangle(buffer, left - doubleThick, top - doubleThick - thickness, width + fourThick, thickness, blackf(0), blackf(1), blackf(2), 1.0)

    // box around sheet focus
    x = left + posOffsetC * magnify
    y = top + height - posOffsetR * magnify
    box = canvasZoom * magnify
    drawHollowRectangle(buffer, x - thickness, y - thickness - box, box + doubleThick, box + doubleThick, thickness, black0, black1, black2, 1.0)
    drawHollowRectangle(buffer, x - doubleThick, y - doubleThick - box, box + fourThick, box + fourThick, thickness, white0, white1, white2, 1.0)

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
        drawRectangle(buffer, x, y, magnify, magnify, red, green, blue, 1.0)
      }
    }

    // box around palette
    drawHollowRectangle(buffer, left - thickness, top - thickness, width + doubleThick, height + doubleThick, thickness, black0, black1, black2, 1.0)
    drawHollowRectangle(buffer, left - doubleThick, top - doubleThick, width + fourThick, height + fourThick, thickness, white0, white1, white2, 1.0)
    drawRectangle(buffer, left - doubleThick, top - doubleThick - thickness, width + fourThick, thickness, blackf(0), blackf(1), blackf(2), 1.0)

    // box around palette focus
    x = left + painter.paletteC * magnify
    y = top + height - (painter.paletteR + 1) * magnify
    drawHollowRectangle(buffer, x - thickness, y - thickness, magnify + doubleThick, magnify + doubleThick, thickness, black0, black1, black2, 1.0)
    drawHollowRectangle(buffer, x - doubleThick, y - doubleThick, magnify + fourThick, magnify + fourThick, thickness, white0, white1, white2, 1.0)

    // top bar
    let topBarHeight = fontHeight + 2 * pad
    drawRectangle(buffer, 0, canvasHeight - topBarHeight, canvasWidth, topBarHeight, redf(0), redf(1), redf(2), 1.0)
    // drawRectangle(buffer, 0, canvasHeight - topBarHeight - thickness, canvasWidth, thickness, darkgreyf(0), darkgreyf(1), darkgreyf(2), 1.0)

    // bottom bar
    drawRectangle(buffer, 0, 0, canvasWidth, topBarHeight, redf(0), redf(1), redf(2), 1.0)

    rendering.updateAndDraw(buffer)

    // special textures
    rendering.setProgram(3)
    rendering.setView(0, client.top, canvasWidth, canvasHeight)
    rendering.updateUniformMatrix('u_mvp', projection)

    client.bufferGUI.zero()

    // tools
    let toolMagnify = 16 * scale
    let toolLeft = toolBox.x
    let toolTop = toolBox.y
    for (let c = 0; c < toolColumns; c++) {
      let x = toolLeft + c * toolMagnify
      let y = toolTop
      if (c === painter.tool) {
        spr(client.bufferGUI, c, 1.0, 1.0, x, y - 2 * scale, toolMagnify, toolMagnify)
      } else {
        sprcol(client.bufferGUI, c, 1.0, 1.0, x, y - 2 * scale, toolMagnify, toolMagnify, 0.0, 0.0, 0.0, 1.0)
        spr(client.bufferGUI, c, 1.0, 1.0, x, y, toolMagnify, toolMagnify)
      }
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
    let text = 'x=' + displayC + ' y=' + displayR
    let posBox = flexBox(fontWidth * text.length, fontHeight)
    posBox.funX = 'center'
    posBox.fromX = viewBox
    posBox.funY = 'above'
    posBox.fromY = viewBox
    flexSolve(0, 0, posBox)
    drawTextSpecial(client.bufferGUI, posBox.x, posBox.y, text, fontScale, white0, white1, white2)

    let displaySheet = 'sheet #' + (sheetIndex < 10 ? '00' + sheetIndex : sheetIndex < 100 ? '0' + sheetIndex : '' + sheetIndex)
    let sheetNumBox = flexBox(fontWidth * displaySheet.length, fontHeight)
    sheetNumBox.funX = 'align-left'
    sheetNumBox.fromX = sheetBox
    sheetNumBox.funY = 'above'
    sheetNumBox.fromY = sheetBox
    flexSolve(0, 0, sheetNumBox)
    drawTextSpecial(client.bufferGUI, sheetNumBox.x, sheetNumBox.y, displaySheet, fontScale, white0, white1, white2)

    let displayPC = '' + (posOffsetC + posC)
    let displayPR = '' + (posOffsetR + posR)
    while (displayPC.length < 3) displayPC = '0' + displayPC
    while (displayPR.length < 3) displayPR = '0' + displayPR
    let displayPosition = 'x=' + displayPC + ' y=' + displayPR
    let positionBox = flexBox(fontWidth * displayPosition.length, fontHeight)
    positionBox.funX = 'align-right'
    positionBox.fromX = sheetBox
    positionBox.funY = 'above'
    positionBox.fromY = sheetBox
    flexSolve(0, 0, positionBox)
    drawTextSpecial(client.bufferGUI, positionBox.x, positionBox.y, displayPosition, fontScale, white0, white1, white2)

    // let displaySize = 'brush size ' + brushSize
    // drawTextSpecial(client.bufferGUI, 10, 50 + fontHeight * 2, displaySize, fontScale, white0, white1, white2)

    // let displayZoom = 'canvas zoom ' + canvasZoom
    // drawTextSpecial(client.bufferGUI, 10, 50, displayZoom, fontScale, white0, white1, white2)
    // drawText(client.bufferGUI, 10, 0, displayZoom, fontScale, darkpurplef(0), darkpurplef(1), darkpurplef(2), 1.0)

    // let topBarText = '(+)File Edit View Help'
    let topBarText = '(+)FILE EDIT VIEW HELP'
    // drawTextSpecial(client.bufferGUI, 0, canvasHeight - topBarHeight + pad, topBarText, fontScale, white0, white1, white2)
    drawText(client.bufferGUI, 0, canvasHeight - topBarHeight + pad - scale, topBarText, fontScale, darkpurplef(0), darkpurplef(1), darkpurplef(2), 1.0)

    let topBarSwitch = '(-)HCLPSM '
    width = topBarSwitch.length * fontWidth
    drawText(client.bufferGUI, canvasWidth - width, canvasHeight - topBarHeight + pad - scale, topBarSwitch, fontScale, darkpurplef(0), darkpurplef(1), darkpurplef(2), 1.0)

    // bottom info
    drawText(client.bufferGUI, 0, scale, '(z)Paint (w)(a)(s)(d)Color (i)(j)(k)(l)Move', fontScale, darkpurplef(0), darkpurplef(1), darkpurplef(2), 1.0)

    rendering.bindTexture(gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
    rendering.updateAndDraw(client.bufferGUI)
  }
}
