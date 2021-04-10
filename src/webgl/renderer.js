export class Renderer {
  constructor(gl) {
    this.gl = gl
    this.program = null
    this.uniform = null
    this.programs = new Map()
    this.uniforms = new Map()
  }
}

export function rendererInsertProgram(render, id, program) {
  render.programs.set(id, program)
  render.uniforms.set(id, new Map())
}

export function rendererSetProgram(render, id) {
  render.program = render.programs.get(id)
  render.uniform = render.uniforms.get(id)
  render.gl.useProgram(render.program)
}

function rendererBindAttributes(render, b) {
  const gl = render.gl
  let index = 0
  let offset = 0
  const stride = 4 * (b.position + b.color + b.texture + b.normal)
  if (b.position > 0) {
    gl.vertexAttribPointer(index, b.position, gl.FLOAT, false, stride, 0)
    gl.enableVertexAttribArray(index)
    index++
    offset += 4 * b.position
  }
  if (b.color > 0) {
    gl.vertexAttribPointer(index, b.color, gl.FLOAT, false, stride, offset)
    gl.enableVertexAttribArray(index)
    index++
    offset += 4 * b.color
  }
  if (b.texture > 0) {
    gl.vertexAttribPointer(index, b.texture, gl.FLOAT, false, stride, offset)
    gl.enableVertexAttribArray(index)
    index++
    offset += 4 * b.texture
  }
  if (b.normal > 0) {
    gl.vertexAttribPointer(index, b.normal, gl.FLOAT, false, stride, offset)
    gl.enableVertexAttribArray(index)
  }
  gl.bindVertexArray(null)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)
}

export function rendererMakeVAO(render, b) {
  const gl = render.gl
  b.vbo = gl.createBuffer()
  b.ebo = gl.createBuffer()
  b.vao = gl.createVertexArray()
  gl.bindVertexArray(b.vao)
  gl.bindBuffer(gl.ARRAY_BUFFER, b.vbo)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.ebo)
  rendererBindAttributes(render, b)
}

export function rendererBindTexture(render, active, texture, name = 'u_texture', index = 0) {
  render.gl.activeTexture(active)
  render.gl.bindTexture(render.gl.TEXTURE_2D, texture)
  rendererUpdateUniformInt(render, name, index)
}

export function rendererUniformLocation(render, name) {
  let location = render.uniform.get(name)
  if (location === undefined) {
    location = render.gl.getUniformLocation(render.program, name)
    render.uniform.set(name, location)
  }
  return location
}

export function rendererUpdateUniformInt(render, name, value) {
  const location = rendererUniformLocation(render, name)
  render.gl.uniform1i(location, value)
}

export function rendererUpdateUniformFloat(render, name, value) {
  const location = rendererUniformLocation(render, name)
  render.gl.uniform1f(location, value)
}

export function rendererUpdateUniformVec3(render, name, x, y, z) {
  const location = rendererUniformLocation(render, name)
  render.gl.uniform3f(location, x, y, z)
}

export function rendererUpdateUniformMatrix(render, name, matrix) {
  const location = rendererUniformLocation(render, name)
  render.gl.uniformMatrix4fv(location, false, matrix)
}

export function rendererSetView(render, x, y, width, height) {
  render.gl.viewport(x, y, width, height)
  render.gl.scissor(x, y, width, height)
}

export function rendererUpdateVAO(render, b, hint) {
  const gl = render.gl
  gl.bindVertexArray(b.vao)
  gl.bindBuffer(gl.ARRAY_BUFFER, b.vbo)
  gl.bufferData(gl.ARRAY_BUFFER, b.vertices, hint)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.ebo)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, b.indices, hint)
}

export function rendererBindAndDraw(render, b) {
  const count = b.indexPosition
  if (count === 0) return
  const gl = render.gl
  gl.bindVertexArray(b.vao)
  gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_INT, 0)
}

export function rendererUpdateAndDraw(render, b) {
  const count = b.indexPosition
  if (count === 0) return
  const gl = render.gl
  rendererUpdateVAO(render, b, gl.DYNAMIC_DRAW)
  gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_INT, 0)
}
