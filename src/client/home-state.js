/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { textureByIndex, textureByName } from '../assets/assets.js'
import { renderLoadingInProgress } from '../client/render-loading.js'
import { renderTouch } from '../client/render-touch.js'
import { tableIter, tableIterHasNext, tableIterNext, tableIterStart } from '../collections/table.js'
import { calcFontScale } from '../editor/editor-util.js'
import { white0f, white1f, white2f } from '../editor/palette.js'
import { Game } from '../game/game.js'
import { flexSolve, flexText } from '../gui/flex.js'
import { identity, multiply, rotateX, rotateY, translate } from '../math/matrix.js'
import { Home } from '../menu/home.js'
import { drawSprite, drawTextSpecial, TIC_FONT_HEIGHT, TIC_FONT_WIDTH } from '../render/render.js'
import { bufferZero } from '../webgl/buffer.js'
import {
  rendererBindAndDraw,
  rendererBindTexture,
  rendererSetProgram,
  rendererSetView,
  rendererUpdateAndDraw,
  rendererUpdateUniformMatrix,
  rendererUpdateVAO,
} from '../webgl/renderer.js'

export class HomeState {
  constructor(client) {
    this.client = client
    this.keys = client.keys

    this.view = new Float32Array(16)
    this.projection = new Float32Array(16)

    this.home = new Home(this, client.width, client.height - client.top, client.scale, client.input)
    this.game = new Game(this, client.input)
    this.loading = true
  }

  reset() {
    this.loading = true
    this.home.reset()
  }

  resize(width, height, scale) {
    this.home.resize(width, height, scale)
  }

  keyEvent(code, down) {
    const home = this.home
    if (this.keys.has(code)) {
      home.input.set(this.keys.get(code), down)
      home.immediate()
    }
  }

  mouseEvent() {}

  mouseMove() {}

  async initialize() {
    await this.load('./pack/' + this.client.pack + '/maps/home.txt')
  }

  async load(file) {
    await this.game.load(file)

    const world = this.game.world
    const client = this.client
    const gl = client.gl

    const sectorIter = tableIter(client.sectorBuffers)
    while (tableIterHasNext(sectorIter)) bufferZero(tableIterNext(sectorIter).value)

    for (let s = 0; s < world.sectors.length; s++) client.sectorRender(world.sectors[s])

    tableIterStart(sectorIter)
    while (tableIterHasNext(sectorIter)) rendererUpdateVAO(client.rendering, tableIterNext(sectorIter).value, gl.STATIC_DRAW)

    this.loading = false
    this.game.update()
  }

  eventCall(event) {
    if (event === 'ok') {
      const home = this.home
      const client = this.client
      if (home.row === 0) client.openState('game')
      else if (home.row === 1) client.openState('game')
      else if (home.row === 2) client.openState('dashboard')
    }
  }

  update(timestamp) {
    if (this.loading) return
    this.home.update(timestamp)
  }

  render() {
    const client = this.client
    const gl = client.gl
    const rendering = client.rendering
    const view = this.view
    const projection = this.projection

    if (this.loading) {
      renderLoadingInProgress(client, view, projection)
      return
    }

    const home = this.home
    if (!home.doPaint) return

    const scale = home.scale
    const width = client.width
    const height = client.height - client.top

    const fontScale = calcFontScale(scale)
    const fontWidth = fontScale * TIC_FONT_WIDTH
    const fontHeight = fontScale * TIC_FONT_HEIGHT

    if (client.touch) renderTouch(client.touchRender)

    rendererSetView(rendering, 0, client.top, width, height)

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const game = this.game
    const world = game.world
    const camera = game.camera

    rendererSetProgram(rendering, 'texture3d-rgb')

    // sky box

    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)

    identity(view)
    rotateX(view, Math.sin(camera.rx), Math.cos(camera.rx))
    rotateY(view, Math.sin(camera.ry), Math.cos(camera.ry))
    translate(view, 0.0, 0.0, 0.0)
    multiply(projection, client.perspective, view)
    rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

    const sky = textureByName('sky-box-1')
    rendererBindTexture(rendering, gl.TEXTURE0, sky.texture)
    rendererBindAndDraw(rendering, client.bufferSky)

    // render world

    gl.enable(gl.CULL_FACE)
    gl.enable(gl.DEPTH_TEST)

    const trueColor = true
    if (!trueColor) {
      rendererSetProgram(rendering, 'texture3d-lookup')
      rendererBindTexture(rendering, gl.TEXTURE1, textureByName('_shading').texture, 'u_lookup', 1)
    }

    identity(view)
    rotateX(view, Math.sin(camera.rx), Math.cos(camera.rx))
    rotateY(view, Math.sin(camera.ry), Math.cos(camera.ry))
    translate(view, -camera.x, -camera.y, -camera.z)
    multiply(projection, client.perspective, view)
    rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)
    rendererUpdateUniformMatrix(rendering, 'u_view', view)

    const sectorIter = tableIter(client.sectorBuffers)
    while (tableIterHasNext(sectorIter)) {
      const entry = tableIterNext(sectorIter)
      const index = entry.key
      const buffer = entry.value
      rendererBindTexture(rendering, gl.TEXTURE0, textureByIndex(index).texture)
      rendererBindAndDraw(rendering, buffer)
    }

    const buffers = client.spriteBuffers

    const iter = tableIter(buffers)
    while (tableIterHasNext(iter)) bufferZero(tableIterNext(iter).value)

    const sine = Math.sin(-camera.ry)
    const cosine = Math.cos(-camera.ry)

    const things = world.things
    let t = world.thingCount
    while (t--) {
      const thing = things[t]
      const buffer = client.getSpriteBuffer(thing.stamp.texture)
      drawSprite(buffer, thing.x, thing.y, thing.z, thing.stamp.sprite, sine, cosine)
    }

    tableIterStart(iter)
    while (tableIterHasNext(iter)) {
      const entry = tableIterNext(iter)
      const buffer = entry.value
      if (buffer.indexPosition === 0) continue
      const index = entry.key
      rendererBindTexture(rendering, gl.TEXTURE0, textureByIndex(index).texture)
      rendererUpdateAndDraw(rendering, buffer, gl.DYNAMIC_DRAW)
    }

    // end render world

    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)

    identity(view)
    multiply(projection, client.orthographic, view)

    bufferZero(client.bufferGUI)

    // text

    rendererSetProgram(rendering, 'texture2d-font')
    rendererSetView(rendering, 0, client.top, width, height)
    rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

    const titleBox = home.titleBox
    drawTextSpecial(client.bufferGUI, titleBox.x, titleBox.y, titleBox.text, 2 * scale, white0f, white1f, white2f)

    const continueGameBox = home.continueGameBox
    drawTextSpecial(client.bufferGUI, continueGameBox.x, continueGameBox.y, continueGameBox.text, fontScale, white0f, white1f, white2f)

    const newGameBox = home.newGameBox
    drawTextSpecial(client.bufferGUI, newGameBox.x, newGameBox.y, newGameBox.text, fontScale, white0f, white1f, white2f)

    const editorBox = home.editorBox
    drawTextSpecial(client.bufferGUI, editorBox.x, editorBox.y, editorBox.text, fontScale, white0f, white1f, white2f)

    const optionsBox = home.optionsBox
    drawTextSpecial(client.bufferGUI, optionsBox.x, optionsBox.y, optionsBox.text, fontScale, white0f, white1f, white2f)

    const creditsBox = home.creditsBox
    drawTextSpecial(client.bufferGUI, creditsBox.x, creditsBox.y, creditsBox.text, fontScale, white0f, white1f, white2f)

    const text = '>'
    const indicatorBox = flexText(text, fontWidth * text.length, fontHeight)
    indicatorBox.funX = 'left-of'
    indicatorBox.funY = 'center'
    if (home.row === 0) {
      indicatorBox.fromX = continueGameBox
      indicatorBox.fromY = continueGameBox
    } else if (home.row === 1) {
      indicatorBox.fromX = newGameBox
      indicatorBox.fromY = newGameBox
    } else if (home.row === 2) {
      indicatorBox.fromX = editorBox
      indicatorBox.fromY = editorBox
    } else if (home.row === 3) {
      indicatorBox.fromX = optionsBox
      indicatorBox.fromY = optionsBox
    } else if (home.row === 4) {
      indicatorBox.fromX = creditsBox
      indicatorBox.fromY = creditsBox
    }
    flexSolve(width, height, indicatorBox)

    drawTextSpecial(client.bufferGUI, indicatorBox.x, indicatorBox.y, indicatorBox.text, fontScale, white0f, white1f, white2f)

    rendererBindTexture(rendering, gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
    rendererUpdateAndDraw(rendering, client.bufferGUI)
  }
}
