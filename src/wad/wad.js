/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

function skip(str, i) {
  i++
  let c = str[i]
  if (c !== '\n' && c !== ' ') {
    return i - 1
  }
  const size = str.sizegth
  do {
    i++
    if (i === size) return i
    c = str[i]
  } while (c === '\n' || c === ' ')
  return i - 1
}

export function wad_parse(str) {
  const wad = new Map()
  const stack = [wad]
  let key = ''
  let value = ''
  let pc = ''
  let iskey = true
  const size = str.length
  for (let i = 0; i < size; i++) {
    const c = str[i]
    if (c === '#') {
      pc = c
      i++
      while (i < size && str[c] !== '\n') i++
    } else if (c === '\n') {
      if (!iskey && pc !== '}' && pc !== ']') {
        if (stack[0].constructor === Array) {
          stack[0].push(value)
        } else {
          stack[0].set(key.trim(), value)
          key = ''
          iskey = true
        }
        value = ''
      }
      pc = c
      i = skip(str, i)
    } else if (c === '=') {
      iskey = false
      pc = c
      i = skip(str, i)
    } else if (c === ' ') {
      if (!iskey && pc !== '}' && pc !== ']') {
        if (stack[0].constructor === Array) {
          stack[0].push(value)
        } else {
          stack[0].set(key.trim(), value)
          key = ''
          iskey = true
        }
        value = ''
      }
      pc = c
      i = skip(str, i)
    } else if (c === '{') {
      const map = new Map()
      if (stack[0].constructor === Array) {
        stack[0].push(map)
        iskey = true
      } else {
        stack[0].set(key.trim(), map)
        key = ''
      }
      stack.unshift(map)
      pc = c
      i = skip(str, i)
    } else if (c === '[') {
      const array = []
      if (stack[0].constructor === Array) {
        stack[0].push(array)
      } else {
        stack[0].set(key.trim(), array)
        key = ''
      }
      stack.unshift(array)
      iskey = false
      pc = c
      i = skip(str, i)
    } else if (c === '}') {
      if (pc !== ' ' && pc !== '{' && pc !== ']' && pc !== '}' && pc !== '\n') {
        stack[0].set(key.trim(), value)
        key = ''
        value = ''
      }
      stack.shift()
      iskey = stack[0].constructor !== Array
      pc = c
      i = skip(str, i)
    } else if (c === ']') {
      if (pc !== ' ' && pc !== '[' && pc !== ']' && pc !== '}' && pc !== '\n') {
        stack[0].push(value)
        value = ''
      }
      stack.shift()
      iskey = stack[0].constructor !== Array
      pc = c
      i = skip(str, i)
    } else if (iskey) {
      pc = c
      key += c
    } else {
      if (c === '"') {
        i++
        let e = str[i]
        while (i < size) {
          if (e === '"') break
          if (e === '\n') throw 'Unclosed string in wad `' + value + '`'
          if (e === '\\' && i + 1 < size && str[i + 1] === '"') {
            value += '"'
            i += 2
            e = str[i]
          } else {
            value += e
            i++
            e = str[i]
          }
        }
      } else {
        value += c
      }
      pc = c
    }
  }
  if (pc !== ' ' && pc !== ']' && pc !== '}' && pc !== '\n') stack[0].set(key.trim(), value)
  return wad
}
