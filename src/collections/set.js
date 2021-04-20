/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

const LOAD_FACTOR = 0.8
const INITIAL_BINS = 1 << 3
const MAXIMUM_BINS = 1 << 30

class HashSetItem {
  constructor(hash, value) {
    this.hash = hash
    this.value = value
    this.next = null
  }
}

export class HashSet {
  constructor(hashfunc) {
    this.size = 0
    this.bins = INITIAL_BINS
    this.items = new Array(this.bins).fill(null)
    this.hashfunc = hashfunc
    this.iter = null
    this.dead = []
  }
}

function getBin(set, hash) {
  return (set.bins - 1) & hash
}

function mix(hash) {
  return hash ^ (hash >> 16)
}

function resize(set) {
  const binsOld = set.bins
  const bins = binsOld << 1

  if (bins > MAXIMUM_BINS) return

  const itemsOld = set.items
  const items = new Array(bins).fill(null)
  for (let i = 0; i < binsOld; i++) {
    let item = itemsOld[i]
    if (item === null) continue
    if (item.next === null) {
      items[(bins - 1) & item.hash] = item
    } else {
      let lowHead = null
      let lowTail = null
      let highHead = null
      let highTail = null
      do {
        if ((binsOld & item.hash) === 0) {
          if (lowTail === null) lowHead = item
          else lowTail.next = item
          lowTail = item
        } else {
          if (highTail === null) highHead = item
          else highTail.next = item
          highTail = item
        }
        item = item.next
      } while (item !== null)

      if (lowTail !== null) {
        lowTail.next = null
        items[i] = lowHead
      }

      if (highTail !== null) {
        highTail.next = null
        items[i + binsOld] = highHead
      }
    }
  }

  set.bins = bins
  set.items = items
}

function pool(set, hash, value) {
  if (set.dead.length === 0) return new HashSetItem(hash, value)
  const item = set.dead.pop()
  item.hash = hash
  item.value = value
  return item
}

function recycle(set, item) {
  item.value = null
  item.next = null
  set.dead.push(item)
}

export function setAdd(set, value) {
  const hash = mix(set.hashfunc(value))
  const bin = getBin(set, hash)
  let item = set.items[bin]
  let previous = null
  while (item !== null) {
    if (hash === item.hash && value === item.value) return
    previous = item
    item = item.next
  }
  item = pool(set, hash, value)
  if (previous === null) set.items[bin] = item
  else previous.next = item
  set.size++
  if (set.size > set.bins * LOAD_FACTOR) resize(set)
}

export function setHas(set, value) {
  const hash = mix(set.hashfunc(value))
  const bin = getBin(set, hash)
  let item = set.items[bin]
  while (item !== null) {
    if (hash === item.hash && value === item.value) return true
    item = item.next
  }
  return false
}

export function setRemove(set, value) {
  const hash = mix(set.hashfunc(value))
  const bin = getBin(set, hash)
  let item = set.items[bin]
  let previous = null
  while (item !== null) {
    if (hash === item.hash && value === item.value) {
      if (previous === null) set.items[bin] = item.next
      else previous.next = item.next
      set.size--
      const value = item.value
      recycle(set, item)
      return value
    }
    previous = item
    item = item.next
  }
  return null
}

export function setClear(set) {
  const bins = set.bins
  for (let i = 0; i < bins; i++) {
    let item = set.items[i]
    while (item !== null) {
      const next = item.next
      recycle(set, item)
      item = next
    }
    set.items[i] = null
  }
  set.size = 0
}

export function setIsEmpty(set) {
  return set.size === 0
}

export function setNotEmpty(set) {
  return set.size !== 0
}

export function setSize(set) {
  return set.size
}

export class SetIterator {
  constructor(set) {
    this.pointer = set
    this.bin = 0
    this.item = null
    setIterStart(this)
  }
}

export function setIter(set) {
  if (set.iter === null) set.iter = new SetIterator(set)
  else setIterStart(set.iter)
  return set.iter
}

export function setIterStart(iter) {
  const set = iter.pointer
  iter.bin = 0
  iter.item = null
  if (set.size !== 0) {
    const bins = set.bins
    for (let i = 0; i < bins; i++) {
      const start = set.items[i]
      if (start !== null) {
        iter.bin = i
        iter.item = start
        break
      }
    }
  }
}

export function setIterHasNext(iter) {
  return iter.item !== null
}

export function setIterNext(iter) {
  let item = iter.item
  if (item === null) return null
  const result = item.value
  item = item.next
  if (item === null) {
    let bin = iter.bin + 1
    const stop = iter.pointer.bins
    while (bin < stop) {
      const start = iter.pointer.items[bin]
      if (start !== null) {
        item = start
        break
      }
      bin++
    }
    iter.bin = bin
  }
  iter.item = item
  return result
}
