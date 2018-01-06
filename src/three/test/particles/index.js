import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import Stats from 'libs/stats.min';

let stats;
let mouseX = 0;
let mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

// Three Scene
let scene;
let camera;
let renderer;

const SEPARATION = 100;
const AMOUNTX = 10;
const AMOUNTY = 10;

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
	// document.body.appendChild(stats.dom);
}

function init() {
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 1, 10000);
	camera.position.z = 1000;

	// const material = new THREE.SpriteMaterial();
	const material = new THREE.SpriteMaterial({
		map: new THREE.CanvasTexture(generateCanvasSprite()),
		blending: THREE.AdditiveBlending,
	});
	for (let ix = 0; ix < AMOUNTX; ix += 1) {
		for (let iz = 0; iz < AMOUNTY; iz += 1) {
			const particle = new THREE.Sprite(material);
			particle.scale.x = 16;
			particle.scale.y = 16;

			const mid = (AMOUNTX - 1) * (SEPARATION / 2);
			const xd = ix * SEPARATION;
			const zd = iz * SEPARATION;
			const x = xd - mid;
			const z = zd - mid;
			particle.position.x = x;
			particle.position.z = z;
			const dest = {
				x: x + Math.random() * 100 - 50,
				y: Math.random() * 100 - 50,
			};

			// particle.position.y = z;
			// const dest = {
			// 	x: x + Math.random() * 100 - 50,
			// 	z: Math.random() * 100 - 50,
			// };

			new TWEEN.Tween(particle.position)
				.easing(TWEEN.Easing.Exponential.Out)
				.to(dest, 1000)
				.yoyo(true)
				.repeat(Infinity)
				.start();

			scene.add(particle);
		}
	}

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);

	document.body.appendChild(renderer.domElement);
}
function animate() {
	stats.update();
	requestAnimationFrame(animate);
	render();
}
function render() {
	TWEEN.update();

	camera.position.x += (mouseX - camera.position.x) * 0.05;
	camera.position.y += (-mouseY - camera.position.y) * 0.05;
	camera.lookAt(scene.position);

	renderer.render(scene, camera);
}
function generateCanvasSprite() {
	const canvas = document.createElement('canvas');
	canvas.width = 16;
	canvas.height = 16;

	const context = canvas.getContext('2d');
	const gradient = context.createRadialGradient(
		canvas.width / 2,
		canvas.height / 2,
		0,
		canvas.width / 2,
		canvas.height / 2,
		canvas.width / 2,
	);
	gradient.addColorStop(0, 'rgba(255,255,255,1)');
	gradient.addColorStop(0.2, 'rgba(0,255,255,1)');
	gradient.addColorStop(0.4, 'rgba(0,0,64,1)');
	gradient.addColorStop(1, 'rgba(0,0,0,1)');

	context.fillStyle = gradient;
	context.fillRect(0, 0, canvas.width, canvas.height);

	return canvas;
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
