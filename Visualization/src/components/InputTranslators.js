import * as THREE from 'three';
import { COLORS, LAYOUT, SIZES } from '../config.js';
import { createGlowMaterial, createGlassMaterial, createWireframeMaterial, createFunnel } from '../utils/MeshFactory.js';
import { createLayerLabel, createAnnotation } from '../utils/TextLabel.js';

export function createInputTranslators(scene) {
    const group = new THREE.Group();
    const y = LAYOUT.inputTranslators.y;
    group.position.set(0, y, 0);
    group.userData = { type: 'inputTranslators', name: 'Input Translators' };

    // === TEXT TRANSLATOR (center, largest) ===
    const textTranslator = createTextTranslator();
    textTranslator.position.set(0, 0, 0);
    group.add(textTranslator);

    // === COMMUNITY TRANSLATORS (flanking) ===
    const communityIcons = [
        { name: 'Vision', x: -10, color: 0x60a5fa },
        { name: 'Audio', x: -6, color: 0xa78bfa },
        { name: 'Data', x: 6, color: 0x34d399 },
        { name: 'Sensor', x: 10, color: 0xfbbf24 },
        { name: 'OS', x: 14, color: 0xf87171 },
    ];

    for (const ct of communityIcons) {
        const funnel = createCommunityTranslator(ct.name, ct.color);
        funnel.position.set(ct.x, 0, 0);
        group.add(funnel);
    }

    // Layer label
    const label = createLayerLabel('Layer 1: Input Translators', '#22d3ee');
    label.position.set(0, 10, 0);
    group.add(label);

    scene.add(group);
    return group;
}

function createTextTranslator() {
    const group = new THREE.Group();

    // Top section: Frozen LLM backbone (wireframe sphere lattice)
    const llmGroup = new THREE.Group();
    const llmGeometry = new THREE.IcosahedronGeometry(2.5, 1);
    const llmMaterial = createWireframeMaterial(COLORS.inputTranslators, 0.4);
    const llm = new THREE.Mesh(llmGeometry, llmMaterial);
    llmGroup.add(llm);

    // Inner nodes (visible through wireframe)
    const nodeGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const nodeMaterial = createGlowMaterial(COLORS.inputTranslators, 0.5, 0.8);
    const vertices = llmGeometry.attributes.position;
    for (let i = 0; i < vertices.count; i += 3) {
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        node.position.set(vertices.getX(i), vertices.getY(i), vertices.getZ(i));
        llmGroup.add(node);
    }

    // Lock icon (simple mesh representation)
    const lockBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.6, 0.3),
        createGlowMaterial(0x64748b, 0.3)
    );
    lockBody.position.set(3.5, 0, 0);
    llmGroup.add(lockBody);

    llmGroup.position.y = 3.5;
    group.add(llmGroup);

    const llmLabel = createAnnotation('Frozen LLM (~1-7B)', '#22d3ee');
    llmLabel.position.set(0, 6.5, 0);
    group.add(llmLabel);

    // Middle section: Frame Projection Head (narrowing cone with disc layers)
    const coneGeometry = new THREE.CylinderGeometry(2, 1, 4, 16, 1, true);
    const coneMaterial = createGlassMaterial(COLORS.inputTranslators, 0.15);
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.y = 0;
    group.add(cone);

    // Three disc layers inside the cone
    for (let i = 0; i < 3; i++) {
        const t = (i + 1) / 4;
        const discRadius = 2 - t * 1;
        const disc = new THREE.Mesh(
            new THREE.CircleGeometry(discRadius, 16),
            createGlowMaterial(COLORS.inputTranslators, 0.2, 0.5)
        );
        disc.rotation.x = -Math.PI / 2;
        disc.position.y = 1.5 - i * 1.2;
        group.add(disc);
    }

    const headLabel = createAnnotation('Trainable ~50M', '#22d3ee');
    headLabel.position.set(4, 0, 0);
    group.add(headLabel);

    // Bottom section: Slot-sorting output channels
    const channelGroup = new THREE.Group();
    const channelMaterial = createGlowMaterial(COLORS.inputTranslators, 0.3, 0.6);
    for (let i = 0; i < 16; i++) {
        const x = (i - 7.5) * 0.3;
        const channel = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 2, 0.2),
            channelMaterial
        );
        channel.position.set(x, -3.5, 0);
        channelGroup.add(channel);
    }
    group.add(channelGroup);

    const sortLabel = createAnnotation('16 Slot Channels → VQ-VAE Quantize', '#22d3ee');
    sortLabel.position.set(0, -5, 0);
    group.add(sortLabel);

    return group;
}

function createCommunityTranslator(name, color) {
    const group = new THREE.Group();

    // Smaller funnel shape
    const funnelGeometry = new THREE.CylinderGeometry(1.2, 0.6, 4.5, 12, 1, true);
    const funnelMaterial = createGlassMaterial(color, 0.15);
    const funnel = new THREE.Mesh(funnelGeometry, funnelMaterial);
    group.add(funnel);

    // Icon sphere at top
    const icon = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 12, 12),
        createGlowMaterial(color, 0.5, 0.8)
    );
    icon.position.y = 3;
    group.add(icon);

    // Label
    const label = createAnnotation(name, `#${color.toString(16).padStart(6, '0')}`);
    label.position.set(0, 4, 0);
    group.add(label);

    return group;
}
