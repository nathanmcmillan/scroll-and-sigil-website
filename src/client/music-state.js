/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { textureByName } from '../assets/assets.js'
import { renderDialogBox, renderStatus } from '../client/client-util.js'
import { calcBottomBarHeight, calcFontScale, calcTopBarHeight, defaultFont } from '../editor/editor-util.js'
import { lengthName, MusicEdit } from '../editor/music.js'
import { ember0f, ember1f, ember2f, redf, slatef, whitef } from '../editor/palette.js'
import { flexBox, flexSolve } from '../gui/flex.js'
import { identity, multiply } from '../math/matrix.js'
import { spr, sprcol } from '../render/pico.js'
import { drawRectangle, drawTextFontSpecial } from '../render/render.js'
import { semitoneName, SEMITONES } from '../sound/synth.js'
import { bufferZero } from '../webgl/buffer.js'
import { rendererBindTexture, rendererSetProgram, rendererSetView, rendererUpdateAndDraw, rendererUpdateUniformMatrix } from '../webgl/renderer.js'

export class MusicState {
  constructor(client) {
    this.client = client
    this.keys = client.keys

    this.view = new Float32Array(16)
    this.projection = new Float32Array(16)

    const music = new MusicEdit(this, client.width, client.height - client.top, client.scale, client.input)
    this.music = music
  }

  reset() {}

  resize(width, height, scale) {
    this.music.resize(width, height, scale)
  }

  keyEvent(code, down) {
    const music = this.music
    if (this.keys.has(code)) {
      music.input.set(this.keys.get(code), down)
      music.immediate()
    }
  }

  mouseEvent() {}

  mouseMove() {}

  async initialize() {
    await this.music.load()
  }

  eventCall(event) {
    if (event === 'start-export') this.export()
    else if (event === 'save-save') this.save()
    else if (event === 'start-open') this.import()
    else if (event === 'start-save') this.save()
    else if (event === 'start-exit') this.returnToDashboard()
  }

  returnToDashboard() {
    this.client.openState('dashboard')
  }

  import() {
    const button = document.createElement('input')
    button.type = 'file'
    button.onchange = (e) => {
      const file = e.target.files[0]
      console.info(file)
      const reader = new FileReader()
      reader.readAsText(file, 'utf-8')
      reader.onload = (event) => {
        const content = event.target.result
        this.music.read(content)
      }
    }
    button.click()
  }

  save() {
    const blob = this.music.export()
    localStorage.setItem('music.txt', blob)
    console.info(blob)
    console.info('saved to local storage!')
  }

  export() {
    const blob = this.music.export()
    const download = document.createElement('a')
    download.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(blob)
    download.download = 'music.txt'
    download.click()
  }

  update(timestamp) {
    this.music.update(timestamp)
  }

  render() {
    const music = this.music
    if (!music.doPaint) return

    const client = this.client
    const gl = client.gl
    const rendering = client.rendering
    const view = this.view
    const projection = this.projection
    const scale = music.scale
    const width = client.width
    const height = client.height - client.top

    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)

    identity(view)
    multiply(projection, client.orthographic, view)

    const font = defaultFont()
    const fontScale = calcFontScale(scale)
    const fontWidth = fontScale * font.width
    const fontHeight = fontScale * font.base

    rendererSetProgram(rendering, 'color2d')
    rendererSetView(rendering, 0, client.top, width, height)
    rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

    gl.clearColor(slatef(0), slatef(1), slatef(2), 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // top and bottom bar

    bufferZero(client.bufferColor)

    const topBarHeight = calcTopBarHeight(scale)
    drawRectangle(client.bufferColor, 0, height - topBarHeight, width, topBarHeight, ember0f, ember1f, ember2f, 1.0)

    const bottomBarHeight = calcBottomBarHeight(scale)
    drawRectangle(client.bufferColor, 0, 0, width, bottomBarHeight, ember0f, ember1f, ember2f, 1.0)

    rendererUpdateAndDraw(rendering, client.bufferColor)

    // text

    rendererSetProgram(rendering, 'texture2d-font')
    rendererSetView(rendering, 0, client.top, width, height)
    rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

    bufferZero(client.bufferGUI)

    const track = music.tracks[music.trackIndex]
    const notes = track.notes

    const text = track.name
    const posBox = flexBox(fontWidth * text.length, fontHeight)
    posBox.argX = 20
    posBox.argY = 40
    flexSolve(width, height, posBox)
    drawTextFontSpecial(client.bufferGUI, posBox.x, posBox.y, text, fontScale, whitef(0), whitef(1), whitef(2), font)

    const smallFontScale = Math.floor(1.5 * scale)
    const smallFontWidth = smallFontScale * font.width
    const smallFontHeight = smallFontScale * font.height
    const smallFontHalfWidth = Math.floor(0.5 * smallFontWidth)
    const noteRows = music.noteRows
    const noteC = music.noteC
    const noteR = music.noteR

    const noteSides = 20

    let x = noteSides
    let pos = x
    let y = height - 150
    const noteWidth = Math.floor(2.5 * smallFontWidth)
    const noteHeight = Math.floor(1.2 * smallFontHeight)

    for (let c = 0; c < notes.length; c++) {
      const note = notes[c]
      if (pos > width - noteSides) {
        pos = x
        y -= 6 * noteHeight
      }
      for (let r = 1; r < noteRows; r++) {
        const num = note[r]
        const pitch = num === 0 ? '-' : '' + num
        let xx = pos
        if (pitch >= 10) xx -= smallFontHalfWidth
        if (c === noteC && r === noteR) drawTextFontSpecial(client.bufferGUI, xx, y - r * noteHeight, pitch, smallFontScale, redf(0), redf(1), redf(2), font)
        else drawTextFontSpecial(client.bufferGUI, xx, y - r * noteHeight, pitch, smallFontScale, whitef(0), whitef(1), whitef(2), font)
      }
      pos += noteWidth
    }

    const tempoText = 'Tempo:' + music.tempo
    drawTextFontSpecial(client.bufferGUI, 20, height - fontHeight * 3, tempoText, fontScale, whitef(0), whitef(1), whitef(2), font)

    drawTextFontSpecial(client.bufferGUI, 20, 200, lengthName(notes[noteC][0]), smallFontScale, whitef(0), whitef(1), whitef(2), font)
    for (let r = 1; r < noteRows; r++) {
      const note = notes[noteC][r]
      let noteText
      if (note === 0) noteText = '-'
      else noteText = semitoneName(note - SEMITONES)
      drawTextFontSpecial(client.bufferGUI, 20, 200 - r * noteHeight, noteText, smallFontScale, whitef(0), whitef(1), whitef(2), font)
    }

    //  status text

    renderStatus(client, width, height, font, fontWidth, fontScale, topBarHeight, music)

    rendererBindTexture(rendering, gl.TEXTURE0, textureByName(font.name).texture)
    rendererUpdateAndDraw(rendering, client.bufferGUI)

    bufferZero(client.bufferGUI)

    // sprites

    rendererSetProgram(rendering, 'texture2d-rgb')
    rendererSetView(rendering, 0, client.top, width, height)
    rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

    const spriteScale = Math.floor(1.5 * scale)
    const spriteSize = 8 * spriteScale

    x = noteSides
    pos = x
    y = height - 150 + Math.floor(0.5 * noteHeight)

    const r = 0
    for (let c = 0; c < notes.length; c++) {
      const note = notes[c]
      const duration = 33 + note[r]
      if (pos > width - noteSides) {
        pos = x
        y -= 6 * noteHeight
      }
      sprcol(client.bufferGUI, duration, 1.0, 1.0, pos, y - spriteScale, spriteSize, spriteSize, 0.0, 0.0, 0.0, 1.0)
      if (c === noteC && r === noteR) sprcol(client.bufferGUI, duration, 1.0, 1.0, pos, y, spriteSize, spriteSize, redf(0), redf(1), redf(2), 1.0)
      else spr(client.bufferGUI, duration, 1.0, 1.0, pos, y, spriteSize, spriteSize)
      pos += noteWidth
    }

    rendererBindTexture(rendering, gl.TEXTURE0, textureByName('editor-sprites').texture)
    rendererUpdateAndDraw(rendering, client.bufferGUI)

    // dialog box

    if (music.dialog !== null) renderDialogBox(this, scale, font, music.dialog)
  }
}
