import * as THREE from 'three';

export default () => {
	let mouseX = 0;
	let mouseY = 0;
	let windowHalfX = window.innerWidth / 2;
	let windowHalfY = window.innerHeight / 2;

	// Three Scene
	let scene;
	let camera;
	let renderer;
	let animationId;
	let geometry;
	let material;
	let mesh;

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
			removeEventListener('resize', onWindowResize);
		});
	}

	function init() {
		scene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 1, 10000);
		camera.position.z = 1000;

		geometry = new THREE.BoxGeometry(200, 200, 200);
		material = new THREE.MeshNormalMaterial();

		mesh = new THREE.Mesh(geometry, material);
		scene.add(mesh);

		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(window.innerWidth, window.innerHeight);

		document.body.appendChild(renderer.domElement);
	}

	function animate() {
		animationId = requestAnimationFrame(animate);
		render();
	}

	function render() {
		camera.position.x += (mouseX - camera.position.x) * 0.05;
		camera.position.y += (-mouseY - camera.position.y) * 0.05;
		camera.lookAt(scene.position);

		renderer.render(scene, camera);
	}

	init();
	animate();

	function onWindowResize() {
		windowHalfX = window.innerWidth / 2;
		windowHalfY = window.innerHeight / 2;

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize(window.innerWidth, window.innerHeight);
	}

	function onDocumentMouseMove(event) {
		mouseX = event.clientX - windowHalfX;
		mouseY = event.clientY - windowHalfY;
	}

	function onDocumentTouchStart(event) {
		if (event.touches.length > 1) {
			event.preventDefault();

			mouseX = event.touches[0].pageX - windowHalfX;
			mouseY = event.touches[0].pageY - windowHalfY;
		}
	}

	function onDocumentTouchMove(event) {
		if (event.touches.length === 1) {
			event.preventDefault();

			mouseX = event.touches[0].pageX - windowHalfX;
			mouseY = event.touches[0].pageY - windowHalfY;
		}
	}

	document.addEventListener('mousemove', onDocumentMouseMove, false);
	document.addEventListener('touchstart', onDocumentTouchStart, false);
	document.addEventListener('touchmove', onDocumentTouchMove, false);

	window.addEventListener('resize', onWindowResize, false);
};
