import {newPlasmaExplosion} from '/src/particle/plasma-explosion.js'
import {playSound} from '/src/assets/sounds.js'
import {textureIndexForName, spritesByName, entityByName} from '/src/assets/assets.js'
import {missileHit, missileSetup, missileIntegrate} from '/src/missile/missile.js'

function plasmaHit(thing) {
  missileHit(this, thing)
  playSound('plasma-impact')
  newPlasmaExplosion(this.world, entityByName('plasma-explosion'), this.x, this.y, this.z)
}

function plasmaUpdate() {
  return missileIntegrate(this)
}

function plasmaInit(self, entity, dx, dy, dz, damage) {
  self.hit = plasmaHit
  self.update = plasmaUpdate
  self.box = entity.box()
  self.height = entity.height()
  self.texture = textureIndexForName(entity.get('sprite'))
  self.sprite = spritesByName(entity.get('sprite')).get(entity.get('animation'))
  self.deltaX = dx
  self.deltaY = dy
  self.deltaZ = dz
  self.damage = damage
  missileSetup(self)
}

export function newPlasma(world, entity, x, y, z, dx, dy, dz, damage) {
  let missile = world.newMissile(x, y, z)
  plasmaInit(missile, entity, dx, dy, dz, damage)
  return missile
}
