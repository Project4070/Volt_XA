import * as THREE from 'three';
import { COLORS, LAYOUT, SIZES } from '../config.js';
import { createGlowMaterial, createGlassMaterial, createWireframeMaterial } from '../utils/MeshFactory.js';
import { createLayerLabel, createAnnotation } from '../utils/TextLabel.js';

export function createGPUSoftCore(scene) {
    const group = new THREE.Group();
    const y = LAYOUT.gpuSoftCore.y;
    group.position.set(0, y, 0);
    group.userData = { type: 'gpuSoftCore', name: 'GPU Soft Core — RAR Loop' };

    const majorR = SIZES.rarTorusMajorRadius;
    const minorR = SIZES.rarTorusMinorRadius;

    // === MAIN TORUS (RAR Loop Chamber) ===
    // Three sectors: Root (0-120deg), Attend (120-240deg), Refine (240-360deg)
    createTorusSector(group, majorR, minorR, 0, Math.PI * 2 / 3, COLORS.rarRoot, 'Root Phase');
    createTorusSector(group, majorR, minorR, Math.PI * 2 / 3, Math.PI * 4 / 3, COLORS.rarAttend, 'Attend Phase');
    createTorusSector(group, majorR, minorR, Math.PI * 4 / 3, Math.PI * 2, COLORS.rarRefine, 'Refine Phase');

    // === ROOT SECTOR INTERNALS ===
    // 16 VFN lane indicators inside the Root sector
    const vfnGroup = createVFNLanes(majorR, minorR);
    group.add(vfnGroup);

    // === ATTEND SECTOR INTERNALS ===
    // 16x16 attention matrix grid
    const attentionGrid = createAttentionMatrix();
    attentionGrid.position.set(-majorR * 0.7, 0, majorR * 0.5);
    group.add(attentionGrid);

    // Ghost frame spheres
    const ghostGroup = createGhostFrames(majorR);
    group.add(ghostGroup);

    // === REFINE SECTOR INTERNALS ===
    // 16 convergence meters arranged in a ring
    const convergenceGroup = createConvergenceMeters(majorR);
    group.add(convergenceGroup);

    // === ENERGY LANDSCAPE (beneath torus) ===
    const landscape = createEnergyLandscape();
    landscape.position.y = -5;
    group.add(landscape);

    // === LABELS ===
    const mainLabel = createLayerLabel('Layer 3: GPU Soft Core — RAR Loop', '#3b82f6');
    mainLabel.position.set(0, minorR + 3, 0);
    group.add(mainLabel);

    const computeLabel = createAnnotation('~25M FLOPs/query (12 iter) — 36M× less than GPT-4', '#64748b');
    computeLabel.position.set(0, minorR + 1.5, 0);
    group.add(computeLabel);

    // Sector labels
    const rootLabel = createAnnotation('ROOT: 16 Parallel VFN Passes', '#3b82f6');
    rootLabel.position.set(majorR * 0.8, 0, majorR * 0.5);
    group.add(rootLabel);

    const attendLabel = createAnnotation('ATTEND: 16×16 Attention + Ghosts', '#22d3ee');
    attendLabel.position.set(-majorR * 0.8, 0, majorR * 0.5);
    group.add(attendLabel);

    const refineLabel = createAnnotation('REFINE: Convergence + Freezing', '#1e3a5f');
    refineLabel.position.set(0, 0, -majorR * 0.8);
    group.add(refineLabel);

    scene.add(group);
    return group;
}

function createTorusSector(parent, majorR, minorR, startAngle, endAngle, color, name) {
    // Create a partial torus using parametric geometry
    const segments = 40;
    const tubeSegments = 16;
    const arcLength = endAngle - startAngle;

    const geometry = new THREE.TorusGeometry(
        majorR, minorR, tubeSegments, segments,
        arcLength
    );

    const material = createGlassMaterial(color, 0.2);
    const mesh = new THREE.Mesh(geometry, material);

    // Rotate to correct sector position
    mesh.rotation.y = startAngle;
    mesh.userData = { type: 'rarSector', name: name };

    // Add a glowing edge ring
    const edgeMaterial = createGlowMaterial(color, 0.4, 0.6);
    const edgeGeometry = new THREE.TorusGeometry(
        majorR, minorR * 0.05, 8, segments,
        arcLength
    );
    const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    edge.rotation.y = startAngle;
    edge.position.y = minorR * 0.95;

    parent.add(mesh);
    parent.add(edge);
}

function createVFNLanes(majorR, minorR) {
    const group = new THREE.Group();
    const laneMaterial = createGlowMaterial(COLORS.rarRoot, 0.3, 0.6);

    // 16 small VFN indicators in the Root sector area
    for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * (Math.PI * 2 / 3) + Math.PI / 16;
        const x = Math.cos(angle) * majorR;
        const z = Math.sin(angle) * majorR;

        // Small stacked planes (neural net icon)
        const laneGroup = new THREE.Group();
        for (let layer = 0; layer < 4; layer++) {
            const plane = new THREE.Mesh(
                new THREE.BoxGeometry(0.6, 0.1, 0.4),
                laneMaterial
            );
            plane.position.y = layer * 0.3 - 0.45;
            laneGroup.add(plane);
        }

        laneGroup.position.set(x, 0, z);
        laneGroup.lookAt(0, 0, 0);
        group.add(laneGroup);
    }

    return group;
}

function createAttentionMatrix() {
    const group = new THREE.Group();
    const size = 16;
    const cellSize = 0.25;
    const spacing = cellSize * 1.1;

    // Instanced mesh for 16x16 = 256 cells
    const cellGeometry = new THREE.PlaneGeometry(cellSize, cellSize);
    const cellMaterial = new THREE.MeshBasicMaterial({
        color: COLORS.rarAttend,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
    });

    const matrix = new THREE.InstancedMesh(cellGeometry, cellMaterial, size * size);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const idx = i * size + j;
            dummy.position.set(
                (j - size / 2 + 0.5) * spacing,
                (size / 2 - i - 0.5) * spacing,
                0
            );
            dummy.updateMatrix();
            matrix.setMatrixAt(idx, dummy.matrix);

            // Random attention weights for visual
            const weight = Math.random();
            const color = new THREE.Color();
            color.setHSL(0.55, 0.8, 0.2 + weight * 0.6);
            matrix.setColorAt(idx, color);
        }
    }

    matrix.instanceColor.needsUpdate = true;
    matrix.rotation.y = Math.PI / 4;
    group.add(matrix);

    const label = createAnnotation('Attention A_ij', '#22d3ee');
    label.position.set(0, size * spacing / 2 + 0.5, 0);
    group.add(label);

    group.userData = { type: 'attentionMatrix', instancedMesh: matrix };
    return group;
}

function createGhostFrames(majorR) {
    const group = new THREE.Group();
    const ghostCount = 20;
    const ghostMaterial = new THREE.MeshBasicMaterial({
        color: 0x8888ff,
        transparent: true,
        opacity: 0.15,
    });

    for (let i = 0; i < ghostCount; i++) {
        const ghost = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 8, 8),
            ghostMaterial.clone()
        );
        // Position near the Attend sector
        const angle = Math.PI * 2 / 3 + Math.random() * Math.PI * 2 / 3;
        const r = majorR + 2 + Math.random() * 3;
        ghost.position.set(
            Math.cos(angle) * r,
            (Math.random() - 0.5) * 4,
            Math.sin(angle) * r
        );
        ghost.userData = { type: 'ghost', baseOpacity: 0.1 + Math.random() * 0.15, pulseOffset: Math.random() * Math.PI * 2 };
        group.add(ghost);
    }

    const label = createAnnotation('~1000 Ghost R₀ Gists', '#8888ff');
    label.position.set(-majorR - 3, 3, majorR * 0.3);
    group.add(label);

    return group;
}

function createConvergenceMeters(majorR) {
    const group = new THREE.Group();

    for (let i = 0; i < 16; i++) {
        // Position in Refine sector (240-360 degrees)
        const angle = Math.PI * 4 / 3 + (i / 16) * (Math.PI * 2 / 3) + Math.PI / 16;
        const x = Math.cos(angle) * (majorR * 0.7);
        const z = Math.sin(angle) * (majorR * 0.7);

        const meterGroup = new THREE.Group();

        // Background bar
        const bgBar = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 2, 0.2),
            new THREE.MeshBasicMaterial({ color: 0x1a1a2e, transparent: true, opacity: 0.5 })
        );
        meterGroup.add(bgBar);

        // Fill bar (height represents convergence progress)
        const fillHeight = Math.random() * 2;
        const converged = fillHeight > 1.6;
        const fillMaterial = createGlowMaterial(
            converged ? 0x10b981 : 0x3b82f6,
            converged ? 0.6 : 0.3,
            0.8
        );
        const fillBar = new THREE.Mesh(
            new THREE.BoxGeometry(0.18, fillHeight, 0.18),
            fillMaterial
        );
        fillBar.position.y = (fillHeight - 2) / 2;
        meterGroup.add(fillBar);

        meterGroup.position.set(x, 0, z);
        meterGroup.lookAt(0, 0, 0);
        meterGroup.userData = { type: 'convergenceMeter', slot: i, converged: converged };
        group.add(meterGroup);
    }

    return group;
}

function createEnergyLandscape() {
    const group = new THREE.Group();

    const size = 20;
    const segments = 40;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI / 2);

    // Vertex displacement for energy surface
    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);

    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);

        // Procedural energy function with attractor basins
        let energy = 0;
        energy += 2 * Math.sin(x * 0.3) * Math.cos(z * 0.4);
        energy += 1.5 * Math.cos(x * 0.5 + z * 0.3);
        // Two deep attractor basins
        energy -= 3 * Math.exp(-((x + 5) ** 2 + (z + 3) ** 2) / 8);
        energy -= 2.5 * Math.exp(-((x - 4) ** 2 + (z - 5) ** 2) / 6);

        positions.setY(i, energy * 0.5);

        // Color: blue (low energy) to red (high energy)
        const normalizedEnergy = (energy + 4) / 8; // roughly 0-1
        const h = (1 - Math.max(0, Math.min(1, normalizedEnergy))) * 0.6; // 0.6 (blue) to 0 (red)
        const color = new THREE.Color().setHSL(h, 0.7, 0.3 + normalizedEnergy * 0.2);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
        wireframe: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    // Wireframe overlay
    const wireMaterial = new THREE.MeshBasicMaterial({
        color: 0x3b82f6,
        wireframe: true,
        transparent: true,
        opacity: 0.08,
    });
    const wire = new THREE.Mesh(geometry.clone(), wireMaterial);
    wire.position.y = 0.01;
    group.add(wire);

    const label = createAnnotation('Energy Landscape E(x) — f_θ = -∇E', '#3b82f6');
    label.position.set(0, -3, 0);
    group.add(label);

    return group;
}

// Animation update (called each frame)
export function updateGPUSoftCore(group, elapsed) {
    // Pulse ghost frames
    group.traverse((child) => {
        if (child.userData && child.userData.type === 'ghost') {
            const pulse = Math.sin(elapsed * 2 + child.userData.pulseOffset) * 0.5 + 0.5;
            child.material.opacity = child.userData.baseOpacity * (0.5 + pulse * 0.5);
        }
    });
}
