export const LOOK_LEFT = 0
export const LOOK_RIGHT = 1
export const LOOK_UP = 2
export const LOOK_DOWN = 3
export const MOVE_FORWARD = 4
export const MOVE_BACKWARD = 5
export const MOVE_LEFT = 6
export const MOVE_RIGHT = 7
export const MOVE_UP = 8
export const MOVE_DOWN = 9
export const BUTTON_A = 10
export const BUTTON_B = 11
export const BUTTON_X = 12
export const BUTTON_Y = 13
export const OPEN_MENU = 14
export const OPEN_TOOL_MENU = 15
export const UNDO = 16
export const REDO = 17
export const SWITCH_MODE = 18
export const ZOOM_IN = 19
export const ZOOM_OUT = 20
export const SNAP_TO_GRID = 21
export const LEFT_TRIGGER = 22
export const RIGHT_TRIGGER = 23

export class EditorInput {
  constructor() {
    this.in = new Array(24).fill(false)
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

  lookLeft() {
    return this.in[LOOK_LEFT]
  }

  lookRight() {
    return this.in[LOOK_RIGHT]
  }

  lookUp() {
    return this.in[LOOK_UP]
  }

  lookDown() {
    return this.in[LOOK_DOWN]
  }

  moveForward() {
    return this.in[MOVE_FORWARD]
  }

  moveBackward() {
    return this.in[MOVE_BACKWARD]
  }

  moveLeft() {
    return this.in[MOVE_LEFT]
  }

  moveRight() {
    return this.in[MOVE_RIGHT]
  }

  moveUp() {
    return this.in[MOVE_UP]
  }

  moveDown() {
    return this.in[MOVE_DOWN]
  }

  buttonA() {
    return this.in[BUTTON_A]
  }

  buttonB() {
    return this.in[BUTTON_B]
  }

  buttonX() {
    return this.in[BUTTON_X]
  }

  buttonY() {
    return this.in[BUTTON_Y]
  }

  leftTrigger() {
    return this.in[LEFT_TRIGGER]
  }

  rightTrigger() {
    return this.in[RIGHT_TRIGGER]
  }

  openMenu() {
    return this.in[OPEN_MENU]
  }

  openToolMenu() {
    return this.in[OPEN_TOOL_MENU]
  }

  undo() {
    return this.in[UNDO]
  }

  redo() {
    return this.in[REDO]
  }

  switchMode() {
    return this.in[SWITCH_MODE]
  }

  zoomIn() {
    return this.in[ZOOM_IN]
  }

  zoomOut() {
    return this.in[ZOOM_OUT]
  }

  snapToGrid() {
    return this.in[SNAP_TO_GRID]
  }
}
