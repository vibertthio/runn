import * as THREE from 'three';
import OrbitControls from 'orbit-controls-es6';
import Ground from './ground';

export default () => {
	// Three Scene
	let scene;
	let camera;
	let clock;
	let renderer;
	let animationId;
	let controls;
	let ground;

	// Initial HMR Setup
	if (module.hot) {
		module.hot.accept();

		module.hot.dispose(() => {
			document.querySelector('canvas').remove();
			renderer.forceContextLoss();
			renderer.context = null;
			renderer.domElement = null;
			renderer = null;
			cancelAnimationFrame(animationId);
			removeEventListener('resize', resize);
		});
	}

	function init() {
		scene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
		clock = new THREE.Clock();
		camera.position.z = 800;

		controls = new OrbitControls(camera);
		controls.enableRotate = false;
		controls.enableZoom = false;

		ground = new Ground();
		scene.add(ground.obj);


		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(renderer.domElement);
	}

	function animate() {
		const time = clock.getDelta();
		animationId = requestAnimationFrame(animate);
		controls.update();
		ground.render(time);
		renderer.render(scene, camera);
	}

	init();
	animate();

	// Event listeners
	function resize() {
		camera.aspect = innerWidth / innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(innerWidth, innerHeight);
	}

	addEventListener('resize', resize);
};
