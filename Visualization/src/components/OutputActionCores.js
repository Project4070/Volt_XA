import * as THREE from 'three';
import { COLORS, LAYOUT, SIZES } from '../config.js';
import { createGlowMaterial, createGlassMaterial } from '../utils/MeshFactory.js';
import { createLayerLabel, createAnnotation } from '../utils/TextLabel.js';

export function createOutputActionCores(scene) {
    const group = new THREE.Group();
    const y = LAYOUT.outputCores.y;
    group.position.set(0, y, 0);
    group.userData = { type: 'outputCores', name: 'Output Action Cores' };

    const cores = [
        { name: 'Text', color: 0x10b981, x: -8 },
        { name: 'Speech', color: 0x34d399, x: -4.8 },
        { name: 'Image', color: 0x6ee7b7, x: -1.6 },
        { name: 'Motor', color: 0xa7f3d0, x: 1.6 },
        { name: 'n8n', color: 0xd1fae5, x: 4.8 },
        { name: 'Ledger', color: 0x059669, x: 8 },
    ];

    const pipeRadius = SIZES.outputPipeRadius;
    const pipeHeight = SIZES.outputPipeHeight;

    for (const core of cores) {
        const pipeGroup = new THREE.Group();

        // Main pipe cylinder
        const pipe = new THREE.Mesh(
            new THREE.CylinderGeometry(pipeRadius, pipeRadius * 0.7, pipeHeight, 16, 1, true),
            createGlassMaterial(core.color, 0.2)
        );
        pipeGroup.add(pipe);

        // Top cap (input)
        const topCap = new THREE.Mesh(
            new THREE.CircleGeometry(pipeRadius, 16),
            createGlowMaterial(core.color, 0.3, 0.5)
        );
        topCap.rotation.x = -Math.PI / 2;
        topCap.position.y = pipeHeight / 2;
        pipeGroup.add(topCap);

        // Bottom emission glow
        const bottomGlow = new THREE.Mesh(
            new THREE.CircleGeometry(pipeRadius * 0.7, 16),
            createGlowMaterial(core.color, 0.5, 0.7)
        );
        bottomGlow.rotation.x = Math.PI / 2;
        bottomGlow.position.y = -pipeHeight / 2;
        pipeGroup.add(bottomGlow);

        // Label
        const label = createAnnotation(core.name, `#${core.color.toString(16).padStart(6, '0')}`);
        label.position.set(0, pipeHeight / 2 + 1, 0);
        pipeGroup.add(label);

        pipeGroup.position.set(core.x, 0, 0);
        group.add(pipeGroup);
    }

    // Main label
    const mainLabel = createLayerLabel('Layer 6: Output Action Cores', '#10b981');
    mainLabel.position.set(0, 7, 0);
    group.add(mainLabel);

    const note = createAnnotation('All 16 slots decode simultaneously — parallel, not sequential', '#64748b');
    note.position.set(0, 6, 0);
    group.add(note);

    scene.add(group);
    return group;
}
