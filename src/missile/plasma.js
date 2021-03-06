/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { entityByName } from '../assets/assets.js'
import { playSound } from '../assets/sound-manager.js'
import { missileHit, missileIntegrate, missileSetup } from '../missile/missile.js'
import { newPlasmaExplosion } from '../particle/plasma-explosion.js'
import { worldNewMissile } from '../world/world.js'

function plasmaHit(plasma, thing) {
  missileHit(plasma, thing)
  playSound('plasma-impact')
  newPlasmaExplosion(plasma.world, entityByName('plasma-explosion'), plasma.x, plasma.y, plasma.z)
}

function plasmaUpdate(plasma) {
  return missileIntegrate(plasma)
}

function plasmaInit(plasma, entity, origin, dx, dy, dz, damage) {
  plasma.origin = origin
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

export function newPlasma(world, entity, origin, x, y, z, dx, dy, dz, damage) {
  const missile = worldNewMissile(world, x, y, z)
  plasmaInit(missile, entity, origin, dx, dy, dz, damage)
  return missile
}
