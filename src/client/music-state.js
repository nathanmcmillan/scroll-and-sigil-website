import {semitoneName, lengthName, MusicEdit, SEMITONES} from '/src/editor/music.js'
import {textureByName} from '/src/assets/assets.js'
import {drawText, drawTextSpecial, drawRectangle, FONT_WIDTH, FONT_HEIGHT} from '/src/render/render.js'
import {spr, sprcol} from '/src/render/pico.js'
import {identity, multiply} from '/src/math/matrix.js'
import {whitef, redf, darkpurplef, darkgreyf} from '/src/editor/palette.js'
import {flexBox, flexSolve} from '/src/flex/flex.js'
import {compress} from '/src/compress/huffman.js'
import * as In from '/src/input/input.js'

export class MusicState {
  constructor(client) {
    this.client = client
    this.keys = client.keys

    this.view = new Float32Array(16)
    this.projection = new Float32Array(16)

    let music = new MusicEdit(client.width, client.height, client.scale, client.input)
    this.music = music
  }

  reset() {}

  resize(width, height, scale) {
    this.music.resize(width, height, scale)
  }

  keyEvent(code, down) {
    let music = this.music
    if (this.keys.has(code)) music.input.set(this.keys.get(code), down)
    if (down && code === 'Digit1') {
      this.client.openState('dashboard')
    } else if (down && code === 'Digit0') {
      // local storage
      let blob = music.export()
      localStorage.setItem('music-edit', blob)
      console.info('saved to local storage!')
      console.info(blob)
    } else if (down && code === 'Digit6') {
      // compressed text
      let blob = compress(music.export())
      let download = document.createElement('a')
      download.href = window.URL.createObjectURL(new Blob([blob], {type: 'application/octet-stream'}))
      download.download = 'music' + music.trackIndex + '.huff'
      download.click()
    } else if (down && code === 'Digit8') {
      // plain text
      let blob = music.export()
      let download = document.createElement('a')
      download.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(blob)
      download.download = 'music' + music.trackIndex + '.txt'
      download.click()
    }
  }

  mouseEvent() {}

  mouseMove() {}

  async initialize() {
    await this.music.load()
  }

  update(timestamp) {
    let music = this.music
    music.update(timestamp)
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

    let buffer = client.bufferColor
    buffer.zero()

    const fontScale = Math.floor(1.5 * scale)
    const fontWidth = fontScale * FONT_WIDTH
    const fontHeight = fontScale * FONT_HEIGHT

    const pad = 2 * scale

    rendering.setProgram(0)
    rendering.setView(0, client.top, width, height)
    rendering.updateUniformMatrix('u_mvp', projection)

    gl.clearColor(darkgreyf(0), darkgreyf(1), darkgreyf(2), 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    client.bufferGUI.zero()

    // top bar
    let topBarHeight = fontHeight + 2 * pad
    drawRectangle(buffer, 0, height - topBarHeight, width, topBarHeight, redf(0), redf(1), redf(2), 1.0)

    // bottom bar
    drawRectangle(buffer, 0, 0, width, topBarHeight, redf(0), redf(1), redf(2), 1.0)

    // sub menu
    if (music.subMenu !== null) {
      drawRectangle(buffer, Math.floor(width * 0.1), Math.floor(height * 0.1), Math.floor(width * 0.8), Math.floor(height * 0.8), whitef(0), whitef(1), whitef(2), 1.0)
    }

    rendering.updateAndDraw(buffer)

    // text
    rendering.setProgram(4)
    rendering.setView(0, client.top, width, height)
    rendering.updateUniformMatrix('u_mvp', projection)

    client.bufferGUI.zero()

    let track = music.tracks[music.trackIndex]
    let notes = track.notes

    let text = track.name
    let posBox = flexBox(fontWidth * text.length, fontHeight)
    posBox.argX = 20
    posBox.argY = 40
    flexSolve(width, height, posBox)
    drawTextSpecial(client.bufferGUI, posBox.x, posBox.y, text, fontScale, whitef(0), whitef(1), whitef(2))

    const smallFontScale = Math.floor(1.5 * scale)
    const smallFontWidth = smallFontScale * FONT_WIDTH
    const smallFontHeight = smallFontScale * FONT_HEIGHT
    const smallFontHalfWidth = Math.floor(0.5 * smallFontWidth)
    const noteRows = music.noteRows
    const noteC = music.noteC
    const noteR = music.noteR

    const noteSides = 20

    let x = noteSides
    let pos = x
    let y = height - 150
    let noteWidth = Math.floor(2.5 * smallFontWidth)
    let noteHeight = Math.floor(1.2 * smallFontHeight)

    for (let c = 0; c < notes.length; c++) {
      let note = notes[c]
      if (pos > width - noteSides) {
        pos = x
        y -= 6 * noteHeight
      }
      for (let r = 1; r < noteRows; r++) {
        let num = note[r]
        let pitch = num === 0 ? '-' : '' + num
        let xx = pos
        if (pitch >= 10) xx -= smallFontHalfWidth
        if (c === noteC && r === noteR) drawTextSpecial(client.bufferGUI, xx, y - r * noteHeight, pitch, smallFontScale, redf(0), redf(1), redf(2))
        else drawTextSpecial(client.bufferGUI, xx, y - r * noteHeight, pitch, smallFontScale, whitef(0), whitef(1), whitef(2))
      }
      pos += noteWidth
    }

    // keys
    let startKey = this.keys.reversed(In.BUTTON_START)
    if (startKey.startsWith('Key')) startKey = startKey.substring(3)

    let selectKey = this.keys.reversed(In.BUTTON_SELECT)
    if (selectKey.startsWith('Key')) selectKey = selectKey.substring(3)

    let buttonA = this.keys.reversed(In.BUTTON_A)
    if (buttonA.startsWith('Key')) buttonA = buttonA.substring(3)

    let buttonB = this.keys.reversed(In.BUTTON_B)
    if (buttonB.startsWith('Key')) buttonB = buttonB.substring(3)

    let buttonX = this.keys.reversed(In.BUTTON_X)
    if (buttonX.startsWith('Key')) buttonX = buttonX.substring(3)

    let buttonY = this.keys.reversed(In.BUTTON_Y)
    if (buttonY.startsWith('Key')) buttonY = buttonY.substring(3)

    let tempoText = 'Tempo:' + music.tempo
    drawTextSpecial(client.bufferGUI, 20, height - fontHeight * 3, tempoText, fontScale, whitef(0), whitef(1), whitef(2))

    // top info
    let topBarText = '(' + startKey + ')FILE EDIT VIEW HELP'
    drawText(client.bufferGUI, 0, height - topBarHeight + pad - scale, topBarText, fontScale, darkpurplef(0), darkpurplef(1), darkpurplef(2), 1.0)

    let topBarSwitch = '(' + selectKey + ')HCLPSM '
    let topBarWidth = topBarSwitch.length * fontWidth
    drawText(client.bufferGUI, width - topBarWidth, height - topBarHeight + pad - scale, topBarSwitch, fontScale, darkpurplef(0), darkpurplef(1), darkpurplef(2), 1.0)

    let infoText = noteR === 0 ? '(' + buttonB + ')Duration down (' + buttonA + ')Duration up ' : '(' + buttonB + ')Pitch down (' + buttonA + ')Pitch up '
    infoText += '(' + buttonY + ')Options '
    infoText += '(' + selectKey + ')Edit track  '
    infoText += '(' + startKey + ')Menu '
    infoText += music.play ? '(' + buttonX + ')Stop' : '(' + buttonX + ')Play'
    drawTextSpecial(client.bufferGUI, 20, 100, infoText, fontScale, whitef(0), whitef(1), whitef(2))

    drawTextSpecial(client.bufferGUI, 20, 200, lengthName(notes[noteC][0]), smallFontScale, whitef(0), whitef(1), whitef(2))
    for (let r = 1; r < noteRows; r++) {
      let note = notes[noteC][r]
      let noteText
      if (note === 0) noteText = '-'
      else noteText = semitoneName(note - SEMITONES)
      drawTextSpecial(client.bufferGUI, 20, 200 - r * noteHeight, noteText, smallFontScale, whitef(0), whitef(1), whitef(2))
    }

    rendering.bindTexture(gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
    rendering.updateAndDraw(client.bufferGUI)

    client.bufferGUI.zero()

    // sprites
    rendering.setProgram(3)
    rendering.setView(0, client.top, width, height)
    rendering.updateUniformMatrix('u_mvp', projection)

    const spriteScale = Math.floor(1.5 * scale)
    const spriteSize = 8 * spriteScale

    x = noteSides
    pos = x
    y = height - 150 + Math.floor(0.5 * noteHeight)

    const r = 0
    for (let c = 0; c < notes.length; c++) {
      let note = notes[c]
      let duration = 33 + note[r]
      if (pos > width - noteSides) {
        pos = x
        y -= 6 * noteHeight
      }
      sprcol(client.bufferGUI, duration, 1.0, 1.0, pos, y - spriteScale, spriteSize, spriteSize, 0.0, 0.0, 0.0, 1.0)
      if (c === noteC && r === noteR) sprcol(client.bufferGUI, duration, 1.0, 1.0, pos, y, spriteSize, spriteSize, redf(0), redf(1), redf(2), 1.0)
      else spr(client.bufferGUI, duration, 1.0, 1.0, pos, y, spriteSize, spriteSize)
      pos += noteWidth
    }

    rendering.bindTexture(gl.TEXTURE0, textureByName('editor-sprites').texture)
    rendering.updateAndDraw(client.bufferGUI)
  }
}
