#version 300 es
uniform mat4 u_mvp;
uniform mat4 u_view;
layout (location = 0) in vec3 in_position;
layout (location = 1) in vec2 in_texture;
out vec2 v_texture;

// #define PERFORMANCE
#define LINEAR
// #define EXPONENTIAL

#ifdef PERFORMANCE
out float v_fog_depth;
#endif

#ifdef LINEAR
out vec3 v_position;
#endif

#ifdef EXPONENTIAL
out vec3 v_position;
#endif

void main() {
  vec4 position = vec4(in_position, 1.0);
  v_texture = in_texture;

  #ifdef PERFORMANCE
  v_fog_depth = -(u_view * position).z;
  #endif

  #ifdef LINEAR
  v_position = (u_view * position).xyz;
  #endif

  #ifdef EXPONENTIAL
  v_position = (u_view * position).xyz;
  #endif

  gl_Position = u_mvp * position;
}
===========================================================
#version 300 es
precision mediump float;
uniform sampler2D u_texture;
const vec3 fog_color = vec3(0.0, 0.0, 0.0);
in vec2 v_texture;

// #define PERFORMANCE
#define LINEAR
// #define EXPONENTIAL

#ifdef PERFORMANCE
const float near = 50.0;
const float far = 100.0;
in float v_fog_depth;
#endif

#ifdef LINEAR
const float near = 50.0;
const float far = 100.0;
in vec3 v_position;
#endif

#ifdef EXPONENTIAL
const float fog_density = 0.02;
in vec3 v_position;
#endif

layout (location = 0) out vec4 color;
void main() {
  vec3 pixel = texture(u_texture, v_texture).rgb;
  if (pixel.rgb == vec3(1.0, 1.0, 1.0)) {
    discard;
  }

  #ifdef PERFORMANCE
  float fog_amount = smoothstep(near, far, v_fog_depth);
  #endif

  #ifdef LINEAR
  float fog_distance = length(v_position);
  float fog_amount = smoothstep(near, far, fog_distance);
  #endif

  #ifdef EXPONENTIAL
  #define LOG2 1.442695
  float fog_distance = length(v_position);
  float fog_amount = clamp(1.0 - exp2(-fog_density * fog_density * fog_distance * fog_distance * LOG2), 0.0, 1.0);
  #endif

  color = vec4(mix(pixel, fog_color, fog_amount), 1.0);
}
