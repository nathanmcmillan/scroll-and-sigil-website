function skip(str, i) {
  i++
  let c = str[i]
  if (c !== '\n' && c !== ' ') {
    return i - 1
  }
  let len = str.length
  do {
    i++
    if (i === len) return i
    c = str[i]
  } while (c === '\n' || c === ' ')
  return i - 1
}

export function parse(str) {
  let wad = new Map()
  let stack = [wad]
  let key = ''
  let value = ''
  let pc = ''
  let iskey = true
  let len = str.length
  for (let i = 0; i < len; i++) {
    let c = str[i]
    if (c === '\n') {
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
    } else if (c === ':') {
      iskey = false
      pc = c
      i = skip(str, i)
    } else if (c === ',') {
      if (pc !== '}' && pc !== ']') {
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
      let map = new Map()
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
      let array = []
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
      if (pc !== ',' && pc !== '{' && pc !== ']' && pc !== '}' && pc !== '\n') {
        stack[0].set(key.trim(), value)
        key = ''
        value = ''
      }
      stack.shift()
      iskey = stack[0].constructor !== Array
      pc = c
      i = skip(str, i)
    } else if (c === ']') {
      if (pc !== ',' && pc !== '[' && pc !== ']' && pc !== '}' && pc !== '\n') {
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
      if (c === "'") {
        i++
        c = str[i]
        while (c !== "'" && i < len) {
          value += c
          i++
          c = str[i]
        }
      } else {
        value += c
      }
      pc = c
    }
  }
  if (pc !== ',' && pc !== ']' && pc !== '}' && pc !== '\n') stack[0].set(key.trim(), value)
  return wad
}
