/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { playSound } from '../assets/sounds.js'
import { TextBox } from '../gui/text-box.js'

export const TAPE_MENU = 0
export const PROGRAM_MENU = 1
export const EDIT_NAME = 2

const INPUT_RATE = 128

export class Dashboard {
  constructor(parent, width, height, scale, input) {
    this.parent = parent
    this.width = width
    this.height = height
    this.scale = scale
    this.input = input
    this.shadowInput = true
    this.doPaint = true
    this.forcePaint = false

    this.tape = null
    this.menu = 0
    this.tapeRow = 0
    this.programRow = 0
    this.textBox = new TextBox('', 20)
  }

  reset() {
    this.menu = 0
    this.tapeRow = 0
    this.programRow = 0
    this.forcePaint = true
  }

  resize(width, height, scale) {
    this.width = width
    this.height = height
    this.scale = scale
    this.shadowInput = true
    this.doPaint = true
  }

  async load() {}

  immediate() {}

  events() {
    const input = this.input
    if (this.menu === EDIT_NAME) {
      if (input.pressY()) {
        this.textBox.erase()
        this.tape.name = this.textBox.text
        this.forcePaint = true
      } else if (input.pressA()) {
        if (this.textBox.end()) {
          this.menu = TAPE_MENU
          this.forcePaint = true
        } else {
          this.textBox.apply()
          this.tape.name = this.textBox.text
          this.forcePaint = true
        }
      } else if (input.pressStart()) {
        this.menu = TAPE_MENU
        this.forcePaint = true
      }
    } else if (input.pressA() || input.pressStart()) {
      if (this.menu === TAPE_MENU) {
        if (this.tapeRow === 0) this.menu = PROGRAM_MENU
        else if (this.tapeRow === 1) this.parent.eventCall('export')
        else if (this.tapeRow === 2) {
          this.textBox.reset(this.tape.name)
          this.menu = EDIT_NAME
        } else if (this.tapeRow === 5) this.parent.eventCall('back')
        this.forcePaint = true
      } else if (this.menu === PROGRAM_MENU) {
        if (this.programRow === 4) {
          this.menu = TAPE_MENU
          this.forcePaint = true
        } else this.parent.eventCall('open')
      }
    }
  }

  update(timestamp) {
    this.events()

    if (this.forcePaint) {
      this.doPaint = true
      this.forcePaint = false
    } else this.doPaint = false
    if (this.input.nothingOn()) {
      if (this.shadowInput) this.shadowInput = false
      else return
    } else this.shadowInput = true
    this.doPaint = true

    const input = this.input

    if (this.menu === TAPE_MENU) {
      if (input.timerStickUp(timestamp, INPUT_RATE)) {
        if (this.tapeRow > 0) {
          this.tapeRow--
          playSound('beep')
        }
      } else if (input.timerStickDown(timestamp, INPUT_RATE)) {
        if (this.tapeRow < 5) {
          this.tapeRow++
          playSound('beep')
        }
      }
    } else if (this.menu === PROGRAM_MENU) {
      if (input.timerStickUp(timestamp, INPUT_RATE)) {
        if (this.programRow > 0) {
          this.programRow--
          playSound('beep')
        }
      } else if (input.timerStickDown(timestamp, INPUT_RATE)) {
        if (this.programRow < 4) {
          this.programRow++
          playSound('beep')
        }
      }
    } else if (this.menu === EDIT_NAME) {
      if (input.timerStickUp(timestamp, INPUT_RATE)) this.textBox.up()
      else if (input.timerStickDown(timestamp, INPUT_RATE)) this.textBox.down()
      else if (input.timerStickLeft(timestamp, INPUT_RATE)) this.textBox.left()
      else if (input.timerStickRight(timestamp, INPUT_RATE)) this.textBox.right()
    }
  }
}
