import * as THREE from 'three';
import { COLORS, LAYOUT, SIZES } from '../config.js';
import { createGlowMaterial, createGlassMaterial, createMetallicMaterial } from '../utils/MeshFactory.js';
import { createLayerLabel, createAnnotation } from '../utils/TextLabel.js';

export function createVoltDB(scene) {
    const group = new THREE.Group();
    const y = LAYOUT.voltDB.y;
    group.position.set(0, y, 0);
    group.userData = { type: 'voltDB', name: 'VoltDB — Memory Engine' };

    const tierGap = SIZES.voltdbTierGap;

    // === TIER 0: GPU VRAM (top, smallest) ===
    const t0 = createTier0();
    t0.position.y = tierGap;
    group.add(t0);

    // === TIER 1: System RAM (middle) ===
    const t1 = createTier1();
    t1.position.y = 0;
    group.add(t1);

    // === TIER 2: RAM + NVMe (bottom, largest) ===
    const t2 = createTier2();
    t2.position.y = -tierGap;
    group.add(t2);

    // === TRANSFER CONDUITS between tiers ===
    const conduitGroup = createTransferConduits(tierGap);
    group.add(conduitGroup);

    // === LABELS ===
    const mainLabel = createLayerLabel('Layer 5: VoltDB — Three-Tier Memory', '#ec4899');
    mainLabel.position.set(0, tierGap + 5, 0);
    group.add(mainLabel);

    scene.add(group);
    return group;
}

function createTier0() {
    const group = new THREE.Group();
    const w = SIZES.voltdbT0Width;

    // Platform
    const platform = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.3, w * 0.8),
        createGlowMaterial(COLORS.voltDB, 0.15, 0.5)
    );
    group.add(platform);

    // Ring buffer: 64 frame slots in a circle
    const ringRadius = w * 0.35;
    const slotCount = 64;
    const slotGeometry = new THREE.BoxGeometry(0.2, 0.4, 0.2);
    const slotMesh = new THREE.InstancedMesh(slotGeometry, createGlowMaterial(COLORS.voltDB, 0.3, 0.7), slotCount);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < slotCount; i++) {
        const angle = (i / slotCount) * Math.PI * 2;
        dummy.position.set(
            Math.cos(angle) * ringRadius,
            0.4,
            Math.sin(angle) * ringRadius
        );
        dummy.updateMatrix();
        slotMesh.setMatrixAt(i, dummy.matrix);

        // Color based on "activity" (brighter = more active)
        const activity = Math.random();
        const color = new THREE.Color();
        color.setHSL(0.9, 0.6, 0.2 + activity * 0.4);
        slotMesh.setColorAt(i, color);
    }
    slotMesh.instanceColor.needsUpdate = true;
    group.add(slotMesh);

    // Ghost bleed buffer (hazy cloud above)
    const ghostPositions = new Float32Array(60 * 3);
    for (let i = 0; i < 60; i++) {
        ghostPositions[i * 3] = (Math.random() - 0.5) * w * 0.6;
        ghostPositions[i * 3 + 1] = 1.5 + Math.random() * 2;
        ghostPositions[i * 3 + 2] = (Math.random() - 0.5) * w * 0.5;
    }
    const ghostGeometry = new THREE.BufferGeometry();
    ghostGeometry.setAttribute('position', new THREE.BufferAttribute(ghostPositions, 3));
    const ghostPoints = new THREE.Points(ghostGeometry, new THREE.PointsMaterial({
        color: 0x8888ff,
        size: 0.15,
        transparent: true,
        opacity: 0.3,
        sizeAttenuation: true,
    }));
    group.add(ghostPoints);

    const label = createAnnotation('T0: VRAM — 64 Frames + Ghost Buffer', '#ec4899');
    label.position.set(0, 4, 0);
    group.add(label);

    return group;
}

function createTier1() {
    const group = new THREE.Group();
    const w = SIZES.voltdbT1Width;

    // Platform
    const platform = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.3, w * 0.7),
        createGlowMaterial(COLORS.voltDB, 0.1, 0.4)
    );
    group.add(platform);

    // LSM-Tree visualization: memtable + sorted runs
    const lsmGroup = new THREE.Group();

    // Memtable (active, bright)
    const memtable = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.4, 2),
        createGlowMaterial(COLORS.voltDB, 0.5, 0.8)
    );
    memtable.position.set(-6, 0.5, 0);
    lsmGroup.add(memtable);

    const mtLabel = createAnnotation('Memtable', '#ec4899');
    mtLabel.position.set(-6, 1.2, 0);
    lsmGroup.add(mtLabel);

    // Sorted runs (stacked, progressively dimmer)
    for (let i = 0; i < 4; i++) {
        const run = new THREE.Mesh(
            new THREE.BoxGeometry(5 + i * 1.5, 0.25, 2),
            createGlowMaterial(COLORS.voltDB, 0.15 - i * 0.03, 0.5 - i * 0.1)
        );
        run.position.set(-6, 0.5 - (i + 1) * 0.35, 0);
        lsmGroup.add(run);
    }

    lsmGroup.position.set(0, 0.3, -2);
    group.add(lsmGroup);

    // HNSW graph (small sphere + edge network)
    const hnswGroup = createHNSWGraph();
    hnswGroup.position.set(4, 1.5, 2);
    hnswGroup.scale.setScalar(0.6);
    group.add(hnswGroup);

    // Strand regions (colored zones on the platform)
    const strandColors = [0x3b82f6, 0x10b981, 0xf59e0b, 0xec4899];
    const strandNames = ['Coding', 'Personal', 'Science', 'Creative'];
    for (let i = 0; i < 4; i++) {
        const region = new THREE.Mesh(
            new THREE.BoxGeometry(3, 0.05, 2.5),
            createGlowMaterial(strandColors[i], 0.2, 0.3)
        );
        region.position.set(-5.5 + i * 4, 0.2, 4);
        group.add(region);

        const rLabel = createAnnotation(strandNames[i], `#${strandColors[i].toString(16).padStart(6, '0')}`);
        rLabel.position.set(-5.5 + i * 4, 0.6, 4);
        group.add(rLabel);
    }

    const label = createAnnotation('T1: RAM — ~500K Frames, LSM-Tree + HNSW', '#ec4899');
    label.position.set(0, 3.5, 0);
    group.add(label);

    return group;
}

function createHNSWGraph() {
    const group = new THREE.Group();
    const nodeCount = 30;
    const positions = [];
    const nodeMaterial = createGlowMaterial(COLORS.voltDB, 0.4, 0.7);

    // Random node positions in a sphere
    for (let i = 0; i < nodeCount; i++) {
        const pos = new THREE.Vector3(
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 6
        );
        positions.push(pos);

        const node = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 6, 6),
            nodeMaterial
        );
        node.position.copy(pos);
        group.add(node);
    }

    // Connect nearby nodes with edges
    const edgeMaterial = new THREE.LineBasicMaterial({
        color: COLORS.voltDB,
        transparent: true,
        opacity: 0.15,
    });

    for (let i = 0; i < nodeCount; i++) {
        // Connect to 2-3 nearest neighbors
        const distances = positions.map((p, j) => ({ j, dist: positions[i].distanceTo(p) }))
            .filter(d => d.j !== i)
            .sort((a, b) => a.dist - b.dist);

        for (let k = 0; k < Math.min(3, distances.length); k++) {
            const edgeGeometry = new THREE.BufferGeometry().setFromPoints([
                positions[i], positions[distances[k].j]
            ]);
            group.add(new THREE.Line(edgeGeometry, edgeMaterial));
        }
    }

    const label = createAnnotation('HNSW Index', '#ec4899');
    label.position.set(0, 3, 0);
    group.add(label);

    return group;
}

function createTier2() {
    const group = new THREE.Group();
    const w = SIZES.voltdbT2Width;

    // Platform
    const platform = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.3, w * 0.6),
        new THREE.MeshStandardMaterial({
            color: 0x1a0020,
            metalness: 0.2,
            roughness: 0.8,
        })
    );
    group.add(platform);

    // Compressed archive blocks
    const blockMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a0030,
        metalness: 0.1,
        roughness: 0.9,
        transparent: true,
        opacity: 0.6,
    });

    for (let i = 0; i < 7; i++) {
        const h = 0.8 + Math.random() * 0.8;
        const block = new THREE.Mesh(
            new THREE.BoxGeometry(2, h, 1.5),
            blockMaterial
        );
        block.position.set(
            -8 + i * 2.8,
            0.5 + h / 2,
            -3
        );
        group.add(block);
    }

    // GC Conveyor belt
    const gcGroup = createGCConveyor();
    gcGroup.position.set(0, 0.5, 5);
    group.add(gcGroup);

    const label = createAnnotation('T2: NVMe — Millions Compressed, rkyv Zero-Copy', '#ec4899');
    label.position.set(0, 3, 0);
    group.add(label);

    return group;
}

function createGCConveyor() {
    const group = new THREE.Group();

    // Conveyor belt (thin long box)
    const belt = new THREE.Mesh(
        new THREE.BoxGeometry(14, 0.1, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x1a1a2e, metalness: 0.3, roughness: 0.7 })
    );
    group.add(belt);

    // GC stages: Full → Compressed → Gist → Tombstone
    const stages = [
        { name: 'Full\n64KB', size: 0.8, color: 0xec4899, emissive: 0.5, x: -5 },
        { name: 'Compressed\n8KB', size: 0.5, color: 0xec4899, emissive: 0.3, x: -1.5 },
        { name: 'Gist\n1KB', size: 0.25, color: 0xec4899, emissive: 0.15, x: 1.5 },
        { name: 'Tombstone\n32B', size: 0.1, color: 0x64748b, emissive: 0.05, x: 5 },
    ];

    for (const stage of stages) {
        const cube = new THREE.Mesh(
            new THREE.BoxGeometry(stage.size, stage.size, stage.size),
            createGlowMaterial(stage.color, stage.emissive, 0.8)
        );
        cube.position.set(stage.x, stage.size / 2 + 0.1, 0);
        group.add(cube);

        const label = createAnnotation(stage.name, '#94a3b8');
        label.position.set(stage.x, stage.size + 0.8, 0);
        group.add(label);
    }

    // Arrows between stages
    const arrowMaterial = new THREE.LineBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.3 });
    for (let i = 0; i < stages.length - 1; i++) {
        const from = stages[i];
        const to = stages[i + 1];
        const arrow = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(from.x + 1.2, 0.4, 0),
            new THREE.Vector3(to.x - 1.2, 0.4, 0),
        ]);
        group.add(new THREE.Line(arrow, arrowMaterial));
    }

    const label = createAnnotation('GC Pipeline: Retention Score Decay', '#64748b');
    label.position.set(0, -0.8, 0);
    group.add(label);

    return group;
}

function createTransferConduits(tierGap) {
    const group = new THREE.Group();

    const conduits = [
        { from: tierGap, to: 0, label: 'Prefetch T1→T0 (~2ms)', x: -4, color: 0xec4899 },
        { from: 0, to: tierGap, label: 'Consolidate T0→T1', x: -2, color: 0x94a3b8 },
        { from: -tierGap, to: 0, label: 'Recall T2→T0 (~10-50ms)', x: 2, color: 0xec4899 },
        { from: 0, to: -tierGap, label: 'Sleep Archive T1→T2', x: 4, color: 0x94a3b8 },
    ];

    for (const c of conduits) {
        const points = [
            new THREE.Vector3(c.x, c.from, 0),
            new THREE.Vector3(c.x, c.to, 0),
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: c.color,
            transparent: true,
            opacity: 0.3,
        });
        group.add(new THREE.Line(geometry, material));

        const labelY = (c.from + c.to) / 2;
        const label = createAnnotation(c.label, '#94a3b8');
        label.position.set(c.x + 3, labelY, 0);
        group.add(label);
    }

    return group;
}
