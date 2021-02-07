import {textureByName} from '../assets/assets.js'
import {drawText, drawRectangle, drawHollowRectangle, FONT_WIDTH, FONT_HEIGHT_BASE, drawTextSpecial} from '../render/render.js'
import {white0f, white1f, white2f, lightpeach0f, lightpeach1f, lightpeach2f, orange0f, orange1f, orange2f, darkgrey0f, darkgrey1f, darkgrey2f} from '../editor/palette.js'
import {calcFontScale, calcThickness, calcFontPad, calcLongest} from '../editor/editor-util.js'

export function renderDialogBox(state, scale, dialog) {
  const client = state.client
  const gl = client.gl
  const rendering = client.rendering
  const projection = state.projection

  const fontScale = calcFontScale(scale)
  const fontWidth = fontScale * FONT_WIDTH
  const fontHeight = fontScale * FONT_HEIGHT_BASE

  const thickness = calcThickness(scale)
  const doubleThick = 2 * thickness

  const width = client.width
  const height = client.height - client.top

  const fontPad = calcFontPad(fontHeight)
  const fontHeightAndPad = fontHeight + fontPad

  rendering.setProgram(0)
  rendering.setView(0, client.top, width, height)
  rendering.updateUniformMatrix('u_mvp', projection)

  client.bufferColor.zero()

  const options = dialog.options
  const title = dialog.title
  let longest = calcLongest(options)
  if (title !== null) longest = Math.max(longest, title.length)
  let dialogWidth = (longest + 2) * fontWidth
  let dialogHeight = (options.length + 2) * fontHeightAndPad
  if (title !== null) dialogHeight += fontHeightAndPad
  let x = Math.floor(0.5 * (width - dialogWidth))
  let y = Math.floor(0.5 * (height - dialogHeight))
  drawRectangle(client.bufferColor, x, y, dialogWidth + doubleThick, dialogHeight + doubleThick, darkgrey0f, darkgrey1f, darkgrey2f, 1.0)

  drawHollowRectangle(client.bufferColor, x + thickness, y + thickness, dialogWidth, dialogHeight, thickness, lightpeach0f, lightpeach1f, lightpeach2f, 1.0)

  if (title !== null)
    drawRectangle(
      client.bufferColor,
      x + thickness,
      y + dialogHeight - thickness - fontHeightAndPad - 2 * fontPad,
      dialogWidth,
      thickness,
      lightpeach0f,
      lightpeach1f,
      lightpeach2f,
      1.0
    )

  rendering.updateAndDraw(client.bufferColor)

  rendering.setProgram(4)
  rendering.setView(0, client.top, width, height)
  rendering.updateUniformMatrix('u_mvp', projection)

  client.bufferGUI.zero()

  let yy = y + dialogHeight - 2 * fontHeightAndPad
  if (title !== null) yy -= fontHeightAndPad

  let xx = x + fontWidth
  for (let i = 0; i < options.length; i++) {
    let option = options[i]
    if (i === dialog.pos) drawText(client.bufferGUI, xx, yy - i * fontHeightAndPad, option, fontScale, orange0f, orange1f, orange2f, 1.0)
    else drawText(client.bufferGUI, xx, yy - i * fontHeightAndPad, option, fontScale, white0f, white1f, white2f, 1.0)
  }

  if (title !== null) {
    x += Math.floor(0.5 * (dialogWidth - fontWidth * title.length))
    yy = y + dialogHeight - fontHeightAndPad - fontPad
    drawText(client.bufferGUI, x, yy, title, fontScale, white0f, white1f, white2f, 1.0)
  }

  rendering.bindTexture(gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
  rendering.updateAndDraw(client.bufferGUI)
}

export function textBoxWidth(fontWidth, box) {
  return (2 * box.cols[0].length + 1) * fontWidth
}

export function textBoxHeight(fontHeightAndPad, box) {
  return (box.cols.length + 1) * fontHeightAndPad
}

export function renderTextBox(state, scale, box, x, y) {
  const client = state.client
  const gl = client.gl
  const rendering = client.rendering
  const projection = state.projection

  const fontScale = calcFontScale(scale)
  const fontWidth = fontScale * FONT_WIDTH
  const fontHeight = fontScale * FONT_HEIGHT_BASE

  const thickness = calcThickness(scale)
  const doubleThick = 2 * thickness

  const width = client.width
  const height = client.height - client.top

  const fontPad = calcFontPad(fontHeight)
  const fontHeightAndPad = fontHeight + 3 * fontPad

  rendering.setProgram(0)
  rendering.setView(0, client.top, width, height)
  rendering.updateUniformMatrix('u_mvp', projection)

  client.bufferColor.zero()

  const boxWidth = textBoxWidth(fontWidth, box)
  const boxHeight = textBoxHeight(fontHeightAndPad, box)

  drawRectangle(client.bufferColor, x, y, boxWidth + doubleThick, boxHeight + doubleThick, darkgrey0f, darkgrey1f, darkgrey2f, 1.0)

  drawHollowRectangle(client.bufferColor, x + thickness, y + thickness, boxWidth, boxHeight, thickness, lightpeach0f, lightpeach1f, lightpeach2f, 1.0)

  rendering.updateAndDraw(client.bufferColor)

  rendering.setProgram(4)
  rendering.setView(0, client.top, width, height)
  rendering.updateUniformMatrix('u_mvp', projection)

  client.bufferGUI.zero()

  let yy = y + (box.cols.length - 1) * fontHeightAndPad + fontHeight

  for (let r = 0; r < box.cols.length; r++) {
    const col = box.cols[r]
    let xx = x + fontWidth
    for (let c = 0; c < col.length; c++) {
      let chr = col[c]
      if (c === box.c && r === box.r) drawTextSpecial(client.bufferGUI, xx, yy, chr, fontScale, orange0f, orange1f, orange2f, 1.0)
      else drawTextSpecial(client.bufferGUI, xx, yy, chr, fontScale, white0f, white1f, white2f, 1.0)
      xx += 2 * fontWidth
    }
    yy -= fontHeightAndPad
  }

  rendering.bindTexture(gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
  rendering.updateAndDraw(client.bufferGUI)
}
