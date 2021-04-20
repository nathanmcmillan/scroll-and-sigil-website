/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Thing, thingSetup } from '../thing/thing.js'

export class Item extends Thing {
  constructor(world, entity, x, z) {
    super(world, entity, x, z)
    this.box = entity.box()
    this.height = entity.height()
    this.name = entity.name()
    this.group = entity.group()
    this.stamp = entity.stamp()
    this.isPhysical = false
    this.isItem = true
    this.pickedUp = false
    thingSetup(this)
  }

  update() {
    return this.pickedUp
  }
}
