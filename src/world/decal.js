export class Decal {
  constructor() {
    this.texture = null

    this.x1 = 0.0
    this.y1 = 0.0
    this.z1 = 0.0

    this.u1 = 0.0
    this.v1 = 0.0

    this.x2 = 0.0
    this.y2 = 0.0
    this.z2 = 0.0

    this.u2 = 0.0
    this.v2 = 0.0

    this.x3 = 0.0
    this.y3 = 0.0
    this.z3 = 0.0

    this.u3 = 0.0
    this.v3 = 0.0

    this.x4 = 0.0
    this.y4 = 0.0
    this.z4 = 0.0

    this.u4 = 0.0
    this.v4 = 0.0

    this.nx = 0.0
    this.ny = 0.0
    this.nz = 0.0
  }
}

export function decalInitialize(self, texture) {
  self.texture = texture
}
