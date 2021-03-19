export class Tape {
  constructor(name) {
    this.name = name
    this.entities = []
    this.maps = []
    this.music = []
    this.sounds = []
    this.sprites = []
    this.textures = []
  }

  read() {}

  export() {
    let content = `tape ${this.name}\n`
    content += 'entities\n'
    for (const entity of this.entities) content += `${entity}\n`
    content += 'end entities\n'
    content += 'maps\n'
    content += 'end maps\n'
    content += 'music\n'
    for (const music of this.music) content += `${music}\n`
    content += 'end music\n'
    content += 'sounds\n'
    for (const sound of this.sounds) content += `${sound}\n`
    content += 'end sounds\n'
    content += 'sprites\n'
    content += 'end sprites\n'
    content += 'textures\n'
    for (const texture of this.textures) content += `${texture}\n`
    content += 'end textures\n'
    content += 'end tape\n'
    return content
  }
}
