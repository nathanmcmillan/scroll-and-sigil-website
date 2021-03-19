import { renderMapEditTopMode } from '../client/map-edit-top-mode.js'
import { renderMapEditViewMode, updateMapEditViewSectorBuffer } from '../client/map-edit-view-mode.js'
import { renderLoadingInProgress } from '../client/render-loading.js'
import { MapEdit, SWITCH_MODE_CALLBACK, TOP_MODE, VIEW_MODE } from '../editor/maps.js'

export class MapState {
  constructor(client) {
    this.client = client
    this.keys = client.keys

    const self = this
    const callbacks = []
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
    const maps = this.maps
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
    if (event === 'start-save') this.save()
    else if (event === 'start-open') this.import()
    else if (event === 'start-export') this.export()
    else if (event === 'start-exit') this.returnToDashboard()
  }

  returnToDashboard() {
    this.client.openState('dashboard')
  }

  import() {
    const button = document.createElement('input')
    button.type = 'file'
    button.onchange = (e) => {
      const file = e.target.files[0]
      console.info(file)
      const reader = new FileReader()
      reader.readAsText(file, 'utf-8')
      reader.onload = (event) => {
        const content = event.target.result
        this.maps.read(content)
      }
    }
    button.click()
  }

  save() {
    const blob = this.maps.export()
    localStorage.setItem('map.txt', blob)
    console.info(blob)
    console.info('saved to local storage!')
  }

  export() {
    const blob = this.maps.export()
    const download = document.createElement('a')
    download.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(blob)
    download.download = 'map.txt'
    download.click()
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
