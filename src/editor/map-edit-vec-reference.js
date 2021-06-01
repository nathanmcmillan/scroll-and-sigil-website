/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { floatEq, prettier } from '../math/vector.js'

export class VectorReference {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.index = 0
  }

  eq(b) {
    return floatEq(this.x, b.x) && floatEq(this.y, b.y)
  }

  normal(b) {
    const x = this.y - b.y
    const y = -(this.x - b.x)
    const magnitude = Math.sqrt(x * x + y * y)
    return new VectorReference(x / magnitude, y / magnitude)
  }

  angle(b) {
    let angle = Math.atan2(this.y - b.y, this.x - b.x)
    if (angle < 0.0) angle += 2.0 * Math.PI
    return angle
  }

  export() {
    return `{x=${prettier(this.x, 4)} z=${prettier(this.y, 4)}}`
  }
}
