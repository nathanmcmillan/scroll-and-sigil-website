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
    this.timers = new Array(24).fill(0)
  }

  set(index, down) {
    this.in[index] = down
  }

  nothingOn() {
    let i = this.in.length
    while (i--) {
      if (this.in[i]) return false
    }
    return true
  }

  timer(now, rate, key) {
    let previous = this.timers[key]
    if (now - rate < previous) return
    let down = this.in[key]
    if (down) this.timers[key] = now
    return down
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

  leftUp() {
    return this.in[LEFT_STICK_UP]
  }

  pressLeftUp() {
    return this.press(LEFT_STICK_UP)
  }

  timerLeftUp(now, rate) {
    return this.timer(now, rate, LEFT_STICK_UP)
  }

  leftDown() {
    return this.in[LEFT_STICK_DOWN]
  }

  pressLeftDown() {
    return this.press(LEFT_STICK_DOWN)
  }

  timerLeftDown(now, rate) {
    return this.timer(now, rate, LEFT_STICK_DOWN)
  }

  leftLeft() {
    return this.in[LEFT_STICK_LEFT]
  }

  pressLeftLeft() {
    return this.press(LEFT_STICK_LEFT)
  }

  timerLeftLeft(now, rate) {
    return this.timer(now, rate, LEFT_STICK_LEFT)
  }

  leftRight() {
    return this.in[LEFT_STICK_RIGHT]
  }

  pressLeftRight() {
    return this.press(LEFT_STICK_RIGHT)
  }

  timerLeftRight(now, rate) {
    return this.timer(now, rate, LEFT_STICK_RIGHT)
  }

  rightUp() {
    return this.in[RIGHT_STICK_UP]
  }

  pressRightUp() {
    return this.press(RIGHT_STICK_UP)
  }

  timerRightUp(now, rate) {
    return this.timer(now, rate, RIGHT_STICK_UP)
  }

  rightDown() {
    return this.in[RIGHT_STICK_DOWN]
  }

  pressRightDown() {
    return this.press(RIGHT_STICK_DOWN)
  }

  timerRightDown(now, rate) {
    return this.timer(now, rate, RIGHT_STICK_DOWN)
  }

  rightLeft() {
    return this.in[RIGHT_STICK_LEFT]
  }

  pressRightLeft() {
    return this.press(RIGHT_STICK_LEFT)
  }

  timerRightLeft(now, rate) {
    return this.timer(now, rate, RIGHT_STICK_LEFT)
  }

  rightRight() {
    return this.in[RIGHT_STICK_RIGHT]
  }

  pressRightRight() {
    return this.press(RIGHT_STICK_RIGHT)
  }

  timerRightRight(now, rate) {
    return this.timer(now, rate, RIGHT_STICK_RIGHT)
  }

  padUp() {
    return this.in[DPAD_UP]
  }

  pressPadUp() {
    return this.press(DPAD_UP)
  }

  timerPadUp(now, rate) {
    return this.timer(now, rate, DPAD_UP)
  }

  padDown() {
    return this.in[DPAD_DOWN]
  }

  pressPadDown() {
    return this.press(DPAD_DOWN)
  }

  timerPadDown(now, rate) {
    return this.timer(now, rate, DPAD_DOWN)
  }

  padLeft() {
    return this.in[DPAD_LEFT]
  }

  pressPadLeft() {
    return this.press(DPAD_LEFT)
  }

  timerPadLeft(now, rate) {
    return this.timer(now, rate, DPAD_LEFT)
  }

  padRight() {
    return this.in[DPAD_RIGHT]
  }

  pressPadRight() {
    return this.press(DPAD_RIGHT)
  }

  timerPadRight(now, rate) {
    return this.timer(now, rate, DPAD_RIGHT)
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

  leftClick() {
    return this.in[LEFT_STICK_CLICK]
  }

  pressLeftClick() {
    return this.press(LEFT_STICK_CLICK)
  }

  timerLeftClick(now, rate) {
    return this.timer(now, rate, LEFT_STICK_CLICK)
  }

  rightClick() {
    return this.in[RIGHT_STICK_CLICK]
  }

  pressRightClick() {
    return this.press(RIGHT_STICK_CLICK)
  }

  timerRightClick(now, rate) {
    return this.timer(now, rate, RIGHT_STICK_CLICK)
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

  leftBumper() {
    return this.in[LEFT_BUMPER]
  }

  pressLeftBumper() {
    return this.press(LEFT_BUMPER)
  }

  timerLeftBumper(now, rate) {
    return this.timer(now, rate, LEFT_BUMPER)
  }

  rightBumper() {
    return this.in[RIGHT_BUMPER]
  }

  pressRightBumper() {
    return this.press(RIGHT_BUMPER)
  }

  timerRightBumper(now, rate) {
    return this.timer(now, rate, RIGHT_BUMPER)
  }
}
