#include <common>

#define M_PI 3.1415926535897932384626433832795

uniform float uMasterScale;
uniform float uBackgroundWaveScale;
uniform vec2 uMousePos;
uniform vec3 uCircularWave[ 3 ];
uniform vec2 uCircularWaveRadius[ 3 ];
uniform float uGridUnit;
uniform float uWaveStart;
uniform mat2 uWaveTransform;

// mat2 uWaveTransform = mat2(0.8, 0.6, -0.6, 0.8);

#define deltaTime ( 1.0 / 60.0 )
#define GRAVITY_CONSTANT ( resolution.x * deltaTime * 3.0 )

#pragma glslify: cnoise2 = require(glsl-noise/classic/2d)

void main()	{

  vec2 cellSize = 1.0 / resolution.xy;

  vec2 uv = gl_FragCoord.xy * cellSize;
  vec2 uvNew = uWaveTransform * uv;

  vec4 heightmapValue = texture2D( heightmap, uv );


  // Background Waves

  // 1. Basics
  // heightmapValue.x = pow(sin(uv.x * 200.0), 0.5) * 10.0 * uBackgroundWaveScale;

  // 2. Advanced
  // float angle = uvNew.x * 200.0;
  // float wave = sin(uvNew.y * 10.0) * 8.0;
  // float sum = angle + wave;
  // if (sum > -20.0 * M_PI && sum < 10.0 * M_PI) {
  //   heightmapValue.x = pow(sin(sum), 0.5) * 10.0 * uBackgroundWaveScale;
  // } else {
  //   heightmapValue.x = pow(sin(uv.x * 200.0), 0.5) * 10.0 * uBackgroundWaveScale;
  // }


  // Grid
  if (uGridUnit >= 2.0) {
    // Basic Waves
    heightmapValue.x = pow(sin(uv.x * 200.0), 0.5) * 10.0 * uBackgroundWaveScale;

    float unit = 1.0 / floor(uGridUnit);
    float gridX = mod(uv.x / unit, 2.0);
    float gridY = mod(uv.y / unit, 2.0);
    // if (mod(gridX, 2.0) < 1.0) {
    if ((gridX < 1.0 && gridY < 1.0) || (gridX >= 1.0 && gridY >= 1.0)) {
      heightmapValue.x = pow(sin(uv.y * 200.0), 0.5) * 10.0 * uBackgroundWaveScale;
    }
  } else {
    float angle = uvNew.x * 200.0;
    float wave = sin(uvNew.y * 10.0) * 8.0;
    float sum = angle + wave;
    if (sum > uWaveStart * M_PI && sum < (uWaveStart + 30.0) * M_PI) {
      heightmapValue.x = pow(sin(sum), 0.5) * 10.0 * uBackgroundWaveScale;
    } else {
      heightmapValue.x = pow(sin(uv.x * 200.0), 0.5) * 10.0 * uBackgroundWaveScale;
    }
  }

  // Circular Waves
  for (int i = 0; i < 3; i += 1) {
    vec2 center = uCircularWave[i].xy;
    if (uCircularWave[i].z > 0.5) {
      float dist = length(uv - center);
      if (dist < uCircularWaveRadius[i].x && dist > uCircularWaveRadius[i].y) {
        heightmapValue.x = pow(sin(dist * 200.0), 0.5) * 10.0;
      }
    }
  }

  // Bumps of Sands
  float d = length(uv - uCircularWave[2].xy);
  heightmapValue.x *= pow(uMasterScale, (d + 0.02) * 15.0);
  heightmapValue.x += cnoise2(uv * 2000.0) * 2.0;

  gl_FragColor = heightmapValue;

}
