import * as THREE from 'three';
import { COLORS, LAYOUT, SIZES, ANIM } from '../config.js';
import { createGlowMaterial } from '../utils/MeshFactory.js';
import { createLayerLabel, createAnnotation } from '../utils/TextLabel.js';

export function createContinualLearning(scene) {
    const group = new THREE.Group();
    const y = LAYOUT.continualLearning.y;
    group.position.set(0, y, 0);
    group.userData = { type: 'continualLearning', name: 'Continual Learning Engine' };

    const radii = SIZES.learningOrbitRadii;
    const timescales = [
        { name: 'Instant (ms)', radius: radii[0], color: 0x10b981, particles: 8, speed: ANIM.learningOrbitSpeeds[0] },
        { name: 'Sleep (hours)', radius: radii[1], color: 0x059669, particles: 5, speed: ANIM.learningOrbitSpeeds[1] },
        { name: 'Developmental (days)', radius: radii[2], color: 0x047857, particles: 3, speed: ANIM.learningOrbitSpeeds[2] },
    ];

    for (const ts of timescales) {
        // Orbit ring
        const ringGeometry = new THREE.TorusGeometry(ts.radius, 0.06, 8, 64);
        const ringMaterial = createGlowMaterial(ts.color, 0.2, 0.5);
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);

        // Particles on the orbit
        const orbitGroup = new THREE.Group();
        for (let i = 0; i < ts.particles; i++) {
            const angle = (i / ts.particles) * Math.PI * 2;
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.2, 8, 8),
                createGlowMaterial(ts.color, 0.6, 0.9)
            );
            particle.position.set(
                Math.cos(angle) * ts.radius,
                0,
                Math.sin(angle) * ts.radius
            );
            orbitGroup.add(particle);
        }
        orbitGroup.userData = { type: 'learningOrbit', speed: ts.speed };
        group.add(orbitGroup);

        // Label on the ring
        const label = createAnnotation(ts.name, `#${ts.color.toString(16).padStart(6, '0')}`);
        label.position.set(ts.radius + 2, 0, 0);
        group.add(label);
    }

    // VFN layer visualization for Sleep timescale (middle ring)
    const vfnLayers = new THREE.Group();
    for (let i = 0; i < 4; i++) {
        const layerDisc = new THREE.Mesh(
            new THREE.CircleGeometry(1, 12),
            createGlowMaterial(0x059669, 0.1 + i * 0.05, 0.4)
        );
        layerDisc.position.set(radii[1], i * 0.4 - 0.6, 0);
        layerDisc.rotation.y = Math.PI / 2;
        vfnLayers.add(layerDisc);
    }
    group.add(vfnLayers);

    const vfnLabel = createAnnotation('Forward-Forward\n(one layer at a time)', '#059669');
    vfnLabel.position.set(radii[1] + 2, -1, 0);
    group.add(vfnLabel);

    // Main label
    const mainLabel = createLayerLabel('Layer 7: Continual Learning', '#059669');
    mainLabel.position.set(0, 5, 0);
    group.add(mainLabel);

    const note = createAnnotation('Inference IS learning — every query generates a stored frame', '#64748b');
    note.position.set(0, 4, 0);
    group.add(note);

    scene.add(group);
    return group;
}

// Animation update
export function updateContinualLearning(group, elapsed) {
    group.traverse((child) => {
        if (child.userData && child.userData.type === 'learningOrbit') {
            child.rotation.y = elapsed * child.userData.speed;
        }
    });
}
