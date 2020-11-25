import * as In from '/src/editor/editor-input.js'

export const PENCIL_TOOL = 0
export const ERASE_TOOL = 1
export const TOOL_COUNT = 2

export const DESCRIBE_TOOL = new Array(TOOL_COUNT)
DESCRIBE_TOOL[PENCIL_TOOL] = 'Pencil'
DESCRIBE_TOOL[ERASE_TOOL] = 'Eraser'

export class Painter {
  constructor(width, height) {
    this.width = width
    this.height = height
    this.input = new In.EditorInput()
    this.zoom = 1
    this.shadowInput = true
    this.doPaint = true

    this.paletteRows = 2
    this.paletteColumns = 8
    this.palette = new Uint8Array(this.paletteRows * this.paletteColumns * 3)
    this.paletteFloat = new Float32Array(this.paletteRows * this.paletteColumns * 3)

    this.sheetRows = 128
    this.sheetColumns = 128

    this.sheet = new Uint8Array(this.sheetRows * this.sheetColumns)
    let i = this.sheet.length
    while (i--) this.sheet[i] = 0
    this.sheets = [this.sheet]

    this.rows = 8
    this.columns = 8

    this.paletteC = 0
    this.paletteR = 0

    this.sheetIndex = 0

    this.viewMultiplier = 8

    this.positionOffsetC = 0
    this.positionOffsetR = 0

    this.positionC = 0
    this.positionR = 0

    setPalette(this.palette)
    setPaletteFloat(this.palette, this.paletteFloat)

    this.updates = false
  }

  resize(width, height) {
    this.width = width
    this.height = height
  }

  async load() {}

  update() {
    this.doPaint = false
    if (this.input.nothingOn()) {
      if (this.shadowInput) this.shadowInput = false
      else return
    } else this.shadowInput = true
    this.doPaint = true

    this.updates = false

    let input = this.input
    if (input.buttonA()) {
      input.in[In.BUTTON_A] = false

      let index = this.positionC + this.positionOffsetC + (this.positionR + this.positionOffsetR) * this.sheetColumns
      let paletteIndex = this.paletteC + this.paletteR * this.paletteColumns

      this.sheet[index] = paletteIndex
      this.updates = true
    }

    if (input.leftTrigger()) {
      if (input.moveForward()) {
        input.in[In.MOVE_FORWARD] = false
        this.positionOffsetR -= this.viewMultiplier
        if (this.positionOffsetR < 0) this.positionOffsetR = 0
      }

      if (input.moveBackward()) {
        input.in[In.MOVE_BACKWARD] = false
        this.positionOffsetR += this.viewMultiplier
        if (this.positionOffsetR + this.viewMultiplier >= this.sheetRows) this.positionOffsetR = this.sheetRows - this.viewMultiplier
      }

      if (input.moveLeft()) {
        input.in[In.MOVE_LEFT] = false
        this.positionOffsetC -= this.viewMultiplier
        if (this.positionOffsetC < 0) this.positionOffsetC = 0
      }

      if (input.moveRight()) {
        input.in[In.MOVE_RIGHT] = false
        this.positionOffsetC += this.viewMultiplier
        if (this.positionOffsetC + this.viewMultiplier >= this.sheetColumns) this.positionOffsetC = this.sheetColumns - this.viewMultiplier
      }
    } else {
      if (input.moveForward()) {
        input.in[In.MOVE_FORWARD] = false
        this.positionR--
        if (this.positionR < 0) this.positionR = 0
      }

      if (input.moveBackward()) {
        input.in[In.MOVE_BACKWARD] = false
        this.positionR++
        if (this.positionR >= this.rows) this.positionR = this.rows - 1
      }

      if (input.moveLeft()) {
        input.in[In.MOVE_LEFT] = false
        this.positionC--
        if (this.positionC < 0) this.positionC = 0
      }

      if (input.moveRight()) {
        input.in[In.MOVE_RIGHT] = false
        this.positionC++
        if (this.positionC >= this.columns) this.positionC = this.columns - 1
      }
    }

    if (input.lookUp()) {
      input.in[In.LOOK_UP] = false
      this.paletteR--
      if (this.paletteR < 0) this.paletteR = 0
    }

    if (input.lookDown()) {
      input.in[In.LOOK_DOWN] = false
      this.paletteR++
      if (this.paletteR >= this.paletteRows) this.paletteR = this.paletteRows - 1
    }

    if (input.lookLeft()) {
      input.in[In.LOOK_LEFT] = false
      this.paletteC--
      if (this.paletteC < 0) this.paletteC = 0
    }

    if (input.lookRight()) {
      input.in[In.LOOK_RIGHT] = false
      this.paletteC++
      if (this.paletteC >= this.paletteColumns) this.paletteC = this.paletteColumns - 1
    }
  }

  export() {
    let rows = this.sheetRows
    let columns = this.sheetColumns
    let content = columns + ' ' + rows
    let sheet = this.sheet
    for (let r = 0; r < rows; r++) {
      content += '\n'
      for (let c = 0; c < columns; c++) {
        let index = c + r * columns
        content += sheet[index] + ' '
      }
    }
    return content
  }
}

export function exportSheetPixels(painter, index) {
  let sheet = painter.sheets[index]
  let rows = painter.sheetRows
  let columns = painter.sheetColumns
  let palette = painter.palette
  let pixels = new Uint8Array(rows * columns * 3)
  for (let r = 0; r < rows; r++) {
    let row = r * columns
    for (let c = 0; c < columns; c++) {
      let i = c + row
      let p = sheet[i] * 3
      i *= 3
      pixels[i] = palette[p]
      pixels[i + 1] = palette[p + 1]
      pixels[i + 2] = palette[p + 2]
    }
  }
  return pixels
}

function setPalette(palette) {
  let index = 0

  palette[index] = 0
  palette[index + 1] = 0
  palette[index + 2] = 0
  index += 3

  palette[index] = 29
  palette[index + 1] = 43
  palette[index + 2] = 83
  index += 3

  palette[index] = 126
  palette[index + 1] = 37
  palette[index + 2] = 83
  index += 3

  palette[index] = 0
  palette[index + 1] = 135
  palette[index + 2] = 81
  index += 3

  palette[index] = 171
  palette[index + 1] = 82
  palette[index + 2] = 54
  index += 3

  palette[index] = 95
  palette[index + 1] = 87
  palette[index + 2] = 79
  index += 3

  palette[index] = 194
  palette[index + 1] = 195
  palette[index + 2] = 199
  index += 3

  palette[index] = 255
  palette[index + 1] = 241
  palette[index + 2] = 232
  index += 3

  palette[index] = 255
  palette[index + 1] = 0
  palette[index + 2] = 77
  index += 3

  palette[index] = 255
  palette[index + 1] = 163
  palette[index + 2] = 0
  index += 3

  palette[index] = 255
  palette[index + 1] = 236
  palette[index + 2] = 39
  index += 3

  palette[index] = 0
  palette[index + 1] = 228
  palette[index + 2] = 54
  index += 3

  palette[index] = 41
  palette[index + 1] = 173
  palette[index + 2] = 255
  index += 3

  palette[index] = 131
  palette[index + 1] = 118
  palette[index + 2] = 156
  index += 3

  palette[index] = 255
  palette[index + 1] = 119
  palette[index + 2] = 168
  index += 3

  palette[index] = 255
  palette[index + 1] = 204
  palette[index + 2] = 170
}

function setPaletteFloat(source, destination) {
  let i = source.length
  while (i--) destination[i] = source[i] / 255.0
}
