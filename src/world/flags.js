/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export const FLAG_WATER = 1
export const FLAG_LAVA = 2
export const FLAG_BOSS = 3
export const FLAG_PHYSICAL = 4
export const FLAG_NOT_PHYSICAL = 5

function flagNumber(id) {
  switch (id) {
    case 'water':
      return FLAG_WATER
    case 'lava':
      return FLAG_LAVA
    case 'boss':
      return FLAG_BOSS
    case 'physical':
      return FLAG_PHYSICAL
    case 'not-physical':
      return FLAG_NOT_PHYSICAL
    default:
      return 0
  }
}

class Flag {
  constructor(id, values) {
    this.id = id
    this.number = flagNumber(id)
    this.values = values
  }
}

export function flagsExport(self) {
  const flags = self.flags
  let content = ''
  for (let f = 0; f < flags.length; f++) {
    const flag = flags[f]
    if (content !== '') content += ' '
    content += flag.id
    if (flag.values) content += flag.values.join(' ')
  }
  return content
}

export class Flags {
  constructor(input) {
    this.flags = []
    let i = 0
    const size = input.length
    while (i < size) {
      const id = input[i]
      i++
      const s = i
      if (id === 'water') i++
      else if (id === 'lava') i += 2
      if (i > size) throw 'Parsed bad flag: ' + input
      let values = null
      if (i > s) values = input.slice(s, i)
      if (id === 'water') {
        values[0] = parseInt(values[0])
      } else if (id === 'lava') {
        values[0] = parseInt(values[0])
        values[1] = parseInt(values[1])
      }
      this.flags.push(new Flag(id, values))
      i++
    }
  }

  get(number) {
    const flags = this.flags
    for (let f = 0; f < flags.length; f++) if (flags[f].number === number) return flags[f]
    return null
  }
}
