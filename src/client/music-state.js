import {semitoneName, MusicEdit, SEMITONES} from '/src/editor/music.js'
import {textureByName} from '/src/assets/assets.js'
import {drawText, drawTextSpecial, drawRectangle, FONT_WIDTH, FONT_HEIGHT} from '/src/render/render.js'
import {spr, sprcol} from '/src/render/pico.js'
import {identity, multiply} from '/src/math/matrix.js'
import {whitef, redf, darkpurplef, darkgreyf} from '/src/editor/palette.js'
import {flexBox, flexSolve} from '/src/flex/flex.js'
import {speech, SYNTH_SPEECH_FREQ} from '/src/sound/speech.js'
import {compress} from '/src/compress/huffman.js'

export class MusicState {
  constructor(client) {
    this.client = client
    this.keys = client.keys

    this.view = new Float32Array(16)
    this.projection = new Float32Array(16)

    let music = new MusicEdit(client.width, client.height, client.scale, client.input)
    this.music = music

    if (false) {
      // let text = 'scroll and sigil'
      // let shorten = false
      // let pitch = 1.0
      // let buffer = animal(text, shorten, pitch)

      let base = 60
      let speed = 1.5
      let text = 'scroll and sigil'
      let seconds = 10
      let wave = SYNTH_SPEECH_FREQ * 2 * 2 * seconds
      let buffer = new Int16Array(new ArrayBuffer(wave))
      speech(buffer, text, base, speed, 0)

      let amp = 22000
      let str = ''
      for (var i = 0; i < buffer.length; i++) {
        var y = (buffer[i] / amp) * 0x7800
        str += String.fromCharCode(y & 255, (y >> 8) & 255)
      }
      let audio = new Audio('data:audio/wav;base64,' + btoa(atob('UklGRti/UABXQVZFZm10IBAAAAABAAIARKwAABCxAgAEABAAZGF0YbS/UAA') + str))
      audio.play()
    }
  }

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

    gl.clearColor(darkgreyf(0), darkgreyf(1), darkgreyf(2), 1.0)

    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.clear(gl.DEPTH_BUFFER_BIT)

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

    let canvasWidth = client.width
    let canvasHeight = client.height

    rendering.setProgram(0)
    rendering.setView(0, 0, canvasWidth, canvasHeight)
    rendering.updateUniformMatrix('u_mvp', projection)

    client.bufferGUI.zero()

    // top bar
    let topBarHeight = fontHeight + 2 * pad
    drawRectangle(buffer, 0, canvasHeight - topBarHeight, canvasWidth, topBarHeight, redf(0), redf(1), redf(2), 1.0)

    // bottom bar
    drawRectangle(buffer, 0, 0, canvasWidth, topBarHeight, redf(0), redf(1), redf(2), 1.0)

    rendering.updateAndDraw(buffer)

    // text
    rendering.setProgram(4)
    rendering.setView(0, 0, canvasWidth, canvasHeight)
    rendering.updateUniformMatrix('u_mvp', projection)

    client.bufferGUI.zero()

    let track = music.tracks[music.trackIndex]
    let notes = track.notes

    let text = track.name
    let posBox = flexBox(fontWidth * text.length, fontHeight)
    posBox.argX = 20
    posBox.argY = 40
    flexSolve(canvasWidth, canvasHeight, posBox)
    drawTextSpecial(client.bufferGUI, posBox.x, posBox.y, text, fontScale, whitef(0), whitef(1), whitef(2), 1.0)

    const smallFontScale = Math.floor(1.5 * scale)
    const smallFontWidth = smallFontScale * FONT_WIDTH
    const smallFontHeight = smallFontScale * FONT_HEIGHT
    const smallFontHalfWidth = Math.floor(0.5 * smallFontWidth)
    const noteRows = music.noteRows
    const noteC = music.noteC
    const noteR = music.noteR

    let x = 20
    let y = canvasHeight - 150
    let noteWidth = Math.floor(2.5 * smallFontWidth)
    let noteHeight = Math.floor(1.2 * smallFontHeight)

    for (let c = 0; c < notes.length; c++) {
      let note = notes[c]
      for (let r = 1; r < noteRows; r++) {
        let num = note[r]
        let pitch = num === 0 ? '-' : '' + num
        let pos = x + c * noteWidth
        if (pitch >= 10) pos -= smallFontHalfWidth
        if (c === noteC && r === noteR) drawTextSpecial(client.bufferGUI, pos, y - r * noteHeight, pitch, smallFontScale, redf(0), redf(1), redf(2), 1.0)
        else drawTextSpecial(client.bufferGUI, pos, y - r * noteHeight, pitch, smallFontScale, whitef(0), whitef(1), whitef(2), 1.0)
      }
    }

    let tempoText = 'Tempo:' + music.tempo
    drawTextSpecial(client.bufferGUI, 20, canvasHeight - fontHeight * 3, tempoText, fontScale, whitef(0), whitef(1), whitef(2), 1.0)

    // top info
    let topBarText = '(+)FILE EDIT VIEW HELP'
    drawText(client.bufferGUI, 0, canvasHeight - topBarHeight + pad - scale, topBarText, fontScale, darkpurplef(0), darkpurplef(1), darkpurplef(2), 1.0)

    let topBarSwitch = '(-)HCLPSM '
    let width = topBarSwitch.length * fontWidth
    drawText(client.bufferGUI, canvasWidth - width, canvasHeight - topBarHeight + pad - scale, topBarSwitch, fontScale, darkpurplef(0), darkpurplef(1), darkpurplef(2), 1.0)

    let infoText
    infoText = noteR === 0 ? '(x)Duration down (z)Duration up ' : '(z)Pitch down (x)Pitch up '
    infoText += '(+)Insert note (-)Delete note '
    infoText += music.play ? '(c)Stop' : '(c)Play'
    drawTextSpecial(client.bufferGUI, 20, 100, infoText, fontScale, whitef(0), whitef(1), whitef(2), 1.0)

    for (let r = 1; r < noteRows; r++) {
      let note = notes[noteC][r]
      let noteText
      if (note === 0) noteText = '-'
      else noteText = semitoneName(note - SEMITONES)
      drawTextSpecial(client.bufferGUI, 20, 200 - r * noteHeight, noteText, smallFontScale, whitef(0), whitef(1), whitef(2), 1.0)
    }

    rendering.bindTexture(gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
    rendering.updateAndDraw(client.bufferGUI)

    client.bufferGUI.zero()

    // sprites
    rendering.setProgram(3)
    rendering.setView(0, 0, canvasWidth, canvasHeight)
    rendering.updateUniformMatrix('u_mvp', projection)

    const spriteScale = Math.floor(1.5 * scale)
    const spriteSize = 8 * spriteScale

    y += Math.floor(0.5 * noteHeight)
    const r = 0
    for (let c = 0; c < notes.length; c++) {
      let note = notes[c]
      let duration = 33 + note[r]
      let pos = x + c * noteWidth
      sprcol(client.bufferGUI, duration, 1.0, 1.0, pos, y - spriteScale, spriteSize, spriteSize, 0.0, 0.0, 0.0, 1.0)
      if (c === noteC && r === noteR) sprcol(client.bufferGUI, duration, 1.0, 1.0, pos, y, spriteSize, spriteSize, redf(0), redf(1), redf(2), 1.0)
      else spr(client.bufferGUI, duration, 1.0, 1.0, pos, y, spriteSize, spriteSize)
    }

    rendering.bindTexture(gl.TEXTURE0, textureByName('editor-sprites').texture)
    rendering.updateAndDraw(client.bufferGUI)
  }
}
