import { entityByName } from '../assets/assets.js'
import { playSound } from '../assets/sounds.js'
import { randomInt } from '../math/random.js'
import { newPlasma } from '../missile/plasma.js'
import { redBloodExplode, redBloodTowards } from '../thing/thing-util.js'
import { Thing, thingApproximateDistance, thingIntegrate, thingSetAnimation, thingSetup, thingUpdateAnimation, thingUpdateSprite } from '../thing/thing.js'
import { ANIMATION_ALMOST_DONE, ANIMATION_DONE, worldEventTrigger, WORLD_CELL_SHIFT } from '../world/world.js'

// TODO
// If thing interacting with dies / is busy then nullify hero interaction

const STATUS_IDLE = 0
const STATUS_MOVE = 1
const STATUS_MELEE = 2
const STATUS_MISSILE = 3
const STATUS_DEAD = 4
const STATUS_BUSY = 5

const COMBAT_TIMER = 300

const MELEE_COST = 2
const MISSILE_COST = 4

function heroDamage(source, health) {
  if (this.status === STATUS_BUSY) {
    this.status = STATUS_IDLE
    this.menu = null
    this.interaction = null
    this.interactionWith = null
  }
  this.health -= health
  if (this.health <= 0) {
    playSound('baron-death')
    this.health = 0
    this.status = STATUS_DEAD
    thingSetAnimation(this, 'death')
    this.combat = 0
    redBloodExplode(this)
  } else {
    playSound('baron-pain')
    this.combat = COMBAT_TIMER
    redBloodTowards(this, source)
  }
}

function heroUpdate() {
  switch (this.status) {
    case STATUS_IDLE:
    case STATUS_MOVE:
      heroMove(this)
      break
    case STATUS_MELEE:
      heroMelee(this)
      break
    case STATUS_MISSILE:
      heroMissile(this)
      break
    case STATUS_DEAD:
      heroDead(this)
      break
    case STATUS_BUSY:
      heroBusy(this)
      break
  }
  thingIntegrate(this)
  return false
}

function heroDistanceToLine(self, box, line) {
  const vx = line.b.x - line.a.x
  const vz = line.b.y - line.a.y
  const wx = self.x - line.a.x
  const wz = self.z - line.a.y
  if (vx * wz - vz * wx < 0.0) return null
  let t = (wx * vx + wz * vz) / (vx * vx + vz * vz)
  if (t < 0.0) t = 0.0
  else if (t > 1.0) t = 1.0
  const px = line.a.x + vx * t - self.x
  const pz = line.a.y + vz * t - self.z
  const distance = px * px + pz * pz
  if (distance > box * box) return null
  return Math.sqrt(distance)
}

function heroFindClosestThing(self) {
  self.nearby = null

  const box = self.box + 2.0
  let minC = Math.floor(self.x - box) >> WORLD_CELL_SHIFT
  let maxC = Math.floor(self.x + box) >> WORLD_CELL_SHIFT
  let minR = Math.floor(self.z - box) >> WORLD_CELL_SHIFT
  let maxR = Math.floor(self.z + box) >> WORLD_CELL_SHIFT

  const world = self.world
  const columns = world.columns

  if (minC < 0) minC = 0
  if (minR < 0) minR = 0
  if (maxC >= columns) maxC = columns - 1
  if (maxR >= world.rows) maxR = world.rows - 1

  let closest = Number.MAX_VALUE

  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      const cell = world.cells[c + r * columns]
      let i = cell.thingCount
      while (i--) {
        const thing = cell.things[i]
        if (self === thing) continue
        if ((thing.isItem && !thing.pickedUp) || (thing.interaction && thing.health > 0)) {
          const distance = thingApproximateDistance(self, thing)
          if (distance < 2.0 && distance < closest) {
            closest = distance
            self.nearby = thing
          }
        }
      }
    }
  }
}

function heroInteract(self) {
  if (self.nearby) {
    const thing = self.nearby
    if (thing.isItem && !thing.pickedUp) {
      playSound('pickup-item')
      self.inventory.push(thing)
      thing.pickedUp = true
      return false
    } else if (thing.interaction && thing.health > 0) {
      self.combat = 0
      self.status = STATUS_BUSY
      thingSetAnimation(self, 'move')
      self.interactionWith = thing
      self.interaction = thing.interaction
      if (self.interaction.get('type') === 'quest') self.world.notify('begin-cinema')
      const trigger = thing.trigger
      if (trigger) worldEventTrigger(world, 'interact', trigger, self)
      return true
    }
  }

  const box = self.box + 2.0
  let minC = Math.floor(self.x - box) >> WORLD_CELL_SHIFT
  let maxC = Math.floor(self.x + box) >> WORLD_CELL_SHIFT
  let minR = Math.floor(self.z - box) >> WORLD_CELL_SHIFT
  let maxR = Math.floor(self.z + box) >> WORLD_CELL_SHIFT

  const world = self.world
  const columns = world.columns

  if (minC < 0) minC = 0
  if (minR < 0) minR = 0
  if (maxC >= columns) maxC = columns - 1
  if (maxR >= world.rows) maxR = world.rows - 1

  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      const cell = world.cells[c + r * columns]
      let i = cell.lines.length
      while (i--) {
        const line = cell.lines[i]
        const distance = heroDistanceToLine(self, box, line)
        if (distance !== null && distance < 2.0) {
          const trigger = line.trigger
          if (trigger) worldEventTrigger(world, 'interact', trigger, self)
        }
      }
    }
  }

  return false
}

function heroDead(self) {
  if (self.animationFrame === self.animation.length - 1) {
    if (self.input.pressStart()) self.world.notify('death-menu')
    return
  }
  thingUpdateAnimation(self)
  thingUpdateSprite(self)
}

function heroOpenMenu(self) {
  self.status = STATUS_BUSY
  thingSetAnimation(self, 'move')
  self.menu = { page: 'inventory' }
}

function heroBusy(self) {
  if (self.input.pressSelect()) {
    self.status = STATUS_IDLE
    if (self.menu) self.menu = null
    if (self.interaction) {
      self.interaction = null
      self.interactionWith = null
    }
  }
}

function heroTakeExperience(self, value) {
  self.experience += value
  if (self.experience > self.experienceNeeded) {
    self.experience -= self.experienceNeeded
    self.experienceNeeded = Math.floor(1 + 1.8 * self.experienceNeeded)
    self.techniquePoints++
  }
}

function heroMelee(self) {
  const frame = thingUpdateAnimation(self)
  if (frame === ANIMATION_ALMOST_DONE) {
    self.reaction = 40

    const meleeRange = 1.0

    const box = self.box + meleeRange
    let minC = Math.floor(self.x - box) >> WORLD_CELL_SHIFT
    let maxC = Math.floor(self.x + box) >> WORLD_CELL_SHIFT
    let minR = Math.floor(self.z - box) >> WORLD_CELL_SHIFT
    let maxR = Math.floor(self.z + box) >> WORLD_CELL_SHIFT

    const world = self.world
    const columns = world.columns

    if (minC < 0) minC = 0
    if (minR < 0) minR = 0
    if (maxC >= columns) maxC = columns - 1
    if (maxR >= world.rows) maxR = world.rows - 1

    let closest = Number.MAX_VALUE
    let target = null

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const cell = world.cells[c + r * columns]
        let i = cell.thingCount
        while (i--) {
          const thing = cell.things[i]
          if (self === thing) continue
          const distance = thingApproximateDistance(self, thing)
          if (distance < self.box + thing.box + meleeRange && distance < closest) {
            closest = distance
            target = thing
          }
        }
      }
    }

    if (target) {
      target.damage(self, 1 + randomInt(3))
      if (target.health <= 0) heroTakeExperience(self, target.experience)
    }
  } else if (frame === ANIMATION_DONE) {
    self.status = STATUS_IDLE
    thingSetAnimation(self, 'move')
    return
  }
  thingUpdateSprite(self)
}

function heroMissile(self) {
  const frame = thingUpdateAnimation(self)
  if (frame === ANIMATION_ALMOST_DONE) {
    self.reaction = 60
    const speed = 0.3
    const dx = Math.cos(self.rotation)
    const dz = Math.sin(self.rotation)
    const x = self.x + dx * (self.box + 2.0)
    const z = self.z + dz * (self.box + 2.0)
    const y = self.y + 0.5 * self.height
    newPlasma(self.world, entityByName('plasma'), x, y, z, dx * speed, 0.0, dz * speed, 1 + randomInt(3))
  } else if (frame === ANIMATION_DONE) {
    self.status = STATUS_IDLE
    thingSetAnimation(self, 'move')
    return
  }
  thingUpdateSprite(self)
}

function heroMove(self) {
  if (self.combat > 0) self.combat--
  if (self.stamina < self.maxStamina) {
    self.staminaRate++
    if (self.staminaRate >= self.staminaBound) {
      self.stamina++
      self.staminaRate = 0
    }
  }
  heroFindClosestThing(self)
  if (self.reaction > 0) {
    self.reaction--
  } else if (self.input.x() && self.stamina >= MISSILE_COST) {
    playSound('baron-missile')
    self.status = STATUS_MISSILE
    thingSetAnimation(self, 'missile')
    self.combat = COMBAT_TIMER
    self.stamina -= MISSILE_COST
    return
  } else if (self.input.b() && self.stamina >= MELEE_COST) {
    playSound('baron-melee')
    self.status = STATUS_MELEE
    thingSetAnimation(self, 'melee')
    self.combat = COMBAT_TIMER
    self.stamina -= MELEE_COST
    return
  } else if (self.input.pressRightTrigger()) {
    if (heroInteract(self)) return
  }
  if (self.input.pressSelect()) {
    heroOpenMenu(self)
  }
  if (self.ground) {
    if (self.input.pressLeftTrigger()) {
      self.ground = false
      self.deltaY += 0.4
    } else {
      let direction = null
      let rotation = 0.0
      if (self.input.stickUp()) {
        direction = 'w'
        rotation = self.rotation
      }
      if (self.input.stickDown()) {
        if (direction === null) {
          direction = 's'
          rotation = self.rotation + Math.PI
        } else {
          direction = null
          rotation = 0.0
        }
      }
      if (self.input.stickLeft()) {
        if (direction === null) {
          direction = 'a'
          rotation = self.rotation - 0.5 * Math.PI
        } else if (direction === 'w') {
          direction = 'wa'
          rotation -= 0.25 * Math.PI
        } else if (direction === 's') {
          direction = 'sa'
          rotation += 0.25 * Math.PI
        }
      }
      if (self.input.stickRight()) {
        if (direction === null) {
          direction = 'd'
          rotation = self.rotation + 0.5 * Math.PI
        } else if (direction === 'a') {
          direction = null
          rotation = 0.0
        } else if (direction === 'wa') {
          direction = 'w'
          rotation = self.rotation
        } else if (direction === 'sa') {
          direction = 's'
          rotation = self.rotation + Math.PI
        } else if (direction === 'w') {
          direction = 'wd'
          rotation += 0.25 * Math.PI
        } else if (direction === 's') {
          direction = 'sd'
          rotation -= 0.25 * Math.PI
        }
      }
      if (direction !== null) {
        self.deltaX += Math.cos(rotation) * self.speed
        self.deltaZ += Math.sin(rotation) * self.speed
        if (thingUpdateAnimation(self) === ANIMATION_DONE) self.animationFrame = 0
        thingUpdateSprite(self)
      }
    }
  }
}

export class Hero extends Thing {
  constructor(world, entity, x, z, input) {
    super(world, x, z)
    this.box = entity.box()
    this.height = entity.height()
    this.input = input
    this.animations = entity.stamps()
    this.animation = this.animations.get('move')
    this.stamp = this.animation[0]
    this.speed = entity.speed()
    this.maxHealth = entity.health()
    this.health = this.maxHealth
    this.maxStamina = entity.stamina()
    this.stamina = this.maxStamina
    this.staminaRate = 0
    this.staminaBound = 32
    this.status = STATUS_IDLE
    this.reaction = 0
    this.group = 'human'
    this.level = 1
    this.experience = 0
    this.experienceNeeded = 20
    this.skills = 0
    this.tree = {}
    this.outfit = null
    this.headpiece = null
    this.weapon = null
    this.nearby = null
    this.quests = []
    this.inventory = []
    this.combat = 0
    this.menu = null
    this.menuSub = 0
    this.menuColumn = 0
    this.menuRow = 0
    this.interactionWith = null
    this.damage = heroDamage
    this.update = heroUpdate
    thingSetup(this)
  }
}
