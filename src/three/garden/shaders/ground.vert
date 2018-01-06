#define LAMBERT

varying vec3 vLightFront;

#ifdef DOUBLE_SIDED

	varying vec3 vLightBack;

#endif

#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <envmap_pars_vertex>
#include <bsdfs>
#include <lights_pars>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {
	vec2 cellSize = vec2( 1.0 / WIDTH, 1.0 / HEIGHT );

	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>

	// #include <beginnormal_vertex>
	vec3 objectNormal = vec3(
		( texture2D( heightmap, uv + vec2( - cellSize.x, 0 ) ).x - texture2D( heightmap, uv + vec2( cellSize.x, 0 ) ).x ) / UNIT,
		( texture2D( heightmap, uv + vec2( 0, - cellSize.y ) ).x - texture2D( heightmap, uv + vec2( 0, cellSize.y ) ).x ) / UNIT,
	1.0 );
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>

	// #include <begin_vertex>

	// float sin1 = sin((position.x) * 0.01);
	// float z = position.z + sin1 * 10.0;
	// vec3 transformed = vec3(position.x, position.y, z);
	float heightValue = texture2D( heightmap, uv ).x;
	vec3 transformed = vec3( position.x, position.y, heightValue );

	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <lights_lambert_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>

}
