import {textureByName} from '/src/assets/assets.js'
import {drawText, drawRectangle, drawHollowRectangle, FONT_WIDTH, FONT_HEIGHT_BASE} from '/src/render/render.js'
import {whitef, lightpeachf, darkgreyf} from '/src/editor/palette.js'
import {calcFontScale, calcThickness, calcFontPad, calcLongest} from '/src/editor/editor-util.js'

export function renderDialogue(state, scale, dialogue) {
  const client = state.client
  const gl = client.gl
  const rendering = client.rendering
  const projection = state.projection

  const fontScale = calcFontScale(scale)
  const fontWidth = fontScale * FONT_WIDTH
  const fontHeight = fontScale * FONT_HEIGHT_BASE

  const thickness = calcThickness(scale)
  const doubleThick = 2 * thickness

  const canvasWidth = client.width
  const canvasHeight = client.height - client.top

  const fontPad = calcFontPad(fontHeight)
  const fontHeightAndPad = fontHeight + fontPad

  rendering.setProgram(0)
  rendering.setView(0, client.top, canvasWidth, canvasHeight)
  rendering.updateUniformMatrix('u_mvp', projection)

  client.bufferColor.zero()

  const options = dialogue.options
  let startMenuWidth = (calcLongest(options) + 2) * fontWidth
  let startMenuHeight = (options.length + 2) * fontHeightAndPad
  let x = Math.floor(0.5 * (canvasWidth - startMenuWidth))
  let y = Math.floor(0.5 * (canvasHeight - startMenuHeight))
  drawRectangle(client.bufferColor, x, y, startMenuWidth + doubleThick, startMenuHeight + doubleThick, darkgreyf(0), darkgreyf(1), darkgreyf(2), 1.0)

  drawHollowRectangle(client.bufferColor, x + thickness, y + thickness, startMenuWidth, startMenuHeight, thickness, lightpeachf(0), lightpeachf(1), lightpeachf(2), 1.0)

  rendering.updateAndDraw(client.bufferColor)

  rendering.setProgram(4)
  rendering.setView(0, client.top, canvasWidth, canvasHeight)
  rendering.updateUniformMatrix('u_mvp', projection)

  client.bufferGUI.zero()

  y += startMenuHeight - 2 * fontHeightAndPad

  for (let i = 0; i < options.length; i++) {
    let option = options[i]
    let xx = x + fontWidth
    if (i === dialogue.pos) option = '>' + option
    drawText(client.bufferGUI, xx, y - i * fontHeightAndPad, option, fontScale, whitef(0), whitef(1), whitef(2), 1.0)
  }

  rendering.bindTexture(gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
  rendering.updateAndDraw(client.bufferGUI)
}
