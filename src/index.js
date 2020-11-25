import {Client} from '/src/client/client.js'

function newCanvas(width, height) {
  let canvas = document.createElement('canvas')
  canvas.style.display = 'block'
  canvas.style.position = 'absolute'
  canvas.style.left = '0'
  canvas.style.right = '0'
  canvas.style.top = '0'
  canvas.style.bottom = '0'
  canvas.style.margin = 'auto'
  canvas.width = width
  canvas.height = height
  return canvas
}

const PERFORMANCE = false
let perfLow = Number.MAX_VALUE
let perfHigh = -Number.MAX_VALUE
let perfTick = 0
let perfStart = 0.0

let active = true
let client = null

function tick() {
  if (active) {
    let perf
    if (PERFORMANCE) perf = performance.now()

    client.update()
    client.render()

    if (PERFORMANCE) {
      let diff = performance.now() - perf
      if (diff < perfLow) perfLow = diff
      if (diff > perfHigh) perfHigh = diff
      perfTick++
      if (perfTick === 16) {
        let average = (performance.now() - perfStart) / perfTick
        console.log('time (low := ' + perfLow + ') (high := ' + perfHigh + ') average :=', average)
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
  document.body.appendChild(canvas)

  client = new Client(canvas, gl)

  await client.initialize()
  client.resize(window.innerWidth, window.innerHeight)

  document.onkeyup = (event) => {
    client.keyUp(event)
  }

  document.onkeydown = (event) => {
    client.keyDown(event)
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

  window.onresize = () => {
    client.resize(window.innerWidth, window.innerHeight)
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
