attribute vec3 position;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float time;

varying vec3 vPosition;

float amount = 30.0;

void main() {
  // float sin1 = sin((position.x + position.y) * 0.2 + time * 0.5);
  // float sin2 = sin((position.x - position.y) * 0.4 + time * 2.0);
  // float sin3 = sin((position.x + position.y) * -0.6 + time);
  // float z = position.z + sin1 * 50.0 + sin2 * 10.0 + sin3 * 8.0;
  float radius = pow((pow(position.x, 2.0) + pow(position.y, 2.0)), 0.5);
  float z;
  if (radius < 200.0) {
     z = position.z + pow(cos(radius * 0.05), 2.0) * amount;
  } else {
    z = position.z;
  }
  // float z = position.z + cos(radius * 0.2) * amount;
  // float z = position.z + pow(position.x, 2.0) * 0.001;
  vec3 updatePosition = vec3(position.x, position.y, z);
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(updatePosition, 1.0);
}
