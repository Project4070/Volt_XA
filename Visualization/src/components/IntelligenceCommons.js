import * as THREE from 'three';
import { COLORS, LAYOUT, SIZES } from '../config.js';
import { createGlowMaterial } from '../utils/MeshFactory.js';
import { createLayerLabel, createAnnotation } from '../utils/TextLabel.js';

export function createIntelligenceCommons(scene) {
    const group = new THREE.Group();
    const y = LAYOUT.intelligenceCommons.y;
    group.position.set(0, y, 0);
    group.userData = { type: 'intelligenceCommons', name: 'Intelligence Commons' };

    const spread = SIZES.commonsSpread;
    const nodeRadius = SIZES.commonsNodeRadius;

    // === CENTRAL NODE (user's instance) ===
    const centralNode = new THREE.Mesh(
        new THREE.SphereGeometry(nodeRadius * 1.5, 16, 16),
        createGlowMaterial(COLORS.intelligenceCommons, 0.6, 0.9)
    );
    group.add(centralNode);

    const centralLabel = createAnnotation('Your Volt Instance', '#f97316');
    centralLabel.position.set(0, 3, 0);
    group.add(centralLabel);

    // Merkle tree icon (stacked small cubes)
    const merkleGroup = new THREE.Group();
    const merkleMat = createGlowMaterial(COLORS.intelligenceCommons, 0.3, 0.6);
    const merkleCube = new THREE.BoxGeometry(0.4, 0.4, 0.4);

    function addMerkleCube(x, y, z) {
        const m = new THREE.Mesh(merkleCube, merkleMat);
        m.position.set(x, y, z);
        merkleGroup.add(m);
    }

    // Root
    addMerkleCube(0, 1.2, 0);
    // Level 1
    addMerkleCube(-0.5, 0.6, 0);
    addMerkleCube(0.5, 0.6, 0);
    // Level 2
    for (let i = 0; i < 4; i++) {
        addMerkleCube(-0.75 + i * 0.5, 0, 0);
    }
    merkleGroup.position.set(-3, 0, 2);
    merkleGroup.scale.setScalar(0.7);
    group.add(merkleGroup);

    const merkleLabel = createAnnotation('Merkle Log', '#f97316');
    merkleLabel.position.set(-3, 1.5, 2);
    group.add(merkleLabel);

    // === PEER NODES (L1 P2P mesh) ===
    const peerCount = 12;
    const peers = [];
    const peerMaterial = createGlowMaterial(COLORS.intelligenceCommons, 0.3, 0.6);

    for (let i = 0; i < peerCount; i++) {
        const angle = (i / peerCount) * Math.PI * 2;
        const r = spread * 0.4 + Math.random() * spread * 0.2;
        const pos = new THREE.Vector3(
            Math.cos(angle) * r,
            (Math.random() - 0.5) * 3,
            Math.sin(angle) * r
        );
        peers.push(pos);

        const peer = new THREE.Mesh(
            new THREE.SphereGeometry(nodeRadius * 0.7, 8, 8),
            peerMaterial
        );
        peer.position.copy(pos);
        group.add(peer);
    }

    // Gossip connections (dashed lines)
    const lineMaterial = new THREE.LineDashedMaterial({
        color: COLORS.intelligenceCommons,
        transparent: true,
        opacity: 0.2,
        dashSize: 0.3,
        gapSize: 0.2,
    });

    // Connect central to all peers
    for (const peer of peers) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0), peer
        ]);
        const line = new THREE.Line(geometry, lineMaterial);
        line.computeLineDistances();
        group.add(line);
    }

    // Some peer-to-peer connections
    for (let i = 0; i < peerCount; i++) {
        const j = (i + 1) % peerCount;
        const geometry = new THREE.BufferGeometry().setFromPoints([peers[i], peers[j]]);
        const line = new THREE.Line(geometry, lineMaterial);
        line.computeLineDistances();
        group.add(line);
    }

    // === L2 SETTLEMENT (DAG beneath) ===
    const dagGroup = new THREE.Group();
    const dagMat = createGlowMaterial(0xfbbf24, 0.3, 0.6);
    const dagNodeGeo = new THREE.SphereGeometry(0.2, 6, 6);
    const dagPositions = [];

    for (let row = 0; row < 3; row++) {
        const count = 3 + row;
        for (let i = 0; i < count; i++) {
            const pos = new THREE.Vector3(
                (i - (count - 1) / 2) * 2,
                -3 - row * 1.2,
                0
            );
            dagPositions.push({ pos, row, idx: i });
            const dagNode = new THREE.Mesh(dagNodeGeo, dagMat);
            dagNode.position.copy(pos);
            dagGroup.add(dagNode);
        }
    }

    // DAG edges
    const dagLineMat = new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.15 });
    for (let i = 1; i < dagPositions.length; i++) {
        const parent = dagPositions[Math.floor(Math.random() * Math.max(1, i - 2))];
        const child = dagPositions[i];
        if (parent.row < child.row) {
            const geo = new THREE.BufferGeometry().setFromPoints([parent.pos, child.pos]);
            dagGroup.add(new THREE.Line(geo, dagLineMat));
        }
    }

    group.add(dagGroup);

    const dagLabel = createAnnotation('L2: DAG Settlement', '#fbbf24');
    dagLabel.position.set(0, -7, 0);
    group.add(dagLabel);

    // === LABELS ===
    const mainLabel = createLayerLabel('Layer 8: Intelligence Commons', '#f97316');
    mainLabel.position.set(0, 6, 0);
    group.add(mainLabel);

    const note = createAnnotation('L0 Local (Merkle) → L1 P2P (libp2p) → L2 Settlement (DAG)', '#64748b');
    note.position.set(0, 5, 0);
    group.add(note);

    scene.add(group);
    return group;
}
