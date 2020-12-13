const INPUT_RATE = 128

export class Dashboard {
  constructor(width, height, scale, input) {
    this.width = width
    this.height = height
    this.scale = scale
    this.input = input
    this.shadowInput = true
    this.doPaint = true

    this.column = 0
    this.yes = false
  }

  resize(width, height, scale) {
    this.width = width
    this.height = height
    this.scale = scale
    this.shadowInput = true
    this.doPaint = true
  }

  async load() {}

  update(timestamp) {
    this.doPaint = false
    if (this.input.nothingOn()) {
      if (this.shadowInput) this.shadowInput = false
      else return
    } else this.shadowInput = true
    this.doPaint = true

    let input = this.input

    if (input.timerLeftLeft(timestamp, INPUT_RATE)) {
      this.column--
      if (this.column < 0) this.column = 0
    }

    if (input.timerLeftRight(timestamp, INPUT_RATE)) {
      this.column++
      if (this.column > 3) this.column = 3
    }

    if (input.pressA()) this.yes = true
  }
}
