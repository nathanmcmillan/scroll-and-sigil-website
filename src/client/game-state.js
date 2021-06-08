/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { textureByIndex, textureByName, TRUE_COLOR } from '../assets/assets.js'
import { fetchText } from '../client/net.js'
import { renderLoadingInProgress } from '../client/render-loading.js'
import { drawDecal } from '../client/render-sector.js'
import { renderTouch } from '../client/render-touch.js'
import { tableIter, tableIterHasNext, tableIterNext, tableIterStart } from '../collections/table.js'
import { calcFontPad, calcFontScale, defaultFont } from '../editor/editor-util.js'
import { black0f, black1f, black2f, ember0f, ember1f, ember2f, lime0f, lime1f, lime2f, white0f, white1f, white2f } from '../editor/palette.js'
import { Game } from '../game/game.js'
import { flexSolve, flexText, returnFlexText } from '../gui/flex.js'
import { local_storage_set } from '../io/files.js'
import { identity, multiply, multiplyVector3, rotateX, rotateY, translate } from '../math/matrix.js'
import { drawRectangle, drawSprite, drawText } from '../render/render.js'
import { animal } from '../sound/animal.js'
import { speech } from '../sound/speech.js'
import { bufferZero } from '../webgl/buffer.js'
import {
  rendererBindAndDraw,
  rendererBindTexture,
  rendererSetProgram,
  rendererSetView,
  rendererUpdateAndDraw,
  rendererUpdateUniformFloat,
  rendererUpdateUniformInt,
  rendererUpdateUniformMatrix,
  rendererUpdateUniformVec3,
  rendererUpdateVAO,
} from '../webgl/renderer.js'
import { renderDialogBox } from './client-util.js'

function drawTextSpecial(b, x, y, text, scale, red, green, blue) {
  drawText(b, x + scale, y - scale, text, scale, 0.0, 0.0, 0.0, 1.0)
  drawText(b, x, y, text, scale, red, green, blue, 1.0)
}

const VEC = [0.0, 0.0, 0.0]
const POSITION = [0.0, 0.0, 0.0]

export class GameState {
  constructor(client) {
    this.client = client
    this.keys = client.keys

    this.game = new Game(this, client.input)
    this.events = []
    this.loading = true

    this.view = new Float32Array(16)
    this.projection = new Float32Array(16)
    this.projection3d = new Float32Array(16)

    if (false) {
      const text = 'scrol and sigil'
      const base = 60
      const speed = 1.5
      speech(text, base, speed)
    }

    if (false) {
      const text = 'scroll and sigil'
      const pitch = 1.0
      const shorten = false
      animal(text, pitch, shorten)
    }
  }

  pause() {
    this.game.pause()
  }

  resume() {
    this.game.resume()
  }

  resize() {}

  keyEvent(code, down) {
    if (this.keys.has(code)) this.game.input.set(this.keys.get(code), down)
  }

  mouseEvent() {}

  mouseMove() {}

  async load(file) {
    const map = await fetchText(file)
    this.game.load(map)

    const world = this.game.world
    const client = this.client
    const gl = client.gl

    const sectorIter = tableIter(client.sectorBuffers)
    while (tableIterHasNext(sectorIter)) bufferZero(tableIterNext(sectorIter).value)

    for (let s = 0; s < world.sectors.length; s++) client.sectorRender(world.sectors[s])

    tableIterStart(sectorIter)
    while (tableIterHasNext(sectorIter)) rendererUpdateVAO(client.rendering, tableIterNext(sectorIter).value, gl.STATIC_DRAW)

    this.loading = false
  }

  async initialize(args) {
    let file = null
    if (args === '!new-game') file = './pack/' + this.client.pack + '/maps/base.wad'
    else {
      if (args === 'save-x') file = './pack/' + this.client.pack + '/maps/base.wad'
      else throw 'eh'
    }
    await this.load(file)
  }

  eventCall(event) {
    if (event === 'Pause-Save') this.save()
    else if (event === 'Pause-Export') this.export()
    else if (event === 'Pause-Exit') this.returnToHome()
  }

  returnToHome() {
    this.client.openState('home')
  }

  save() {
    const name = this.game.name
    const blob = this.game.export()
    local_storage_set('game', name)
    local_storage_set('game:' + name + ':save', blob)
    console.info(blob)
    console.info('saved to local storage!')
  }

  export() {
    const blob = this.game.export()
    const download = document.createElement('a')
    download.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(blob)
    download.download = this.game.name + '.wad'
    download.click()
  }

  notify(type, args) {
    switch (type) {
      case 'map':
        this.events.push([type, args])
        return
      case 'death':
        return
    }
  }

  doEvent(event) {
    const type = event[0]
    const args = event[1]
    switch (type) {
      case 'map':
        this.loading = true
        this.load('./pack/' + this.client.pack + '/maps/' + args + '.wad')
        return
    }
  }

  update(timestamp) {
    if (this.loading) return

    if (this.client.controllers.length === 0) this.game.input.keyboardMouseAnalog()

    this.game.update(timestamp)

    const events = this.events
    let e = events.length
    if (e > 0) {
      while (e--) this.doEvent(events[e])
      events.length = 0
    }
  }

  render() {
    const client = this.client
    const view = this.view
    const projection = this.projection

    if (this.loading) {
      renderLoadingInProgress(client, view, projection)
      return
    }

    const gl = client.gl
    const rendering = client.rendering
    const game = this.game
    const scale = client.scale
    const width = client.width
    const height = client.height - client.top
    const world = game.world
    const camera = game.camera

    const font = defaultFont()
    const fontScale = calcFontScale(scale)
    const fontWidth = fontScale * font.width
    const fontHeight = fontScale * font.base

    const pad = 10.0

    if (client.touch) renderTouch(client.touchRender)

    rendererSetView(rendering, 0, client.top, width, height)

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // sky box

    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)

    rendererSetProgram(rendering, 'texture3d-rgb')

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

    if (TRUE_COLOR) {
      rendererSetProgram(rendering, 'texture3d-light')
    } else {
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

    if (true) {
      const missiles = world.missiles
      const count = Math.min(world.missileCount, 8)
      rendererUpdateUniformInt(rendering, 'u_light_count', count)
      for (let m = 0; m < count; m++) {
        const missile = missiles[m]
        rendererUpdateUniformVec3(rendering, 'u_light_color[' + m + ']', 0.0, 0.4, 0.0)
        rendererUpdateUniformVec3(rendering, 'u_light_position[' + m + ']', missile.x, missile.y, missile.z)
        const radius = 15.0
        rendererUpdateUniformFloat(rendering, 'u_light_strength[' + m + ']', 1.0 / (radius * radius))
      }
    }

    const projection3d = this.projection3d
    for (let p = 0; p < 16; p++) projection3d[p] = projection[p]

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

    const missiles = world.missiles
    let m = world.missileCount
    while (m--) {
      const missile = missiles[m]
      const buffer = client.getSpriteBuffer(missile.stamp.texture)
      drawSprite(buffer, missile.x, missile.y, missile.z, missile.stamp.sprite, sine, cosine)
    }

    const particles = world.particles
    let p = world.particleCount
    while (p--) {
      const particle = particles[p]
      const buffer = client.getSpriteBuffer(particle.stamp.texture)
      drawSprite(buffer, particle.x, particle.y, particle.z, particle.stamp.sprite, sine, cosine)
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

    const decals = world.decals
    let d = decals.length
    if (d > 0) {
      tableIterStart(iter)
      while (tableIterHasNext(iter)) bufferZero(tableIterNext(iter).value)

      gl.depthMask(false)
      gl.enable(gl.POLYGON_OFFSET_FILL)
      gl.polygonOffset(-1, -1)

      while (d--) {
        const decal = decals[d]
        const buffer = client.getSpriteBuffer(decal.texture)
        drawDecal(buffer, decal)
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

      gl.depthMask(true)
      gl.disable(gl.POLYGON_OFFSET_FILL)
    }

    rendererSetProgram(rendering, 'texture2d-font')

    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)

    identity(view)
    multiply(projection, client.orthographic, view)
    rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

    bufferZero(client.bufferGUI)

    const hero = game.hero

    // overlay

    if (game.cinema) {
      const black = 60.0
      rendererSetProgram(rendering, 'color2d')
      rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)
      bufferZero(client.bufferColor)
      drawRectangle(client.bufferColor, 0.0, 0.0, width, black, black0f, black1f, black2f, 1.0)
      drawRectangle(client.bufferColor, 0.0, height - black, width, black, black0f, black1f, black2f, 1.0)
      rendererUpdateAndDraw(rendering, client.bufferColor)
    } else if (hero.menu) {
      const menu = hero.menu
      const page = menu.page
      if (page === 'inventory') {
        let x = Math.floor(0.5 * width)
        let text = 'Outfit'
        drawTextSpecial(client.bufferGUI, x, height - pad - fontHeight, text, scale, ember0f, ember1f, ember2f)
        if (hero.outfit) {
          text = hero.outfit.name
          drawTextSpecial(client.bufferGUI, x, height - pad - 2.0 * fontHeight, text, scale, ember0f, ember1f, ember2f)
        } else {
          drawTextSpecial(client.bufferGUI, x, height - pad - 2.0 * fontHeight, 'None', scale, ember0f, ember1f, ember2f)
        }
        x += (text.length + 1) * fontWidth
        text = 'Headpiece'
        drawTextSpecial(client.bufferGUI, x, height - pad - fontHeight, text, scale, ember0f, ember1f, ember2f)
        if (hero.headpiece) {
          text = hero.headpiece.name
          drawTextSpecial(client.bufferGUI, x, height - pad - 2.0 * fontHeight, text, scale, ember0f, ember1f, ember2f)
        } else {
          drawTextSpecial(client.bufferGUI, x, height - pad - 2.0 * fontHeight, 'None', scale, ember0f, ember1f, ember2f)
        }
        x += (text.length + 1) * fontWidth
        text = 'Weapon'
        if (hero.weapon) {
          text = hero.weapon.name
          drawTextSpecial(client.bufferGUI, x, height - pad - 2.0 * fontHeight, text, scale, ember0f, ember1f, ember2f)
        } else {
          drawTextSpecial(client.bufferGUI, x, height - pad - 2.0 * fontHeight, 'None', scale, ember0f, ember1f, ember2f)
        }
        drawTextSpecial(client.bufferGUI, x, height - pad - fontHeight, text, scale, ember0f, ember1f, ember2f)
        let y = height - pad - fontHeight
        drawTextSpecial(client.bufferGUI, pad, y, 'Inventory', scale, ember0f, ember1f, ember2f)
        let index = 0
        for (let i = 0; i < hero.inventory.length; i++) {
          const item = hero.inventory[i]
          y -= fontHeight
          if (index === hero.menuRow) drawTextSpecial(client.bufferGUI, pad, y, item.name, scale, 1.0, 1.0, 0.0)
          else drawTextSpecial(client.bufferGUI, pad, y, item.name, scale, ember0f, ember1f, ember2f)
          index++
        }
        rendererBindTexture(rendering, gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
        rendererUpdateAndDraw(rendering, client.bufferGUI)
      }
    } else {
      if (hero.interaction) {
        const interaction = hero.interaction
        const interactionWith = hero.interactionWith
        drawTextSpecial(client.bufferGUI, pad, height - pad - fontHeight, interactionWith.name, scale, ember0f, ember1f, ember2f)
        let y = Math.floor(0.5 * height)
        for (const option of interaction.keys()) {
          drawTextSpecial(client.bufferGUI, pad, y, option, scale, ember0f, ember1f, ember2f)
          y += fontHeight
        }
      } else {
        if (hero.nearby) {
          const thing = hero.nearby
          const text = thing.isItem ? 'COLLECT' : 'SPEAK'
          VEC[0] = thing.x
          VEC[1] = thing.y + thing.height
          VEC[2] = thing.z
          multiplyVector3(POSITION, projection3d, VEC)
          POSITION[0] /= POSITION[2]
          POSITION[1] /= POSITION[2]
          POSITION[0] = 0.5 * ((POSITION[0] + 1.0) * width)
          POSITION[1] = 0.5 * ((POSITION[1] + 1.0) * height)
          POSITION[0] = Math.floor(POSITION[0])
          POSITION[1] = Math.floor(POSITION[1])
          drawTextSpecial(client.bufferGUI, POSITION[0], POSITION[1], text, scale, ember0f, ember1f, ember2f)
        }
        if (hero.combat) {
          let text = ''
          for (let i = 0; i < hero.health; i++) text += 'x'
          const x = pad
          let y = pad
          drawTextSpecial(client.bufferGUI, x, y, text, scale, ember0f, ember1f, ember2f)
          text = ''
          y += fontHeight
          for (let i = 0; i < hero.stamina; i++) text += 'x'
          drawTextSpecial(client.bufferGUI, x, y, text, scale, lime0f, lime1f, lime2f)
        }
        const boss = hero.boss
        if (boss && boss.health > 0) {
          const fontPad = calcFontPad(fontHeight)
          let text = boss.name
          const name = flexText(text, fontWidth * text.length, fontHeight)
          name.bottomSpace = fontPad
          name.funX = 'center'
          name.funY = '%'
          name.argY = '95'
          flexSolve(width, height, name)
          drawTextSpecial(client.bufferGUI, name.x, name.y, name.text, fontScale, white0f, white1f, white2f)
          text = ''
          for (let i = 0; i < boss.health; i++) text += 'x'
          const health = flexText(text, fontWidth * text.length, fontHeight)
          health.funX = 'center'
          health.funY = 'below'
          health.fromY = name
          flexSolve(width, height, health)
          drawTextSpecial(client.bufferGUI, health.x, health.y, health.text, fontScale, ember0f, ember1f, ember2f)
          returnFlexText(name)
          returnFlexText(health)
        }
      }
      if (client.bufferGUI.indexPosition > 0) {
        rendererBindTexture(rendering, gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
        rendererUpdateAndDraw(rendering, client.bufferGUI)
      }
    }

    // dialog box

    if (game.dialog !== null) renderDialogBox(this, scale, font, game.dialog)
  }
}
