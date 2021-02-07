import {ANIMATION_DONE} from '../world/world.js'
import {textureIndexForName} from '../assets/assets.js'
import {particleSetup, particleUpdateAnimation} from '../particle/particle.js'

function plasmaExplosionUpdate() {
  if (particleUpdateAnimation(this) === ANIMATION_DONE) return true
  this.sprite = this.animation[this.animationFrame]
  return false
}

function plasmaExplosionInit(self, entity) {
  self.update = plasmaExplosionUpdate
  self.texture = textureIndexForName(entity.get('sprite'))
  self.animation = entity.animations()
  self.sprite = self.animation[0]
  self.animationMod = 0
  self.animationFrame = 0
  particleSetup(self)
}

export function newPlasmaExplosion(world, entity, x, y, z) {
  let particle = world.newParticle(x, y, z)
  plasmaExplosionInit(particle, entity)
  return particle
}
