export class TwoWayMap {
  constructor() {
    this.map = new Map()
    this.reverse = new Map()
  }

  set(a, b) {
    this.map.set(a, b)
    this.reverse.set(b, a)
  }

  get(k) {
    return this.map.get(k)
  }

  has(k) {
    return this.map.has(k)
  }

  reversed(k) {
    return this.reverse.get(k)
  }
}
