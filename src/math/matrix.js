const temp = new Float32Array(16)
const copy = new Float32Array(16)

export function identity(matrix) {
  matrix[0] = 1.0
  matrix[1] = 0.0
  matrix[2] = 0.0
  matrix[3] = 0.0

  matrix[4] = 0.0
  matrix[5] = 1.0
  matrix[6] = 0.0
  matrix[7] = 0.0

  matrix[8] = 0.0
  matrix[9] = 0.0
  matrix[10] = 1.0
  matrix[11] = 0.0

  matrix[12] = 0.0
  matrix[13] = 0.0
  matrix[14] = 0.0
  matrix[15] = 1.0
}

export function orthographic(matrix, left, right, bottom, top, near, far) {
  matrix[0] = 2.0 / (right - left)
  matrix[1] = 0.0
  matrix[2] = 0.0
  matrix[3] = 0.0

  matrix[4] = 0.0
  matrix[5] = 2.0 / (top - bottom)
  matrix[6] = 0.0
  matrix[7] = 0.0

  matrix[8] = 0.0
  matrix[9] = 0.0
  matrix[10] = -2.0 / (far - near)
  matrix[11] = 0.0

  matrix[12] = -(right + left) / (right - left)
  matrix[13] = -(top + bottom) / (top - bottom)
  matrix[14] = -(far + near) / (far - near)
  matrix[15] = 1.0
}

function frustum(matrix, left, right, bottom, top, near, far) {
  matrix[0] = (2.0 * near) / (right - left)
  matrix[1] = 0.0
  matrix[2] = 0.0
  matrix[3] = 0.0

  matrix[4] = 0.0
  matrix[5] = (2.0 * near) / (top - bottom)
  matrix[6] = 0.0
  matrix[7] = 0.0

  matrix[8] = (right + left) / (right - left)
  matrix[9] = (top + bottom) / (top - bottom)
  matrix[10] = -(far + near) / (far - near)
  matrix[11] = -1.0

  matrix[12] = 0.0
  matrix[13] = 0.0
  matrix[14] = -(2.0 * far * near) / (far - near)
  matrix[15] = 0.0
}

export function perspective(matrix, fov, near, far, aspect) {
  const top = near * Math.tan((fov * Math.PI) / 360.0)
  const bottom = -top
  const left = bottom * aspect
  const right = top * aspect

  frustum(matrix, left, right, bottom, top, near, far)
}

export function translate(matrix, x, y, z) {
  matrix[12] = x * matrix[0] + y * matrix[4] + z * matrix[8] + matrix[12]
  matrix[13] = x * matrix[1] + y * matrix[5] + z * matrix[9] + matrix[13]
  matrix[14] = x * matrix[2] + y * matrix[6] + z * matrix[10] + matrix[14]
  matrix[15] = x * matrix[3] + y * matrix[7] + z * matrix[11] + matrix[15]
}

export function translateFromView(matrix, view, x, y, z) {
  matrix[0] = view[0]
  matrix[1] = view[1]
  matrix[2] = view[2]
  matrix[3] = view[3]
  matrix[4] = view[4]
  matrix[5] = view[5]
  matrix[6] = view[6]
  matrix[7] = view[7]
  matrix[8] = view[8]
  matrix[9] = view[9]
  matrix[10] = view[10]
  matrix[11] = view[11]
  matrix[12] = x * view[0] + y * view[4] + z * view[8] + view[12]
  matrix[13] = x * view[1] + y * view[5] + z * view[9] + view[13]
  matrix[14] = x * view[2] + y * view[6] + z * view[10] + view[14]
  matrix[15] = x * view[3] + y * view[7] + z * view[11] + view[15]
}

export function multiply(matrix, a, b) {
  matrix[0] = a[0] * b[0] + a[4] * b[1] + a[8] * b[2] + a[12] * b[3]
  matrix[1] = a[1] * b[0] + a[5] * b[1] + a[9] * b[2] + a[13] * b[3]
  matrix[2] = a[2] * b[0] + a[6] * b[1] + a[10] * b[2] + a[14] * b[3]
  matrix[3] = a[3] * b[0] + a[7] * b[1] + a[11] * b[2] + a[15] * b[3]

  matrix[4] = a[0] * b[4] + a[4] * b[5] + a[8] * b[6] + a[12] * b[7]
  matrix[5] = a[1] * b[4] + a[5] * b[5] + a[9] * b[6] + a[13] * b[7]
  matrix[6] = a[2] * b[4] + a[6] * b[5] + a[10] * b[6] + a[14] * b[7]
  matrix[7] = a[3] * b[4] + a[7] * b[5] + a[11] * b[6] + a[15] * b[7]

  matrix[8] = a[0] * b[8] + a[4] * b[9] + a[8] * b[10] + a[12] * b[11]
  matrix[9] = a[1] * b[8] + a[5] * b[9] + a[9] * b[10] + a[13] * b[11]
  matrix[10] = a[2] * b[8] + a[6] * b[9] + a[10] * b[10] + a[14] * b[11]
  matrix[11] = a[3] * b[8] + a[7] * b[9] + a[11] * b[10] + a[15] * b[11]

  matrix[12] = a[0] * b[12] + a[4] * b[13] + a[8] * b[14] + a[12] * b[15]
  matrix[13] = a[1] * b[12] + a[5] * b[13] + a[9] * b[14] + a[13] * b[15]
  matrix[14] = a[2] * b[12] + a[6] * b[13] + a[10] * b[14] + a[14] * b[15]
  matrix[15] = a[3] * b[12] + a[7] * b[13] + a[11] * b[14] + a[15] * b[15]
}

export function rotateX(matrix, sine, cosine) {
  temp[0] = 1.0
  temp[1] = 0.0
  temp[2] = 0.0
  temp[3] = 0.0

  temp[4] = 0.0
  temp[5] = cosine
  temp[6] = sine
  temp[7] = 0.0

  temp[8] = 0.0
  temp[9] = -sine
  temp[10] = cosine
  temp[11] = 0.0

  temp[12] = 0.0
  temp[13] = 0.0
  temp[14] = 0.0
  temp[15] = 1.0

  for (let i = 0; i < 16; i++) copy[i] = matrix[i]

  multiply(matrix, copy, temp)
}

export function rotateY(matrix, sine, cosine) {
  temp[0] = cosine
  temp[1] = 0.0
  temp[2] = -sine
  temp[3] = 0.0

  temp[4] = 0.0
  temp[5] = 1.0
  temp[6] = 0.0
  temp[7] = 0.0

  temp[8] = sine
  temp[9] = 0.0
  temp[10] = cosine
  temp[11] = 0.0

  temp[12] = 0.0
  temp[13] = 0.0
  temp[14] = 0.0
  temp[15] = 1.0

  for (let i = 0; i < 16; i++) copy[i] = matrix[i]

  multiply(matrix, copy, temp)
}

export function rotateZ(matrix, sine, cosine) {
  temp[0] = cosine
  temp[1] = sine
  temp[2] = 0.0
  temp[3] = 0.0

  temp[4] = -sine
  temp[5] = cosine
  temp[6] = 0.0
  temp[7] = 0.0

  temp[8] = 0.0
  temp[9] = 0.0
  temp[10] = 1.0
  temp[11] = 0.0

  temp[12] = 0.0
  temp[13] = 0.0
  temp[14] = 0.0
  temp[15] = 1.0

  for (let i = 0; i < 16; i++) copy[i] = matrix[i]

  multiply(matrix, copy, temp)
}

export function setTranslation(matrix, x, y, z) {
  matrix[12] = x
  matrix[13] = y
  matrix[14] = z
}

export function matrixInverse(matrix, from) {
  copy[0] = from[10] * from[15]
  copy[1] = from[11] * from[14]
  copy[2] = from[9] * from[15]
  copy[3] = from[11] * from[13]
  copy[4] = from[9] * from[14]
  copy[5] = from[10] * from[13]
  copy[6] = from[8] * from[15]
  copy[7] = from[11] * from[12]
  copy[8] = from[8] * from[14]
  copy[9] = from[10] * from[12]
  copy[10] = from[8] * from[13]
  copy[11] = from[9] * from[12]

  temp[0] = copy[0] * from[5] + copy[3] * from[6] + copy[4] * from[7]
  temp[0] -= copy[1] * from[5] + copy[2] * from[6] + copy[5] * from[7]
  temp[1] = copy[1] * from[4] + copy[6] * from[6] + copy[9] * from[7]
  temp[1] -= copy[0] * from[4] + copy[7] * from[6] + copy[8] * from[7]
  temp[2] = copy[2] * from[4] + copy[7] * from[5] + copy[10] * from[7]
  temp[2] -= copy[3] * from[4] + copy[6] * from[5] + copy[11] * from[7]
  temp[3] = copy[5] * from[4] + copy[8] * from[5] + copy[11] * from[6]
  temp[3] -= copy[4] * from[4] + copy[9] * from[5] + copy[10] * from[6]
  temp[4] = copy[1] * from[1] + copy[2] * from[2] + copy[5] * from[3]
  temp[4] -= copy[0] * from[1] + copy[3] * from[2] + copy[4] * from[3]
  temp[5] = copy[0] * from[0] + copy[7] * from[2] + copy[8] * from[3]
  temp[5] -= copy[1] * from[0] + copy[6] * from[2] + copy[9] * from[3]
  temp[6] = copy[3] * from[0] + copy[6] * from[1] + copy[11] * from[3]
  temp[6] -= copy[2] * from[0] + copy[7] * from[1] + copy[10] * from[3]
  temp[7] = copy[4] * from[0] + copy[9] * from[1] + copy[10] * from[2]
  temp[7] -= copy[5] * from[0] + copy[8] * from[1] + copy[11] * from[2]

  copy[0] = from[2] * from[7]
  copy[1] = from[3] * from[6]
  copy[2] = from[1] * from[7]
  copy[3] = from[3] * from[5]
  copy[4] = from[1] * from[6]
  copy[5] = from[2] * from[5]
  copy[6] = from[0] * from[7]
  copy[7] = from[3] * from[4]
  copy[8] = from[0] * from[6]
  copy[9] = from[2] * from[4]
  copy[10] = from[0] * from[5]
  copy[11] = from[1] * from[4]

  temp[8] = copy[0] * from[13] + copy[3] * from[14] + copy[4] * from[15]
  temp[8] -= copy[1] * from[13] + copy[2] * from[14] + copy[5] * from[15]
  temp[9] = copy[1] * from[12] + copy[6] * from[14] + copy[9] * from[15]
  temp[9] -= copy[0] * from[12] + copy[7] * from[14] + copy[8] * from[15]
  temp[10] = copy[2] * from[12] + copy[7] * from[13] + copy[10] * from[15]
  temp[10] -= copy[3] * from[12] + copy[6] * from[13] + copy[11] * from[15]
  temp[11] = copy[5] * from[12] + copy[8] * from[13] + copy[11] * from[14]
  temp[11] -= copy[4] * from[12] + copy[9] * from[13] + copy[10] * from[14]
  temp[12] = copy[2] * from[10] + copy[5] * from[11] + copy[1] * from[9]
  temp[12] -= copy[4] * from[11] + copy[0] * from[9] + copy[3] * from[10]
  temp[13] = copy[8] * from[11] + copy[0] * from[8] + copy[7] * from[10]
  temp[13] -= copy[6] * from[10] + copy[9] * from[11] + copy[1] * from[8]
  temp[14] = copy[6] * from[9] + copy[11] * from[11] + copy[3] * from[8]
  temp[14] -= copy[10] * from[11] + copy[2] * from[8] + copy[7] * from[9]
  temp[15] = copy[10] * from[10] + copy[4] * from[8] + copy[9] * from[9]
  temp[15] -= copy[8] * from[9] + copy[11] * from[10] + copy[5] * from[8]

  const det = 1.0 / (from[0] * temp[0] + from[1] * temp[1] + from[2] * temp[2] + from[3] * temp[3])

  for (let i = 0; i < 16; i++) matrix[i] = temp[i] * det
}

export function transpose(matrix, from) {
  matrix[0] = from[0]
  matrix[4] = from[1]
  matrix[8] = from[2]
  matrix[12] = from[3]

  matrix[1] = from[4]
  matrix[5] = from[5]
  matrix[9] = from[6]
  matrix[13] = from[7]

  matrix[2] = from[8]
  matrix[6] = from[9]
  matrix[10] = from[10]
  matrix[14] = from[11]

  matrix[3] = from[12]
  matrix[7] = from[13]
  matrix[11] = from[14]
  matrix[15] = from[15]
}

export function multiplyVector3(out, matrix, vec) {
  out[0] = vec[0] * matrix[0] + vec[1] * matrix[4] + vec[2] * matrix[8] + matrix[12]
  out[1] = vec[0] * matrix[1] + vec[1] * matrix[5] + vec[2] * matrix[9] + matrix[13]
  out[2] = vec[0] * matrix[2] + vec[1] * matrix[6] + vec[2] * matrix[10] + matrix[14]
}

export function multiplyVector4(out, matrix, vec) {
  out[0] = vec[0] * matrix[0] + vec[1] * matrix[4] + vec[2] * matrix[8] + vec[3] * matrix[12]
  out[1] = vec[0] * matrix[1] + vec[1] * matrix[5] + vec[2] * matrix[9] + vec[3] * matrix[13]
  out[2] = vec[0] * matrix[2] + vec[1] * matrix[6] + vec[2] * matrix[10] + vec[3] * matrix[14]
  out[3] = vec[0] * matrix[3] + vec[1] * matrix[7] + vec[2] * matrix[11] + vec[3] * matrix[15]
}

export function lookAt(matrix, eye, center) {
  let forwardX = center[0] - eye[0]
  let forwardY = center[1] - eye[1]
  let forwardZ = center[2] - eye[2]

  const magnitude = Math.sqrt(forwardX * forwardX + forwardY * forwardY + forwardZ * forwardZ)
  const multiple = 1.0 / magnitude
  forwardX *= multiple
  forwardY *= multiple
  forwardZ *= multiple

  const anyX = 0.0
  const anyY = 1.0
  const anyZ = 0.0

  const sideX = forwardY * anyZ - forwardZ * anyY
  const sideY = forwardZ * anyX - forwardX * anyZ
  const sideZ = forwardX * anyY - forwardY * anyX

  const upX = sideY * forwardZ - sideZ * forwardY
  const upY = sideZ * forwardX - sideX * forwardZ
  const upZ = sideX * forwardY - sideY * forwardX

  matrix[0] = sideX
  matrix[4] = sideY
  matrix[8] = sideZ
  matrix[12] = 0.0

  matrix[1] = upX
  matrix[5] = upY
  matrix[9] = upZ
  matrix[13] = 0.0

  matrix[2] = -forwardX
  matrix[6] = -forwardY
  matrix[10] = -forwardZ
  matrix[14] = 0.0

  matrix[3] = 0.0
  matrix[7] = 0.0
  matrix[11] = 0.0
  matrix[15] = 1.0
}
