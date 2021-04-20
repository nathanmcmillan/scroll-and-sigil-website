/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

class FlexBox {
  constructor() {
    this.width = 0
    this.height = 0
    this.topSpace = 0
    this.bottomSpace = 0
    this.leftSpace = 0
    this.rightSpace = 0
    this.funX = null
    this.funY = null
    this.argX = null
    this.argY = null
    this.fromX = null
    this.fromY = null
    this.x = 0
    this.y = 0
  }

  inside(x, y) {
    return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height
  }
}

class FlexText extends FlexBox {
  constructor() {
    super()
    this.text = ''
  }
}

const FLEX_BOX_POOL = []
const FLEX_TEXT_POOL = []

export function flexBox(width = 0, height = 0) {
  let flex
  if (FLEX_BOX_POOL.length === 0) flex = new FlexBox()
  else flex = FLEX_BOX_POOL.pop()
  flex.width = width
  flex.height = height
  return flex
}

export function flexText(text, width = 0, height = 0) {
  let flex
  if (FLEX_TEXT_POOL.length === 0) flex = new FlexText()
  else flex = FLEX_TEXT_POOL.pop()
  flex.text = text
  flex.width = width
  flex.height = height
  return flex
}

export function returnFlexBox(flex) {
  FLEX_BOX_POOL.push(flex)
}

export function returnFlexText(flex) {
  FLEX_TEXT_POOL.push(flex)
}

export function flexSolve(width, height, flex) {
  const funX = flex.funX
  if (funX !== null) {
    if (funX === 'center') {
      if (flex.fromX) {
        flex.x = Math.floor(flex.fromX.x + 0.5 * flex.fromX.width - 0.5 * flex.width)
      } else {
        flex.x = Math.floor(0.5 * width - 0.5 * flex.width)
      }
    } else if (funX === 'left-of') {
      flex.x = flex.fromX.x - flex.fromX.leftSpace - flex.width
    } else if (funX === 'right-of') {
      flex.x = flex.fromX.x + flex.fromX.width + flex.fromX.rightSpace
    } else if (funX === 'align-left') {
      flex.x = flex.fromX.x
    } else if (funX === 'align-right') {
      flex.x = flex.fromX.x + flex.fromX.width - flex.width
    } else if (funX === '%') {
      flex.x = Math.floor((parseFloat(flex.argX) / 100.0) * width)
    } else if (funX === '%-left') {
      flex.x = Math.floor((parseFloat(flex.argX) / 100.0) * width) - flex.width
    }
  } else {
    flex.x = parseFloat(flex.argX)
  }

  const funY = flex.funY
  if (funY !== null) {
    if (funY === 'center') {
      if (flex.fromY) {
        flex.y = Math.floor(flex.fromY.y + 0.5 * flex.fromY.height - 0.5 * flex.height)
      } else {
        flex.y = Math.floor(0.5 * height - 0.5 * flex.height)
      }
    } else if (funY === 'above') {
      flex.y = flex.fromY.y + flex.fromY.height + flex.fromY.topSpace
    } else if (funY === 'below') {
      flex.y = flex.fromY.y - flex.fromY.bottomSpace - flex.height
    } else if (funY === 'align-top') {
      flex.y = flex.fromY.y + flex.fromY.height - flex.height
    } else if (funY === 'align-bottom') {
      flex.y = flex.fromY.y
    } else if (funY === '%') {
      flex.y = Math.floor((parseFloat(flex.argY) / 100.0) * height)
    } else if (funY === '%-below') {
      flex.y = Math.floor((parseFloat(flex.argY) / 100.0) * height) - flex.height
    }
  } else {
    flex.y = parseFloat(flex.argY)
  }
}

export function flexSize(list) {
  let x = Number.MAX_VALUE
  let y = Number.MAX_VALUE
  let right = 0
  let bottom = 0
  for (let f = 0; f < list.length; f++) {
    const flex = list[f]
    if (flex.x < x) x = flex.x
    if (flex.y < y) y = flex.y
    if (flex.x + flex.width > right) right = flex.x + flex.width
    if (flex.y + flex.height > bottom) bottom = flex.y + flex.height
  }
  return [x, y, right - x, bottom - y]
}
