import {Client} from './client/client.js'

function newCanvas(width, height) {
  let canvas = document.getElementById('canvas')
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
let perfLow = Number.MAX_VALUE
let perfHigh = -Number.MAX_VALUE
let perfTick = 0
let perfStart = 0.0

let active = true
let client = null
let ongoingTouches = []

function touchIndexById(identifier) {
  const touches = ongoingTouches
  for (let i = 0; i < touches.length; i++) {
    if (touches[i].identifier == identifier) return i
  }
  return -1
}

function tick(timestamp) {
  if (active) {
    let perf
    if (PERFORMANCE) perf = performance.now()

    client.update(timestamp)
    client.render()

    if (PERFORMANCE) {
      let diff = performance.now() - perf
      if (diff < perfLow) perfLow = diff
      if (diff > perfHigh) perfHigh = diff
      perfTick++
      if (perfTick === 16) {
        let average = (performance.now() - perfStart) / perfTick
        console.info('time (low := ' + perfLow + ') (high := ' + perfHigh + ') average :=', average)
        perfLow = Number.MAX_VALUE
        perfHigh = -Number.MAX_VALUE
        perfTick = 0
        perfStart = performance.now()
      }
    }
  }
  window.requestAnimationFrame(tick)
}

async function main() {
  let canvas = newCanvas(window.innerWidth, window.innerHeight)
  let gl = canvas.getContext('webgl2')

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
      const touches = event.changedTouches
      for (let i = 0; i < touches.length; i++) {
        let touch = touches[i]
        let content = {identifier: touch.identifier, pageX: touch.pageX, pageY: client.height - touch.pageY}
        ongoingTouches.push(content)
        client.touchStart(content)
      }
    }

    document.ontouchmove = (event) => {
      event.preventDefault()
      const touches = event.changedTouches
      for (let i = 0; i < touches.length; i++) {
        let touch = touches[i]
        let content = {identifier: touch.identifier, pageX: touch.pageX, pageY: client.height - touch.pageY}
        client.touchMove(content)
      }
    }

    document.ontouchend = (event) => {
      event.preventDefault()
      const touches = event.changedTouches
      for (let i = 0; i < touches.length; i++) {
        let touch = touches[i]
        let index = touchIndexById(touch.identifier)
        if (index >= 0) {
          let start = ongoingTouches.splice(index, 1)[0]
          client.touchEnd(start)
        }
      }
    }

    document.ontouchcancel = (event) => {
      event.preventDefault()
      const touches = event.changedTouches
      for (let i = 0; i < touches.length; i++) {
        let touch = touches[i]
        let index = touchIndexById(touch.identifier)
        if (index >= 0) ongoingTouches.splice(index, 1)
      }
    }
  }

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
