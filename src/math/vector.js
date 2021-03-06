/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

const FLOAT_PRECISION = 0.00000001

export function floatEq(x, y) {
  return Math.abs(x - y) < FLOAT_PRECISION
}

export function floatZero(x) {
  return Math.abs(x) < FLOAT_PRECISION
}

export function prettier(str, dec) {
  return str.toFixed(dec).replace(/\.?0*$/, '')
}

export class Vector2 {
  constructor(x, y) {
    this.x = x
    this.y = y
  }

  eq(b) {
    return floatEq(this.x, b.x) && floatEq(this.y, b.y)
  }

  normal(b) {
    const x = this.y - b.y
    const y = -(this.x - b.x)
    const magnitude = Math.sqrt(x * x + y * y)
    return new Vector2(x / magnitude, y / magnitude)
  }

  angle(b) {
    let angle = Math.atan2(this.y - b.y, this.x - b.x)
    if (angle < 0.0) angle += 2.0 * Math.PI
    return angle
  }
}

export class Vector3 {
  constructor(x, y, z) {
    this.x = x
    this.y = y
    this.z = z
  }

  eq(b) {
    return floatEq(this.x, b.x) && floatEq(this.y, b.y) && floatEq(this.z, b.z)
  }

  normalize() {
    const magnitude = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
    const multiple = 1.0 / magnitude
    this.x *= multiple
    this.y *= multiple
    this.z *= multiple
  }

  cross(b) {
    return new Vector3(this.y * b.z - this.z * b.y, this.z * b.x - this.x * b.z, this.x * b.y - this.y * b.x)
  }
}

export function lineIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
  const a1 = by - ay
  const b1 = ax - bx
  const c1 = bx * ay - ax * by
  const r3 = a1 * cx + b1 * cy + c1
  const r4 = a1 * dx + b1 * dy + c1
  if (!floatZero(r3) && !floatZero(r4) && r3 * r4 >= 0.0) return false
  const a2 = dy - cy
  const b2 = cx - dx
  const c2 = dx * cy - cx * dy
  const r1 = a2 * ax + b2 * ay + c2
  const r2 = a2 * bx + b2 * by + c2
  if (!floatZero(r1) && !floatZero(r2) && r1 * r2 >= 0.0) return false
  const denominator = a1 * b2 - a2 * b1
  return !floatZero(denominator)
}

export function lineIntersectAt(out, ax, ay, bx, by, cx, cy, dx, dy) {
  const a1 = by - ay
  const a2 = dy - cy
  const a3 = bx - ax
  const a4 = ay - cy
  const a5 = ax - cx
  const a6 = dx - cx
  const div = a2 * a3 - a6 * a1
  const uA = (a6 * a4 - a2 * a5) / div
  if (uA < 0.0 || uA > 1.0) return false
  const uB = (a3 * a4 - a1 * a5) / div
  if (uB < 0.0 || uB > 1.0) return false
  out[0] = ax + uA * a3
  out[1] = ay + uA * a1
  return true
}

export function normalize(a) {
  const magnitude = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2])
  const multiple = 1.0 / magnitude
  a[0] *= multiple
  a[1] *= multiple
  a[2] *= multiple
}

export function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

export function cross(out, a, b) {
  out[0] = a[1] * b[2] - a[2] * b[1]
  out[1] = a[2] * b[0] - a[0] * b[2]
  out[2] = a[0] * b[1] - a[1] * b[0]
}
