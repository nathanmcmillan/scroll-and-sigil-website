import {Game} from '/src/game/game.js'
import {renderLoadingInProgress} from '/src/client/render-loading.js'
import {renderTouch} from '/src/client/render-touch.js'
import {textureByName, textureByIndex} from '/src/assets/assets.js'
import {drawSprite, drawTextSpecial, FONT_WIDTH, FONT_HEIGHT} from '/src/render/render.js'
import {identity, multiply, rotateX, rotateY, translate} from '/src/math/matrix.js'
import {whitef} from '/src/editor/palette.js'
import {flexText, flexSolve} from '/src/flex/flex.js'
import {Home} from '/src/menu/home.js'

export class HomeState {
  constructor(client) {
    this.client = client
    this.keys = client.keys

    this.game = new Game(this, client.input)
    this.loading = true

    this.view = new Float32Array(16)
    this.projection = new Float32Array(16)

    this.home = new Home(client.width, client.height, client.scale, client.input)
  }

  reset() {
    this.loading = true
    this.home.reset()
  }

  resize(width, height, scale) {
    this.home.resize(width, height, scale)
  }

  keyEvent(code, down) {
    if (this.keys.has(code)) this.home.input.set(this.keys.get(code), down)
  }

  mouseEvent() {}

  mouseMove() {}

  async initialize() {
    await this.load('/pack/' + this.client.pack + '/maps/home.map')
  }

  async load(file) {
    await this.game.load(file)

    const world = this.game.world
    const client = this.client
    const gl = client.gl

    for (const buffer of client.sectorBuffers.values()) buffer.zero()
    for (const sector of world.sectors) client.sectorRender(sector)
    for (const buffer of client.sectorBuffers.values()) client.rendering.updateVAO(buffer, gl.STATIC_DRAW)

    this.loading = false
    this.game.update()
  }

  update(timestamp) {
    if (this.loading) return

    let home = this.home
    home.update(timestamp)
    if (home.yes) {
      let client = this.client
      if (home.row === 0) {
        client.openState('game')
      } else if (home.row === 1) {
        client.openState('game')
      } else if (home.row === 2) {
        client.openState('dashboard')
      } else if (home.row === 3) {
        client.openState('game')
      } else if (home.row === 4) {
        client.openState('game')
      }
    }
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

    const fontScale = Math.floor(1.5 * scale)
    const fontWidth = fontScale * FONT_WIDTH
    const fontHeight = fontScale * FONT_HEIGHT

    if (client.touch) renderTouch(client.touchRender)

    // render world

    const game = this.game
    const world = game.world
    const camera = game.camera

    rendering.setProgram(2)
    rendering.setView(0, client.top, width, height)

    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)

    identity(view)
    rotateX(view, Math.sin(camera.rx), Math.cos(camera.rx))
    rotateY(view, Math.sin(camera.ry), Math.cos(camera.ry))
    translate(view, 0.0, 0.0, 0.0)
    multiply(projection, client.perspective, view)
    rendering.updateUniformMatrix('u_mvp', projection)

    let sky = textureByName('sky-box-1')
    rendering.bindTexture(gl.TEXTURE0, sky.texture)
    rendering.bindAndDraw(client.bufferSky)

    gl.enable(gl.CULL_FACE)
    gl.enable(gl.DEPTH_TEST)

    identity(view)
    rotateX(view, Math.sin(camera.rx), Math.cos(camera.rx))
    rotateY(view, Math.sin(camera.ry), Math.cos(camera.ry))
    translate(view, -camera.x, -camera.y, -camera.z)
    multiply(projection, client.perspective, view)
    rendering.updateUniformMatrix('u_mvp', projection)

    for (const [index, buffer] of client.sectorBuffers) {
      rendering.bindTexture(gl.TEXTURE0, textureByIndex(index).texture)
      rendering.bindAndDraw(buffer)
    }

    let buffers = client.spriteBuffers
    for (const buffer of buffers.values()) {
      buffer.zero()
    }

    let sine = Math.sin(-camera.ry)
    let cosine = Math.cos(-camera.ry)

    let things = world.things
    let t = world.thingCount
    while (t--) {
      let thing = things[t]
      let buffer = client.getSpriteBuffer(thing.texture)
      drawSprite(buffer, thing.x, thing.y, thing.z, thing.sprite, sine, cosine)
    }

    for (const [index, buffer] of buffers) {
      if (buffer.indexPosition === 0) continue
      rendering.bindTexture(gl.TEXTURE0, textureByIndex(index).texture)
      rendering.updateAndDraw(buffer, gl.DYNAMIC_DRAW)
    }

    // end render world

    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)

    identity(view)
    multiply(projection, client.orthographic, view)

    client.bufferGUI.zero()

    let white0 = whitef(0)
    let white1 = whitef(1)
    let white2 = whitef(2)

    // text
    rendering.setProgram(4)
    rendering.setView(0, client.top, width, height)
    rendering.updateUniformMatrix('u_mvp', projection)

    let titleBox = home.titleBox
    drawTextSpecial(client.bufferGUI, titleBox.x, titleBox.y, titleBox.text, 2 * scale, white0, white1, white2)

    let continueGameBox = home.continueGameBox
    drawTextSpecial(client.bufferGUI, continueGameBox.x, continueGameBox.y, continueGameBox.text, fontScale, white0, white1, white2)

    let newGameBox = home.newGameBox
    drawTextSpecial(client.bufferGUI, newGameBox.x, newGameBox.y, newGameBox.text, fontScale, white0, white1, white2)

    let editorBox = home.editorBox
    drawTextSpecial(client.bufferGUI, editorBox.x, editorBox.y, editorBox.text, fontScale, white0, white1, white2)

    let optionsBox = home.optionsBox
    drawTextSpecial(client.bufferGUI, optionsBox.x, optionsBox.y, optionsBox.text, fontScale, white0, white1, white2)

    let creditsBox = home.creditsBox
    drawTextSpecial(client.bufferGUI, creditsBox.x, creditsBox.y, creditsBox.text, fontScale, white0, white1, white2)

    let text = '>'
    let indicatorBox = flexText(text, fontWidth * text.length, fontHeight)
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

    drawTextSpecial(client.bufferGUI, indicatorBox.x, indicatorBox.y, indicatorBox.text, fontScale, white0, white1, white2)

    rendering.bindTexture(gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
    rendering.updateAndDraw(client.bufferGUI)
  }
}
