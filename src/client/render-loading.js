/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { textureByName } from '../assets/assets.js'
import { renderTouch } from '../client/render-touch.js'
import { calcFontScale } from '../editor/editor-util.js'
import { black0f, black1f, black2f, white0f, white1f, white2f } from '../editor/palette.js'
import { flexSolve, flexText, returnFlexText } from '../gui/flex.js'
import { identity, multiply } from '../math/matrix.js'
import { drawTextSpecial, TIC_FONT_HEIGHT, TIC_FONT_WIDTH } from '../render/render.js'
import { bufferZero } from '../webgl/buffer.js'
import { rendererBindTexture, rendererSetProgram, rendererSetView, rendererUpdateAndDraw, rendererUpdateUniformMatrix } from '../webgl/renderer.js'

export function renderLoadingInProgress(client, view, projection) {
  const gl = client.gl
  const rendering = client.rendering
  const width = client.width
  const height = client.height - client.top
  const scale = client.scale

  if (client.touch) renderTouch(client.touchRender)

  const fontScale = calcFontScale(scale)
  const fontWidth = fontScale * TIC_FONT_WIDTH
  const fontHeight = fontScale * TIC_FONT_HEIGHT

  rendererSetView(rendering, 0, client.top, width, height)

  gl.clearColor(black0f, black1f, black2f, 1.0)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  rendererSetProgram(rendering, 'texture2d-font')
  rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

  identity(view)
  multiply(projection, client.orthographic, view)
  rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

  bufferZero(client.bufferGUI)

  const text = 'Loading. Please wait...'
  const box = flexText(text, fontWidth * text.length, fontHeight)
  box.funX = 'center'
  box.funY = 'center'
  flexSolve(width, height, box)

  drawTextSpecial(client.bufferGUI, box.x, box.y, box.text, fontScale, white0f, white1f, white2f)
  returnFlexText(box)

  rendererBindTexture(rendering, gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
  rendererUpdateAndDraw(rendering, client.bufferGUI)
}
