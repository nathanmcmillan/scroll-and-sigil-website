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

const DOUBLE_RATE = 64

export class Input {
  constructor() {
    this.in = new Array(12).fill(false)
    this.ghost = new Array(12).fill(0)
    this.timers = new Array(12).fill(0)
    this.mouseLeftDown = false
    this.mouseRightDown = false
    this.mouseDidMove = false
    this.mousePositionX = 0
    this.mousePositionY = 0
  }

  set(index, down) {
    this.in[index] = down
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
    let down = this.mouseLeftDown
    this.mouseLeftDown = false
    return down
  }

  mouseRight() {
    return this.mouseRightDown
  }

  mouseClickRight() {
    let down = this.mouseRightDown
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
    let previous = this.timers[key]
    if (now - rate < previous) return false
    let down = this.in[key]
    if (down) this.timers[key] = now
    return down
  }

  double(now, key) {
    // fixme: broken
    let down = this.in[key]
    let decide = down && now - DOUBLE_RATE < this.timers[key] && now - DOUBLE_RATE > this.ghost[key]
    if (down) this.timers[key] = now
    if (!down) this.ghost[key] = now
    return decide
  }

  press(key) {
    let down = this.in[key]
    this.in[key] = false
    return down
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
}
