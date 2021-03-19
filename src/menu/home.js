import { playSound } from '../assets/sounds.js'
import { calcFontPad, calcFontScale } from '../editor/editor-util.js'
import { flexSolve, flexText } from '../gui/flex.js'
import { TIC_FONT_HEIGHT, TIC_FONT_WIDTH } from '../render/render.js'

const INPUT_RATE = 128

export class Home {
  constructor(parent, width, height, scale, input) {
    this.parent = parent
    this.width = width
    this.height = height
    this.scale = scale
    this.input = input
    this.shadowInput = true
    this.doPaint = true
    this.forcePaint = false

    this.row = 0
    this.yes = false

    this.titleBox = null
    this.continueGameBox = null
    this.newGameBox = null
    this.editorBox = null
    this.optionsBox = null
    this.creditsBox = null

    this.resize(width, height, scale)
  }

  reset() {
    this.row = 0
    this.yes = false
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

  async load() {}

  plan() {
    const width = this.width
    const height = this.height

    const fontScale = calcFontScale(this.scale)
    const fontWidth = fontScale * TIC_FONT_WIDTH
    const fontHeight = fontScale * TIC_FONT_HEIGHT
    const fontPad = calcFontPad(fontHeight)

    let text = 'Scroll and Sigil'
    const titleBox = flexText(text, 2 * fontWidth * text.length, 2 * fontHeight)
    titleBox.funX = '%'
    titleBox.argX = 15
    titleBox.funY = '%'
    titleBox.argY = 90
    this.titleBox = titleBox

    text = 'continue'
    const continueGameBox = flexText(text, fontWidth * text.length, fontHeight)
    continueGameBox.bottomSpace = fontPad
    continueGameBox.funX = '%'
    continueGameBox.argX = 15
    continueGameBox.funY = '%'
    continueGameBox.argY = 25
    this.continueGameBox = continueGameBox

    text = 'new game'
    const newGameBox = flexText(text, fontWidth * text.length, fontHeight)
    newGameBox.bottomSpace = fontPad
    newGameBox.funX = 'align-left'
    newGameBox.fromX = continueGameBox
    newGameBox.funY = 'below'
    newGameBox.fromY = continueGameBox
    this.newGameBox = newGameBox

    text = 'editor'
    const editorBox = flexText(text, fontWidth * text.length, fontHeight)
    editorBox.bottomSpace = fontPad
    editorBox.funX = 'align-left'
    editorBox.fromX = newGameBox
    editorBox.funY = 'below'
    editorBox.fromY = newGameBox
    this.editorBox = editorBox

    text = 'options'
    const optionsBox = flexText(text, fontWidth * text.length, fontHeight)
    optionsBox.bottomSpace = fontPad
    optionsBox.funX = 'align-left'
    optionsBox.fromX = editorBox
    optionsBox.funY = 'below'
    optionsBox.fromY = editorBox
    this.optionsBox = optionsBox

    text = 'credits'
    const creditsBox = flexText(text, fontWidth * text.length, fontHeight)
    creditsBox.bottomSpace = fontPad
    creditsBox.funX = 'align-left'
    creditsBox.fromX = optionsBox
    creditsBox.funY = 'below'
    creditsBox.fromY = optionsBox
    this.creditsBox = creditsBox

    flexSolve(width, height, titleBox, continueGameBox, newGameBox, editorBox, optionsBox, creditsBox)
  }

  immediateInput() {
    const input = this.input
    if (input.pressA() || input.pressStart()) this.parent.eventCall('ok')
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

    const input = this.input

    if (input.timerStickUp(timestamp, INPUT_RATE)) {
      if (this.row > 0) {
        this.row--
        playSound('baron-pain')
      }
    } else if (input.timerStickDown(timestamp, INPUT_RATE)) {
      if (this.row < 4) {
        this.row++
        playSound('baron-pain')
      }
    }
  }
}
