import {drawText, drawRectangle, drawLine, drawTriangle, FONT_WIDTH} from '../render/render.js'
import {spr} from '../render/pico.js'
import {identity, multiply} from '../math/matrix.js'
import {textureByName} from '../assets/assets.js'
import {vectorSize, thingSize, SECTOR_TOOL, DESCRIBE_TOOL, DESCRIBE_ACTION, DESCRIBE_OPTIONS, OPTION_END_LINE, OPTION_END_LINE_NEW_VECTOR} from '../editor/maps.js'
import {colorf, blackf, darkpurplef, darkgreyf, yellowf, whitef, greenf, redf} from '../editor/palette.js'
import {renderTouch} from '../client/render-touch.js'
import {calcFontScale, calcTopBarHeight, calcBottomBarHeight} from '../editor/editor-util.js'
import {renderDialogBox} from '../client/client-util.js'

function mapX(x, zoom, camera) {
  return zoom * (x - camera.x)
}

function mapZ(z, zoom, camera) {
  return zoom * (z - camera.z)
}

function drawLineWithNormal(b, x1, y1, x2, y2, thickness, red, green, blue, alpha, zoom, normal) {
  drawLine(b, x1, y1, x2, y2, thickness, red, green, blue, alpha)
  if (!normal) return
  let midX = 0.5 * (x1 + x2)
  let midY = 0.5 * (y1 + y2)
  let normX = -(y1 - y2)
  let normY = x1 - x2
  let magnitude = Math.sqrt(normX * normX + normY * normY)
  normX /= magnitude
  normY /= magnitude
  drawLine(b, midX, midY, midX + normX * zoom, midY + normY * zoom, thickness, red, green, blue, alpha)
}

function mapRender(b, maps) {
  let zoom = maps.zoom
  let camera = maps.camera
  const alpha = 1.0
  const thickness = 1.0
  if (maps.viewSectors && maps.tool === SECTOR_TOOL) {
    let seed = 0
    for (const sector of maps.sectors) {
      for (const triangle of sector.view) {
        let x1 = mapX(triangle.a.x, zoom, camera)
        let y1 = mapZ(triangle.a.y, zoom, camera)
        let x2 = mapX(triangle.b.x, zoom, camera)
        let y2 = mapZ(triangle.b.y, zoom, camera)
        let x3 = mapX(triangle.c.x, zoom, camera)
        let y3 = mapZ(triangle.c.y, zoom, camera)
        seed++
        if (seed == 5) seed++
        else if (seed === 15) seed = 0
        if (sector == maps.selectedSector) drawTriangle(b, x1, y1, x2, y2, x3, y3, blackf(0), blackf(1), blackf(2), alpha)
        else drawTriangle(b, x1, y1, x2, y2, x3, y3, colorf(seed, 0), colorf(seed, 1), colorf(seed, 2), alpha)
      }
    }
  }
  if (maps.viewLines) {
    let normal = maps.viewLineNormals
    for (const line of maps.lines) {
      let x1 = mapX(line.a.x, zoom, camera)
      let y1 = mapZ(line.a.y, zoom, camera)
      let x2 = mapX(line.b.x, zoom, camera)
      let y2 = mapZ(line.b.y, zoom, camera)
      if (line == maps.selectedLine) drawLineWithNormal(b, x1, y1, x2, y2, thickness, greenf(0), greenf(1), greenf(2), alpha, zoom, normal)
      else drawLineWithNormal(b, x1, y1, x2, y2, thickness, whitef(0), whitef(1), whitef(2), alpha, zoom, normal)
    }
  }
  if (maps.viewVecs) {
    const size = vectorSize(zoom)
    for (const vec of maps.vecs) {
      let x = Math.floor(mapX(vec.x, zoom, camera))
      let y = Math.floor(mapZ(vec.y, zoom, camera))
      if (vec === maps.selectedVec || vec === maps.selectedSecondVec) drawRectangle(b, x - size, y - size, 2.0 * size, 2.0 * size, greenf(0), greenf(1), greenf(2), alpha)
      else drawRectangle(b, x - size, y - size, 2.0 * size, 2.0 * size, redf(0), redf(1), redf(2), alpha)
    }
  }
  if (maps.viewThings) {
    for (const thing of maps.things) {
      let x = Math.floor(mapX(thing.x, zoom, camera))
      let y = Math.floor(mapZ(thing.z, zoom, camera))
      let size = thingSize(thing, zoom)
      if (thing == maps.selectedThing) drawRectangle(b, x - size, y - size, 2.0 * size, 2.0 * size, yellowf(0), yellowf(1), yellowf(2), alpha)
      else drawRectangle(b, x - size, y - size, 2.0 * size, 2.0 * size, greenf(0), greenf(1), greenf(2), alpha)
    }
  }
}

export function renderMapEditTopMode(state) {
  const maps = state.maps
  if (!maps.doPaint) return

  const client = state.client
  const gl = client.gl
  const rendering = client.rendering
  const view = state.view
  const projection = state.projection
  const scale = maps.scale
  const width = client.width
  const height = client.height - client.top

  if (client.touch) renderTouch(client.touchRender)

  rendering.setProgram(0)
  rendering.setView(0, client.top, width, height)

  gl.clearColor(darkgreyf(0), darkgreyf(1), darkgreyf(2), 1.0)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  gl.disable(gl.CULL_FACE)
  gl.disable(gl.DEPTH_TEST)

  identity(view)
  multiply(projection, client.orthographic, view)
  rendering.updateUniformMatrix('u_mvp', projection)

  client.bufferColor.zero()

  mapRender(client.bufferColor, maps)

  if (maps.action == OPTION_END_LINE || maps.action == OPTION_END_LINE_NEW_VECTOR) {
    const thickness = 1.0
    const zoom = maps.zoom
    const camera = maps.camera
    const vec = maps.selectedVec
    let x = zoom * (vec.x - camera.x)
    let y = zoom * (vec.y - camera.z)
    drawLineWithNormal(client.bufferColor, x, y, maps.cursor.x, maps.cursor.y, thickness, yellowf(0), yellowf(1), yellowf(2), 1.0, zoom, maps.viewLineNormals)
  }

  // top and bottom bar

  const topBarHeight = calcTopBarHeight(scale)
  drawRectangle(client.bufferColor, 0, height - topBarHeight, width, topBarHeight, redf(0), redf(1), redf(2), 1.0)

  const bottomBarHeight = calcBottomBarHeight(scale)
  drawRectangle(client.bufferColor, 0, 0, width, bottomBarHeight, redf(0), redf(1), redf(2), 1.0)

  rendering.updateAndDraw(client.bufferColor)

  rendering.setProgram(3)
  rendering.setView(0, client.top, width, height)
  rendering.updateUniformMatrix('u_mvp', projection)

  client.bufferGUI.zero()
  const cursor = textureByName('editor-sprites')
  const cursorSize = 8 * scale
  spr(client.bufferGUI, 9, 1.0, 1.0, maps.cursor.x, maps.cursor.y - cursorSize, cursorSize, cursorSize)
  rendering.bindTexture(gl.TEXTURE0, cursor.texture)
  rendering.updateAndDraw(client.bufferGUI)

  rendering.setProgram(4)
  rendering.setView(0, client.top, width, height)
  rendering.updateUniformMatrix('u_mvp', projection)

  client.bufferGUI.zero()

  const fontScale = calcFontScale(scale)
  const fontWidth = fontScale * FONT_WIDTH

  drawText(client.bufferGUI, fontWidth, height - topBarHeight, DESCRIBE_TOOL[maps.tool].toUpperCase(), fontScale, darkpurplef(0), darkpurplef(1), darkpurplef(2), 1.0)

  const options = DESCRIBE_OPTIONS[maps.action]
  if (options) {
    let rightStatusBar = ''
    for (const [button, option] of options) {
      let key = state.keys.reversed(button)
      if (key.startsWith('Key')) key = key.substring(3)
      rightStatusBar += key + '/' + DESCRIBE_ACTION[option] + ' '
    }
    let x = width - rightStatusBar.length * fontWidth
    let y = 0
    drawText(client.bufferGUI, x, y, rightStatusBar, fontScale, darkpurplef(0), darkpurplef(1), darkpurplef(2), 1.0)
  }

  if (maps.selectedVec) {
    let text = 'X:' + maps.selectedVec.x.toFixed(2) + ' Y:' + maps.selectedVec.y.toFixed(2)
    let x = width - (text.length + 1) * fontWidth
    drawText(client.bufferGUI, x, height - topBarHeight, text, fontScale, darkpurplef(0), darkpurplef(1), darkpurplef(2), 1.0)
  } else if (maps.selectedThing) {
    let thing = maps.selectedThing
    let text = thing.entity.get('_wad') + ' X:' + thing.x.toFixed(2) + ' Y:' + thing.y.toFixed(2)
    let x = width - (text.length + 1) * fontWidth
    drawText(client.bufferGUI, x, height - topBarHeight, text, fontScale, darkpurplef(0), darkpurplef(1), darkpurplef(2), 1.0)
  } else if (maps.selectedLine) {
    let line = maps.selectedLine
    let text = 'b:' + line.bottom.offset + ' m:' + line.middle.offset + ' t:' + line.top.offset
    let x = width - (text.length + 1) * fontWidth
    drawText(client.bufferGUI, x, height - topBarHeight, text, fontScale, darkpurplef(0), darkpurplef(1), darkpurplef(2), 1.0)
    text = 'b:' + line.bottom.textureName() + ' m:' + line.middle.textureName() + ' t:' + line.top.textureName()
    drawText(client.bufferGUI, fontWidth, 0, text, fontScale, darkpurplef(0), darkpurplef(1), darkpurplef(2), 1.0)
  } else if (maps.selectedSector) {
    let sector = maps.selectedSector
    let text = 'b:' + sector.bottom + ' f:' + sector.floor + ' c:' + sector.ceiling + ' t:' + sector.top
    let x = width - (text.length + 1) * fontWidth
    drawText(client.bufferGUI, x, height - topBarHeight, text, fontScale, darkpurplef(0), darkpurplef(1), darkpurplef(2), 1.0)
    text = 'f:' + sector.floorTextureName() + ' t:' + sector.ceilingTextureName()
    drawText(client.bufferGUI, fontWidth, 0, text, fontScale, darkpurplef(0), darkpurplef(1), darkpurplef(2), 1.0)
  }

  rendering.bindTexture(gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
  rendering.updateAndDraw(client.bufferGUI)

  // dialog box

  if (maps.dialog != null) renderDialogBox(state, scale, maps.dialog)
}
