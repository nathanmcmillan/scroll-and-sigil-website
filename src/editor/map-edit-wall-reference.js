export class WallReference {
  constructor(texture) {
    this.a = null
    this.b = null
    this.normal = null
    this.texture = texture
    this.offset = 0
    this.floor = 0.0
    this.ceiling = 0.0
    this.u = 0.0
    this.v = 0.0
    this.s = 0.0
    this.t = 0.0
  }

  valid() {
    return this.a && this.b && this.texture && this.floor < this.ceiling
  }

  use() {
    return this.texture
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
    this.normal = a.normal(b)
  }

  textureName() {
    return this.use() ? this.texture : 'none'
  }

  static transfer(src, dest) {
    dest.floor = src.floor
    dest.ceiling = src.ceiling
    dest.u = src.u
    dest.v = src.v
    dest.s = src.s
    dest.t = src.t
  }
}
