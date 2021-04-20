/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export const BUTTON_START = 0
export const BUTTON_SELECT = 1

export const STICK_UP = 2
export const STICK_DOWN = 3
export const STICK_LEFT = 4
export const STICK_RIGHT = 5

export const BUTTON_X = 6
export const BUTTON_Y = 7
export const BUTTON_A = 8
export const BUTTON_B = 9

export const LEFT_TRIGGER = 10
export const RIGHT_TRIGGER = 11

const BUTTONS = 12

const DOUBLE_RATE = 64

export function usingKeyboardMouse(input) {
  const names = input.names
  names[BUTTON_START] = 'ENTER'
  names[BUTTON_SELECT] = 'SPACE'
  names[STICK_UP] = 'W'
  names[STICK_DOWN] = 'S'
  names[STICK_LEFT] = 'A'
  names[STICK_RIGHT] = 'D'
  names[BUTTON_X] = 'I'
  names[BUTTON_Y] = 'J'
  names[BUTTON_A] = 'L'
  names[BUTTON_B] = 'K'
  names[LEFT_TRIGGER] = 'Q'
  names[RIGHT_TRIGGER] = 'O'
}

export function usingXbox(input) {
  const names = input.names
  names[BUTTON_START] = 'START'
  names[BUTTON_SELECT] = 'SPACE'
  names[STICK_UP] = 'LEFT STICK UP'
  names[STICK_DOWN] = 'LEFT STICK DOWN'
  names[STICK_LEFT] = 'LEFT STICK LEFT'
  names[STICK_RIGHT] = 'LEFT STICK RIGHT'
  names[BUTTON_X] = 'A'
  names[BUTTON_Y] = 'B'
  names[BUTTON_A] = 'X'
  names[BUTTON_B] = 'Y'
  names[LEFT_TRIGGER] = 'LEFT TRIGGER'
  names[RIGHT_TRIGGER] = 'RIGHT TRIGGER'
}

export function usingPlayStation(input) {
  const names = input.names
  names[BUTTON_START] = 'START'
  names[BUTTON_SELECT] = 'SPACE'
  names[STICK_UP] = 'LEFT STICK UP'
  names[STICK_DOWN] = 'LEFT STICK DOWN'
  names[STICK_LEFT] = 'LEFT STICK LEFT'
  names[STICK_RIGHT] = 'LEFT STICK RIGHT'
  names[BUTTON_X] = 'X'
  names[BUTTON_Y] = 'Square'
  names[BUTTON_A] = 'Circle'
  names[BUTTON_B] = 'Triangle'
  names[LEFT_TRIGGER] = 'LEFT TRIGGER'
  names[RIGHT_TRIGGER] = 'RIGHT TRIGGER'
}

export class Input {
  constructor() {
    this.in = new Array(BUTTONS).fill(false)
    this.keyboard = new Array(BUTTONS).fill(false)
    this.pressed = new Array(BUTTONS).fill(false)
    this.ghost = new Array(BUTTONS).fill(0)
    this.timers = new Array(BUTTONS).fill(0)
    this.names = new Array(BUTTONS).fill('')
    this.mouseLeftDown = false
    this.mouseRightDown = false
    this.mouseDidMove = false
    this.mousePositionX = 0
    this.mousePositionY = 0
    this.leftStickAngle = 0.0
    this.leftStickPower = 0.0
    this.rightStickX = 0.0
    this.rightStickY = 0.0
  }

  set(index, down) {
    this.keyboard[index] = down
  }

  mouseEvent(left, down) {
    if (left) this.mouseLeftDown = down
    else this.mouseRightDown = down
  }

  mouseMove(x, y) {
    this.mousePositionX = x
    this.mousePositionY = y
    this.mouseDidMove = true
  }

  mouseX() {
    return this.mousePositionX
  }

  mouseY() {
    return this.mousePositionY
  }

  mouseLeft() {
    return this.mouseLeftDown
  }

  mouseClickLeft() {
    const down = this.mouseLeftDown
    this.mouseLeftDown = false
    return down
  }

  mouseRight() {
    return this.mouseRightDown
  }

  mouseClickRight() {
    const down = this.mouseRightDown
    this.mouseRightDown = false
    return down
  }

  mouseMoved() {
    return this.mouseDidMove
  }

  mouseMoveOff() {
    this.mouseDidMove = false
  }

  nothingOn() {
    let i = this.in.length
    while (i--) if (this.in[i]) return false
    if (this.mouseLeftDown || this.mouseRightDown || this.mouseDidMove) return false
    return true
  }

  timer(now, rate, key) {
    const previous = this.timers[key]
    if (now - rate < previous) return false
    const down = this.in[key]
    if (down) this.timers[key] = now
    return down
  }

  double(now, key) {
    // fixme: broken
    const down = this.in[key]
    const decide = down && now - DOUBLE_RATE < this.timers[key] && now - DOUBLE_RATE > this.ghost[key]
    if (down) this.timers[key] = now
    if (!down) this.ghost[key] = now
    return decide
  }

  press(key) {
    if (this.pressed[key]) return false
    if (this.in[key]) {
      this.pressed[key] = true
      return true
    }
    return false
  }

  start() {
    return this.in[BUTTON_START]
  }

  pressStart() {
    return this.press(BUTTON_START)
  }

  timerStart(now, rate) {
    return this.timer(now, rate, BUTTON_START)
  }

  select() {
    return this.in[BUTTON_SELECT]
  }

  pressSelect() {
    return this.press(BUTTON_SELECT)
  }

  timerSelect(now, rate) {
    return this.timer(now, rate, BUTTON_SELECT)
  }

  stickUp() {
    return this.in[STICK_UP]
  }

  pressStickUp() {
    return this.press(STICK_UP)
  }

  timerStickUp(now, rate) {
    return this.timer(now, rate, STICK_UP)
  }

  stickDown() {
    return this.in[STICK_DOWN]
  }

  pressStickDown() {
    return this.press(STICK_DOWN)
  }

  timerStickDown(now, rate) {
    return this.timer(now, rate, STICK_DOWN)
  }

  stickLeft() {
    return this.in[STICK_LEFT]
  }

  pressStickLeft() {
    return this.press(STICK_LEFT)
  }

  timerStickLeft(now, rate) {
    return this.timer(now, rate, STICK_LEFT)
  }

  stickRight() {
    return this.in[STICK_RIGHT]
  }

  pressStickRight() {
    return this.press(STICK_RIGHT)
  }

  timerStickRight(now, rate) {
    return this.timer(now, rate, STICK_RIGHT)
  }

  a() {
    return this.in[BUTTON_A]
  }

  pressA() {
    return this.press(BUTTON_A)
  }

  timerA(now, rate) {
    return this.timer(now, rate, BUTTON_A)
  }

  b() {
    return this.in[BUTTON_B]
  }

  pressB() {
    return this.press(BUTTON_B)
  }

  timerB(now, rate) {
    return this.timer(now, rate, BUTTON_B)
  }

  x() {
    return this.in[BUTTON_X]
  }

  pressX() {
    return this.press(BUTTON_X)
  }

  timerX(now, rate) {
    return this.timer(now, rate, BUTTON_X)
  }

  y() {
    return this.in[BUTTON_Y]
  }

  pressY() {
    return this.press(BUTTON_Y)
  }

  timerY(now, rate) {
    return this.timer(now, rate, BUTTON_Y)
  }

  leftTrigger() {
    return this.in[LEFT_TRIGGER]
  }

  pressLeftTrigger() {
    return this.press(LEFT_TRIGGER)
  }

  timerLeftTrigger(now, rate) {
    return this.timer(now, rate, LEFT_TRIGGER)
  }

  rightTrigger() {
    return this.in[RIGHT_TRIGGER]
  }

  pressRightTrigger() {
    return this.press(RIGHT_TRIGGER)
  }

  timerRightTrigger(now, rate) {
    return this.timer(now, rate, RIGHT_TRIGGER)
  }

  doubleRightTrigger(now) {
    return this.double(now, RIGHT_TRIGGER)
  }

  keyboardMouseAnalog() {
    const down = this.in

    let angle = 0.0
    let direction = null

    if (down[STICK_UP]) {
      direction = 'w'
    }

    if (down[STICK_DOWN]) {
      if (direction === null) {
        angle = Math.PI
        direction = 's'
      } else {
        direction = null
      }
    }

    if (down[STICK_LEFT]) {
      if (direction === null) {
        angle = -0.5 * Math.PI
        direction = 'a'
      } else if (direction === 'w') {
        angle -= 0.25 * Math.PI
        direction = 'wa'
      } else if (direction === 's') {
        angle += 0.25 * Math.PI
        direction = 'sa'
      }
    }

    if (down[STICK_RIGHT]) {
      if (direction === null) {
        angle = 0.5 * Math.PI
        direction = 'd'
      } else if (direction === 'a') {
        direction = null
      } else if (direction === 'wa') {
        angle = 0.0
        direction = 'w'
      } else if (direction === 'sa') {
        angle = Math.PI
        direction = 's'
      } else if (direction === 'w') {
        angle += 0.25 * Math.PI
        direction = 'wd'
      } else if (direction === 's') {
        angle -= 0.25 * Math.PI
        direction = 'sd'
      }
    }

    if (direction !== null) {
      this.leftStickAngle = angle
      this.leftStickPower = 1.0
    } else {
      this.leftStickPower = 0.0
    }
  }

  keyboardMouseUpdate() {
    for (let i = 0; i < BUTTONS; i++) this.in[i] = this.keyboard[i]
  }

  updatePressed() {
    for (let i = 0; i < BUTTONS; i++) if (!this.in[i]) this.pressed[i] = false
  }

  controllerUpdate(controller) {
    this.in[BUTTON_X] = this.in[BUTTON_X] || controller.buttons[0].pressed
    this.in[BUTTON_A] = this.in[BUTTON_A] || controller.buttons[1].pressed
    this.in[BUTTON_Y] = this.in[BUTTON_Y] || controller.buttons[2].pressed
    this.in[BUTTON_B] = this.in[BUTTON_B] || controller.buttons[3].pressed

    this.in[LEFT_TRIGGER] = this.in[LEFT_TRIGGER] || controller.buttons[6].pressed || controller.buttons[4].pressed
    this.in[RIGHT_TRIGGER] = this.in[RIGHT_TRIGGER] || controller.buttons[7].pressed || controller.buttons[5].pressed

    this.in[BUTTON_START] = this.in[BUTTON_START] || controller.buttons[8].pressed || controller.buttons[11].pressed || controller.buttons[16].pressed
    this.in[BUTTON_SELECT] = this.in[BUTTON_SELECT] || controller.buttons[9].pressed || controller.buttons[10].pressed

    const sensitivity = 0.5

    this.in[STICK_UP] = this.in[STICK_UP] || controller.axes[1] < -sensitivity || controller.buttons[12].pressed
    this.in[STICK_DOWN] = this.in[STICK_DOWN] || controller.axes[1] > sensitivity || controller.buttons[13].pressed
    this.in[STICK_LEFT] = this.in[STICK_LEFT] || controller.axes[0] < -sensitivity || controller.buttons[14].pressed
    this.in[STICK_RIGHT] = this.in[STICK_RIGHT] || controller.axes[0] > sensitivity || controller.buttons[15].pressed

    this.leftStickAngle = Math.atan2(controller.axes[0], -controller.axes[1])
    this.leftStickPower = Math.max(Math.abs(controller.axes[0]), Math.abs(controller.axes[1]))

    this.rightStickX = controller.axes[2]
    this.rightStickY = controller.axes[3]

    const deadzone = 0.1

    if (this.leftStickPower < deadzone) this.leftStickPower = 0.0

    if (Math.abs(this.rightStickX) < deadzone) this.rightStickX = 0.0
    if (Math.abs(this.rightStickY) < deadzone) this.rightStickY = 0.0
  }

  name(button) {
    return this.names[button]
  }
}
