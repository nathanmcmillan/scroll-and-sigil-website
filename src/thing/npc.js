/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { playSound } from '../assets/sound-manager.js'
import { cos, sin } from '../math/approximate.js'
import { redBloodExplode, redBloodTowards } from '../thing/thing-util.js'
import { Thing, thingFindSector, thingIntegrate, thingPushToCells, thingRemoveFromCells, thingSetup, thingUpdateAnimation, thingUpdateSprite } from '../thing/thing.js'
import { TRIGGER_ENTER, TRIGGER_EXIT } from '../world/trigger.js'
import { worldEventTrigger, WORLD_CELL_SHIFT } from '../world/world.js'

const STATUS_STAND = 0
const STATUS_DEAD = 1
const STATUS_FINAL = 2

let TEMP_SECTOR = null
let TEMP_FLOOR = 0.0
let TEMP_CEILING = 0.0

export class NonPlayerCharacter extends Thing {
  constructor(world, entity, x, z) {
    super(world, entity, x, z)
    this.box = entity.box()
    this.height = entity.height()
    this.name = entity.name()
    this.group = entity.group()
    this.health = entity.health()
    this.speed = entity.speed()
    this.animations = entity.stamps()
    this.animation = this.animations.get('idle')
    this.stamp = this.animation[0]
    this.target = null
    this.moveCount = 0
    this.status = STATUS_STAND
    this.reaction = 0
    this.interaction = entity.get('interaction')
    this.update = npcUpdate
    this.damage = npcDamage
    thingSetup(this)
  }
}

function npcDead(self) {
  if (self.animationFrame === self.animation.length - 1) {
    self.isPhysical = false
    self.status = STATUS_FINAL
    return
  }
  thingUpdateAnimation(self)
  thingUpdateSprite(self)
}

function npcDamage(npc, source, health) {
  if (npc.status === STATUS_DEAD || npc.status === STATUS_FINAL) return
  npc.health -= health
  if (npc.health <= 0) {
    npc.health = 0
    npc.status = STATUS_DEAD
    npc.animationFrame = 0
    npc.animation = npc.animations.get('death')
    thingUpdateSprite(npc)
    playSound('baron-death')
    redBloodExplode(npc)
  } else {
    playSound('baron-pain')
    redBloodTowards(npc, source)
  }
}

function npcUpdate(npc) {
  switch (npc.status) {
    case STATUS_DEAD:
      npcDead(npc)
      break
    case STATUS_FINAL:
      return false
  }
  thingIntegrate(npc)
  return false
}

function thingTryOverlap(self, x, z, box, thing) {
  box += thing.box
  const overlap = Math.abs(x - thing.x) <= box && Math.abs(z - thing.z) <= box
  if (overlap) {
    const previous = Math.abs(self.x - thing.x) <= box && Math.abs(self.z - thing.z) <= box
    if (previous) return self.uid < thing.uid
    return true
  }
  return false
}

function thingTryLineOverlap(self, x, z, line) {
  const box = self.box
  const vx = line.b.x - line.a.x
  const vz = line.b.y - line.a.y
  const wx = x - line.a.x
  const wz = z - line.a.y
  let t = (wx * vx + wz * vz) / (vx * vx + vz * vz)
  if (t < 0.0) t = 0.0
  else if (t > 1.0) t = 1.0
  const px = line.a.x + vx * t - x
  const pz = line.a.y + vz * t - z
  const on = px * px + pz * pz <= box * box
  if (on && !line.physical) {
    if (line.plus) {
      if (line.plus.floor > TEMP_FLOOR) {
        TEMP_SECTOR = line.plus
        TEMP_FLOOR = line.plus.floor
      }
      if (line.plus.ceiling < TEMP_CEILING) TEMP_CEILING = line.plus.ceiling
    }
    if (line.minus) {
      if (line.minus.floor > TEMP_FLOOR) {
        TEMP_SECTOR = line.minus
        TEMP_FLOOR = line.minus.floor
      }
      if (line.minus.ceiling < TEMP_CEILING) TEMP_CEILING = line.minus.ceiling
    }
    const step = 1.0
    const min = self.y + step
    const max = self.y + self.height
    if (line.plus && min > line.plus.floor && max < line.plus.ceiling) return false
    if (line.minus && min > line.minus.floor && max < line.minus.ceiling) return false
  }
  return on
}

function thingTryMove(self, x, z) {
  TEMP_SECTOR = null
  TEMP_FLOOR = -Number.MAX_VALUE
  TEMP_CEILING = Number.MAX_VALUE
  const box = self.box
  const minC = Math.floor(x - box) >> WORLD_CELL_SHIFT
  const maxC = Math.floor(x + box) >> WORLD_CELL_SHIFT
  const minR = Math.floor(z - box) >> WORLD_CELL_SHIFT
  const maxR = Math.floor(z + box) >> WORLD_CELL_SHIFT
  const world = self.world
  const columns = world.columns
  if (minC < 0 || minR < 0 || maxC >= columns || maxR >= world.rows) return false
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      const cell = world.cells[c + r * columns]
      let i = cell.thingCount
      while (i--) {
        const thing = cell.things[i]
        if (self === thing || !thing.isPhysical) continue
        if (thingTryOverlap(self, x, z, box, thing)) return false
      }
      i = cell.lines.length
      while (i--) {
        if (thingTryLineOverlap(self, x, z, cell.lines[i])) return false
      }
    }
  }
  return true
}

export function thingMove(self) {
  const x = self.x + cos(self.rotation) * self.speed
  const z = self.z + sin(self.rotation) * self.speed
  if (thingTryMove(self, x, z)) {
    thingRemoveFromCells(self)
    self.previousX = self.x
    self.previousZ = self.z
    self.x = x
    self.z = z
    thingPushToCells(self)
    if (TEMP_SECTOR === null) {
      if (self.wasOnLine) thingFindSector(self)
    } else {
      const old = self.sector
      if (TEMP_SECTOR !== old) {
        if (old && old.trigger) worldEventTrigger(self.world, TRIGGER_EXIT, old.trigger, self)
        if (TEMP_SECTOR.trigger) worldEventTrigger(self.world, TRIGGER_ENTER, TEMP_SECTOR.trigger, self)
        self.sector = TEMP_SECTOR
      }
      self.floor = TEMP_FLOOR
      self.ceiling = TEMP_CEILING
    }
    self.wasOnLine = TEMP_SECTOR !== null
    return true
  }
  return false
}
