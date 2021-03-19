import { textureByName } from '../assets/assets.js'
import { renderDialogBox, renderStatus } from '../client/client-util.js'
import { calcBottomBarHeight, calcFontPad, calcFontScale, calcTopBarHeight, defaultFont } from '../editor/editor-util.js'
import { orange0f, orange1f, orange2f, red0f, red1f, red2f, silver0f, silver1f, silver2f, slatef } from '../editor/palette.js'
import { DURATION_INDEX, FREQUENCY_INDEX, SfxEdit, WAVE_INDEX } from '../editor/sfx.js'
import { identity, multiply } from '../math/matrix.js'
import { drawRectangle, drawTextFont } from '../render/render.js'
import { SEMITONES, WAVE_LIST, diatonic, semitoneName } from '../sound/synth.js'

export class SfxState {
  constructor(client) {
    this.client = client
    this.keys = client.keys

    this.view = new Float32Array(16)
    this.projection = new Float32Array(16)

    const sfx = new SfxEdit(this, client.width, client.height - client.top, client.scale, client.input)
    this.sfx = sfx
  }

  reset() {}

  resize(width, height, scale) {
    this.sfx.resize(width, height, scale)
  }

  keyEvent(code, down) {
    const sfx = this.sfx
    if (this.keys.has(code)) {
      sfx.input.set(this.keys.get(code), down)
      sfx.immediateInput()
    }
  }

  mouseEvent() {}

  mouseMove() {}

  async initialize() {
    await this.sfx.load()
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
        this.sfx.read(content)
      }
    }
    button.click()
  }

  save() {
    const blob = this.sfx.export()
    localStorage.setItem('sfx.txt', blob)
    console.info(blob)
    console.info('saved to local storage!')
  }

  export() {
    const blob = this.sfx.export()
    const download = document.createElement('a')
    download.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(blob)
    download.download = 'sfx.txt'
    download.click()
  }

  update(timestamp) {
    this.sfx.update(timestamp)
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

    rendering.setProgram('color2d')
    rendering.setView(0, client.top, width, height)
    rendering.updateUniformMatrix('u_mvp', projection)

    gl.clearColor(slatef(0), slatef(1), slatef(2), 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)

    // top and bottom bar

    client.bufferColor.zero()

    const topBarHeight = calcTopBarHeight(scale)
    drawRectangle(client.bufferColor, 0, height - topBarHeight, width, topBarHeight, red0f, red1f, red2f, 1.0)

    const bottomBarHeight = calcBottomBarHeight(scale)
    drawRectangle(client.bufferColor, 0, 0, width, bottomBarHeight, red0f, red1f, red2f, 1.0)

    rendering.updateAndDraw(client.bufferColor)

    // text

    rendering.setProgram('texture2d-font')
    rendering.setView(0, 0, width, height)
    rendering.updateUniformMatrix('u_mvp', projection)

    //  status text

    client.bufferGUI.zero()

    renderStatus(client, width, height, font, fontWidth, fontScale, topBarHeight, sfx)

    // sound

    const x = 40
    let y = 600

    for (let i = 0; i < sfx.parameters.length; i++) {
      let text = sfx.parameters[i] + ': '
      if (i === WAVE_INDEX) text += WAVE_LIST[sfx.arguments[i]]
      else if (i === FREQUENCY_INDEX) text += diatonic(sfx.arguments[i] - SEMITONES).toFixed(2) + ' (' + semitoneName(sfx.arguments[i] - SEMITONES) + ')'
      else if (i === DURATION_INDEX) text += sfx.arguments[i] + ' ms'
      else text += sfx.arguments[i].toFixed(2)
      if (i === sfx.row) drawTextFont(client.bufferGUI, x, y, text, fontScale, orange0f, orange1f, orange2f, 1.0, font)
      else drawTextFont(client.bufferGUI, x, y, text, fontScale, silver0f, silver1f, silver2f, 1.0, font)
      y -= fontHeightAndPad
    }

    rendering.bindTexture(gl.TEXTURE0, textureByName(font.name).texture)
    rendering.updateAndDraw(client.bufferGUI)

    // dialog box

    if (sfx.dialog !== null) renderDialogBox(this, scale, font, sfx.dialog)
  }
}
