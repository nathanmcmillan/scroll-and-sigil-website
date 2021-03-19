#version 300 es
uniform mat4 u_mvp;
layout (location = 0) in vec3 in_position;
layout (location = 1) in vec2 in_texture;
out vec2 v_texture;
void main() {
  v_texture = in_texture;
  gl_Position = u_mvp * vec4(in_position, 1.0);
}
===========================================================
#version 300 es
precision mediump float;
uniform sampler2D u_texture;
in vec2 v_texture;
layout (location = 0) out vec4 color;
void main() {
  vec4 pixel = texture(u_texture, v_texture);
  if (pixel.rgb == vec3(1.0, 1.0, 1.0)) {
    discard;
  }
  color = pixel;
}
