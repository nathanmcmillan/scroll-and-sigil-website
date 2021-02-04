import {textureByName} from '/src/assets/assets.js'
import {drawText, drawRectangle, drawHollowRectangle, FONT_WIDTH, FONT_HEIGHT_BASE} from '/src/render/render.js'
import {whitef, lightpeachf, orangef, darkgreyf} from '/src/editor/palette.js'
import {calcFontScale, calcThickness, calcFontPad, calcLongest} from '/src/editor/editor-util.js'

export function renderAskText(state, scale, box) {
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

  // TODO

  rendering.updateAndDraw(client.bufferColor)

  rendering.setProgram(4)
  rendering.setView(0, client.top, width, height)
  rendering.updateUniformMatrix('u_mvp', projection)

  client.bufferGUI.zero()

  // TODO

  rendering.bindTexture(gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
  rendering.updateAndDraw(client.bufferGUI)
}
