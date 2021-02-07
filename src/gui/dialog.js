export class Dialog {
  constructor(id, title, options) {
    this.id = id
    this.title = title
    this.options = options
    this.pos = 0
  }

  reset() {
    this.pos = 0
  }
}
