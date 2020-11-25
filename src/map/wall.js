export class Wall {
  constructor(texture) {
    this.a = null
    this.b = null
    this.normal = null
    this.texture = texture
    this.floor = 0.0
    this.ceiling = 0.0
    this.u = 0.0
    this.v = 0.0
    this.s = 0.0
    this.t = 0.0
  }

  update(floor, ceiling, u, v, s, t, a, b) {
    this.floor = floor
    this.ceiling = ceiling
    this.u = u
    this.v = v
    this.s = s
    this.t = t
    this.a = a
    this.b = b
    this.normal = this.a.normal(this.b)
  }
}
