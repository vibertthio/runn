void main() {

		vec2 cellSize = 1.0 / resolution.xy;
		vec2 uv = gl_FragCoord.xy * cellSize;
    gl_FragColor = vec4(heightmap, uv);
}
