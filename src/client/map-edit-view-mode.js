import { textureByIndex, textureByName, textureIndexForName } from '../assets/assets.js'
import { renderDialogBox } from '../client/client-util.js'
import { drawFloorCeil, drawWall } from '../client/render-sector.js'
import { renderTouch } from '../client/render-touch.js'
import { tableIter, tableIterHasNext, tableIterNext, tableIterStart } from '../collections/table.js'
import { calcFontScale, defaultFont } from '../editor/editor-util.js'
import { redf } from '../editor/palette.js'
import { identity, multiply, rotateX, rotateY, translate } from '../math/matrix.js'
import { drawSprite, drawTextFontSpecial } from '../render/render.js'
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

function lineRender(client, line) {
  let wall = line.top
  if (wall.valid()) {
    const buffer = client.getSectorBuffer(textureIndexForName(wall.texture))
    drawWall(buffer, wall)
  }
  wall = line.middle
  if (wall.valid()) {
    const buffer = client.getSectorBuffer(textureIndexForName(wall.texture))
    drawWall(buffer, wall)
  }
  wall = line.bottom
  if (wall.valid()) {
    const buffer = client.getSectorBuffer(textureIndexForName(wall.texture))
    drawWall(buffer, wall)
  }
}

function floorCeilRender(client, sector) {
  for (const triangle of sector.triangles) {
    const texture = triangle.texture
    if (texture < 0) continue
    const buffer = client.getSectorBuffer(texture)
    drawFloorCeil(buffer, triangle)
  }
}

export function updateMapEditViewSectorBuffer(state) {
  const maps = state.maps
  const client = state.client
  const gl = client.gl

  const sectorIter = tableIter(client.sectorBuffers)
  while (tableIterHasNext(sectorIter)) bufferZero(tableIterNext(sectorIter).value)

  for (const line of maps.lines) lineRender(client, line)
  for (const sector of maps.sectors) floorCeilRender(client, sector)

  tableIterStart(sectorIter)
  while (tableIterHasNext(sectorIter)) rendererUpdateVAO(client.rendering, tableIterNext(sectorIter).value, gl.STATIC_DRAW)
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

  // render world

  rendererSetProgram(rendering, 'texture3d-rgb')
  rendererSetView(rendering, 0, client.top, width, height)

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

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

  gl.enable(gl.CULL_FACE)
  gl.enable(gl.DEPTH_TEST)

  identity(view)
  rotateX(view, Math.sin(camera.rx), Math.cos(camera.rx))
  rotateY(view, Math.sin(camera.ry), Math.cos(camera.ry))
  translate(view, -camera.x, -camera.y, -camera.z)
  multiply(projection, client.perspective, view)
  rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

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

  const things = maps.things
  let t = things.length
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

  // text

  rendererSetProgram(rendering, 'texture2d-font')
  rendererSetView(rendering, 0, client.top, width, height)

  gl.disable(gl.CULL_FACE)
  gl.disable(gl.DEPTH_TEST)

  identity(view)
  multiply(projection, client.orthographic, view)
  rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

  const font = defaultFont()
  const fontScale = calcFontScale(scale)
  const fontWidth = fontScale * font.width
  const fontHeight = fontScale * font.base

  bufferZero(client.bufferGUI)
  const text = 'x:' + camera.x.toFixed(2) + ' y:' + camera.y.toFixed(2) + ' z:' + camera.z.toFixed(2)
  drawTextFontSpecial(client.bufferGUI, fontWidth, fontHeight, text, fontScale, redf(0), redf(1), redf(2), font)
  rendererBindTexture(rendering, gl.TEXTURE0, textureByName(font.name).texture)
  rendererUpdateAndDraw(rendering, client.bufferGUI)

  // dialog box

  if (maps.dialog !== null) renderDialogBox(state, scale, font, maps.dialog)
}
