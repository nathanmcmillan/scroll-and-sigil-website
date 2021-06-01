/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { entityByName, entityList, tileCount, tileList } from '../assets/assets.js'
import { LineReference } from '../editor/map-edit-line-reference.js'
import { SectorReference } from '../editor/map-edit-sector-reference.js'
import { computeSectors } from '../editor/map-edit-sectors.js'
import { ThingReference } from '../editor/map-edit-thing-reference.js'
import { VectorReference } from '../editor/map-edit-vec-reference.js'
import { Camera } from '../game/camera.js'
import { Dialog } from '../gui/dialog.js'
import { TextBox } from '../gui/text-box.js'
import { BUTTON_A, BUTTON_X, BUTTON_Y, INPUT_RATE } from '../io/input.js'
import { sectorInsideOutside, sectorLineNeighbors } from '../map/sector.js'
import { sectorTriangulateForEditor } from '../map/triangulate.js'
import { Vector2 } from '../math/vector.js'
import { wad_parse } from '../wad/wad.js'
import { Flags } from '../world/flags.js'
import { Trigger, triggerExport } from '../world/trigger.js'
import { WORLD_SCALE } from '../world/world.js'

export const TOP_MODE = 0
export const VIEW_MODE = 1

export const SWITCH_MODE_CALLBACK = 0

export const DRAW_TOOL = 0
export const THING_TOOL = 1
export const SECTOR_TOOL = 2
export const TOOL_COUNT = 3

export const OPTION_DRAW_MODE_DEFAULT = 0
export const OPTION_VECTOR_UNDER_CURSOR = 1
export const OPTION_MOVE_VECTOR = 2
export const OPTION_END_LINE = 3
export const OPTION_END_LINE_NEW_VECTOR = 4
export const OPTION_LINE_UNDER_CURSOR = 5
export const OPTION_THING_MODE_DEFAULT = 6
export const OPTION_THING_UNDER_CURSOR = 7
export const OPTION_MOVE_THING = 8
export const OPTION_SECTOR_MODE_DEFAULT = 9
export const OPTION_VECTOR_OVERLAP = 10
export const OPTION_SECTOR_UNDER_CURSOR = 11
export const OPTION_SECTOR_MODE_LINE_UNDER_CURSOR = 12
export const OPTION_COUNT = 13

export const DO_MOVE_VECTOR = 0
export const DO_END_MOVING_VECTOR = 1
export const DO_PLACE_LINE = 2
export const DO_FLIP_LINE = 3
export const DO_DELETE_LINE = 4
export const DO_START_LINE = 5
export const DO_END_LINE = 6
export const DO_END_LINE_NEW_VECTOR = 7
export const DO_PLACE_THING = 8
export const DO_MOVE_THING = 9
export const DO_EDIT_THING = 10
export const DO_DELETE_THING = 11
export const DO_END_MOVING_THING = 12
export const DO_EDIT_SECTOR = 13
export const DO_MERGE_VECTOR = 14
export const DO_SPLIT_LINE = 15
export const DO_EDIT_LINE = 16
export const DO_CANCEL = 17
export const ACTION_COUNT = 18

export const DESCRIBE_TOOL = new Array(TOOL_COUNT)
DESCRIBE_TOOL[DRAW_TOOL] = 'DRAW'
DESCRIBE_TOOL[THING_TOOL] = 'THINGS'
DESCRIBE_TOOL[SECTOR_TOOL] = 'SECTORS'

const DEFAULT_TOOL_OPTIONS = new Array(TOOL_COUNT)
DEFAULT_TOOL_OPTIONS[DRAW_TOOL] = OPTION_DRAW_MODE_DEFAULT
DEFAULT_TOOL_OPTIONS[THING_TOOL] = OPTION_THING_MODE_DEFAULT
DEFAULT_TOOL_OPTIONS[SECTOR_TOOL] = OPTION_SECTOR_MODE_DEFAULT

export const DESCRIBE_ACTION = new Array(ACTION_COUNT)
DESCRIBE_ACTION[DO_MOVE_VECTOR] = 'Move Vector'
DESCRIBE_ACTION[DO_END_MOVING_VECTOR] = 'Stop Moving'
DESCRIBE_ACTION[DO_MERGE_VECTOR] = 'Merge'

DESCRIBE_ACTION[DO_PLACE_LINE] = 'New Line'
DESCRIBE_ACTION[DO_FLIP_LINE] = 'Flip'
DESCRIBE_ACTION[DO_DELETE_LINE] = 'Delete'
DESCRIBE_ACTION[DO_SPLIT_LINE] = 'Split'
DESCRIBE_ACTION[DO_START_LINE] = 'New at vec'
DESCRIBE_ACTION[DO_END_LINE] = 'End at vec'
DESCRIBE_ACTION[DO_END_LINE_NEW_VECTOR] = 'End'

DESCRIBE_ACTION[DO_PLACE_THING] = 'New Thing'
DESCRIBE_ACTION[DO_MOVE_THING] = 'Move'
DESCRIBE_ACTION[DO_EDIT_THING] = 'Edit'
DESCRIBE_ACTION[DO_DELETE_THING] = 'Delete'
DESCRIBE_ACTION[DO_END_MOVING_THING] = 'Stop Moving'

DESCRIBE_ACTION[DO_EDIT_SECTOR] = 'Edit Sector'
DESCRIBE_ACTION[DO_EDIT_LINE] = 'Edit Line'

DESCRIBE_ACTION[DO_CANCEL] = 'Cancel'

export const DESCRIBE_OPTIONS = new Array(OPTION_COUNT)

const DRAW_MODE_OPTIONS = new Map()
DRAW_MODE_OPTIONS.set(BUTTON_A, DO_PLACE_LINE)
DESCRIBE_OPTIONS[OPTION_DRAW_MODE_DEFAULT] = DRAW_MODE_OPTIONS

const VECTOR_UNDER_CURSOR_OPTIONS = new Map()
VECTOR_UNDER_CURSOR_OPTIONS.set(BUTTON_A, DO_START_LINE)
VECTOR_UNDER_CURSOR_OPTIONS.set(BUTTON_Y, DO_MOVE_VECTOR)
DESCRIBE_OPTIONS[OPTION_VECTOR_UNDER_CURSOR] = VECTOR_UNDER_CURSOR_OPTIONS

const MOVE_VECTOR_OPTIONS = new Map()
MOVE_VECTOR_OPTIONS.set(BUTTON_A, DO_END_MOVING_VECTOR)
DESCRIBE_OPTIONS[OPTION_MOVE_VECTOR] = MOVE_VECTOR_OPTIONS

const VECTOR_OVERLAP_OPTIONS = new Map()
VECTOR_OVERLAP_OPTIONS.set(BUTTON_A, DO_MERGE_VECTOR)
DESCRIBE_OPTIONS[OPTION_VECTOR_OVERLAP] = VECTOR_OVERLAP_OPTIONS

const LINE_UNDER_CURSOR_OPTIONS = new Map()
LINE_UNDER_CURSOR_OPTIONS.set(BUTTON_A, DO_FLIP_LINE)
LINE_UNDER_CURSOR_OPTIONS.set(BUTTON_Y, DO_DELETE_LINE)
LINE_UNDER_CURSOR_OPTIONS.set(BUTTON_X, DO_SPLIT_LINE)
DESCRIBE_OPTIONS[OPTION_LINE_UNDER_CURSOR] = LINE_UNDER_CURSOR_OPTIONS

const END_LINE_OPTIONS = new Map()
END_LINE_OPTIONS.set(BUTTON_A, DO_END_LINE)
END_LINE_OPTIONS.set(BUTTON_Y, DO_CANCEL)
DESCRIBE_OPTIONS[OPTION_END_LINE] = END_LINE_OPTIONS

const DO_END_LINE_NEW_VECTOR_OPTIONS = new Map()
DO_END_LINE_NEW_VECTOR_OPTIONS.set(BUTTON_A, DO_END_LINE_NEW_VECTOR)
DO_END_LINE_NEW_VECTOR_OPTIONS.set(BUTTON_Y, DO_CANCEL)
DESCRIBE_OPTIONS[OPTION_END_LINE_NEW_VECTOR] = DO_END_LINE_NEW_VECTOR_OPTIONS

const THING_MODE_OPTIONS = new Map()
THING_MODE_OPTIONS.set(BUTTON_A, DO_PLACE_THING)
DESCRIBE_OPTIONS[OPTION_THING_MODE_DEFAULT] = THING_MODE_OPTIONS

const THING_UNDER_CURSOR_OPTIONS = new Map()
THING_UNDER_CURSOR_OPTIONS.set(BUTTON_A, DO_MOVE_THING)
THING_UNDER_CURSOR_OPTIONS.set(BUTTON_Y, DO_DELETE_THING)
THING_UNDER_CURSOR_OPTIONS.set(BUTTON_X, DO_EDIT_THING)
DESCRIBE_OPTIONS[OPTION_THING_UNDER_CURSOR] = THING_UNDER_CURSOR_OPTIONS

const MOVING_THING_OPTIONS = new Map()
MOVING_THING_OPTIONS.set(BUTTON_A, DO_END_MOVING_THING)
DESCRIBE_OPTIONS[OPTION_MOVE_THING] = MOVING_THING_OPTIONS

const SECTOR_UNDER_CURSOR_OPTIONS = new Map()
SECTOR_UNDER_CURSOR_OPTIONS.set(BUTTON_A, DO_EDIT_SECTOR)
DESCRIBE_OPTIONS[OPTION_SECTOR_UNDER_CURSOR] = SECTOR_UNDER_CURSOR_OPTIONS

const SECTOR_MODE_LINE_UNDER_CURSOR_OPTIONS = new Map()
SECTOR_MODE_LINE_UNDER_CURSOR_OPTIONS.set(BUTTON_A, DO_EDIT_LINE)
DESCRIBE_OPTIONS[OPTION_SECTOR_MODE_LINE_UNDER_CURSOR] = SECTOR_MODE_LINE_UNDER_CURSOR_OPTIONS

function strvec(vec) {
  return JSON.stringify({ x: vec.x, y: vec.y })
}

function texture(name) {
  if (name === 'none') return null
  return name
}

export function vectorSize(zoom) {
  return Math.ceil(1.0 + 0.05 * zoom)
}

export function thingSize(thing, zoom) {
  const box = Math.min(0.25, thing.box)
  return Math.ceil(box * zoom)
}

function referenceLinesFromVec(vec, lines) {
  const list = []
  for (const line of lines) {
    if (line.has(vec)) {
      list.push(line)
    }
  }
  return list
}

function textureToTileIndex(texture) {
  if (texture === null) return -1
  const tiles = tileList()
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] === texture) return i
  }
  return -1
}

function tileIndexToTexture(index) {
  if (index === -1) return null
  return tileList()[index]
}

export class MapEdit {
  constructor(parent, width, height, scale, input, callbacks) {
    this.parent = parent
    this.width = width
    this.height = height
    this.scale = scale
    this.input = input
    this.callbacks = callbacks
    this.shadowInput = true
    this.doPaint = true
    this.forcePaint = false

    this.camera = new Camera(0.0, 1.0, 0.0, 0.0, 0.0)
    this.mode = TOP_MODE
    this.tool = DRAW_TOOL
    this.action = OPTION_DRAW_MODE_DEFAULT
    this.zoom = 10.0
    this.cursor = new Vector2(0.5 * width, 0.5 * height)

    this.name = 'untitled'

    this.vecs = []
    this.lines = []
    this.sectors = []
    this.things = []
    this.triggers = []
    this.meta = []

    this.selectedVec = null
    this.selectedLine = null
    this.selectedSector = null
    this.selectedThing = null
    this.selectedSecondVec = null

    this.entityList = null

    this.defaultEntity = null
    this.defaulLine = null
    this.defaultSector = null

    this.doSectorRefresh = false

    this.snapToGrid = 0
    this.viewVecs = true
    this.viewLines = true
    this.viewSectors = true
    this.viewThings = true
    this.viewLineNormals = true

    this.dialog = null
    this.dialogStack = []

    this.saved = true

    this.startMenuDialog = new Dialog('Start', 'Start Menu', ['Name', 'New', 'Open', 'Save', 'Export', 'Exit'])
    this.toolDialog = new Dialog('Tool', null, ['Draw Mode', 'Thing Mode', 'Sector Mode'])
    this.editThingDialog = new Dialog('Thing', null, ['Swap Entity', 'Set as Default'])
    this.changeEntityDialog = new Dialog('Entity', 'Swap Entity', [])
    this.editSectorDialog = new Dialog('Sector', null, ['', '', '', '', '', '', 'Set as Default'])
    this.editLineDialog = new Dialog('Line', null, ['', '', '', '', '', '', 'Set as Default'])
    this.askToSaveDialog = new Dialog('Ask', 'Save Current File?', ['Save', 'Export', 'No'])
    this.saveOkDialog = new Dialog('Ok', 'File Saved', ['Ok'])
    this.errorOkDialog = new Dialog('Error', null, ['Ok'])

    this.activeTextBox = false
    this.textBox = new TextBox('', 20)
  }

  clear() {
    this.name = 'untitled'

    this.camera.x = 0.0
    this.camera.y = 1.0
    this.camera.z = 0.0
    this.camera.rx = 0.0
    this.camera.ry = 0.0

    this.mode = TOP_MODE
    this.tool = DRAW_TOOL
    this.action = OPTION_DRAW_MODE_DEFAULT
    this.zoom = 10.0

    this.cursor.x = 0.5 * this.width
    this.cursor.y = 0.5 * this.height

    this.vecs.length = 0
    this.lines.length = 0
    this.sectors.length = 0
    this.things.length = 0
    this.triggers.length = 0
    this.meta.length = 0

    this.selectedVec = null
    this.selectedLine = null
    this.selectedSector = null
    this.selectedThing = null
    this.selectedSecondVec = null

    this.entityList = null

    this.defaultEntity = null
    this.defaulLine = null
    this.defaultSector = null

    this.doSectorRefresh = true

    return null
  }

  reset() {
    this.dialogResetAll()
  }

  handleDialog(event) {
    if (event === 'Ask-No') {
      const poll = this.dialogStack[0]
      if (poll === 'Start-New') this.clear()
      else this.parent.eventCall(poll)
      this.dialogEnd()
    } else if (event === 'Ask-Save') {
      const poll = this.dialogStack[0]
      if (poll === 'Start-Exit') {
        this.parent.eventCall('Start-Save')
        this.dialogStack.push(event)
        this.dialog = this.saveOkDialog
        this.forcePaint = true
      } else this.dialogEnd()
    } else if (event === 'Ask-Export') {
      const poll = this.dialogStack[0]
      if (poll === 'Start-Exit') {
        this.parent.eventCall('Start-Export')
        this.parent.eventCall('Start-Exit')
      }
      this.dialogEnd()
    } else if (event === 'Start-Name') {
      this.textBox.reset(this.name)
      this.activeTextBox = true
      this.dialogEnd()
    } else if (event === 'Start-Save') {
      this.parent.eventCall(event)
      this.dialog = this.saveOkDialog
      this.forcePaint = true
    } else if (event === 'Start-New') {
      if (this.saved) {
        this.clear()
        this.dialogEnd()
      } else {
        this.dialogStack.push(event)
        this.dialog = this.askToSaveDialog
        this.forcePaint = true
      }
    } else if (event === 'Start-Open' || event === 'Start-Exit') {
      if (this.saved) {
        this.parent.eventCall(event)
        this.dialogEnd()
      } else {
        this.dialogStack.push(event)
        this.dialog = this.askToSaveDialog
        this.forcePaint = true
      }
    } else if (event === 'Start-Export') {
      this.parent.eventCall(event)
      this.dialogEnd()
    } else if (event === 'Ok-ok') {
      const poll = this.dialogStack[0]
      if (poll === 'Start-Exit') this.parent.eventCall(poll)
      this.dialogEnd()
    } else if (event === 'Error-Ok') {
      this.dialogEnd()
    } else if (event === 'Tool-draw mode') {
      this.tool = 0
      this.switchTool()
    } else if (event === 'Tool-thing mode') {
      this.tool = 1
      this.switchTool()
    } else if (event === 'Tool-sector mode') {
      this.tool = 2
      this.switchTool()
      this.updateSectors()
    } else if (event === 'Thing-swap entity') {
      const change = this.changeEntityDialog
      change.options = this.entityList.slice()
      this.dialog = change
      this.forcePaint = true
    } else if (event === 'Thing-Set As Default') {
      this.defaultEntity = this.selectedThing.entity.id()
      this.dialogEnd()
    } else if (event === 'Creator-Back') {
      this.dialog = this.editThingDialog
      this.forcePaint = true
    } else if (event.startsWith('Entity-')) {
      const dash = event.indexOf('-')
      const entity = entityByName(event.substring(dash + 1))
      this.selectedThing.setEntity(entity)
      this.dialogEnd()
    } else if (event.startsWith('Sector-') || event.startsWith('Line-')) {
      if (event === 'Sector-Set As Default') this.defaultSector = this.selectedSector
      else if (event === 'Line-Set As Default') this.defaultLine = this.selectedLine
      this.dialogEnd()
    }
  }

  handleDialogSpecial(left) {
    const event = this.dialog.id + '-' + this.dialog.options[this.dialog.pos]
    if (event.startsWith('sector-floor sprite:')) {
      const sector = this.selectedSector
      let index = textureToTileIndex(sector.floorTexture)
      if (left) {
        if (index >= 0) index--
      } else if (index + 1 < tileCount()) index++
      const was = sector.floorTexture
      sector.floorTexture = tileIndexToTexture(index)
      if ((was === null && sector.floorTexture !== null) || (was !== null && sector.floorTexture === null)) this.doSectorRefresh = true
      else sector.refreshFloorTexture()
      this.dialog.options[0] = 'floor sprite:   ' + sector.floorTextureName().padEnd(6).substring(0, 6)
    } else if (event.startsWith('sector-ceiling sprite:')) {
      const sector = this.selectedSector
      let index = textureToTileIndex(sector.ceilingTexture)
      if (left) {
        if (index >= 0) index--
      } else if (index + 1 < tileCount()) index++
      const was = sector.ceilingTexture
      sector.ceilingTexture = tileIndexToTexture(index)
      if ((was === null && sector.ceilingTexture !== null) || (was !== null && sector.ceilingTexture === null)) this.doSectorRefresh = true
      else sector.refreshCeilingTexture()
      this.dialog.options[1] = 'ceiling sprite: ' + sector.ceilingTextureName().padEnd(6).substring(0, 6)
    } else if (event.startsWith('sector-bottom:')) {
      const sector = this.selectedSector
      if (left) {
        if (sector.bottom > -100) sector.bottom--
      } else sector.bottom++
      this.doSectorRefresh = true
      this.dialog.options[2] = 'bottom:         ' + sector.bottom
    } else if (event.startsWith('sector-floor:')) {
      const sector = this.selectedSector
      if (left) {
        if (sector.floor > -100) sector.floor--
      } else sector.floor++
      this.doSectorRefresh = true
      this.dialog.options[3] = 'floor:          ' + sector.floor
    } else if (event.startsWith('sector-ceiling:')) {
      const sector = this.selectedSector
      if (left) {
        if (sector.ceiling > -100) sector.ceiling--
      } else sector.ceiling++
      this.doSectorRefresh = true
      this.dialog.options[4] = 'ceiling:        ' + sector.ceiling
    } else if (event.startsWith('sector-top:')) {
      const sector = this.selectedSector
      if (left) {
        if (sector.top > -100) sector.top--
      } else sector.top++
      this.doSectorRefresh = true
      this.dialog.options[5] = 'top:            ' + sector.top
    } else if (event.startsWith('line-top sprite:')) {
      const wall = this.selectedLine.top
      let index = textureToTileIndex(wall.texture)
      if (left) {
        if (index >= 0) index--
      } else if (index + 1 < tileCount()) index++
      const was = wall.texture
      wall.texture = tileIndexToTexture(index)
      if ((was === null && wall.texture !== null) || (was !== null && wall.texture === null)) this.doSectorRefresh = true
      this.dialog.options[0] = 'top sprite:    ' + wall.textureName().padEnd(6).substring(0, 6)
    } else if (event.startsWith('line-middle sprite:')) {
      const wall = this.selectedLine.middle
      let index = textureToTileIndex(wall.texture)
      if (left) {
        if (index >= 0) index--
      } else if (index + 1 < tileCount()) index++
      const was = wall.texture
      wall.texture = tileIndexToTexture(index)
      if ((was === null && wall.texture !== null) || (was !== null && wall.texture === null)) this.doSectorRefresh = true
      this.dialog.options[1] = 'middle sprite: ' + wall.textureName().padEnd(6).substring(0, 6)
    } else if (event.startsWith('line-bottom sprite:')) {
      const wall = this.selectedLine.bottom
      let index = textureToTileIndex(wall.texture)
      if (left) {
        if (index >= 0) index--
      } else if (index + 1 < tileCount()) index++
      const was = wall.texture
      wall.texture = tileIndexToTexture(index)
      if ((was === null && wall.texture !== null) || (was !== null && wall.texture === null)) this.doSectorRefresh = true
      this.dialog.options[2] = 'bottom sprite: ' + wall.textureName().padEnd(6).substring(0, 6)
    } else if (event.startsWith('line-top offset:')) {
      const wall = this.selectedLine.top
      if (left) {
        if (wall.offset > 0) wall.offset--
      } else wall.offset++
      this.dialog.options[3] = 'top offset:    ' + wall.offset
    } else if (event.startsWith('line-middle offset:')) {
      const wall = this.selectedLine.middle
      if (left) {
        if (wall.offset > 0) wall.offset--
      } else wall.offset++
      this.dialog.options[4] = 'middle offset: ' + wall.offset
    } else if (event.startsWith('line-bottom offset:')) {
      const wall = this.selectedLine.bottom
      if (left) {
        if (wall.offset > 0) wall.offset--
      } else wall.offset++
      this.dialog.options[5] = 'bottom offset: ' + wall.offset
    }
  }

  dialogResetAll() {
    this.startMenuDialog.reset()
    this.toolDialog.reset()
    this.editThingDialog.reset()
    this.changeEntityDialog.reset()
    this.editSectorDialog.reset()
    this.editLineDialog.reset()
    this.askToSaveDialog.reset()
    this.saveOkDialog.reset()
    this.errorOkDialog.reset()
  }

  dialogEnd() {
    this.dialogResetAll()
    this.dialog = null
    this.dialogStack.length = 0
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
  }

  checkVectors() {
    const vecs = this.vecs
    const size = vecs.length
    for (let i = 0; i < size; i++) {
      for (let k = 0; k < size; k++) {
        if (i === k) continue
        const a = vecs[i]
        const b = vecs[k]
        if (a === b || a.eq(b)) {
          console.warn('Duplicate vectors found', strvec(a), strvec(b))
        }
      }
    }
  }

  read(content) {
    this.clear()
    this.entityList = entityList().sort()
    this.defaultEntity = this.entityList[0]
    try {
      const wad = wad_parse(content)

      this.name = wad.get('map')

      for (const vec of wad.get('vectors')) {
        this.vecs.push(new VectorReference(parseFloat(vec.get('x')), parseFloat(vec.get('z'))))
      }

      this.checkVectors()

      for (const line of wad.get('lines')) {
        const a = this.vecs[parseInt(line.get('s'))]
        const b = this.vecs[parseInt(line.get('e'))]
        const top = texture(line.get('t'))
        const middle = texture(line.get('m'))
        const bottom = texture(line.get('b'))
        const flags = line.has('flags') ? new Flags(line.get('flags')) : null
        const trigger = line.has('trigger') ? new Trigger(line.get('trigger')) : null
        this.lines.push(new LineReference(bottom, middle, top, a, b, flags, trigger))
      }

      for (const sector of wad.get('sectors')) {
        const bottom = parseFloat(sector.get('b'))
        const floor = parseFloat(sector.get('f'))
        const ceiling = parseFloat(sector.get('c'))
        const top = parseFloat(sector.get('t'))
        const floorTexture = texture(sector.get('u'))
        const ceilingTexture = texture(sector.get('v'))
        const vecs = sector.get('vecs').map((x) => this.vecs[parseInt(x)])
        const lines = sector.get('lines').map((x) => this.lines[parseInt(x)])
        const flags = sector.has('flags') ? new Flags(sector.get('flags')) : null
        const trigger = sector.has('trigger') ? new Trigger(sector.get('trigger')) : null
        this.sectors.push(new SectorReference(bottom, floor, ceiling, top, floorTexture, ceilingTexture, flags, trigger, vecs, lines))
      }

      sectorInsideOutside(this.sectors)

      for (const sector of this.sectors) {
        try {
          sectorTriangulateForEditor(sector, WORLD_SCALE)
        } catch (e) {
          console.error(e)
        }
      }

      sectorLineNeighbors(this.sectors, this.lines, WORLD_SCALE)

      if (wad.has('things')) {
        for (const thing of wad.get('things')) {
          const x = parseFloat(thing.get('x'))
          const z = parseFloat(thing.get('z'))
          const entity = entityByName(thing.get('id'))
          const flags = thing.has('flags') ? new Flags(thing.get('flags')) : null
          const trigger = thing.has('trigger') ? new Trigger(thing.get('trigger')) : null
          this.things.push(new ThingReference(entity, x, z, flags, trigger))
        }
      }

      if (wad.has('triggers')) {
        for (const trigger of wad.get('triggers')) this.triggers.push(new Trigger(trigger))
      }

      if (wad.has('meta')) {
        for (const meta of wad.get('meta')) this.meta.push(meta)
      }

      this.updateThingsY()
    } catch (e) {
      console.error(e)
      this.clear()
      this.errorOkDialog.title = 'Failed reading file'
      this.dialog = this.errorOkDialog
    }

    this.doSectorRefresh = false
    this.shadowInput = true
    this.doPaint = true
  }

  async load(map) {
    if (map === null || map === undefined) return this.clear()
    this.read(map)
  }

  vectorUnderCursor(ignore = null) {
    const x = this.camera.x + this.cursor.x / this.zoom
    const y = this.camera.z + this.cursor.y / this.zoom
    const size = 1.0
    let best = Number.MAX_VALUE
    let closest = null
    for (const vec of this.vecs) {
      if (vec === ignore) continue
      const distance = Math.sqrt((vec.x - x) * (vec.x - x) + (vec.y - y) * (vec.y - y))
      if (distance > size || distance > best) continue
      best = distance
      closest = vec
    }
    return closest
  }

  lineUnderCursor() {
    const x = this.camera.x + this.cursor.x / this.zoom
    const y = this.camera.z + this.cursor.y / this.zoom
    const size = 1.0
    let best = Number.MAX_VALUE
    let closest = null
    for (const line of this.lines) {
      const vx = line.b.x - line.a.x
      const vz = line.b.y - line.a.y
      const wx = x - line.a.x
      const wz = y - line.a.y
      let t = (wx * vx + wz * vz) / (vx * vx + vz * vz)
      if (t < 0.0) t = 0.0
      else if (t > 1.0) t = 1.0
      const px = line.a.x + vx * t - x
      const pz = line.a.y + vz * t - y
      const distance = px * px + pz * pz
      if (distance > size || distance > best) continue
      best = distance
      closest = line
    }
    return closest
  }

  placeVectorAtCursor() {
    const x = this.camera.x + this.cursor.x / this.zoom
    const y = this.camera.z + this.cursor.y / this.zoom
    const vec = new VectorReference(x, y)
    this.vecs.push(vec)
    return vec
  }

  thingUnderCursor() {
    const x = this.camera.x + this.cursor.x / this.zoom
    const y = this.camera.z + this.cursor.y / this.zoom
    for (const thing of this.things) {
      const size = 0.25 * thingSize(thing, this.zoom)
      if (x >= thing.x - size && x <= thing.x + size && y >= thing.z - size && y <= thing.z + size) {
        return thing
      }
    }
    return null
  }

  placeThingAtCursor() {
    const x = this.camera.x + this.cursor.x / this.zoom
    const y = this.camera.z + this.cursor.y / this.zoom
    const thing = new ThingReference(entityByName(this.defaultEntity), x, y)
    this.things.push(thing)
    return thing
  }

  deleteVec(vec) {
    const index = this.vecs.indexOf(vec)
    this.vecs.splice(index, 1)
  }

  deleteSelectedVector() {
    this.deleteVec(this.selectedVec)
    this.selectedVec = null
  }

  flipSelectedLine() {
    this.doSectorRefresh = true
    const line = this.selectedLine
    const temp = line.a
    line.a = line.b
    line.b = temp
  }

  splitSelectedLine() {
    this.doSectorRefresh = true
    const line = this.selectedLine
    const x = 0.5 * (line.a.x + line.b.x)
    const y = 0.5 * (line.a.y + line.b.y)
    const vec = new VectorReference(x, y)
    this.vecs.push(vec)
    const split = LineReference.copy(line)
    split.b = vec
    this.lines.push(split)
    line.a = vec
  }

  deleteSelectedLine() {
    this.doSectorRefresh = true
    const selected = this.selectedLine
    const index = this.lines.indexOf(selected)
    this.lines.splice(index, 1)
    let a = false
    let b = false
    for (const line of this.lines) {
      if (line.a === selected.a || line.b === selected.a) a = true
      if (line.a === selected.b || line.b === selected.b) b = true
      if (a && b) break
    }
    if (!a) this.deleteVec(selected.a)
    if (!b) this.deleteVec(selected.b)
    this.selectedLine = null
  }

  deleteSelectedThing() {
    const index = this.things.indexOf(this.selectedThing)
    this.things.splice(index, 1)
    this.selectedThing = null
  }

  lineIsUnique(a, b) {
    for (const line of this.lines) {
      if (line.a === a && line.b === b) return false
      if (line.a === b && line.b === a) return false
    }
    return true
  }

  sectorOrLineUnderCursor() {
    this.selectedLine = null
    this.selectedSector = null
    const x = this.camera.x + this.cursor.x / this.zoom
    const y = this.camera.z + this.cursor.y / this.zoom
    let found = null
    for (const sector of this.sectors) {
      if (sector.contains(x, y)) {
        found = sector.find(x, y)
        break
      }
    }
    const size = Math.pow(0.5, 2)
    const forced = Math.pow(0.2, 2)
    let best = Number.MAX_VALUE
    let closest = null
    let multiple = false
    for (const line of this.lines) {
      const vx = line.b.x - line.a.x
      const vz = line.b.y - line.a.y
      const wx = x - line.a.x
      const wz = y - line.a.y
      let t = (wx * vx + wz * vz) / (vx * vx + vz * vz)
      if (t < 0.0) t = 0.0
      else if (t > 1.0) t = 1.0
      const px = line.a.x + vx * t - x
      const pz = line.a.y + vz * t - y
      const distance = px * px + pz * pz
      if (distance > size || distance > best) continue
      if (closest) multiple = true
      best = distance
      closest = line
    }
    if (found && multiple && best > forced) this.selectedSector = found
    else if (closest) this.selectedLine = closest
    else if (found) this.selectedSector = found
  }

  updateThingsY() {
    for (const thing of this.things) {
      for (const sector of this.sectors) {
        if (sector.contains(thing.x, thing.z)) {
          const use = sector.find(thing.x, thing.z)
          thing.y = use.floor
        }
      }
    }
  }

  updateSectors() {
    if (!this.doSectorRefresh) return
    computeSectors(this)
    this.updateThingsY()
    this.doSectorRefresh = false
  }

  switchTool() {
    this.action = DEFAULT_TOOL_OPTIONS[this.tool]
    this.selectedVec = null
    this.selectedLine = null
    this.selectedSector = null
    this.selectedThing = null
    this.selectedSecondVec = null
    this.dialogEnd()
    this.topModeToolUpdate()
  }

  topModeToolUpdate() {
    const input = this.input
    const cursor = this.cursor
    const camera = this.camera

    if (this.tool === DRAW_TOOL) {
      if (this.action === OPTION_DRAW_MODE_DEFAULT || this.action === OPTION_VECTOR_UNDER_CURSOR || this.action === OPTION_LINE_UNDER_CURSOR) {
        this.action = OPTION_DRAW_MODE_DEFAULT
        this.selectedVec = this.vectorUnderCursor()
        if (this.selectedVec) {
          this.selectedLine = null
          this.action = OPTION_VECTOR_UNDER_CURSOR
        } else {
          this.selectedLine = this.lineUnderCursor()
          if (this.selectedLine) this.action = OPTION_LINE_UNDER_CURSOR
        }
      } else if (this.action === OPTION_END_LINE || this.action === OPTION_END_LINE_NEW_VECTOR) {
        this.action = OPTION_END_LINE_NEW_VECTOR
        this.selectedSecondVec = this.vectorUnderCursor()
        if (this.selectedSecondVec) this.action = OPTION_END_LINE
      } else if (this.action === OPTION_MOVE_VECTOR || this.action === OPTION_VECTOR_OVERLAP) {
        this.action = OPTION_MOVE_VECTOR
        const x = camera.x + cursor.x / this.zoom
        const y = camera.z + cursor.y / this.zoom
        this.selectedVec.x = x
        this.selectedVec.y = y
        this.selectedSecondVec = this.vectorUnderCursor(this.selectedVec)
        if (this.selectedSecondVec) this.action = OPTION_VECTOR_OVERLAP
      }

      const options = DESCRIBE_OPTIONS[this.action]

      if (this.action === OPTION_DRAW_MODE_DEFAULT) {
        for (const [button, option] of options) {
          if (input.in[button]) {
            input.in[button] = false
            if (option === DO_PLACE_LINE) {
              this.selectedVec = this.placeVectorAtCursor()
              this.action = OPTION_END_LINE
            }
          }
        }
      } else if (this.action === OPTION_LINE_UNDER_CURSOR) {
        for (const [button, option] of options) {
          if (input.in[button]) {
            input.in[button] = false
            if (option === DO_FLIP_LINE) {
              this.flipSelectedLine()
            } else if (option === DO_DELETE_LINE) {
              this.deleteSelectedLine()
            } else if (option === DO_SPLIT_LINE) {
              this.splitSelectedLine()
            }
          }
        }
      } else if (this.action === OPTION_VECTOR_UNDER_CURSOR) {
        for (const [button, option] of options) {
          if (input.in[button]) {
            input.in[button] = false
            if (option === DO_START_LINE) {
              this.action = OPTION_END_LINE
            } else if (option === DO_MOVE_VECTOR) {
              this.action = OPTION_MOVE_VECTOR
            }
          }
        }
      } else if (this.action === OPTION_MOVE_VECTOR) {
        for (const [button, option] of options) {
          if (input.in[button]) {
            input.in[button] = false
            if (option === DO_END_MOVING_VECTOR) {
              this.action = OPTION_VECTOR_UNDER_CURSOR
            }
          }
        }
      } else if (this.action === OPTION_VECTOR_OVERLAP) {
        for (const [button, option] of options) {
          if (input.in[button]) {
            input.in[button] = false
            if (option === DO_MERGE_VECTOR) {
              const lines = referenceLinesFromVec(this.selectedVec, this.lines)
              for (const line of lines) {
                if (line.a === this.selectedVec) line.a = this.selectedSecondVec
                else line.b = this.selectedSecondVec
              }
              this.deleteSelectedVector()
              this.action = OPTION_VECTOR_UNDER_CURSOR
              this.doSectorRefresh = true
            }
          }
        }
      } else if (this.action === OPTION_END_LINE) {
        for (const [button, option] of options) {
          if (input.in[button]) {
            input.in[button] = false
            if (option === DO_END_LINE) {
              if (!this.lineIsUnique(this.selectedVec, this.selectedSecondVec)) {
                this.action = OPTION_VECTOR_UNDER_CURSOR
              } else if (this.selectedVec === this.selectedSecondVec) {
                if (referenceLinesFromVec(this.selectedVec, this.lines).length === 0) {
                  this.deleteSelectedVector()
                  this.action = OPTION_DRAW_MODE_DEFAULT
                } else {
                  this.action = OPTION_VECTOR_UNDER_CURSOR
                }
              } else {
                let top = null
                let middle = null
                let bottom = null
                let floor = 0.0
                let ceiling = 10.0
                let type = null
                let trigger = null
                if (this.defaulLine) {
                  const line = this.defaulLine
                  top = line.top
                  middle = line.middle
                  bottom = line.bottom
                  floor = line.floor
                  ceiling = line.ceiling
                  type = line.type
                  trigger = line.trigger
                }
                const line = new LineReference(bottom, middle, top, this.selectedVec, this.selectedSecondVec, type, trigger)
                const x = line.a.x - line.b.x
                const y = line.a.y - line.b.y
                const st = Math.sqrt(x * x + y * y) * WORLD_SCALE
                line.middle.update(floor, ceiling, 0.0, floor * WORLD_SCALE, st, ceiling * WORLD_SCALE, line.a, line.b)
                this.lines.push(line)
                this.action = OPTION_VECTOR_UNDER_CURSOR
                this.doSectorRefresh = true
              }
              this.selectedVec = null
              this.selectedSecondVec = null
            } else if (option === DO_CANCEL) {
              if (referenceLinesFromVec(this.selectedVec, this.lines).length === 0) this.deleteSelectedVector()
              this.action = OPTION_DRAW_MODE_DEFAULT
            }
          }
        }
      } else if (this.action === OPTION_END_LINE_NEW_VECTOR) {
        for (const [button, option] of options) {
          if (input.in[button]) {
            input.in[button] = false
            if (option === DO_END_LINE_NEW_VECTOR) {
              let top = null
              let middle = null
              let bottom = null
              let floor = 0.0
              let ceiling = 10.0
              let type = null
              let trigger = null
              if (this.defaulLine) {
                const line = this.defaulLine
                top = line.top
                middle = line.middle
                bottom = line.bottom
                floor = line.floor
                ceiling = line.ceiling
                type = line.type
                trigger = line.trigger
              }
              const line = new LineReference(bottom, middle, top, this.selectedVec, this.placeVectorAtCursor(), type, trigger)
              const x = line.a.x - line.b.x
              const y = line.a.y - line.b.y
              const st = Math.sqrt(x * x + y * y) * WORLD_SCALE
              line.middle.update(floor, ceiling, 0.0, floor * WORLD_SCALE, st, ceiling * WORLD_SCALE, line.a, line.b)
              this.lines.push(line)
              this.selectedVec = null
              this.action = OPTION_VECTOR_UNDER_CURSOR
              this.doSectorRefresh = true
            } else if (option === DO_CANCEL) {
              if (referenceLinesFromVec(this.selectedVec, this.lines).length === 0) this.deleteSelectedVector()
              this.action = OPTION_DRAW_MODE_DEFAULT
            }
          }
        }
      }
    } else if (this.tool === THING_TOOL) {
      if (this.action === OPTION_THING_MODE_DEFAULT || this.action === OPTION_THING_UNDER_CURSOR) {
        this.action = OPTION_THING_MODE_DEFAULT
        this.selectedThing = this.thingUnderCursor()
        if (this.selectedThing) this.action = OPTION_THING_UNDER_CURSOR
      } else if (this.action === OPTION_MOVE_THING) {
        const x = camera.x + cursor.x / this.zoom
        const y = camera.z + cursor.y / this.zoom
        this.selectedThing.x = x
        this.selectedThing.z = y
      }

      const options = DESCRIBE_OPTIONS[this.action]

      if (this.action === OPTION_THING_MODE_DEFAULT) {
        for (const [button, option] of options) {
          if (input.in[button]) {
            input.in[button] = false
            if (option === DO_PLACE_THING) {
              this.selectedThing = this.placeThingAtCursor()
            }
          }
        }
      } else if (this.action === OPTION_THING_UNDER_CURSOR) {
        for (const [button, option] of options) {
          if (input.in[button]) {
            input.in[button] = false
            if (option === DO_MOVE_THING) {
              this.action = OPTION_MOVE_THING
            } else if (option === DO_DELETE_THING) {
              this.deleteSelectedThing()
            } else if (option === DO_EDIT_THING) {
              this.editThingDialog.title = this.selectedThing.entity.id()
              this.dialog = this.editThingDialog
            }
          }
        }
      } else if (this.action === OPTION_MOVE_THING) {
        for (const [button, option] of options) {
          if (input.in[button]) {
            input.in[button] = false
            if (option === DO_END_MOVING_THING) {
              this.action = OPTION_THING_UNDER_CURSOR
            }
          }
        }
      }
    } else if (this.tool === SECTOR_TOOL) {
      if (this.action === OPTION_SECTOR_MODE_DEFAULT || this.action === OPTION_SECTOR_UNDER_CURSOR || this.action === OPTION_SECTOR_MODE_LINE_UNDER_CURSOR) {
        this.action = OPTION_SECTOR_MODE_DEFAULT
        this.sectorOrLineUnderCursor()
        if (this.selectedLine) this.action = OPTION_SECTOR_MODE_LINE_UNDER_CURSOR
        else if (this.selectedSector) this.action = OPTION_SECTOR_UNDER_CURSOR
      }

      const options = DESCRIBE_OPTIONS[this.action]

      if (this.action === OPTION_SECTOR_UNDER_CURSOR) {
        for (const [button, option] of options) {
          if (input.in[button]) {
            input.in[button] = false
            if (option === DO_EDIT_SECTOR) {
              const sector = this.selectedSector
              const options = this.editSectorDialog.options
              options[0] = 'floor sprite:   ' + sector.floorTextureName().padEnd(6).substring(0, 6)
              options[1] = 'ceiling sprite: ' + sector.ceilingTextureName().padEnd(6).substring(0, 6)
              options[2] = 'bottom:         ' + sector.bottom
              options[3] = 'floor:          ' + sector.floor
              options[4] = 'ceiling:        ' + sector.ceiling
              options[5] = 'top:            ' + sector.top
              this.dialog = this.editSectorDialog
            }
          }
        }
      } else if (this.action === OPTION_SECTOR_MODE_LINE_UNDER_CURSOR) {
        for (const [button, option] of options) {
          if (input.in[button]) {
            input.in[button] = false
            if (option === DO_EDIT_LINE) {
              const line = this.selectedLine
              const options = this.editLineDialog.options
              options[0] = 'top sprite:    ' + line.topTextureName().padEnd(6).substring(0, 6)
              options[1] = 'middle sprite: ' + line.middleTextureName().padEnd(6).substring(0, 6)
              options[2] = 'bottom sprite: ' + line.bottomTextureName().padEnd(6).substring(0, 6)
              options[3] = 'top offset:    ' + line.topOffset()
              options[4] = 'middle offset: ' + line.middleOffset()
              options[5] = 'bottom offset: ' + line.bottomOffset()
              this.dialog = this.editLineDialog
            }
          }
        }
      }
    }
  }

  top(timestamp) {
    const input = this.input
    const cursor = this.cursor
    const camera = this.camera

    if (this.dialog !== null) {
      if (input.timerStickUp(timestamp, INPUT_RATE)) {
        if (this.dialog.pos > 0) this.dialog.pos--
      } else if (input.timerStickDown(timestamp, INPUT_RATE)) {
        if (this.dialog.pos < this.dialog.options.length - 1) this.dialog.pos++
      } else if (input.timerStickLeft(timestamp, INPUT_RATE)) this.handleDialogSpecial(true)
      else if (input.timerStickRight(timestamp, INPUT_RATE)) this.handleDialogSpecial(false)
      return
    } else if (this.activeTextBox) {
      if (input.timerStickUp(timestamp, INPUT_RATE)) this.textBox.up()
      else if (input.timerStickDown(timestamp, INPUT_RATE)) this.textBox.down()
      else if (input.timerStickLeft(timestamp, INPUT_RATE)) this.textBox.left()
      else if (input.timerStickRight(timestamp, INPUT_RATE)) this.textBox.right()
      return
    }

    if (input.pressSelect()) {
      this.toolDialog.pos = this.tool
      this.dialog = this.toolDialog
      return
    }

    if (input.pressStart()) {
      this.dialog = this.startMenuDialog
      return
    }

    if (input.pressLeftTrigger()) {
      this.updateSectors()
      this.mode = VIEW_MODE
      this.camera.x += cursor.x / this.zoom
      this.camera.z += cursor.y / this.zoom
      this.callbacks[SWITCH_MODE_CALLBACK]()
      return
    }

    if (input.rightTrigger()) {
      if (input.timerStickLeft(timestamp, INPUT_RATE)) {
        if (this.snapToGrid > 0) this.snapToGrid -= 5
      }

      if (input.timerStickRight(timestamp, INPUT_RATE)) {
        if (this.snapToGrid < 100) this.snapToGrid += 5
      }

      if (input.stickUp()) {
        if (this.zoom < 100.0) {
          const x = (0.5 * this.width) / this.zoom
          const y = (0.5 * this.height) / this.zoom

          this.zoom *= 1.15
          if (this.zoom > 80.0) this.zoom = 80.0

          this.camera.x += x - (0.5 * this.width) / this.zoom
          this.camera.z += y - (0.5 * this.height) / this.zoom
        }
      }

      if (input.stickDown()) {
        if (this.zoom > 1.0) {
          const x = (0.5 * this.width) / this.zoom
          const y = (0.5 * this.height) / this.zoom

          this.zoom *= 0.85
          if (this.zoom < 1.0) this.zoom = 1.0

          this.camera.x += x - (0.5 * this.width) / this.zoom
          this.camera.z += y - (0.5 * this.height) / this.zoom
        }
      }
    } else {
      if (this.snapToGrid > 0) {
        const grid = this.snapToGrid
        if (input.b()) {
          if (input.pressStickLeft()) {
            const x = Math.floor(camera.x)
            const modulo = x % grid
            if (modulo === 0) camera.x -= grid
            else camera.x -= modulo
          }
          if (input.pressStickRight()) {
            const x = Math.floor(camera.x)
            const modulo = x % grid
            if (modulo === 0) camera.x += grid
            else camera.x += grid - modulo
          }
          if (input.pressStickUp()) {
            const z = Math.floor(camera.z)
            const modulo = z % grid
            if (modulo === 0) camera.z += grid
            else camera.z += grid - modulo
          }
          if (input.pressStickDown()) {
            const z = Math.floor(camera.z)
            const modulo = z % grid
            if (modulo === 0) camera.z -= grid
            else camera.z -= modulo
          }
        } else {
          if (input.pressStickLeft()) {
            const x = Math.floor(cursor.x)
            const modulo = x % grid
            if (modulo === 0) cursor.x -= grid
            else cursor.x -= modulo
            if (cursor.x < 0.0) cursor.x = 0.0
          }
          if (input.pressStickRight()) {
            const x = Math.floor(cursor.x)
            const modulo = x % grid
            if (modulo === 0) cursor.x += grid
            else cursor.x += grid - modulo
            if (cursor.x > this.width) cursor.x = this.width
          }
          if (input.pressStickUp()) {
            const y = Math.floor(cursor.y)
            const modulo = y % grid
            if (modulo === 0) cursor.y += grid
            else cursor.y += grid - modulo
            if (cursor.y > this.height) cursor.y = this.height
          }
          if (input.pressStickDown()) {
            const y = Math.floor(cursor.y)
            const modulo = y % grid
            if (modulo === 0) cursor.y -= grid
            else cursor.y -= modulo
            if (cursor.y < 0.0) cursor.y = 0.0
          }
        }
      } else {
        const look = 4.0
        const speed = 0.5
        if (input.b()) {
          if (input.stickLeft()) {
            camera.x -= speed
          }
          if (input.stickRight()) {
            camera.x += speed
          }
          if (input.stickUp()) {
            camera.z += speed
          }
          if (input.stickDown()) {
            camera.z -= speed
          }
        } else {
          if (input.stickLeft()) {
            cursor.x -= look
            if (cursor.x < 0.0) {
              cursor.x = 0.0
              camera.x -= speed
            }
          }
          if (input.stickRight()) {
            cursor.x += look
            if (cursor.x > this.width) {
              cursor.x = this.width
              camera.x += speed
            }
          }
          if (input.stickUp()) {
            cursor.y += look
            if (cursor.y > this.height - 32) {
              cursor.y = this.height - 32
              camera.z += speed
            }
          }
          if (input.stickDown()) {
            cursor.y -= look
            if (cursor.y < 32) {
              cursor.y = 32
              camera.z -= speed
            }
          }
        }
      }
    }

    this.topModeToolUpdate()
  }

  view(timestamp) {
    const input = this.input
    const camera = this.camera

    if (this.dialog !== null) {
      if (input.timerStickUp(timestamp, INPUT_RATE)) {
        if (this.dialog.pos > 0) this.dialog.pos--
      } else if (input.timerStickDown(timestamp, INPUT_RATE)) {
        if (this.dialog.pos < this.dialog.options.length - 1) this.dialog.pos++
      } else if (input.timerStickLeft(timestamp, INPUT_RATE)) this.handleDialogSpecial(true)
      else if (input.timerStickRight(timestamp, INPUT_RATE)) this.handleDialogSpecial(false)
      return
    }

    if (input.pressStart()) {
      this.dialog = this.startMenuDialog
      return
    }

    if (input.pressLeftTrigger()) {
      this.mode = TOP_MODE
      this.camera.x -= this.cursor.x / this.zoom
      this.camera.z -= this.cursor.y / this.zoom
      return
    }

    if (input.y()) {
      camera.ry -= 0.05
      if (camera.ry < 0.0) camera.ry += 2.0 * Math.PI
    }

    if (input.a()) {
      camera.ry += 0.05
      if (camera.ry >= 2.0 * Math.PI) camera.ry -= 2.0 * Math.PI
    }

    if (input.x()) {
      camera.rx -= 0.05
      if (camera.rx < -0.5 * Math.PI) camera.rx = -0.5 * Math.PI
    }

    if (input.b()) {
      camera.rx += 0.05
      if (camera.rx > 0.5 * Math.PI) camera.rx = 0.5 * Math.PI
    }

    const speed = 0.3

    let direction = null
    let rotation = 0.0

    if (input.rightTrigger()) {
      if (input.stickUp()) {
        camera.y += speed
      }

      if (input.stickDown()) {
        camera.y -= speed
      }
    } else {
      if (input.stickUp()) {
        direction = 'w'
        rotation = camera.ry
      }

      if (input.stickDown()) {
        if (direction === null) {
          direction = 's'
          rotation = camera.ry + Math.PI
        } else {
          direction = null
          rotation = 0.0
        }
      }

      if (input.stickLeft()) {
        if (direction === null) {
          direction = 'a'
          rotation = camera.ry - 0.5 * Math.PI
        } else if (direction === 'w') {
          direction = 'wa'
          rotation -= 0.25 * Math.PI
        } else if (direction === 's') {
          direction = 'sa'
          rotation += 0.25 * Math.PI
        }
      }

      if (input.stickRight()) {
        if (direction === null) {
          direction = 'd'
          rotation = camera.ry + 0.5 * Math.PI
        } else if (direction === 'a') {
          direction = null
          rotation = 0.0
        } else if (direction === 'wa') {
          direction = 'w'
          rotation = camera.ry
        } else if (direction === 'sa') {
          direction = 's'
          rotation = camera.ry + Math.PI
        } else if (direction === 'w') {
          direction = 'wd'
          rotation += 0.25 * Math.PI
        } else if (direction === 's') {
          direction = 'sd'
          rotation -= 0.25 * Math.PI
        }
      }

      if (direction !== null) {
        camera.x += Math.sin(rotation) * speed
        camera.z -= Math.cos(rotation) * speed
      }
    }
  }

  topLeftStatus() {
    return 'MAP - ' + this.name.toUpperCase() + ' :: ' + DESCRIBE_TOOL[this.tool]
  }

  topRightStatus() {
    if (this.selectedVec) {
      return 'VEC ' + this.selectedVec.x.toFixed(2) + ', ' + this.selectedVec.y.toFixed(2)
    } else if (this.selectedThing) {
      const thing = this.selectedThing
      return 'THING ' + thing.entity.id().toUpperCase() + ' ' + thing.x.toFixed(2) + ', ' + thing.z.toFixed(2)
    } else if (this.selectedLine) {
      const line = this.selectedLine
      return 'LINE B' + line.bottom.offset + ' M' + line.middle.offset + ' T' + line.top.offset
    } else if (this.selectedSector) {
      const sector = this.selectedSector
      return 'SECTOR B' + sector.bottom + ' F' + sector.floor + ' C' + sector.ceiling + ' T' + sector.top
    }
    return 'CURSOR ' + (this.camera.x + this.cursor.x / this.zoom).toFixed(2) + ', ' + (this.camera.z + this.cursor.y / this.zoom).toFixed(2)
  }

  bottomLeftStatus() {
    const input = this.input
    if (input.rightTrigger()) return 'SNAP TO GRID: ' + this.snapToGrid + ' ZOOM: ' + this.zoom.toFixed(2) + 'X'
    if (this.selectedLine) {
      const line = this.selectedLine
      const bottom = line.bottom.textureName().toUpperCase()
      const middle = line.middle.textureName().toUpperCase()
      const top = line.top.textureName().toUpperCase()
      return 'B:' + bottom + ' M:' + middle + ' T:' + top
    } else if (this.selectedSector) {
      const sector = this.selectedSector
      return 'F:' + sector.floorTextureName().toUpperCase() + ' C:' + sector.ceilingTextureName().toUpperCase()
    }
  }

  bottomRightStatus() {
    const options = DESCRIBE_OPTIONS[this.action]
    if (options) {
      let content = ''
      let one = true
      for (const [button, option] of options) {
        if (one) one = false
        else content += ' '
        content += `${this.input.name(button)}/${DESCRIBE_ACTION[option]}`
      }
      return content
    }
    return null
  }

  immediate() {}

  events() {
    const input = this.input
    if (this.activeTextBox) {
      if (input.pressY()) {
        this.textBox.erase()
        this.name = this.textBox.text
        this.forcePaint = true
      } else if (input.pressA()) {
        if (this.textBox.end()) {
          this.activeTextBox = false
          this.forcePaint = true
        } else {
          this.textBox.apply()
          this.name = this.textBox.text
          this.forcePaint = true
        }
      }
      return
    }
    if (this.dialog === null) return
    if (input.pressB()) {
      this.dialog = null
      this.dialogStack.length = 0
      this.forcePaint = true
    }
    if (input.pressA() || input.pressStart() || input.pressSelect()) {
      const id = this.dialog.id
      const option = this.dialog.options[this.dialog.pos]
      this.handleDialog(id + '-' + option)
    }
  }

  update(timestamp) {
    this.events()

    if (this.forcePaint) {
      this.doPaint = true
      this.forcePaint = false
    } else this.doPaint = false
    if (this.input.nothingOn()) {
      if (this.shadowInput) this.shadowInput = false
      else return
    } else this.shadowInput = true
    this.doPaint = true

    if (this.mode === TOP_MODE) this.top(timestamp)
    else this.view(timestamp)
  }

  export() {
    computeSectors(this)
    this.vecs.sort(vecCompare)
    this.lines.sort(lineCompare)
    this.sectors.sort(secCompare)
    let content = `map = ${this.name}\n`
    content += 'vectors [\n'
    let index = 0
    for (const vec of this.vecs) {
      vec.index = index++
      content += '  ' + vec.export() + '\n'
    }
    content += ']\nlines [\n'
    index = 0
    for (const line of this.lines) {
      line.index = index++
      content += '  ' + line.export() + '\n'
    }
    content += ']\nsectors [\n'
    for (const sector of this.sectors) content += '  ' + sector.export() + '\n'
    content += ']\n'
    if (this.things.length > 0) {
      content += 'things [\n'
      for (const thing of this.things) content += '  ' + thing.export() + '\n'
      content += ']\n'
    }
    if (this.triggers.length > 0) {
      content += 'triggers [\n'
      for (const trigger of this.triggers) content += '  ' + triggerExport(trigger) + '\n'
      content += ']\n'
    }
    if (this.meta.length > 0) {
      content += 'meta [\n'
      for (const meta of this.meta) content += '  [' + meta + ']\n'
      content += ']\n'
    }
    return content
  }
}

function vecCompare(a, b) {
  if (a.y > b.y) return -1
  if (a.y < b.y) return 1
  if (a.x > b.x) return 1
  if (a.x < b.x) return -1
  return 0
}

function lineCompare(a, b) {
  if (a.a.y > b.a.y) return -1
  if (a.a.y < b.a.y) return 1
  if (a.a.x > b.a.x) return 1
  if (a.a.x < b.a.x) return -1
  if (a.b.y > b.b.y) return -1
  if (a.b.y < b.b.y) return 1
  if (a.b.x > b.b.x) return 1
  if (a.b.x < b.b.x) return -1
  return 0
}

function secCompare(a, b) {
  if (a.otherIsInside(b)) return 1
  if (b.otherIsInside(a)) return -1
  if (a.vecs.length < b.vecs.length) return 1
  if (b.vecs.length > b.vecs.length) return -1
  return 0
}
