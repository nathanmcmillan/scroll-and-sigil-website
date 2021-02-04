import {textureByName} from '/src/assets/assets.js'
import {drawText, drawRectangle, drawHollowRectangle, FONT_WIDTH, FONT_HEIGHT_BASE} from '/src/render/render.js'
import {whitef, lightpeachf, orangef, darkgreyf} from '/src/editor/palette.js'
import {calcFontScale, calcThickness, calcFontPad, calcLongest} from '/src/editor/editor-util.js'

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
  let startMenuWidth = (longest + 2) * fontWidth
  let startMenuHeight = (options.length + 2) * fontHeightAndPad
  if (title !== null) startMenuHeight += fontHeightAndPad
  let x = Math.floor(0.5 * (width - startMenuWidth))
  let y = Math.floor(0.5 * (height - startMenuHeight))
  drawRectangle(client.bufferColor, x, y, startMenuWidth + doubleThick, startMenuHeight + doubleThick, darkgreyf(0), darkgreyf(1), darkgreyf(2), 1.0)

  drawHollowRectangle(client.bufferColor, x + thickness, y + thickness, startMenuWidth, startMenuHeight, thickness, lightpeachf(0), lightpeachf(1), lightpeachf(2), 1.0)

  if (title !== null)
    drawRectangle(
      client.bufferColor,
      x + thickness,
      y + startMenuHeight - thickness - fontHeightAndPad - 2 * fontPad,
      startMenuWidth,
      thickness,
      lightpeachf(0),
      lightpeachf(1),
      lightpeachf(2),
      1.0
    )

  rendering.updateAndDraw(client.bufferColor)

  rendering.setProgram(4)
  rendering.setView(0, client.top, width, height)
  rendering.updateUniformMatrix('u_mvp', projection)

  client.bufferGUI.zero()

  let yy = y + startMenuHeight - 2 * fontHeightAndPad
  if (title !== null) yy -= fontHeightAndPad

  for (let i = 0; i < options.length; i++) {
    let option = options[i]
    let xx = x + fontWidth
    if (i === dialog.pos) drawText(client.bufferGUI, xx, yy - i * fontHeightAndPad, option, fontScale, orangef(0), orangef(1), orangef(2), 1.0)
    else drawText(client.bufferGUI, xx, yy - i * fontHeightAndPad, option, fontScale, whitef(0), whitef(1), whitef(2), 1.0)
  }

  if (title !== null) {
    x += Math.floor(0.5 * (startMenuWidth - fontWidth * title.length))
    yy = y + startMenuHeight - fontHeightAndPad - fontPad
    drawText(client.bufferGUI, x, yy, title, fontScale, whitef(0), whitef(1), whitef(2), 1.0)
  }

  rendering.bindTexture(gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
  rendering.updateAndDraw(client.bufferGUI)
}
