#include <common>

uniform vec2 mousePos;
uniform float mouseSize;
uniform float viscosityConstant;

#define deltaTime ( 1.0 / 60.0 )
#define GRAVITY_CONSTANT ( resolution.x * deltaTime * 3.0 )

void main()	{

  vec2 cellSize = 1.0 / resolution.xy;

  vec2 uv = gl_FragCoord.xy * cellSize;

  // heightmapValue.x == height
  // heightmapValue.y == velocity
  // heightmapValue.z, heightmapValue.w not used
  vec4 heightmapValue = texture2D( heightmap, uv );

  // Get neighbours
  // vec4 north = texture2D( heightmap, uv + vec2( 0.0, cellSize.y ) );
  // vec4 south = texture2D( heightmap, uv + vec2( 0.0, - cellSize.y ) );
  // vec4 east = texture2D( heightmap, uv + vec2( cellSize.x, 0.0 ) );
  // vec4 west = texture2D( heightmap, uv + vec2( - cellSize.x, 0.0 ) );
  //
  // float sump = north.x + south.x + east.x + west.x - 4.0 * heightmapValue.x;
  //
  // float accel = sump * GRAVITY_CONSTANT;
  //
  // // Dynamics
  // heightmapValue.y += accel;
  // heightmapValue.x += heightmapValue.y * deltaTime;
  //
  // // Viscosity
  // heightmapValue.x += sump * viscosityConstant;
  //
  // // Mouse influence
  // float mousePhase = clamp( length( ( uv - vec2( 0.5 ) ) * BOUNDS - vec2( mousePos.x, - mousePos.y ) ) * PI / mouseSize, 0.0, PI );
  // heightmapValue.x += cos( mousePhase ) + 1.0;

  float len1 = length(uv - vec2(0.1, 0.2));
  float len2 = length(uv - vec2(0.8, 0.4));
  if (len1 < 0.05) {
    heightmapValue.x = 0.1;
  } else if (len1 < 0.2 && len1 > 0.05) {
    // heightmapValue.x = cos(len * 80.0) * 10.0;
    heightmapValue.x = pow(sin(len1 * 100.0), 0.5) * 10.0;
  } else if (len2 < 0.1 && len2 > 0.03) {
    // heightmapValue.x = cos(len * 80.0) * 10.0;
    heightmapValue.x = pow(sin(len2 * 200.0), 0.5) * 10.0;
  } else {
    heightmapValue.x = pow(sin(uv.x * 200.0), 0.5) * 10.0;
  }

  gl_FragColor = heightmapValue;

}
