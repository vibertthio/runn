import * as THREE from 'three';
import OrbitControls from 'orbit-controls-es6';

import Stats from 'libs/stats.min';
import SimplexNoise from './SimplexNoise';
import water from './shaders/water.vert';
import smooth from './shaders/smooth.frag';
import heightmap from './shaders/heightmap.frag';

const WIDTH = 512;
const NUM_TEXELS = WIDTH * WIDTH;

// Water size in system units
const BOUNDS = 1024;
const BOUNDS_HALF = BOUNDS * 0.5;

let container;
let stats;
let camera;
let scene;
let renderer;
let controls;
let mouseMoved = false;
const mouseCoords = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

let waterMesh;
let meshRay;
let gpuCompute;
let heightmapVariable;
let waterUniforms;
let smoothShader;

const simplex = new SimplexNoise();

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

init();
animate();

function init() {
	container = document.createElement('div');
	document.body.appendChild(container);

	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);
	camera.position.set(0, 200, 350);

	scene = new THREE.Scene();

	const sun = new THREE.DirectionalLight(0xffffff, 1.0);
	sun.position.set(300, 400, 175);
	scene.add(sun);

	// const sun2 = new THREE.DirectionalLight(0x40a040, 0.6);
	const sun2 = new THREE.DirectionalLight(0x444444, 0.6);
	sun2.position.set(-100, 350, -200);
	scene.add(sun2);

	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	container.appendChild(renderer.domElement);

	controls = new OrbitControls(camera, renderer.domElement);

	stats = new Stats();
	container.appendChild(stats.dom);

	document.addEventListener('mousemove', onDocumentMouseMove, false);
	document.addEventListener('touchstart', onDocumentTouchStart, false);
	document.addEventListener('touchmove', onDocumentTouchMove, false);

	document.addEventListener(
		'keydown',
		(event) => {
			// W Pressed: Toggle wireframe
			if (event.keyCode === 87) {
				waterMesh.material.wireframe = !waterMesh.material.wireframe;
				waterMesh.material.needsUpdate = true;
			}
		},
		false,
	);

	window.addEventListener('resize', onWindowResize, false);

	initWater();
}

function initWater() {
	// var materialColor = 0x0040C0;
	const materialColor = 0x444444;

	const geometry = new THREE.PlaneBufferGeometry(BOUNDS, BOUNDS, WIDTH - 1, WIDTH - 1);

	// material: make a ShaderMaterial clone of MeshPhongMaterial, with customized vertex shader
	const material = new THREE.ShaderMaterial({
		uniforms: THREE.UniformsUtils.merge([
			THREE.ShaderLib.phong.uniforms,
			{
				heightmap: { value: null },
			},
		]),
		vertexShader: water,
		fragmentShader: THREE.ShaderChunk.meshphong_frag,
	});

	material.lights = true;

	// Material attributes from MeshPhongMaterial
	material.color = new THREE.Color(materialColor);
	material.specular = new THREE.Color(0x111111);
	material.shininess = 50;

	// Sets the uniforms with the material values
	material.uniforms.diffuse.value = material.color;
	material.uniforms.specular.value = material.specular;
	material.uniforms.shininess.value = Math.max(material.shininess, 1e-4);
	material.uniforms.opacity.value = material.opacity;

	// Defines
	material.defines.WIDTH = WIDTH.toFixed(1);
	material.defines.BOUNDS = BOUNDS.toFixed(1);

	waterUniforms = material.uniforms;

	waterMesh = new THREE.Mesh(geometry, material);
	waterMesh.rotation.x = -Math.PI / 2;
	waterMesh.matrixAutoUpdate = false;
	waterMesh.updateMatrix();

	scene.add(waterMesh);

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

	// Creates the gpu computation class and sets it up

	gpuCompute = new GPUComputationRenderer(WIDTH, WIDTH, renderer);

	const heightmap0 = gpuCompute.createTexture();

	fillTexture(heightmap0);

	heightmapVariable = gpuCompute.addVariable(
		'heightmap',
		heightmap,
		heightmap0,
	);

	gpuCompute.setVariableDependencies(heightmapVariable, [heightmapVariable]);

	heightmapVariable.material.uniforms.mousePos = { value: new THREE.Vector2(10000, 10000) };
	heightmapVariable.material.uniforms.mouseSize = { value: 20.0 };
	heightmapVariable.material.uniforms.viscosityConstant = { value: 0.03 };
	heightmapVariable.material.defines.BOUNDS = BOUNDS.toFixed(1);

	const error = gpuCompute.init();
	if (error !== null) {
		console.error(error);
	}

	// Create compute shader to smooth the water surface and velocity
	smoothShader = gpuCompute.createShaderMaterial(
		smooth,
		{ texture: { value: null } },
	);
}

function fillTexture(texture) {
	var waterMaxHeight = 10;

	function noise(x, y, z) {
		var waterMaxHeight = 10;
		let multR = waterMaxHeight;
		let mult = 0.025;
		let r = 0;
		for (let i = 0; i < 15; i++) {
			r += multR * simplex.noise(x * mult, y * mult);
			multR *= 0.53 + 0.025 * i;
			mult *= 1.25;
		}
		return r;
	}

	const pixels = texture.image.data;

	let p = 0;
	for (let j = 0; j < WIDTH; j++) {
		for (let i = 0; i < WIDTH; i++) {
			const x = i * 128 / WIDTH;
			const y = j * 128 / WIDTH;

			pixels[p + 0] = noise(x, y, 123.4);
			pixels[p + 1] = 0;
			pixels[p + 2] = 0;
			pixels[p + 3] = 1;

			p += 4;
		}
	}
}

function smoothWater() {
	const currentRenderTarget = gpuCompute.getCurrentRenderTarget(heightmapVariable);
	const alternateRenderTarget = gpuCompute.getAlternateRenderTarget(heightmapVariable);

	for (let i = 0; i < 10; i++) {
		smoothShader.uniforms.texture.value = currentRenderTarget.texture;
		gpuCompute.doRenderTarget(smoothShader, alternateRenderTarget);

		smoothShader.uniforms.texture.value = alternateRenderTarget.texture;
		gpuCompute.doRenderTarget(smoothShader, currentRenderTarget);
	}
}

function onWindowResize() {
	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
}

function setMouseCoords(x, y) {
	mouseCoords.set(
		x / renderer.domElement.clientWidth * 2 - 1,
		-(y / renderer.domElement.clientHeight) * 2 + 1,
	);
	mouseMoved = true;
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
	// Set uniforms: mouse interaction
	const uniforms = heightmapVariable.material.uniforms;
	if (mouseMoved) {
		raycaster.setFromCamera(mouseCoords, camera);

		const intersects = raycaster.intersectObject(meshRay);

		if (intersects.length > 0) {
			const point = intersects[0].point;
			uniforms.mousePos.value.set(point.x, point.z);
		} else {
			uniforms.mousePos.value.set(10000, 10000);
		}

		mouseMoved = false;
	} else {
		uniforms.mousePos.value.set(10000, 10000);
	}

	// Do the gpu computation
	gpuCompute.compute();

	// Get compute output in custom uniform
	waterUniforms.heightmap.value = gpuCompute.getCurrentRenderTarget(heightmapVariable).texture;

	// Render
	renderer.render(scene, camera);
}

/**
 * @author yomboprime https://github.com/yomboprime
 *
 * GPUComputationRenderer, based on SimulationRenderer by zz85
 *
 * The GPUComputationRenderer uses the concept of variables. These variables are RGBA float textures that hold 4 floats
 * for each compute element (texel)
 *
 * Each variable has a fragment shader that defines the computation made to obtain the variable in question.
 * You can use as many variables you need, and make dependencies so you can use textures of other variables in the shader
 * (the sampler uniforms are added automatically) Most of the variables will need themselves as dependency.
 *
 * The renderer has actually two render targets per variable, to make ping-pong. Textures from the current frame are used
 * as inputs to render the textures of the next frame.
 *
 * The render targets of the variables can be used as input textures for your visualization shaders.
 *
 * Variable names should be valid identifiers and should not collide with THREE GLSL used identifiers.
 * a common approach could be to use 'texture' prefixing the variable name; i.e texturePosition, textureVelocity...
 *
 * The size of the computation (sizeX * sizeY) is defined as 'resolution' automatically in the shader. For example:
 * #DEFINE resolution vec2( 1024.0, 1024.0 )
 *
 * -------------
 *
 * Basic use:
 *
 * // Initialization...
 *
 * // Create computation renderer
 * var gpuCompute = new GPUComputationRenderer( 1024, 1024, renderer );
 *
 * // Create initial state float textures
 * var pos0 = gpuCompute.createTexture();
 * var vel0 = gpuCompute.createTexture();
 * // and fill in here the texture data...
 *
 * // Add texture variables
 * var velVar = gpuCompute.addVariable( "textureVelocity", fragmentShaderVel, pos0 );
 * var posVar = gpuCompute.addVariable( "texturePosition", fragmentShaderPos, vel0 );
 *
 * // Add variable dependencies
 * gpuCompute.setVariableDependencies( velVar, [ velVar, posVar ] );
 * gpuCompute.setVariableDependencies( posVar, [ velVar, posVar ] );
 *
 * // Add custom uniforms
 * velVar.material.uniforms.time = { value: 0.0 };
 *
 * // Check for completeness
 * var error = gpuCompute.init();
 * if ( error !== null ) {
 *		console.error( error );
 * }
 *
 *
 * // In each frame...
 *
 * // Compute!
 * gpuCompute.compute();
 *
 * // Update texture uniforms in your visualization materials with the gpu renderer output
 * myMaterial.uniforms.myTexture.value = gpuCompute.getCurrentRenderTarget( posVar ).texture;
 *
 * // Do your rendering
 * renderer.render( myScene, myCamera );
 *
 * -------------
 *
 * Also, you can use utility functions to create ShaderMaterial and perform computations (rendering between textures)
 * Note that the shaders can have multiple input textures.
 *
 * var myFilter1 = gpuCompute.createShaderMaterial( myFilterFragmentShader1, { theTexture: { value: null } } );
 * var myFilter2 = gpuCompute.createShaderMaterial( myFilterFragmentShader2, { theTexture: { value: null } } );
 *
 * var inputTexture = gpuCompute.createTexture();
 *
 * // Fill in here inputTexture...
 *
 * myFilter1.uniforms.theTexture.value = inputTexture;
 *
 * var myRenderTarget = gpuCompute.createRenderTarget();
 * myFilter2.uniforms.theTexture.value = myRenderTarget.texture;
 *
 * var outputRenderTarget = gpuCompute.createRenderTarget();
 *
 * // Now use the output texture where you want:
 * myMaterial.uniforms.map.value = outputRenderTarget.texture;
 *
 * // And compute each frame, before rendering to screen:
 * gpuCompute.doRenderTarget( myFilter1, myRenderTarget );
 * gpuCompute.doRenderTarget( myFilter2, outputRenderTarget );
 *
 *
 *
 * @param {int} sizeX Computation problem size is always 2d: sizeX * sizeY elements.
 * @param {int} sizeY Computation problem size is always 2d: sizeX * sizeY elements.
 * @param {WebGLRenderer} renderer The renderer
 */

function GPUComputationRenderer(sizeX, sizeY, renderer) {
	this.variables = [];

	this.currentTextureIndex = 0;

	const scene = new THREE.Scene();

	const camera = new THREE.Camera();
	camera.position.z = 1;

	const passThruUniforms = {
		texture: { value: null },
	};

	const passThruShader = createShaderMaterial(getPassThroughFragmentShader(), passThruUniforms);

	const mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), passThruShader);
	scene.add(mesh);

	this.addVariable = function (variableName, computeFragmentShader, initialValueTexture) {
		const material = this.createShaderMaterial(computeFragmentShader);

		const variable = {
			name: variableName,
			initialValueTexture,
			material,
			dependencies: null,
			renderTargets: [],
			wrapS: null,
			wrapT: null,
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
		};

		this.variables.push(variable);

		return variable;
	};

	this.setVariableDependencies = function (variable, dependencies) {
		variable.dependencies = dependencies;
	};

	this.init = function () {
		if (!renderer.extensions.get('OES_texture_float')) {
			return 'No OES_texture_float support for float textures.';
		}

		if (renderer.capabilities.maxVertexTextures === 0) {
			return 'No support for vertex shader textures.';
		}

		for (let i = 0; i < this.variables.length; i++) {
			const variable = this.variables[i];

			// Creates rendertargets and initialize them with input texture
			variable.renderTargets[0] = this.createRenderTarget(
				sizeX,
				sizeY,
				variable.wrapS,
				variable.wrapT,
				variable.minFilter,
				variable.magFilter,
			);
			variable.renderTargets[1] = this.createRenderTarget(
				sizeX,
				sizeY,
				variable.wrapS,
				variable.wrapT,
				variable.minFilter,
				variable.magFilter,
			);
			this.renderTexture(variable.initialValueTexture, variable.renderTargets[0]);
			this.renderTexture(variable.initialValueTexture, variable.renderTargets[1]);

			// Adds dependencies uniforms to the ShaderMaterial
			const material = variable.material;
			const uniforms = material.uniforms;
			if (variable.dependencies !== null) {
				for (let d = 0; d < variable.dependencies.length; d++) {
					const depVar = variable.dependencies[d];

					if (depVar.name !== variable.name) {
						// Checks if variable exists
						let found = false;
						for (let j = 0; j < this.variables.length; j++) {
							if (depVar.name === this.variables[j].name) {
								found = true;
								break;
							}
						}
						if (!found) {
							return (
								`Variable dependency not found. Variable=${
								variable.name
								}, dependency=${
								depVar.name}`
							);
						}
					}

					uniforms[depVar.name] = { value: null };

					material.fragmentShader =
						`\nuniform sampler2D ${depVar.name};\n${material.fragmentShader}`;
				}
			}
		}

		this.currentTextureIndex = 0;

		return null;
	};

	this.compute = function () {
		const currentTextureIndex = this.currentTextureIndex;
		const nextTextureIndex = this.currentTextureIndex === 0 ? 1 : 0;

		for (let i = 0, il = this.variables.length; i < il; i++) {
			const variable = this.variables[i];

			// Sets texture dependencies uniforms
			if (variable.dependencies !== null) {
				const uniforms = variable.material.uniforms;
				for (let d = 0, dl = variable.dependencies.length; d < dl; d++) {
					const depVar = variable.dependencies[d];

					uniforms[depVar.name].value = depVar.renderTargets[currentTextureIndex].texture;
				}
			}

			// Performs the computation for this variable
			this.doRenderTarget(variable.material, variable.renderTargets[nextTextureIndex]);
		}

		this.currentTextureIndex = nextTextureIndex;
	};

	this.getCurrentRenderTarget = function (variable) {
		return variable.renderTargets[this.currentTextureIndex];
	};

	this.getAlternateRenderTarget = function (variable) {
		return variable.renderTargets[this.currentTextureIndex === 0 ? 1 : 0];
	};

	function addResolutionDefine(materialShader) {
		materialShader.defines.resolution =
			`vec2( ${sizeX.toFixed(1)}, ${sizeY.toFixed(1)} )`;
	}
	this.addResolutionDefine = addResolutionDefine;

	// The following functions can be used to compute things manually

	function createShaderMaterial(computeFragmentShader, uniforms) {
		uniforms = uniforms || {};

		const material = new THREE.ShaderMaterial({
			uniforms,
			vertexShader: getPassThroughVertexShader(),
			fragmentShader: computeFragmentShader,
		});

		addResolutionDefine(material);

		return material;
	}
	this.createShaderMaterial = createShaderMaterial;

	this.createRenderTarget = function (
		sizeXTexture,
		sizeYTexture,
		wrapS,
		wrapT,
		minFilter,
		magFilter,
	) {
		sizeXTexture = sizeXTexture || sizeX;
		sizeYTexture = sizeYTexture || sizeY;

		wrapS = wrapS || THREE.ClampToEdgeWrapping;
		wrapT = wrapT || THREE.ClampToEdgeWrapping;

		minFilter = minFilter || THREE.NearestFilter;
		magFilter = magFilter || THREE.NearestFilter;

		const renderTarget = new THREE.WebGLRenderTarget(sizeXTexture, sizeYTexture, {
			wrapS,
			wrapT,
			minFilter,
			magFilter,
			format: THREE.RGBAFormat,
			type: /(iPad|iPhone|iPod)/g.test(navigator.userAgent) ? THREE.HalfFloatType : THREE.FloatType,
			stencilBuffer: false,
		});

		return renderTarget;
	};

	this.createTexture = function (sizeXTexture, sizeYTexture) {
		sizeXTexture = sizeXTexture || sizeX;
		sizeYTexture = sizeYTexture || sizeY;

		const a = new Float32Array(sizeXTexture * sizeYTexture * 4);
		const texture = new THREE.DataTexture(a, sizeX, sizeY, THREE.RGBAFormat, THREE.FloatType);
		texture.needsUpdate = true;

		return texture;
	};

	this.renderTexture = function (input, output) {
		// Takes a texture, and render out in rendertarget
		// input = Texture
		// output = RenderTarget

		passThruUniforms.texture.value = input;

		this.doRenderTarget(passThruShader, output);

		passThruUniforms.texture.value = null;
	};

	this.doRenderTarget = function (material, output) {
		mesh.material = material;
		renderer.render(scene, camera, output);
		mesh.material = passThruShader;
	};

	// Shaders

	function getPassThroughVertexShader() {
		return 'void main()	{\n' + '\n' + '	gl_Position = vec4( position, 1.0 );\n' + '\n' + '}\n';
	}

	function getPassThroughFragmentShader() {
		return (
			'uniform sampler2D texture;\n' +
			'\n' +
			'void main() {\n' +
			'\n' +
			'	vec2 uv = gl_FragCoord.xy / resolution.xy;\n' +
			'\n' +
			'	gl_FragColor = texture2D( texture, uv );\n' +
			'\n' +
			'}\n'
		);
	}
}
