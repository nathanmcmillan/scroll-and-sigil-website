import { HashSet, setAdd, setClear, setIter, setIterHasNext, setIterNext } from '../collections/set.js'
import { intHashCode, Table, tableClear, tableIter, tableIterHasNext, tableIterNext, tablePut } from '../collections/table.js'

const ITERATIONS = 80000

const numbers = new Float32Array(256)
for (let i = 0; i < 256; i++) numbers[i] = Math.random()

function loopOf() {
  const perf = performance.now()
  let sum = 0.0
  for (let i = 0; i < ITERATIONS; i++) {
    for (const value of numbers) sum += value * Math.random()
  }
  console.log(sum)
  console.log('time (of)', performance.now() - perf)
}

function loopIndex() {
  const perf = performance.now()
  let sum = 0.0
  for (let i = 0; i < ITERATIONS; i++) {
    for (let n = 0; n < numbers.length; n++) sum += numbers[n] * Math.random()
  }
  console.log(sum)
  console.log('time (index)', performance.now() - perf)
}

function randomInt(number) {
  return Math.floor(Math.random() * number)
}

function builtinMap() {
  const perf = performance.now()
  const map = new Map()
  let sum = 0.0
  for (let i = 0; i < ITERATIONS; i++) {
    map.clear()
    for (let n = 0; n < numbers.length; n++) map.set(randomInt(128), Math.random())
    for (const value of map.values()) sum += value
  }
  console.log(sum)
  console.log('time (map)', performance.now() - perf)
}

function customTable() {
  const perf = performance.now()
  const table = new Table(intHashCode)
  let sum = 0.0
  for (let i = 0; i < ITERATIONS; i++) {
    tableClear(table)
    for (let n = 0; n < numbers.length; n++) tablePut(table, randomInt(128), Math.random())
    const iter = tableIter(table)
    while (tableIterHasNext(iter)) sum += tableIterNext(iter).value
  }
  console.log(sum)
  console.log('time (table)', performance.now() - perf)
}

function builtinSet() {
  const perf = performance.now()
  const set = new Set()
  let sum = 0.0
  for (let i = 0; i < ITERATIONS; i++) {
    set.clear()
    for (let n = 0; n < numbers.length; n++) set.add(randomInt(128))
    for (const value of set) sum += value
  }
  console.log(sum)
  console.log('time (set)', performance.now() - perf)
}

function customHashSet() {
  const perf = performance.now()
  const set = new HashSet(intHashCode)
  let sum = 0.0
  for (let i = 0; i < ITERATIONS; i++) {
    setClear(set)
    for (let n = 0; n < numbers.length; n++) setAdd(set, randomInt(128))
    const iter = setIter(set)
    while (setIterHasNext(iter)) sum += setIterNext(iter)
  }
  console.log(sum)
  console.log('time (hash set)', performance.now() - perf)
}

function builtinArray() {
  const iterations = 80000 * 2
  const perf = performance.now()
  const array = []
  let sum = 0.0
  for (let i = 0; i < iterations; i++) {
    array.length = 0
    for (let n = 0; n < numbers.length; n++) array.push(Math.random())
    let i = array.length
    while (i--) sum += array[i]
    while (array.length > 0) array.splice(0, 1)
  }
  console.log(sum)
  console.log('time (array)', performance.now() - perf)
}

if (false) loopOf() // ~ 415 and 7,969,120 bytes
if (false) loopIndex() // ~ 72 and 0 bytes

// conclusion: for (const x of y) is terrible for performance and heap management

if (false) builtinMap() // ~ 1,860 and 7,930,912 bytes
if (false) customTable() // ~ 1,230 and 3,000 bytes | before using a 'dead' item pool it was ~ 1,223 and 11,890,368 bytes

// conclusion: custom map is faster but uses more memory on insert

if (false) builtinSet() // ~ 1,450 and 7,928,784 bytes
if (false) customHashSet() // ~ 1,110 and 10,000 bytes | before using a 'dead' item pool it was ~ 1,330 and 11,891,424 bytes

// conclusion: custom set is also faster and also uses more memory

if (true) builtinArray()
