import {drawSprite, drawTextSpecial, FONT_WIDTH, FONT_HEIGHT} from '../render/render.js'
import {identity, multiply, rotateX, rotateY, translate} from '../math/matrix.js'
import {textureByName, textureByIndex} from '../assets/assets.js'
import {drawWall, drawFloorCeil} from '../client/render-sector.js'
import {renderTouch} from '../client/render-touch.js'
import {redf} from '../editor/palette.js'
import {renderDialogBox} from '../client/client-util.js'

function lineRender(client, line) {
  let wall = line.top
  if (wall.inUse()) {
    let buffer = client.getSectorBuffer(wall.texture)
    drawWall(buffer, wall)
  }
  wall = line.middle
  if (wall.inUse()) {
    let buffer = client.getSectorBuffer(wall.texture)
    drawWall(buffer, wall)
  }
  wall = line.bottom
  if (wall.inUse()) {
    let buffer = client.getSectorBuffer(wall.texture)
    drawWall(buffer, wall)
  }
}

function floorCeilRender(client, sector) {
  for (const triangle of sector.triangles) {
    let texture = triangle.texture
    if (texture < 0) continue
    let buffer = client.getSectorBuffer(texture)
    drawFloorCeil(buffer, triangle)
  }
}

export function updateMapEditViewSectorBuffer(state) {
  const maps = state.maps
  const client = state.client
  const gl = client.gl

  for (const buffer of client.sectorBuffers.values()) buffer.zero()
  for (const line of maps.lines) lineRender(client, line)
  for (const sector of maps.sectors) floorCeilRender(client, sector)
  for (const buffer of client.sectorBuffers.values()) client.rendering.updateVAO(buffer, gl.STATIC_DRAW)
}

export function renderMapEditViewMode(state) {
  const maps = state.maps
  const client = state.client
  const gl = client.gl
  const rendering = client.rendering
  const camera = maps.camera
  const view = state.view
  const projection = state.projection
  const scale = maps.scale
  const width = client.width
  const height = client.height - client.top

  if (client.touch) renderTouch(client.touchRender)

  // sky box

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

  // render world

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

  let things = maps.things
  let t = things.length
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

  // text

  rendering.setProgram(4)
  rendering.setView(0, client.top, width, height)

  gl.disable(gl.CULL_FACE)
  gl.disable(gl.DEPTH_TEST)

  identity(view)
  multiply(projection, client.orthographic, view)
  rendering.updateUniformMatrix('u_mvp', projection)

  const fontScale = scale
  const fontWidth = fontScale * FONT_WIDTH
  const fontHeight = fontScale * FONT_HEIGHT

  client.bufferGUI.zero()
  let text = 'x:' + camera.x.toFixed(2) + ' y:' + camera.y.toFixed(2) + ' z:' + camera.z.toFixed(2)
  drawTextSpecial(client.bufferGUI, fontWidth, fontHeight, text, fontScale, redf(0), redf(1), redf(2))
  rendering.bindTexture(gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
  rendering.updateAndDraw(client.bufferGUI)

  // dialog box

  if (maps.dialog != null) renderDialogBox(state, scale, maps.dialog)
}
