import { pRandom, pRandomOf } from '../math/random.js'

const PREFIX = ['Death', 'Blood', 'Vile', 'Sin', 'Dark']
const SUFFIX = ['Burn', 'Spawn', 'Spell', 'Wound', 'Feast']
const APPELATION = ['Witch', 'Hungry', 'Slayer', 'Unholy', 'Flayer']

export function monsterName() {
  const prefix = PREFIX[pRandomOf(PREFIX.length)]
  const suffix = SUFFIX[pRandomOf(SUFFIX.length)]
  const name = prefix + ' ' + suffix
  if (pRandom() > 200) {
    const appelation = APPELATION[pRandomOf(APPELATION.length)]
    return name + ' the ' + appelation
  }
  return name
}
