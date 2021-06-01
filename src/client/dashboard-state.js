/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { textureByName } from '../assets/assets.js'
import { renderTouch } from '../client/render-touch.js'
import { calcFontPad, calcFontScale, defaultFont } from '../editor/editor-util.js'
import { slate0f, slate1f, slate2f, white0f, white1f, white2f } from '../editor/palette.js'
import { flexBox, flexSolve } from '../gui/flex.js'
import { local_storage_set } from '../io/files.js'
import { identity, multiply } from '../math/matrix.js'
import { Dashboard, EDIT_NAME, PROGRAM_MENU, TAPE_MENU } from '../menu/dashboard.js'
import { drawTextFontSpecial } from '../render/render.js'
import { bufferZero } from '../webgl/buffer.js'
import { rendererBindTexture, rendererSetProgram, rendererSetView, rendererUpdateAndDraw, rendererUpdateUniformMatrix } from '../webgl/renderer.js'
import { renderTextBox, textBoxHeight, textBoxWidth } from './client-util.js'

export class DashboardState {
  constructor(client) {
    this.client = client
    this.keys = client.keys

    this.view = new Float32Array(16)
    this.projection = new Float32Array(16)

    this.dashboard = new Dashboard(this, client.width, client.height - client.top, client.scale, client.input)
    this.dashboard.tape = client.tape

    local_storage_set('tape', client.tape.name)
  }

  reset() {
    this.dashboard.reset()
  }

  pause() {
    this.dashboard.pause()
  }

  resume() {
    this.dashboard.resume()
  }

  resize(width, height, scale) {
    this.dashboard.resize(width, height, scale)
  }

  keyEvent(code, down) {
    const dashboard = this.dashboard
    if (this.keys.has(code)) {
      dashboard.input.set(this.keys.get(code), down)
      dashboard.immediate()
    }
  }

  mouseEvent() {}

  mouseMove() {}

  async initialize() {}

  eventCall(event) {
    const dashboard = this.dashboard
    if (event === 'Export') {
      const blob = dashboard.tape.export()
      console.info(blob)
      const download = document.createElement('a')
      download.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(blob)
      download.download = dashboard.tape.name + '.txt'
      download.click()
    } else if (event === 'Open') {
      if (dashboard.programRow === 0) this.client.openState('maps')
      else if (dashboard.programRow === 1) this.client.openState('paint')
      else if (dashboard.programRow === 2) this.client.openState('music')
      else if (dashboard.programRow === 3) this.client.openState('sound')
    } else if (event === 'Back') this.client.openState('home')
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
    const fontHeight = fontScale * font.height
    const fontPad = calcFontPad(fontHeight)

    if (client.touch) renderTouch(client.touchRender)

    identity(view)
    multiply(projection, client.orthographic, view)

    rendererSetView(rendering, 0, client.top, width, height)

    gl.clearColor(slate0f, slate1f, slate2f, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // text

    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)

    rendererSetProgram(rendering, 'texture2d-font')
    rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

    bufferZero(client.bufferGUI)

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

      text = 'Quick Play'
      const optionTest = flexBox(fontWidth * text.length, fontHeight)
      optionTest.bottomSpace = fontPad
      optionTest.funX = 'align-left'
      optionTest.fromX = optionExport
      optionTest.funY = 'below'
      optionTest.fromY = optionExport
      flexSolve(width, height, optionTest)
      drawTextFontSpecial(client.bufferGUI, optionTest.x, optionTest.y, text, fontScale, white0f, white1f, white2f, font)

      text = 'Name'
      const optionName = flexBox(fontWidth * text.length, fontHeight)
      optionName.bottomSpace = fontPad
      optionName.funX = 'align-left'
      optionName.fromX = optionTest
      optionName.funY = 'below'
      optionName.fromY = optionTest
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

      text = 'Open'
      const optionOpen = flexBox(fontWidth * text.length, fontHeight)
      optionOpen.bottomSpace = fontPad
      optionOpen.funX = 'align-left'
      optionOpen.fromX = optionNew
      optionOpen.funY = 'below'
      optionOpen.fromY = optionNew
      flexSolve(width, height, optionOpen)
      drawTextFontSpecial(client.bufferGUI, optionOpen.x, optionOpen.y, text, fontScale, white0f, white1f, white2f, font)

      text = 'Copy'
      const optionCopy = flexBox(fontWidth * text.length, fontHeight)
      optionCopy.bottomSpace = fontPad
      optionCopy.funX = 'align-left'
      optionCopy.fromX = optionOpen
      optionCopy.funY = 'below'
      optionCopy.fromY = optionOpen
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
          indicator.fromX = optionTest
          indicator.fromY = optionTest
          break
        case 3:
          indicator.fromX = optionName
          indicator.fromY = optionName
          break
        case 4:
          indicator.fromX = optionNew
          indicator.fromY = optionNew
          break
        case 5:
          indicator.fromX = optionOpen
          indicator.fromY = optionOpen
          break
        case 6:
          indicator.fromX = optionCopy
          indicator.fromY = optionCopy
          break
        case 7:
          indicator.fromX = optionBack
          indicator.fromY = optionBack
          break
      }
      flexSolve(width, height, indicator)
      drawTextFontSpecial(client.bufferGUI, indicator.x, indicator.y, text, fontScale, white0f, white1f, white2f, font)

      rendererBindTexture(rendering, gl.TEXTURE0, textureByName(font.name).texture)
      rendererUpdateAndDraw(rendering, client.bufferGUI)
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

      rendererBindTexture(rendering, gl.TEXTURE0, textureByName(font.name).texture)
      rendererUpdateAndDraw(rendering, client.bufferGUI)
    } else if (dashboard.menu === EDIT_NAME) {
      const box = dashboard.textBox

      rendererBindTexture(rendering, gl.TEXTURE0, textureByName(font.name).texture)
      rendererUpdateAndDraw(rendering, client.bufferGUI)

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
