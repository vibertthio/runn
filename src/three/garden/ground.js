import * as THREE from 'three';
import vert from './shaders/ground.vert';
// import frag from './shaders/ground.frag';

const UNIT = 16;
const WIDTH = 128;
const HEIGHT = 64;

export default class Ground {
	constructor(renderer) {
		this.uniforms = {
			time: {
				type: 'f',
				value: 0,
			},
		};
		this.renderer = renderer;
		this.obj = this.createObj();
		this.obj.position.set(0, 0, 0);
		this.obj.rotation.set(0, 0, 0);
	}
	createObj() {
		console.log(this.obj);
		const materialColor = 0xdddddd;
		const material = new THREE.ShaderMaterial({
			uniforms: THREE.UniformsUtils.merge([
				THREE.ShaderLib.lambert.uniforms,
				{
					heightmap: { value: null },
				},
			]),
			vertexShader: vert,
			fragmentShader: THREE.ShaderChunk.meshlambert_frag,
		});

		material.lights = true;

		// Material attributes from MeshPhongMaterial
		material.color = new THREE.Color(materialColor);
		material.emissive = new THREE.Color(0x000000);

		// Sets the uniforms with the material values
		material.uniforms.diffuse.value = new THREE.Color(0x555555);
		material.uniforms.emissive.value = material.emissive;
		material.uniforms.opacity.value = material.opacity;

		material.defines.WIDTH = WIDTH.toFixed(1);
		material.defines.HEIGHT = HEIGHT.toFixed(1);
		material.defines.UNIT = UNIT.toFixed(1);

		return new THREE.Mesh(
			new THREE.PlaneBufferGeometry(2048, 1024, 256, 128),
			material,

			// DEFAULT
			// new THREE.RawShaderMaterial({
			// 	uniforms: this.uniforms,
			// 	vertexShader: vert,
			// 	fragmentShader: frag,
			// 	transparent: true,
			// 	wireframe: true,
			// }),
		);
	}

	render(time) {
		this.uniforms.time.value += time;
	}
}
