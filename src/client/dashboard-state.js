import {textureByName} from '/src/assets/assets.js'
import {drawTextSpecial, FONT_WIDTH, FONT_HEIGHT} from '/src/render/render.js'
import {renderTouch} from '/src/client/render-touch.js'
import {identity, multiply} from '/src/math/matrix.js'
import {darkgreyf, whitef} from '/src/editor/palette.js'
import {flexBox, flexSolve} from '/src/flex/flex.js'
import {Dashboard, PACKAGE_MENU} from '/src/menu/dashboard.js'

export class DashboardState {
  constructor(client) {
    this.client = client
    this.keys = client.keys

    this.view = new Float32Array(16)
    this.projection = new Float32Array(16)

    this.dashboard = new Dashboard(client.width, client.height, client.scale, client.input)
  }

  reset() {
    this.dashboard.reset()
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
      if (dashboard.programRow === 0) {
        this.client.openState('maps')
      } else if (dashboard.programRow === 1) {
        this.client.openState('paint')
      } else if (dashboard.programRow === 2) {
        this.client.openState('music')
      } else if (dashboard.programRow === 3) {
        this.client.openState('sfx')
      }
    } else if (dashboard.back) {
      this.client.openState('home')
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
    const height = client.height - client.top

    const fontScale = Math.floor(1.5 * scale)
    const fontWidth = fontScale * FONT_WIDTH
    const fontHeight = fontScale * FONT_HEIGHT
    const fontPad = Math.floor(0.15 * fontHeight)

    if (client.touch) renderTouch(client.touchRender)

    identity(view)
    multiply(projection, client.orthographic, view)

    let white0 = whitef(0)
    let white1 = whitef(1)
    let white2 = whitef(2)

    // text
    rendering.setProgram(4)
    rendering.setView(0, client.top, width, height)
    rendering.updateUniformMatrix('u_mvp', projection)

    gl.clearColor(darkgreyf(0), darkgreyf(1), darkgreyf(2), 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)

    client.bufferGUI.zero()

    let text = 'Scroll and Sigil Editor'
    let mainMenu = flexBox(fontWidth * text.length, fontHeight)
    mainMenu.bottomSpace = 4 * fontHeight
    mainMenu.funX = 'center'
    mainMenu.funY = '%'
    mainMenu.argY = 75
    flexSolve(width, height, mainMenu)
    drawTextSpecial(client.bufferGUI, mainMenu.x, mainMenu.y, text, fontScale, white0, white1, white2)

    if (dashboard.menu === PACKAGE_MENU) {
      text = 'Open'
      let optionOpen = flexBox(fontWidth * text.length, fontHeight)
      optionOpen.bottomSpace = fontPad
      optionOpen.funX = 'center'
      optionOpen.fromX = mainMenu
      optionOpen.funY = 'below'
      optionOpen.fromY = mainMenu
      flexSolve(width, height, optionOpen)
      drawTextSpecial(client.bufferGUI, optionOpen.x, optionOpen.y, text, fontScale, white0, white1, white2)

      text = 'Export'
      let optionExport = flexBox(fontWidth * text.length, fontHeight)
      optionExport.bottomSpace = fontPad
      optionExport.funX = 'align-left'
      optionExport.fromX = optionOpen
      optionExport.funY = 'below'
      optionExport.fromY = optionOpen
      flexSolve(width, height, optionExport)
      drawTextSpecial(client.bufferGUI, optionExport.x, optionExport.y, text, fontScale, white0, white1, white2)

      text = 'New'
      let optionNew = flexBox(fontWidth * text.length, fontHeight)
      optionNew.bottomSpace = fontPad
      optionNew.funX = 'align-left'
      optionNew.fromX = optionExport
      optionNew.funY = 'below'
      optionNew.fromY = optionExport
      flexSolve(width, height, optionNew)
      drawTextSpecial(client.bufferGUI, optionNew.x, optionNew.y, text, fontScale, white0, white1, white2)

      text = 'Copy'
      let optionCopy = flexBox(fontWidth * text.length, fontHeight)
      optionCopy.bottomSpace = fontPad
      optionCopy.funX = 'align-left'
      optionCopy.fromX = optionNew
      optionCopy.funY = 'below'
      optionCopy.fromY = optionNew
      flexSolve(width, height, optionCopy)
      drawTextSpecial(client.bufferGUI, optionCopy.x, optionCopy.y, text, fontScale, white0, white1, white2)

      text = 'Back'
      let optionBack = flexBox(fontWidth * text.length, fontHeight)
      optionBack.bottomSpace = fontPad
      optionBack.funX = 'align-left'
      optionBack.fromX = optionCopy
      optionBack.funY = 'below'
      optionBack.fromY = optionCopy
      flexSolve(width, height, optionBack)
      drawTextSpecial(client.bufferGUI, optionBack.x, optionBack.y, text, fontScale, white0, white1, white2)

      text = '>'
      let indicator = flexBox(fontWidth * text.length, fontHeight)
      indicator.funX = 'left-of'
      indicator.funY = 'center'
      switch (dashboard.packageRow) {
        case 0:
          indicator.fromX = optionOpen
          indicator.fromY = optionOpen
          break
        case 1:
          indicator.fromX = optionExport
          indicator.fromY = optionExport
          break
        case 2:
          indicator.fromX = optionNew
          indicator.fromY = optionNew
          break
        case 3:
          indicator.fromX = optionCopy
          indicator.fromY = optionCopy
          break
        case 4:
          indicator.fromX = optionBack
          indicator.fromY = optionBack
          break
      }
      flexSolve(width, height, indicator)
      drawTextSpecial(client.bufferGUI, indicator.x, indicator.y, text, fontScale, white0, white1, white2)

      rendering.bindTexture(gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
      rendering.updateAndDraw(client.bufferGUI)
    } else {
      text = 'Maps'
      let optionMaps = flexBox(fontWidth * text.length, fontHeight)
      optionMaps.bottomSpace = fontPad
      optionMaps.funX = 'center'
      optionMaps.fromX = mainMenu
      optionMaps.funY = 'below'
      optionMaps.fromY = mainMenu
      flexSolve(width, height, optionMaps)
      drawTextSpecial(client.bufferGUI, optionMaps.x, optionMaps.y, text, fontScale, white0, white1, white2)

      text = 'Paint'
      let optionPaint = flexBox(fontWidth * text.length, fontHeight)
      optionPaint.bottomSpace = fontPad
      optionPaint.funX = 'align-left'
      optionPaint.fromX = optionMaps
      optionPaint.funY = 'below'
      optionPaint.fromY = optionMaps
      flexSolve(width, height, optionPaint)
      drawTextSpecial(client.bufferGUI, optionPaint.x, optionPaint.y, text, fontScale, white0, white1, white2)

      text = 'Music'
      let optionMusic = flexBox(fontWidth * text.length, fontHeight)
      optionMusic.bottomSpace = fontPad
      optionMusic.funX = 'align-left'
      optionMusic.fromX = optionPaint
      optionMusic.funY = 'below'
      optionMusic.fromY = optionPaint
      flexSolve(width, height, optionMusic)
      drawTextSpecial(client.bufferGUI, optionMusic.x, optionMusic.y, text, fontScale, white0, white1, white2)

      text = 'Sound'
      let optionSound = flexBox(fontWidth * text.length, fontHeight)
      optionSound.bottomSpace = fontPad
      optionSound.funX = 'align-left'
      optionSound.fromX = optionMusic
      optionSound.funY = 'below'
      optionSound.fromY = optionMusic
      flexSolve(width, height, optionSound)
      drawTextSpecial(client.bufferGUI, optionSound.x, optionSound.y, text, fontScale, white0, white1, white2)

      text = 'Back'
      let optionBack = flexBox(fontWidth * text.length, fontHeight)
      optionBack.bottomSpace = fontPad
      optionBack.funX = 'align-left'
      optionBack.fromX = optionSound
      optionBack.funY = 'below'
      optionBack.fromY = optionSound
      flexSolve(width, height, optionBack)
      drawTextSpecial(client.bufferGUI, optionBack.x, optionBack.y, text, fontScale, white0, white1, white2)

      text = '>'
      let indicator = flexBox(fontWidth * text.length, fontHeight)
      indicator.funX = 'left-of'
      indicator.funY = 'center'
      switch (dashboard.programRow) {
        case 0:
          indicator.fromX = optionMaps
          indicator.fromY = optionMaps
          break
        case 1:
          indicator.fromX = optionPaint
          indicator.fromY = optionPaint
          break
        case 2:
          indicator.fromX = optionMusic
          indicator.fromY = optionMusic
          break
        case 3:
          indicator.fromX = optionSound
          indicator.fromY = optionSound
          break
        case 4:
          indicator.fromX = optionBack
          indicator.fromY = optionBack
          break
      }
      flexSolve(width, height, indicator)
      drawTextSpecial(client.bufferGUI, indicator.x, indicator.y, text, fontScale, white0, white1, white2)

      rendering.bindTexture(gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
      rendering.updateAndDraw(client.bufferGUI)
    }
  }
}
