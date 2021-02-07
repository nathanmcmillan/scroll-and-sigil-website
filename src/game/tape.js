export class Tape {
  constructor(name) {
    this.name = name
    this.entities = []
    this.maps = []
    this.music = []
    this.sounds = []
    this.sprites = []
    this.textures = []
    this.tiles = []
  }

  read() {}

  export() {
    let content = `tape ${this.name}\n`
    content += `entities ${this.entities.length}\n`
    for (const entity of this.entities) content += `${entity}\n`
    content += `maps ${this.maps.length}\n`
    content += `music ${this.music.length}\n`
    for (const music of this.music) content += `${music}\n`
    content += `sounds ${this.sounds.length}\n`
    content += `sprites ${this.sprites.length}\n`
    content += `textures ${this.textures.length}\n`
    content += `tiles ${this.tiles.length}\n`
    for (const tile of this.tiles) content += `${tile}\n`
    return content
  }
}
