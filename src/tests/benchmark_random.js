const ITERATIONS = 1800000

function randomInt(number) {
  return Math.floor(Math.random() * number)
}

let pointer = 0
const numbers = new Uint8Array(256)
for (let i = 0; i < 256; i++) numbers[i] = randomInt(256)

function randomPrecompute() {
  pointer++
  if (pointer === 256) pointer = 0
  return numbers[pointer]
}

function testMathRandom() {
  const perf = performance.now()
  let sum = 0.0
  for (let i = 0; i < ITERATIONS; i++) sum += Math.random()
  console.log(sum)
  console.log('time (math random)', performance.now() - perf)
}

function testMathRandomInteger() {
  const perf = performance.now()
  let sum = 0.0
  for (let i = 0; i < ITERATIONS; i++) sum += randomInt(Number.MIN_SAFE_INTEGER)
  console.log(sum)
  console.log('time (math random integer)', performance.now() - perf)
}

function testPrecomputeInteger() {
  const perf = performance.now()
  let sum = 0.0
  for (let i = 0; i < ITERATIONS; i++) sum += randomPrecompute()
  console.log(sum)
  console.log('time (precompute)', performance.now() - perf)
}

testMathRandom() // ~ 7
testMathRandomInteger() // ~ 6
testPrecomputeInteger() // ~ 6

// conclusion: no significant difference
