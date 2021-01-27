import {renderMapEditTopMode} from '/src/client/map-edit-top-mode.js'
import {renderMapEditViewMode, updateMapEditViewSectorBuffer} from '/src/client/map-edit-view-mode.js'
import {renderLoadingInProgress} from '/src/client/render-loading.js'
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

    this.maps = new MapEdit(this, client.width, client.height - client.top, client.scale, client.input, callbacks)
    this.loading = true
  }

  reset() {
    this.maps.reset()
  }

  resize(width, height, scale) {
    this.maps.resize(width, height, scale)
  }

  keyEvent(code, down) {
    let maps = this.maps
    if (this.keys.has(code)) {
      maps.input.set(this.keys.get(code), down)
      maps.immediateInput()
    }
  }

  mouseEvent() {}

  mouseMove() {}

  async initialize(file) {
    await this.maps.load(file)
    this.loading = false
  }

  eventCall(event) {
    if (event === 'start-save') console.log(this.maps.export())
    else if (event === 'start-exit') this.returnToDashboard()
  }

  returnToDashboard() {
    this.client.openState('dashboard')
  }

  switchMode() {
    if (this.maps.mode === VIEW_MODE) updateMapEditViewSectorBuffer(this)
  }

  update(timestamp) {
    if (this.loading) return
    this.maps.update(timestamp)
  }

  render() {
    if (this.loading) renderLoadingInProgress(this.client, this.view, this.projection)
    else if (this.maps.mode === TOP_MODE) renderMapEditTopMode(this)
    else renderMapEditViewMode(this)
  }
}
