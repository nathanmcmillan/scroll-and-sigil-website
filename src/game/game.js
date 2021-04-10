import { textureIndexForName } from '../assets/assets.js'
import { playMusic } from '../assets/sounds.js'
import { fetchText } from '../client/net.js'
import { Camera, cameraFollowCinema, cameraTowardsTarget } from '../game/camera.js'
import { Line } from '../map/line.js'
import { Sector } from '../map/sector.js'
import { Vector2 } from '../math/vector.js'
import { Hero } from '../thing/hero.js'
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
  }

  read(content) {
    const world = this.world
    worldClear(world)

    const vecs = []
    const lines = []

    try {
      const map = content.split('\n')
      const end = map.length - 1

      let index = 2
      while (index < end) {
        if (map[index] === 'end vectors') break
        const vec = map[index].split(' ')
        vecs.push(new Vector2(parseFloat(vec[0]), parseFloat(vec[1])))
        index++
      }
      index++

      index++
      while (index < end) {
        if (map[index] === 'end lines') break
        const line = map[index].split(' ')
        const a = vecs[parseInt(line[0])]
        const b = vecs[parseInt(line[1])]
        const top = texture(line[2])
        const middle = texture(line[3])
        const bottom = texture(line[4])
        let flags = null
        let trigger = null
        let i = 5
        while (i < line.length) {
          if (line[i] === 'flags') {
            i++
            const start = i
            while (i < line.length && line[i] !== 'end') i++
            flags = new Flags(line.slice(start, i))
            i++
          } else if (line[i] === 'trigger') {
            i++
            const start = i
            while (i < line.length && line[i] !== 'end') i++
            trigger = new Trigger(line.slice(start, i))
            i++
          } else i++
        }
        lines.push(new Line(top, middle, bottom, a, b, flags, trigger))
        index++
      }
      index++

      index++
      while (index < end) {
        if (map[index] === 'end sectors') break
        const sector = map[index].split(' ')
        const bottom = parseFloat(sector[0])
        const floor = parseFloat(sector[1])
        const ceiling = parseFloat(sector[2])
        const top = parseFloat(sector[3])
        const floorTexture = texture(sector[4])
        const ceilingTexture = texture(sector[5])
        let count = parseInt(sector[6])
        let i = 7
        let end = i + count
        const sectorVecs = []
        for (; i < end; i++) sectorVecs.push(vecs[parseInt(sector[i])])
        count = parseInt(sector[i])
        i++
        end = i + count
        const sectorLines = []
        for (; i < end; i++) sectorLines.push(lines[parseInt(sector[i])])
        let flags = null
        let trigger = null
        while (i < sector.length) {
          if (sector[i] === 'flags') {
            i++
            const start = i
            while (i < sector.length && sector[i] !== 'end') i++
            flags = new Flags(sector.slice(start, i))
            i++
          } else if (sector[i] === 'trigger') {
            i++
            const start = i
            while (i < sector.length && sector[i] !== 'end') i++
            trigger = new Trigger(sector.slice(start, i))
            i++
          } else i++
        }
        worldPushSector(world, new Sector(bottom, floor, ceiling, top, floorTexture, ceilingTexture, flags, trigger, sectorVecs, sectorLines))
        index++
      }
      index++

      worldSetLines(world, lines)
      worldBuild(world)

      while (index < end) {
        const top = map[index]
        index++
        if (top === 'things') {
          while (index < end) {
            if (map[index] === 'end things') break
            const thing = map[index].split(' ')
            const x = parseFloat(thing[0])
            const z = parseFloat(thing[1])
            const name = thing[2]
            let flags = null
            let trigger = null
            let i = 3
            while (i < thing.length) {
              if (thing[i] === 'flags') {
                i++
                const start = i
                while (i < thing.length && thing[i] !== 'end') i++
                flags = new Flags(thing.slice(start, i))
                i++
              } else if (thing[i] === 'trigger') {
                i++
                const start = i
                while (i < thing.length && thing[i] !== 'end') i++
                trigger = new Trigger(thing.slice(start, i))
                i++
              } else i++
            }
            const entity = worldSpawnEntity(world, name, x, z, flags, trigger)
            if (entity instanceof Hero) {
              this.hero = entity
              this.camera.target = this.hero
            }
            index++
          }
          index++
          if (this.camera.target === null) throw 'map is missing hero entity'
        } else if (top === 'triggers') {
          while (index < end) {
            if (map[index] === 'end triggers') break
            const trigger = new Trigger(map[index].split(' '))
            worldPushTrigger(world, trigger)
            index++
          }
          index++
        } else if (top === 'meta') {
          while (index < end) {
            if (map[index] === 'end meta') break
            const content = map[index].split(' ')
            if (content[0] === 'music') playMusic(content[1])
            index++
          }
          index++
        } else if (top === 'end map') {
          break
        } else throw `unknown map data: '${top}'`
      }
    } catch (e) {
      console.error(e)
    }
  }

  async load(file) {
    const map = await fetchText(file)
    this.read(map)
  }

  update() {
    const input = this.input
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
}
