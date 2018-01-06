precision highp float;

uniform float time;

varying vec3 vPosition;

#pragma glslify: import('libs/glsl/convertHsvToRgb.glsl');

const float duration = 2.0;
const float delay = 0.0;

void main() {
  float now = clamp((time - delay) / duration, 0.0, 1.0);
  float opacity = (1.0 - length(vPosition.xy / vec2(800.0))) * 0.6 * now;
  vec3 v = normalize(vPosition);
  vec3 rgb = vec3(1.0, 1.0, 1.0);
  gl_FragColor = vec4(rgb, opacity);
}
