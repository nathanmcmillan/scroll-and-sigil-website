import { fetchText } from '../client/net.js'
import { calcFontScale } from '../editor/editor-util.js'
import { describeColor, newPalette, newPaletteFloat } from '../editor/palette.js'
import { Dialog } from '../gui/dialog.js'
import { flexBox, flexSize, flexSolve } from '../gui/flex.js'
import { TextBox } from '../gui/text-box.js'
import { TIC_FONT_HEIGHT, TIC_FONT_WIDTH } from '../render/render.js'

const PENCIL = 0
const FILL = 1
const DROPLET = 2
const SELECT = 3
export const SPRITE_TOOL = 4
export const CLEAR_TOOL = 5

const INPUT_RATE = 128
const HISTORY_LIMIT = 50

class SpriteBox {
  constructor(name, left, top, right, bottom, tile) {
    this.name = name
    this.left = left
    this.top = top
    this.right = right
    this.bottom = bottom
    this.tile = tile
  }

  select(c, r) {
    return c >= this.left && c <= this.right && r >= this.top && r <= this.bottom
  }

  export() {
    let content = `${this.name} ${this.left} ${this.top} ${this.right} ${this.bottom}`
    if (this.tile) content += ' tile'
    return content
  }
}

export class PaintEdit {
  constructor(parent, width, height, scale, input) {
    this.parent = parent
    this.width = width
    this.height = height
    this.scale = scale
    this.input = input
    this.shadowInput = true
    this.doPaint = true
    this.forcePaint = false
    this.hasUpdates = false

    this.paletteRows = 4
    this.paletteColumns = 8
    this.palette = newPalette()
    this.paletteFloat = newPaletteFloat(this.palette)

    this.sheetRows = 128
    this.sheetColumns = 128

    this.name = 'untitled'
    this.transparency = 0

    this.sheet = new Uint8Array(this.sheetRows * this.sheetColumns)
    let i = this.sheet.length
    while (i--) this.sheet[i] = 0

    this.sprites = []

    this.paletteC = 0
    this.paletteR = 0

    this.brushSize = 1
    this.canvasZoom = 8

    this.positionOffsetC = 0
    this.positionOffsetR = 0

    this.positionC = 0
    this.positionR = 0

    this.toolColumns = 6
    this.tool = 0

    this.selectL = null
    this.selectT = null
    this.selectR = null
    this.selectB = null
    this.selectDrag = false
    this.selectCopy = false
    this.activeSprite = null

    this.history = []
    this.historyPosition = 0

    this.sheetBox = null
    this.viewBox = null
    this.miniBox = null
    this.toolBox = null
    this.paletteBox = null

    this.dialog = null
    this.dialogStack = []

    this.startMenuDialog = new Dialog('start', null, ['name', 'new', 'open', 'save', 'export', 'exit'])
    this.exportDialog = new Dialog('export', 'export to file', ['plain text', 'png', 'huffman', 'back'])
    this.askToSaveDialog = new Dialog('ask', 'save current file?', ['save', 'export', 'no'])
    this.spriteDialog = new Dialog('sprite', 'sprite', ['name', 'tile', 'delete'])
    this.saveOkDialog = new Dialog('ok', 'file saved', ['ok'])
    this.errorOkDialog = new Dialog('error', null, ['ok'])

    this.activeTextBox = false
    this.textBox = new TextBox('', 20)

    this.resize(width, height, scale)
  }

  clear() {
    this.name = 'untitled'
    this.transparency = 0

    let i = this.sheet.length
    while (i--) this.sheet[i] = 0

    this.sprites.length = 0

    this.selectL = null
    this.selectT = null
    this.selectR = null
    this.selectB = null
    this.selectDrag = false
    this.selectCopy = false
    this.activeSprite = null

    this.history.length = 0
    this.historyPosition = 0

    return null
  }

  reset() {
    this.dialogResetAll()
  }

  handleDialog(event) {
    const poll = this.dialogStack[0]
    if (event === 'ok-ok') {
      if (poll === 'start-exit') this.parent.eventCall(poll)
      this.dialogEnd()
    } else if (event === 'ask-save') {
      if (poll === 'start-open') {
        this.parent.eventCall(event)
      } else if (poll === 'start-exit') {
        this.parent.eventCall('start-save')
        this.dialogStack.push(event)
        this.dialog = this.saveOkDialog
        this.forcePaint = true
      }
    } else if (event === 'start-name') {
      this.textBox.reset(this.name)
      this.activeTextBox = true
      this.dialogEnd()
    } else if (event === 'start-export' || event === 'ask-export') {
      this.dialogStack.push(event)
      this.dialog = this.exportDialog
      this.forcePaint = true
    } else if (event === 'ask-no') {
      this.parent.eventCall(poll)
      this.dialogEnd()
    } else if (event === 'export-back') {
      this.dialogStack.push(event)
      this.dialog = this.startMenuDialog
      this.forcePaint = true
    } else if (event === 'export-plain text' || event === 'export-png' || event === 'export-huffman') {
      this.parent.eventCall(event)
      this.dialogEnd()
    } else if (event === 'start-save') {
      this.parent.eventCall(event)
      this.dialogStack.push(event)
      this.dialog = this.saveOkDialog
      this.forcePaint = true
    } else if (event === 'start-new' || event === 'start-open' || event === 'start-exit') {
      if (this.historyPosition === 0) {
        this.parent.eventCall(event)
        this.dialogEnd()
      } else {
        this.dialogStack.push(event)
        this.dialog = this.askToSaveDialog
        this.forcePaint = true
      }
    } else if (event === 'sprite-name') {
      this.textBox.reset(this.activeSprite.name)
      this.activeTextBox = true
      this.activeSprite = null
      this.dialogEnd()
    } else if (event === 'sprite-tile on') {
      this.activeSprite.tile = false
      this.spriteDialog.options[1] = 'tile off'
      this.forcePaint = true
    } else if (event === 'sprite-tile off') {
      this.activeSprite.tile = true
      this.spriteDialog.options[1] = 'tile on'
      this.forcePaint = true
    } else if (event === 'sprite-delete') {
      this.sprites.splice(this.sprites.indexOf(this.activeSprite, 1))
      this.activeSprite = null
      this.dialogEnd()
    }
  }

  dialogResetAll() {
    this.startMenuDialog.reset()
    this.exportDialog.reset()
    this.askToSaveDialog.reset()
    this.spriteDialog.reset()
    this.saveOkDialog.reset()
    this.errorOkDialog.reset()
  }

  dialogEnd() {
    this.dialogResetAll()
    this.dialog = null
    this.dialogStack.length = 0
    this.forcePaint = true
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
    const fontScale = calcFontScale(scale)
    const fontWidth = fontScale * TIC_FONT_WIDTH
    const fontHeight = fontScale * TIC_FONT_HEIGHT

    let magnify = 2 * scale
    const sheetBox = flexBox(magnify * sheetColumns, magnify * sheetRows)
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
    const viewBox = flexBox(canvasZoom * magnify, canvasZoom * magnify)
    viewBox.topSpace = Math.ceil(0.5 * fontHeight)
    viewBox.bottomSpace = 2 * fontHeight
    viewBox.funX = 'right-of'
    viewBox.fromX = sheetBox
    viewBox.funY = 'align-top'
    viewBox.fromY = sheetBox
    this.viewBox = viewBox

    magnify = 16 * scale
    const miniBox = flexBox(magnify, magnify)
    miniBox.rightSpace = fontWidth
    miniBox.funX = 'align-left'
    miniBox.fromX = viewBox
    miniBox.funY = 'below'
    miniBox.fromY = viewBox
    this.miniBox = miniBox

    magnify = 16 * scale
    const toolBox = flexBox(toolColumns * magnify, 2 * fontHeight)
    toolBox.bottomSpace = 2 * fontHeight
    toolBox.funX = 'right-of'
    toolBox.fromX = miniBox
    toolBox.funY = 'center'
    toolBox.fromY = miniBox
    this.toolBox = toolBox

    magnify = 16 * scale
    const paletteBox = flexBox(paletteColumns * magnify, paletteRows * magnify)
    paletteBox.funX = 'center'
    paletteBox.fromX = viewBox
    paletteBox.funY = 'below'
    paletteBox.fromY = toolBox
    this.paletteBox = paletteBox

    const collection = [sheetBox, viewBox, miniBox, toolBox, paletteBox]
    flexSolve(width, height, ...collection)

    const size = flexSize(...collection)
    const canvas = flexBox(size[2], size[3])
    canvas.funX = 'center'
    flexSolve(width, height, canvas)

    sheetBox.argX = canvas.x
    flexSolve(width, height, ...collection)
  }

  read(content) {
    this.clear()

    try {
      const image = content.split('\n')

      const info = image[0].split(' ')

      this.name = info[1]
      let width = parseInt(info[2])
      let height = parseInt(info[3])

      let index = 1

      if (image[index].startsWith('transparency')) {
        this.transparency = parseInt(image[index].split(' ')[1])
        index++
      }

      const sheet = this.sheet
      const rows = this.sheetRows
      const columns = this.sheetColumns

      if (height > rows) height = rows
      if (width > columns) width = columns

      for (let h = 0; h < height; h++) {
        const row = image[index].split(' ')
        for (let c = 0; c < width; c++) {
          sheet[c + h * columns] = parseInt(row[c])
        }
        index++
      }

      if (index < image.length) {
        if (image[index] === 'sprites') {
          index++
          while (index < image.length) {
            if (image[index] === 'end sprites') break
            const sprite = image[index].split(' ')
            const tile = sprite.length >= 6 && sprite[5] === 'tile'
            this.sprites.push(new SpriteBox(sprite[0], parseInt(sprite[1]), parseInt(sprite[2]), parseInt(sprite[3]), parseInt(sprite[4]), tile))
            index++
          }
        }
      }
    } catch (e) {
      console.error(e)
      this.errorOkDialog.title = 'Failed reading file'
      this.dialog = this.errorOkDialog
    }

    this.shadowInput = true
    this.doPaint = true
  }

  async load(file) {
    let content = null
    if (file) content = await fetchText(file)
    else content = localStorage.getItem('paint.txt')
    if (content === null || content === undefined) return this.clear()
    this.read(content)
  }

  topLeftStatus() {
    if (this.tool === PENCIL) return 'DRAW'
    else if (this.tool === FILL) return 'FILL'
    else if (this.tool === DROPLET) return 'COLOR PICKER'
    else if (this.tool === SELECT) return 'SELECT'
    else if (this.tool === SPRITE_TOOL) return 'SPRITES'
    else if (this.tool === CLEAR_TOOL) return 'CLEAR'
    return null
  }

  topRightStatus() {
    if (this.selectDrag) return 'CUT SELECTION'
    else if (this.selectCopy) return 'COPY SELECTION'
    else if (this.selectL !== null) {
      if (this.selectR !== null) return 'SELECT READY'
      return 'END SELECT'
    } else if (this.activeSprite) return 'SPRITE: ' + this.activeSprite.name.toUpperCase()
    return null
  }

  bottomLeftStatus() {
    if (this.dialog !== null) return null
    const input = this.input
    if (input.x()) return 'COLOR: ' + describeColor(this.paletteC + this.paletteR * this.paletteColumns).toUpperCase()
    else if (input.y()) {
      const prefix = 'TOOL: '
      if (this.tool === PENCIL) return prefix + 'DRAW'
      else if (this.tool === FILL) return prefix + 'FILL'
      else if (this.tool === DROPLET) return prefix + 'COLOR PICKER'
      else if (this.tool === SELECT) return prefix + 'SELECT'
      else if (this.tool === SPRITE_TOOL) return prefix + 'SPRITES'
      else if (this.tool === CLEAR_TOOL) return prefix + 'CLEAR'
    } else if (input.select()) return 'BRUSH SIZE: ' + this.brushSize + ' ZOOM: ' + this.canvasZoom + 'X'
    else return 'X:' + this.positionC + ' Y:' + this.positionR
  }

  bottomRightStatus() {
    if (this.dialog !== null) return 'A/OK B/CANCEL'
    const input = this.input
    if (input.x()) return 'X/OK'
    else if (input.y()) return 'Y/OK'
    else if (input.b()) return 'B/OK'
    else if (input.select()) return 'SELECT/OK'
    else return 'X/COLOR Y/TOOL B/MOVE A/DRAW'
  }

  immediateInput() {
    const input = this.input
    if (this.activeTextBox) {
      if (input.pressY()) {
        this.textBox.erase()
        this.forcePaint = true
      } else if (input.pressA()) {
        if (this.textBox.end()) {
          if (this.activeSprite) {
            this.activeSprite.name = this.textBox.text
            this.activeSprite = null
          } else this.name = this.textBox.text
          this.activeTextBox = false
          this.forcePaint = true
        } else {
          this.textBox.apply()
          this.forcePaint = true
        }
      }
      return
    }
    if (this.dialog === null) return
    if (input.pressB()) {
      this.dialog = null
      this.dialogStack.length = 0
      this.forcePaint = true
    }
    if (input.pressA() || input.pressStart()) {
      const id = this.dialog.id
      const option = this.dialog.options[this.dialog.pos]
      this.handleDialog(id + '-' + option)
    }
  }

  toolSwitch(i) {
    if (this.selectL !== null) {
      this.selectL = null
      this.selectR = null
      this.selectT = null
      this.selectB = null
      this.selectDrag = false
      this.selectCopy = false
    }
    this.activeSprite = null
    this.tool += i
  }

  update(timestamp) {
    if (this.forcePaint) {
      this.doPaint = true
      this.forcePaint = false
    } else this.doPaint = false
    if (this.input.nothingOn()) {
      if (this.shadowInput) this.shadowInput = false
      else return
    } else this.shadowInput = true
    this.doPaint = true
    this.hasUpdates = false

    const input = this.input

    if (this.dialog !== null) {
      if (input.timerStickUp(timestamp, INPUT_RATE)) {
        if (this.dialog.pos > 0) this.dialog.pos--
      } else if (input.timerStickDown(timestamp, INPUT_RATE)) {
        if (this.dialog.pos < this.dialog.options.length - 1) this.dialog.pos++
      }
      return
    } else if (this.activeTextBox) {
      if (input.timerStickUp(timestamp, INPUT_RATE)) this.textBox.up()
      else if (input.timerStickDown(timestamp, INPUT_RATE)) this.textBox.down()
      else if (input.timerStickLeft(timestamp, INPUT_RATE)) this.textBox.left()
      else if (input.timerStickRight(timestamp, INPUT_RATE)) this.textBox.right()
      return
    }

    if (input.x()) {
      if (input.timerStickUp(timestamp, INPUT_RATE)) {
        if (this.paletteR > 0) this.paletteR--
      }

      if (input.timerStickDown(timestamp, INPUT_RATE)) {
        if (this.paletteR < this.paletteRows - 1) this.paletteR++
      }

      if (input.timerStickLeft(timestamp, INPUT_RATE)) {
        this.paletteC--
        if (this.paletteC < 0) this.paletteC = 0
      }

      if (input.timerStickRight(timestamp, INPUT_RATE)) {
        if (this.paletteC < this.paletteColumns - 1) this.paletteC++
      }
    } else if (input.y()) {
      if (input.timerStickLeft(timestamp, INPUT_RATE)) {
        if (this.tool > 0) this.toolSwitch(-1)
      }

      if (input.timerStickRight(timestamp, INPUT_RATE)) {
        if (this.tool < this.toolColumns - 1) this.toolSwitch(1)
      }
    } else if (input.b()) {
      const move = 8

      if (input.timerStickUp(timestamp, INPUT_RATE)) {
        this.positionOffsetR -= move
        if (this.positionOffsetR < 0) this.positionOffsetR = 0
      }

      if (input.timerStickDown(timestamp, INPUT_RATE)) {
        this.positionOffsetR += move
        if (this.positionOffsetR + this.canvasZoom >= this.sheetRows) this.positionOffsetR = this.sheetRows - this.canvasZoom
      }

      if (input.timerStickLeft(timestamp, INPUT_RATE)) {
        this.positionOffsetC -= move
        if (this.positionOffsetC < 0) this.positionOffsetC = 0
      }

      if (input.timerStickRight(timestamp, INPUT_RATE)) {
        this.positionOffsetC += move
        if (this.positionOffsetC + this.canvasZoom >= this.sheetColumns) this.positionOffsetC = this.sheetColumns - this.canvasZoom
      }
    } else if (input.select()) {
      if (input.timerStickLeft(timestamp, INPUT_RATE)) {
        this.brushSize--
        if (this.brushSize < 1) this.brushSize = 1
      }
      if (input.timerStickRight(timestamp, INPUT_RATE)) {
        this.brushSize++
        if (this.brushSize > 4) this.brushSize = 4
        if (this.positionR + this.brushSize >= this.canvasZoom) this.positionR = this.canvasZoom - this.brushSize
        if (this.positionC + this.brushSize > this.canvasZoom) this.positionC = this.canvasZoom - this.brushSize
      }
      if (input.timerStickUp(timestamp, INPUT_RATE)) {
        this.canvasZoom /= 2
        if (this.canvasZoom < 8) this.canvasZoom = 8
        if (this.positionR + this.brushSize >= this.canvasZoom) this.positionR = this.canvasZoom - this.brushSize
        if (this.positionC + this.brushSize > this.canvasZoom) this.positionC = this.canvasZoom - this.brushSize
      }
      if (input.timerStickDown(timestamp, INPUT_RATE)) {
        this.canvasZoom *= 2
        if (this.canvasZoom > 64) this.canvasZoom = 64
        if (this.positionOffsetR + this.canvasZoom >= this.sheetRows) this.positionOffsetR = this.sheetRows - this.canvasZoom
        if (this.positionOffsetC + this.canvasZoom >= this.sheetColumns) this.positionOffsetC = this.sheetColumns - this.canvasZoom
      }
    } else {
      if (input.timerStickUp(timestamp, INPUT_RATE)) {
        this.positionR--
        if (this.positionR < 0) this.positionR = 0
      }

      if (input.timerStickDown(timestamp, INPUT_RATE)) {
        this.positionR++
        if (this.positionR + this.brushSize > this.canvasZoom) this.positionR = this.canvasZoom - this.brushSize
      }

      if (input.timerStickLeft(timestamp, INPUT_RATE)) {
        this.positionC--
        if (this.positionC < 0) this.positionC = 0
      }

      if (input.timerStickRight(timestamp, INPUT_RATE)) {
        this.positionC++
        if (this.positionC + this.brushSize > this.canvasZoom) this.positionC = this.canvasZoom - this.brushSize
      }
    }

    if (this.allowAction(input, timestamp)) this.action()

    if (input.pressLeftTrigger()) this.undo()
    if (input.pressRightTrigger()) this.redo()
    if (input.pressStart()) this.dialog = this.startMenuDialog

    if (input.mouseMoved()) {
      input.mouseMoveOff()
      const x = input.mouseX()
      const y = input.mouseY()
      if (this.viewBox.inside(x, y)) this.mouseInViewBox(x, y)
    }

    if (input.mouseLeft()) {
      const x = input.mouseX()
      const y = input.mouseY()
      if (this.viewBox.inside(x, y)) {
        this.mouseInViewBox(x, y)
        if (this.allowMouseAction(input)) this.action()
      } else if (this.paletteBox.inside(x, y)) this.mouseInPaletteBox(x, y)
      else if (this.sheetBox.inside(x, y)) this.mouseInSheetBox(x, y)
    }
  }

  mouseInViewBox(x, y) {
    const c = this.positionC
    const r = this.positionR
    x = Math.floor((x - this.viewBox.x) / 32)
    y = Math.floor((this.viewBox.height - (y - this.viewBox.y)) / 32)
    if (x < 8 && y < 8 && (x !== c || y !== r)) {
      this.positionC = x
      this.positionR = y
    }
  }

  mouseInPaletteBox(x, y) {
    const c = this.paletteC
    const r = this.paletteR
    x = Math.floor((x - this.paletteBox.x) / 32)
    y = Math.floor((this.paletteBox.height - (y - this.paletteBox.y)) / 32)
    if (x < this.paletteColumns && y < this.paletteRows && (x !== c || y !== r)) {
      this.paletteC = x
      this.paletteR = y
    }
  }

  mouseInSheetBox(x, y) {
    const c = this.positionOffsetC
    const r = this.positionOffsetR
    const columns = this.sheetBox.width / this.sheetColumns
    const rows = this.sheetBox.height / this.sheetRows
    x = Math.floor((x - this.sheetBox.x) / columns)
    y = Math.floor((this.sheetBox.height - (y - this.sheetBox.y)) / rows)
    if (x + this.canvasZoom > this.sheetColumns) x = this.sheetColumns - this.canvasZoom
    if (y + this.canvasZoom > this.sheetRows) y = this.sheetRows - this.canvasZoom
    x = Math.floor(x / 8) * 8
    y = Math.floor(y / 8) * 8
    if (x !== c || y !== r) {
      this.positionOffsetC = x
      this.positionOffsetR = y
    }
  }

  allowAction(input, timestamp) {
    if (this.tool === PENCIL || this.tool === FILL || this.tool === DROPLET) return input.timerA(timestamp, INPUT_RATE)
    return input.pressA()
  }

  allowMouseAction(input) {
    if (this.tool === PENCIL || this.tool === DROPLET) return true
    return input.mouseClickLeft()
  }

  action() {
    const columns = this.sheetColumns
    const index = this.positionC + this.positionOffsetC + (this.positionR + this.positionOffsetR) * columns
    const color = this.paletteC + this.paletteR * this.paletteColumns
    if (this.tool === PENCIL) this.hasUpdates = this.pencil(index, color)
    else if (this.tool === FILL) this.hasUpdates = this.fill(index, color)
    else if (this.tool === DROPLET) this.hasUpdates = this.droplet(index)
    else if (this.tool === SELECT) this.hasUpdates = this.select(index, color)
    else if (this.tool === SPRITE_TOOL) this.hasUpdates = this.sprite(index)
    else if (this.tool === CLEAR_TOOL) this.hasUpdates = this.clearSquare(color)
  }

  pencil(start, color) {
    let saved = false
    const columns = this.sheetColumns
    for (let h = 0; h < this.brushSize; h++) {
      for (let c = 0; c < this.brushSize; c++) {
        const index = c + h * columns + start
        if (this.sheet[index] === color) continue
        if (!saved) {
          this.saveHistory()
          saved = true
        }
        this.sheet[index] = color
      }
    }
    return saved
  }

  fill(start, color) {
    const match = this.sheet[start]
    if (match === color) return false
    this.saveHistory()
    const rows = this.sheetRows
    const columns = this.sheetColumns
    const queue = [start]
    while (queue.length > 0) {
      const index = queue.shift()
      this.sheet[index] = color
      const c = index % columns
      const r = Math.floor(index / columns)
      if (c > 0 && this.sheet[index - 1] === match && !queue.includes(index - 1)) queue.push(index - 1)
      if (r > 0 && this.sheet[index - columns] === match && !queue.includes(index - columns)) queue.push(index - columns)
      if (c < columns - 1 && this.sheet[index + 1] === match && !queue.includes(index + 1)) queue.push(index + 1)
      if (r < rows - 1 && this.sheet[index + columns] === match && !queue.includes(index + columns)) queue.push(index + columns)
    }
    return true
  }

  droplet(index) {
    const color = this.sheet[index]
    this.paletteC = color % this.paletteColumns
    this.paletteR = Math.floor(color / this.paletteColumns)
    return false
  }

  select(index, color) {
    const columns = this.sheetColumns
    const c = index % columns
    const r = Math.floor(index / columns)
    if (this.selectR !== null) {
      if (this.selectDrag) {
        this.saveHistory()
        const rows = this.sheetRows
        const width = this.selectR - this.selectL + 1
        const height = this.selectB - this.selectT + 1
        for (let x = 0; x < width; x++) {
          const w = c + x
          if (w >= columns) continue
          for (let y = 0; y < height; y++) {
            const h = r + y
            if (h >= rows) continue
            const src = this.selectL + x + (this.selectT + y) * columns
            const dest = w + h * columns
            this.sheet[dest] = this.sheet[src]
            this.sheet[src] = color
          }
        }
        this.selectL = null
        this.selectT = null
        this.selectR = null
        this.selectB = null
        this.selectDrag = false
        return true
      } else if (this.selectCopy) {
        if (c >= this.selectL && c <= this.selectR && r >= this.selectT && r <= this.selectB) {
          this.selectDrag = true
          this.selectCopy = false
        } else {
          this.saveHistory()
          const rows = this.sheetRows
          const width = this.selectR - this.selectL + 1
          const height = this.selectB - this.selectT + 1
          for (let x = 0; x < width; x++) {
            const w = c + x
            if (w >= columns) continue
            for (let y = 0; y < height; y++) {
              const h = r + y
              if (h >= rows) continue
              const src = this.selectL + x + (this.selectT + y) * columns
              const dest = w + h * columns
              this.sheet[dest] = this.sheet[src]
            }
          }
          this.selectL = null
          this.selectT = null
          this.selectR = null
          this.selectB = null
          this.selectCopy = false
          return true
        }
      } else if (c >= this.selectL && c <= this.selectR && r >= this.selectT && r <= this.selectB) {
        this.selectCopy = true
      } else {
        this.selectL = null
        this.selectT = null
        this.selectR = null
        this.selectB = null
      }
    } else if (this.selectL === null) {
      this.selectL = c
      this.selectT = r
      this.selectR = null
      this.selectB = null
    } else if (this.selectR === null) {
      this.selectR = c
      this.selectB = r
      if (this.selectR < this.selectL) {
        const temp = this.selectL
        this.selectL = this.selectR
        this.selectR = temp
      }
      if (this.selectB < this.selectT) {
        const temp = this.selectT
        this.selectT = this.selectB
        this.selectB = temp
      }
    }
    return false
  }

  sprite(index) {
    const columns = this.sheetColumns
    const c = index % columns
    const r = Math.floor(index / columns)
    if (this.selectR !== null) {
      if (c >= this.selectL && c <= this.selectR && r >= this.selectT && r <= this.selectB) {
        const sprite = new SpriteBox('untitled', this.selectL, this.selectT, this.selectR, this.selectB, false)
        this.sprites.push(sprite)
        this.activeSprite = sprite
        this.spriteDialog.title = sprite.name
        this.spriteDialog.options[1] = sprite.tile ? 'tile off' : 'tile on'
        this.dialog = this.spriteDialog
      }
      this.selectL = null
      this.selectT = null
      this.selectR = null
      this.selectB = null
      return false
    }
    if (this.selectL === null) {
      for (const sprite of this.sprites) {
        if (sprite.select(c, r)) {
          this.activeSprite = sprite
          this.spriteDialog.title = sprite.name
          this.spriteDialog.options[1] = sprite.tile ? 'tile off' : 'tile on'
          this.dialog = this.spriteDialog
          return false
        }
      }
      this.selectL = c
      this.selectT = r
      this.selectR = null
      this.selectB = null
    } else if (this.selectR === null) {
      this.selectR = c
      this.selectB = r
      if (this.selectR < this.selectL) {
        const temp = this.selectL
        this.selectL = this.selectR
        this.selectR = temp
      }
      if (this.selectB < this.selectT) {
        const temp = this.selectT
        this.selectT = this.selectB
        this.selectB = temp
      }
    }
    return false
  }

  clearSquare(color) {
    const columns = this.sheetColumns
    const start = this.positionOffsetC + this.positionOffsetR * columns
    let saved = false
    for (let h = 0; h < 8; h++) {
      for (let c = 0; c < 8; c++) {
        const index = c + h * columns + start
        if (this.sheet[index] === color) continue
        if (!saved) {
          this.saveHistory()
          saved = true
        }
        this.sheet[index] = color
      }
    }
    return saved
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
    }
  }

  redo() {
    if (this.historyPosition < this.history.length - 1) {
      console.debug('redo', this.historyPosition, this.history)
      this.historyPosition++
      this.sheet.set(this.history[this.historyPosition])
      this.hasUpdates = true
    }
  }

  saveHistory() {
    const sheet = this.sheet
    const history = this.history
    // console.debug('history', this.historyPosition, history)
    if (this.historyPosition >= history.length) {
      if (history.length === HISTORY_LIMIT) {
        const last = history[0]
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
    const rows = this.sheetRows
    const columns = this.sheetColumns
    let content = `paint ${this.name} ${columns} ${rows}`
    if (this.transparency !== 0) content += `\ntransparency ${this.transparency}`
    const sheet = this.sheet
    for (let r = 0; r < rows; r++) {
      content += '\n'
      for (let c = 0; c < columns; c++) {
        const index = c + r * columns
        content += sheet[index] + ' '
      }
    }
    if (this.sprites.length > 0) {
      content += '\nsprites'
      for (const sprite of this.sprites) content += `\n${sprite.export()}`
      content += '\nend sprites'
    }
    content += '\nend paint'
    return content
  }
}

export function exportPixels(paint) {
  const sheet = paint.sheet
  const rows = paint.sheetRows
  const columns = paint.sheetColumns
  const palette = paint.palette
  const pixels = new Uint8Array(rows * columns * 3)
  for (let r = 0; r < rows; r++) {
    const row = r * columns
    for (let c = 0; c < columns; c++) {
      let i = c + row
      const p = sheet[i] * 3
      i *= 3
      pixels[i] = palette[p]
      pixels[i + 1] = palette[p + 1]
      pixels[i + 2] = palette[p + 2]
    }
  }
  return pixels
}

export function exportToCanvas(paint, out) {
  const sheet = paint.sheet
  const rows = paint.sheetRows
  const columns = paint.sheetColumns
  const palette = paint.palette
  for (let r = 0; r < rows; r++) {
    const row = r * columns
    for (let c = 0; c < columns; c++) {
      let i = c + row
      const p = sheet[i] * 3
      i *= 4
      out[i] = palette[p]
      out[i + 1] = palette[p + 1]
      out[i + 2] = palette[p + 2]
      out[i + 3] = 255
    }
  }
}
