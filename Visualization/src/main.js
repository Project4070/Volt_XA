import * as THREE from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { createEnvironment } from './scene/Environment.js';
import { buildScene, updateScene, getComponents } from './scene/SceneBuilder.js';
import { FlyCamera } from './camera/FlyCamera.js';
import { PerformanceMonitor } from './utils/PerformanceMonitor.js';
import { PipelineAnimator } from './animation/PipelineAnimator.js';
import { CameraPath } from './camera/CameraPath.js';
import { Raycaster } from './interaction/Raycaster.js';
import { FocusManager } from './interaction/FocusManager.js';
import { InfoPanel } from './interaction/InfoPanel.js';
import { LODManager } from './utils/LODManager.js';
import { CAMERA, COLORS } from './config.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

// === GLOBALS ===
let scene, camera, renderer, labelRenderer, clock, composer;
let flyCamera, perfMonitor, pipelineAnimator;
let cameraPath, raycaster, focusManager, infoPanel, lodManager;
let fpsDisplay, layerDisplay, stateDisplay;

// Component groups (populated in later phases)
export const componentGroups = {};

// === INIT ===
function init() {
    window._voltInitStarted = true;
    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(
        CAMERA.fov,
        window.innerWidth / window.innerHeight,
        CAMERA.near,
        CAMERA.far
    );
    camera.position.set(CAMERA.startPosition.x, CAMERA.startPosition.y, CAMERA.startPosition.z);
    camera.lookAt(CAMERA.startLookAt.x, CAMERA.startLookAt.y, CAMERA.startLookAt.z);

    // WebGL Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('canvas'),
        antialias: true,
        alpha: false,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // Post-processing (bloom + FXAA)
    try {
        composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.4, 0.6, 0.85
        );
        composer.addPass(bloomPass);

        const fxaaPass = new ShaderPass(FXAAShader);
        const pr = renderer.getPixelRatio();
        fxaaPass.material.uniforms['resolution'].value.set(
            1 / (window.innerWidth * pr),
            1 / (window.innerHeight * pr)
        );
        composer.addPass(fxaaPass);

        console.log('Post-processing enabled (bloom + FXAA)');
    } catch (e) {
        console.warn('Post-processing unavailable, using standard renderer:', e.message);
        composer = null;
    }

    // CSS2D Label Renderer
    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.left = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    document.getElementById('container').appendChild(labelRenderer.domElement);

    // Clock
    clock = new THREE.Clock();

    // Camera controller
    flyCamera = new FlyCamera(camera, renderer.domElement);

    // Performance monitor
    perfMonitor = new PerformanceMonitor();
    perfMonitor.onQualityChange = (level) => {
        const names = ['Low', 'Medium', 'High', 'Ultra'];
        console.log(`Quality adjusted to: ${names[level]}`);
    };

    // HUD elements
    fpsDisplay = document.getElementById('fps');
    layerDisplay = document.getElementById('layer-name');
    stateDisplay = document.getElementById('pipeline-state');

    // Environment
    createEnvironment(scene);

    // Build all architecture components
    buildScene(scene);

    // Pipeline animation system
    const components = getComponents();

    try {
        pipelineAnimator = new PipelineAnimator(scene, components);
        pipelineAnimator.onStateChange = (newState, oldState) => {
            if (stateDisplay) stateDisplay.textContent = pipelineAnimator.getStateName();
        };
        pipelineAnimator.start();
    } catch (e) {
        console.warn('Pipeline animator failed to initialize:', e.message);
    }

    // Auto-tour camera path
    cameraPath = new CameraPath(flyCamera);

    // Interaction system
    raycaster = new Raycaster(camera, renderer.domElement);
    raycaster.setTargets(Object.values(components).filter(c => c && c.isObject3D));

    focusManager = new FocusManager(flyCamera);
    focusManager.setComponents(components);

    infoPanel = new InfoPanel();

    // Wire hover
    raycaster.onHover = (obj) => {
        if (obj.userData?.type) {
            renderer.domElement.style.cursor = 'pointer';
        }
    };
    raycaster.onHoverEnd = () => {
        renderer.domElement.style.cursor = 'default';
    };

    // Wire click → focus + info panel
    raycaster.onClick = (obj) => {
        const componentObj = findComponentAncestor(obj);
        if (componentObj?.userData?.type) {
            focusManager.focus(componentObj);
            infoPanel.show(componentObj.userData.type);
        }
    };

    // Wire double-click → unfocus
    raycaster.onDoubleClick = () => {
        focusManager.unfocus();
        infoPanel.hide();
    };

    focusManager.onUnfocus = () => {
        infoPanel.hide();
    };

    // LOD manager
    lodManager = new LODManager(camera);
    lodManager.registerAll(components);

    // Auto-tour button
    window.addEventListener('toggle-tour', () => {
        if (cameraPath) {
            const active = cameraPath.toggle();
            const btn = document.getElementById('btn-auto-tour');
            if (btn) btn.classList.toggle('active', active);
        }
    });

    // Keyboard shortcuts for layer focus + pipeline controls
    window.addEventListener('keydown', (e) => {
        const keyMap = {
            '1': 'translators',
            '2': 'bus',
            '3': 'gpuSoftCore',
            '4': 'cpuHardCore',
            '5': 'voltDB',
            '6': 'outputCores',
            '7': 'learning',
            '8': 'commons',
            '9': 'ui',
            '0': 'overview',
        };
        if (keyMap[e.key] && !e.ctrlKey && !e.altKey) {
            flyCamera.focusOn(keyMap[e.key]);
            if (layerDisplay) layerDisplay.textContent = keyMap[e.key];
        }

        // P key: toggle play/pause
        if (e.key === 'p' || e.key === 'P') {
            if (pipelineAnimator) {
                const paused = pipelineAnimator.togglePause();
                const btn = document.getElementById('btn-play-pause');
                if (btn) btn.textContent = paused ? 'Play' : 'Pause';
            }
        }

        // F key: focus on hovered component
        if (e.key === 'f' || e.key === 'F') {
            if (raycaster && raycaster.hoveredObject) {
                const comp = findComponentAncestor(raycaster.hoveredObject);
                if (comp?.userData?.type) {
                    focusManager.focus(comp);
                    infoPanel.show(comp.userData.type);
                }
            }
        }

        // Escape: unfocus
        if (e.key === 'Escape') {
            if (focusManager) focusManager.unfocus();
            if (infoPanel) infoPanel.hide();
        }

        // T key: follow active particle
        if (e.key === 't' || e.key === 'T') {
            if (pipelineAnimator && pipelineAnimator.activeParticle) {
                const pos = pipelineAnimator.activeParticle.position;
                flyCamera.flyTo(
                    { x: pos.x + 10, y: pos.y + 5, z: pos.z + 15 },
                    { x: pos.x, y: pos.y, z: pos.z }
                );
            }
        }
    });

    // Expose flyCamera to global for HUD button interop
    window._voltFlyCamera = flyCamera;

    // Listen for layer-focus events from HUD buttons
    window.addEventListener('layer-focus', (e) => {
        flyCamera.focusOn(e.detail);
        if (layerDisplay) layerDisplay.textContent = e.detail;
    });

    // Listen for pipeline control events from HUD
    window.addEventListener('pipeline-play-pause', () => {
        if (pipelineAnimator) {
            const paused = pipelineAnimator.togglePause();
            const btn = document.getElementById('btn-play-pause');
            if (btn) btn.textContent = paused ? 'Play' : 'Pause';
        }
    });

    window.addEventListener('pipeline-speed', (e) => {
        if (pipelineAnimator) {
            pipelineAnimator.setSpeed(e.detail);
        }
    });

    // Resize handler
    window.addEventListener('resize', onResize);

    console.log('Volt XA Visualization initialized successfully');

    // Start render loop
    animate();
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);

    // Resize post-processing
    if (composer) {
        composer.setSize(window.innerWidth, window.innerHeight);
        const pixelRatio = renderer.getPixelRatio();
        const fxaaPass = composer.passes.find(p => p.material?.uniforms?.resolution);
        if (fxaaPass) {
            fxaaPass.material.uniforms['resolution'].value.set(
                1 / (window.innerWidth * pixelRatio),
                1 / (window.innerHeight * pixelRatio)
            );
        }
    }
}

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    // Update auto-tour camera path
    if (cameraPath && cameraPath.active) {
        cameraPath.update(delta);
    }

    // Update camera
    flyCamera.update(delta);

    // Update raycaster for hover detection
    if (raycaster) raycaster.update();

    // Update ambient animations
    updateScene(elapsed);

    // Update pipeline animation
    if (pipelineAnimator) {
        try {
            pipelineAnimator.update(delta);
            if (stateDisplay) stateDisplay.textContent = pipelineAnimator.getStateName();
        } catch (e) {
            // Don't let animation errors kill the render loop
            console.warn('Pipeline update error:', e.message);
        }
    }

    // Update LOD
    if (lodManager) lodManager.update();

    // Update performance monitor
    const fps = perfMonitor.update();
    if (fpsDisplay) fpsDisplay.textContent = `${fps} FPS`;

    // Render with post-processing (fallback to standard if unavailable)
    if (composer) {
        composer.render(delta);
    } else {
        renderer.render(scene, camera);
    }
    labelRenderer.render(scene, camera);
}

// === EXPORTS for other modules ===
export function getScene() { return scene; }
export function getCamera() { return camera; }
export function getClock() { return clock; }
export function getFlyCamera() { return flyCamera; }
export function getRenderer() { return renderer; }
export function getPipelineAnimator() { return pipelineAnimator; }

// Helper: walk up scene graph to find component group
function findComponentAncestor(obj) {
    let current = obj;
    while (current) {
        if (current.userData && current.userData.type) return current;
        current = current.parent;
    }
    return obj;
}

// === START ===
try {
    init();
} catch (err) {
    console.error('Volt XA initialization failed:', err);
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(15, 23, 42, 0.95); border: 1px solid #ef4444;
        border-radius: 10px; padding: 24px 32px; max-width: 500px;
        font-family: 'Consolas', monospace; color: #e2e8f0; z-index: 1000;
        text-align: center;
    `;
    errorDiv.innerHTML = `
        <div style="color: #ef4444; font-size: 16px; font-weight: bold; margin-bottom: 12px;">
            Initialization Error
        </div>
        <div style="color: #94a3b8; font-size: 12px; margin-bottom: 16px;">
            ${err.message}
        </div>
    `;
    document.body.appendChild(errorDiv);
    const title = document.getElementById('title');
    if (title) title.style.display = 'none';
}
