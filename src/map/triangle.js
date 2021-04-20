/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export class Triangle {
  constructor(height, texture, a, b, c, floor, scale) {
    this.height = height
    this.texture = texture
    this.a = a
    this.b = b
    this.c = c
    this.uv = [a.x * scale, a.y * scale, b.x * scale, b.y * scale, c.x * scale, c.y * scale]
    this.normal = floor ? 1.0 : -1.0
  }
}
