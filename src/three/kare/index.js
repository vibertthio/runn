/* global THREE */

import 'three';
import 'three/loaders/OBJLoader';
import 'three/loaders/MTLLoader';
import 'three/controls/TrackballControls';
import 'three/controls/OrbitControls';

import TWEEN from '@tweenjs/tween.js';
import lerp from 'utils/lerp';
import Stats from 'libs/stats.min';
import GPUComputationRenderer from './GPUComputationRenderer';
import water from './shaders/water.vert';
import heightmap from './shaders/heightmap.frag';
import sand from './textures/sand-3.jpg';
import rockObj from './models/rock_1/rock_1.obj';
import rockMtl from './models/rock_1/rock_1.mtl';

const WIDTH = 512; // Water size in cells
const BOUNDS = 1024; // Water size in system units
const HALF_BOUNDS = BOUNDS * 0.5; // Water size in system units

let container;
let stats;
let camera;
let scene;
let renderer;
let controls;
let mouseMoved = false;
const mouseCoords = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

let groundMesh;
let meshRay;
let gpuCompute;
let heightmapVariable;
let groundUniforms;

// Rocks
let rock;
let rockPosition = [
	// Default
	new THREE.Vector3(0.1, 0.2, 1.0),
	new THREE.Vector3(0.8, 0.4, 1.0),
	new THREE.Vector3(0.3, 0.8, 1.0),
];
let rockScale = 70;

// Circular Wave
let circularWavePosition;
let circularWaveRadius;
let masterScaleAni;

init();
animate();

function init() {
	initScene();
	initStats();
	initLayout();
	initControl();
	initGround();
	initAnimations();
	loadModels();

	document.addEventListener('mousemove', onDocumentMouseMove, false);
	document.addEventListener('touchstart', onDocumentTouchStart, false);
	document.addEventListener('touchmove', onDocumentTouchMove, false);
	document.addEventListener('keydown', handleKeyDown, false);
	window.addEventListener('resize', onWindowResize, false);
}

function initLayout() {
	// Circular Wave
	circularWavePosition = [
		new THREE.Vector3(
			lerp(0, 1, 0.2, 0.25, Math.random()),
			lerp(0, 1, 0.1, 0.7, Math.random()),
			1.0,
		),
		new THREE.Vector3(
			lerp(0, 1, 0.7, 0.9, Math.random()),
			lerp(0, 1, 0.3, 0.5, Math.random()),
			1.0,
		),
		new THREE.Vector3(
			lerp(0, 1, 0.2, 0.8, Math.random()),
			lerp(0, 1, 0.3, 0.9, Math.random()),
			1.0,
		),
	];
	circularWaveRadius = [
		new THREE.Vector2(0.2, 0.05),
		new THREE.Vector2(0.1, 0.0),
		new THREE.Vector2(0.3, 0.03),
	];

	const index = 2;
	const rockX = lerp(0, 1.0, -HALF_BOUNDS, HALF_BOUNDS, circularWavePosition[index].x);
	const rockZ = lerp(0, 1.0, HALF_BOUNDS, -HALF_BOUNDS, circularWavePosition[index].y);
	rockPosition = new THREE.Vector3(rockX, -20, rockZ);
	rockScale = 70;
}

function initScene() {
	container = document.createElement('div');
	document.body.appendChild(container);

	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);
	// camera.position.set(0, 200, 350);
	camera.position.set(0, 1000, 0);

	const sun1 = new THREE.DirectionalLight(0xffffff, 1.0);
	sun1.position.set(300, 400, 175);
	scene.add(sun1);

	const sun2 = new THREE.DirectionalLight(0x444444, 0.6);
	sun2.position.set(-100, 350, -200);
	scene.add(sun2);

	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	container.appendChild(renderer.domElement);
}

function initStats() {
	stats = new Stats();
	// container.appendChild(stats.dom);
}

function initControl() {
	// OrbitControls
	controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.maxZoom = 100;

	// TrackballControls
	// controls = new THREE.TrackballControls(camera, renderer.domElement);
	// controls.rotateSpeed = 5.0;
	// controls.zoomSpeed = 2.2;
	// controls.panSpeed = 1;
	// controls.dynamicDampingFactor = 0.3;
}

function initGround() {
	// texture
	const manager = new THREE.LoadingManager();
	manager.onProgress = (item, loaded, total) => {
		console.log(item, loaded, total);
	};

	const textureLoader = new THREE.TextureLoader(manager);
	const texture = textureLoader.load(sand);
	texture.center = new THREE.Vector2(0, 0);

	const geometry = new THREE.PlaneBufferGeometry(BOUNDS, BOUNDS, WIDTH - 1, WIDTH - 1);

	// material: make a ShaderMaterial clone of MeshPhongMaterial, with customized vertex shader
	const material = new THREE.ShaderMaterial({
		uniforms: THREE.UniformsUtils.merge([
			THREE.ShaderLib.phong.uniforms,
			{
				shininess: { value: 0 },
				heightmap: { value: null },
			},
		]),
		defines: {
			USE_MAP: '',
			WIDTH: WIDTH.toFixed(1),
			BOUNDS: BOUNDS.toFixed(1),
		},
		vertexShader: water,
		fragmentShader: THREE.ShaderChunk.meshphong_frag,
	});

	// Defines whether this material uses lighting;
	// true to pass uniform data related to lighting to this shader.
	material.lights = true;

	// Sets the uniforms with the material values
	material.uniforms.map.value = texture;
	material.uniforms.specular.value = new THREE.Color(0x111111);
	// material.uniforms.opacity.value = material.opacity;

	groundUniforms = material.uniforms;
	groundMesh = new THREE.Mesh(geometry, material);
	groundMesh.rotation.x = -Math.PI / 2;
	groundMesh.matrixAutoUpdate = false;
	groundMesh.updateMatrix();

	scene.add(groundMesh);

	// Mesh just for mouse raycasting
	const geometryRay = new THREE.PlaneBufferGeometry(BOUNDS, BOUNDS, 1, 1);
	meshRay = new THREE.Mesh(
		geometryRay,
		new THREE.MeshBasicMaterial({ color: 0xffffff, visible: false }),
	);
	meshRay.rotation.x = -Math.PI / 2;
	meshRay.matrixAutoUpdate = false;
	meshRay.updateMatrix();
	scene.add(meshRay);

	initHeightMap();
}

/* TODO
 * 1. grid
 * 2. multiple dots
 */
function initHeightMap() {
	// Creates the gpu computation class and sets it up
	gpuCompute = new GPUComputationRenderer(WIDTH, WIDTH, renderer);

	const heightmap0 = gpuCompute.createTexture();

	fillTexture(heightmap0);

	heightmapVariable = gpuCompute.addVariable('heightmap', heightmap, heightmap0);

	gpuCompute.setVariableDependencies(heightmapVariable, [heightmapVariable]);

	heightmapVariable.material.uniforms = {
		uMasterScale: { value: 1.0 },
		uBackgroundWaveScale: { value: 1.0 },
		uMousePos: { value: new THREE.Vector2(10000, 10000) },
		uCircularWave: {
			value: circularWavePosition,
		},
		uCircularWaveRadius: {
			value: circularWaveRadius,
		},
	};

	heightmapVariable.material.defines.BOUNDS = BOUNDS.toFixed(1);

	const error = gpuCompute.init();
	if (error !== null) {
		console.error(error);
	}
}

function loadModels() {
	const onProgress = (xhr) => {
		if (xhr.lengthComputable) {
			const percentComplete = xhr.loaded / xhr.total * 100;
			console.log(`downloading..${Math.round(percentComplete, 2)}%`);
		}
	};

	const onError = () => {};
	const mtlLoader = new THREE.MTLLoader();
	mtlLoader.load(rockMtl, (materials) => {
		materials.preload();
		const manager = new THREE.LoadingManager();
		manager.onProgress = (item, loaded, total) => {
			console.log(item, loaded, total);
		};
		const objLoader = new THREE.OBJLoader(manager);
		objLoader.setMaterials(materials);
		// objLoader.setPath( 'obj/male02/' );
		objLoader.load(
			rockObj,
			(object) => {
				rock = object;
				scene.add(object);
				initModel();
			},
			onProgress,
			onError,
		);
	});
}

function initModel() {
	rock.scale.set(rockScale, rockScale, rockScale);
	rock.position.set(rockPosition.x, rockPosition.y, rockPosition.z);
}

function fillTexture(texture) {
	const pixels = texture.image.data;
	let p = 0;
	for (let j = 0; j < WIDTH; j += 1) {
		for (let i = 0; i < WIDTH; i += 1) {
			pixels[p + 0] = 0;
			pixels[p + 1] = 0;
			pixels[p + 2] = 0;
			pixels[p + 3] = 1;
			p += 4;
		}
	}
}

function setMouseCoords(x, y) {
	mouseCoords.set(
		x / renderer.domElement.clientWidth * 2 - 1,
		-(y / renderer.domElement.clientHeight) * 2 + 1,
	);
	mouseMoved = true;
}

function onWindowResize() {
	// windowHalfX = window.innerWidth / 2;
	// windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseMove(event) {
	setMouseCoords(event.clientX, event.clientY);
}

function onDocumentTouchStart(event) {
	if (event.touches.length === 1) {
		event.preventDefault();

		setMouseCoords(event.touches[0].pageX, event.touches[0].pageY);
	}
}

function onDocumentTouchMove(event) {
	if (event.touches.length === 1) {
		event.preventDefault();

		setMouseCoords(event.touches[0].pageX, event.touches[0].pageY);
	}
}

function animate() {
	requestAnimationFrame(animate);

	render();
	stats.update();
}

function render() {
	// Do the gpu computation
	gpuCompute.compute();

	// Get compute output in custom uniform
	groundUniforms.heightmap.value = gpuCompute.getCurrentRenderTarget(heightmapVariable).texture;

	// Controls
	controls.update();

	// Detect Mouse
	rayCasterUpdate();

	// Animations
	TWEEN.update();

	// Rock
	modelUpdate();

	// Render
	renderer.render(scene, camera);
}

function rayCasterUpdate() {
	// Set uniforms: mouse interaction
	const { uniforms } = heightmapVariable.material;
	if (mouseMoved) {
		raycaster.setFromCamera(mouseCoords, camera);
		const intersects = raycaster.intersectObject(meshRay);

		if (intersects.length > 0) {
			const { point } = intersects[0];
			uniforms.uMousePos.value.set(point.x, point.z);
		} else {
			uniforms.uMousePos.value.set(10000, 10000);
		}
		mouseMoved = false;
	} else {
		uniforms.uMousePos.value.set(10000, 10000);
	}
}

function modelUpdate() {
	if (rock) {
		rock.rotation.y += 0.002;
	}
}

/* Event Handing */
function initAnimations() {
	const scale = { value: 1 };
	const { uniforms } = heightmapVariable.material;
	const aniRockIn = new TWEEN.Tween(scale)
		.easing(TWEEN.Easing.Exponential.In)
		.to({ value: 1 }, 1000)
		.onUpdate((scale) => {
			const d = rockScale * scale.value;
			rock.scale.set(d, d, d);
		});

	const aniOut = new TWEEN.Tween(uniforms.uMasterScale)
		.easing(TWEEN.Easing.Exponential.In)
		.to({ value: 1 }, 1000)
		.chain(aniRockIn);

	const aniRockOut = new TWEEN.Tween(scale)
		.easing(TWEEN.Easing.Exponential.In)
		.to({ value: 0.1 }, 1000)
		.onUpdate((scale) => {
			console.log(scale.value);
			const d = rockScale * scale.value;
			rock.scale.set(d, d, d);
		})
		.onComplete(() => {
			rock.position.set(rockPosition.x, rockPosition.y, rockPosition.z);
			uniforms.uCircularWave.value = circularWavePosition;
			uniforms.uCircularWaveRadius.value = circularWaveRadius;
		})
		.chain(aniOut);

	masterScaleAni = new TWEEN.Tween(uniforms.uMasterScale)
		.easing(TWEEN.Easing.Exponential.In)
		.to({ value: 0 }, 1000)
		.chain(aniRockOut);
}

function handleKeyDown(event) {
	if (event.keyCode === 87) {
		groundMesh.material.wireframe = !groundMesh.material.wireframe;
		groundMesh.material.needsUpdate = true;
	} else if (event.keyCode === 32) {
		initLayout();
		masterScaleAni.start();
	}
}
