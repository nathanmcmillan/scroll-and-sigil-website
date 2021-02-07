import {newBlood} from '../particle/blood.js'
import {entityByName} from '../assets/assets.js'
import {sin, cos, atan2} from '../math/approximate.js'

export function redBloodTowards(thing, other) {
  const tau = 2.0 * Math.PI
  const angle = atan2(other.z - thing.z, other.x - thing.x)
  for (let i = 0; i < 20; i++) {
    let theta = tau * Math.random()
    let x = thing.x + thing.box * cos(theta)
    let z = thing.z + thing.box * sin(theta)
    let y = thing.y + thing.height * Math.random()
    let towards = angle - 0.2 + 0.4 * Math.random()
    let spread = 0.1 + 0.12 * Math.random()
    let dx = spread * cos(towards)
    let dz = spread * sin(towards)
    let dy = spread * Math.random()
    newBlood(thing.world, entityByName('blood'), x, y, z, dx, dy, dz)
  }
}

export function redBloodExplode(thing) {
  const tau = 2.0 * Math.PI
  for (let i = 0; i < 20; i++) {
    let theta = tau * Math.random()
    let x = thing.x + thing.box * cos(theta)
    let z = thing.z + thing.box * sin(theta)
    let y = thing.y + thing.height * Math.random()
    let spread = 0.1 + 0.12 * Math.random()
    let dx = spread * cos(theta)
    let dz = spread * sin(theta)
    let dy = spread * Math.random()
    newBlood(thing.world, entityByName('blood'), x, y, z, dx, dy, dz)
  }
}
