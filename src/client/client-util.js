import { textureByName } from '../assets/assets.js'
import { calcFontPad, calcFontScale, calcLongest, calcThickness } from '../editor/editor-util.js'
import { orange0f, orange1f, orange2f, peach0f, peach1f, peach2f, slate0f, slate1f, slate2f, white0f, white1f, white2f, wine0f, wine1f, wine2f } from '../editor/palette.js'
import { drawHollowRectangle, drawRectangle, drawTextFont, drawTextFontSpecial } from '../render/render.js'
import { bufferZero } from '../webgl/buffer.js'
import { rendererBindTexture, rendererSetProgram, rendererSetView, rendererUpdateAndDraw, rendererUpdateUniformMatrix } from '../webgl/renderer.js'

export function renderDialogBox(state, scale, font, dialog) {
  const client = state.client
  const gl = client.gl
  const rendering = client.rendering
  const projection = state.projection

  const fontScale = calcFontScale(scale)
  const fontWidth = fontScale * font.width
  const fontHeight = fontScale * font.base

  const thickness = calcThickness(scale)
  const doubleThick = 2 * thickness

  const width = client.width
  const height = client.height - client.top

  const fontPad = calcFontPad(fontHeight)
  const fontHeightAndPad = fontHeight + fontPad

  rendererSetView(rendering, 0, client.top, width, height)

  rendererSetProgram(rendering, 'color2d')
  rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

  bufferZero(client.bufferColor)

  const options = dialog.options
  const title = dialog.title
  let longest = calcLongest(options)
  if (title !== null) longest = Math.max(longest, title.length)
  const dialogWidth = (longest + 2) * fontWidth
  let dialogHeight = (options.length + 2) * fontHeightAndPad
  if (title !== null) dialogHeight += fontHeightAndPad
  let x = Math.floor(0.5 * (width - dialogWidth))
  const y = Math.floor(0.5 * (height - dialogHeight))
  drawRectangle(client.bufferColor, x, y, dialogWidth + doubleThick, dialogHeight + doubleThick, slate0f, slate1f, slate2f, 1.0)

  drawHollowRectangle(client.bufferColor, x + thickness, y + thickness, dialogWidth, dialogHeight, thickness, peach0f, peach1f, peach2f, 1.0)

  if (title !== null)
    drawRectangle(client.bufferColor, x + thickness, y + dialogHeight - thickness - fontHeightAndPad - 2 * fontPad, dialogWidth, thickness, peach0f, peach1f, peach2f, 1.0)

  rendererUpdateAndDraw(rendering, client.bufferColor)

  rendererSetProgram(rendering, 'texture2d-font')
  rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

  bufferZero(client.bufferGUI)

  let yy = y + dialogHeight - 2 * fontHeightAndPad
  if (title !== null) yy -= fontHeightAndPad

  const xx = x + fontWidth
  for (let i = 0; i < options.length; i++) {
    const option = options[i]
    if (i === dialog.pos) drawTextFont(client.bufferGUI, xx, yy - i * fontHeightAndPad, option, fontScale, orange0f, orange1f, orange2f, 1.0, font)
    else drawTextFont(client.bufferGUI, xx, yy - i * fontHeightAndPad, option, fontScale, white0f, white1f, white2f, 1.0, font)
  }

  if (title !== null) {
    x += Math.floor(0.5 * (dialogWidth - fontWidth * title.length))
    yy = y + dialogHeight - fontHeightAndPad - fontPad
    drawTextFont(client.bufferGUI, x, yy, title, fontScale, white0f, white1f, white2f, 1.0, font)
  }

  rendererBindTexture(rendering, gl.TEXTURE0, textureByName(font.name).texture)
  rendererUpdateAndDraw(rendering, client.bufferGUI)
}

export function textBoxWidth(fontWidth, box) {
  return (2 * box.cols[0].length + 1) * fontWidth
}

export function textBoxHeight(fontHeightAndPad, box) {
  return (box.cols.length + 1) * fontHeightAndPad
}

export function renderTextBox(state, scale, font, box, x, y) {
  const client = state.client
  const gl = client.gl
  const rendering = client.rendering
  const projection = state.projection

  const fontScale = calcFontScale(scale)
  const fontWidth = fontScale * font.width
  const fontHeight = fontScale * font.base

  const thickness = calcThickness(scale)
  const doubleThick = 2 * thickness

  const width = client.width
  const height = client.height - client.top

  const fontPad = calcFontPad(fontHeight)
  const fontHeightAndPad = fontHeight + 3 * fontPad

  rendererSetView(rendering, 0, client.top, width, height)

  rendererSetProgram(rendering, 'color2d')
  rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

  bufferZero(client.bufferColor)

  const boxWidth = textBoxWidth(fontWidth, box)
  const boxHeight = textBoxHeight(fontHeightAndPad, box)

  drawRectangle(client.bufferColor, x, y, boxWidth + doubleThick, boxHeight + doubleThick, slate0f, slate1f, slate2f, 1.0)

  drawHollowRectangle(client.bufferColor, x + thickness, y + thickness, boxWidth, boxHeight, thickness, peach0f, peach1f, peach2f, 1.0)

  rendererUpdateAndDraw(rendering, client.bufferColor)

  rendererSetProgram(rendering, 'texture2d-font')
  rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

  bufferZero(client.bufferGUI)

  let yy = y + (box.cols.length - 1) * fontHeightAndPad + fontHeight

  for (let r = 0; r < box.cols.length; r++) {
    const col = box.cols[r]
    let xx = x + fontWidth
    for (let c = 0; c < col.length; c++) {
      const chr = col[c]
      if (c === box.c && r === box.r) drawTextFontSpecial(client.bufferGUI, xx, yy, chr, fontScale, orange0f, orange1f, orange2f, font)
      else drawTextFontSpecial(client.bufferGUI, xx, yy, chr, fontScale, white0f, white1f, white2f, font)
      xx += 2 * fontWidth
    }
    yy -= fontHeightAndPad
  }

  rendererBindTexture(rendering, gl.TEXTURE0, textureByName(font.name).texture)
  rendererUpdateAndDraw(rendering, client.bufferGUI)
}

export function renderStatus(client, width, height, font, fontWidth, fontScale, topBarHeight, edit) {
  const topLeftStatus = edit.topLeftStatus()
  drawTextFont(client.bufferGUI, fontWidth, height - topBarHeight, topLeftStatus, fontScale, wine0f, wine1f, wine2f, 1.0, font)

  const topRightStatus = edit.topRightStatus()
  if (topRightStatus)
    drawTextFont(client.bufferGUI, width - (topRightStatus.length + 1) * fontWidth, height - topBarHeight, topRightStatus, fontScale, wine0f, wine1f, wine2f, 1.0, font)

  const bottmRightStatus = edit.bottomRightStatus()
  if (bottmRightStatus) drawTextFont(client.bufferGUI, width - (bottmRightStatus.length + 1) * fontWidth, 0, bottmRightStatus, fontScale, wine0f, wine1f, wine2f, 1.0, font)

  const bottomLeftStatus = edit.bottomLeftStatus()
  if (bottomLeftStatus) drawTextFont(client.bufferGUI, fontWidth, 0, bottomLeftStatus, fontScale, wine0f, wine1f, wine2f, 1.0, font)
}
