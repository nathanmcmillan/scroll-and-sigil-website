import {textureByName} from '/src/assets/assets.js'
import {drawTextSpecial, FONT_WIDTH, FONT_HEIGHT} from '/src/render/render.js'
import {identity, multiply} from '/src/math/matrix.js'
import {darkbluef, whitef} from '/src/editor/palette.js'
import {flexBox, flexSolve} from '/src/flex/flex.js'
import {Dashboard} from '/src/menu/dashboard.js'

export class DashboardState {
  constructor(client) {
    this.client = client
    this.keys = client.keys

    this.view = new Float32Array(16)
    this.projection = new Float32Array(16)

    this.dashboard = new Dashboard(client.width, client.height, client.scale, client.input)
  }

  resize(width, height, scale) {
    this.dashboard.resize(width, height, scale)
  }

  keyEvent(code, down) {
    if (this.keys.has(code)) this.dashboard.input.set(this.keys.get(code), down)
  }

  mouseEvent() {}

  mouseMove() {}

  async initialize() {}

  update(timestamp) {
    let dashboard = this.dashboard
    dashboard.update(timestamp)
    if (dashboard.yes) {
      let client = this.client
      if (dashboard.column === 0) {
        client.openState('paint')
      } else if (dashboard.column === 1) {
        client.openState('paint')
      } else if (dashboard.column === 2) {
        client.openState('paint')
      } else if (dashboard.column === 3) {
        client.openState('paint')
      }
    }
  }

  render() {
    const dashboard = this.dashboard
    if (!dashboard.doPaint) return

    const client = this.client
    const gl = client.gl
    const rendering = client.rendering
    const view = this.view
    const projection = this.projection
    const scale = dashboard.scale
    const width = client.width
    const height = client.height
    const fontWidth = scale * FONT_WIDTH
    const fontHeight = scale * FONT_HEIGHT

    let darkblue0 = darkbluef(0)
    let darkblue1 = darkbluef(1)
    let darkblue2 = darkbluef(2)

    gl.clearColor(darkblue0, darkblue1, darkblue2, 1.0)

    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.clear(gl.DEPTH_BUFFER_BIT)

    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)

    identity(view)
    multiply(projection, client.orthographic, view)

    client.bufferGUI.zero()

    let white0 = whitef(0)
    let white1 = whitef(1)
    let white2 = whitef(2)

    rendering.setProgram(1)
    rendering.setView(0, 0, width, height)
    rendering.updateUniformMatrix('u_mvp', projection)

    let text = 'Scroll and Sigil Editor'
    let mainMenu = flexBox(fontWidth * text.length, fontHeight)
    mainMenu.bottomSpace = 4 * fontHeight
    mainMenu.funX = 'center'
    mainMenu.funY = '%'
    mainMenu.argY = 75
    flexSolve(width, height, mainMenu)
    drawTextSpecial(client.bufferGUI, mainMenu.x, mainMenu.y, text, scale, white0, white1, white2)

    text = 'Open'
    let optionOpen = flexBox(fontWidth * text.length, fontHeight)
    optionOpen.rightSpace = fontWidth
    optionOpen.funX = 'center'
    optionOpen.fromX = mainMenu
    optionOpen.funY = 'below'
    optionOpen.fromY = mainMenu
    flexSolve(width, height, optionOpen)
    drawTextSpecial(client.bufferGUI, optionOpen.x, optionOpen.y, text, scale, white0, white1, white2)

    text = 'Export'
    let optionExport = flexBox(fontWidth * text.length, fontHeight)
    optionExport.rightSpace = fontWidth
    optionExport.funX = 'right-of'
    optionExport.fromX = optionOpen
    optionExport.funY = 'center'
    optionExport.fromY = optionOpen
    flexSolve(width, height, optionExport)
    drawTextSpecial(client.bufferGUI, optionExport.x, optionExport.y, text, scale, white0, white1, white2)

    text = 'New'
    let optionNew = flexBox(fontWidth * text.length, fontHeight)
    optionNew.rightSpace = fontWidth
    optionNew.funX = 'right-of'
    optionNew.fromX = optionExport
    optionNew.funY = 'center'
    optionNew.fromY = optionExport
    flexSolve(width, height, optionNew)
    drawTextSpecial(client.bufferGUI, optionNew.x, optionNew.y, text, scale, white0, white1, white2)

    text = 'Copy'
    let optionCopy = flexBox(fontWidth * text.length, fontHeight)
    optionCopy.funX = 'right-of'
    optionCopy.fromX = optionNew
    optionCopy.funY = 'center'
    optionCopy.fromY = optionNew
    flexSolve(width, height, optionCopy)
    drawTextSpecial(client.bufferGUI, optionCopy.x, optionCopy.y, text, scale, white0, white1, white2)

    text = 'V'
    let indicator = flexBox(fontWidth * text.length, fontHeight)
    indicator.funX = 'center'
    indicator.funY = 'above'
    if (dashboard.column === 0) {
      indicator.fromX = optionOpen
      indicator.fromY = optionOpen
    } else if (dashboard.column === 1) {
      indicator.fromX = optionExport
      indicator.fromY = optionExport
    } else if (dashboard.column === 2) {
      indicator.fromX = optionNew
      indicator.fromY = optionNew
    } else if (dashboard.column === 3) {
      indicator.fromX = optionCopy
      indicator.fromY = optionCopy
    }
    flexSolve(width, height, indicator)
    drawTextSpecial(client.bufferGUI, indicator.x, indicator.y, text, scale, white0, white1, white2)

    rendering.bindTexture(gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
    rendering.updateAndDraw(client.bufferGUI)
  }
}
