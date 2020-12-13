import {MusicEdit} from '/src/editor/music.js'

export class MusicState {
  constructor(client) {
    this.client = client

    let music = new MusicEdit(client.width, client.height, client.scale, client.input)
    this.music = music
  }

  resize(width, height, scale) {
    this.music.resize(width, height, scale)
  }

  keyEvent(code, down) {
    if (this.keys.has(code)) this.music.input.set(this.keys.get(code), down)
  }

  mouseEvent() {}

  mouseMove() {}

  async initialize() {
    await this.music.load()
  }

  update() {
    let music = this.music
    music.update()
  }

  render() {
    const music = this.music
    if (!music.doPaint) return
  }
}
