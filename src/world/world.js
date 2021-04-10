import { entityByName } from '../assets/assets.js'
import { playMusic, playSound } from '../assets/sounds.js'
import { sectorInsideOutside, sectorLineNeighbors } from '../map/sector.js'
import { sectorTriangulate } from '../map/triangulate.js'
import { clearRandom } from '../math/random.js'
import { floatEq, floatZero } from '../math/vector.js'
import { Missile, missileInitialize } from '../missile/missile.js'
import { Particle, particleInitialize } from '../particle/particle.js'
import { Doodad } from '../thing/doodad.js'
import { Hero } from '../thing/hero.js'
import { Item } from '../thing/item.js'
import { Monster } from '../thing/monster.js'
import { NonPlayerCharacter } from '../thing/npc.js'
import { thingSet, thingTeleport } from '../thing/thing.js'
import { Cell, cellClear } from '../world/cell.js'
import { Decal, decalInitialize } from '../world/decal.js'
import { IntervalTrigger } from './trigger.js'

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

export function ticksToTime(value, interval) {
  if (interval === 'seconds') return value * 60
  if (interval === 'minutes') return value * 3600
  return value
}

export class World {
  constructor(game) {
    this.game = game
    this.tick = 0
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
    this.triggers = []
    this.events = []
    this.variables = new Map()
  }
}

export function worldClear(world) {
  for (let i = 0; i < world.thingCount; i++) world.things[i] = null
  for (let i = 0; i < world.missileCount; i++) world.missiles[i] = null
  for (let i = 0; i < world.particleCount; i++) world.particles[i] = null
  if (world.cells) for (let i = 0; i < world.cells.length; i++) cellClear(world.cells[i])
  world.tick = 0
  world.lines = null
  world.sectors.length = 0
  world.cells = null
  world.columns = 0
  world.rows = 0
  world.things.length = 0
  world.thingCount = 0
  world.missiles.length = 0
  world.missileCount = 0
  world.particles.length = 0
  world.particleCount = 0
  world.decals.length = 0
  world.decalQueue = 0
  world.triggers.length = 0
  world.events.length = 0
  world.variables.clear()
  clearRandom()
}

export function worldPushThing(world, thing) {
  const things = world.things
  if (things.length === world.thingCount) things.push(thing)
  else things[world.thingCount] = thing
  world.thingCount++
}

export function worldUpdate(world) {
  world.tick++

  const triggers = world.triggers
  let t = triggers.length
  while (t--) {
    const meta = triggers[t]
    if (world.tick < meta.time) continue
    meta.time += meta.interval
    worldConditionTrigger(world, meta.trigger, null)
  }

  const things = world.things
  let i = world.thingCount
  while (i--) {
    const thing = things[i]
    if (thing.update(thing)) {
      world.thingCount--
      things[i] = things[world.thingCount]
      things[world.thingCount] = null
    }
  }

  const missiles = world.missiles
  i = world.missileCount
  while (i--) {
    const missile = missiles[i]
    if (missile.update(missile)) {
      world.missileCount--
      missiles[i] = missiles[world.missileCount]
      missiles[world.missileCount] = missile
    }
  }

  const particles = world.particles
  i = world.particleCount
  while (i--) {
    const particle = particles[i]
    if (particle.update(particle)) {
      world.particleCount--
      particles[i] = particles[world.particleCount]
      particles[world.particleCount] = particle
    }
  }

  const events = world.events
  let e = events.length
  if (e > 0) {
    while (e--) worldDoTriggerAction(world, events[e][0], events[e][1])
    events.length = 0
  }
}

export function worldNewMissile(world, x, y, z) {
  const missiles = world.missiles
  let missile
  if (missiles.length === world.missileCount) {
    missile = new Missile()
    missiles.push(missile)
  } else {
    missile = missiles[world.missileCount]
  }
  world.missileCount++
  missileInitialize(missile, world, x, y, z)
  return missile
}

export function worldNewParticle(world, x, y, z) {
  const particles = world.particles
  let particle
  if (particles.length === world.particleCount) {
    particle = new Particle()
    particles.push(particle)
  } else {
    particle = particles[world.particleCount]
  }
  world.particleCount++
  particleInitialize(particle, world, x, y, z)
  return particle
}

export function worldFindSector(world, x, z) {
  let i = world.sectors.length
  while (i--) {
    const sector = world.sectors[i]
    if (sector.outside) continue
    else if (sector.contains(x, z)) return sector.find(x, z)
  }
  return null
}

export function worldPushTrigger(world, trigger) {
  const event = trigger.event
  if (event[0] !== 'every') return
  const value = parseInt(event[1])
  const interval = event[2]
  const ticks = ticksToTime(value, interval)
  world.triggers.push(new IntervalTrigger(trigger, ticks, world.tick))
}

export function triggerEvent(type, event) {
  return type === event[0]
}

function triggerCondition(world, condition, source) {
  if (condition === null) return true
  let i = 0
  while (i < condition.length) {
    if (condition[i] === 'lte') {
      const variable = condition[i + 1]
      const number = parseInt(condition[i + 2])
      if (variable === 'health') if (source.health > number) return false
      i += 3
    } else if (condition[i] === 'gte') {
      const variable = condition[i + 1]
      const number = parseInt(condition[i + 2])
      if (variable === 'health') if (source.health < number) return false
      i += 3
    } else if (condition[i] === 'eq') {
      const variable = condition[i + 1]
      const constant = condition[i + 2]
      if (variable === 'health') {
        if (source.health !== parseInt(constant)) return false
      } else if (variable === 'group') {
        if (source.group !== constant) return false
      }
      i += 3
    } else if (condition[i] === 'is') {
      const variable = condition[i + 1]
      const operator = condition[i + 2]
      const constant = condition[i + 3]
      const get = world.variables.get(variable)
      if (operator === 'lte') {
        if (get === null || get === undefined) return false
        if (parseFloat(get) > parseFloat(constant)) return false
      } else if (operator === 'gte') {
        if (get === null || get === undefined) return false
        if (parseFloat(get) < parseFloat(constant)) return false
      } else {
        if ((get === null || get === undefined) && constant !== 'null') return false
        if (isNaN(get) || isNaN(constant)) {
          if (get !== constant) return false
        } else if (!floatEq(parseFloat(get), parseFloat(constant))) return false
      }
      i += 4
    } else if (condition[i] === 'need') {
      const item = condition[i + 1]
      const inventory = source.inventory
      if (!inventory) return false
      let found = false
      for (let h = 0; h < inventory.length; h++) {
        if (inventory[h].entity.id() === item) {
          found = true
          break
        }
      }
      if (!found) return false
      i += 2
    } else if (condition[i] === 'missing') {
      const item = condition[i + 1]
      const inventory = source.inventory
      if (inventory) {
        let found = false
        for (let h = 0; h < inventory.length; h++) {
          if (inventory[h].entity.id() === item) {
            found = true
            break
          }
        }
        if (found) return false
      }
      i += 2
    } else i++
  }
  return true
}

export function worldConditionTrigger(world, trigger, source) {
  if (!triggerCondition(world, trigger.condition, source)) return
  world.events.push([trigger.action, source])
}

export function worldEventTrigger(world, type, trigger, source) {
  if (!triggerEvent(type, trigger.event)) return
  worldConditionTrigger(world, trigger, source)
}

function worldDoTriggerAction(world, action, source) {
  let i = 0
  while (i < action.length) {
    if (action[i] === 'spawn') {
      const name = action[i + 1]
      const x = parseFloat(action[i + 2])
      const z = parseFloat(action[i + 3])
      worldSpawnEntity(world, name, x, z)
      i += 4
    } else if (action[i] === 'teleport') {
      const x = parseFloat(action[i + 1])
      const z = parseFloat(action[i + 2])
      thingTeleport(source, x, z)
      i += 3
    } else if (action[i] === 'music') {
      playMusic(action[i + 1])
      i += 2
    } else if (action[i] === 'sound') {
      playSound(action[i + 1])
      i += 2
    } else if (action[i] === 'damage') {
      if (source) source.damage(source, null, parseInt(action[i + 1]))
      i += 2
    } else if (action[i] === 'map') {
      world.game.notify('map', action[i + 1])
      i += 2
    } else if (action[i] === 'set') {
      world.variables.set(action[i + 1], action[i + 2])
      i += 3
    } else if (action[i] === 'cinema') {
      world.game.notify('cinema')
      i++
    } else if (action[i] === 'no-cinema') {
      world.game.notify('no-cinema')
      i++
    } else i++
  }
}

export function worldNewDecal(world, texture) {
  const decals = world.decals
  let decal
  if (decals.length === DECAL_LIMIT) {
    decal = decals[world.decalQueue]
    world.decalQueue++
    if (world.decalQueue === DECAL_LIMIT) world.decalQueue = 0
  } else {
    decal = new Decal()
    decals.push(decal)
  }
  decalInitialize(decal, texture)
  return decal
}

export function worldPushSector(world, sector) {
  world.sectors.push(sector)
}

function worldBuildCellLines(world, line) {
  const xf = toFloatCell(line.a.x)
  const yf = toFloatCell(line.a.y)
  const dx = Math.abs(toFloatCell(line.b.x) - xf)
  const dy = Math.abs(toFloatCell(line.b.y) - yf)
  let x = toCell(line.a.x)
  let y = toCell(line.a.y)
  const xb = toCell(line.b.x)
  const yb = toCell(line.b.y)
  let n = 1
  let error = 0.0
  let incrementX = 0
  let incrementY = 0
  if (floatZero(dx)) {
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
  if (floatZero(dy)) {
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
    const cell = world.cells[x + y * world.columns]
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

export function worldSetLines(world, lines) {
  world.lines = lines
}

export function worldBuild(world) {
  let top = 0.0
  let right = 0.0
  for (let s = 0; s < world.sectors.length; s++) {
    const sector = world.sectors[s]
    for (let v = 0; v < sector.vecs.length; v++) {
      const vec = sector.vecs[v]
      if (vec.y > top) top = vec.y
      if (vec.x > right) right = vec.x
    }
  }
  const size = 1 << WORLD_CELL_SHIFT
  world.rows = Math.ceil(top / size)
  world.columns = Math.ceil(right / size)
  world.cells = new Array(world.rows * world.columns)
  for (let i = 0; i < world.cells.length; i++) world.cells[i] = new Cell()
  sectorInsideOutside(world.sectors)
  for (let s = 0; s < world.sectors.length; s++) sectorTriangulate(world.sectors[s], WORLD_SCALE)
  sectorLineNeighbors(world.sectors, world.lines, WORLD_SCALE)
  for (let i = 0; i < world.lines.length; i++) worldBuildCellLines(world, world.lines[i])
}

export function worldSpawnEntity(world, name, x, z, flags = null, trigger = null) {
  const entity = entityByName(name)
  if (entity.has('class')) name = entity.get('class')
  switch (name) {
    case 'monster':
      return new Monster(world, entity, x, z, flags, trigger)
    case 'doodad':
      return new Doodad(world, entity, x, z)
    case 'item':
      return new Item(world, entity, x, z)
    case 'npc':
      return new NonPlayerCharacter(world, entity, x, z)
    case 'hero':
      if (world.game.hero) {
        thingSet(world.game.hero, x, z)
        return world.game.hero
      }
      return new Hero(world, entity, x, z, world.game.input)
  }
  return null
}
