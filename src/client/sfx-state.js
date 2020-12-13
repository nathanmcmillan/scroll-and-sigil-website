import {SfxEdit} from '/src/editor/sfx.js'

export class SfxState {
  constructor(client) {
    this.client = client

    let sfx = new SfxEdit(client.width, client.height, client.scale, client.input)
    this.sfx = sfx
  }

  resize(width, height, scale) {
    this.sfx.resize(width, height, scale)
  }

  keyEvent(code, down) {
    if (this.keys.has(code)) this.sfx.input.set(this.keys.get(code), down)
  }

  mouseEvent() {}

  mouseMove() {}

  async initialize() {
    await this.sfx.load()
  }

  update() {
    let sfx = this.sfx
    sfx.update()
  }

  render() {
    const sfx = this.sfx
    if (!sfx.doPaint) return
  }
}
