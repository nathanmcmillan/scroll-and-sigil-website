import {thingSetup, thingY, thingApproximateDistance, thingCheckSight, thingSetAnimation, thingUpdateSprite, thingUpdateAnimation, Thing} from '/src/thing/thing.js'
import {thingMove} from '/src/thing/npc.js'
import {randomInt} from '/src/math/random.js'
import {ANIMATION_DONE} from '/src/world/world.js'
import {newPlasma} from '/src/missile/plasma.js'
import {playSound} from '/src/assets/sounds.js'
import {textureIndexForName, entityByName} from '/src/assets/assets.js'
import {redBloodTowards, redBloodExplode} from '/src/thing/thing-util.js'
import {sin, cos, atan2} from '/src/math/approximate.js'

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
    this.texture = textureIndexForName(entity.get('sprite'))
    this.animations = entity.animations()
    this.animation = this.animations.get('idle')
    this.health = entity.health()
    this.speed = entity.speed()
    this.sight = entity.sight()
    this.sprite = this.animation[0]
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
    let things = self.world.things
    let i = self.world.thingCount
    while (i--) {
      let thing = things[i]
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
  let anime = thingUpdateAnimation(self)
  let attack = self.attack
  if (self.animationMod === 0) {
    let frame = self.animationFrame
    let soundOnFrame = parseInt(attack.get('sound-on-frame'))
    let damageOnFrame = parseInt(attack.get('damage-on-frame'))
    if (soundOnFrame && frame === soundOnFrame) playSound(attack.get('sound'))
    if (frame === damageOnFrame) {
      let target = self.target
      let type = attack.get('type')
      if (type === 'instant') {
        let distance = thingApproximateDistance(self, target) - self.box - target.box
        let range = parseFloat(attack.get('range'))
        if (distance < range) {
          let damage = attack.get('damage')
          let amount = parseInt(damage[0]) + randomInt(parseInt(damage[1]))
          target.damage(self, amount)
        }
      } else if (type === 'projectile') {
        const speed = 0.3
        let projectile = attack.get('projectile')
        let angle = atan2(target.z - self.z, target.x - self.x)
        let distance = thingApproximateDistance(self, target)
        let dx = cos(angle)
        let dz = sin(angle)
        let dy = (target.y + target.height * 0.5 - self.y - self.height * 0.5) / (distance / speed)
        let x = self.x + dx * (self.box + 2.0)
        let z = self.z + dz * (self.box + 2.0)
        let y = self.y + 0.5 * self.height
        let damage = attack.get('damage')
        let amount = parseInt(damage[0]) + randomInt(parseInt(damage[1]))
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
      let distance = thingApproximateDistance(self, self.target) - self.box - self.target.box
      for (const attack of self.attackOptions) {
        let range = parseFloat(attack.get('range'))
        if (distance < range) {
          let reaction = attack.get('reaction')
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
