import * as THREE from 'three';
import { COLORS } from '../config.js';

export function createEnvironment(scene) {
    // Background
    scene.background = new THREE.Color(COLORS.background);

    // Fog for depth cue (reduced for larger scene)
    scene.fog = new THREE.FogExp2(COLORS.background, 0.0015);

    // Ambient light — low for moody atmosphere
    const ambient = new THREE.AmbientLight(0x333355, 0.5);
    scene.add(ambient);

    // Key light — warm directional from upper-right
    const keyLight = new THREE.DirectionalLight(0xffeedd, 0.8);
    keyLight.position.set(40, 100, 30);
    scene.add(keyLight);

    // Fill light — cool from lower-left
    const fillLight = new THREE.DirectionalLight(0x8888cc, 0.3);
    fillLight.position.set(-30, -20, -20);
    scene.add(fillLight);

    // Grid floor
    createGridFloor(scene);

    // Star field backdrop
    createStarField(scene);
}

function createGridFloor(scene) {
    const gridSize = 400;
    const gridDivisions = 60;

    const grid = new THREE.GridHelper(gridSize, gridDivisions, COLORS.gridLines, COLORS.gridFloor);
    grid.position.y = -160;
    grid.material.opacity = 0.12;
    grid.material.transparent = true;
    scene.add(grid);
}

function createStarField(scene) {
    const starCount = 2000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        // Random sphere distribution
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 250 + Math.random() * 150;

        positions[i3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = r * Math.cos(phi);
        positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

        // Slight blue/white color variation
        const brightness = 0.3 + Math.random() * 0.7;
        colors[i3] = brightness * (0.8 + Math.random() * 0.2);
        colors[i3 + 1] = brightness * (0.8 + Math.random() * 0.2);
        colors[i3 + 2] = brightness;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true,
    });

    const stars = new THREE.Points(geometry, material);
    scene.add(stars);
}
