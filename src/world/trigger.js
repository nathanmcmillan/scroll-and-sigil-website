export const TRIGGER_ENTER = 1
export const TRIGGER_EXIT = 2
export const TRIGGER_INTERACT = 3
export const TRIGGER_ATTACK = 4
export const TRIGGER_DEAD = 5

function triggerNumber(id) {
  switch (id) {
    case 'enter':
      return TRIGGER_ENTER
    case 'exit':
      return TRIGGER_EXIT
    case 'interact':
      return TRIGGER_INTERACT
    case 'attack':
      return TRIGGER_ATTACK
    case 'dead':
      return TRIGGER_DEAD
    default:
      return 0
  }
}

export class IntervalTrigger {
  constructor(trigger, interval, current) {
    this.trigger = trigger
    this.interval = interval
    this.time = current + interval
  }
}

export function triggerExport(trigger) {
  return trigger.event.join(' ') + ' ' + trigger.action.join(' ') + (trigger.condition ? ' ' + trigger.condition.join(' ') : '')
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
    if (i >= size) throw 'Parsed bad trigger: ' + input
    this.event = input.slice(s, i)
    for (let e = 0; e < this.event.length; e++) this.event[e] = triggerNumber(this.event[e])
    s = i
    while (i < size) {
      if (input[i] === 'music') i += 2
      else if (input[i] === 'sound') i += 2
      else if (input[i] === 'damage') i += 2
      else if (input[i] === 'floor') i += 2
      else if (input[i] === 'ceiling') i += 2
      else if (input[i] === 'set') i += 3
      else if (input[i] === 'map') i += 3
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
      if (input[i] === 'need') i += 2
      else if (input[i] === 'missing') i += 2
      else if (input[i] === 'eq') i += 3
      else if (input[i] === 'lte') i += 3
      else if (input[i] === 'gte') i += 3
      else if (input[i] === 'is') i += 4
      else i++
      if (i < size && (input[i] === 'and' || input[i] === 'or')) {
        i++
        continue
      }
      break
    }
    if (i > s) this.condition = input.slice(s, i)
  }
}
