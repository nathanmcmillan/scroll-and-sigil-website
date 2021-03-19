import { entityByName } from '../assets/assets.js'
import { playSound } from '../assets/sounds.js'
import { atan2, cos, sin } from '../math/approximate.js'
import { randomInt } from '../math/random.js'
import { newPlasma } from '../missile/plasma.js'
import { thingMove } from '../thing/npc.js'
import { redBloodExplode, redBloodTowards } from '../thing/thing-util.js'
import { Thing, thingApproximateDistance, thingCheckSight, thingSetAnimation, thingSetup, thingUpdateAnimation, thingUpdateSprite, thingY } from '../thing/thing.js'
import { ANIMATION_DONE } from '../world/world.js'

const STATUS_LOOK = 0
const STATUS_CHASE = 1
const STATUS_ATTACK = 2
const STATUS_DEAD = 3
const STATUS_FINAL = 4

export class Monster extends Thing {
  constructor(world, entity, x, z) {
    super(world, x, z)
    this.box = entity.box()
    this.height = entity.height()
    this.name = entity.name()
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
    this.soundOnPain = entity.get('sound-pain')
    this.soundOnDeath = entity.get('sound-death')
    this.soundOnWake = entity.get('sound-wake')
    this.attackOptions = entity.get('attack')
    this.damage = monsterDamage
    this.update = monsterUpdate
    thingSetup(this)
  }
}

function monsterTestMove(self) {
  if (!thingMove(self)) return false
  self.moveCount = 16 + randomInt(32)
  return true
}

function chaseDirection(self) {
  let angle = atan2(self.target.z - self.z, self.target.x - self.x)
  for (let i = 0; i < 4; i++) {
    self.rotation = angle - 0.785375 + 1.57075 * Math.random()
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
            if (Math.random() < 0.9) playSound(self.soundOnWake)
            self.target = thing
            self.status = STATUS_CHASE
            thingSetAnimation(self, 'move')
            return
          }
        }
      }
    }
    self.reaction = 10 + randomInt(20)
  }
  if (thingUpdateAnimation(self) === ANIMATION_DONE) self.animationFrame = 0
  thingUpdateSprite(self)
}

function monsterAttack(self) {
  const anime = thingUpdateAnimation(self)
  const attack = self.attack
  if (self.animationMod === 0) {
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
          const amount = parseInt(damage[0]) + randomInt(parseInt(damage[1]))
          target.damage(self, amount)
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
        const amount = parseInt(damage[0]) + randomInt(parseInt(damage[1]))
        newPlasma(self.world, entityByName(projectile), x, y, z, dx * speed, dy, dz * speed, amount)
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
      for (const attack of self.attackOptions) {
        const range = parseFloat(attack.get('range'))
        if (distance < range) {
          const reaction = attack.get('reaction')
          if (attack.get('type') === 'instant' || thingCheckSight(self, self.target)) {
            self.attack = attack
            self.reaction = parseInt(reaction[0]) + randomInt(parseInt(reaction[1]))
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

function monsterDamage(source, health) {
  if (this.status === STATUS_DEAD || this.status === STATUS_FINAL) return
  this.health -= health
  if (this.health <= 0) {
    playSound(this.soundOnDeath)
    this.health = 0
    this.status = STATUS_DEAD
    thingSetAnimation(this, 'death')
    redBloodExplode(this)
  } else {
    playSound(this.soundOnPain)
    redBloodTowards(this, source)
  }
}

function monsterUpdate() {
  switch (this.status) {
    case STATUS_LOOK:
      monsterLook(this)
      break
    case STATUS_CHASE:
      monsterChase(this)
      break
    case STATUS_ATTACK:
      monsterAttack(this)
      break
    case STATUS_DEAD:
      monsterDead(this)
      break
    case STATUS_FINAL:
      return false
  }
  thingY(this)
  return false
}
