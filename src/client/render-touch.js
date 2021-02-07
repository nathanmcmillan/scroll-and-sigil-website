import {identity, multiply} from '../math/matrix.js'
import {orthographic} from '../math/matrix.js'
import {drawRectangle} from '../render/render.js'
import {whitef, blackf} from '../editor/palette.js'
import * as In from '../input/input.js'

class TouchButton {
  constructor(input) {
    this.x = 0
    this.y = 0
    this.width = 0
    this.height = 0
    this.input = input
  }

  set(x, y, width, height) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  touched(x, y) {
    return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height
  }
}

export class TouchRender {
  constructor(client) {
    this.client = client
    this.view = new Float32Array(16)
    this.projection = new Float32Array(16)
    this.orthographic = new Float32Array(16)

    this.start = new TouchButton(In.BUTTON_START)
    this.select = new TouchButton(In.BUTTON_SELECT)

    this.up = new TouchButton(In.STICK_UP)
    this.left = new TouchButton(In.STICK_LEFT)
    this.down = new TouchButton(In.STICK_DOWN)
    this.right = new TouchButton(In.STICK_RIGHT)

    this.x = new TouchButton(In.BUTTON_X)
    this.y = new TouchButton(In.BUTTON_Y)
    this.b = new TouchButton(In.BUTTON_B)
    this.a = new TouchButton(In.BUTTON_A)

    this.triggerLeft = new TouchButton(In.LEFT_TRIGGER)
    this.triggerRight = new TouchButton(In.RIGHT_TRIGGER)

    this.buttons = [this.start, this.select, this.up, this.left, this.down, this.right, this.x, this.y, this.b, this.a, this.triggerLeft, this.triggerRight]
  }
}

export function touchRenderEvent(touch, event) {
  let x = event.pageX
  let y = event.pageY
  for (let button of touch.buttons) if (button.touched(x, y)) return button.input
  return null
}

export function touchRenderResize(touch) {
  const client = touch.client

  let width = client.width
  let height = client.height - client.top

  touch.width = width
  touch.height = height

  orthographic(touch.orthographic, 0.0, width, 0.0, height, 0.0, 1.0)

  const size = 42
  const scale = client.scale

  let bwidth = size * scale
  let bheight = size * scale

  let xcenter = Math.floor(0.5 * width)
  let ycenter = Math.floor(0.5 * height)

  let xquarter = Math.floor(0.25 * width)
  let yquarter = Math.floor(0.25 * height)

  touch.start.set(xcenter - 2 * bwidth - 10, yquarter, 2 * bwidth, bheight)
  touch.select.set(xcenter + 10, yquarter, 2 * bwidth, bheight)

  touch.up.set(xquarter, ycenter + bheight, bwidth, bheight)
  touch.left.set(xquarter - bwidth, ycenter, bwidth, bheight)
  touch.down.set(xquarter, ycenter - bheight, bwidth, bheight)
  touch.right.set(xquarter + bwidth, ycenter, bwidth, bheight)

  touch.x.set(xcenter + xquarter, ycenter + bheight, bwidth, bheight)
  touch.y.set(xcenter + xquarter - bwidth, ycenter, bwidth, bheight)
  touch.b.set(xcenter + xquarter, ycenter - bheight, bwidth, bheight)
  touch.a.set(xcenter + xquarter + bwidth, ycenter, bwidth, bheight)

  touch.triggerLeft.set(10, height - bheight - 10, 2 * bwidth, bheight)
  touch.triggerRight.set(width - 10 - 2 * bwidth, height - bheight - 10, 2 * bwidth, bheight)
}

export function renderTouch(touch) {
  const client = touch.client
  const gl = client.gl
  const rendering = client.rendering
  const view = touch.view
  const projection = touch.projection
  const width = touch.width
  const height = touch.height

  rendering.setProgram(0)
  rendering.setView(0, 0, width, height)
  rendering.updateUniformMatrix('u_mvp', projection)

  gl.clearColor(blackf(0), blackf(1), blackf(2), 1.0)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  gl.disable(gl.CULL_FACE)
  gl.disable(gl.DEPTH_TEST)

  identity(view)
  multiply(projection, touch.orthographic, view)
  rendering.updateUniformMatrix('u_mvp', projection)

  client.bufferColor.zero()

  for (let button of touch.buttons) {
    drawRectangle(client.bufferColor, button.x, button.y, button.width, button.height, whitef(0), whitef(1), whitef(2), 1.0)
  }

  rendering.updateAndDraw(client.bufferColor)
}
