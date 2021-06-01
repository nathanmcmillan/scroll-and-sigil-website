/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { playSound } from '../assets/sound-manager.js'
import { calcFontPad, calcFontScale, defaultFont } from '../editor/editor-util.js'
import { flexSolve, flexText } from '../gui/flex.js'
import { INPUT_RATE } from '../io/input.js'

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

  pause() {}

  resume() {}

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

    const font = defaultFont()
    const fontScale = calcFontScale(this.scale)
    const fontWidth = fontScale * font.width
    const fontHeight = fontScale * font.height
    const fontPad = calcFontPad(fontHeight)

    let text = 'Scroll and Sigil'
    const titleBox = flexText(text, 2 * fontWidth * text.length, 2 * fontHeight)
    titleBox.funX = '%'
    titleBox.argX = 15
    titleBox.funY = '%'
    titleBox.argY = 90
    this.titleBox = titleBox

    text = 'Continue'
    const continueGameBox = flexText(text, fontWidth * text.length, fontHeight)
    continueGameBox.bottomSpace = fontPad
    continueGameBox.funX = '%'
    continueGameBox.argX = 15
    continueGameBox.funY = '%'
    continueGameBox.argY = 25
    this.continueGameBox = continueGameBox

    text = 'New Game'
    const newGameBox = flexText(text, fontWidth * text.length, fontHeight)
    newGameBox.bottomSpace = fontPad
    newGameBox.funX = 'align-left'
    newGameBox.fromX = continueGameBox
    newGameBox.funY = 'below'
    newGameBox.fromY = continueGameBox
    this.newGameBox = newGameBox

    text = 'Editor'
    const editorBox = flexText(text, fontWidth * text.length, fontHeight)
    editorBox.bottomSpace = fontPad
    editorBox.funX = 'align-left'
    editorBox.fromX = newGameBox
    editorBox.funY = 'below'
    editorBox.fromY = newGameBox
    this.editorBox = editorBox

    text = 'Options'
    const optionsBox = flexText(text, fontWidth * text.length, fontHeight)
    optionsBox.bottomSpace = fontPad
    optionsBox.funX = 'align-left'
    optionsBox.fromX = editorBox
    optionsBox.funY = 'below'
    optionsBox.fromY = editorBox
    this.optionsBox = optionsBox

    text = 'Credits'
    const creditsBox = flexText(text, fontWidth * text.length, fontHeight)
    creditsBox.bottomSpace = fontPad
    creditsBox.funX = 'align-left'
    creditsBox.fromX = optionsBox
    creditsBox.funY = 'below'
    creditsBox.fromY = optionsBox
    this.creditsBox = creditsBox

    flexSolve(width, height, titleBox)
    flexSolve(width, height, continueGameBox)
    flexSolve(width, height, newGameBox)
    flexSolve(width, height, editorBox)
    flexSolve(width, height, optionsBox)
    flexSolve(width, height, creditsBox)
  }

  immediate() {}

  events() {
    const input = this.input
    if (input.pressA() || input.pressStart()) {
      this.parent.eventCall('Ok')
      return true
    }
    return false
  }

  update(timestamp) {
    if (this.events()) return

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
