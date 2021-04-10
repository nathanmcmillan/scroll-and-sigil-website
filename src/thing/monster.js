import { entityByName } from '../assets/assets.js'
import { playSound } from '../assets/sounds.js'
import { atan2, cos, sin } from '../math/approximate.js'
import { pRandom, pRandomOf, randomFloat } from '../math/random.js'
import { newPlasma } from '../missile/plasma.js'
import { monsterName } from '../thing/name-gen.js'
import { thingMove } from '../thing/npc.js'
import { redBloodExplode, redBloodTowards } from '../thing/thing-util.js'
import {
  Thing,
  thingApproximateDistance,
  thingCheckSight,
  thingSetAnimation,
  thingSetup,
  thingSpecialSector,
  thingUpdateAnimation,
  thingUpdateSprite,
  thingY,
} from '../thing/thing.js'
import { FLAG_BOSS } from '../world/flags.js'
import { ANIMATION_DONE, worldEventTrigger } from '../world/world.js'
import { TRIGGER_DEAD } from '../world/trigger.js'

const STATUS_LOOK = 0
const STATUS_CHASE = 1
const STATUS_ATTACK = 2
const STATUS_DEAD = 3
const STATUS_FINAL = 4

export class Monster extends Thing {
  constructor(world, entity, x, z, flags, trigger) {
    super(world, entity, x, z)
    this.flags = flags
    this.trigger = trigger
    this.box = entity.box()
    this.height = entity.height()
    this.name = entity.name()
    if (flags && flags.get(FLAG_BOSS)) this.name = monsterName()
    this.group = entity.group()
    this.health = entity.health()
    this.speed = entity.speed()
    this.sight = entity.sight()
    this.animations = entity.stamps()
    this.animation = this.animations.get('idle')
    this.stamp = this.animation[0]
    this.target = null
    this.moveCount = 0
    this.status = STATUS_LOOK
    this.reaction = 0
    this.activeAttack = null
    this.soundOnPain = entity.get('sound-pain')
    this.soundOnDeath = entity.get('sound-death')
    this.soundOnWake = entity.get('sound-wake')
    this.attackOptions = entity.get('attack')
    this.experience = entity.experience()
    this.damage = monsterDamage
    this.update = monsterUpdate
    thingSetup(this)
  }
}

function monsterTestMove(self) {
  if (!thingMove(self)) return false
  self.moveCount = 16 + pRandomOf(32)
  return true
}

function chaseDirection(self) {
  let angle = atan2(self.target.z - self.z, self.target.x - self.x)
  for (let i = 0; i < 4; i++) {
    self.rotation = angle - 0.785375 + 1.57075 * randomFloat()
    if (monsterTestMove(self)) return
    angle += Math.PI
  }
  if (self.rotation < 0.0) self.rotation += 2.0 * Math.PI
  else if (self.rotation >= 2.0 * Math.PI) self.rotation -= 2.0 * Math.PI
}

function monsterDead(self) {
  if (self.animationFrame === self.animation.length - 1) {
    self.isPhysical = false
    self.status = STATUS_FINAL
    return
  }
  thingUpdateAnimation(self)
  thingUpdateSprite(self)
}

function monsterLook(self) {
  if (self.reaction > 0) {
    self.reaction--
  } else {
    const things = self.world.things
    let i = self.world.thingCount
    while (i--) {
      const thing = things[i]
      if (self === thing) continue
      if (thing.group === 'human' && thing.health > 0) {
        if (thingApproximateDistance(self, thing) <= self.sight) {
          if (thingCheckSight(self, thing)) {
            if (pRandom() < 229) playSound(self.soundOnWake)
            self.target = thing
            self.status = STATUS_CHASE
            thingSetAnimation(self, 'move')
            return
          }
        }
      }
    }
    self.reaction = 10 + pRandomOf(20)
  }
  if (thingUpdateAnimation(self) === ANIMATION_DONE) self.animationFrame = 0
  thingUpdateSprite(self)
}

function monsterAttack(self) {
  const anime = thingUpdateAnimation(self)
  if (self.animationMod === 0) {
    const attack = self.activeAttack
    const frame = self.animationFrame
    const soundOnFrame = parseInt(attack.get('sound-on-frame'))
    const damageOnFrame = parseInt(attack.get('damage-on-frame'))
    if (soundOnFrame && frame === soundOnFrame) playSound(attack.get('sound'))
    if (frame === damageOnFrame) {
      const target = self.target
      const type = attack.get('type')
      if (type === 'instant') {
        const distance = thingApproximateDistance(self, target) - self.box - target.box
        const range = parseFloat(attack.get('range'))
        if (distance < range) {
          const damage = attack.get('damage')
          const amount = parseInt(damage[0]) + pRandomOf(parseInt(damage[1]))
          target.damage(target, self, amount)
        }
      } else if (type === 'projectile') {
        const speed = 0.3
        const projectile = attack.get('projectile')
        const angle = atan2(target.z - self.z, target.x - self.x)
        const distance = thingApproximateDistance(self, target)
        const dx = cos(angle)
        const dz = sin(angle)
        const dy = (target.y + target.height * 0.5 - self.y - self.height * 0.5) / (distance / speed)
        const x = self.x + dx * (self.box + 2.0)
        const z = self.z + dz * (self.box + 2.0)
        const y = self.y + 0.5 * self.height
        const damage = attack.get('damage')
        const amount = parseInt(damage[0]) + pRandomOf(parseInt(damage[1]))
        newPlasma(self.world, entityByName(projectile), self, x, y, z, dx * speed, dy, dz * speed, amount)
      }
    }
  }
  if (anime === ANIMATION_DONE) {
    self.status = STATUS_CHASE
    thingSetAnimation(self, 'move')
  } else {
    thingUpdateSprite(self)
  }
}

function monsterChase(self) {
  if (self.reaction > 0) self.reaction--
  if (self.target.health <= 0 || self.target === null) {
    self.target = null
    self.status = STATUS_LOOK
    thingSetAnimation(self, 'idle')
  } else {
    if (self.reaction <= 0) {
      const distance = thingApproximateDistance(self, self.target) - self.box - self.target.box
      for (let a = 0; a < self.attackOptions.length; a++) {
        const attack = self.attackOptions[a]
        const range = parseFloat(attack.get('range'))
        if (distance < range) {
          const reaction = attack.get('reaction')
          if (attack.get('type') === 'instant' || thingCheckSight(self, self.target)) {
            self.activeAttack = attack
            self.reaction = parseInt(reaction[0]) + pRandomOf(parseInt(reaction[1]))
            self.status = STATUS_ATTACK
            thingSetAnimation(self, attack.get('animation'))
            break
          } else {
            self.reaction = parseInt(reaction[0])
          }
        }
      }
    }
    self.moveCount--
    if (self.moveCount < 0 || !thingMove(self)) chaseDirection(self)
    if (thingUpdateAnimation(self) === ANIMATION_DONE) self.animationFrame = 0
    thingUpdateSprite(self)
  }
}

function monsterDamage(monster, source, health) {
  if (monster.status === STATUS_DEAD || monster.status === STATUS_FINAL) return
  monster.health -= health
  if (monster.health <= 0) {
    playSound(monster.soundOnDeath)
    monster.health = 0
    monster.status = STATUS_DEAD
    thingSetAnimation(monster, 'death')
    redBloodExplode(monster)
    if (monster.trigger) worldEventTrigger(monster.world, TRIGGER_DEAD, monster.trigger, self)
  } else {
    playSound(monster.soundOnPain)
    redBloodTowards(monster, source)
  }
}

function monsterUpdate(monster) {
  switch (monster.status) {
    case STATUS_LOOK:
      monsterLook(monster)
      break
    case STATUS_CHASE:
      monsterChase(monster)
      break
    case STATUS_ATTACK:
      monsterAttack(monster)
      break
    case STATUS_DEAD:
      monsterDead(monster)
      break
    case STATUS_FINAL:
      return false
  }
  thingY(monster)
  thingSpecialSector(monster)
  return false
}
