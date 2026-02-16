import * as THREE from 'three';
import { COLORS, LAYOUT, SIZES } from '../config.js';
import { createGlowMaterial, createMetallicMaterial, createGlassMaterial } from '../utils/MeshFactory.js';
import { createLayerLabel, createAnnotation } from '../utils/TextLabel.js';

export function createCPUHardCore(scene) {
    const group = new THREE.Group();
    const y = LAYOUT.cpuHardCore.y;
    group.position.set(0, y, 0);
    group.userData = { type: 'cpuHardCore', name: 'CPU Hard Core' };

    const w = SIZES.motherboardWidth;
    const d = SIZES.motherboardDepth;
    const h = SIZES.motherboardHeight;

    // === MOTHERBOARD PLATFORM ===
    const boardMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1500,
        metalness: 0.4,
        roughness: 0.7,
    });
    const board = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), boardMaterial);
    group.add(board);

    // Circuit traces on the board surface
    const traceGroup = createCircuitTraces(w, d, h);
    group.add(traceGroup);

    // === INTENT ROUTER (center hub) ===
    const routerGroup = createIntentRouter();
    routerGroup.position.y = h / 2 + 0.5;
    group.add(routerGroup);

    // === 10 HARD STRAND CHIPS ===
    const strands = [
        { name: 'MathEngine', color: 0x60a5fa, x: -8, z: -5 },
        { name: 'CodeRunner', color: 0xa78bfa, x: -5, z: -6.5 },
        { name: 'APIDispatch', color: 0x34d399, x: -1.5, z: -7 },
        { name: 'HDCAlgebra', color: 0xfbbf24, x: 2, z: -7 },
        { name: 'CertaintyEngine', color: 0xf472b6, x: 5.5, z: -6.5 },
        { name: 'ProofConstructor', color: 0x818cf8, x: 8, z: -5 },
        { name: 'CausalSimulator', color: 0x2dd4bf, x: 9, z: -2 },
        { name: 'LedgerStrand', color: 0xfb923c, x: 8, z: 1.5 },
        { name: 'SleepLearner', color: 0x94a3b8, x: 5.5, z: 4 },
        { name: 'MirrorModule', color: 0xc084fc, x: 2, z: 5 },
    ];

    for (const strand of strands) {
        const chip = createStrandChip(strand.name, strand.color);
        chip.position.set(strand.x, h / 2 + 0.3, strand.z);
        group.add(chip);

        // Spoke from router to chip
        const spokePoints = [
            new THREE.Vector3(0, h / 2 + 0.5, 0),
            new THREE.Vector3(strand.x, h / 2 + 0.5, strand.z),
        ];
        const spokeGeometry = new THREE.BufferGeometry().setFromPoints(spokePoints);
        const spokeMaterial = new THREE.LineBasicMaterial({
            color: COLORS.cpuHardCore,
            transparent: true,
            opacity: 0.2,
        });
        group.add(new THREE.Line(spokeGeometry, spokeMaterial));
    }

    // === SAFETY LAYER (perimeter) ===
    const safetyGroup = createSafetyLayer(w, d, h);
    group.add(safetyGroup);

    // === LABELS ===
    const mainLabel = createLayerLabel('Layer 4: CPU Hard Core', '#f59e0b');
    mainLabel.position.set(0, 6, 0);
    group.add(mainLabel);

    const sysLabel = createAnnotation('System 2: Sequential, Logical, Deterministic', '#64748b');
    sysLabel.position.set(0, 5, 0);
    group.add(sysLabel);

    scene.add(group);
    return group;
}

function createCircuitTraces(w, d, h) {
    const group = new THREE.Group();
    const traceMaterial = new THREE.LineBasicMaterial({
        color: COLORS.cpuHardCore,
        transparent: true,
        opacity: 0.15,
    });

    // Generate grid-like circuit traces
    const traceCount = 20;
    for (let i = 0; i < traceCount; i++) {
        const points = [];
        let x = (Math.random() - 0.5) * w * 0.8;
        let z = (Math.random() - 0.5) * d * 0.8;

        points.push(new THREE.Vector3(x, h / 2 + 0.02, z));

        for (let seg = 0; seg < 3 + Math.floor(Math.random() * 4); seg++) {
            // Manhattan-style routing (axis-aligned segments)
            if (Math.random() > 0.5) {
                x += (Math.random() - 0.5) * 8;
            } else {
                z += (Math.random() - 0.5) * 6;
            }
            x = Math.max(-w / 2 + 1, Math.min(w / 2 - 1, x));
            z = Math.max(-d / 2 + 1, Math.min(d / 2 - 1, z));
            points.push(new THREE.Vector3(x, h / 2 + 0.02, z));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        group.add(new THREE.Line(geometry, traceMaterial));
    }

    return group;
}

function createIntentRouter() {
    const group = new THREE.Group();

    // Central hub disc
    const hubGeometry = new THREE.CylinderGeometry(2, 2, 0.5, 32);
    const hubMaterial = createGlowMaterial(COLORS.cpuHardCore, 0.4, 0.8);
    const hub = new THREE.Mesh(hubGeometry, hubMaterial);
    group.add(hub);

    // Concentric rings (cosine similarity visualization)
    for (let i = 1; i <= 3; i++) {
        const ringGeometry = new THREE.TorusGeometry(i * 1.2, 0.03, 8, 64);
        const ringMaterial = createGlowMaterial(COLORS.cpuHardCore, 0.2 / i, 0.4);
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.3;
        group.add(ring);
    }

    const label = createAnnotation('Intent Router', '#f59e0b');
    label.position.set(0, 1.5, 0);
    group.add(label);

    return group;
}

function createStrandChip(name, color) {
    const group = new THREE.Group();
    const size = SIZES.strandChipSize;

    // Chip body
    const chipGeometry = new THREE.BoxGeometry(size, 0.6, size * 0.8);
    const chipMaterial = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.3,
        roughness: 0.6,
    });
    const chip = new THREE.Mesh(chipGeometry, chipMaterial);
    group.add(chip);

    // Top indicator (colored dot)
    const indicator = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 8),
        createGlowMaterial(color, 0.5, 0.9)
    );
    indicator.position.y = 0.4;
    group.add(indicator);

    // Chip label
    const label = createAnnotation(name, `#${color.toString(16).padStart(6, '0')}`);
    label.position.set(0, 1.2, 0);
    group.add(label);

    group.userData = { type: 'hardStrand', name: name, color: color };
    return group;
}

function createSafetyLayer(w, d, h) {
    const group = new THREE.Group();

    // 5 red pillars at corners/edges (K1-K5 invariants)
    const invariants = [
        { name: 'K1: No harm', x: -w / 2 - 1, z: -d / 2 - 1 },
        { name: 'K2: No CSAM', x: w / 2 + 1, z: -d / 2 - 1 },
        { name: 'K3: No WMD', x: -w / 2 - 1, z: d / 2 + 1 },
        { name: 'K4: No fraud', x: w / 2 + 1, z: d / 2 + 1 },
        { name: 'K5: Acknowledge AI', x: 0, z: d / 2 + 2 },
    ];

    const pillarMaterial = createGlowMaterial(COLORS.safetyPillar, 0.3, 0.7);
    for (const inv of invariants) {
        const pillar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 4, 8),
            pillarMaterial
        );
        pillar.position.set(inv.x, h / 2 + 2, inv.z);
        group.add(pillar);

        // Lock icon on top
        const lock = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.4, 0.2),
            createGlowMaterial(COLORS.safetyPillar, 0.5)
        );
        lock.position.set(inv.x, h / 2 + 4.3, inv.z);
        group.add(lock);

        const label = createAnnotation(inv.name, '#ef4444');
        label.position.set(inv.x, h / 2 + 5.5, inv.z);
        group.add(label);
    }

    // Scanning beam (a thin rotating line)
    const beamGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, h / 2 + 0.5, 0),
        new THREE.Vector3(w / 2 + 1, h / 2 + 0.5, 0),
    ]);
    const beamMaterial = new THREE.LineBasicMaterial({
        color: COLORS.safetyPillar,
        transparent: true,
        opacity: 0.3,
    });
    const beam = new THREE.Line(beamGeometry, beamMaterial);
    beam.userData = { type: 'safetyBeam' };
    group.add(beam);

    // Omega Veto dome (dormant)
    const domeGeometry = new THREE.SphereGeometry(w / 2 + 2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMaterial = new THREE.MeshBasicMaterial({
        color: COLORS.omegaVetoDormant,
        transparent: true,
        opacity: 0.05,
        side: THREE.DoubleSide,
    });
    const dome = new THREE.Mesh(domeGeometry, domeMaterial);
    dome.position.y = h / 2;
    dome.userData = { type: 'omegaVeto' };
    group.add(dome);

    const domeLabel = createAnnotation('Omega Veto — Hardware Interrupt', '#ef4444');
    domeLabel.position.set(0, 9, 0);
    group.add(domeLabel);

    return group;
}

// Animation update
export function updateCPUHardCore(group, elapsed) {
    // Rotate safety scanning beam
    group.traverse((child) => {
        if (child.userData && child.userData.type === 'safetyBeam') {
            child.rotation.y = elapsed * 1.0;
        }
    });
}
