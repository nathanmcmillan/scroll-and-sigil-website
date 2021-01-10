import {sawtooth} from '/src/sound/synth.js'

const INPUT_RATE = 128

export class SfxEdit {
  constructor(width, height, scale, input) {
    this.width = width
    this.height = height
    this.scale = scale
    this.input = input
    this.shadowInput = true
    this.doPaint = true

    this.parameters = ['Wave', 'Frequency', 'Duration', 'Volume', 'Attack', 'Delay', 'Sustain', 'Release', 'Modulation', 'Noise', 'Bit Crush', 'Delay', 'Tremolo']
    this.arguments = ['Sine', 440, 1016, 0, 0, 0]

    this.wave = 'Sine'
    this.pitch = 440
    this.duration = 1016

    this.sounds = []
  }

  resize(width, height, scale) {
    this.width = width
    this.height = height
    this.scale = scale
    this.shadowInput = true
    this.doPaint = true
  }

  async load() {}

  update() {
    this.doPaint = false
    if (this.input.nothingOn()) {
      if (this.shadowInput) this.shadowInput = false
      else return
    } else this.shadowInput = true
    this.doPaint = true
    this.hasUpdates = false

    let input = this.input

    if (input.pressX()) {
      for (let sound of this.sounds) sound.stop()
      this.sounds.length = 0
      this.sounds.push(sawtooth(0.25, this.pitch, this.duration / 1000))
    }
  }

  export() {}
}
