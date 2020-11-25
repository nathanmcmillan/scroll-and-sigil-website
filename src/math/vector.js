const FLOAT_PRECISION = 0.00000001

export class Float {
  static eq(x, y) {
    return Math.abs(x - y) < FLOAT_PRECISION
  }

  static zero(x) {
    return Math.abs(x) < FLOAT_PRECISION
  }
}

export class Vector2 {
  constructor(x, y) {
    this.x = x
    this.y = y
  }

  eq(b) {
    return Float.eq(this.x, b.x) && Float.eq(this.y, b.y)
  }

  normal(b) {
    let x = this.y - b.y
    let y = -(this.x - b.x)
    let magnitude = Math.sqrt(x * x + y * y)
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
    return Float.eq(this.x, b.x) && Float.eq(this.y, b.y) && Float.eq(this.z, b.z)
  }

  normalize() {
    let magnitude = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
    let multiple = 1.0 / magnitude
    this.x *= multiple
    this.y *= multiple
    this.z *= multiple
  }

  cross(b) {
    return new Vector3(this.y * b.z - this.z * b.y, this.z * b.x - this.x * b.z, this.x * b.y - this.y * b.x)
  }
}

export function lineIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
  let a1 = by - ay
  let b1 = ax - bx
  let c1 = bx * ay - ax * by
  let r3 = a1 * cx + b1 * cy + c1
  let r4 = a1 * dx + b1 * dy + c1
  if (!Float.zero(r3) && !Float.zero(r4) && r3 * r4 >= 0.0) return false
  let a2 = dy - cy
  let b2 = cx - dx
  let c2 = dx * cy - cx * dy
  let r1 = a2 * ax + b2 * ay + c2
  let r2 = a2 * bx + b2 * by + c2
  if (!Float.zero(r1) && !Float.zero(r2) && r1 * r2 >= 0.0) return false
  let denominator = a1 * b2 - a2 * b1
  return !Float.zero(denominator)
}

export function lineIntersectAt(out, ax, ay, bx, by, cx, cy, dx, dy) {
  let a1 = by - ay
  let a2 = dy - cy
  let a3 = bx - ax
  let a4 = ay - cy
  let a5 = ax - cx
  let a6 = dx - cx
  let div = a2 * a3 - a6 * a1
  let uA = (a6 * a4 - a2 * a5) / div
  if (uA < 0.0 || uA > 1.0) return false
  let uB = (a3 * a4 - a1 * a5) / div
  if (uB < 0.0 || uB > 1.0) return false
  out[0] = ax + uA * a3
  out[1] = ay + uA * a1
  return true
}

export function normalize(a) {
  let magnitude = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2])
  let multiple = 1.0 / magnitude
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
