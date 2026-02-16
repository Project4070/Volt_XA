import * as THREE from 'three';
import { COLORS, LAYOUT, SIZES } from '../config.js';
import { createMetallicMaterial, createGlowMaterial } from '../utils/MeshFactory.js';
import { createLayerLabel, createAnnotation } from '../utils/TextLabel.js';

export function createSocketStandard(scene) {
    const group = new THREE.Group();
    const y = LAYOUT.socketStandard.y;
    group.position.set(0, y, 0);
    group.userData = { type: 'socketStandard', name: 'Socket Standard' };

    const sw = SIZES.socketWidth;
    const sh = SIZES.socketHeight;
    const sd = SIZES.socketDepth;

    const sockets = [
        {
            name: 'Translator',
            subtitle: 'fn encode(&self, raw: &[u8]) -> TensorFrame',
            x: -9,
            color: 0x22d3ee,
            pinRows: 3,
            pinCols: 6,
        },
        {
            name: 'HardStrand',
            subtitle: 'fn execute(&self, intent: &TensorFrame) -> StrandResult',
            x: 0,
            color: 0xf59e0b,
            pinRows: 3,
            pinCols: 6,
        },
        {
            name: 'ActionCore',
            subtitle: 'fn decode(&self, frame: &TensorFrame) -> Output',
            x: 9,
            color: 0x10b981,
            pinRows: 3,
            pinCols: 6,
        },
    ];

    for (const s of sockets) {
        const socketGroup = new THREE.Group();

        // Socket base (metallic)
        const base = new THREE.Mesh(
            new THREE.BoxGeometry(sw, sh, sd),
            createMetallicMaterial(COLORS.socketStandard)
        );
        socketGroup.add(base);

        // Pin grid on top
        const pinGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 6);
        const pinMaterial = createGlowMaterial(s.color, 0.3, 0.7);

        for (let row = 0; row < s.pinRows; row++) {
            for (let col = 0; col < s.pinCols; col++) {
                const pin = new THREE.Mesh(pinGeometry, pinMaterial);
                pin.position.set(
                    (col - (s.pinCols - 1) / 2) * 0.5,
                    sh / 2 + 0.2,
                    (row - (s.pinRows - 1) / 2) * 0.5
                );
                socketGroup.add(pin);
            }
        }

        // Socket outline glow
        const outlineGeometry = new THREE.BoxGeometry(sw + 0.3, sh + 0.1, sd + 0.3);
        const outlineMaterial = new THREE.MeshBasicMaterial({
            color: s.color,
            transparent: true,
            opacity: 0.08,
            side: THREE.BackSide,
        });
        socketGroup.add(new THREE.Mesh(outlineGeometry, outlineMaterial));

        // Trait name label
        const nameLabel = createAnnotation(`trait ${s.name}`, `#${s.color.toString(16).padStart(6, '0')}`);
        nameLabel.position.set(0, sh / 2 + 1.5, 0);
        socketGroup.add(nameLabel);

        // Method signature
        const methodLabel = createAnnotation(s.subtitle, '#64748b');
        methodLabel.position.set(0, -sh / 2 - 0.8, 0);
        socketGroup.add(methodLabel);

        socketGroup.position.set(s.x, 0, 0);
        group.add(socketGroup);
    }

    // Main label
    const mainLabel = createLayerLabel('Layer 10: Socket Standard — Rust Traits', '#b45309');
    mainLabel.position.set(0, 5, 0);
    group.add(mainLabel);

    const note = createAnnotation('"AM5 Socket for AI" — One interface, infinite modules', '#64748b');
    note.position.set(0, 4, 0);
    group.add(note);

    scene.add(group);
    return group;
}
