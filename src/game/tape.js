export class Tape {
  constructor() {
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
    let content = 'tape\n'
    content += `entities ${this.entities.length}\n`
    content += `maps ${this.maps.length}\n`
    content += `music ${this.music.length}\n`
    content += `sounds ${this.sounds.length}\n`
    content += `sprites ${this.sprites.length}\n`
    content += `textures ${this.textures.length}\n`
    content += `tiles ${this.tiles.length}\n`
    return content
  }
}
