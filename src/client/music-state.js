/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { textureByName } from '../assets/assets.js'
import { renderDialogBox, renderStatus, renderTextBox } from '../client/client-util.js'
import { calcBottomBarHeight, calcFontScale, calcTopBarHeight, defaultFont } from '../editor/editor-util.js'
import { lengthName, MusicEdit } from '../editor/music-edit.js'
import {
  ember0f,
  ember1f,
  ember2f,
  lemon0f,
  lemon1f,
  lemon2f,
  salmon0f,
  salmon1f,
  salmon2f,
  silver0f,
  silver1f,
  silver2f,
  slatef,
  white0f,
  white1f,
  white2f,
} from '../editor/palette.js'
import { local_storage_get, local_storage_set } from '../io/files.js'
import { identity, multiply } from '../math/matrix.js'
import { sprcol } from '../render/pico.js'
import { drawRectangle, drawText, drawTextFontSpecial } from '../render/render.js'
import { NOTE_ROWS } from '../sound/sound.js'
import { semitoneName, semitoneNoOctave, SEMITONES } from '../sound/synth.js'
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

  pause() {
    this.music.pause()
  }

  resume() {
    this.music.resume()
  }

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
    let music = null
    const tape = this.client.tape.name
    const name = local_storage_get('tape:' + tape + ':music')
    if (name) music = local_storage_get('tape:' + tape + ':music:' + name)
    this.music.load(music)
  }

  eventCall(event) {
    if (event === 'Save-Save') this.save()
    else if (event === 'Start-Export') this.export()
    else if (event === 'Start-Open') this.import()
    else if (event === 'Start-Exit') this.returnToDashboard()
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
    const tape = this.client.tape.name
    const name = this.music.name
    const blob = this.music.export()
    local_storage_set('tape:' + tape + ':music', name)
    local_storage_set('tape:' + tape + ':music:' + name, blob)
    console.info(blob)
    console.info('saved to local storage!')
  }

  export() {
    const blob = this.music.export()
    const download = document.createElement('a')
    download.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(blob)
    download.download = this.music.name + '.wad'
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
    // const fontHeight = fontScale * font.base

    const topBarHeight = calcTopBarHeight(scale)
    const bottomBarHeight = calcBottomBarHeight(scale)

    const play = music.play
    const track = music.track
    const notes = track.notes
    const noteC = track.c
    const noteR = track.r

    const notesLen = notes.length

    const smallFontScale = Math.floor(1.5 * scale)
    const smallFontWidth = smallFontScale * font.width
    const smallFontHeight = smallFontScale * font.height
    const smallFontHalfWidth = Math.floor(0.5 * smallFontWidth)

    const noteWidth = Math.floor(2.5 * smallFontWidth)
    const noteHeight = Math.floor(1.2 * smallFontHeight)

    const noteSides = 20

    const noteViewWidth = width - noteSides * 2
    // const noteViewHeight = height - noteSides * 2 - topBarHeight - bottomBarHeight

    const noteViewColumns = Math.floor(noteViewWidth / noteWidth)

    // const noteViewRows = Math.floor(notesLen / noteViewColumns)

    // const scrolling = noteViewRows * noteHeight > noteViewHeight

    rendererSetProgram(rendering, 'color2d')
    rendererSetView(rendering, 0, client.top, width, height)
    rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

    gl.clearColor(slatef(0), slatef(1), slatef(2), 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // top and bottom bar

    bufferZero(client.bufferColor)
    drawRectangle(client.bufferColor, 0, height - topBarHeight, width, topBarHeight, ember0f, ember1f, ember2f, 1.0)
    drawRectangle(client.bufferColor, 0, 0, width, bottomBarHeight, ember0f, ember1f, ember2f, 1.0)

    // scroll bar

    // if (scrolling) {
    //   const scrollBarWidth = 20
    //   const scrollBarHeight = height - topBarHeight - bottomBarHeight
    //   const scrollBarItemHeight = scrollBarWidth * 2

    //   drawRectangle(client.bufferColor, width - scrollBarWidth, bottomBarHeight, scrollBarWidth, scrollBarHeight, wine0f, wine1f, wine2f, 1.0)
    //   drawRectangle(client.bufferColor, width - scrollBarWidth, bottomBarHeight + 100, scrollBarWidth, scrollBarItemHeight, ember0f, ember1f, ember2f, 1.0)
    // }

    rendererUpdateAndDraw(rendering, client.bufferColor)

    // text

    rendererSetProgram(rendering, 'texture2d-font')
    rendererSetView(rendering, 0, client.top, width, height)
    rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

    bufferZero(client.bufferGUI)

    let x = noteSides // noteViewColumns * noteWidth - (width - noteViewWidth) * 0.5
    let pos = x
    let y = height - 150

    for (let c = 0; c < notesLen; c++) {
      const note = notes[c]
      if (c !== 0 && c % noteViewColumns === 0) {
        pos = x
        y -= 6 * noteHeight
      }
      for (let r = 1; r < NOTE_ROWS; r++) {
        const num = note[r]
        const pitch = num === 0 ? '-' : '' + num
        let xx = pos
        if (pitch >= 10) xx -= smallFontHalfWidth
        if (c === noteC && (play || r === noteR)) {
          if (num === 0 || music.scaleNotes.includes(semitoneNoOctave(num + track.tuning - SEMITONES))) {
            drawText(client.bufferGUI, xx, y - r * noteHeight, pitch, smallFontScale, ember0f, ember1f, ember2f, 1.0, font)
          } else {
            drawText(client.bufferGUI, xx, y - r * noteHeight, pitch, smallFontScale, salmon0f, salmon1f, salmon2f, 1.0, font)
          }
        } else {
          if (num === 0 || music.scaleNotes.includes(semitoneNoOctave(num + track.tuning - SEMITONES))) {
            drawText(client.bufferGUI, xx, y - r * noteHeight, pitch, smallFontScale, silver0f, silver1f, silver2f, 1.0, font)
          } else {
            drawText(client.bufferGUI, xx, y - r * noteHeight, pitch, smallFontScale, lemon0f, lemon1f, lemon2f, 1.0, font)
          }
        }
      }
      pos += noteWidth
    }

    const noteX = noteSides
    const noteY = 4 * noteHeight + noteSides
    drawText(client.bufferGUI, noteX, noteY, lengthName(notes[noteC][0]), smallFontScale, silver0f, silver1f, silver2f, 1.0, font)
    for (let r = 1; r < NOTE_ROWS; r++) {
      const note = notes[noteC][r]
      if (note === 0) {
        drawText(client.bufferGUI, noteX, noteY - r * noteHeight, '-', smallFontScale, silver0f, silver1f, silver2f, 1.0, font)
      } else {
        const semitone = note + track.tuning - SEMITONES
        const noteText = semitoneName(semitone)
        if (music.scaleNotes.includes(semitoneNoOctave(semitone))) {
          drawText(client.bufferGUI, noteX, noteY - r * noteHeight, noteText, smallFontScale, silver0f, silver1f, silver2f, 1.0, font)
        } else {
          drawText(client.bufferGUI, noteX, noteY - r * noteHeight, noteText, smallFontScale, lemon0f, lemon1f, lemon2f, 1.0, font)
        }
      }
    }

    const interval = music.scaleRoot + ' ' + music.scaleMode + ': ' + music.scaleNotes.join(',')
    const scaleX = width - noteSides - interval.length * fontWidth
    const scaleY = noteHeight + noteSides
    drawText(client.bufferGUI, scaleX, scaleY, interval, smallFontScale, silver0f, silver1f, silver2f, 1.0, font)

    //  status text

    renderStatus(client, width, height, font, fontWidth, fontScale, topBarHeight, music)

    rendererBindTexture(rendering, gl.TEXTURE0, textureByName(font.name).texture)
    rendererUpdateAndDraw(rendering, client.bufferGUI)

    bufferZero(client.bufferGUI)

    // sprites

    rendererSetProgram(rendering, 'texture2d-ignore')
    rendererSetView(rendering, 0, client.top, width, height)
    rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

    const spriteScale = Math.floor(1.5 * scale)
    const spriteSize = 8 * spriteScale

    x = noteSides
    pos = x
    y = height - 150 + Math.floor(0.5 * noteHeight)

    const r = 0
    for (let c = 0; c < notesLen; c++) {
      const note = notes[c]
      const duration = 33 + note[r]
      if (pos > width - noteSides) {
        pos = x
        y -= 6 * noteHeight
      }
      if (c === noteC && (play || r === noteR)) sprcol(client.bufferGUI, duration, 1.0, 1.0, pos, y, spriteSize, spriteSize, ember0f, ember1f, ember2f, 1.0)
      else sprcol(client.bufferGUI, duration, 1.0, 1.0, pos, y, spriteSize, spriteSize, silver0f, silver1f, silver2f, 1.0)
      pos += noteWidth
    }

    rendererBindTexture(rendering, gl.TEXTURE0, textureByName('editor-sprites').texture)
    rendererUpdateAndDraw(rendering, client.bufferGUI)

    // dialog box or text box

    if (music.dialog !== null) renderDialogBox(this, scale, font, music.dialog)
    else if (music.activeTextBox) {
      const box = music.textBox
      renderTextBox(this, scale, font, box, 200, 200)

      bufferZero(client.bufferGUI)
      drawTextFontSpecial(client.bufferGUI, 200, 500, box.text, fontScale, white0f, white1f, white2f, font)
      rendererUpdateAndDraw(rendering, client.bufferGUI)
    }
  }
}
