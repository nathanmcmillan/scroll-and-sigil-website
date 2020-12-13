import {flexText, flexSolve} from '/src/flex/flex.js'
import {FONT_WIDTH, FONT_HEIGHT} from '/src/render/render.js'
import {playSound} from '/src/assets/sounds.js'

const INPUT_RATE = 128

export class Home {
  constructor(width, height, scale, input) {
    this.width = width
    this.height = height
    this.scale = scale
    this.input = input
    this.shadowInput = true
    this.doPaint = true

    this.row = 0
    this.yes = false

    this.titleBox = null
    this.continueGameBox = null
    this.newGameBox = null
    this.editorBox = null
    this.optionsBox = null
    this.creditsBox = null
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
    const fontWidth = this.scale * FONT_WIDTH
    const fontHeight = this.scale * FONT_HEIGHT

    let text = 'Scroll and Sigil'
    let titleBox = flexText(text, fontWidth * text.length, fontHeight)
    titleBox.funX = '%'
    titleBox.argX = 15
    titleBox.funY = '%'
    titleBox.argY = 90
    flexSolve(width, height, titleBox)
    this.titleBox = titleBox

    text = 'continue'
    let continueGameBox = flexText(text, fontWidth * text.length, fontHeight)
    continueGameBox.leftSpace = fontWidth
    continueGameBox.funX = '%'
    continueGameBox.argX = 15
    continueGameBox.funY = '%'
    continueGameBox.argY = 25
    flexSolve(width, height, continueGameBox)
    this.continueGameBox = continueGameBox

    text = 'new game'
    let newGameBox = flexText(text, fontWidth * text.length, fontHeight)
    newGameBox.leftSpace = fontWidth
    newGameBox.funX = 'align-left'
    newGameBox.fromX = continueGameBox
    newGameBox.funY = 'below'
    newGameBox.fromY = continueGameBox
    flexSolve(width, height, newGameBox)
    this.newGameBox = newGameBox

    text = 'editor'
    let editorBox = flexText(text, fontWidth * text.length, fontHeight)
    editorBox.leftSpace = fontWidth
    editorBox.funX = 'align-left'
    editorBox.fromX = newGameBox
    editorBox.funY = 'below'
    editorBox.fromY = newGameBox
    flexSolve(width, height, editorBox)
    this.editorBox = editorBox

    text = 'options'
    let optionsBox = flexText(text, fontWidth * text.length, fontHeight)
    optionsBox.leftSpace = fontWidth
    optionsBox.funX = 'align-left'
    optionsBox.fromX = editorBox
    optionsBox.funY = 'below'
    optionsBox.fromY = editorBox
    flexSolve(width, height, optionsBox)
    this.optionsBox = optionsBox

    text = 'credits'
    let creditsBox = flexText(text, fontWidth * text.length, fontHeight)
    creditsBox.leftSpace = fontWidth
    creditsBox.funX = 'align-left'
    creditsBox.fromX = optionsBox
    creditsBox.funY = 'below'
    creditsBox.fromY = optionsBox
    flexSolve(width, height, creditsBox)
    this.creditsBox = creditsBox
  }

  update(timestamp) {
    this.doPaint = false
    if (this.input.nothingOn()) {
      if (this.shadowInput) this.shadowInput = false
      else return
    } else this.shadowInput = true
    this.doPaint = true

    let input = this.input

    if (input.timerLeftUp(timestamp, INPUT_RATE)) {
      this.row--
      if (this.row < 0) this.row = 0
      else playSound('baron-pain')
    }

    if (input.timerLeftDown(timestamp, INPUT_RATE)) {
      this.row++
      if (this.row > 4) this.row = 4
      else playSound('baron-pain')
    }

    if (input.pressA()) this.yes = true
  }
}
