#version 300 es
uniform mat4 u_mvp;
uniform mat4 u_view;
layout (location = 0) in vec3 in_position;
layout (location = 1) in vec2 in_texture;
out vec2 v_texture;
out vec3 v_position;
void main() {
  vec4 position = vec4(in_position, 1.0);
  v_texture = in_texture;
  v_position = (u_view * position).xyz;
  gl_Position = u_mvp * position;
}
===========================================================
#version 300 es
precision mediump float;
uniform sampler2D u_texture;
const vec3 fog_color = vec3(0.0, 0.0, 0.0);
const float near = 50.0;
const float far = 100.0;
in vec2 v_texture;
in vec3 v_position;
layout (location = 0) out vec4 color;
const vec3[32] table = vec3[] (
  vec3(0.0 / 255.0, 0.0 / 255.0, 0.0 / 255.0),
  vec3(29.0 / 255.0, 43.0 / 255.0, 83.0 / 255.0),
  vec3(126.0 / 255.0, 37.0 / 255.0, 83.0 / 255.0),
  vec3(0.0 / 255.0, 135.0 / 255.0, 81.0 / 255.0),
  vec3(171.0 / 255.0, 82.0 / 255.0, 54.0 / 255.0),
  vec3(95.0 / 255.0, 87.0 / 255.0, 79.0 / 255.0),
  vec3(194.0 / 255.0, 195.0 / 255.0, 199.0 / 255.0),
  vec3(255.0 / 255.0, 241.0 / 255.0, 232.0 / 255.0),
  vec3(255.0 / 255.0, 0.0 / 255.0, 77.0 / 255.0),
  vec3(255.0 / 255.0, 163.0 / 255.0, 0.0 / 255.0),
  vec3(255.0 / 255.0, 236.0 / 255.0, 39.0 / 255.0),
  vec3(0.0 / 255.0, 228.0 / 255.0, 54.0 / 255.0),
  vec3(41.0 / 255.0, 173.0 / 255.0, 255.0 / 255.0),
  vec3(131.0 / 255.0, 118.0 / 255.0, 156.0 / 255.0),
  vec3(255.0 / 255.0, 119.0 / 255.0, 168.0 / 255.0),
  vec3(255.0 / 255.0, 204.0 / 255.0, 170.0 / 255.0),
  vec3(41.0 / 255.0, 24.0 / 255.0, 20.0 / 255.0),
  vec3(17.0 / 255.0, 29.0 / 255.0, 53.0 / 255.0),
  vec3(66.0 / 255.0, 33.0 / 255.0, 54.0 / 255.0),
  vec3(18.0 / 255.0, 83.0 / 255.0, 89.0 / 255.0),
  vec3(116.0 / 255.0, 47.0 / 255.0, 41.0 / 255.0),
  vec3(73.0 / 255.0, 51.0 / 255.0, 59.0 / 255.0),
  vec3(162.0 / 255.0, 136.0 / 255.0, 121.0 / 255.0),
  vec3(243.0 / 255.0, 239.0 / 255.0, 125.0 / 255.0),
  vec3(190.0 / 255.0, 18.0 / 255.0, 80.0 / 255.0),
  vec3(255.0 / 255.0, 108.0 / 255.0, 36.0 / 255.0),
  vec3(168.0 / 255.0, 231.0 / 255.0, 46.0 / 255.0),
  vec3(0.0 / 255.0, 181.0 / 255.0, 67.0 / 255.0),
  vec3(6.0 / 255.0, 90.0 / 255.0, 181.0 / 255.0),
  vec3(117.0 / 255.0, 70.0 / 255.0, 101.0 / 255.0),
  vec3(255.0 / 255.0, 110.0 / 255.0, 89.0 / 255.0),
  vec3(255.0 / 255.0, 157.0 / 255.0, 129.0 / 255.0)
);
vec3 palette(vec3 pixel) {
  int closest = 0;
  float smallest = 100.0;
  for (int i = 0; i < 32; i++) {
    vec3 rgb = table[i] - pixel;
    float distance = rgb.r * rgb.r + rgb.g * rgb.g + rgb.b * rgb.b;
    if (distance < smallest) {
      closest = i;
      smallest = distance;
    }
  }
  return table[closest];
}
void main() {
  vec3 pixel = texture(u_texture, v_texture).rgb;
  if (pixel.rgb == vec3(1.0, 1.0, 1.0)) {
    discard;
  }
  float fog_distance = length(v_position);
  float fog_amount = smoothstep(near, far, fog_distance);
  pixel = mix(pixel, fog_color, fog_amount);
  color = vec4(palette(pixel), 1.0);
}
