export class IntervalTrigger {
  constructor(trigger, interval, current) {
    this.trigger = trigger
    this.interval = interval
    this.time = current + interval
  }
}

export class Trigger {
  constructor(input) {
    this.event = null
    this.action = null
    this.condition = null
    const size = input.length
    if (size === 0) return
    let i = 0
    let s = 0
    if (input[i] === 'every') i += 3
    else i++
    if (i >= size) throw 'Parsed bad trigger'
    this.event = input.slice(s, i)
    s = i
    while (i < size) {
      if (input[i] === 'music') i += 2
      else if (input[i] === 'sound') i += 2
      else if (input[i] === 'goto') i += 3
      else if (input[i] === 'teleport') i += 3
      else if (input[i] === 'spawn') i += 4
      else i++
      if (i < size && (input[i] === 'and' || input[i] === 'or')) {
        i++
        continue
      }
      break
    }
    this.action = input.slice(s, i)
    s = i
    while (i < size) {
      if (input[i] === 'eq') i += 3
      else if (input[i] === 'lte') i += 3
      else if (input[i] === 'gte') i += 3
      else i++
      if (i < size && (input[i] === 'and' || input[i] === 'or')) {
        i++
        continue
      }
      break
    }
    if (i > s) this.condition = input.slice(s, i)
  }

  export() {
    return this.event.join(' ') + ' ' + this.action.join(' ') + (this.condition ? ' ' + this.condition.join(' ') : '')
  }
}
