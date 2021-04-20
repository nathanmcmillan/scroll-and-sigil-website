/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { cellPushParticle, cellRemoveParticle } from '../world/cell.js'
import { ANIMATION_ALMOST_DONE, ANIMATION_DONE, ANIMATION_NOT_DONE, ANIMATION_RATE, worldFindSector, WORLD_CELL_SHIFT } from '../world/world.js'

export class Particle {
  constructor() {
    this.world = null
    this.sector = null
    this.x = 0.0
    this.y = 0.0
    this.z = 0.0
    this.deltaX = 0.0
    this.deltaY = 0.0
    this.deltaZ = 0.0
    this.box = 0.0
    this.height = 0.0
    this.ground = false
    this.texture = 0
    this.stamp = null
    this.minC = 0
    this.maxC = 0
    this.minR = 0
    this.maxR = 0
    this.update = null
  }
}

export function particleInitialize(self, world, x, y, z) {
  self.world = world
  self.x = x
  self.y = y
  self.z = z
}

export function particleSetup(self) {
  particlePushToCells(self)
  particleUpdateSector(self)
}

export function particlePushToCells(self) {
  const box = self.box
  let minC = Math.floor(self.x - box) >> WORLD_CELL_SHIFT
  let maxC = Math.floor(self.x + box) >> WORLD_CELL_SHIFT
  let minR = Math.floor(self.z - box) >> WORLD_CELL_SHIFT
  let maxR = Math.floor(self.z + box) >> WORLD_CELL_SHIFT

  const world = self.world
  const columns = world.columns

  if (minC < 0) minC = 0
  if (minR < 0) minR = 0
  if (maxC >= columns) maxC = columns - 1
  if (maxR >= world.rows) maxR = world.rows - 1

  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      cellPushParticle(world.cells[c + r * columns], self)
    }
  }

  self.minC = minC
  self.maxC = maxC
  self.minR = minR
  self.maxR = maxR
}

export function particleRemoveFromCells(self) {
  const world = self.world
  for (let r = self.minR; r <= self.maxR; r++) {
    for (let c = self.minC; c <= self.maxC; c++) {
      cellRemoveParticle(world.cells[c + r * world.columns], self)
    }
  }
}

export function particleUpdateSector(self) {
  self.sector = worldFindSector(self.world, self.x, self.z)
  return self.sector === null
}

export function particleUpdateAnimation(self) {
  self.animationMod++
  if (self.animationMod === ANIMATION_RATE) {
    self.animationMod = 0
    self.animationFrame++
    const frames = self.animation.length
    if (self.animationFrame === frames - 1) return ANIMATION_ALMOST_DONE
    else if (self.animationFrame === frames) return ANIMATION_DONE
  }
  return ANIMATION_NOT_DONE
}
