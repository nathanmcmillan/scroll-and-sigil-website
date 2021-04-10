#version 300 es
#define LIGHTING
#ifdef LIGHTING
uniform mat4 u_mvp;
uniform mat4 u_view;
uniform int u_light_count;
uniform vec3 u_light_position[8];
layout (location = 0) in vec3 in_position;
layout (location = 1) in vec2 in_texture;
out vec3 v_position;
out vec2 v_texture;
out vec3 v_lights[8];
void main() {
  vec4 position = vec4(in_position, 1.0);
  v_position = (u_view * position).xyz;
  v_texture = in_texture;
  for (int i = 0; i < u_light_count; i++) v_lights[i] = u_light_position[i] - in_position.xyz;
  gl_Position = u_mvp * position;
}
#else
uniform mat4 u_mvp;
layout (location = 0) in vec3 in_position;
layout (location = 1) in vec2 in_texture;
out vec2 v_texture;
void main() {
  v_texture = in_texture;
  gl_Position = u_mvp * vec4(in_position, 1.0);
}
#endif
===========================================================
#version 300 es
#define LIGHTING
#ifdef LIGHTING
precision mediump float;
uniform sampler2D u_texture;
uniform sampler2D u_lookup;
uniform highp int u_light_count;
uniform float u_light_strength[8];
in vec3 v_position;
in vec2 v_texture;
in vec3 v_lights[8];
layout (location = 0) out vec4 color;
const float ambient = 0.5;
const float near = 10.0;
const float far = 80.0;
const float convert = 255.0 / 32.0;
void main() {
  float index = texture(u_texture, v_texture).r;
  if (index == 1.0) {
    discard;
  }
  float fog_distance = length(v_position);
  float fog_amount = smoothstep(near, far, fog_distance);
  float brightness = ambient - fog_amount;
  for (int i = 0; i < u_light_count; i++) {
    float dist = length(v_lights[i]);
    brightness += 0.4 * clamp(1.0 - u_light_strength[i] * dist * dist, 0.0, 1.0);
  }
  // (brightness & color id) + (other brightness & other color id) = ?
  vec3 pixel = texture(u_lookup, vec2(brightness, index * convert)).rgb;
  color = vec4(pixel, 1.0);
}
#else
precision mediump float;
uniform sampler2D u_texture;
uniform sampler2D u_lookup;
in vec2 v_texture;
layout (location = 0) out vec4 color;
const float convert = 255.0 / 32.0;
void main() {
  float index = texture(u_texture, v_texture).r;
  if (index == 1.0) {
    discard;
  }
  vec3 pixel = texture(u_lookup, vec2(0.0, index * convert)).rgb;
  color = vec4(pixel, 1.0);
}
#endif
