export class Cell {
  constructor() {
    this.lines = []
    this.things = []
    this.thingCount = 0
    this.missiles = []
    this.missileCount = 0
    this.particles = []
    this.particleCount = 0
  }
}

export function cellClear(cell) {
  cell.lines.length = 0
  cell.things.length = 0
  cell.thingCount = 0
  cell.missiles.length = 0
  cell.missileCount = 0
  cell.particles.length = 0
  cell.particleCount = 0
}

export function cellPushThing(cell, thing) {
  const things = cell.things
  if (things.length === cell.thingCount) {
    things.push(thing)
  } else {
    things[cell.thingCount] = thing
  }
  cell.thingCount++
}

export function cellRemoveThing(cell, thing) {
  const things = cell.things
  const index = things.indexOf(thing)
  cell.thingCount--
  things[index] = things[cell.thingCount]
  things[cell.thingCount] = null
}

export function cellPushMissile(cell, missile) {
  const missiles = cell.missiles
  if (missiles.length === cell.missileCount) {
    missiles.push(missile)
  } else {
    missiles[cell.missileCount] = missile
  }
  cell.missileCount++
}

export function cellRemoveMissile(cell, missile) {
  const missiles = cell.missiles
  const index = missiles.indexOf(missile)
  cell.missileCount--
  missiles[index] = missiles[cell.missileCount]
  missiles[cell.missileCount] = null
}

export function cellPushParticle(cell, particle) {
  const particles = cell.particles
  if (particles.length === cell.particleCount) {
    particles.push(particle)
  } else {
    particles[cell.particleCount] = particle
  }
  cell.particleCount++
}

export function cellRemoveParticle(cell, particle) {
  const particles = cell.particles
  const index = particles.indexOf(particle)
  cell.particleCount--
  particles[index] = particles[cell.particleCount]
  particles[cell.particleCount] = null
}
