/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Client } from './client/client.js'
import { usingKeyboardMouse, usingPlayStation } from './io/input.js'

function newCanvas(width, height) {
  const canvas = document.getElementById('canvas')
  canvas.style.display = 'block'
  canvas.style.position = 'absolute'
  canvas.style.left = '0'
  canvas.style.right = '0'
  canvas.style.top = '0'
  canvas.style.bottom = '0'
  canvas.style.margin = 'auto'
  canvas.width = width
  canvas.height = height
  if ('ontouchstart' in window) canvas.requestFullscreen()
  return canvas
}

const PERFORMANCE = false
let perf_low = Number.MAX_VALUE
let perf_high = -Number.MAX_VALUE
let perf_tick = 0
let perf_start = 0.0

let active = true
let client = null

const touches = []

function touchIndexById(identifier) {
  for (let i = 0; i < touches.length; i++) {
    if (touches[i].identifier === identifier) return i
  }
  return -1
}

let previous = 0

function tick(timestamp) {
  if (active && timestamp - previous >= 15.999) {
    previous = timestamp

    let perf
    if (PERFORMANCE) perf = performance.now()

    client.update(timestamp)
    client.render()

    if (PERFORMANCE) {
      const diff = performance.now() - perf
      if (diff < perf_low) perf_low = diff
      if (diff > perf_high) perf_high = diff
      perf_tick++
      if (perf_tick === 16) {
        const average = (performance.now() - perf_start) / perf_tick
        console.info('time (low := ' + perf_low + ') (high := ' + perf_high + ') average :=', average)
        perf_low = Number.MAX_VALUE
        perf_high = -Number.MAX_VALUE
        perf_tick = 0
        perf_start = performance.now()
      }
    }
  }
  window.requestAnimationFrame(tick)
}

async function main() {
  const canvas = newCanvas(window.innerWidth, window.innerHeight)

  let gl = canvas.getContext('webgl2', { antialias: false })
  if (!gl) {
    gl = canvas.getContext('webgl', { antialias: false })
    if (!gl) {
      throw 'Your browser does not support WebGL'
    } else {
      console.warn('WebGL2 is not supported')
    }
  }

  client = new Client(canvas, gl)

  await client.initialize()

  document.getElementById('loading').remove()

  document.onkeyup = (event) => {
    client.keyUp(event)
  }

  document.onkeydown = (event) => {
    if (event.code === 'Escape') {
      if (document.fullscreenElement === null) canvas.requestFullscreen()
      else document.exitFullscreen()
    } else {
      client.keyDown(event)
    }
  }

  document.onmouseup = (event) => {
    client.mouseUp(event)
  }

  document.onmousedown = (event) => {
    client.mouseDown(event)
  }

  document.onmousemove = (event) => {
    client.mouseMove(event)
  }

  if ('ontouchstart' in window) {
    document.ontouchstart = (event) => {
      event.preventDefault()
      const changed = event.changedTouches
      for (let i = 0; i < changed.length; i++) {
        const touch = changed[i]
        const content = { identifier: touch.identifier, pageX: touch.pageX, pageY: client.height - touch.pageY }
        touches.push(content)
        client.touchStart(content)
      }
    }

    document.ontouchmove = (event) => {
      event.preventDefault()
      const changed = event.changedTouches
      for (let i = 0; i < changed.length; i++) {
        const touch = changed[i]
        const content = { identifier: touch.identifier, pageX: touch.pageX, pageY: client.height - touch.pageY }
        client.touchMove(content)
      }
    }

    document.ontouchend = (event) => {
      event.preventDefault()
      const changed = event.changedTouches
      for (let i = 0; i < changed.length; i++) {
        const touch = changed[i]
        const index = touchIndexById(touch.identifier)
        if (index >= 0) {
          const start = touches.splice(index, 1)[0]
          client.touchEnd(start)
        }
      }
    }

    document.ontouchcancel = (event) => {
      event.preventDefault()
      const changed = event.changedTouches
      for (let i = 0; i < changed.length; i++) {
        const touch = changed[i]
        const index = touchIndexById(touch.identifier)
        if (index >= 0) touches.splice(index, 1)
      }
    }
  }

  window.addEventListener('gamepadconnected', (event) => {
    const controller = event.gamepad
    console.log('controller connected', controller.buttons.length, 'buttons', controller.axes.length, 'axes')
    if (controller.buttons.length < 12 || controller.axes.length < 4) {
      console.warning('controller does not have enough buttons or axes')
      return
    }
    usingPlayStation(client.input)
    client.controllers.push(controller)
  })

  window.addEventListener('gamepaddisconnected', (event) => {
    const controller = event.gamepad
    console.log('controller disconnected: %d', controller.index)
    const array = client.controllers
    for (let c = 0; c < array.length; c++) {
      if (array[c].index === controller.index) array.splice(c, 1)
    }
    if (client.controllers.length === 0) usingKeyboardMouse(client.input)
  })

  window.onresize = () => {
    client.resize(window.innerWidth, window.innerHeight)
    if (!active) client.render()
  }

  window.onblur = () => {
    active = false
    client.pause()
  }

  window.onfocus = () => {
    active = true
    client.resume()
  }

  window.requestAnimationFrame(tick)
}

main()
