vec3 polar(float radian1, float radian2, float radius) {
  return vec3(
    cos(radian1) * cos(radian2) * radius,
    sin(radian1) * radius,
    cos(radian1) * sin(radian2) * radius
  );
}
#pragma glslify: export(polar)
