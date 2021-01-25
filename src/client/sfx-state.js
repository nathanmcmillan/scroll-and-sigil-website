import {textureByName} from '/src/assets/assets.js'
import {drawTextSpecial} from '/src/render/render.js'
import {identity, multiply} from '/src/math/matrix.js'
import {whitef, darkgreyf} from '/src/editor/palette.js'
import {compress} from '/src/compress/huffman.js'
import {SfxEdit} from '/src/editor/sfx.js'
import {calcFontScale} from '/src/editor/editor-util.js'
import * as In from '/src/input/input.js'

export class SfxState {
  constructor(client) {
    this.client = client
    this.keys = client.keys

    this.view = new Float32Array(16)
    this.projection = new Float32Array(16)

    let sfx = new SfxEdit(client.width, client.height - client.top, client.scale, client.input)
    this.sfx = sfx
  }

  reset() {}

  resize(width, height, scale) {
    this.sfx.resize(width, height, scale)
  }

  keyEvent(code, down) {
    let sfx = this.sfx
    if (this.keys.has(code)) sfx.input.set(this.keys.get(code), down)
    if (down && code === 'Digit1') {
      this.client.openState('dashboard')
    } else if (down && code === 'Digit0') {
      // local storage
      let blob = sfx.export()
      localStorage.setItem('music-edit', blob)
      console.info('saved to local storage!')
      console.info(blob)
    } else if (down && code === 'Digit6') {
      // compressed text
      let blob = compress(sfx.export())
      let download = document.createElement('a')
      download.href = window.URL.createObjectURL(new Blob([blob], {type: 'application/octet-stream'}))
      download.download = 'sfx.huff'
      download.click()
    } else if (down && code === 'Digit8') {
      // plain text
      let blob = sfx.export()
      let download = document.createElement('a')
      download.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(blob)
      download.download = 'sfx.txt'
      download.click()
    }
  }

  mouseEvent() {}

  mouseMove() {}

  async initialize() {
    await this.sfx.load()
  }

  update() {
    let sfx = this.sfx
    sfx.update()
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

    gl.clearColor(darkgreyf(0), darkgreyf(1), darkgreyf(2), 1.0)

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)

    identity(view)
    multiply(projection, client.orthographic, view)

    const fontScale = calcFontScale(scale)

    // text
    rendering.setProgram(4)
    rendering.setView(0, 0, width, height)
    rendering.updateUniformMatrix('u_mvp', projection)

    client.bufferGUI.zero()

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

    // sound
    let text = 'Wave: ' + sfx.wave
    drawTextSpecial(client.bufferGUI, 20, 400, text, fontScale, whitef(0), whitef(1), whitef(2))
    text = 'Frequency: ' + sfx.pitch + ' hz'
    drawTextSpecial(client.bufferGUI, 20, 380, text, fontScale, whitef(0), whitef(1), whitef(2))
    text = 'Duration: ' + sfx.duration + ' ms'
    drawTextSpecial(client.bufferGUI, 20, 360, text, fontScale, whitef(0), whitef(1), whitef(2))

    text = 'Volume: 1.0'
    drawTextSpecial(client.bufferGUI, 20, 340, text, fontScale, whitef(0), whitef(1), whitef(2))
    text = 'Attack: 1.0'
    drawTextSpecial(client.bufferGUI, 20, 320, text, fontScale, whitef(0), whitef(1), whitef(2))
    text = 'Delay: 1.0'
    drawTextSpecial(client.bufferGUI, 20, 300, text, fontScale, whitef(0), whitef(1), whitef(2))
    text = 'Sustain: 1.0'
    drawTextSpecial(client.bufferGUI, 20, 280, text, fontScale, whitef(0), whitef(1), whitef(2))
    text = 'Release: 1.0'
    drawTextSpecial(client.bufferGUI, 20, 260, text, fontScale, whitef(0), whitef(1), whitef(2))
    text = 'Modulation: 1.0'
    drawTextSpecial(client.bufferGUI, 20, 240, text, fontScale, whitef(0), whitef(1), whitef(2))
    text = 'Noise: 1.0'
    drawTextSpecial(client.bufferGUI, 20, 220, text, fontScale, whitef(0), whitef(1), whitef(2))
    text = 'Bit Crush: 1.0'
    drawTextSpecial(client.bufferGUI, 20, 200, text, fontScale, whitef(0), whitef(1), whitef(2))
    text = 'Delay: 1.0'
    drawTextSpecial(client.bufferGUI, 20, 180, text, fontScale, whitef(0), whitef(1), whitef(2))
    text = 'Tremolo: 1.0'
    drawTextSpecial(client.bufferGUI, 20, 160, text, fontScale, whitef(0), whitef(1), whitef(2))

    // info
    text = '(' + buttonB + ')Duration down (' + buttonA + ')Duration up (' + buttonX + ') Play'
    drawTextSpecial(client.bufferGUI, 20, 20, text, fontScale, whitef(0), whitef(1), whitef(2))

    rendering.bindTexture(gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
    rendering.updateAndDraw(client.bufferGUI)
  }
}
