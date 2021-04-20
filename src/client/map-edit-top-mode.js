/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { textureByName } from '../assets/assets.js'
import { renderDialogBox, renderStatus, renderTextBox } from '../client/client-util.js'
import { renderTouch } from '../client/render-touch.js'
import { calcBottomBarHeight, calcFontScale, calcTopBarHeight, defaultFont } from '../editor/editor-util.js'
import { OPTION_END_LINE, OPTION_END_LINE_NEW_VECTOR, SECTOR_TOOL, thingSize, vectorSize } from '../editor/maps.js'
import { blackf, greenf, redf, slatef, white0f, white1f, white2f, whitef, winef, yellowf } from '../editor/palette.js'
import { identity, multiply } from '../math/matrix.js'
import { spr } from '../render/pico.js'
import { drawLine, drawRectangle, drawTextFontSpecial, drawTriangle } from '../render/render.js'
import { bufferZero } from '../webgl/buffer.js'
import { rendererBindTexture, rendererSetProgram, rendererSetView, rendererUpdateAndDraw, rendererUpdateUniformMatrix } from '../webgl/renderer.js'

function mapX(x, zoom, camera) {
  return zoom * (x - camera.x)
}

function mapZ(z, zoom, camera) {
  return zoom * (z - camera.z)
}

function drawLineWithNormal(b, x1, y1, x2, y2, thickness, red, green, blue, alpha, zoom, normal) {
  drawLine(b, x1, y1, x2, y2, thickness, red, green, blue, alpha)
  if (!normal) return
  const centerX = 0.5 * (x1 + x2)
  const centerY = 0.5 * (y1 + y2)
  let normalX = -(y1 - y2)
  let normalY = x1 - x2
  const magnitude = Math.sqrt(normalX * normalX + normalY * normalY)
  normalX /= magnitude
  normalY /= magnitude
  zoom *= 0.5
  drawLine(b, centerX, centerY, centerX + normalX * zoom, centerY + normalY * zoom, thickness, red, green, blue, alpha)
}

function mapRender(b, maps) {
  const zoom = maps.zoom
  const camera = maps.camera
  const alpha = 1.0
  const thickness = 1.0
  if (maps.viewSectors && maps.tool === SECTOR_TOOL) {
    // let seed = 0
    for (const sector of maps.sectors) {
      for (const triangle of sector.view) {
        const x1 = mapX(triangle.a.x, zoom, camera)
        const y1 = mapZ(triangle.a.y, zoom, camera)
        const x2 = mapX(triangle.b.x, zoom, camera)
        const y2 = mapZ(triangle.b.y, zoom, camera)
        const x3 = mapX(triangle.c.x, zoom, camera)
        const y3 = mapZ(triangle.c.y, zoom, camera)
        // seed++
        // if (seed === 15) seed = 0
        // while (seed === 0 || seed === 1 || seed === 4 || seed === 5 || seed === 6 || seed === 7) {
        //   seed++
        //   if (seed === 15) seed = 0
        // }
        if (sector === maps.selectedSector) drawTriangle(b, x1, y1, x2, y2, x3, y3, winef(0), winef(1), winef(2), alpha)
        else drawTriangle(b, x1, y1, x2, y2, x3, y3, blackf(0), blackf(1), blackf(2), alpha)
        // else drawTriangle(b, x1, y1, x2, y2, x3, y3, colorf(seed, 0), colorf(seed, 1), colorf(seed, 2), alpha)
      }
    }
  }
  if (maps.viewLines) {
    const normal = maps.viewLineNormals
    for (const line of maps.lines) {
      const x1 = mapX(line.a.x, zoom, camera)
      const y1 = mapZ(line.a.y, zoom, camera)
      const x2 = mapX(line.b.x, zoom, camera)
      const y2 = mapZ(line.b.y, zoom, camera)
      if (line === maps.selectedLine) drawLineWithNormal(b, x1, y1, x2, y2, thickness, greenf(0), greenf(1), greenf(2), alpha, zoom, normal)
      else drawLineWithNormal(b, x1, y1, x2, y2, thickness, whitef(0), whitef(1), whitef(2), alpha, zoom, normal)
    }
  }
  if (maps.viewVecs) {
    const size = vectorSize(zoom)
    for (const vec of maps.vecs) {
      const x = Math.floor(mapX(vec.x, zoom, camera))
      const y = Math.floor(mapZ(vec.y, zoom, camera))
      if (vec === maps.selectedVec || vec === maps.selectedSecondVec) drawRectangle(b, x - size, y - size, 2.0 * size, 2.0 * size, greenf(0), greenf(1), greenf(2), alpha)
      else drawRectangle(b, x - size, y - size, 2.0 * size, 2.0 * size, redf(0), redf(1), redf(2), alpha)
    }
  }
  if (maps.viewThings) {
    for (const thing of maps.things) {
      const x = Math.floor(mapX(thing.x, zoom, camera))
      const y = Math.floor(mapZ(thing.z, zoom, camera))
      const size = thingSize(thing, zoom)
      if (thing === maps.selectedThing) drawRectangle(b, x - size, y - size, 2.0 * size, 2.0 * size, yellowf(0), yellowf(1), yellowf(2), alpha)
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

  rendererSetProgram(rendering, 'color2d')
  rendererSetView(rendering, 0, client.top, width, height)

  gl.clearColor(slatef(0), slatef(1), slatef(2), 1.0)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  gl.disable(gl.CULL_FACE)
  gl.disable(gl.DEPTH_TEST)

  identity(view)
  multiply(projection, client.orthographic, view)
  rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

  bufferZero(client.bufferColor)

  mapRender(client.bufferColor, maps)

  if (maps.action === OPTION_END_LINE || maps.action === OPTION_END_LINE_NEW_VECTOR) {
    const thickness = 1.0
    const zoom = maps.zoom
    const camera = maps.camera
    const vec = maps.selectedVec
    const x = zoom * (vec.x - camera.x)
    const y = zoom * (vec.y - camera.z)
    drawLineWithNormal(client.bufferColor, x, y, maps.cursor.x, maps.cursor.y, thickness, yellowf(0), yellowf(1), yellowf(2), 1.0, zoom, maps.viewLineNormals)
  }

  // top and bottom bar

  const topBarHeight = calcTopBarHeight(scale)
  drawRectangle(client.bufferColor, 0, height - topBarHeight, width, topBarHeight, redf(0), redf(1), redf(2), 1.0)

  const bottomBarHeight = calcBottomBarHeight(scale)
  drawRectangle(client.bufferColor, 0, 0, width, bottomBarHeight, redf(0), redf(1), redf(2), 1.0)

  rendererUpdateAndDraw(rendering, client.bufferColor)

  rendererSetProgram(rendering, 'texture2d-font')
  rendererSetView(rendering, 0, client.top, width, height)
  rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

  bufferZero(client.bufferGUI)

  const font = defaultFont()
  const fontScale = calcFontScale(scale)
  const fontWidth = fontScale * font.width

  //  status text

  renderStatus(client, width, height, font, fontWidth, fontScale, topBarHeight, maps)

  rendererBindTexture(rendering, gl.TEXTURE0, textureByName(font.name).texture)
  rendererUpdateAndDraw(rendering, client.bufferGUI)

  // dialog box, text box, or cursor

  if (maps.dialog !== null) {
    renderDialogBox(state, scale, font, maps.dialog)
  } else if (maps.activeTextBox) {
    const box = maps.textBox
    renderTextBox(state, scale, font, box, 200, 200)

    bufferZero(client.bufferGUI)
    drawTextFontSpecial(client.bufferGUI, 200, 500, box.text, fontScale, white0f, white1f, white2f, font)
    rendererUpdateAndDraw(rendering, client.bufferGUI)
  } else {
    rendererSetProgram(rendering, 'texture2d-rgb')
    rendererSetView(rendering, 0, client.top, width, height)
    rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

    bufferZero(client.bufferGUI)
    const cursor = textureByName('editor-sprites')
    const cursorSize = 8 * scale
    spr(client.bufferGUI, 9, 1.0, 1.0, maps.cursor.x, maps.cursor.y - cursorSize, cursorSize, cursorSize)
    rendererBindTexture(rendering, gl.TEXTURE0, cursor.texture)
    rendererUpdateAndDraw(rendering, client.bufferGUI)
  }
}
