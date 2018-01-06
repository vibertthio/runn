import * as THREE from 'three';
import OrbitControls from 'orbit-controls-es6';
import Stats from 'libs/stats.min';
import TrackballControls from 'libs/TrackballControls';
import Ground from './ground';

// Stats
let stats;

// Three Scene
let scene;
let camera;
let clock;
let renderer;
let controls;
let ground;

function initStats() {
	stats = new Stats();
	stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
	document.body.appendChild(stats.dom);
}

function init() {
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
	clock = new THREE.Clock();
	camera.position.z = 800;

	controls = new OrbitControls(camera);
	// controls.enableRotate = false;
	controls.enableZoom = false;

	ground = new Ground();
	scene.add(ground.obj);

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
}

function animate() {
	stats.update();
	requestAnimationFrame(animate);
	const time = clock.getDelta();
	controls.update();
	ground.render(time);
	renderer.render(scene, camera);
}

// Event listeners
function resize() {
	camera.aspect = innerWidth / innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(innerWidth, innerHeight);
}

export default () => {
	initStats();
	init();
	animate();

	addEventListener('resize', resize);
};
