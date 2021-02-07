import {index3, index4} from '../render/render.js'

export function drawWall(b, wall) {
  let pos = b.vertexPosition
  let vertices = b.vertices

  vertices[pos] = wall.a.x
  vertices[pos + 1] = wall.ceiling
  vertices[pos + 2] = wall.a.y
  vertices[pos + 3] = wall.u
  vertices[pos + 4] = wall.t
  vertices[pos + 5] = wall.normal.x
  vertices[pos + 6] = 0.0
  vertices[pos + 7] = wall.normal.y

  vertices[pos + 8] = wall.a.x
  vertices[pos + 9] = wall.floor
  vertices[pos + 10] = wall.a.y
  vertices[pos + 11] = wall.u
  vertices[pos + 12] = wall.v
  vertices[pos + 13] = wall.normal.x
  vertices[pos + 14] = 0.0
  vertices[pos + 15] = wall.normal.y

  vertices[pos + 16] = wall.b.x
  vertices[pos + 17] = wall.floor
  vertices[pos + 18] = wall.b.y
  vertices[pos + 19] = wall.s
  vertices[pos + 20] = wall.v
  vertices[pos + 21] = wall.normal.x
  vertices[pos + 22] = 0.0
  vertices[pos + 23] = wall.normal.y

  vertices[pos + 24] = wall.b.x
  vertices[pos + 25] = wall.ceiling
  vertices[pos + 26] = wall.b.y
  vertices[pos + 27] = wall.s
  vertices[pos + 28] = wall.t
  vertices[pos + 29] = wall.normal.x
  vertices[pos + 30] = 0.0
  vertices[pos + 31] = wall.normal.y

  b.vertexPosition = pos + 32
  index4(b)
}

export function drawFloorCeil(b, triangle) {
  let pos = b.vertexPosition
  let vertices = b.vertices

  vertices[pos] = triangle.c.x
  vertices[pos + 1] = triangle.height
  vertices[pos + 2] = triangle.c.y
  vertices[pos + 3] = triangle.uv[4]
  vertices[pos + 4] = triangle.uv[5]
  vertices[pos + 5] = 0.0
  vertices[pos + 6] = triangle.normal
  vertices[pos + 7] = 0.0

  vertices[pos + 8] = triangle.b.x
  vertices[pos + 9] = triangle.height
  vertices[pos + 10] = triangle.b.y
  vertices[pos + 11] = triangle.uv[2]
  vertices[pos + 12] = triangle.uv[3]
  vertices[pos + 13] = 0.0
  vertices[pos + 14] = triangle.normal
  vertices[pos + 15] = 0.0

  vertices[pos + 16] = triangle.a.x
  vertices[pos + 17] = triangle.height
  vertices[pos + 18] = triangle.a.y
  vertices[pos + 19] = triangle.uv[0]
  vertices[pos + 20] = triangle.uv[1]
  vertices[pos + 21] = 0.0
  vertices[pos + 22] = triangle.normal
  vertices[pos + 23] = 0.0

  b.vertexPosition = pos + 24
  index3(b)
}

export function drawDecal(b, decal) {
  let pos = b.vertexPosition
  let vertices = b.vertices

  vertices[pos] = decal.x1
  vertices[pos + 1] = decal.y1
  vertices[pos + 2] = decal.z1
  vertices[pos + 3] = decal.u1
  vertices[pos + 4] = decal.v1
  vertices[pos + 5] = decal.nx
  vertices[pos + 6] = decal.ny
  vertices[pos + 7] = decal.nz

  vertices[pos + 8] = decal.x2
  vertices[pos + 9] = decal.y2
  vertices[pos + 10] = decal.z2
  vertices[pos + 11] = decal.u2
  vertices[pos + 12] = decal.v2
  vertices[pos + 13] = decal.nx
  vertices[pos + 14] = decal.ny
  vertices[pos + 15] = decal.nz

  vertices[pos + 16] = decal.x3
  vertices[pos + 17] = decal.y3
  vertices[pos + 18] = decal.z3
  vertices[pos + 19] = decal.u3
  vertices[pos + 20] = decal.v3
  vertices[pos + 21] = decal.nx
  vertices[pos + 22] = decal.ny
  vertices[pos + 23] = decal.nz

  vertices[pos + 24] = decal.x4
  vertices[pos + 25] = decal.y4
  vertices[pos + 26] = decal.z4
  vertices[pos + 27] = decal.u4
  vertices[pos + 28] = decal.v4
  vertices[pos + 29] = decal.nx
  vertices[pos + 30] = decal.ny
  vertices[pos + 31] = decal.nz

  b.vertexPosition = pos + 32
  index4(b)
}
