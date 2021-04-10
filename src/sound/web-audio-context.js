const Context = window.AudioContext || window.webkitAudioContext

export function newAudioContext() {
  return new Context()
}
