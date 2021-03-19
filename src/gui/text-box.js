const COLUMNS = [
  ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm'],
  ['n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
  ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-', 'end'],
]

export class TextBox {
  constructor(text, limit) {
    this.text = text
    this.limit = limit
    this.c = 0
    this.r = 0
    this.cols = COLUMNS
  }

  up() {
    if (this.r > 0) this.r--
  }

  down() {
    if (this.r < this.cols.length - 1) {
      this.r++
      if (this.c > this.cols[this.r].length - 1) this.c = this.cols[this.r].length - 1
    }
  }

  left() {
    if (this.c > 0) this.c--
  }

  right() {
    if (this.c < this.cols[this.r].length - 1) this.c++
  }

  apply() {
    if (this.text.length >= this.limit) return
    this.text += this.cols[this.r][this.c]
  }

  erase() {
    const len = this.text.length
    if (len > 0) this.text = this.text.substring(0, len - 1)
  }

  end() {
    return this.r === this.cols.length - 1 && this.c === this.cols[this.r].length - 1
  }

  reset(text) {
    this.text = text
    this.c = 0
    this.r = 0
  }
}
