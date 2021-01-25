import {playSound} from '/src/assets/sounds.js'

export const PACKAGE_MENU = 0
export const PROGRAM_MENU = 1

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
    this.packageRow = 0
    this.programRow = 0
    this.yes = false
    this.back = false
  }

  reset() {
    this.menu = 0
    this.packageRow = 0
    this.programRow = 0
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

    if (this.menu === PACKAGE_MENU) {
      if (input.timerStickUp(timestamp, INPUT_RATE)) {
        if (this.packageRow > 0) {
          this.packageRow--
          playSound('baron-pain')
        }
      } else if (input.timerStickDown(timestamp, INPUT_RATE)) {
        if (this.packageRow < 4) {
          this.packageRow++
          playSound('baron-pain')
        }
      }

      if (input.pressA() || input.pressStart()) {
        if (this.packageRow === 4) this.back = true
        else this.menu = PROGRAM_MENU
      }
    } else {
      if (input.timerStickUp(timestamp, INPUT_RATE)) {
        if (this.programRow > 0) {
          this.programRow--
          playSound('baron-pain')
        }
      } else if (input.timerStickDown(timestamp, INPUT_RATE)) {
        if (this.programRow < 4) {
          this.programRow++
          playSound('baron-pain')
        }
      }

      if (input.pressA() || input.pressStart()) {
        if (this.programRow === 4) this.menu = PACKAGE_MENU
        else this.yes = true
      }
    }
  }
}
