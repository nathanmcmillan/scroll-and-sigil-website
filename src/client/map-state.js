/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { renderMapEditTopMode } from '../client/map-edit-top-mode.js'
import { renderMapEditViewMode, updateMapEditViewSectorBuffer } from '../client/map-edit-view-mode.js'
import { renderLoadingInProgress } from '../client/render-loading.js'
import { MapEdit, SWITCH_MODE_CALLBACK, TOP_MODE, VIEW_MODE } from '../editor/map-edit.js'
import { local_storage_get, local_storage_set } from '../io/files.js'

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

  pause() {
    this.maps.pause()
  }

  resume() {
    this.maps.resume()
  }

  resize(width, height, scale) {
    this.maps.resize(width, height, scale)
  }

  keyEvent(code, down) {
    const maps = this.maps
    if (this.keys.has(code)) {
      maps.input.set(this.keys.get(code), down)
      maps.immediate()
    }
  }

  mouseEvent() {}

  mouseMove() {}

  async initialize() {
    let map = null
    const tape = this.client.tape.name
    const name = local_storage_get('tape:' + tape + ':map')
    if (name) map = local_storage_get('tape:' + tape + ':map:' + name)
    this.maps.load(map)
    this.loading = false
  }

  eventCall(event) {
    if (event === 'Start-Save') this.save()
    else if (event === 'Start-Open') this.import()
    else if (event === 'Start-Export') this.export()
    else if (event === 'Start-Exit') this.returnToDashboard()
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
    const tape = this.client.tape.name
    const name = this.maps.name
    const blob = this.maps.export()
    local_storage_set('tape:' + tape + ':map', name)
    local_storage_set('tape:' + tape + ':map:' + name, blob)
    console.info(blob)
    console.info('saved to local storage!')
  }

  export() {
    const blob = this.maps.export()
    const download = document.createElement('a')
    download.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(blob)
    download.download = this.maps.name + '.wad'
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
