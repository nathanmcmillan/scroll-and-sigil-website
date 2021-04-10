import { entityByName } from '../assets/assets.js'
import { atan2, cos, sin } from '../math/approximate.js'
import { randomFloat } from '../math/random.js'
import { newBlood } from '../particle/blood.js'

export function redBloodTowards(thing, other) {
  if (other === null) {
    redBloodExplode(thing)
    return
  }
  const tau = 2.0 * Math.PI
  const angle = atan2(other.z - thing.z, other.x - thing.x)
  for (let i = 0; i < 20; i++) {
    const theta = tau * randomFloat()
    const x = thing.x + thing.box * cos(theta)
    const z = thing.z + thing.box * sin(theta)
    const y = thing.y + thing.height * randomFloat()
    const towards = angle - 0.2 + 0.4 * randomFloat()
    const spread = 0.1 + 0.12 * randomFloat()
    const dx = spread * cos(towards)
    const dz = spread * sin(towards)
    const dy = spread * randomFloat()
    newBlood(thing.world, entityByName('blood'), x, y, z, dx, dy, dz)
  }
}

export function redBloodExplode(thing) {
  const tau = 2.0 * Math.PI
  for (let i = 0; i < 20; i++) {
    const theta = tau * randomFloat()
    const x = thing.x + thing.box * cos(theta)
    const z = thing.z + thing.box * sin(theta)
    const y = thing.y + thing.height * randomFloat()
    const spread = 0.1 + 0.12 * randomFloat()
    const dx = spread * cos(theta)
    const dz = spread * sin(theta)
    const dy = spread * randomFloat()
    newBlood(thing.world, entityByName('blood'), x, y, z, dx, dy, dz)
  }
}
