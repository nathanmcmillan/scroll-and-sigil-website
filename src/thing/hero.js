/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { entityByName } from '../assets/assets.js'
import { playSound } from '../assets/sounds.js'
import { pRandomOf } from '../math/random.js'
import { newPlasma } from '../missile/plasma.js'
import { redBloodExplode, redBloodTowards } from '../thing/thing-util.js'
import { Thing, thingApproximateDistance, thingIntegrate, thingSetAnimation, thingSetup, thingUpdateAnimation, thingUpdateSprite } from '../thing/thing.js'
import { FLAG_BOSS } from '../world/flags.js'
import { TRIGGER_ATTACK, TRIGGER_INTERACT } from '../world/trigger.js'
import { ANIMATION_ALMOST_DONE, ANIMATION_DONE, triggerEvent, worldConditionTrigger, worldEventTrigger, WORLD_CELL_SHIFT } from '../world/world.js'

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

export class Hero extends Thing {
  constructor(world, entity, x, z, input) {
    super(world, entity, x, z)
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
    this.boss = null
    this.damage = heroDamage
    this.update = heroUpdate
    this.attack = heroAttack
    thingSetup(this)
  }
}

function heroSetBoss(hero, thing) {
  if (thing) {
    if (thing.flags && thing.flags.get(FLAG_BOSS)) {
      hero.boss = thing
    } else {
      const origin = thing.origin
      if (origin && origin.flags && origin.flags.get(FLAG_BOSS)) hero.boss = origin
    }
  }
}

function heroAttack(hero, target) {
  heroSetBoss(hero, target)
  if (target.health <= 0) heroTakeExperience(self, target.experience)
}

function heroDamage(hero, source, health) {
  heroSetBoss(hero, source)
  if (hero.status === STATUS_BUSY) {
    hero.status = STATUS_IDLE
    hero.menu = null
    hero.interaction = null
    hero.interactionWith = null
  } else if (hero.status === STATUS_DEAD) return
  hero.health -= health
  if (hero.health <= 0) {
    playSound('baron-death')
    hero.health = 0
    hero.status = STATUS_DEAD
    thingSetAnimation(hero, 'death')
    hero.combat = 0
    redBloodExplode(hero)
  } else {
    playSound('baron-pain')
    hero.combat = COMBAT_TIMER
    redBloodTowards(hero, source)
  }
}

function heroUpdate(hero) {
  switch (hero.status) {
    case STATUS_IDLE:
    case STATUS_MOVE:
      heroMove(hero)
      break
    case STATUS_MELEE:
      heroMelee(hero)
      break
    case STATUS_MISSILE:
      heroMissile(hero)
      break
    case STATUS_DEAD:
      heroDead(hero)
      break
    case STATUS_BUSY:
      heroBusy(hero)
      break
  }
  thingIntegrate(hero)
  return false
}

function heroDistanceToLine(self, box, line) {
  const vx = line.b.x - line.a.x
  const vz = line.b.y - line.a.y
  const wx = self.x - line.a.x
  const wz = self.z - line.a.y
  if (vx * wz - vz * wx >= 0.0) return null
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
      if (trigger) worldEventTrigger(world, TRIGGER_INTERACT, trigger, self)
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
          if (trigger) worldEventTrigger(world, TRIGGER_INTERACT, trigger, self)
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
        i = cell.lines.length
        while (i--) {
          const line = cell.lines[i]
          const trigger = line.trigger
          if (trigger && triggerEvent(TRIGGER_ATTACK, trigger.event)) {
            const distance = heroDistanceToLine(self, box, line)
            if (distance !== null) worldConditionTrigger(world, trigger, self)
          }
        }
      }
    }

    if (target) {
      target.damage(target, self, 1 + pRandomOf(3))
      self.attack(self, target)
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
    newPlasma(self.world, entityByName('plasma'), self, x, y, z, dx * speed, 0.0, dz * speed, 1 + pRandomOf(3))
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
  const input = self.input
  heroFindClosestThing(self)
  if (self.reaction > 0) {
    self.reaction--
  } else if (input.x() && self.stamina >= MISSILE_COST) {
    playSound('baron-missile')
    self.status = STATUS_MISSILE
    thingSetAnimation(self, 'missile')
    self.combat = COMBAT_TIMER
    self.stamina -= MISSILE_COST
    return
  } else if (input.b() && self.stamina >= MELEE_COST) {
    playSound('baron-melee')
    self.status = STATUS_MELEE
    thingSetAnimation(self, 'melee')
    self.combat = COMBAT_TIMER
    self.stamina -= MELEE_COST
    return
  } else if (input.pressRightTrigger()) {
    if (heroInteract(self)) return
  }
  if (input.pressSelect()) {
    heroOpenMenu(self)
  }
  if (self.ground) {
    if (input.pressLeftTrigger()) {
      self.ground = false
      self.deltaY += 0.4
    } else {
      if (input.leftStickPower !== 0.0) {
        const power = input.leftStickPower * self.speed
        const angle = input.leftStickAngle + self.rotation
        const deltaX = power * Math.cos(angle)
        const deltaZ = power * Math.sin(angle)
        self.deltaX += deltaX
        self.deltaZ += deltaZ
        if (thingUpdateAnimation(self) === ANIMATION_DONE) self.animationFrame = 0
        thingUpdateSprite(self)
      }
    }
  }
}
