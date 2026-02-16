import * as THREE from 'three';
import { COLORS, SIZES, gammaToHex } from '../config.js';
import { createGlowMaterial, createWireframeMaterial } from '../utils/MeshFactory.js';
import { createTextLabel, createAnnotation } from '../utils/TextLabel.js';

// Slot role names
const SLOT_ROLES = [
    'AGENT', 'PREDICATE', 'PATIENT', 'LOCATION', 'TIME',
    'MANNER', 'INSTRUMENT', 'CAUSE', 'RESULT',
    'FREE_0', 'FREE_1', 'FREE_2', 'FREE_3', 'FREE_4', 'FREE_5', 'FREE_6'
];

const RESOLUTION_NAMES = ['R0 Discourse', 'R1 Proposition', 'R2 Phrase', 'R3 Token'];
const RESOLUTION_SCALES = [1.0, 0.85, 0.7, 0.55]; // Progressive size reduction

// === STATIC EXHIBIT ===
// Full 16x4 grid showing the Tensor Frame data structure in detail

export function createTensorFrameExhibit(position = { x: 0, y: 0, z: 0 }) {
    const group = new THREE.Group();
    group.position.set(position.x, position.y, position.z);

    const cubeSize = SIZES.tensorSlotCube;
    const spacing = SIZES.tensorExhibitSpacing;
    const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

    // Generate example slot data (some filled, some empty)
    const slotData = generateExampleSlotData();

    // Create 16 columns x 4 rows of cubes
    for (let slot = 0; slot < 16; slot++) {
        for (let res = 0; res < 4; res++) {
            const x = (slot - 7.5) * spacing;
            const y = (1.5 - res) * spacing * RESOLUTION_SCALES[res];
            const z = 0;

            const isFilled = slotData[slot].filled[res];
            const gamma = slotData[slot].gamma;

            let material;
            if (isFilled) {
                const color = gammaToHex(gamma);
                material = createGlowMaterial(color, 0.6, 0.9);
            } else {
                material = createWireframeMaterial(0x333355, 0.3);
            }

            const cube = new THREE.Mesh(cubeGeometry, material);
            const scale = RESOLUTION_SCALES[res];
            cube.scale.set(scale, scale, scale);
            cube.position.set(x, y, z);

            // Store metadata for hover interaction
            cube.userData = {
                type: 'tensorSlot',
                slot: slot,
                resolution: res,
                role: SLOT_ROLES[slot],
                resolutionName: RESOLUTION_NAMES[res],
                gamma: gamma,
                filled: isFilled,
                source: slotData[slot].source,
            };

            group.add(cube);
        }
    }

    // Slot role labels (top)
    for (let slot = 0; slot < 16; slot++) {
        const x = (slot - 7.5) * spacing;
        const label = createAnnotation(SLOT_ROLES[slot], slot < 9 ? '#94a3b8' : '#64748b');
        label.position.set(x, 1.5, 0);

        // Rotate label text for readability at dense spacing
        if (label.element) {
            label.element.style.fontSize = '8px';
            label.element.style.transform = 'rotate(-45deg)';
            label.element.style.transformOrigin = 'bottom left';
        }
        group.add(label);
    }

    // Resolution labels (left side)
    for (let res = 0; res < 4; res++) {
        const y = (1.5 - res) * spacing * RESOLUTION_SCALES[res];
        const label = createAnnotation(RESOLUTION_NAMES[res], '#64748b');
        label.position.set(-8.5 * spacing / 2, y, 0);
        group.add(label);
    }

    // Title label
    const title = createTextLabel('Tensor Frame — F ∈ R^[16 × 4 × 256]', {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#e2e8f0',
        backgroundColor: 'rgba(6, 6, 15, 0.85)',
        padding: '6px 12px',
        borderRadius: '6px',
    });
    title.position.set(0, 2.5, 0);
    group.add(title);

    // Metadata subtitle
    const meta = createAnnotation('Max: 64 KB | Typical sparse: ~8 KB (4 slots × 2 res)', '#64748b');
    meta.position.set(0, -2.0, 0);
    group.add(meta);

    return group;
}

// === FLOWING PARTICLE ===
// Compact sphere with 16-segment equatorial ring

export function createTensorFrameParticle(gamma = 0.7) {
    const group = new THREE.Group();
    group.userData = { type: 'tensorParticle', gamma: gamma, slotGammas: [] };

    const radius = SIZES.tensorParticleRadius;

    // Core sphere
    const coreGeometry = new THREE.SphereGeometry(radius * 0.6, 16, 16);
    const coreMaterial = new THREE.MeshStandardMaterial({
        color: COLORS.tensorFrameCore,
        emissive: COLORS.tensorFrameCore,
        emissiveIntensity: 0.5 + gamma * 0.5,
        transparent: true,
        opacity: 0.9,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);

    // Outer halo (certainty-based brightness)
    const haloGeometry = new THREE.SphereGeometry(radius, 16, 16);
    const haloMaterial = new THREE.MeshBasicMaterial({
        color: gammaToHex(gamma),
        transparent: true,
        opacity: 0.15 + gamma * 0.2,
        side: THREE.BackSide,
    });
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    group.add(halo);
    group.userData.halo = halo;
    group.userData.haloMaterial = haloMaterial;

    // 16-segment equatorial ring
    const ringGroup = createSlotRing(radius * 0.85, gamma);
    group.add(ringGroup);
    group.userData.ring = ringGroup;

    // Trail storage (positions will be updated externally)
    group.userData.trail = [];
    group.userData.trailLine = createTrailLine();
    group.add(group.userData.trailLine);

    return group;
}

function createSlotRing(radius, globalGamma) {
    const group = new THREE.Group();
    const slotGammas = [];

    for (let i = 0; i < 16; i++) {
        // Each slot has a slightly different gamma for visual interest
        const slotGamma = Math.max(0, Math.min(1, globalGamma + (Math.random() - 0.5) * 0.3));
        slotGammas.push(slotGamma);

        const segAngle = (Math.PI * 2) / 16;
        const startAngle = i * segAngle + 0.02;
        const endAngle = (i + 1) * segAngle - 0.02;

        const curve = new THREE.EllipseCurve(
            0, 0,
            radius, radius,
            startAngle, endAngle,
            false,
            0
        );

        const points = curve.getPoints(8);
        const points3D = points.map(p => new THREE.Vector3(p.x, 0, p.y));
        const geometry = new THREE.BufferGeometry().setFromPoints(points3D);

        const material = new THREE.LineBasicMaterial({
            color: gammaToHex(slotGamma),
            linewidth: 2,
        });

        const segment = new THREE.Line(geometry, material);
        segment.userData = { slot: i, gamma: slotGamma, role: SLOT_ROLES[i] };
        group.add(segment);
    }

    group.userData.slotGammas = slotGammas;
    return group;
}

function createTrailLine() {
    const maxPoints = 50;
    const positions = new Float32Array(maxPoints * 3);
    const colors = new Float32Array(maxPoints * 4);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({
        color: COLORS.tensorFrameTrail,
        transparent: true,
        opacity: 0.4,
    });

    const line = new THREE.Line(geometry, material);
    line.frustumCulled = false;
    return line;
}

// Update trail positions (call each frame when particle moves)
export function updateParticleTrail(particle) {
    const trail = particle.userData.trail;
    const line = particle.userData.trailLine;

    // Add current position to trail
    trail.push(particle.position.clone());
    if (trail.length > 50) trail.shift();

    // Update line geometry
    const positions = line.geometry.attributes.position;
    for (let i = 0; i < trail.length; i++) {
        // Trail positions are in world space, line is child of particle
        // so convert to local space
        const local = trail[i].clone().sub(particle.position);
        positions.setXYZ(i, local.x, local.y, local.z);
    }
    // Zero out unused positions
    for (let i = trail.length; i < 50; i++) {
        positions.setXYZ(i, 0, 0, 0);
    }
    positions.needsUpdate = true;
    line.geometry.setDrawRange(0, trail.length);
}

// Update particle certainty visuals
export function updateParticleCertainty(particle, gamma) {
    particle.userData.gamma = gamma;
    const halo = particle.userData.haloMaterial;
    if (halo) {
        halo.color.setHex(gammaToHex(gamma));
        halo.opacity = 0.15 + gamma * 0.2;
    }
}

// === HELPER: Generate example slot data for the exhibit ===
function generateExampleSlotData() {
    const data = [];
    const sources = ['Translator', 'SoftCore', 'HardCore', 'Memory', 'Ghost'];
    for (let slot = 0; slot < 16; slot++) {
        const isFilled = slot < 9 ? Math.random() > 0.2 : Math.random() > 0.6;
        data.push({
            gamma: isFilled ? 0.3 + Math.random() * 0.7 : 0,
            source: sources[Math.floor(Math.random() * sources.length)],
            filled: [
                isFilled,                                   // R0
                isFilled && Math.random() > 0.2,            // R1
                isFilled && Math.random() > 0.5,            // R2
                isFilled && Math.random() > 0.8,            // R3 (rarely filled)
            ],
        });
    }
    return data;
}
