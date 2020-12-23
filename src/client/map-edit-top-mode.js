import {drawText, drawImage, drawRectangle, drawLine, drawTriangle, FONT_WIDTH, FONT_HEIGHT} from '/src/render/render.js'
import {identity, multiply} from '/src/math/matrix.js'
import {textureByName} from '/src/assets/assets.js'
import {vectorSize, thingSize, DESCRIBE_MENU, DESCRIBE_TOOL, DESCRIBE_ACTION, DESCRIBE_OPTIONS, OPTION_END_LINE, OPTION_END_LINE_NEW_VECTOR} from '/src/editor/maps.js'
import {blackf, yellowf, whitef, greenf, redf} from '/src/editor/palette.js'

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

function mapRender(b, editor) {
  let zoom = editor.zoom
  let camera = editor.camera
  const alpha = 1.0
  const thickness = 1.0
  if (editor.viewSectors) {
    debug_seed = 1
    for (const sector of editor.sectors) {
      for (const triangle of sector.view) {
        let x1 = mapX(triangle.a.x, zoom, camera)
        let y1 = mapZ(triangle.a.y, zoom, camera)
        let x2 = mapX(triangle.b.x, zoom, camera)
        let y2 = mapZ(triangle.b.y, zoom, camera)
        let x3 = mapX(triangle.c.x, zoom, camera)
        let y3 = mapZ(triangle.c.y, zoom, camera)
        if (sector == editor.selectedSector) drawTriangle(b, x1, y1, x2, y2, x3, y3, 0.5, 0.5, 0.5, alpha)
        else {
          let color = 0.2 + debug_random() * 0.25
          drawTriangle(b, x1, y1, x2, y2, x3, y3, color, color, color, alpha)
        }
      }
    }
  }
  if (editor.viewLines) {
    let normal = editor.viewLineNormals
    for (const line of editor.lines) {
      let x1 = mapX(line.a.x, zoom, camera)
      let y1 = mapZ(line.a.y, zoom, camera)
      let x2 = mapX(line.b.x, zoom, camera)
      let y2 = mapZ(line.b.y, zoom, camera)
      if (line == editor.selectedLine) drawLineWithNormal(b, x1, y1, x2, y2, thickness, greenf(0), greenf(1), greenf(2), alpha, zoom, normal)
      else drawLineWithNormal(b, x1, y1, x2, y2, thickness, whitef(0), whitef(1), whitef(2), alpha, zoom, normal)
    }
  }
  if (editor.viewVecs) {
    const size = vectorSize(zoom)
    for (const vec of editor.vecs) {
      let x = Math.floor(mapX(vec.x, zoom, camera))
      let y = Math.floor(mapZ(vec.y, zoom, camera))
      if (vec === editor.selectedVec || vec === editor.selectedSecondVec) drawRectangle(b, x - size, y - size, 2.0 * size, 2.0 * size, greenf(0), greenf(1), greenf(2), alpha)
      else drawRectangle(b, x - size, y - size, 2.0 * size, 2.0 * size, redf(0), redf(1), redf(2), alpha)
    }
  }
  if (editor.viewThings) {
    for (const thing of editor.things) {
      let x = Math.floor(mapX(thing.x, zoom, camera))
      let y = Math.floor(mapZ(thing.z, zoom, camera))
      let size = thingSize(thing, zoom)
      if (thing == editor.selectedThing) drawRectangle(b, x - size, y - size, 2.0 * size, 2.0 * size, yellowf(0), yellowf(1), yellowf(2), alpha)
      else drawRectangle(b, x - size, y - size, 2.0 * size, 2.0 * size, greenf(0), greenf(1), greenf(2), alpha)
    }
  }
}

function drawTextSpecial(b, x, y, text, scale, red, green, blue) {
  drawText(b, x + scale, y - scale, text, scale, 0.0, 0.0, 0.0, 1.0)
  drawText(b, x, y, text, scale, red, green, blue, 1.0)
}

export function renderMapEditTopMode(state) {
  const editor = state.editor
  if (!editor.doPaint) return

  const client = state.client
  const gl = client.gl
  const rendering = client.rendering
  const view = state.view
  const projection = state.projection

  gl.clearColor(blackf(0), blackf(1), blackf(2), 1.0)

  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.clear(gl.DEPTH_BUFFER_BIT)

  gl.disable(gl.CULL_FACE)
  gl.disable(gl.DEPTH_TEST)

  identity(view)
  multiply(projection, client.orthographic, view)

  rendering.setProgram(0)
  rendering.setView(0, 0, client.width, client.height)
  rendering.updateUniformMatrix('u_mvp', projection)

  client.bufferColor.zero()

  mapRender(client.bufferColor, editor)

  if (editor.action == OPTION_END_LINE || editor.action == OPTION_END_LINE_NEW_VECTOR) {
    const thickness = 1.0
    const zoom = editor.zoom
    const camera = editor.camera
    const vec = editor.selectedVec
    let x = zoom * (vec.x - camera.x)
    let y = zoom * (vec.y - camera.z)
    drawLineWithNormal(client.bufferColor, x, y, editor.cursor.x, editor.cursor.y, thickness, yellowf(0), yellowf(1), yellowf(2), 1.0, zoom, editor.viewLineNormals)
  }

  rendering.updateAndDraw(client.bufferColor)

  rendering.setProgram(1)
  rendering.setView(0, 0, client.width, client.height)
  rendering.updateUniformMatrix('u_mvp', projection)

  client.bufferGUI.zero()
  let cursor = textureByName('cursor')
  drawImage(client.bufferGUI, editor.cursor.x - 0.5 * cursor.width, editor.cursor.y - cursor.height, cursor.width, cursor.height, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0)
  rendering.bindTexture(gl.TEXTURE0, cursor.texture)
  rendering.updateAndDraw(client.bufferGUI)

  client.bufferGUI.zero()

  if (editor.toolSelectionActive) {
    let x = 10.0
    let y = client.height - 10.0 - 2.0 * FONT_HEIGHT
    for (let i = 0; i < DESCRIBE_TOOL.length; i++) {
      const option = DESCRIBE_TOOL[i]
      if (i == editor.tool) drawTextSpecial(client.bufferGUI, x, y, option, 2.0, yellowf(0), yellowf(1), yellowf(2))
      else drawTextSpecial(client.bufferGUI, x, y, option, 2.0, redf(0), redf(1), redf(2))
      y -= 2.5 * FONT_HEIGHT
    }
  }

  if (editor.menuActive) {
    let x = 10.0
    let y = client.height - 10.0 - 2.0 * FONT_HEIGHT
    for (const option of DESCRIBE_MENU) {
      drawTextSpecial(client.bufferGUI, x, y, option, 2.0, whitef(0), whitef(1), whitef(2))
      y -= 2.5 * FONT_HEIGHT
    }
  }

  const options = DESCRIBE_OPTIONS[editor.action]
  let x = 10.0
  for (const [button, option] of options) {
    let key = state.keys.reversed(button)
    if (key.startsWith('Key')) key = key.substring(3)
    let text = '(' + key + ') ' + DESCRIBE_ACTION[option]
    drawTextSpecial(client.bufferGUI, x, 10.0, text, 2.0, redf(0), redf(1), redf(2))
    x += 2.0 * FONT_WIDTH * (text.length + 1)
  }

  if (editor.selectedVec) {
    let x = 10.0
    let y = editor.height - 2.0 * FONT_HEIGHT - 10.0
    let text = 'X:' + editor.selectedVec.x + ' Y:' + editor.selectedVec.y
    drawTextSpecial(client.bufferGUI, x, y, text, 2.0, redf(0), redf(1), redf(2))
  }

  rendering.bindTexture(gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
  rendering.updateAndDraw(client.bufferGUI)
}
