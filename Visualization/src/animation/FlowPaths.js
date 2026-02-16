import * as THREE from 'three';
import { LAYOUT, SIZES } from '../config.js';

// Spline-based paths for Tensor Frame particle travel through the pipeline

// Main pipeline path: Input → Bus → RAR → CPU → Output → Store
export function createPipelinePath() {
    const points = [
        // Start: External world (above translators)
        new THREE.Vector3(0, LAYOUT.externalWorld.y, 10),

        // Enter input translators
        new THREE.Vector3(0, LAYOUT.inputTranslators.y + 8, 5),
        new THREE.Vector3(0, LAYOUT.inputTranslators.y, 0),
        new THREE.Vector3(0, LAYOUT.inputTranslators.y - 5, 0),

        // Travel down LLL Bus to GPU Soft Core
        new THREE.Vector3(0, LAYOUT.gpuSoftCore.y + 8, 0),

        // Enter RAR torus (approach from outside)
        new THREE.Vector3(SIZES.rarTorusMajorRadius + 3, LAYOUT.gpuSoftCore.y, 0),
    ];

    return new THREE.CatmullRomCurve3(points);
}

// RAR loop path (follows the torus circumference)
export function createRARLoopPath() {
    const majorR = SIZES.rarTorusMajorRadius;
    const points = [];
    const segments = 64;

    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(
            Math.cos(angle) * majorR,
            0,
            Math.sin(angle) * majorR
        ));
    }

    return new THREE.CatmullRomCurve3(points, true); // closed loop
}

// Post-RAR path: RAR exit → CPU Hard Core → Safety → Output
export function createPostRARPath() {
    const majorR = SIZES.rarTorusMajorRadius;
    const points = [
        // Exit RAR torus (bottom)
        new THREE.Vector3(majorR, LAYOUT.gpuSoftCore.y, 0),
        new THREE.Vector3(majorR * 0.5, LAYOUT.gpuSoftCore.y - 5, 0),

        // Approach CPU Hard Core
        new THREE.Vector3(0, LAYOUT.cpuHardCore.y + 5, 0),
        new THREE.Vector3(0, LAYOUT.cpuHardCore.y, 0),

        // Through CPU (brief stop at Intent Router)
        new THREE.Vector3(0, LAYOUT.cpuHardCore.y - 2, 0),

        // Down to VoltDB (store)
        new THREE.Vector3(3, LAYOUT.voltDB.y + 3, 0),
        new THREE.Vector3(3, LAYOUT.voltDB.y, 0),

        // To Output Action Cores
        new THREE.Vector3(0, LAYOUT.outputCores.y + 4, 0),
        new THREE.Vector3(0, LAYOUT.outputCores.y, 0),

        // Exit downward
        new THREE.Vector3(0, LAYOUT.outputCores.y - 5, 5),
    ];

    return new THREE.CatmullRomCurve3(points);
}

// Get a point along a curve with normalized t [0, 1]
export function getPointOnPath(curve, t) {
    return curve.getPointAt(Math.max(0, Math.min(1, t)));
}

// Get the sector of the RAR torus (0=Root, 1=Attend, 2=Refine) from angle
export function getRARSector(angle) {
    const normalized = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    if (normalized < Math.PI * 2 / 3) return 'root';
    if (normalized < Math.PI * 4 / 3) return 'attend';
    return 'refine';
}
