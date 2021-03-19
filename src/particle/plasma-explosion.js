import { particleSetup, particleUpdateAnimation } from '../particle/particle.js'
import { ANIMATION_DONE, worldNewParticle } from '../world/world.js'

function plasmaExplosionUpdate() {
  if (particleUpdateAnimation(this) === ANIMATION_DONE) return true
  this.stamp = this.animation[this.animationFrame]
  return false
}

function plasmaExplosionInit(particle, entity) {
  particle.update = plasmaExplosionUpdate
  particle.animation = entity.stamps()
  particle.stamp = particle.animation[0]
  particle.animationMod = 0
  particle.animationFrame = 0
  particleSetup(particle)
}

export function newPlasmaExplosion(world, entity, x, y, z) {
  const particle = worldNewParticle(world, x, y, z)
  plasmaExplosionInit(particle, entity)
  return particle
}
