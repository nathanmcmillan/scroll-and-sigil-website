import {drawTextSpecial, FONT_WIDTH, FONT_HEIGHT} from '../render/render.js'
import {identity, multiply} from '../math/matrix.js'
import {whitef, blackf} from '../editor/palette.js'
import {flexText, flexSolve} from '../gui/flex.js'
import {textureByName} from '../assets/assets.js'
import {renderTouch} from '../client/render-touch.js'
import {calcFontScale} from '../editor/editor-util.js'

export function renderLoadingInProgress(client, view, projection) {
  const gl = client.gl
  const rendering = client.rendering
  const width = client.width
  const height = client.height - client.top
  const scale = client.scale

  if (client.touch) renderTouch(client.touchRender)

  const fontScale = calcFontScale(scale)
  const fontWidth = fontScale * FONT_WIDTH
  const fontHeight = fontScale * FONT_HEIGHT

  rendering.setProgram(4)
  rendering.setView(0, client.top, width, height)
  rendering.updateUniformMatrix('u_mvp', projection)

  gl.clearColor(blackf(0), blackf(1), blackf(2), 1.0)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  identity(view)
  multiply(projection, client.orthographic, view)
  rendering.updateUniformMatrix('u_mvp', projection)

  client.bufferGUI.zero()

  let text = 'Loading. Please wait...'
  let box = flexText(text, fontWidth * text.length, fontHeight)
  box.funX = 'center'
  box.funY = 'center'
  flexSolve(width, height, box)

  drawTextSpecial(client.bufferGUI, box.x, box.y, box.text, fontScale, whitef(0), whitef(1), whitef(2))

  rendering.bindTexture(gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
  rendering.updateAndDraw(client.bufferGUI)
}
