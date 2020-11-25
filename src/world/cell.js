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

  clear() {
    this.lines.length = 0
    this.things.length = 0
    this.thingCount = 0
    this.missiles.length = 0
    this.missileCount = 0
    this.particles.length = 0
    this.particleCount = 0
  }

  pushThing(thing) {
    let things = this.things
    if (things.length === this.thingCount) {
      things.push(thing)
    } else {
      things[this.thingCount] = thing
    }
    this.thingCount++
  }

  removeThing(thing) {
    let things = this.things
    let index = things.indexOf(thing)
    this.thingCount--
    things[index] = things[this.thingCount]
    things[this.thingCount] = null
  }

  pushMissile(missile) {
    let missiles = this.missiles
    if (missiles.length === this.missileCount) {
      missiles.push(missile)
    } else {
      missiles[this.missileCount] = missile
    }
    this.missileCount++
  }

  removeMissile(missile) {
    let missiles = this.missiles
    let index = missiles.indexOf(missile)
    this.missileCount--
    missiles[index] = missiles[this.missileCount]
    missiles[this.missileCount] = null
  }

  pushParticle(particle) {
    let particles = this.particles
    if (particles.length === this.particleCount) {
      particles.push(particle)
    } else {
      particles[this.particleCount] = particle
    }
    this.particleCount++
  }

  removeParticle(particle) {
    let particles = this.particles
    let index = particles.indexOf(particle)
    this.particleCount--
    particles[index] = particles[this.particleCount]
    particles[this.particleCount] = null
  }
}
