/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export class Sprite {
  constructor(left, top, width, height, offsetX, offsetY, sheetWidth, sheetHeight, scale) {
    this.left = left * sheetWidth
    this.top = top * sheetHeight
    this.right = (left + width) * sheetWidth
    this.bottom = (top + height) * sheetHeight
    this.width = width * scale
    this.height = height * scale
    this.halfWidth = 0.5 * width * scale
    this.offsetX = offsetX * scale
    this.offsetY = offsetY * scale
  }
}
