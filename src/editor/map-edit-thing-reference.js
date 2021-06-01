/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { flagsExport } from '../world/flags.js'
import { triggerExport } from '../world/trigger.js'

export class ThingReference {
  constructor(entity, x, z, flags, trigger) {
    this.x = x
    this.y = 0.0
    this.z = z
    this.entity = null
    this.flags = flags
    this.trigger = trigger
    this.setEntity(entity)
  }

  setEntity(entity) {
    this.entity = entity
    this.box = entity.box()
    this.height = entity.height()
    if (entity.has('sprite')) this.stamp = entity.stamp()
    else {
      const stamps = entity.stamps()
      if (Array.isArray(stamps)) this.stamp = stamps[0]
      else this.stamp = stamps.values().next().value[0]
    }
  }

  export() {
    let content = `{x=${this.x} z=${this.z} id=${this.entity.id()}`
    if (this.flags) content += ` flags${flagsExport(this.flags)}`
    if (this.trigger) content += ` trigger${triggerExport(this.trigger)}`
    content += '}'
    return content
  }
}
