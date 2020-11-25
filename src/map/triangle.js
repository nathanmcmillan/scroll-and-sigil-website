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
