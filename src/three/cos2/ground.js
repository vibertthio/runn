import * as THREE from 'three';
import vert from './shaders/ground.vert';
import frag from './shaders/ground.frag';

export default class Ground {
	constructor() {
		this.uniforms = {
			time: {
				type: 'f',
				value: 0,
			},
		};
		const obj = this.createObj();

		obj.position.set(0, 0, 0);
		obj.rotation.set(0, 0, 0);
		// obj.rotation.set((-0.5 * Math.PI), 0, 0);

		this.obj = obj;
	}

	createObj() {
		const geometry = new THREE.PlaneBufferGeometry(1024, 1024, 64, 64);
		const material = new THREE.RawShaderMaterial({
			uniforms: this.uniforms,
			vertexShader: vert,
			fragmentShader: frag,
			transparent: true,
			side: THREE.DoubleSide,
			// wireframe: true,
			customDepthMaterial: new THREE.MeshStandardMaterial(),
		});


		this.geometry = geometry;
		this.material = material;

		return new THREE.Mesh(
			geometry,
			material,
		);
	}
	render(time) {
		this.uniforms.time.value += time;
	}
}
