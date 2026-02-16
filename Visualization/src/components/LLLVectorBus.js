import * as THREE from 'three';
import { COLORS, LAYOUT, SIZES, ANIM } from '../config.js';
import { createGlassMaterial, createGlowMaterial, createTube, createHelicalCurve } from '../utils/MeshFactory.js';
import { createLayerLabel, createAnnotation } from '../utils/TextLabel.js';

export function createLLLVectorBus(scene) {
    const group = new THREE.Group();
    group.userData = { type: 'lllBus', name: 'LLL Vector Bus' };

    const top = LAYOUT.lllBusTop.y;
    const bottom = LAYOUT.lllBusBottom.y;
    const height = top - bottom;
    const centerY = (top + bottom) / 2;
    const radius = LAYOUT.busRadius;

    // Main translucent cylinder (spine)
    const spineGeometry = new THREE.CylinderGeometry(radius, radius, height, 32, 1, true);
    const spineMaterial = createGlassMaterial(COLORS.lllBus, 0.12);
    const spine = new THREE.Mesh(spineGeometry, spineMaterial);
    spine.position.y = centerY;
    group.add(spine);

    // Four HDC helical strands inside
    const helixColors = [COLORS.hdcBind, COLORS.hdcSuperpose, COLORS.hdcPermute, COLORS.hdcUnbind];
    const helixNames = ['Bind (FFT)', 'Superpose (+)', 'Permute (ρ)', 'Unbind (⊗⁻¹)'];
    const helixRadius = radius * 0.5;

    for (let i = 0; i < 4; i++) {
        const phaseOffset = (i / 4) * Math.PI * 2;
        const points = [];
        const turns = 12;
        const pointsPerTurn = 32;
        const totalPoints = turns * pointsPerTurn;

        for (let j = 0; j <= totalPoints; j++) {
            const t = j / totalPoints;
            const angle = t * turns * Math.PI * 2 + phaseOffset;
            points.push(new THREE.Vector3(
                Math.cos(angle) * helixRadius,
                bottom + t * height,
                Math.sin(angle) * helixRadius
            ));
        }

        const curve = new THREE.CatmullRomCurve3(points);
        const helixMaterial = createGlowMaterial(helixColors[i], 0.4, 0.7);
        const helix = createTube(curve, 0.08, helixMaterial, 200, 4);
        helix.userData = { type: 'hdcHelix', operation: helixNames[i] };
        group.add(helix);
    }

    // Branch conduits to layers (simplified — short horizontal tubes)
    const branchLayers = [
        { y: LAYOUT.inputTranslators.y, label: 'Input' },
        { y: LAYOUT.gpuSoftCore.y, label: 'GPU' },
        { y: LAYOUT.cpuHardCore.y, label: 'CPU' },
        { y: LAYOUT.voltDB.y, label: 'VoltDB' },
        { y: LAYOUT.outputCores.y, label: 'Output' },
    ];

    const branchMaterial = createGlowMaterial(COLORS.lllBus, 0.3, 0.5);
    for (const branch of branchLayers) {
        // Two branches per layer (left and right)
        for (const side of [-1, 1]) {
            const branchPoints = [
                new THREE.Vector3(0, branch.y, 0),
                new THREE.Vector3(side * 8, branch.y, 0),
            ];
            const branchCurve = new THREE.CatmullRomCurve3(branchPoints);
            const branchTube = createTube(branchCurve, LAYOUT.busBranchRadius, branchMaterial, 8, 4);
            group.add(branchTube);
        }
    }

    // Codebook disc at the base
    const codebookGroup = createCodebookDisc();
    codebookGroup.position.y = bottom - 3;
    group.add(codebookGroup);

    // Label
    const label = createLayerLabel('Layer 2: LLL Vector Bus', '#f59e0b');
    label.position.set(4, centerY + 10, 0);
    group.add(label);

    // Helix legend annotations
    const legendY = top + 2;
    for (let i = 0; i < 4; i++) {
        const ann = createAnnotation(helixNames[i], `#${helixColors[i].toString(16).padStart(6, '0')}`);
        ann.position.set(5, legendY - i * 1.2, 0);
        group.add(ann);
    }

    scene.add(group);
    return group;
}

function createCodebookDisc() {
    const group = new THREE.Group();

    // Visualize codebook as a flat disc of points
    // 65,536 entries but show ~4096 for performance (LOD will show more when close)
    const displayCount = 4096;
    const positions = new Float32Array(displayCount * 3);
    const colors = new Float32Array(displayCount * 3);

    for (let i = 0; i < displayCount; i++) {
        // Arrange in a spiral disc pattern
        const t = i / displayCount;
        const angle = t * Math.PI * 2 * 64; // 64 spiral arms
        const r = Math.sqrt(t) * 6; // sqrt for uniform density
        positions[i * 3] = Math.cos(angle) * r;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = Math.sin(angle) * r;

        // Color: golden with variation
        colors[i * 3] = 0.9 + Math.random() * 0.1;
        colors[i * 3 + 1] = 0.6 + Math.random() * 0.2;
        colors[i * 3 + 2] = 0.1 + Math.random() * 0.1;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    group.add(points);

    // Label
    const label = createAnnotation('VQ-VAE Codebook: 65,536 × 256-dim', '#f59e0b');
    label.position.set(0, -1, 0);
    group.add(label);

    return group;
}

// Animate helix particles (called each frame)
export function updateBusAnimation(busGroup, elapsed) {
    // Rotate the codebook disc slowly
    const codebook = busGroup.children.find(c => c.type === 'Group' && c.children.some(ch => ch.type === 'Points'));
    if (codebook) {
        codebook.rotation.y = elapsed * 0.05;
    }
}
