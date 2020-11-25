import {fetchText, fetchImage} from '/src/client/net.js'
import {Buffer} from '/src/webgl/buffer.js'
import {createTexture, compileProgram} from '/src/webgl/webgl.js'
import {Renderer} from '/src/webgl/renderer.js'
import {drawSkyBox} from '/src/render/render.js'
import {drawWall, drawFloorCeil} from '/src/client/render-sector.js'
import {orthographic, perspective} from '/src/math/matrix.js'
import {saveSound, saveMusic, pauseMusic, resumeMusic} from '/src/assets/sounds.js'
import {saveEntity, saveTile, saveTexture, waitForResources, createNewTexturesAndSpriteSheets} from '/src/assets/assets.js'
import {EditorState} from '/src/client/editor-state.js'
import {PainterState} from '/src/client/painter-state.js'
import {GameState} from '/src/client/game-state.js'
import {MainMenuState} from '/src/client/main-menu-state.js'
import * as Wad from '/src/wad/wad.js'

export class Client {
  constructor(canvas, gl) {
    this.width = canvas.width
    this.height = canvas.height
    this.canvas = canvas
    this.gl = gl
    this.keyboard = new Map()
    this.mouseLeft = false
    this.mouseRight = false
    this.mouseX = 0
    this.mouseY = 0
    this.orthographic = new Float32Array(16)
    this.perspective = new Float32Array(16)
    this.rendering = null
    this.bufferGUI = null
    this.bufferColor = null
    this.bufferSky = null
    this.sectorBuffers = new Map()
    this.spriteBuffers = new Map()
    this.music = null
    this.state = null
  }

  keyEvent(code, down) {
    this.keyboard.set(code, down)
    this.state.keyEvent(code, down)
  }

  keyUp(event) {
    this.keyEvent(event.code, false)
  }

  keyDown(event) {
    this.keyEvent(event.code, true)
  }

  mouseUp(event) {
    if (event.button === 0) {
      this.mouseLeft = false
    } else if (event.button === 2) {
      this.mouseRight = false
    }
  }

  mouseDown(event) {
    if (event.button === 0) {
      this.mouseLeft = true
    } else if (event.button === 2) {
      this.mouseRight = true
    }
  }

  mouseMove(event) {
    this.mouseX = event.clientX
    this.mouseY = event.clientY
  }

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
    orthographic(this.orthographic, 0.0, width, 0.0, height, 0.0, 1.0)
    let fov = 60.0
    let ratio = width / height
    let near = 0.01
    let far = 200.0
    perspective(this.perspective, fov, near, far, ratio)
    this.state.resize(width, height)
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

    for (const entity of contents.get('entities')) {
      saveEntity(entity, directory, '/entities/' + entity + '.wad')
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0)
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
      textures.push(
        fetchImage(directory + '/textures/' + name + '.png').then((image) => {
          return {name: name, wrap: wrap, image: image}
        })
      )
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
      saveTexture(texture.name, createTexture(gl, texture.image, gl.NEAREST, wrap))
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

    rendering.insertProgram(0, compileProgram(gl, color2d))
    rendering.insertProgram(1, compileProgram(gl, texture2d))
    rendering.insertProgram(2, compileProgram(gl, texture3d))

    rendering.makeVAO(this.bufferGUI)
    rendering.makeVAO(this.bufferColor)
    rendering.makeVAO(this.bufferSky)

    rendering.updateVAO(this.bufferSky, gl.STATIC_DRAW)

    switch (main.get('open')) {
      case 'game':
        this.state = new GameState(this)
        break
      case 'editor':
        this.state = new EditorState(this)
        break
      case 'painter':
        this.state = new PainterState(this)
        break
      default:
        this.state = new MainMenuState(this)
    }

    let file = null
    if (main.has('map')) file = '/maps/' + main.get('map') + '.map'

    await this.state.initialize(file)
  }

  update() {
    this.state.update()
  }

  render() {
    this.state.render()
  }
}
