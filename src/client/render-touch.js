import {identity, multiply} from '/src/math/matrix.js'
import {orthographic} from '/src/math/matrix.js'
import {textureByName} from '/src/assets/assets.js'
import {drawTextSpecial} from '/src/render/render.js'
import {whitef, blackf} from '/src/editor/palette.js'

export class TouchRender {
  constructor(client) {
    this.client = client
    this.view = new Float32Array(16)
    this.projection = new Float32Array(16)
    this.orthographic = new Float32Array(16)
  }
}

export function touchRenderResize(touch) {
  const client = touch.client
  touch.width = client.width
  touch.height = client.height - client.top
  orthographic(touch.orthographic, 0.0, touch.width, 0.0, touch.height, 0.0, 1.0)
}

export function renderTouch(touch) {
  const client = touch.client
  const gl = client.gl
  const rendering = client.rendering
  const view = touch.view
  const projection = touch.projection
  const width = touch.width
  const height = touch.height
  const scale = client.scale

  const fontScale = Math.floor(1.5 * scale)

  rendering.setProgram(4)
  rendering.setView(0, 0, width, height)
  rendering.updateUniformMatrix('u_mvp', projection)

  gl.clearColor(blackf(0), blackf(1), blackf(2), 1.0)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  gl.disable(gl.CULL_FACE)
  gl.disable(gl.DEPTH_TEST)

  identity(view)
  multiply(projection, touch.orthographic, view)
  rendering.updateUniformMatrix('u_mvp', projection)

  client.bufferGUI.zero()

  let text = 'Blah blah blah'
  drawTextSpecial(client.bufferGUI, 10.0, 10.0, text, fontScale, whitef(0), whitef(1), whitef(2))

  rendering.bindTexture(gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
  rendering.updateAndDraw(client.bufferGUI)
}
