export class Buffer {
  constructor(position, color, texture, normal, vertices, indices) {
    this.position = position
    this.color = color
    this.texture = texture
    this.normal = normal
    this.indexOffset = 0
    this.indexPosition = 0
    this.vertexPosition = 0
    this.vertices = new Float32Array(vertices * (position + color + texture + normal))
    this.indices = new Uint32Array(indices)
    this.vao = null
    this.vbo = null
    this.ebo = null
  }

  zero() {
    this.indexOffset = 0
    this.indexPosition = 0
    this.vertexPosition = 0
  }
}
