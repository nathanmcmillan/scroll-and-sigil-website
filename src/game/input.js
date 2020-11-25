export const BUTTON_START = 0
export const BUTTON_SELECT = 1

export const LEFT_STICK_UP = 2
export const LEFT_STICK_DOWN = 3
export const LEFT_STICK_LEFT = 4
export const LEFT_STICK_RIGHT = 5

export const RIGHT_STICK_UP = 6
export const RIGHT_STICK_DOWN = 7
export const RIGHT_STICK_LEFT = 8
export const RIGHT_STICK_RIGHT = 9

export const DPAD_UP = 10
export const DPAD_DOWN = 11
export const DPAD_LEFT = 12
export const DPAD_RIGHT = 13

export const BUTTON_A = 14
export const BUTTON_B = 15
export const BUTTON_X = 16
export const BUTTON_Y = 17

export const LEFT_STICK_CLICK = 18
export const RIGHT_STICK_CLICK = 19

export const LEFT_TRIGGER = 20
export const RIGHT_TRIGGER = 21

export const LEFT_BUMPER = 22
export const RIGHT_BUMPER = 23

export class Input {
  constructor() {
    this.in = new Array(24).fill(false)
  }

  set(index, down) {
    this.in[index] = down
  }

  on(index) {
    this.in[index] = true
  }

  off(index) {
    this.in[index] = false
  }

  nothingOn() {
    let i = this.in.length
    while (i--) {
      if (this.in[i]) return false
    }
    return true
  }

  start() {
    return this.in[BUTTON_START]
  }

  select() {
    return this.in[BUTTON_SELECT]
  }

  leftUp() {
    return this.in[LEFT_STICK_UP]
  }

  leftDown() {
    return this.in[LEFT_STICK_DOWN]
  }

  leftLeft() {
    return this.in[LEFT_STICK_LEFT]
  }

  leftRight() {
    return this.in[LEFT_STICK_RIGHT]
  }

  rightUp() {
    return this.in[RIGHT_STICK_UP]
  }

  rightDown() {
    return this.in[RIGHT_STICK_DOWN]
  }

  rightLeft() {
    return this.in[RIGHT_STICK_LEFT]
  }

  rightRight() {
    return this.in[RIGHT_STICK_RIGHT]
  }

  padUp() {
    return this.in[DPAD_UP]
  }

  padDown() {
    return this.in[DPAD_DOWN]
  }

  padLeft() {
    return this.in[DPAD_LEFT]
  }

  padRight() {
    return this.in[DPAD_RIGHT]
  }

  a() {
    return this.in[BUTTON_A]
  }

  b() {
    return this.in[BUTTON_B]
  }

  x() {
    return this.in[BUTTON_X]
  }

  y() {
    return this.in[BUTTON_Y]
  }

  leftClick() {
    return this.in[LEFT_STICK_CLICK]
  }

  rightClick() {
    return this.in[RIGHT_STICK_CLICK]
  }

  leftTrigger() {
    return this.in[LEFT_TRIGGER]
  }

  rightTrigger() {
    return this.in[RIGHT_TRIGGER]
  }

  leftBumper() {
    return this.in[LEFT_BUMPER]
  }

  rightBumper() {
    return this.in[RIGHT_BUMPER]
  }
}
