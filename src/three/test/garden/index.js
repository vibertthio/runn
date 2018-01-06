import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import Stats from 'libs/stats.min';
import Ground from './ground';

let stats;
let mouseX = 0;
let mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

// Three Scene
let scene;
let camera;
let renderer;
let ground;
let pointLight;
let ambientLight;

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

function initStats() {
	stats = new Stats();
	stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
	document.body.appendChild(stats.dom);
}
function init() {
	// Scene
	scene = new THREE.Scene();

	// Camera
	camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1, 10000);
	camera.position.set(0, 0, 700);

	// Light
	pointLight = new THREE.PointLight(0xffffff, 2);
	pointLight.position.set(0, 500, 500);
	scene.add(pointLight);

	ambientLight = new THREE.AmbientLight(0xa0a0a0);
	ambientLight.castShadow = true;
	scene.add(ambientLight);

	// Renderer
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	// Objects
	ground = new Ground();
	scene.add(ground.obj);
}
function animate() {
	stats.update();
	requestAnimationFrame(animate);
	render();
}
function render() {
	TWEEN.update();
	const amountX = 0.03;
	const amountY = 0.1;

	camera.position.x += (mouseX * amountX - camera.position.x) * 0.05;
	camera.position.y += (-mouseY * amountY - camera.position.y) * 0.05;
	camera.lookAt(scene.position);

	renderer.render(scene, camera);
}

export default () => {
	initStats();
	init();
	animate();

	document.addEventListener('mousemove', onDocumentMouseMove, false);
	document.addEventListener('touchstart', onDocumentTouchStart, false);
	document.addEventListener('touchmove', onDocumentTouchMove, false);

	window.addEventListener('resize', onWindowResize, false);
};
