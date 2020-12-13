import {renderMapEditTopMode} from '/src/client/map-edit-top-mode.js'
import {renderMapEditViewMode, updateMapEditViewSectorBuffer} from '/src/client/map-edit-view-mode.js'
import {MapEdit, TOP_MODE, VIEW_MODE, SWITCH_MODE_CALLBACK} from '/src/editor/maps.js'

export class MapState {
  constructor(client) {
    this.client = client
    this.keys = client.keys

    let self = this
    let callbacks = []
    callbacks[SWITCH_MODE_CALLBACK] = () => {
      self.switchMode()
    }

    this.view = new Float32Array(16)
    this.projection = new Float32Array(16)

    this.editor = new MapEdit(client.width, client.height, client.scale, callbacks)
  }

  resize(width, height, scale) {
    this.editor.resize(width, height, scale)
  }

  keyEvent(code, down) {
    if (this.keys.has(code)) {
      this.editor.input.set(this.keys.get(code), down)
    }
    if (down && code === 'Digit0') {
      console.log(this.editor.export())
    }
  }

  mouseEvent() {}

  mouseMove() {}

  async initialize(file) {
    await this.editor.load(file)
  }

  switchMode() {
    if (this.editor.mode === VIEW_MODE) {
      updateMapEditViewSectorBuffer(this)
    }
  }

  update() {
    this.editor.update()
  }

  render() {
    if (this.editor.mode === TOP_MODE) {
      renderMapEditTopMode(this)
    } else {
      renderMapEditViewMode(this)
    }
  }
}
