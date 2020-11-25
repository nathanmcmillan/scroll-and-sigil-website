#version 300 es
uniform mat4 u_mvp;
layout (location = 0) in vec2 in_position;
layout (location = 1) in vec4 in_color;
out vec4 v_color;
void main() {
  v_color = in_color;
  gl_Position = u_mvp * vec4(in_position, 0.0, 1.0);
}
===========================================================
#version 300 es
precision mediump float;
in vec4 v_color;
layout (location = 0) out vec4 color;
void main() {
  color = v_color;
}
