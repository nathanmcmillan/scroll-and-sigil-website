import {drawText, drawImage, drawRectangle, drawLine, drawTriangle, FONT_WIDTH, FONT_HEIGHT} from '/src/render/render.js'
import {identity, multiply} from '/src/math/matrix.js'
import {textureByName} from '/src/assets/assets.js'
import {vectorSize, thingSize, DESCRIBE_MENU, DESCRIBE_TOOL, DESCRIBE_ACTION, DESCRIBE_OPTIONS, OPTION_END_LINE, OPTION_END_LINE_NEW_VECTOR} from '/src/editor/maps.js'
import {darkgreyf, yellowf, whitef, greenf, redf} from '/src/editor/palette.js'
import * as In from '/src/input/input.js'

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

var debug_seed = 1
function debug_random() {
  var x = Math.sin(debug_seed++) * 10000
  return x - Math.floor(x)
}

function mapRender(b, maps) {
  let zoom = maps.zoom
  let camera = maps.camera
  const alpha = 1.0
  const thickness = 1.0
  if (maps.viewSectors) {
    debug_seed = 1
    for (const sector of maps.sectors) {
      for (const triangle of sector.view) {
        let x1 = mapX(triangle.a.x, zoom, camera)
        let y1 = mapZ(triangle.a.y, zoom, camera)
        let x2 = mapX(triangle.b.x, zoom, camera)
        let y2 = mapZ(triangle.b.y, zoom, camera)
        let x3 = mapX(triangle.c.x, zoom, camera)
        let y3 = mapZ(triangle.c.y, zoom, camera)
        if (sector == maps.selectedSector) drawTriangle(b, x1, y1, x2, y2, x3, y3, 0.5, 0.5, 0.5, alpha)
        else {
          let color = 0.2 + debug_random() * 0.25
          drawTriangle(b, x1, y1, x2, y2, x3, y3, color, color, color, alpha)
        }
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

function drawTextSpecial(b, x, y, text, scale, red, green, blue) {
  drawText(b, x + scale, y - scale, text, scale, 0.0, 0.0, 0.0, 1.0)
  drawText(b, x, y, text, scale, red, green, blue, 1.0)
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
  const height = client.height

  gl.clearColor(darkgreyf(0), darkgreyf(1), darkgreyf(2), 1.0)

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  gl.disable(gl.CULL_FACE)
  gl.disable(gl.DEPTH_TEST)

  identity(view)
  multiply(projection, client.orthographic, view)

  rendering.setProgram(0)
  rendering.setView(0, 0, client.width, client.height)
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

  rendering.updateAndDraw(client.bufferColor)

  rendering.setProgram(1)
  rendering.setView(0, 0, client.width, client.height)
  rendering.updateUniformMatrix('u_mvp', projection)

  client.bufferGUI.zero()
  let cursor = textureByName('cursor')
  drawImage(client.bufferGUI, maps.cursor.x - 0.5 * cursor.width, maps.cursor.y - cursor.height, cursor.width, cursor.height, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0)
  rendering.bindTexture(gl.TEXTURE0, cursor.texture)
  rendering.updateAndDraw(client.bufferGUI)

  rendering.setProgram(4)
  rendering.setView(0, 0, client.width, client.height)
  rendering.updateUniformMatrix('u_mvp', projection)

  client.bufferGUI.zero()

  const fontScale = Math.floor(1.5 * scale)
  const fontWidth = fontScale * FONT_WIDTH
  const fontHeight = fontScale * FONT_HEIGHT

  if (maps.toolSelectionActive) {
    let x = 10.0
    let y = client.height - 10.0 - 2.0 * FONT_HEIGHT
    for (let i = 0; i < DESCRIBE_TOOL.length; i++) {
      const option = DESCRIBE_TOOL[i]
      if (i == maps.tool) drawTextSpecial(client.bufferGUI, x, y, option, 2.0, yellowf(0), yellowf(1), yellowf(2))
      else drawTextSpecial(client.bufferGUI, x, y, option, 2.0, redf(0), redf(1), redf(2))
      y -= 2.5 * FONT_HEIGHT
    }
  }

  if (maps.menuActive) {
    let x = 10.0
    let y = client.height - 10.0 - 2.0 * FONT_HEIGHT
    for (const option of DESCRIBE_MENU) {
      drawTextSpecial(client.bufferGUI, x, y, option, 2.0, whitef(0), whitef(1), whitef(2))
      y -= 2.5 * FONT_HEIGHT
    }
  }

  const options = DESCRIBE_OPTIONS[maps.action]
  let x = 10.0
  for (const [button, option] of options) {
    let key = state.keys.reversed(button)
    if (key.startsWith('Key')) key = key.substring(3)
    let text = '(' + key + ')' + DESCRIBE_ACTION[option]
    drawTextSpecial(client.bufferGUI, x, 10.0, text, fontScale, redf(0), redf(1), redf(2))
    x += fontWidth * (text.length + 1)
  }

  if (maps.selectedVec) {
    let text = 'X:' + maps.selectedVec.x + ' Y:' + maps.selectedVec.y
    let x = width - text.length * fontWidth - 10
    let y = height - fontHeight - 10
    drawTextSpecial(client.bufferGUI, x, y, text, fontScale, redf(0), redf(1), redf(2))
  }

  // keys
  let startKey = state.keys.reversed(In.BUTTON_START)
  if (startKey.startsWith('Key')) startKey = startKey.substring(3)

  let selectKey = state.keys.reversed(In.BUTTON_SELECT)
  if (selectKey.startsWith('Key')) selectKey = selectKey.substring(3)

  let buttonA = state.keys.reversed(In.BUTTON_A)
  if (buttonA.startsWith('Key')) buttonA = buttonA.substring(3)

  let buttonB = state.keys.reversed(In.BUTTON_B)
  if (buttonB.startsWith('Key')) buttonB = buttonB.substring(3)

  let buttonX = state.keys.reversed(In.BUTTON_X)
  if (buttonX.startsWith('Key')) buttonX = buttonX.substring(3)

  let buttonY = state.keys.reversed(In.BUTTON_Y)
  if (buttonY.startsWith('Key')) buttonY = buttonY.substring(3)

  let infoText = '(' + buttonY + ')Options '
  infoText += '(' + selectKey + ')Edit track  '
  infoText += '(' + startKey + ')Menu '
  drawTextSpecial(client.bufferGUI, 10, height - fontHeight - 10, infoText, fontScale, whitef(0), whitef(1), whitef(2))

  rendering.bindTexture(gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
  rendering.updateAndDraw(client.bufferGUI)
}
