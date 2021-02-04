import {fetchText} from '/src/client/net.js'
import {Camera} from '/src/game/camera.js'
import {VectorReference, LineReference, SectorReference, ThingReference} from '/src/editor/map-edit-references.js'
import {tileList, entityList, textureIndexForName, textureNameFromIndex, tileCount, entityByName} from '/src/assets/assets.js'
import {WORLD_SCALE} from '/src/world/world.js'
import {computeSectors} from '/src/editor/map-edit-sectors.js'
import {sectorLineNeighbors, sectorInsideOutside} from '/src/map/sector.js'
import {sectorTriangulateForEditor} from '/src/map/triangulate.js'
import {Dialog} from '/src/editor/editor-util.js'
import * as In from '/src/input/input.js'

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
DESCRIBE_TOOL[DRAW_TOOL] = 'Draw mode'
DESCRIBE_TOOL[THING_TOOL] = 'Thing mode'
DESCRIBE_TOOL[SECTOR_TOOL] = 'Sector mode'

const DEFAULT_TOOL_OPTIONS = new Array(TOOL_COUNT)
DEFAULT_TOOL_OPTIONS[DRAW_TOOL] = OPTION_DRAW_MODE_DEFAULT
DEFAULT_TOOL_OPTIONS[THING_TOOL] = OPTION_THING_MODE_DEFAULT
DEFAULT_TOOL_OPTIONS[SECTOR_TOOL] = OPTION_SECTOR_MODE_DEFAULT

export const DESCRIBE_ACTION = new Array(ACTION_COUNT)
DESCRIBE_ACTION[DO_MOVE_VECTOR] = 'Move vector'
DESCRIBE_ACTION[DO_END_MOVING_VECTOR] = 'Stop moving'
DESCRIBE_ACTION[DO_MERGE_VECTOR] = 'Merge'

DESCRIBE_ACTION[DO_PLACE_LINE] = 'New line'
DESCRIBE_ACTION[DO_FLIP_LINE] = 'Flip'
DESCRIBE_ACTION[DO_DELETE_LINE] = 'Delete'
DESCRIBE_ACTION[DO_SPLIT_LINE] = 'Split'
DESCRIBE_ACTION[DO_START_LINE] = 'New at vec'
DESCRIBE_ACTION[DO_END_LINE] = 'End at vec'
DESCRIBE_ACTION[DO_END_LINE_NEW_VECTOR] = 'End'

DESCRIBE_ACTION[DO_PLACE_THING] = 'New thing'
DESCRIBE_ACTION[DO_MOVE_THING] = 'Move'
DESCRIBE_ACTION[DO_EDIT_THING] = 'Edit'
DESCRIBE_ACTION[DO_DELETE_THING] = 'Delete'
DESCRIBE_ACTION[DO_END_MOVING_THING] = 'Stop moving'

DESCRIBE_ACTION[DO_EDIT_SECTOR] = 'Edit sector'
DESCRIBE_ACTION[DO_EDIT_LINE] = 'Edit line'

DESCRIBE_ACTION[DO_CANCEL] = 'Cancel'

export const DESCRIBE_OPTIONS = new Array(OPTION_COUNT)

const DRAW_MODE_OPTIONS = new Map()
DRAW_MODE_OPTIONS.set(In.BUTTON_A, DO_PLACE_LINE)
DESCRIBE_OPTIONS[OPTION_DRAW_MODE_DEFAULT] = DRAW_MODE_OPTIONS

const VECTOR_UNDER_CURSOR_OPTIONS = new Map()
VECTOR_UNDER_CURSOR_OPTIONS.set(In.BUTTON_A, DO_START_LINE)
VECTOR_UNDER_CURSOR_OPTIONS.set(In.BUTTON_Y, DO_MOVE_VECTOR)
DESCRIBE_OPTIONS[OPTION_VECTOR_UNDER_CURSOR] = VECTOR_UNDER_CURSOR_OPTIONS

const MOVE_VECTOR_OPTIONS = new Map()
MOVE_VECTOR_OPTIONS.set(In.BUTTON_A, DO_END_MOVING_VECTOR)
DESCRIBE_OPTIONS[OPTION_MOVE_VECTOR] = MOVE_VECTOR_OPTIONS

const VECTOR_OVERLAP_OPTIONS = new Map()
VECTOR_OVERLAP_OPTIONS.set(In.BUTTON_A, DO_MERGE_VECTOR)
DESCRIBE_OPTIONS[OPTION_VECTOR_OVERLAP] = VECTOR_OVERLAP_OPTIONS

const LINE_UNDER_CURSOR_OPTIONS = new Map()
LINE_UNDER_CURSOR_OPTIONS.set(In.BUTTON_A, DO_FLIP_LINE)
LINE_UNDER_CURSOR_OPTIONS.set(In.BUTTON_Y, DO_DELETE_LINE)
LINE_UNDER_CURSOR_OPTIONS.set(In.BUTTON_X, DO_SPLIT_LINE)
DESCRIBE_OPTIONS[OPTION_LINE_UNDER_CURSOR] = LINE_UNDER_CURSOR_OPTIONS

const END_LINE_OPTIONS = new Map()
END_LINE_OPTIONS.set(In.BUTTON_A, DO_END_LINE)
END_LINE_OPTIONS.set(In.BUTTON_Y, DO_CANCEL)
DESCRIBE_OPTIONS[OPTION_END_LINE] = END_LINE_OPTIONS

const DO_END_LINE_NEW_VECTOR_OPTIONS = new Map()
DO_END_LINE_NEW_VECTOR_OPTIONS.set(In.BUTTON_A, DO_END_LINE_NEW_VECTOR)
DO_END_LINE_NEW_VECTOR_OPTIONS.set(In.BUTTON_Y, DO_CANCEL)
DESCRIBE_OPTIONS[OPTION_END_LINE_NEW_VECTOR] = DO_END_LINE_NEW_VECTOR_OPTIONS

const THING_MODE_OPTIONS = new Map()
THING_MODE_OPTIONS.set(In.BUTTON_A, DO_PLACE_THING)
DESCRIBE_OPTIONS[OPTION_THING_MODE_DEFAULT] = THING_MODE_OPTIONS

const THING_UNDER_CURSOR_OPTIONS = new Map()
THING_UNDER_CURSOR_OPTIONS.set(In.BUTTON_A, DO_MOVE_THING)
THING_UNDER_CURSOR_OPTIONS.set(In.BUTTON_Y, DO_DELETE_THING)
THING_UNDER_CURSOR_OPTIONS.set(In.BUTTON_X, DO_EDIT_THING)
DESCRIBE_OPTIONS[OPTION_THING_UNDER_CURSOR] = THING_UNDER_CURSOR_OPTIONS

const MOVING_THING_OPTIONS = new Map()
MOVING_THING_OPTIONS.set(In.BUTTON_A, DO_END_MOVING_THING)
DESCRIBE_OPTIONS[OPTION_MOVE_THING] = MOVING_THING_OPTIONS

const SECTOR_UNDER_CURSOR_OPTIONS = new Map()
SECTOR_UNDER_CURSOR_OPTIONS.set(In.BUTTON_A, DO_EDIT_SECTOR)
DESCRIBE_OPTIONS[OPTION_SECTOR_UNDER_CURSOR] = SECTOR_UNDER_CURSOR_OPTIONS

const SECTOR_MODE_LINE_UNDER_CURSOR_OPTIONS = new Map()
SECTOR_MODE_LINE_UNDER_CURSOR_OPTIONS.set(In.BUTTON_A, DO_EDIT_LINE)
DESCRIBE_OPTIONS[OPTION_SECTOR_MODE_LINE_UNDER_CURSOR] = SECTOR_MODE_LINE_UNDER_CURSOR_OPTIONS

const INPUT_RATE = 128

function texture(name) {
  if (name === 'none') return -1
  return textureIndexForName(name)
}

export function vectorSize(zoom) {
  return Math.ceil(1.0 + 0.05 * zoom)
}

export function thingSize(thing, zoom) {
  let box = Math.min(0.25, thing.box)
  return Math.ceil(box * zoom)
}

function referenceLinesFromVec(vec, lines) {
  let list = []
  for (const line of lines) {
    if (line.has(vec)) {
      list.push(line)
    }
  }
  return list
}

function textureToTileIndex(texture) {
  if (texture === -1) return -1
  const name = textureNameFromIndex(texture)
  const tiles = tileList()
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] === name) return i
  }
  return -1
}

function tileIndexToTexture(index) {
  if (index === -1) return -1
  const name = tileList()[index]
  return textureIndexForName(name)
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
    this.cursor = new VectorReference(0.5 * width, 0.5 * height)

    this.vecs = []
    this.lines = []
    this.sectors = []
    this.things = []

    this.selectedVec = null
    this.selectedLine = null
    this.selectedSector = null
    this.selectedThing = null
    this.selectedSecondVec = null
    this.tileList = null
    this.defaultTile = null
    this.entityList = null
    this.defaultEntity = null

    this.doSectorRefresh = false

    this.snapToGrid = false
    this.viewVecs = true
    this.viewLines = true
    this.viewSectors = true
    this.viewThings = true
    this.viewLineNormals = true

    this.dialog = null
    this.dialogStack = []

    this.startMenuDialog = new Dialog('start', null, ['new', 'open', 'save', 'export', 'exit'])
    this.toolDialog = new Dialog('tool', null, ['draw mode', 'thing mode', 'sector mode'])
    this.editThingDialog = new Dialog('thing', null, ['swap entity', 'create new entity', 'set as default'])
    this.changeEntityDialog = new Dialog('entity', 'swap entity', [])
    this.createNewEntityDialog = new Dialog('creator', 'create new entity', ['back'])
    this.editSectorDialog = new Dialog('sector', null, ['', '', '', '', '', ''])
    this.editLineDialog = new Dialog('line', null, ['', '', '', '', '', ''])
  }

  reset() {
    this.dialogResetAll()
  }

  handleDialog(event) {
    if (event === 'start-new' || event === 'start-open' || event === 'start-exit') {
      this.parent.eventCall(event)
      this.dialogEnd()
    } else if (event === 'tool-draw mode') {
      this.tool = 0
      this.switchTool()
    } else if (event === 'tool-thing mode') {
      this.tool = 1
      this.switchTool()
    } else if (event === 'tool-sector mode') {
      this.tool = 2
      this.switchTool()
      this.updateSectors()
    } else if (event === 'thing-swap entity') {
      let change = this.changeEntityDialog
      change.options = this.entityList.slice()
      this.dialog = change
      this.forcePaint = true
    } else if (event === 'thing-create new entity') {
      this.dialog = this.createNewEntityDialog
      this.forcePaint = true
    } else if (event === 'thing-set as default') {
      this.defaultEntity = this.selectedThing.entity.get('_wad')
      this.dialogEnd()
    } else if (event === 'creator-back') {
      this.dialog = this.editThingDialog
      this.forcePaint = true
    } else if (event.startsWith('entity-')) {
      let dash = event.indexOf('-')
      let entity = entityByName(event.substring(dash + 1))
      this.selectedThing.setEntity(entity)
      this.dialogEnd()
    } else if (event.startsWith('sector-') || event.startsWith('line-')) {
      this.dialogEnd()
    }
  }

  handleDialogSpecial(left) {
    const event = this.dialog.id + '-' + this.dialog.options[this.dialog.pos]
    if (event.startsWith('sector-floor sprite:')) {
      let sector = this.selectedSector
      let index = textureToTileIndex(sector.floorTexture)
      if (left) {
        if (index >= 0) index--
      } else if (index + 1 < tileCount()) index++
      let was = sector.floorTexture
      sector.floorTexture = tileIndexToTexture(index)
      if ((was === -1 && sector.floorTexture !== -1) || (was !== -1 && sector.floorTexture === -1)) this.doSectorRefresh = true
      else sector.refreshFloorTexture()
      this.dialog.options[0] = 'floor sprite:   ' + sector.floorTextureName().padEnd(6).substring(0, 6)
    } else if (event.startsWith('sector-ceiling sprite:')) {
      let sector = this.selectedSector
      let index = textureToTileIndex(sector.ceilingTexture)
      if (left) {
        if (index >= 0) index--
      } else if (index + 1 < tileCount()) index++
      let was = sector.ceilingTexture
      sector.ceilingTexture = tileIndexToTexture(index)
      if ((was === -1 && sector.ceilingTexture !== -1) || (was !== -1 && sector.ceilingTexture === -1)) this.doSectorRefresh = true
      else sector.refreshCeilingTexture()
      this.dialog.options[1] = 'ceiling sprite: ' + sector.ceilingTextureName().padEnd(6).substring(0, 6)
    } else if (event.startsWith('sector-bottom:')) {
      let sector = this.selectedSector
      if (left) {
        if (sector.bottom > 0) sector.bottom--
      } else sector.bottom++
      this.doSectorRefresh = true
      this.dialog.options[2] = 'bottom:         ' + sector.bottom
    } else if (event.startsWith('sector-floor:')) {
      let sector = this.selectedSector
      if (left) {
        if (sector.floor > 0) sector.floor--
      } else sector.floor++
      this.doSectorRefresh = true
      this.dialog.options[3] = 'floor:          ' + sector.floor
    } else if (event.startsWith('sector-ceiling:')) {
      let sector = this.selectedSector
      if (left) {
        if (sector.ceiling > 0) sector.ceiling--
      } else sector.ceiling++
      this.doSectorRefresh = true
      this.dialog.options[4] = 'ceiling:        ' + sector.ceiling
    } else if (event.startsWith('sector-top:')) {
      let sector = this.selectedSector
      if (left) {
        if (sector.top > 0) sector.top--
      } else sector.top++
      this.doSectorRefresh = true
      this.dialog.options[5] = 'top:            ' + sector.top
    } else if (event.startsWith('line-top sprite:')) {
      let wall = this.selectedLine.top
      let index = textureToTileIndex(wall.texture)
      if (left) {
        if (index >= 0) index--
      } else if (index + 1 < tileCount()) index++
      let was = wall.texture
      wall.texture = tileIndexToTexture(index)
      if ((was === -1 && wall.texture !== -1) || (was !== -1 && wall.texture === -1)) this.doSectorRefresh = true
      this.dialog.options[0] = 'top sprite:    ' + wall.textureName().padEnd(6).substring(0, 6)
    } else if (event.startsWith('line-middle sprite:')) {
      let wall = this.selectedLine.middle
      let index = textureToTileIndex(wall.texture)
      if (left) {
        if (index >= 0) index--
      } else if (index + 1 < tileCount()) index++
      let was = wall.texture
      wall.texture = tileIndexToTexture(index)
      if ((was === -1 && wall.texture !== -1) || (was !== -1 && wall.texture === -1)) this.doSectorRefresh = true
      this.dialog.options[1] = 'middle sprite: ' + wall.textureName().padEnd(6).substring(0, 6)
    } else if (event.startsWith('line-bottom sprite:')) {
      let wall = this.selectedLine.bottom
      let index = textureToTileIndex(wall.texture)
      if (left) {
        if (index >= 0) index--
      } else if (index + 1 < tileCount()) index++
      let was = wall.texture
      wall.texture = tileIndexToTexture(index)
      if ((was === -1 && wall.texture !== -1) || (was !== -1 && wall.texture === -1)) this.doSectorRefresh = true
      this.dialog.options[2] = 'bottom sprite: ' + wall.textureName().padEnd(6).substring(0, 6)
    } else if (event.startsWith('line-top offset:')) {
      let wall = this.selectedLine.top
      if (left) {
        if (wall.offset > 0) wall.offset--
      } else wall.offset++
      this.dialog.options[3] = 'top offset:    ' + wall.offset
    } else if (event.startsWith('line-middle offset:')) {
      let wall = this.selectedLine.middle
      if (left) {
        if (wall.offset > 0) wall.offset--
      } else wall.offset++
      this.dialog.options[4] = 'middle offset: ' + wall.offset
    } else if (event.startsWith('line-bottom offset:')) {
      let wall = this.selectedLine.bottom
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
    this.createNewEntityDialog.reset()
    this.editSectorDialog.reset()
    this.editLineDialog.reset()
  }

  dialogEnd() {
    this.dialogResetAll()
    this.dialog = null
    this.dialogStack.length = 0
    this.forcePaint = true
  }

  resize(width, height, scale) {
    this.width = width
    this.height = height
    this.scale = scale
    this.shadowInput = true
    this.doPaint = true
  }

  async load(file) {
    this.tileList = tileList().sort()
    this.defaultTile = this.tileList[0]

    this.entityList = entityList().sort()
    this.defaultEntity = this.entityList[0]

    let map = (await fetchText(file)).split('\n')
    let index = 0

    let vectors = index + parseInt(map[index].split(' ')[1])
    index++
    for (; index <= vectors; index++) {
      let vec = map[index].split(' ')
      this.vecs.push(new VectorReference(parseFloat(vec[0]), parseFloat(vec[1])))
    }

    let lines = index + parseInt(map[index].split(' ')[1])
    index++
    for (; index <= lines; index++) {
      let line = map[index].split(' ')
      let a = this.vecs[parseInt(line[0])]
      let b = this.vecs[parseInt(line[1])]
      let top = texture(line[2])
      let middle = texture(line[3])
      let bottom = texture(line[4])
      this.lines.push(new LineReference(top, middle, bottom, a, b))
    }

    let sectors = index + parseInt(map[index].split(' ')[1])
    index++
    for (; index <= sectors; index++) {
      let sector = map[index].split(' ')
      let bottom = parseFloat(sector[0])
      let floor = parseFloat(sector[1])
      let ceiling = parseFloat(sector[2])
      let top = parseFloat(sector[3])
      let floorTexture = texture(sector[4])
      let ceilingTexture = texture(sector[5])
      let count = parseInt(sector[6])
      let i = 7
      let end = i + count
      let vecs = []
      for (; i < end; i++) vecs.push(this.vecs[parseInt(sector[i])])
      count = parseInt(sector[i])
      i++
      end = i + count
      let lines = []
      for (; i < end; i++) {
        lines.push(this.lines[parseInt(sector[i])])
      }
      this.sectors.push(new SectorReference(bottom, floor, ceiling, top, floorTexture, ceilingTexture, vecs, lines))
    }

    let i = 0
    for (const sector of this.sectors) sector.index = i++

    sectorInsideOutside(this.sectors)
    this.sectors.sort((a, b) => {
      // just for debugging
      if (a.otherIsInside(b)) return 1
      if (b.otherIsInside(a)) return -1
      if (a.vecs.length < b.vecs.length) return 1
      if (b.vecs.length > b.vecs.length) return -1
      return 0
    })
    for (const sector of this.sectors) {
      try {
        sectorTriangulateForEditor(sector, WORLD_SCALE)
      } catch (e) {
        console.error(e)
      }
    }

    sectorLineNeighbors(this.sectors, WORLD_SCALE)

    while (index < map.length - 1) {
      let top = map[index].split(' ')
      let count = parseInt(top[1])
      if (top[0] === 'things') {
        let things = index + count
        index++
        for (; index <= things; index++) {
          let thing = map[index].split(' ')
          let x = parseFloat(thing[0])
          let z = parseFloat(thing[1])
          let entity = entityByName(thing[2])
          this.things.push(new ThingReference(entity, x, z))
        }
      } else if (top[0] === 'triggers') {
        index += count + 1
      } else if (top[0] === 'info') {
        index += count + 1
      } else throw "unknown map data: '" + top[0] + "'"
    }

    this.updateThingsY()

    this.shadowInput = true
    this.doPaint = true
  }

  vectorUnderCursor(ignore = null) {
    let x = this.camera.x + this.cursor.x / this.zoom
    let y = this.camera.z + this.cursor.y / this.zoom
    const size = vectorSize(this.zoom)
    let best = Number.MAX_VALUE
    let closest = null
    for (const vec of this.vecs) {
      if (vec === ignore) continue
      let distance = Math.sqrt((vec.x - x) * (vec.x - x) + (vec.y - y) * (vec.y - y))
      if (distance > size || distance > best) continue
      best = distance
      closest = vec
    }
    return closest
  }

  lineUnderCursor() {
    let x = this.camera.x + this.cursor.x / this.zoom
    let y = this.camera.z + this.cursor.y / this.zoom
    const size = vectorSize(this.zoom)
    let best = Number.MAX_VALUE
    let closest = null
    for (const line of this.lines) {
      let vx = line.b.x - line.a.x
      let vz = line.b.y - line.a.y
      let wx = x - line.a.x
      let wz = y - line.a.y
      let t = (wx * vx + wz * vz) / (vx * vx + vz * vz)
      if (t < 0.0) t = 0.0
      else if (t > 1.0) t = 1.0
      let px = line.a.x + vx * t - x
      let pz = line.a.y + vz * t - y
      let distance = px * px + pz * pz
      if (distance > size * size || distance > best) continue
      best = distance
      closest = line
    }
    return closest
  }

  placeVectorAtCursor() {
    let x = this.camera.x + this.cursor.x / this.zoom
    let y = this.camera.z + this.cursor.y / this.zoom
    let vec = new VectorReference(x, y)
    this.vecs.push(vec)
    return vec
  }

  thingUnderCursor() {
    let x = this.camera.x + this.cursor.x / this.zoom
    let y = this.camera.z + this.cursor.y / this.zoom
    for (const thing of this.things) {
      let size = 0.25 * thingSize(thing, this.zoom)
      if (x >= thing.x - size && x <= thing.x + size && y >= thing.z - size && y <= thing.z + size) {
        return thing
      }
    }
    return null
  }

  placeThingAtCursor() {
    let x = this.camera.x + this.cursor.x / this.zoom
    let y = this.camera.z + this.cursor.y / this.zoom
    let thing = new ThingReference(entityByName(this.defaultEntity), x, y)
    this.things.push(thing)
    return thing
  }

  deleteVec(vec) {
    let index = this.vecs.indexOf(vec)
    this.vecs.splice(index, 1)
  }

  deleteSelectedVector() {
    this.deleteVec(this.selectedVec)
    this.selectedVec = null
  }

  flipSelectedLine() {
    let line = this.selectedLine
    let temp = line.a
    line.a = line.b
    line.b = temp
  }

  splitSelectedLine() {
    let line = this.selectedLine
    let x = 0.5 * (line.a.x + line.b.x)
    let y = 0.5 * (line.a.y + line.b.y)
    let vec = new VectorReference(x, y)
    this.vecs.push(vec)

    let split = LineReference.copy(line)
    split.b = vec
    this.lines.push(split)

    line.a = vec
  }

  deleteSelectedLine() {
    let selected = this.selectedLine
    let index = this.lines.indexOf(selected)
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
    let index = this.things.indexOf(this.selectedThing)
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

  sectorUnderCursor() {
    let x = this.camera.x + this.cursor.x / this.zoom
    let y = this.camera.z + this.cursor.y / this.zoom
    for (const sector of this.sectors) {
      if (sector.contains(x, y)) {
        return sector.find(x, y)
      }
    }
  }

  updateThingsY() {
    for (const thing of this.things) {
      for (const sector of this.sectors) {
        if (sector.contains(thing.x, thing.z)) {
          let use = sector.find(thing.x, thing.z)
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
        let x = camera.x + cursor.x / this.zoom
        let y = camera.z + cursor.y / this.zoom
        this.selectedVec.x = x
        this.selectedVec.y = y
        this.selectedSecondVec = this.vectorUnderCursor(this.selectedVec)
        if (this.selectedSecondVec) this.action = OPTION_VECTOR_OVERLAP
      }

      let options = DESCRIBE_OPTIONS[this.action]

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
              this.doSectorRefresh = true
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
              let lines = referenceLinesFromVec(this.selectedVec, this.lines)
              for (let line of lines) {
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
                let line = new LineReference(-1, textureIndexForName(this.defaultTile), -1, this.selectedVec, this.selectedSecondVec)
                let x = line.a.x - line.b.x
                let y = line.a.y - line.b.y
                let floor = 0.0
                let ceil = 10.0
                let st = Math.sqrt(x * x + y * y) * WORLD_SCALE
                line.middle.update(floor, ceil, 0.0, floor * WORLD_SCALE, st, ceil * WORLD_SCALE, line.a, line.b)
                this.lines.push(line)
                this.action = OPTION_VECTOR_UNDER_CURSOR
                this.doSectorRefresh = true
              }
              this.selectedVec = null
              this.selectedSecondVec = null
            } else if (option === DO_CANCEL) {
              if (referenceLinesFromVec(this.selectedVec, this.lines).length === 0) {
                this.deleteSelectedVector()
              }
              this.action = OPTION_DRAW_MODE_DEFAULT
            }
          }
        }
      } else if (this.action === OPTION_END_LINE_NEW_VECTOR) {
        for (const [button, option] of options) {
          if (input.in[button]) {
            input.in[button] = false
            if (option === DO_END_LINE_NEW_VECTOR) {
              let line = new LineReference(-1, textureIndexForName(this.defaultTile), -1, this.selectedVec, this.placeVectorAtCursor())
              let x = line.a.x - line.b.x
              let y = line.a.y - line.b.y
              let floor = 0.0
              let ceil = 10.0
              let st = Math.sqrt(x * x + y * y) * WORLD_SCALE
              line.middle.update(floor, ceil, 0.0, floor * WORLD_SCALE, st, ceil * WORLD_SCALE, line.a, line.b)
              this.lines.push(line)
              this.selectedVec = null
              this.action = OPTION_VECTOR_UNDER_CURSOR
              this.doSectorRefresh = true
            } else if (option === DO_CANCEL) {
              if (referenceLinesFromVec(this.selectedVec, this.lines).length === 0) {
                this.deleteSelectedVector()
              }
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
        let x = camera.x + cursor.x / this.zoom
        let y = camera.z + cursor.y / this.zoom
        this.selectedThing.x = x
        this.selectedThing.z = y
      }

      let options = DESCRIBE_OPTIONS[this.action]

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
              this.editThingDialog.title = this.selectedThing.entity.get('_wad')
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
        this.selectedLine = this.lineUnderCursor()
        if (this.selectedLine) {
          this.action = OPTION_SECTOR_MODE_LINE_UNDER_CURSOR
          this.selectedSector = null
        } else {
          this.selectedSector = this.sectorUnderCursor()
          if (this.selectedSector) this.action = OPTION_SECTOR_UNDER_CURSOR
        }
      }

      let options = DESCRIBE_OPTIONS[this.action]

      if (this.action === OPTION_SECTOR_UNDER_CURSOR) {
        for (const [button, option] of options) {
          if (input.in[button]) {
            input.in[button] = false
            if (option === DO_EDIT_SECTOR) {
              let sector = this.selectedSector
              let options = this.editSectorDialog.options
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
              let line = this.selectedLine
              let options = this.editLineDialog.options
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
      if (input.pressX()) {
        this.snapToGrid = !this.snapToGrid
        return
      }

      if (input.stickUp()) {
        this.zoom += 0.15
        this.camera.x -= 1.0 / this.zoom
        this.camera.z -= 1.0 / this.zoom
      }

      if (input.stickDown()) {
        this.zoom -= 0.15
        this.camera.x += 1.0 / this.zoom
        this.camera.z += 1.0 / this.zoom
      }
    } else {
      if (this.snapToGrid) {
        const grid = 10
        if (input.pressStickLeft()) {
          let x = Math.floor(cursor.x)
          let modulo = x % grid
          if (modulo === 0) cursor.x -= grid
          else cursor.x -= modulo
          if (cursor.x < 0.0) cursor.x = 0.0
        }
        if (input.pressStickRight()) {
          let x = Math.floor(cursor.x)
          let modulo = x % grid
          if (modulo === 0) cursor.x += grid
          else cursor.x += grid - modulo
          if (cursor.x > this.width) cursor.x = this.width
        }
        if (input.pressStickUp()) {
          let y = Math.floor(cursor.y)
          let modulo = y % grid
          if (modulo === 0) cursor.y += grid
          else cursor.y += grid - modulo
          if (cursor.y > this.height) cursor.y = this.height
        }
        if (input.pressStickDown()) {
          let y = Math.floor(cursor.y)
          let modulo = y % grid
          if (modulo === 0) cursor.y -= grid
          else cursor.y -= modulo
          if (cursor.y < 0.0) cursor.y = 0.0
        }

        if (input.pressStickLeft()) {
          let x = Math.floor(camera.x)
          let modulo = x % grid
          if (modulo === 0) camera.x -= grid
          else camera.x -= modulo
        }
        if (input.pressStickRight()) {
          let x = Math.floor(camera.x)
          let modulo = x % grid
          if (modulo === 0) camera.x += grid
          else camera.x += grid - modulo
        }
        if (input.pressStickUp()) {
          let z = Math.floor(camera.z)
          let modulo = z % grid
          if (modulo === 0) camera.z += grid
          else camera.z += grid - modulo
        }
        if (input.pressStickDown()) {
          let z = Math.floor(camera.z)
          let modulo = z % grid
          if (modulo === 0) camera.z -= grid
          else camera.z -= modulo
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
            if (cursor.y > this.height) {
              cursor.y = this.height
              camera.z += speed
            }
          }
          if (input.stickDown()) {
            cursor.y -= look
            if (cursor.y < 0.0) {
              cursor.y = 0.0
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
      if (camera.rx < 0.0) camera.rx += 2.0 * Math.PI
    }

    if (input.b()) {
      camera.rx += 0.05
      if (camera.rx >= 2.0 * Math.PI) camera.rx -= 2.0 * Math.PI
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

  immediateInput() {
    if (this.dialog === null) return
    const input = this.input
    if (input.pressB()) {
      this.dialog = null
      this.dialogStack.length = 0
      this.forcePaint = true
    }
    if (input.pressA() || input.pressStart() || input.pressSelect()) {
      let id = this.dialog.id
      let option = this.dialog.options[this.dialog.pos]
      this.handleDialog(id + '-' + option)
    }
  }

  update(timestamp) {
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
    let content = ''
    content += `vectors ${this.vecs.length}\n`
    let index = 0
    for (const vec of this.vecs) {
      vec.index = index++
      content += vec.export() + '\n'
    }
    content += `lines ${this.lines.length}\n`
    index = 0
    for (const line of this.lines) {
      line.index = index++
      content += line.export() + '\n'
    }
    content += `sectors ${this.sectors.length}\n`
    for (const sector of this.sectors) {
      content += sector.export() + '\n'
    }
    if (this.things.length > 0) {
      content += `things ${this.things.length}\n`
      for (const thing of this.things) {
        content += thing.export() + '\n'
      }
    }
    // content += `triggers 0\n`
    // content += `info 0\n`
    return content
  }
}
