#version 300 es
uniform mat4 u_mvp;
layout (location = 0) in vec2 in_position;
layout (location = 1) in vec4 in_color;
layout (location = 2) in vec2 in_texture;
out vec4 v_color;
out vec2 v_texture;
void main() {
  v_color = in_color;
  v_texture = in_texture;
  gl_Position = u_mvp * vec4(in_position, 0.0, 1.0);
}
===========================================================
#version 300 es
precision mediump float;
uniform sampler2D u_texture;
in vec4 v_color;
in vec2 v_texture;
layout (location = 0) out vec4 color;
void main() {
  vec4 pixel = texture(u_texture, v_texture);
  if (pixel.rgb == vec3(1.0, 1.0, 1.0)) {
    discard;
  }
  color = v_color;
}
