const pi = Math.PI
const tau = 2.0 * Math.PI
const halfpi = 0.5 * Math.PI

export function sin(x) {
  let b = 4.0 / pi
  let c = -4.0 / (pi * pi)
  if (x > pi) x -= tau
  else if (x < -pi) x += tau
  return b * x + c * x * (x < 0 ? -x : x)
}

export function cos(x) {
  return sin(x + halfpi)
}

export function atan2(y, x) {
  if (x == 0.0) {
    if (y > 0.0) return halfpi
    if (y == 0.0) return 0.0
    return -halfpi
  }
  let atan
  let z = y / x
  let abs = z < 0.0 ? -z : z
  if (abs < 1.0) {
    atan = z / (1.0 + 0.28 * z * z)
    if (x < 0.0) {
      if (y < 0.0) return atan - pi
      return atan + pi
    }
  } else {
    atan = halfpi - z / (z * z + 0.28)
    if (y < 0.0) return atan - pi
  }
  return atan
}
