import {Float} from '/src/math/vector.js'
import {Cell} from '/src/world/cell.js'
import {decalInitialize, Decal} from '/src/world/decal.js'
import {particleInitialize, Particle} from '/src/particle/particle.js'
import {missileInitialize, Missile} from '/src/missile/missile.js'
import {sectorInsideOutside, sectorLineNeighbors} from '/src/map/sector.js'
import {sectorTriangulate} from '/src/map/triangulate.js'

export const WORLD_SCALE = 0.25
export const WORLD_CELL_SHIFT = 5

export const GRAVITY = 0.028
export const RESISTANCE = 0.88

export const ANIMATION_RATE = 16
export const ANIMATION_NOT_DONE = 0
export const ANIMATION_ALMOST_DONE = 1
export const ANIMATION_DONE = 2

const DECAL_LIMIT = 300

export function toCell(f) {
  return Math.floor(f) >> WORLD_CELL_SHIFT
}

export function toFloatCell(f) {
  return f / (1 << WORLD_CELL_SHIFT)
}

export class World {
  constructor(game) {
    this.game = game
    this.lines = null
    this.sectors = []
    this.cells = null
    this.columns = 0
    this.rows = 0
    this.things = []
    this.thingCount = 0
    this.missiles = []
    this.missileCount = 0
    this.particles = []
    this.particleCount = 0
    this.decals = []
    this.decalQueue = 0
    this.triggers = new Map()
  }

  clear() {
    for (let i = 0; i < this.thingCount; i++) this.things[i] = null
    for (let i = 0; i < this.missileCount; i++) this.missiles[i] = null
    for (let i = 0; i < this.particleCount; i++) this.particles[i] = null
    if (this.cells) for (let i = 0; i < this.cells.length; i++) this.cells[i].clear()
    this.lines = null
    this.sectors.length = 0
    this.cells = null
    this.columns = 0
    this.rows = 0
    this.things.length = 0
    this.thingCount = 0
    this.missiles.length = 0
    this.missileCount = 0
    this.particles.length = 0
    this.particleCount = 0
    this.decals.length = 0
    this.decalQueue = 0
    this.triggers.clear()
  }

  pushThing(thing) {
    let things = this.things
    if (things.length === this.thingCount) things.push(thing)
    else things[this.thingCount] = thing
    this.thingCount++
  }

  newMissile(x, y, z) {
    let missiles = this.missiles
    let missile
    if (missiles.length === this.missileCount) {
      missile = new Missile()
      missiles.push(missile)
    } else {
      missile = missiles[this.missileCount]
    }
    this.missileCount++
    missileInitialize(missile, this, x, y, z)
    return missile
  }

  newParticle(x, y, z) {
    let particles = this.particles
    let particle
    if (particles.length === this.particleCount) {
      particle = new Particle()
      particles.push(particle)
    } else {
      particle = particles[this.particleCount]
    }
    this.particleCount++
    particleInitialize(particle, this, x, y, z)
    return particle
  }

  newDecal(texture) {
    let decals = this.decals
    let decal
    if (decals.length === DECAL_LIMIT) {
      decal = decals[this.decalQueue]
      this.decalQueue++
      if (this.decalQueue == DECAL_LIMIT) this.decalQueue = 0
    } else {
      decal = new Decal()
      decals.push(decal)
    }
    decalInitialize(decal, texture)
    return decal
  }

  update() {
    const things = this.things
    let i = this.thingCount
    while (i--) {
      if (things[i].update()) {
        this.thingCount--
        things[i] = things[this.thingCount]
        things[this.thingCount] = null
      }
    }

    const missiles = this.missiles
    i = this.missileCount
    while (i--) {
      let missile = missiles[i]
      if (missile.update()) {
        this.missileCount--
        missiles[i] = missiles[this.missileCount]
        missiles[this.missileCount] = missile
      }
    }

    const particles = this.particles
    i = this.particleCount
    while (i--) {
      let particle = particles[i]
      if (particle.update()) {
        this.particleCount--
        particles[i] = particles[this.particleCount]
        particles[this.particleCount] = particle
      }
    }
  }

  pushSector(sector) {
    this.sectors.push(sector)
  }

  findSector(x, z) {
    let i = this.sectors.length
    while (i--) {
      let sector = this.sectors[i]
      if (sector.outside) continue
      else if (sector.contains(x, z)) return sector.find(x, z)
    }
    return null
  }

  buildCellLines(line) {
    let xf = toFloatCell(line.a.x)
    let yf = toFloatCell(line.a.y)
    let dx = Math.abs(toFloatCell(line.b.x) - xf)
    let dy = Math.abs(toFloatCell(line.b.y) - yf)
    let x = toCell(line.a.x)
    let y = toCell(line.a.y)
    let xb = toCell(line.b.x)
    let yb = toCell(line.b.y)
    let n = 1
    let error = 0.0
    let incrementX = 0
    let incrementY = 0
    if (Float.zero(dx)) {
      incrementX = 0
      error = Number.MAX_VALUE
    } else if (line.b.x > line.a.x) {
      incrementX = 1
      n += xb - x
      error = (x + 1.0 - xf) * dy
    } else {
      incrementX = -1
      n += x - xb
      error = (xf - x) * dy
    }
    if (Float.zero(dy)) {
      incrementY = 0
      error = -Number.MAX_VALUE
    } else if (line.b.y > line.a.y) {
      incrementY = 1
      n += yb - y
      error -= (y + 1.0 - yf) * dx
    } else {
      incrementY = -1
      n += y - yb
      error -= (yf - y) * dx
    }
    for (; n > 0; n--) {
      let cell = this.cells[x + y * this.columns]
      cell.lines.push(line)
      if (error > 0.0) {
        y += incrementY
        error -= dx
      } else {
        x += incrementX
        error += dy
      }
    }
  }

  setLines(lines) {
    this.lines = lines
  }

  build() {
    let top = 0.0
    let right = 0.0
    for (const sector of this.sectors) {
      for (const vec of sector.vecs) {
        if (vec.y > top) top = vec.y
        if (vec.x > right) right = vec.x
      }
    }
    const size = 1 << WORLD_CELL_SHIFT
    this.rows = Math.ceil(top / size)
    this.columns = Math.ceil(right / size)
    this.cells = new Array(this.rows * this.columns)
    for (let i = 0; i < this.cells.length; i++) this.cells[i] = new Cell()
    sectorInsideOutside(this.sectors)
    for (const sector of this.sectors) sectorTriangulate(sector, WORLD_SCALE)
    sectorLineNeighbors(this.sectors, WORLD_SCALE)
    for (const line of this.lines) this.buildCellLines(line)
  }

  trigger(trigger, conditions, events) {
    let list = this.triggers.get(trigger)
    if (!list) {
      list = []
      this.triggers.set(trigger, list)
    }
    list.push([conditions, events])
  }

  notify(trigger, params) {
    let list = this.triggers.get(trigger)
    if (!list) {
      this.game.notify(trigger, params)
      return
    }
    for (const entry of list) {
      let conditions = entry[0]
      let events = entry[1]
      console.log(trigger, params, '=>', conditions, events)
      if (trigger === 'interact-line') {
        let line = params[1]
        if (line === conditions[0]) {
          this.game.notify(events[0])
        }
      }
    }
  }
}
