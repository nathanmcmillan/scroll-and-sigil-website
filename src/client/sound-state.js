/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { textureByName } from '../assets/assets.js'
import { saveSynthSound } from '../assets/sound-manager.js'
import { renderDialogBox, renderStatus, renderTextBox } from '../client/client-util.js'
import { calcBottomBarHeight, calcFontPad, calcFontScale, calcTopBarHeight, defaultFont } from '../editor/editor-util.js'
import { ember0f, ember1f, ember2f, orange0f, orange1f, orange2f, silver0f, silver1f, silver2f, slatef, white0f, white1f, white2f } from '../editor/palette.js'
import { SoundEdit } from '../editor/sound-edit.js'
import { flexBox, flexSolve, returnFlexBox } from '../gui/flex.js'
import { local_storage_get, local_storage_set } from '../io/files.js'
import { identity, multiply } from '../math/matrix.js'
import { drawImage, drawRectangle, drawTextFont, drawTextFontSpecial } from '../render/render.js'
import {
  ACCEL,
  diatonic,
  FREQ,
  FREQ_GROUP,
  HARMONIC_GROUP,
  HARMONIC_MULT_A,
  HARMONIC_MULT_B,
  HARMONIC_MULT_C,
  JERK,
  OTHER_GROUP,
  semitoneName,
  SEMITONES,
  SPEED,
  SUSTAIN,
  SYNTH_ARGUMENTS,
  TREMOLO_FREQ,
  TREMOLO_GROUP,
  TREMOLO_WAVE,
  VIBRATO_FREQ,
  VIBRATO_GROUP,
  VIBRATO_WAVE,
  VOLUME,
  VOLUME_GROUP,
  WAVE,
  WAVEFORMS,
  WAVE_GROUP,
} from '../sound/synth.js'
import { bufferZero } from '../webgl/buffer.js'
import { rendererBindTexture, rendererSetProgram, rendererSetView, rendererUpdateAndDraw, rendererUpdateUniformMatrix } from '../webgl/renderer.js'
import { createPixelsToTexture, updatePixelsToTexture } from '../webgl/webgl.js'

export class SoundState {
  constructor(client) {
    this.client = client
    this.keys = client.keys

    this.view = new Float32Array(16)
    this.projection = new Float32Array(16)

    const sfx = new SoundEdit(this, client.width, client.height - client.top, client.scale, client.input)
    this.sfx = sfx

    const width = sfx.visualWidth
    const height = sfx.visualHeight
    const pixels = sfx.visualPixels

    const gl = client.gl
    this.texture = createPixelsToTexture(gl, width, height, pixels, gl.RGB, gl.RGB, gl.NEAREST, gl.CLAMP_TO_EDGE).texture
  }

  reset() {}

  pause() {
    this.sfx.pause()
  }

  resume() {
    this.sfx.resume()
  }

  resize(width, height, scale) {
    this.sfx.resize(width, height, scale)
  }

  keyEvent(code, down) {
    const sfx = this.sfx
    if (this.keys.has(code)) {
      sfx.input.set(this.keys.get(code), down)
      sfx.immediate()
    }
  }

  mouseEvent() {}

  mouseMove() {}

  async initialize() {
    let sound = null
    const tape = this.client.tape.name
    const name = local_storage_get('tape:' + tape + ':sound')
    if (name) sound = local_storage_get('tape:' + tape + ':sound:' + name)
    this.sfx.load(sound)
    this.updateTexture()
  }

  eventCall(event) {
    if (event === 'Start-Save') this.save()
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
        this.sfx.read(content)
      }
    }
    button.click()
  }

  save() {
    // TODO
    // How do we enable hot loading of assets
    // So that the edit - game loop is immediate
    // Due to browser persistent storage limitations
    // How do we make sure saving work doesn't lose anything
    // We must use localStorage
    // There must be a 1-to-1 mapping from localStorage to game assets
    const tape = this.client.tape.name
    const name = this.sfx.name
    const blob = this.sfx.export()
    local_storage_set('tape:' + tape + ':sound', name)
    local_storage_set('tape:' + tape + ':sound:' + name, blob)
    console.info(blob)
    console.info('saved to local storage!')
    saveSynthSound(name, blob)
  }

  export() {
    const blob = this.sfx.export()
    const download = document.createElement('a')
    download.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(blob)
    download.download = this.sfx.name + '.wad'
    download.click()
  }

  updateTexture() {
    const sfx = this.sfx
    const width = sfx.visualWidth
    const height = sfx.visualHeight
    const pixels = sfx.visualPixels
    updatePixelsToTexture(this.client.gl, this.texture, width, height, pixels)
  }

  update(timestamp) {
    const sfx = this.sfx
    sfx.update(timestamp)
    if (sfx.refreshPixels) this.updateTexture()
  }

  render() {
    const sfx = this.sfx
    if (!sfx.doPaint) return

    const client = this.client
    const gl = client.gl
    const rendering = client.rendering
    const view = this.view
    const projection = this.projection
    const scale = sfx.scale
    const width = client.width
    const height = client.height

    identity(view)
    multiply(projection, client.orthographic, view)

    const font = defaultFont()
    const fontScale = calcFontScale(scale)
    const fontWidth = fontScale * font.width
    const fontHeight = fontScale * font.base
    const fontPad = calcFontPad(fontHeight)
    const fontHeightAndPad = fontHeight + fontPad

    rendererSetView(rendering, 0, client.top, width, height)

    gl.clearColor(slatef(0), slatef(1), slatef(2), 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)

    rendererSetProgram(rendering, 'color2d')
    rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

    // top and bottom bar

    bufferZero(client.bufferColor)

    const topBarHeight = calcTopBarHeight(scale)
    drawRectangle(client.bufferColor, 0, height - topBarHeight, width, topBarHeight, ember0f, ember1f, ember2f, 1.0)

    const bottomBarHeight = calcBottomBarHeight(scale)
    drawRectangle(client.bufferColor, 0, 0, width, bottomBarHeight, ember0f, ember1f, ember2f, 1.0)

    rendererUpdateAndDraw(rendering, client.bufferColor)

    // text

    rendererSetProgram(rendering, 'texture2d-font')
    rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

    //  status text

    bufferZero(client.bufferGUI)

    renderStatus(client, width, height, font, fontWidth, fontScale, topBarHeight, sfx)

    // sound

    const box = flexBox(0, (SYNTH_ARGUMENTS.length + 5) * fontHeightAndPad)
    box.funX = '%'
    box.argX = 5
    box.funY = 'center'
    flexSolve(width, height, box)

    const x = box.x
    let y = box.y + box.height

    returnFlexBox(box)

    let index = 0

    for (let i = 0; i < WAVE_GROUP.length; i++) {
      let text = SYNTH_ARGUMENTS[index] + ' = '
      if (index === WAVE) text += WAVEFORMS[sfx.parameters[index]]
      else text += sfx.parameters[index].toFixed(2)
      if (index === sfx.row) drawTextFont(client.bufferGUI, x, y, text, fontScale, orange0f, orange1f, orange2f, 1.0, font)
      else drawTextFont(client.bufferGUI, x, y, text, fontScale, silver0f, silver1f, silver2f, 1.0, font)
      y -= fontHeightAndPad
      index++
    }

    y -= fontHeightAndPad

    for (let i = 0; i < FREQ_GROUP.length; i++) {
      let text = SYNTH_ARGUMENTS[index] + ' = '
      if (index === FREQ) text += diatonic(sfx.parameters[index] - SEMITONES).toFixed(2) + ' hz (' + semitoneName(sfx.parameters[index] - SEMITONES) + ')'
      else if (index === SPEED) text += sfx.parameters[index].toFixed(3) + ' hz/sec'
      else if (index === ACCEL) text += sfx.parameters[index].toFixed(3) + ' hz/sec/sec'
      else if (index === JERK) text += sfx.parameters[index].toFixed(3) + ' hz/sec/sec/sec'
      else text += sfx.parameters[index].toFixed(2)
      if (index === sfx.row) drawTextFont(client.bufferGUI, x, y, text, fontScale, orange0f, orange1f, orange2f, 1.0, font)
      else drawTextFont(client.bufferGUI, x, y, text, fontScale, silver0f, silver1f, silver2f, 1.0, font)
      y -= fontHeightAndPad
      index++
    }

    y -= fontHeightAndPad

    for (let i = 0; i < VOLUME_GROUP.length; i++) {
      let text = SYNTH_ARGUMENTS[index] + ' = '
      if (index === SUSTAIN || index === VOLUME) text += (sfx.parameters[index] * 100).toFixed(0) + ' %'
      else text += sfx.parameters[index].toFixed(0) + ' ms'
      if (index === sfx.row) drawTextFont(client.bufferGUI, x, y, text, fontScale, orange0f, orange1f, orange2f, 1.0, font)
      else drawTextFont(client.bufferGUI, x, y, text, fontScale, silver0f, silver1f, silver2f, 1.0, font)
      y -= fontHeightAndPad
      index++
    }

    y -= fontHeightAndPad

    for (let i = 0; i < VIBRATO_GROUP.length; i++) {
      let text = SYNTH_ARGUMENTS[index] + ' = '
      if (index === VIBRATO_WAVE) text += WAVEFORMS[sfx.parameters[index]]
      else if (index === VIBRATO_FREQ) text += sfx.parameters[index].toFixed(2) + ' hz'
      else text += sfx.parameters[index].toFixed(2)
      if (index === sfx.row) drawTextFont(client.bufferGUI, x, y, text, fontScale, orange0f, orange1f, orange2f, 1.0, font)
      else drawTextFont(client.bufferGUI, x, y, text, fontScale, silver0f, silver1f, silver2f, 1.0, font)
      y -= fontHeightAndPad
      index++
    }

    y -= fontHeightAndPad

    for (let i = 0; i < TREMOLO_GROUP.length; i++) {
      let text = SYNTH_ARGUMENTS[index] + ' = '
      if (index === TREMOLO_WAVE) text += WAVEFORMS[sfx.parameters[index]]
      else if (index === TREMOLO_FREQ) text += sfx.parameters[index].toFixed(2) + ' hz'
      else text += sfx.parameters[index].toFixed(2)
      if (index === sfx.row) drawTextFont(client.bufferGUI, x, y, text, fontScale, orange0f, orange1f, orange2f, 1.0, font)
      else drawTextFont(client.bufferGUI, x, y, text, fontScale, silver0f, silver1f, silver2f, 1.0, font)
      y -= fontHeightAndPad
      index++
    }

    y -= fontHeightAndPad

    for (let i = 0; i < OTHER_GROUP.length; i++) {
      const text = SYNTH_ARGUMENTS[index] + ' = ' + sfx.parameters[index].toFixed(2)
      if (index === sfx.row) drawTextFont(client.bufferGUI, x, y, text, fontScale, orange0f, orange1f, orange2f, 1.0, font)
      else drawTextFont(client.bufferGUI, x, y, text, fontScale, silver0f, silver1f, silver2f, 1.0, font)
      y -= fontHeightAndPad
      index++
    }

    y -= fontHeightAndPad

    for (let i = 0; i < HARMONIC_GROUP.length; i++) {
      let text = SYNTH_ARGUMENTS[index] + ' = '
      if (index === HARMONIC_MULT_A || index === HARMONIC_MULT_B || index === HARMONIC_MULT_C) text += sfx.parameters[index] === 1 ? 'Off' : sfx.parameters[index].toFixed(2)
      else text += sfx.parameters[index].toFixed(3)
      if (index === sfx.row) drawTextFont(client.bufferGUI, x, y, text, fontScale, orange0f, orange1f, orange2f, 1.0, font)
      else drawTextFont(client.bufferGUI, x, y, text, fontScale, silver0f, silver1f, silver2f, 1.0, font)
      y -= fontHeightAndPad
      index++
    }

    rendererBindTexture(rendering, gl.TEXTURE0, textureByName(font.name).texture)
    rendererUpdateAndDraw(rendering, client.bufferGUI)

    // visualize

    bufferZero(client.bufferGUI)

    const visual = flexBox(sfx.visualWidth, sfx.visualHeight)
    visual.funX = '%-left'
    visual.argX = 90
    visual.funY = 'center'
    flexSolve(width, height, visual)
    drawImage(client.bufferGUI, visual.x, visual.y, visual.width, visual.height, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0)
    returnFlexBox(visual)

    rendererBindTexture(rendering, gl.TEXTURE0, this.texture)
    rendererUpdateAndDraw(rendering, client.bufferGUI)

    // dialog box or text box

    if (sfx.dialog !== null) renderDialogBox(this, scale, font, sfx.dialog)
    else if (sfx.activeTextBox) {
      const box = sfx.textBox
      renderTextBox(this, scale, font, box, 200, 200)

      bufferZero(client.bufferGUI)
      drawTextFontSpecial(client.bufferGUI, 200, 500, box.text, fontScale, white0f, white1f, white2f, font)
      rendererUpdateAndDraw(rendering, client.bufferGUI)
    }
  }
}
