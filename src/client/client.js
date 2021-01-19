import {fetchText, fetchImage} from '/src/client/net.js'
import {Buffer} from '/src/webgl/buffer.js'
import {createTexture, createPixelsToTexture, compileProgram} from '/src/webgl/webgl.js'
import {Renderer} from '/src/webgl/renderer.js'
import {drawSkyBox} from '/src/render/render.js'
import {drawWall, drawFloorCeil} from '/src/client/render-sector.js'
import {orthographic, perspective} from '/src/math/matrix.js'
import {saveSound, saveMusic, pauseMusic, resumeMusic} from '/src/assets/sounds.js'
import {newPalette} from '/src/editor/palette.js'
import {saveEntity, saveTile, saveTexture, waitForResources, createNewTexturesAndSpriteSheets} from '/src/assets/assets.js'
import {PaintState} from '/src/client/paint-state.js'
import {SfxState} from '/src/client/sfx-state.js'
import {MusicState} from '/src/client/music-state.js'
import {MapState} from '/src/client/map-state.js'
import {DashboardState} from '/src/client/dashboard-state.js'
import {GameState} from '/src/client/game-state.js'
import {HomeState} from '/src/client/home-state.js'
import {TwoWayMap} from '/src/util/collections.js'
import {TouchRender, touchRenderEvent, touchRenderResize} from '/src/client/render-touch.js'
import * as Wad from '/src/wad/wad.js'
import * as In from '/src/input/input.js'

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
    this.sectorBuffers = new Map()
    this.spriteBuffers = new Map()
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
    let input = touchRenderEvent(this.touchRender, event)
    if (input !== null) {
      let code = this.keys.reversed(input)
      this.state.keyEvent(code, true)
    }
  }

  touchEnd(event) {
    let input = touchRenderEvent(this.touchRender, event)
    if (input !== null) {
      let code = this.keys.reversed(input)
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

    let fov = 60.0
    let near = 0.01
    let far = 200.0
    perspective(this.perspective, fov, near, far, ratio)

    let x = Math.ceil(width / 800)
    let y = Math.ceil(height / 600)
    this.scale = Math.min(x, y)

    if (this.touch) touchRenderResize(this.touchRender)

    this.state.resize(width, height, this.scale)
  }

  getSectorBuffer(texture) {
    let buffer = this.sectorBuffers.get(texture)
    if (buffer == null) {
      buffer = new Buffer(3, 0, 2, 3, 4 * 800, 36 * 800)
      this.rendering.makeVAO(buffer)
      this.sectorBuffers.set(texture, buffer)
    }
    return buffer
  }

  getSpriteBuffer(texture) {
    let buffer = this.spriteBuffers.get(texture)
    if (buffer == null) {
      buffer = new Buffer(3, 0, 2, 3, 4 * 800, 36 * 800)
      this.rendering.makeVAO(buffer)
      this.spriteBuffers.set(texture, buffer)
    }
    return buffer
  }

  sectorRender(sector) {
    for (const line of sector.lines) {
      let wall = line.top
      if (wall) {
        let buffer = this.getSectorBuffer(wall.texture)
        drawWall(buffer, wall)
      }
      wall = line.middle
      if (wall) {
        let buffer = this.getSectorBuffer(wall.texture)
        drawWall(buffer, wall)
      }
      wall = line.bottom
      if (wall) {
        let buffer = this.getSectorBuffer(wall.texture)
        drawWall(buffer, wall)
      }
    }
    for (const triangle of sector.triangles) {
      let buffer = this.getSectorBuffer(triangle.texture)
      drawFloorCeil(buffer, triangle)
    }
  }

  async initialize() {
    const gl = this.gl

    let main = Wad.parse(await fetchText('main.wad'))
    let pack = main.get('package')
    let directory = '/pack/' + pack
    let contents = Wad.parse(await fetchText(directory + '/' + pack + '.wad'))

    this.boot = main
    this.pack = pack

    for (const entity of contents.get('entities')) {
      saveEntity(entity, directory, '/entities/' + entity + '.wad')
    }

    gl.enable(gl.SCISSOR_TEST)
    gl.depthFunc(gl.LEQUAL)
    gl.cullFace(gl.BACK)
    gl.disable(gl.BLEND)

    for (const music of contents.get('music')) {
      let dot = music.lastIndexOf('.')
      if (dot === -1) throw 'Extension missing: ' + music
      let name = music.substring(0, dot)
      saveMusic(name, directory + '/music/' + music)
    }

    for (const sound of contents.get('sounds')) saveSound(sound, directory + '/sounds/' + sound + '.wav')

    let color2d = fetchText('/shaders/color2d.glsl')
    let texture2d = fetchText('/shaders/texture2d.glsl')
    let texture3d = fetchText('/shaders/texture3d.glsl')
    let texture2drgb = fetchText('/shaders/texture2d-rgb.glsl')
    let texture2dignore = fetchText('/shaders/texture2d-ignore.glsl')

    let tiles = []
    let textures = []

    for (const tile of contents.get('tiles')) {
      tiles.push(
        fetchImage(directory + '/tiles/' + tile + '.png').then((image) => {
          return {name: tile, image: image}
        })
      )
    }

    for (const texture of contents.get('textures')) {
      let name = texture.get('name')
      let wrap = texture.get('wrap')
      if (name.endsWith('.txt')) {
        textures.push(
          fetchText(directory + '/textures/' + name).then((text) => {
            name = name.substring(0, name.length - 4)

            let image = text.split('\n')
            let index = 0

            let dimensions = image[index].split(' ')
            let width = parseInt(dimensions[0])
            let height = parseInt(dimensions[1])
            index++

            let palette = newPalette()
            let pixels = new Uint8Array(width * height * 3)

            for (let h = 0; h < height; h++) {
              let row = image[index].split(' ')
              for (let c = 0; c < width; c++) {
                let i = (c + h * width) * 3
                let p = parseInt(row[c]) * 3

                pixels[i] = palette[p]
                pixels[i + 1] = palette[p + 1]
                pixels[i + 2] = palette[p + 2]
              }
              index++
            }

            return {name: name, wrap: wrap, width: width, height: height, pixels: pixels}
          })
        )
      } else {
        textures.push(
          fetchImage(directory + '/textures/' + name + '.png').then((image) => {
            return {name: name, wrap: wrap, image: image}
          })
        )
      }
    }

    await waitForResources()

    createNewTexturesAndSpriteSheets((image) => {
      return createTexture(gl, image, gl.NEAREST, gl.CLAMP_TO_EDGE)
    })

    for (let tile of tiles) {
      tile = await tile
      saveTile(tile.name, createTexture(gl, tile.image, gl.NEAREST, gl.REPEAT))
    }

    for (let texture of textures) {
      texture = await texture
      let wrap = texture.wrap === 'repeat' ? gl.REPEAT : gl.CLAMP_TO_EDGE
      if (texture.pixels) saveTexture(texture.name, createPixelsToTexture(gl, texture.width, texture.height, texture.pixels, gl.RGB, gl.NEAREST, wrap))
      else saveTexture(texture.name, createTexture(gl, texture.image, gl.NEAREST, wrap))
    }

    this.rendering = new Renderer(gl)
    this.bufferGUI = new Buffer(2, 4, 2, 0, 4 * 800, 36 * 800)
    this.bufferColor = new Buffer(2, 4, 0, 0, 4 * 1600, 36 * 1600)
    this.bufferSky = new Buffer(3, 0, 2, 0, 24, 36)

    drawSkyBox(this.bufferSky)

    let rendering = this.rendering

    color2d = await color2d
    texture2d = await texture2d
    texture3d = await texture3d
    texture2drgb = await texture2drgb
    texture2dignore = await texture2dignore

    rendering.insertProgram(0, compileProgram(gl, color2d))
    rendering.insertProgram(1, compileProgram(gl, texture2d))
    rendering.insertProgram(2, compileProgram(gl, texture3d))
    rendering.insertProgram(3, compileProgram(gl, texture2drgb))
    rendering.insertProgram(4, compileProgram(gl, texture2dignore))

    rendering.makeVAO(this.bufferGUI)
    rendering.makeVAO(this.bufferColor)
    rendering.makeVAO(this.bufferSky)

    rendering.updateVAO(this.bufferSky, gl.STATIC_DRAW)

    let keys = new TwoWayMap()

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

    await this.openState(main.get('open'))

    this.resize(this.width, this.height)
  }

  async openState(open) {
    let boot = this.boot
    let file = null
    switch (open) {
      case 'paint':
        if (this.paint === null) this.paint = new PaintState(this)
        else this.paint.reset()
        this.state = this.paint
        if (boot.has('image')) file = '/pack/' + this.pack + '/textures/' + boot.get('image') + '.image'
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
        if (boot.has('map')) file = '/pack/' + this.pack + '/maps/' + boot.get('map') + '.map'
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
        if (boot.has('map')) file = '/pack/' + this.pack + '/maps/' + boot.get('map') + '.map'
        break
      default:
        if (this.home === null) this.home = new HomeState(this)
        else this.home.reset()
        this.state = this.home
    }
    await this.state.initialize(file)
  }

  update(timestamp) {
    this.state.update(timestamp)
  }

  render() {
    this.state.render()
  }
}
