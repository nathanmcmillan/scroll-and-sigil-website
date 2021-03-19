export class Texture {
  constructor(width, height, texture) {
    this.width = width
    this.height = height
    this.texture = texture
  }
}

export function createTexture(gl, image, filter, wrap) {
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap)
  gl.bindTexture(gl.TEXTURE_2D, null)
  return new Texture(image.width, image.height, texture)
}

export function createPixelsToTexture(gl, width, height, pixels, format, filter, wrap) {
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, gl.UNSIGNED_BYTE, pixels, 0)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap)
  gl.bindTexture(gl.TEXTURE_2D, null)
  return new Texture(width, height, texture)
}

function compileShader(gl, code, type) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, code)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw code + '\n' + gl.getShaderInfoLog(shader)
  }
  return shader
}

export function compileProgram(gl, glsl) {
  const code = glsl.split('===========================================================')
  const vertex = compileShader(gl, code[0], gl.VERTEX_SHADER)
  const fragment = compileShader(gl, code[1].trim(), gl.FRAGMENT_SHADER)
  const program = gl.createProgram()
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw glsl + '\n' + gl.getProgramInfoLog(program)
  }
  return program
}
