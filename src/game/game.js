/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { textureIndexForName } from '../assets/assets.js'
import { musicVolume, playMusic, setMusicVolume, setSoundVolume, soundVolume } from '../assets/sound-manager.js'
import { Camera, cameraFollowCinema, cameraTowardsTarget } from '../game/camera.js'
import { Dialog } from '../gui/dialog.js'
import { INPUT_RATE } from '../io/input.js'
import { Line } from '../map/line.js'
import { Sector } from '../map/sector.js'
import { Vector2 } from '../math/vector.js'
import { Hero } from '../thing/hero.js'
import { wad_parse } from '../wad/wad.js'
import { Flags } from '../world/flags.js'
import { Trigger } from '../world/trigger.js'
import { World, worldBuild, worldClear, worldPushSector, worldPushTrigger, worldSetLines, worldSpawnEntity, worldUpdate } from '../world/world.js'

function texture(name) {
  if (name === 'none') return -1
  return textureIndexForName(name)
}

export class Game {
  constructor(parent, input) {
    this.parent = parent
    this.input = input
    this.world = new World(this)
    this.hero = null
    this.camera = new Camera(0.0, 0.0, 0.0, 0.0, 0.0, 12.0)
    this.cinema = false

    this.name = 'untitled'

    this.dialog = null
    this.dialogStack = []

    this.pauseMenuDialog = new Dialog('Pause', 'Pause Menu', ['Resume', 'Save', 'Options', 'Export', 'Exit'])
    this.optionsDialog = new Dialog('Options', 'Options', ['Music Volume', 'Sound Volume'])
    this.askToSaveDialog = new Dialog('Ask', 'Save Game?', ['Save', 'Export', 'No'])
    this.saveOkDialog = new Dialog('Ok', 'Game Saved', ['Ok'])
  }

  gotoDialog(dialog, from = null) {
    this.dialog = dialog
    this.forcePaint = true
    if (from === null) this.dialogStack.length = 0
    else this.dialogStack.push(from)
  }

  handleBackDialog() {
    const dialog = this.dialog
    if (dialog === this.optionsDialog) this.gotoDialog(this.pauseMenuDialog)
    else this.gotoDialog(null)
  }

  handleDialog() {
    const dialog = this.dialog
    const option = dialog.options[dialog.pos]
    const event = dialog.id + '-' + option
    if (dialog === this.askToSaveDialog) {
      if (option === 'No') {
        const poll = this.dialogStack[0]
        this.parent.eventCall(poll)
        this.dialogEnd()
      } else if (option === 'Save') {
        const poll = this.dialogStack[0]
        if (poll === 'Pause-Exit') {
          this.parent.eventCall('Pause-Save')
          this.gotoDialog(this.saveOkDialog, event)
        } else this.dialogEnd()
      } else if (option === 'Export') {
        const poll = this.dialogStack[0]
        if (poll === 'Pause-Exit') {
          this.parent.eventCall('Pause-Export')
          this.parent.eventCall('Pause-Exit')
        }
        this.dialogEnd()
      }
    } else if (dialog === this.pauseMenuDialog) {
      if (option === 'Settings') {
        this.optionsDialog.options[0] = 'Music Volume: ' + musicVolume()
        this.optionsDialog.options[1] = 'Sound Volume: ' + soundVolume()
        this.gotoDialog(this.optionsDialog)
      } else if (option === 'Save') {
        this.parent.eventCall(event)
      } else if (option === 'Exit') {
        this.gotoDialog(this.askToSaveDialog, event)
      } else if (option === 'Export') {
        this.parent.eventCall(event)
        this.dialogEnd()
      }
    } else if (dialog === this.saveOkDialog && option === 'Ok') {
      const poll = this.dialogStack[0]
      if (poll === 'Pause-Exit') this.parent.eventCall(poll)
      this.dialogEnd()
    } else this.dialogEnd()
  }

  handleDialogSpecial(left) {
    const dialog = this.dialog
    if (dialog === this.optionsDialog) {
      if (dialog.pos === 0) {
        let volume = musicVolume()
        if (left) {
          if (volume > 0) volume--
        } else if (volume < 10) volume++
        this.dialog.options[0] = 'Music Volume: ' + volume
        setMusicVolume(volume)
      } else if (dialog.pos === 1) {
        let volume = soundVolume()
        if (left) {
          if (volume > 0) volume--
        } else if (volume < 10) volume++
        this.dialog.options[0] = 'Sound Volume: ' + volume
        setSoundVolume(volume)
      }
    }
  }

  dialogResetAll() {
    this.pauseMenuDialog.reset()
    this.optionsDialog.reset()
    this.askToSaveDialog.reset()
    this.saveOkDialog.reset()
  }

  dialogEnd() {
    this.dialogResetAll()
    this.dialog = null
    this.dialogStack.length = 0
    this.forcePaint = true
  }

  pause() {}

  resume() {}

  read(content) {
    const world = this.world
    worldClear(world)

    const vecs = []
    const lines = []

    try {
      const wad = wad_parse(content)

      for (const vec of wad.get('vectors')) {
        vecs.push(new Vector2(parseFloat(vec.get('x')), parseFloat(vec.get('z'))))
      }

      for (const line of wad.get('lines')) {
        const a = vecs[parseInt(line.get('s'))]
        const b = vecs[parseInt(line.get('e'))]
        const top = texture(line.get('t'))
        const middle = texture(line.get('m'))
        const bottom = texture(line.get('b'))
        const flags = line.has('flags') ? new Flags(line.get('flags')) : null
        const trigger = line.has('trigger') ? new Trigger(line.get('trigger')) : null
        lines.push(new Line(top, middle, bottom, a, b, flags, trigger))
      }

      for (const sector of wad.get('sectors')) {
        const bottom = parseFloat(sector.get('b'))
        const floor = parseFloat(sector.get('f'))
        const ceiling = parseFloat(sector.get('c'))
        const top = parseFloat(sector.get('t'))
        const floorTexture = texture(sector.get('u'))
        const ceilingTexture = texture(sector.get('v'))
        const sectorVecs = sector.get('vecs').map((x) => vecs[parseInt(x)])
        const sectorLines = sector.get('lines').map((x) => lines[parseInt(x)])
        const flags = sector.has('flags') ? new Flags(sector.get('flags')) : null
        const trigger = sector.has('trigger') ? new Trigger(sector.get('trigger')) : null
        worldPushSector(world, new Sector(bottom, floor, ceiling, top, floorTexture, ceilingTexture, flags, trigger, sectorVecs, sectorLines))
      }

      worldSetLines(world, lines)
      worldBuild(world)

      if (wad.has('things')) {
        for (const thing of wad.get('things')) {
          const x = parseFloat(thing.get('x'))
          const z = parseFloat(thing.get('z'))
          const name = thing.get('id')
          const flags = thing.has('flags') ? new Flags(thing.get('flags')) : null
          const trigger = thing.has('trigger') ? new Trigger(thing.get('trigger')) : null
          const entity = worldSpawnEntity(world, name, x, z, flags, trigger)
          if (entity instanceof Hero) {
            this.hero = entity
            this.camera.target = this.hero
          }
        }
      }

      if (wad.has('triggers')) {
        for (const trigger of wad.get('triggers')) worldPushTrigger(world, new Trigger(trigger))
      }

      if (wad.has('meta')) {
        for (const meta of wad.get('meta')) {
          if (meta[0] === 'music') playMusic(meta[1])
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  load(map) {
    this.read(map)
  }

  update(timestamp) {
    const input = this.input

    if (this.dialog !== null) {
      if (input.pressB()) this.handleBackDialog()
      else if (input.pressA() || input.pressStart() || input.pressSelect()) this.handleDialog()

      if (input.timerStickUp(timestamp, INPUT_RATE)) {
        if (this.dialog.pos > 0) this.dialog.pos--
      } else if (input.timerStickDown(timestamp, INPUT_RATE)) {
        if (this.dialog.pos < this.dialog.options.length - 1) this.dialog.pos++
      } else if (input.timerStickLeft(timestamp, INPUT_RATE)) this.handleDialogSpecial(true)
      else if (input.timerStickRight(timestamp, INPUT_RATE)) this.handleDialogSpecial(false)
      return
    }

    if (input.pressStart()) {
      this.dialog = this.pauseMenuDialog
      return
    }

    const camera = this.camera

    if (!this.cinema) {
      if (input.y()) {
        camera.ry -= 0.05
        if (camera.ry < 0.0) camera.ry += 2.0 * Math.PI
      }

      if (input.a()) {
        camera.ry += 0.05
        if (camera.ry >= 2.0 * Math.PI) camera.ry -= 2.0 * Math.PI
      }

      // if (input.rightUp()) {
      //   camera.rx -= 0.05
      //   if (camera.rx < -0.5 * Math.PI) camera.rx = -0.5 * Math.PI
      // }
      // if (input.rightDown()) {
      //   camera.rx += 0.05
      //   if (camera.rx > 0.5 * Math.PI) camera.rx = 0.5 * Math.PI
      // }

      if (input.rightStickX !== 0.0) {
        camera.ry += input.rightStickX * 0.05
        if (camera.ry < 0.0) camera.ry += 2.0 * Math.PI
        else if (camera.ry >= 2.0 * Math.PI) camera.ry -= 2.0 * Math.PI
      }

      // if (input.rightStickY !== 0.0) {
      //   camera.rx += input.rightStickY * 0.05
      //   if (camera.rx < -0.4 * Math.PI) camera.rx = -0.4 * Math.PI
      //   else if (camera.rx > 0.4 * Math.PI) camera.rx = 0.4 * Math.PI
      // }

      camera.target.rotation = camera.ry - 0.5 * Math.PI
    }

    worldUpdate(this.world)

    if (this.cinema) cameraTowardsTarget(camera)
    else cameraFollowCinema(camera, this.world)
  }

  notify(type, args) {
    switch (type) {
      case 'cinema':
        this.cinema = true
        return
      case 'no-cinema':
        this.cinema = false
        return
    }
    this.parent.notify(type, args)
  }

  export() {
    let content = 'game = ' + this.name
    content += '\npack = ' + this.pack
    content += '\nworld {\n' + this.world.export + '}'
    return content
  }
}
