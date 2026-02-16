import * as THREE from 'three';
import { COLORS, LAYOUT } from '../config.js';
import { createGlowMaterial } from '../utils/MeshFactory.js';
import { createLayerLabel, createAnnotation } from '../utils/TextLabel.js';

export function createUITestBench(scene) {
    const group = new THREE.Group();
    const y = LAYOUT.uiTestBench.y;
    group.position.set(0, y, 0);
    group.userData = { type: 'uiTestBench', name: 'UI / Test Bench' };

    // n8n workflow: 4 connected nodes
    const nodes = [
        { name: 'Chat Trigger', x: -9, color: 0x94a3b8 },
        { name: 'HTTP Request', x: -3, color: 0x60a5fa },
        { name: 'Switch', x: 3, color: 0xfbbf24 },
        { name: 'Reply', x: 9, color: 0x10b981 },
    ];

    const nodeWidth = 4;
    const nodeHeight = 2;
    const nodeDepth = 0.3;

    for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        // Node box (rounded look via standard box)
        const nodeBox = new THREE.Mesh(
            new THREE.BoxGeometry(nodeWidth, nodeHeight, nodeDepth),
            new THREE.MeshStandardMaterial({
                color: 0x1e293b,
                metalness: 0.1,
                roughness: 0.8,
            })
        );
        nodeBox.position.set(n.x, 0, 0);
        group.add(nodeBox);

        // Top accent bar
        const accent = new THREE.Mesh(
            new THREE.BoxGeometry(nodeWidth, 0.15, nodeDepth + 0.01),
            createGlowMaterial(n.color, 0.4, 0.8)
        );
        accent.position.set(n.x, nodeHeight / 2 - 0.07, 0);
        group.add(accent);

        // Node label
        const label = createAnnotation(n.name, `#${n.color.toString(16).padStart(6, '0')}`);
        label.position.set(n.x, 0, 0.5);
        group.add(label);

        // Connection wire to next node
        if (i < nodes.length - 1) {
            const next = nodes[i + 1];
            const wirePoints = [
                new THREE.Vector3(n.x + nodeWidth / 2, 0, 0),
                new THREE.Vector3((n.x + next.x) / 2, 0, 0),
                new THREE.Vector3(next.x - nodeWidth / 2, 0, 0),
            ];
            const wireCurve = new THREE.CatmullRomCurve3(wirePoints);
            const wireGeometry = new THREE.BufferGeometry().setFromPoints(wireCurve.getPoints(20));
            const wireMaterial = new THREE.LineBasicMaterial({
                color: 0x475569,
                transparent: true,
                opacity: 0.5,
            });
            group.add(new THREE.Line(wireGeometry, wireMaterial));
        }
    }

    // Debug panel (side box)
    const debugPanel = new THREE.Mesh(
        new THREE.BoxGeometry(6, 4, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.1, roughness: 0.9 })
    );
    debugPanel.position.set(0, 0, 5);
    group.add(debugPanel);

    const debugAccent = new THREE.Mesh(
        new THREE.BoxGeometry(6, 0.1, 0.21),
        createGlowMaterial(0x22d3ee, 0.3, 0.7)
    );
    debugAccent.position.set(0, 2, 5);
    group.add(debugAccent);

    const debugLabel = createAnnotation('Debug Panel: slots, timing, gamma, proofs', '#22d3ee');
    debugLabel.position.set(0, 2.5, 5.5);
    group.add(debugLabel);

    // Path annotation
    const pathLabel = createAnnotation('localhost:8080/api/think', '#64748b');
    pathLabel.position.set(-3, -1.5, 0);
    group.add(pathLabel);

    // Main label
    const mainLabel = createLayerLabel('Layer 9: UI / Test Bench (n8n)', '#e2e8f0');
    mainLabel.position.set(0, 4, 0);
    group.add(mainLabel);

    scene.add(group);
    return group;
}
