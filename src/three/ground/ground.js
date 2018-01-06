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
		this.obj = this.createObj();
		this.obj.position.set(0, 0, 0);
		this.obj.rotation.set((-0.5 * Math.PI), 0, 0);
	}
	createObj() {
		return new THREE.Mesh(
			new THREE.PlaneBufferGeometry(1024, 1024, 32, 32),
			new THREE.RawShaderMaterial({
				uniforms: this.uniforms,
				vertexShader: vert,
				fragmentShader: frag,
				transparent: true,
				wireframe: true,
			}),
		);
	}
	render(time) {
		this.uniforms.time.value += time;
	}
}
