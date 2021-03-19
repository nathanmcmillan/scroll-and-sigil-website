import { entityByName } from '../assets/assets.js'
import { playSound } from '../assets/sounds.js'
import { missileHit, missileIntegrate, missileSetup } from '../missile/missile.js'
import { newPlasmaExplosion } from '../particle/plasma-explosion.js'
import { worldNewMissile } from '../world/world.js'

function plasmaHit(thing) {
  missileHit(this, thing)
  playSound('plasma-impact')
  newPlasmaExplosion(this.world, entityByName('plasma-explosion'), this.x, this.y, this.z)
}

function plasmaUpdate() {
  return missileIntegrate(this)
}

function plasmaInit(plasma, entity, dx, dy, dz, damage) {
  plasma.hit = plasmaHit
  plasma.update = plasmaUpdate
  plasma.box = entity.box()
  plasma.height = entity.height()
  plasma.stamp = entity.stamp()
  plasma.deltaX = dx
  plasma.deltaY = dy
  plasma.deltaZ = dz
  plasma.damage = damage
  missileSetup(plasma)
}

export function newPlasma(world, entity, x, y, z, dx, dy, dz, damage) {
  const missile = worldNewMissile(world, x, y, z)
  plasmaInit(missile, entity, dx, dy, dz, damage)
  return missile
}
