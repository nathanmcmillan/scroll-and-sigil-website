const ITERATIONS = 100000

function testA() {
  let perf = performance.now()
  let sum = 0.0
  let matrix = new Float64Array(16)
  for (let i = 0; i < ITERATIONS; i++) {
    identityA(matrix)
    rotateA(matrix, Math.random(), Math.random())
    for (let i = 0; i < 16; i++) sum += matrix[i]
  }
  console.log(sum)
  console.log('time (float 64 array)', performance.now() - perf)
}

function testB() {
  let perf = performance.now()
  let sum = 0.0
  let matrix = new Float32Array(16)
  for (let i = 0; i < ITERATIONS; i++) {
    identityB(matrix)
    rotateB(matrix, Math.random(), Math.random())
    for (let i = 0; i < 16; i++) sum += matrix[i]
  }
  console.log(sum)
  console.log('time (float 32 array)', performance.now() - perf)
}

function testC() {
  let perf = performance.now()
  let sum = 0.0
  let matrix = new Array(16)
  for (let i = 0; i < ITERATIONS; i++) {
    identityC(matrix)
    rotateC(matrix, Math.random(), Math.random())
    for (let i = 0; i < 16; i++) sum += matrix[i]
  }
  console.log(sum)
  console.log('time (untyped array)', performance.now() - perf)
}

function testD() {
  let perf = performance.now()
  let sum = 0.0
  let matrix = []
  for (let i = 0; i < ITERATIONS; i++) {
    identityD(matrix)
    rotateD(matrix, Math.random(), Math.random())
    for (let i = 0; i < 16; i++) sum += matrix[i]
  }
  console.log(sum)
  console.log('time (zero array)', performance.now() - perf)
}

let tempE1 = new Float32Array(16)
let tempE2 = new Float32Array(16)

function testE() {
  let perf = performance.now()
  let sum = 0.0
  let matrix = new Float32Array(16)
  for (let i = 0; i < ITERATIONS; i++) {
    identityE(matrix)
    rotateE(matrix, Math.random(), Math.random())
    for (let i = 0; i < 16; i++) sum += matrix[i]
  }
  console.log(sum)
  console.log('time (global float 32 array)', performance.now() - perf)
}

// conclusion
// global (pre-allocated) arrays of Float32Array are best

testE() // ~36
testB() // ~37
testA() // ~41
testD() // ~75
testC() // ~65

function identityA(matrix) {
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

function rotateA(matrix, sine, cosine) {
  const temp = new Float64Array(16)

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

  const copy = new Float64Array(16)
  for (let i = 0; i < 16; i++) copy[i] = matrix[i]

  multiplyA(matrix, copy, temp)
}

function multiplyA(matrix, a, b) {
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

function identityB(matrix) {
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

function rotateB(matrix, sine, cosine) {
  const temp = new Float32Array(16)

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

  const copy = new Float32Array(16)
  for (let i = 0; i < 16; i++) copy[i] = matrix[i]

  multiplyB(matrix, copy, temp)
}

function multiplyB(matrix, a, b) {
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

function identityC(matrix) {
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

function rotateC(matrix, sine, cosine) {
  const temp = new Array(16)

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

  const copy = new Array(16)
  for (let i = 0; i < 16; i++) copy[i] = matrix[i]

  multiplyC(matrix, copy, temp)
}

function multiplyC(matrix, a, b) {
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

function identityD(matrix) {
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

function rotateD(matrix, sine, cosine) {
  const temp = []

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

  const copy = []
  for (let i = 0; i < 16; i++) copy[i] = matrix[i]

  multiplyD(matrix, copy, temp)
}

function multiplyD(matrix, a, b) {
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

function identityE(matrix) {
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

function rotateE(matrix, sine, cosine) {
  tempE1[0] = 1.0
  tempE1[1] = 0.0
  tempE1[2] = 0.0
  tempE1[3] = 0.0

  tempE1[4] = 0.0
  tempE1[5] = cosine
  tempE1[6] = sine
  tempE1[7] = 0.0

  tempE1[8] = 0.0
  tempE1[9] = -sine
  tempE1[10] = cosine
  tempE1[11] = 0.0

  tempE1[12] = 0.0
  tempE1[13] = 0.0
  tempE1[14] = 0.0
  tempE1[15] = 1.0

  for (let i = 0; i < 16; i++) tempE2[i] = matrix[i]

  multiplyE(matrix, tempE2, tempE1)
}

function multiplyE(matrix, a, b) {
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
