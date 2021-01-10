import {Game} from '/src/game/game.js'
import {drawDecal} from '/src/client/render-sector.js'
import {renderLoadingInProgress} from '/src/client/render-loading.js'
import {drawRectangle, drawSprite, drawText, FONT_WIDTH, FONT_HEIGHT} from '/src/render/render.js'
import {identity, multiply, rotateX, rotateY, translate, multiplyVector3} from '/src/math/matrix.js'
import {textureByName, textureByIndex} from '/src/assets/assets.js'

function drawTextSpecial(b, x, y, text, scale, red, green, blue) {
  drawText(b, x + scale, y - scale, text, scale, 0.0, 0.0, 0.0, 1.0)
  drawText(b, x, y, text, scale, red, green, blue, 1.0)
}

export class GameState {
  constructor(client) {
    this.client = client
    this.keys = client.keys

    this.game = new Game(this)
    this.events = []
    this.loading = true

    this.view = new Float32Array(16)
    this.projection = new Float32Array(16)
  }

  resize() {}

  keyEvent(code, down) {
    if (this.keys.has(code)) {
      this.game.input.set(this.keys.get(code), down)
    }
  }

  mouseEvent() {}

  mouseMove() {}

  async initialize(file) {
    await this.load(file)
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
  }

  handle(event) {
    let trigger = event[0]
    let params = event[1]
    switch (trigger) {
      case 'hero-goto-map':
        this.loading = true
        this.load('/maps/' + params + '.map')
        return
    }
  }

  update() {
    if (this.loading) return
    this.game.update()
    for (const event of this.events) this.handle(event)
    this.events.length = 0
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
    const scale = game.scale
    const width = client.width
    const height = client.height - client.top
    const world = game.world
    const camera = game.camera

    const fontWidth = scale * FONT_WIDTH
    const fontHeight = scale * FONT_HEIGHT

    const pad = 10.0

    rendering.setProgram(2)
    rendering.setView(0, client.top, width, height)

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

    let projection3d = projection.slice()

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

    let missiles = world.missiles
    let m = world.missileCount
    while (m--) {
      let missile = missiles[m]
      let buffer = client.getSpriteBuffer(missile.texture)
      drawSprite(buffer, missile.x, missile.y, missile.z, missile.sprite, sine, cosine)
    }

    let particles = world.particles
    let p = world.particleCount
    while (p--) {
      let particle = particles[p]
      let buffer = client.getSpriteBuffer(particle.texture)
      drawSprite(buffer, particle.x, particle.y, particle.z, particle.sprite, sine, cosine)
    }

    for (const [index, buffer] of buffers) {
      if (buffer.indexPosition === 0) continue
      rendering.bindTexture(gl.TEXTURE0, textureByIndex(index).texture)
      rendering.updateAndDraw(buffer, gl.DYNAMIC_DRAW)
    }

    let decals = world.decals
    let d = decals.length
    if (d > 0) {
      for (const buffer of buffers.values()) {
        buffer.zero()
      }

      gl.depthMask(false)
      gl.enable(gl.POLYGON_OFFSET_FILL)
      gl.polygonOffset(-1, -1)

      while (d--) {
        let decal = decals[d]
        let buffer = client.getSpriteBuffer(decal.texture)
        drawDecal(buffer, decal)
      }

      for (const [index, buffer] of buffers) {
        if (buffer.indexPosition === 0) continue
        rendering.bindTexture(gl.TEXTURE0, textureByIndex(index).texture)
        rendering.updateAndDraw(buffer, gl.DYNAMIC_DRAW)
      }

      gl.depthMask(true)
      gl.disable(gl.POLYGON_OFFSET_FILL)
    }

    rendering.setProgram(1)
    rendering.setView(0, client.top, width, height)

    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)

    identity(view)
    multiply(projection, client.orthographic, view)
    rendering.updateUniformMatrix('u_mvp', projection)

    client.bufferGUI.zero()

    const hero = game.hero

    if (game.cinema) {
      const black = 60.0
      rendering.setProgram(0)
      rendering.setView(0, client.top, width, height)
      rendering.updateUniformMatrix('u_mvp', projection)
      client.bufferColor.zero()
      drawRectangle(client.bufferColor, 0.0, 0.0, width, black, 0.0, 0.0, 0.0, 1.0)
      drawRectangle(client.bufferColor, 0.0, height - black, width, black, 0.0, 0.0, 0.0, 1.0)
      rendering.updateAndDraw(client.bufferColor)
    } else if (hero.menu) {
      let menu = hero.menu
      let page = menu.page
      if (page === 'inventory') {
        let x = Math.floor(0.5 * width)
        let text = 'Outfit'
        drawTextSpecial(client.bufferGUI, x, height - pad - fontHeight, text, scale, 1.0, 0.0, 0.0)
        if (hero.outfit) {
          text = hero.outfit.name
          drawTextSpecial(client.bufferGUI, x, height - pad - 2.0 * fontHeight, text, scale, 1.0, 0.0, 0.0)
        } else {
          drawTextSpecial(client.bufferGUI, x, height - pad - 2.0 * fontHeight, 'None', scale, 1.0, 0.0, 0.0)
        }
        x += (text.length + 1) * fontWidth
        text = 'Headpiece'
        drawTextSpecial(client.bufferGUI, x, height - pad - fontHeight, text, scale, 1.0, 0.0, 0.0)
        if (hero.headpiece) {
          text = hero.headpiece.name
          drawTextSpecial(client.bufferGUI, x, height - pad - 2.0 * fontHeight, text, scale, 1.0, 0.0, 0.0)
        } else {
          drawTextSpecial(client.bufferGUI, x, height - pad - 2.0 * fontHeight, 'None', scale, 1.0, 0.0, 0.0)
        }
        x += (text.length + 1) * fontWidth
        text = 'Weapon'
        if (hero.weapon) {
          text = hero.weapon.name
          drawTextSpecial(client.bufferGUI, x, height - pad - 2.0 * fontHeight, text, scale, 1.0, 0.0, 0.0)
        } else {
          drawTextSpecial(client.bufferGUI, x, height - pad - 2.0 * fontHeight, 'None', scale, 1.0, 0.0, 0.0)
        }
        drawTextSpecial(client.bufferGUI, x, height - pad - fontHeight, text, scale, 1.0, 0.0, 0.0)
        let y = height - pad - fontHeight
        drawTextSpecial(client.bufferGUI, pad, y, 'Inventory', scale, 1.0, 0.0, 0.0)
        let index = 0
        for (const item of hero.inventory) {
          y -= fontHeight
          if (index === hero.menuRow) drawTextSpecial(client.bufferGUI, pad, y, item.name, scale, 1.0, 1.0, 0.0)
          else drawTextSpecial(client.bufferGUI, pad, y, item.name, scale, 1.0, 0.0, 0.0)
          index++
        }
        rendering.bindTexture(gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
        rendering.updateAndDraw(client.bufferGUI)
      }
    } else {
      if (hero.interaction) {
        let interaction = hero.interaction
        let interactionWith = hero.interactionWith
        drawTextSpecial(client.bufferGUI, pad, height - pad - fontHeight, interactionWith.name, scale, 1.0, 0.0, 0.0)
        let y = Math.floor(0.5 * height)
        for (const option of interaction.keys()) {
          drawTextSpecial(client.bufferGUI, pad, y, option, scale, 1.0, 0.0, 0.0)
          y += fontHeight
        }
      } else {
        if (hero.nearby) {
          let thing = hero.nearby
          let text = thing.isItem ? 'COLLECT' : 'SPEAK'
          let vec = [thing.x, thing.y + thing.height, thing.z]
          let position = []
          multiplyVector3(position, projection3d, vec)
          position[0] /= position[2]
          position[1] /= position[2]
          position[0] = 0.5 * ((position[0] + 1.0) * width)
          position[1] = 0.5 * ((position[1] + 1.0) * height)
          position[0] = Math.floor(position[0])
          position[1] = Math.floor(position[1])
          drawTextSpecial(client.bufferGUI, position[0], position[1], text, scale, 1.0, 0.0, 0.0)
        }
        if (hero.combat) {
          let text = ''
          for (let i = 0; i < hero.health; i++) text += 'x'
          let x = pad
          let y = pad
          drawTextSpecial(client.bufferGUI, x, y, text, scale, 1.0, 0.0, 0.0)
          text = ''
          y += fontHeight
          for (let i = 0; i < hero.stamina; i++) text += 'x'
          drawTextSpecial(client.bufferGUI, x, y, text, scale, 0.0, 1.0, 0.0)
        }
      }
      if (client.bufferGUI.indexPosition > 0) {
        rendering.bindTexture(gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
        rendering.updateAndDraw(client.bufferGUI)
      }
    }
  }

  notify(trigger, params) {
    switch (trigger) {
      case 'goto-map':
        this.events.push([trigger, params])
        return
      case 'death-menu':
        return
    }
  }
}
