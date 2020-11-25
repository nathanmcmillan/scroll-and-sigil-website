export class Renderer {
  constructor(gl) {
    this.gl = gl
    this.program = null
    this.programs = []
  }

  insertProgram(index, program) {
    this.programs[index] = program
  }

  setProgram(index) {
    this.program = this.programs[index]
    this.gl.useProgram(this.program)
  }

  bindAttributes(b) {
    let gl = this.gl
    let index = 0
    let offset = 0
    let stride = 4 * (b.position + b.color + b.texture + b.normal)
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

  makeVAO(b) {
    let gl = this.gl
    b.vbo = gl.createBuffer()
    b.ebo = gl.createBuffer()
    b.vao = gl.createVertexArray()
    gl.bindVertexArray(b.vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, b.vbo)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.ebo)
    this.bindAttributes(b)
  }

  bindTexture(active, texture) {
    this.gl.activeTexture(active)
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
  }

  updateUniformMatrix(name, matrix) {
    let location = this.gl.getUniformLocation(this.program, name)
    this.gl.uniformMatrix4fv(location, false, matrix)
  }

  setView(x, y, width, height) {
    this.gl.viewport(x, y, width, height)
    this.gl.scissor(x, y, width, height)
  }

  updateVAO(b, hint) {
    let gl = this.gl
    gl.bindVertexArray(b.vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, b.vbo)
    gl.bufferData(gl.ARRAY_BUFFER, b.vertices, hint)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.ebo)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, b.indices, hint)
  }

  bindAndDraw(b) {
    let count = b.indexPosition
    if (count === 0) return
    let gl = this.gl
    gl.bindVertexArray(b.vao)
    gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_INT, 0)
  }

  updateAndDraw(b) {
    let count = b.indexPosition
    if (count === 0) return
    let gl = this.gl
    this.updateVAO(b, gl.DYNAMIC_DRAW)
    gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_INT, 0)
  }
}
