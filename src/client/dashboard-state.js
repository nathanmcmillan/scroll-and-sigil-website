import { textureByName } from '../assets/assets.js'
import { renderTouch } from '../client/render-touch.js'
import { calcFontPad, calcFontScale, defaultFont } from '../editor/editor-util.js'
import { slate0f, slate1f, slate2f, white0f, white1f, white2f } from '../editor/palette.js'
import { flexBox, flexSolve } from '../gui/flex.js'
import { identity, multiply } from '../math/matrix.js'
import { Dashboard, EDIT_NAME, PROGRAM_MENU, TAPE_MENU } from '../menu/dashboard.js'
import { drawTextFontSpecial } from '../render/render.js'
import { renderTextBox, textBoxHeight, textBoxWidth } from './client-util.js'

export class DashboardState {
  constructor(client) {
    this.client = client
    this.keys = client.keys

    this.view = new Float32Array(16)
    this.projection = new Float32Array(16)

    this.dashboard = new Dashboard(this, client.width, client.height - client.top, client.scale, client.input)
    this.dashboard.tape = client.tape
  }

  reset() {
    this.dashboard.reset()
  }

  resize(width, height, scale) {
    this.dashboard.resize(width, height, scale)
  }

  keyEvent(code, down) {
    const dashboard = this.dashboard
    if (this.keys.has(code)) {
      dashboard.input.set(this.keys.get(code), down)
      dashboard.immediateInput()
    }
  }

  mouseEvent() {}

  mouseMove() {}

  async initialize() {}

  eventCall(event) {
    const dashboard = this.dashboard
    if (event === 'export') {
      const blob = dashboard.tape.export()
      console.info(blob)
      const download = document.createElement('a')
      download.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(blob)
      download.download = dashboard.tape.name + '.txt'
      download.click()
    } else if (event === 'open') {
      if (dashboard.programRow === 0) this.client.openState('maps')
      else if (dashboard.programRow === 1) this.client.openState('paint')
      else if (dashboard.programRow === 2) this.client.openState('music')
      else if (dashboard.programRow === 3) this.client.openState('sfx')
    } else if (event === 'back') this.client.openState('home')
  }

  update(timestamp) {
    this.dashboard.update(timestamp)
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

    const font = defaultFont()
    const fontScale = calcFontScale(scale)
    const fontWidth = fontScale * font.width
    const fontHeight = fontScale * font.base
    const fontPad = calcFontPad(fontHeight)

    if (client.touch) renderTouch(client.touchRender)

    identity(view)
    multiply(projection, client.orthographic, view)

    // text
    rendering.setProgram('texture2d-font')
    rendering.setView(0, client.top, width, height)
    rendering.updateUniformMatrix('u_mvp', projection)

    gl.clearColor(slate0f, slate1f, slate2f, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)

    client.bufferGUI.zero()

    let text = 'Scroll and Sigil Editor'
    const mainMenu = flexBox(fontWidth * text.length, fontHeight)
    mainMenu.bottomSpace = 3 * fontHeight
    mainMenu.funX = 'center'
    mainMenu.funY = '%'
    mainMenu.argY = 75
    flexSolve(width, height, mainMenu)
    drawTextFontSpecial(client.bufferGUI, mainMenu.x, mainMenu.y, text, fontScale, white0f, white1f, white2f, font)

    text = dashboard.tape.name
    const tapeName = flexBox(fontWidth * text.length, fontHeight)
    tapeName.bottomSpace = 2 * fontHeight
    tapeName.funX = 'center'
    tapeName.fromX = mainMenu
    tapeName.funY = 'below'
    tapeName.fromY = mainMenu
    flexSolve(width, height, tapeName)
    drawTextFontSpecial(client.bufferGUI, tapeName.x, tapeName.y, text, fontScale, white0f, white1f, white2f, font)

    if (dashboard.menu === TAPE_MENU) {
      text = 'Edit'
      const optionEdit = flexBox(fontWidth * text.length, fontHeight)
      optionEdit.bottomSpace = fontPad
      optionEdit.funX = 'center'
      optionEdit.fromX = tapeName
      optionEdit.funY = 'below'
      optionEdit.fromY = tapeName
      flexSolve(width, height, optionEdit)
      drawTextFontSpecial(client.bufferGUI, optionEdit.x, optionEdit.y, text, fontScale, white0f, white1f, white2f, font)

      text = 'Export'
      const optionExport = flexBox(fontWidth * text.length, fontHeight)
      optionExport.bottomSpace = fontPad
      optionExport.funX = 'align-left'
      optionExport.fromX = optionEdit
      optionExport.funY = 'below'
      optionExport.fromY = optionEdit
      flexSolve(width, height, optionExport)
      drawTextFontSpecial(client.bufferGUI, optionExport.x, optionExport.y, text, fontScale, white0f, white1f, white2f, font)

      text = 'Name'
      const optionName = flexBox(fontWidth * text.length, fontHeight)
      optionName.bottomSpace = fontPad
      optionName.funX = 'align-left'
      optionName.fromX = optionExport
      optionName.funY = 'below'
      optionName.fromY = optionExport
      flexSolve(width, height, optionName)
      drawTextFontSpecial(client.bufferGUI, optionName.x, optionName.y, text, fontScale, white0f, white1f, white2f, font)

      text = 'New'
      const optionNew = flexBox(fontWidth * text.length, fontHeight)
      optionNew.bottomSpace = fontPad
      optionNew.funX = 'align-left'
      optionNew.fromX = optionName
      optionNew.funY = 'below'
      optionNew.fromY = optionName
      flexSolve(width, height, optionNew)
      drawTextFontSpecial(client.bufferGUI, optionNew.x, optionNew.y, text, fontScale, white0f, white1f, white2f, font)

      text = 'Copy'
      const optionCopy = flexBox(fontWidth * text.length, fontHeight)
      optionCopy.bottomSpace = fontPad
      optionCopy.funX = 'align-left'
      optionCopy.fromX = optionNew
      optionCopy.funY = 'below'
      optionCopy.fromY = optionNew
      flexSolve(width, height, optionCopy)
      drawTextFontSpecial(client.bufferGUI, optionCopy.x, optionCopy.y, text, fontScale, white0f, white1f, white2f, font)

      text = 'Back'
      const optionBack = flexBox(fontWidth * text.length, fontHeight)
      optionBack.bottomSpace = fontPad
      optionBack.funX = 'align-left'
      optionBack.fromX = optionCopy
      optionBack.funY = 'below'
      optionBack.fromY = optionCopy
      flexSolve(width, height, optionBack)
      drawTextFontSpecial(client.bufferGUI, optionBack.x, optionBack.y, text, fontScale, white0f, white1f, white2f, font)

      text = '>'
      const indicator = flexBox(fontWidth * text.length, fontHeight)
      indicator.funX = 'left-of'
      indicator.funY = 'center'
      switch (dashboard.tapeRow) {
        case 0:
          indicator.fromX = optionEdit
          indicator.fromY = optionEdit
          break
        case 1:
          indicator.fromX = optionExport
          indicator.fromY = optionExport
          break
        case 2:
          indicator.fromX = optionName
          indicator.fromY = optionName
          break
        case 3:
          indicator.fromX = optionNew
          indicator.fromY = optionNew
          break
        case 4:
          indicator.fromX = optionCopy
          indicator.fromY = optionCopy
          break
        case 5:
          indicator.fromX = optionBack
          indicator.fromY = optionBack
          break
      }
      flexSolve(width, height, indicator)
      drawTextFontSpecial(client.bufferGUI, indicator.x, indicator.y, text, fontScale, white0f, white1f, white2f, font)

      rendering.bindTexture(gl.TEXTURE0, textureByName(font.name).texture)
      rendering.updateAndDraw(client.bufferGUI)
    } else if (dashboard.menu === PROGRAM_MENU) {
      text = 'Maps'
      const optionMaps = flexBox(fontWidth * text.length, fontHeight)
      optionMaps.bottomSpace = fontPad
      optionMaps.funX = 'center'
      optionMaps.fromX = tapeName
      optionMaps.funY = 'below'
      optionMaps.fromY = tapeName
      flexSolve(width, height, optionMaps)
      drawTextFontSpecial(client.bufferGUI, optionMaps.x, optionMaps.y, text, fontScale, white0f, white1f, white2f, font)

      text = 'Paint'
      const optionPaint = flexBox(fontWidth * text.length, fontHeight)
      optionPaint.bottomSpace = fontPad
      optionPaint.funX = 'align-left'
      optionPaint.fromX = optionMaps
      optionPaint.funY = 'below'
      optionPaint.fromY = optionMaps
      flexSolve(width, height, optionPaint)
      drawTextFontSpecial(client.bufferGUI, optionPaint.x, optionPaint.y, text, fontScale, white0f, white1f, white2f, font)

      text = 'Music'
      const optionMusic = flexBox(fontWidth * text.length, fontHeight)
      optionMusic.bottomSpace = fontPad
      optionMusic.funX = 'align-left'
      optionMusic.fromX = optionPaint
      optionMusic.funY = 'below'
      optionMusic.fromY = optionPaint
      flexSolve(width, height, optionMusic)
      drawTextFontSpecial(client.bufferGUI, optionMusic.x, optionMusic.y, text, fontScale, white0f, white1f, white2f, font)

      text = 'Sound'
      const optionSound = flexBox(fontWidth * text.length, fontHeight)
      optionSound.bottomSpace = fontPad
      optionSound.funX = 'align-left'
      optionSound.fromX = optionMusic
      optionSound.funY = 'below'
      optionSound.fromY = optionMusic
      flexSolve(width, height, optionSound)
      drawTextFontSpecial(client.bufferGUI, optionSound.x, optionSound.y, text, fontScale, white0f, white1f, white2f, font)

      text = 'Back'
      const optionBack = flexBox(fontWidth * text.length, fontHeight)
      optionBack.bottomSpace = fontPad
      optionBack.funX = 'align-left'
      optionBack.fromX = optionSound
      optionBack.funY = 'below'
      optionBack.fromY = optionSound
      flexSolve(width, height, optionBack)
      drawTextFontSpecial(client.bufferGUI, optionBack.x, optionBack.y, text, fontScale, white0f, white1f, white2f, font)

      text = '>'
      const indicator = flexBox(fontWidth * text.length, fontHeight)
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
      drawTextFontSpecial(client.bufferGUI, indicator.x, indicator.y, text, fontScale, white0f, white1f, white2f, font)

      rendering.bindTexture(gl.TEXTURE0, textureByName(font.name).texture)
      rendering.updateAndDraw(client.bufferGUI)
    } else if (dashboard.menu === EDIT_NAME) {
      const box = dashboard.textBox

      rendering.bindTexture(gl.TEXTURE0, textureByName(font.name).texture)
      rendering.updateAndDraw(client.bufferGUI)

      const fontHeightAndPad = fontHeight + 3 * fontPad

      const boxWidth = textBoxWidth(fontWidth, box)
      const boxHeight = textBoxHeight(fontHeightAndPad, box)

      const boxFlex = flexBox(boxWidth, boxHeight)
      boxFlex.bottomSpace = fontPad
      boxFlex.funX = 'center'
      boxFlex.fromX = tapeName
      boxFlex.funY = 'below'
      boxFlex.fromY = tapeName
      flexSolve(width, height, boxFlex)

      renderTextBox(this, scale, font, box, boxFlex.x, boxFlex.y)
    }
  }
}
