/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { createNewTexturesAndSpriteSheets, readPaintFile, readPaintFileAsLookup, saveEntity, saveTexture, saveTile, waitForResources } from '../assets/assets.js'
import { pauseMusic, resumeMusic, saveMusic, saveSound } from '../assets/sounds.js'
import { DashboardState } from '../client/dashboard-state.js'
import { GameState } from '../client/game-state.js'
import { HomeState } from '../client/home-state.js'
import { MapState } from '../client/map-state.js'
import { MusicState } from '../client/music-state.js'
import { fetchImage, fetchText } from '../client/net.js'
import { PaintState } from '../client/paint-state.js'
import { drawFloorCeil, drawWall } from '../client/render-sector.js'
import { TouchRender, touchRenderEvent, touchRenderResize } from '../client/render-touch.js'
import { SfxState } from '../client/sfx-state.js'
import { intHashCode, Table, tableGet, tablePut } from '../collections/table.js'
import { newPalette } from '../editor/palette.js'
import { Tape } from '../game/tape.js'
import * as In from '../input/input.js'
import { orthographic, perspective } from '../math/matrix.js'
import { drawSkyBox } from '../render/render.js'
import { shadePalette } from '../render/shading.js'
import * as Wad from '../wad/wad.js'
import { Buffer } from '../webgl/buffer.js'
import { Renderer, rendererInsertProgram, rendererMakeVAO, rendererUpdateVAO } from '../webgl/renderer.js'
import { compileProgram, createPixelsToTexture, createTexture } from '../webgl/webgl.js'

export class Client {
  constructor(canvas, gl) {
    this.top = 0
    this.width = canvas.width
    this.height = canvas.height
    this.canvas = canvas
    this.gl = gl
    this.scale = 1
    this.orthographic = new Float32Array(16)
    this.perspective = new Float32Array(16)
    this.rendering = null
    this.bufferGUI = null
    this.bufferColor = null
    this.bufferSky = null
    this.sectorBuffers = new Table(intHashCode)
    this.spriteBuffers = new Table(intHashCode)
    this.pack = null
    this.paint = null
    this.sfx = null
    this.music = null
    this.maps = null
    this.dashboard = null
    this.game = null
    this.home = null
    this.state = null
    this.keys = null
    this.input = null
    this.touch = false
    this.touchRender = null
    this.controllers = []
  }

  keyEvent(code, down) {
    this.state.keyEvent(code, down)
  }

  keyUp(event) {
    this.keyEvent(event.code, false)
  }

  keyDown(event) {
    this.keyEvent(event.code, true)
  }

  mouseEvent(button, down) {
    this.state.mouseEvent(button === 0, down)
  }

  mouseUp(event) {
    this.mouseEvent(event.button, false)
  }

  mouseDown(event) {
    this.mouseEvent(event.button, true)
  }

  mouseMove(event) {
    this.state.mouseMove(event.clientX, this.height - event.clientY)
  }

  touchStart(event) {
    const input = touchRenderEvent(this.touchRender, event)
    if (input !== null) {
      const code = this.keys.reversed(input)
      this.state.keyEvent(code, true)
    }
  }

  touchEnd(event) {
    const input = touchRenderEvent(this.touchRender, event)
    if (input !== null) {
      const code = this.keys.reversed(input)
      this.state.keyEvent(code, false)
    }
  }

  touchMove() {}

  pause() {
    pauseMusic()
  }

  resume() {
    resumeMusic()
  }

  resize(width, height) {
    this.width = width
    this.height = height
    this.canvas.width = width
    this.canvas.height = height

    let ratio = width / height

    if (ratio < 0.7) {
      this.touch = true
      this.top = Math.floor(0.5 * height)
      height -= this.top
      ratio = width / height
      if (this.touchRender === null) this.touchRender = new TouchRender(this)
    } else {
      this.touch = false
      this.top = 0
    }

    orthographic(this.orthographic, 0.0, width, 0.0, height, 0.0, 1.0)

    const fov = 60.0
    const near = 0.01
    const far = 200.0
    perspective(this.perspective, fov, near, far, ratio)

    const x = Math.ceil(width / 800)
    const y = Math.ceil(height / 600)
    this.scale = Math.min(x, y)

    if (this.touch) touchRenderResize(this.touchRender)

    this.state.resize(width, height, this.scale)
  }

  getSectorBuffer(texture) {
    let buffer = tableGet(this.sectorBuffers, texture)
    if (buffer === null) {
      buffer = new Buffer(3, 0, 2, 3, 4 * 800, 36 * 800)
      rendererMakeVAO(this.rendering, buffer)
      tablePut(this.sectorBuffers, texture, buffer)
    }
    return buffer
  }

  getSpriteBuffer(texture) {
    let buffer = tableGet(this.spriteBuffers, texture)
    if (buffer === null) {
      buffer = new Buffer(3, 0, 2, 3, 4 * 800, 36 * 800)
      rendererMakeVAO(this.rendering, buffer)
      tablePut(this.spriteBuffers, texture, buffer)
    }
    return buffer
  }

  sectorRender(sector) {
    for (const line of sector.lines) {
      let wall = line.top
      if (wall) {
        const buffer = this.getSectorBuffer(wall.texture)
        drawWall(buffer, wall)
      }
      wall = line.middle
      if (wall) {
        const buffer = this.getSectorBuffer(wall.texture)
        drawWall(buffer, wall)
      }
      wall = line.bottom
      if (wall) {
        const buffer = this.getSectorBuffer(wall.texture)
        drawWall(buffer, wall)
      }
    }
    for (const triangle of sector.triangles) {
      const buffer = this.getSectorBuffer(triangle.texture)
      drawFloorCeil(buffer, triangle)
    }
  }

  async initialize() {
    const gl = this.gl

    // for (let i = 0; i < localStorage.length; i++) console.debug(localStorage.key(i))

    const main = Wad.parse(await fetchText('start.wad'))
    const pack = main.get('package')
    const directory = './pack/' + pack
    const contents = Wad.parse(await fetchText(directory + '/' + pack + '.wad'))
    const tape = new Tape('tape-1')

    this.boot = main
    this.pack = pack
    this.tape = tape

    for (const entity of contents.get('entities')) {
      saveEntity(entity, directory, '/entities/' + entity + '.wad')
      tape.entities.push(entity)
    }

    gl.enable(gl.SCISSOR_TEST)
    gl.depthFunc(gl.LEQUAL)
    gl.cullFace(gl.BACK)
    gl.disable(gl.BLEND)

    for (const music of contents.get('music')) {
      const dot = music.lastIndexOf('.')
      if (dot === -1) throw 'Extension missing: ' + music
      const name = music.substring(0, dot)
      saveMusic(name, directory + '/music/' + music)
      tape.music.push(music)
    }

    for (const sound of contents.get('sounds')) {
      saveSound(sound, directory + '/sounds/')
      tape.sounds.push(sound)
    }

    let color2d = fetchText('./shaders/color2d.glsl')
    let texture2d = fetchText('./shaders/texture2d.glsl')
    let texture3d = fetchText('./shaders/texture3d.glsl')
    let texture2d_rgb = fetchText('./shaders/texture2d-rgb.glsl')
    let texture2d_font = fetchText('./shaders/texture2d-font.glsl')
    let texture3d_rgb = fetchText('./shaders/texture3d-rgb.glsl')
    let texture3d_palette = fetchText('./shaders/texture3d-palette.glsl')
    let texture3d_light = fetchText('./shaders/texture3d-light.glsl')
    let texture3d_lookup = fetchText('./shaders/texture3d-lookup.glsl')

    const textures = []
    const palette = newPalette()

    const trueColor = true

    for (const texture of contents.get('sprites')) {
      if (texture.endsWith('.txt')) {
        textures.push(
          fetchText(directory + '/sprites/' + texture).then((text) => {
            if (trueColor) return readPaintFile(text, palette)
            else return readPaintFileAsLookup(text)
          })
        )
      } else {
        const name = texture.substring(0, texture.length - 4)
        textures.push(
          fetchImage(directory + '/sprites/' + texture).then((image) => {
            return { name: name, wrap: 'clamp', image: image }
          })
        )
      }
      tape.textures.push(texture)
    }

    await waitForResources()

    createNewTexturesAndSpriteSheets(palette, (image) => {
      if (trueColor) return createPixelsToTexture(gl, image.width, image.height, image.pixels, gl.RGB, gl.RGB, gl.NEAREST, gl.CLAMP_TO_EDGE)
      else return createPixelsToTexture(gl, image.width, image.height, image.pixels, gl.R8, gl.RED, gl.NEAREST, gl.CLAMP_TO_EDGE)
    })

    if (!trueColor) {
      const lights = shadePalette(64, 32, newPalette())
      const shading = createPixelsToTexture(gl, 64, 32, lights, gl.RGB, gl.RGB, gl.NEAREST, gl.CLAMP_TO_EDGE)
      saveTexture('_shading', shading)
    }

    for (let texture of textures) {
      texture = await texture
      const wrap = texture.wrap === 'repeat' ? gl.REPEAT : gl.CLAMP_TO_EDGE
      if (texture.pixels) {
        if (trueColor) saveTexture(texture.name, createPixelsToTexture(gl, texture.width, texture.height, texture.pixels, gl.RGB, gl.RGB, gl.NEAREST, wrap))
        else saveTexture(texture.name, createPixelsToTexture(gl, texture.width, texture.height, texture.pixels, gl.R8, gl.RED, gl.NEAREST, wrap))
        if (texture.sprites) {
          for (const sprite of texture.sprites) {
            if (sprite.length < 6 || sprite[5] !== 'tile') continue
            const left = parseInt(sprite[1])
            const top = parseInt(sprite[2])
            const right = parseInt(sprite[3])
            const bottom = parseInt(sprite[4])
            const width = right - left
            const height = bottom - top
            const source = texture.pixels
            const srcwid = texture.width
            if (trueColor) {
              const pixels = new Uint8Array(width * height * 3)
              for (let h = 0; h < height; h++) {
                const row = top + h
                for (let c = 0; c < width; c++) {
                  const s = (left + c + row * srcwid) * 3
                  const d = (c + h * width) * 3
                  pixels[d] = source[s]
                  pixels[d + 1] = source[s + 1]
                  pixels[d + 2] = source[s + 2]
                }
              }
              saveTile(sprite[0], createPixelsToTexture(gl, width, height, pixels, gl.RGB, gl.RGB, gl.NEAREST, gl.REPEAT))
            } else {
              const pixels = new Uint8Array(width * height)
              for (let h = 0; h < height; h++) {
                const row = top + h
                for (let c = 0; c < width; c++) {
                  const s = left + c + row * srcwid
                  const d = c + h * width
                  pixels[d] = source[s]
                }
              }
              saveTile(sprite[0], createPixelsToTexture(gl, width, height, pixels, gl.R8, gl.RED, gl.NEAREST, gl.REPEAT))
            }
          }
        }
      } else {
        saveTexture(texture.name, createTexture(gl, texture.image, gl.NEAREST, wrap))
      }
    }

    this.rendering = new Renderer(gl)
    this.bufferGUI = new Buffer(2, 4, 2, 0, 4 * 800, 36 * 800)
    this.bufferColor = new Buffer(2, 4, 0, 0, 4 * 1600, 36 * 1600)
    this.bufferSky = new Buffer(3, 0, 2, 0, 24, 36)

    drawSkyBox(this.bufferSky)

    const rendering = this.rendering

    color2d = await color2d
    texture2d = await texture2d
    texture3d = await texture3d
    texture2d_rgb = await texture2d_rgb
    texture2d_font = await texture2d_font
    texture3d_rgb = await texture3d_rgb
    texture3d_palette = await texture3d_palette
    texture3d_light = await texture3d_light
    texture3d_lookup = await texture3d_lookup

    rendererInsertProgram(rendering, 'color2d', compileProgram(gl, color2d))
    rendererInsertProgram(rendering, 'texture2d', compileProgram(gl, texture2d))
    rendererInsertProgram(rendering, 'texture3d', compileProgram(gl, texture3d))
    rendererInsertProgram(rendering, 'texture2d-rgb', compileProgram(gl, texture2d_rgb))
    rendererInsertProgram(rendering, 'texture2d-font', compileProgram(gl, texture2d_font))
    rendererInsertProgram(rendering, 'texture3d-rgb', compileProgram(gl, texture3d_rgb))
    rendererInsertProgram(rendering, 'texture3d-palette', compileProgram(gl, texture3d_palette))
    rendererInsertProgram(rendering, 'texture3d-light', compileProgram(gl, texture3d_light))
    rendererInsertProgram(rendering, 'texture3d-lookup', compileProgram(gl, texture3d_lookup))

    rendererMakeVAO(rendering, this.bufferGUI)
    rendererMakeVAO(rendering, this.bufferColor)
    rendererMakeVAO(rendering, this.bufferSky)

    rendererUpdateVAO(rendering, this.bufferSky, gl.STATIC_DRAW)

    const keys = new Map()

    keys.set('Enter', In.BUTTON_START)
    keys.set('Space', In.BUTTON_SELECT)

    keys.set('KeyW', In.STICK_UP)
    keys.set('KeyA', In.STICK_LEFT)
    keys.set('KeyS', In.STICK_DOWN)
    keys.set('KeyD', In.STICK_RIGHT)

    keys.set('ArrowUp', In.BUTTON_X)
    keys.set('ArrowLeft', In.BUTTON_Y)
    keys.set('ArrowDown', In.BUTTON_B)
    keys.set('ArrowRight', In.BUTTON_A)

    keys.set('KeyI', In.BUTTON_X)
    keys.set('KeyJ', In.BUTTON_Y)
    keys.set('KeyK', In.BUTTON_B)
    keys.set('KeyL', In.BUTTON_A)

    keys.set('KeyQ', In.LEFT_TRIGGER)
    keys.set('KeyO', In.RIGHT_TRIGGER)

    this.keys = keys

    this.input = new In.Input()
    In.usingKeyboardMouse(this.input)

    await this.openState(main.get('open'))

    this.resize(this.width, this.height)
  }

  async openState(open) {
    const boot = this.boot
    let file = null
    switch (open) {
      case 'paint':
        if (this.paint === null) this.paint = new PaintState(this)
        else this.paint.reset()
        this.state = this.paint
        break
      case 'sfx':
        if (this.sfx === null) this.sfx = new SfxState(this)
        else this.sfx.reset()
        this.state = this.sfx
        break
      case 'music':
        if (this.music === null) this.music = new MusicState(this)
        else this.music.reset()
        this.state = this.music
        break
      case 'maps':
        if (this.maps === null) this.maps = new MapState(this)
        else this.maps.reset()
        this.state = this.maps
        break
      case 'dashboard':
        if (this.dashboard === null) this.dashboard = new DashboardState(this)
        else this.dashboard.reset()
        this.state = this.dashboard
        break
      case 'game':
        if (this.game === null) this.game = new GameState(this)
        else this.game.reset()
        this.state = this.game
        if (boot.has('map')) file = './pack/' + this.pack + '/maps/' + boot.get('map') + '.txt'
        break
      default:
        if (this.home === null) this.home = new HomeState(this)
        else this.home.reset()
        this.state = this.home
    }
    await this.state.initialize(file)
  }

  update(timestamp) {
    this.input.keyboardMouseUpdate()
    const controllers = this.controllers
    if (controllers.length !== 0) this.input.controllerUpdate(controllers[0])
    this.input.updatePressed()

    this.state.update(timestamp)
  }

  render() {
    this.state.render()
  }
}
