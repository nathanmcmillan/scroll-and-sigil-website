import {textureByName} from '/src/assets/assets.js'
import {drawTextSpecial, FONT_WIDTH, FONT_HEIGHT} from '/src/render/render.js'
import {identity, multiply} from '/src/math/matrix.js'
import {darkbluef, whitef} from '/src/editor/palette.js'
import {flexText, flexSolve} from '/src/flex/flex.js'
import {Home} from '/src/menu/home.js'

export class HomeState {
  constructor(client) {
    this.client = client
    this.keys = client.keys

    this.view = new Float32Array(16)
    this.projection = new Float32Array(16)

    this.home = new Home(client.width, client.height, client.scale, client.input)
  }

  resize(width, height, scale) {
    this.home.resize(width, height, scale)
  }

  keyEvent(code, down) {
    if (this.keys.has(code)) this.home.input.set(this.keys.get(code), down)
  }

  mouseEvent() {}

  mouseMove() {}

  async initialize() {}

  update(timestamp) {
    let home = this.home
    home.update(timestamp)
    if (home.yes) {
      let client = this.client
      if (home.row === 0) {
        client.openState('game')
      } else if (home.row === 1) {
        client.openState('game')
      } else if (home.row === 2) {
        client.openState('dashboard')
      } else if (home.row === 3) {
        client.openState('game')
      } else if (home.row === 4) {
        client.openState('game')
      }
    }
  }

  render() {
    const home = this.home
    if (!home.doPaint) return

    const client = this.client
    const gl = client.gl
    const rendering = client.rendering
    const view = this.view
    const projection = this.projection
    const scale = home.scale
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

    let titleBox = home.titleBox
    drawTextSpecial(client.bufferGUI, titleBox.x, titleBox.y, titleBox.text, scale, white0, white1, white2)

    let continueGameBox = home.continueGameBox
    drawTextSpecial(client.bufferGUI, continueGameBox.x, continueGameBox.y, continueGameBox.text, scale, white0, white1, white2)

    let newGameBox = home.newGameBox
    drawTextSpecial(client.bufferGUI, newGameBox.x, newGameBox.y, newGameBox.text, scale, white0, white1, white2)

    let editorBox = home.editorBox
    drawTextSpecial(client.bufferGUI, editorBox.x, editorBox.y, editorBox.text, scale, white0, white1, white2)

    let optionsBox = home.optionsBox
    drawTextSpecial(client.bufferGUI, optionsBox.x, optionsBox.y, optionsBox.text, scale, white0, white1, white2)

    let creditsBox = home.creditsBox
    drawTextSpecial(client.bufferGUI, creditsBox.x, creditsBox.y, creditsBox.text, scale, white0, white1, white2)

    let text = ')'
    let indicatorBox = flexText(text, fontWidth * text.length, fontHeight)
    indicatorBox.funX = 'left-of'
    indicatorBox.funY = 'center'
    if (home.row === 0) {
      indicatorBox.fromX = continueGameBox
      indicatorBox.fromY = continueGameBox
    } else if (home.row === 1) {
      indicatorBox.fromX = newGameBox
      indicatorBox.fromY = newGameBox
    } else if (home.row === 2) {
      indicatorBox.fromX = editorBox
      indicatorBox.fromY = editorBox
    } else if (home.row === 3) {
      indicatorBox.fromX = optionsBox
      indicatorBox.fromY = optionsBox
    } else if (home.row === 4) {
      indicatorBox.fromX = creditsBox
      indicatorBox.fromY = creditsBox
    }
    flexSolve(width, height, indicatorBox)

    drawTextSpecial(client.bufferGUI, indicatorBox.x, indicatorBox.y, indicatorBox.text, scale, white0, white1, white2)

    rendering.bindTexture(gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
    rendering.updateAndDraw(client.bufferGUI)
  }
}
