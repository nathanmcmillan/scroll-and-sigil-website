const INPUT_RATE = 128

export class Dashboard {
  constructor(width, height, scale, input) {
    this.width = width
    this.height = height
    this.scale = scale
    this.input = input
    this.shadowInput = true
    this.doPaint = true

    this.menu = 0
    this.column = 0
    this.yes = false
    this.back = false
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

    if (this.menu === 0) {
      if (input.timerStickUp(timestamp, INPUT_RATE)) {
        this.column--
        if (this.column < 0) this.column = 0
      }

      if (input.timerStickDown(timestamp, INPUT_RATE)) {
        this.column++
        if (this.column > 4) this.column = 4
      }

      if (input.pressA()) {
        if (this.column === 4) this.back = true
        else this.menu = 1
      }
    } else {
      if (input.timerStickUp(timestamp, INPUT_RATE)) {
        this.column--
        if (this.column < 0) this.column = 0
      }

      if (input.timerStickDown(timestamp, INPUT_RATE)) {
        this.column++
        if (this.column > 4) this.column = 4
      }

      if (input.pressA()) {
        if (this.column === 4) this.menu = 0
        else this.yes = true
      }
    }
  }
}
