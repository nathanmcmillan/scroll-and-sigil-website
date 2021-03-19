import { entityByName } from '../assets/assets.js'
import { atan2, cos, sin } from '../math/approximate.js'
import { newBlood } from '../particle/blood.js'

export function redBloodTowards(thing, other) {
  const tau = 2.0 * Math.PI
  const angle = atan2(other.z - thing.z, other.x - thing.x)
  for (let i = 0; i < 20; i++) {
    const theta = tau * Math.random()
    const x = thing.x + thing.box * cos(theta)
    const z = thing.z + thing.box * sin(theta)
    const y = thing.y + thing.height * Math.random()
    const towards = angle - 0.2 + 0.4 * Math.random()
    const spread = 0.1 + 0.12 * Math.random()
    const dx = spread * cos(towards)
    const dz = spread * sin(towards)
    const dy = spread * Math.random()
    newBlood(thing.world, entityByName('blood'), x, y, z, dx, dy, dz)
  }
}

export function redBloodExplode(thing) {
  const tau = 2.0 * Math.PI
  for (let i = 0; i < 20; i++) {
    const theta = tau * Math.random()
    const x = thing.x + thing.box * cos(theta)
    const z = thing.z + thing.box * sin(theta)
    const y = thing.y + thing.height * Math.random()
    const spread = 0.1 + 0.12 * Math.random()
    const dx = spread * cos(theta)
    const dz = spread * sin(theta)
    const dy = spread * Math.random()
    newBlood(thing.world, entityByName('blood'), x, y, z, dx, dy, dz)
  }
}
