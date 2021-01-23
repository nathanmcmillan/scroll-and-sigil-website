import {fetchText} from '/src/client/net.js'
import {newPalette, newPaletteFloat, describeColor} from '/src/editor/palette.js'
import {flexBox, flexSolve, flexSize} from '/src/flex/flex.js'
import {FONT_WIDTH, FONT_HEIGHT} from '/src/render/render.js'

const PENCIL = 0
const FILL = 1
const DROPLET = 2

const INPUT_RATE = 128
const HISTORY_LIMIT = 50

export class PaintEdit {
  constructor(width, height, scale, input) {
    this.width = width
    this.height = height
    this.scale = scale
    this.input = input
    this.shadowInput = true
    this.doPaint = true
    this.hasUpdates = false
    this.canUpdate = true

    this.paletteRows = 4
    this.paletteColumns = 4
    this.palette = newPalette()
    this.paletteFloat = newPaletteFloat(this.palette)

    this.sheetRows = 128
    this.sheetColumns = 128

    this.sheet = new Uint8Array(this.sheetRows * this.sheetColumns)
    let i = this.sheet.length
    while (i--) this.sheet[i] = 0
    this.sheets = [this.sheet]

    this.paletteC = 0
    this.paletteR = 0

    this.sheetIndex = 0

    this.brushSize = 1
    this.canvasZoom = 8

    this.positionOffsetC = 0
    this.positionOffsetR = 0

    this.positionC = 0
    this.positionR = 0

    this.toolColumns = 3
    this.tool = 0

    this.history = []
    this.historyPosition = 0

    this.sheetBox = null
    this.viewBox = null
    this.toolBox = null
    this.paletteBox = null

    this.menuOptions = ['file', 'new sheet']
    this.fileOptions = ['open', 'save', 'export']

    this.resize(width, height, scale)
  }

  resize(width, height, scale) {
    this.width = width
    this.height = height
    this.scale = scale
    this.shadowInput = true
    this.doPaint = true

    this.plan()
  }

  plan() {
    const width = this.width
    const height = this.height
    const scale = this.scale
    const canvasZoom = this.canvasZoom
    const sheetRows = this.sheetRows
    const sheetColumns = this.sheetColumns
    const paletteRows = this.paletteRows
    const paletteColumns = this.paletteColumns
    const toolColumns = this.toolColumns
    const fontScale = Math.floor(1.5 * scale)
    const fontWidth = fontScale * FONT_WIDTH
    const fontHeight = fontScale * FONT_HEIGHT

    let magnify = 2 * scale
    let sheetBox = flexBox(magnify * sheetColumns, magnify * sheetRows)
    sheetBox.topSpace = Math.ceil(0.5 * fontHeight)
    sheetBox.bottomSpace = Math.ceil(0.5 * fontHeight)
    sheetBox.rightSpace = 2 * fontWidth
    sheetBox.argX = 0
    sheetBox.funY = 'center'
    this.sheetBox = sheetBox

    magnify = scale
    if (canvasZoom === 8) magnify *= 16
    if (canvasZoom === 16) magnify *= 8
    if (canvasZoom === 32) magnify *= 4
    if (canvasZoom === 64) magnify *= 2
    let viewBox = flexBox(canvasZoom * magnify, canvasZoom * magnify)
    viewBox.topSpace = Math.ceil(0.5 * fontHeight)
    viewBox.bottomSpace = 2 * fontHeight
    viewBox.funX = 'right-of'
    viewBox.fromX = sheetBox
    viewBox.funY = 'align-top'
    viewBox.fromY = sheetBox
    this.viewBox = viewBox

    magnify = 16 * scale
    let toolBox = flexBox(toolColumns * magnify, 2 * fontHeight)
    toolBox.bottomSpace = 2 * fontHeight
    toolBox.funX = 'center'
    toolBox.fromX = viewBox
    toolBox.funY = 'below'
    toolBox.fromY = viewBox
    this.toolBox = toolBox

    magnify = 16 * scale
    let paletteBox = flexBox(paletteColumns * magnify, paletteRows * magnify)
    paletteBox.funX = 'center'
    paletteBox.fromX = toolBox
    paletteBox.funY = 'below'
    paletteBox.fromY = toolBox
    this.paletteBox = paletteBox

    let collection = [sheetBox, viewBox, toolBox, paletteBox]
    flexSolve(width, height, ...collection)

    let size = flexSize(...collection)
    let canvas = flexBox(size[2], size[3])
    canvas.funX = 'center'
    flexSolve(width, height, canvas)

    sheetBox.argX = canvas.x
    flexSolve(width, height, ...collection)

    // let topBarPaint = flexBox(fontWidth, fontHeight)
    // topBarPaint.argX = 'center'
    // topBarPaint.argY = viewBox
    // this.topBarPaint = topBarPaint
  }

  read(content, into) {
    let image = content.split('\n')
    let index = 0

    let dimensions = image[index].split(' ')
    let width = parseInt(dimensions[0])
    let height = parseInt(dimensions[1])
    index++

    const sheet = this.sheets[into]
    const rows = this.sheetRows
    const columns = this.sheetColumns

    if (height > rows) height = rows
    if (width > columns) width = columns

    for (let h = 0; h < height; h++) {
      let row = image[index].split(' ')
      for (let c = 0; c < width; c++) {
        sheet[c + h * columns] = parseInt(row[c])
      }
      index++
    }

    this.shadowInput = true
    this.doPaint = true
  }

  async load(file) {
    let image = null
    if (file === null) image = localStorage.getItem('paint-sheet')
    else image = await fetchText(file)
    if (image === null || image === undefined) return
    this.read(image, 0)
  }

  leftStatusBar() {
    let input = this.input
    if (input.y()) {
      const prefix = 'TOOL: '
      if (this.tool === 0) return prefix + 'DRAW'
      else if (this.tool === 1) return prefix + 'FILL'
      else return prefix + 'COLOR PICKER'
    } else if (input.x()) return 'COLOR: ' + describeColor(this.paletteC + this.paletteR * this.paletteColumns).toUpperCase()
    else if (input.select()) return 'BRUSH SIZE: ' + this.brushSize + ' ZOOM: ' + this.canvasZoom + 'X'
    else return 'X:' + (this.positionOffsetC + this.positionC) + ' Y:' + (this.positionOffsetR + this.positionR)
  }

  rightStatusBar() {
    let input = this.input
    if (input.x()) return '(X)OK'
    else if (input.y()) return '(Y)OK'
    else if (input.b()) return '(B)OK'
    else if (input.select()) return '(SELECT)OK'
    else return '(X)COLOR (Y)TOOL (B)MOVE (A)DRAW'
  }

  update(timestamp) {
    this.doPaint = false
    if (this.input.nothingOn()) {
      if (this.shadowInput) this.shadowInput = false
      else return
    } else this.shadowInput = true
    this.doPaint = true
    this.hasUpdates = false

    let input = this.input

    if (input.x()) {
      if (input.timerStickUp(timestamp, INPUT_RATE)) {
        this.paletteR--
        if (this.paletteR < 0) this.paletteR = 0
        else this.canUpdate = true
      }

      if (input.timerStickDown(timestamp, INPUT_RATE)) {
        this.paletteR++
        if (this.paletteR >= this.paletteRows) this.paletteR = this.paletteRows - 1
        else this.canUpdate = true
      }

      if (input.timerStickLeft(timestamp, INPUT_RATE)) {
        this.paletteC--
        if (this.paletteC < 0) this.paletteC = 0
        else this.canUpdate = true
      }

      if (input.timerStickRight(timestamp, INPUT_RATE)) {
        this.paletteC++
        if (this.paletteC >= this.paletteColumns) this.paletteC = this.paletteColumns - 1
        else this.canUpdate = true
      }
    } else if (input.y()) {
      if (input.timerStickLeft(timestamp, INPUT_RATE)) {
        this.tool--
        if (this.tool < 0) this.tool = 0
        else this.canUpdate = true
      }

      if (input.timerStickRight(timestamp, INPUT_RATE)) {
        this.tool++
        if (this.tool >= this.toolColumns) this.tool = this.toolColumns - 1
        else this.canUpdate = true
      }
    } else if (input.b()) {
      const move = 8

      if (input.timerStickUp(timestamp, INPUT_RATE)) {
        this.positionOffsetR -= move
        if (this.positionOffsetR < 0) this.positionOffsetR = 0
        else this.canUpdate = true
      }

      if (input.timerStickDown(timestamp, INPUT_RATE)) {
        this.positionOffsetR += move
        if (this.positionOffsetR + this.canvasZoom >= this.sheetRows) this.positionOffsetR = this.sheetRows - this.canvasZoom
        else this.canUpdate = true
      }

      if (input.timerStickLeft(timestamp, INPUT_RATE)) {
        this.positionOffsetC -= move
        if (this.positionOffsetC < 0) this.positionOffsetC = 0
        else this.canUpdate = true
      }

      if (input.timerStickRight(timestamp, INPUT_RATE)) {
        this.positionOffsetC += move
        if (this.positionOffsetC + this.canvasZoom >= this.sheetColumns) this.positionOffsetC = this.sheetColumns - this.canvasZoom
        else this.canUpdate = true
      }
    } else if (input.select()) {
      if (input.timerStickLeft(timestamp, INPUT_RATE)) {
        this.brushSize--
        if (this.brushSize < 1) this.brushSize = 1
        else this.canUpdate = true
      }
      if (input.timerStickRight(timestamp, INPUT_RATE)) {
        this.brushSize++
        if (this.brushSize > 4) this.brushSize = 4
        if (this.positionR + this.brushSize >= this.canvasZoom) this.positionR = this.canvasZoom - this.brushSize
        if (this.positionC + this.brushSize > this.canvasZoom) this.positionC = this.canvasZoom - this.brushSize
        this.canUpdate = true
      }
      if (input.timerStickUp(timestamp, INPUT_RATE)) {
        this.canvasZoom /= 2
        if (this.canvasZoom < 8) this.canvasZoom = 8
        if (this.positionR + this.brushSize >= this.canvasZoom) this.positionR = this.canvasZoom - this.brushSize
        if (this.positionC + this.brushSize > this.canvasZoom) this.positionC = this.canvasZoom - this.brushSize
        this.canUpdate = true
      }
      if (input.timerStickDown(timestamp, INPUT_RATE)) {
        this.canvasZoom *= 2
        if (this.canvasZoom > 64) this.canvasZoom = 64
        if (this.positionOffsetR + this.canvasZoom >= this.sheetRows) this.positionOffsetR = this.sheetRows - this.canvasZoom
        if (this.positionOffsetC + this.canvasZoom >= this.sheetColumns) this.positionOffsetC = this.sheetColumns - this.canvasZoom
        this.canUpdate = true
      }
    } else {
      if (input.timerStickUp(timestamp, INPUT_RATE)) {
        this.positionR--
        if (this.positionR < 0) this.positionR = 0
        else this.canUpdate = true
      }

      if (input.timerStickDown(timestamp, INPUT_RATE)) {
        this.positionR++
        if (this.positionR + this.brushSize > this.canvasZoom) this.positionR = this.canvasZoom - this.brushSize
        else this.canUpdate = true
      }

      if (input.timerStickLeft(timestamp, INPUT_RATE)) {
        this.positionC--
        if (this.positionC < 0) this.positionC = 0
        else this.canUpdate = true
      }

      if (input.timerStickRight(timestamp, INPUT_RATE)) {
        this.positionC++
        if (this.positionC + this.brushSize > this.canvasZoom) this.positionC = this.canvasZoom - this.brushSize
        else this.canUpdate = true
      }
    }

    if (input.a()) this.action()
    if (input.pressLeftTrigger()) this.undo()
    if (input.pressRightTrigger()) this.redo()

    if (input.mouseMoved()) {
      input.mouseMoveOff()
      let x = input.mouseX()
      let y = input.mouseY()
      if (this.viewBox.inside(x, y)) this.mouseInViewBox(x, y)
    }

    if (input.mouseLeft()) {
      let x = input.mouseX()
      let y = input.mouseY()
      if (this.viewBox.inside(x, y)) {
        this.mouseInViewBox(x, y)
        this.action()
      } else if (this.paletteBox.inside(x, y)) this.mouseInPaletteBox(x, y)
      else if (this.sheetBox.inside(x, y)) this.mouseInSheetBox(x, y)
    }
  }

  mouseInViewBox(x, y) {
    let c = this.positionC
    let r = this.positionR
    x = Math.floor((x - this.viewBox.x) / 32)
    y = Math.floor((this.viewBox.height - (y - this.viewBox.y)) / 32)
    if (x < 8 && y < 8 && (x !== c || y !== r)) {
      this.positionC = x
      this.positionR = y
      this.canUpdate = true
    }
  }

  mouseInPaletteBox(x, y) {
    let c = this.paletteC
    let r = this.paletteR
    x = Math.floor((x - this.paletteBox.x) / 32)
    y = Math.floor((this.paletteBox.height - (y - this.paletteBox.y)) / 32)
    if (x < this.paletteColumns && y < this.paletteRows && (x !== c || y !== r)) {
      this.paletteC = x
      this.paletteR = y
      this.canUpdate = true
    }
  }

  mouseInSheetBox(x, y) {
    let c = this.positionOffsetC
    let r = this.positionOffsetR
    let columns = this.sheetBox.width / this.sheetColumns
    let rows = this.sheetBox.height / this.sheetRows
    x = Math.floor((x - this.sheetBox.x) / columns)
    y = Math.floor((this.sheetBox.height - (y - this.sheetBox.y)) / rows)
    if (x + this.canvasZoom > this.sheetColumns) x = this.sheetColumns - this.canvasZoom
    if (y + this.canvasZoom > this.sheetRows) y = this.sheetRows - this.canvasZoom
    x = Math.floor(x / 8) * 8
    y = Math.floor(y / 8) * 8
    if (x !== c || y !== r) {
      this.positionOffsetC = x
      this.positionOffsetR = y
      this.canUpdate = true
    }
  }

  action() {
    if (this.canUpdate) {
      let columns = this.sheetColumns
      let index = this.positionC + this.positionOffsetC + (this.positionR + this.positionOffsetR) * columns
      let color = this.paletteC + this.paletteR * this.paletteColumns
      if (this.tool === PENCIL) this.pencil(index, color)
      else if (this.tool === FILL) this.fill(index, color)
      else if (this.tool === DROPLET) this.droplet(index)
      this.hasUpdates = true
      this.canUpdate = false
    }
  }

  pencil(start, color) {
    let saved = false
    let columns = this.sheetColumns
    for (let h = 0; h < this.brushSize; h++) {
      for (let c = 0; c < this.brushSize; c++) {
        let index = c + h * columns + start
        if (this.sheet[index] === color) continue
        if (!saved) {
          this.saveHistory()
          saved = true
        }
        this.sheet[index] = color
      }
    }
  }

  fill(start, color) {
    let match = this.sheet[start]
    if (match === color) return
    this.saveHistory()
    let rows = this.sheetRows
    let columns = this.sheetColumns
    let queue = [start]
    while (queue.length > 0) {
      let index = queue.shift()
      this.sheet[index] = color
      let c = index % columns
      let r = Math.floor(index / columns)
      if (c > 0 && this.sheet[index - 1] === match && !queue.includes(index - 1)) queue.push(index - 1)
      if (r > 0 && this.sheet[index - columns] === match && !queue.includes(index - columns)) queue.push(index - columns)
      if (c < columns - 1 && this.sheet[index + 1] === match && !queue.includes(index + 1)) queue.push(index + 1)
      if (r < rows - 1 && this.sheet[index + columns] === match && !queue.includes(index + columns)) queue.push(index + columns)
    }
  }

  droplet(index) {
    let color = this.sheet[index]
    this.paletteC = color % this.paletteColumns
    this.paletteR = Math.floor(color / this.paletteColumns)
  }

  undo() {
    if (this.historyPosition > 0) {
      console.debug('undo', this.historyPosition, this.history)
      if (this.historyPosition === this.history.length) {
        this.saveHistory()
        this.historyPosition--
      }
      this.historyPosition--
      this.sheet.set(this.history[this.historyPosition])
      this.hasUpdates = true
      this.canUpdate = true
    }
  }

  redo() {
    if (this.historyPosition < this.history.length - 1) {
      console.debug('redo', this.historyPosition, this.history)
      this.historyPosition++
      this.sheet.set(this.history[this.historyPosition])
      this.hasUpdates = true
      this.canUpdate = true
    }
  }

  saveHistory() {
    let sheet = this.sheet
    let history = this.history
    // console.debug('history', this.historyPosition, history)
    if (this.historyPosition >= history.length) {
      if (history.length === HISTORY_LIMIT) {
        let last = history[0]
        last.set(sheet)
        for (let i = 0; i < HISTORY_LIMIT - 1; i++) history[i] = history[i + 1]
        history[HISTORY_LIMIT - 1] = last
      } else {
        history.push(sheet.slice())
        this.historyPosition++
      }
    } else {
      history[this.historyPosition].set(sheet)
      this.historyPosition++
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

export function exportSheetToCanvas(painter, index, out) {
  let sheet = painter.sheets[index]
  let rows = painter.sheetRows
  let columns = painter.sheetColumns
  let palette = painter.palette
  for (let r = 0; r < rows; r++) {
    let row = r * columns
    for (let c = 0; c < columns; c++) {
      let i = c + row
      let p = sheet[i] * 3
      i *= 4
      if (p === 0) {
        out[i] = 0
        out[i + 1] = 0
        out[i + 2] = 0
        out[i + 3] = 0
      } else {
        out[i] = palette[p]
        out[i + 1] = palette[p + 1]
        out[i + 2] = palette[p + 2]
        out[i + 3] = 255
      }
    }
  }
}
