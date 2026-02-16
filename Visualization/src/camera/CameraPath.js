import * as THREE from 'three';
import { ANIM, CAMERA, LAYOUT } from '../config.js';

// Auto-tour camera path through the entire architecture.
// CatmullRom spline: Overview → Translators → Bus spine → RAR torus circle
// → CPU Hard Core → VoltDB tiers → Output Cores → Layers 7-10 → return.
// ~90 seconds at default speed.

export class CameraPath {
    constructor(flyCamera) {
        this.flyCamera = flyCamera;
        this.path = createTourPath();
        this.lookPath = createTourLookPath();
        this.duration = ANIM.autoTourDuration; // seconds
        this.progress = 0; // 0-1
        this.active = false;
        this.speed = 1.0;
    }

    start() {
        this.progress = 0;
        this.active = true;
        this.flyCamera.isManual = false;
    }

    stop() {
        this.active = false;
        this.flyCamera.isManual = true;
    }

    toggle() {
        if (this.active) {
            this.stop();
        } else {
            this.start();
        }
        return this.active;
    }

    update(deltaTime) {
        if (!this.active) return;

        this.progress += (deltaTime * this.speed) / this.duration;

        if (this.progress >= 1) {
            this.progress = 0; // Loop
        }

        // Get position and look-at from paths
        const pos = this.path.getPointAt(this.progress);
        const lookAt = this.lookPath.getPointAt(this.progress);

        // Apply via spring-damped interpolation
        this.flyCamera.flyTo(
            { x: pos.x, y: pos.y, z: pos.z },
            { x: lookAt.x, y: lookAt.y, z: lookAt.z }
        );
    }

    getProgress() {
        return this.progress;
    }
}

function createTourPath() {
    const L = LAYOUT;
    const points = [
        // 1. Start: High overview
        new THREE.Vector3(0, 110, 100),

        // 2. Descend toward Input Translators
        new THREE.Vector3(12, L.inputTranslators.y + 5, 30),
        new THREE.Vector3(5, L.inputTranslators.y, 18),

        // 3. Sweep past translators
        new THREE.Vector3(-12, L.inputTranslators.y - 3, 15),

        // 4. Follow LLL Bus spine downward
        new THREE.Vector3(15, 78, 15),
        new THREE.Vector3(12, 68, 12),

        // 5. Circle the RAR torus (GPU Soft Core)
        new THREE.Vector3(20, L.gpuSoftCore.y + 3, 18),
        new THREE.Vector3(15, L.gpuSoftCore.y, 22),
        new THREE.Vector3(-5, L.gpuSoftCore.y + 1, 22),
        new THREE.Vector3(-18, L.gpuSoftCore.y, 10),
        new THREE.Vector3(-12, L.gpuSoftCore.y + 2, -10),
        new THREE.Vector3(10, L.gpuSoftCore.y, -12),
        new THREE.Vector3(20, L.gpuSoftCore.y, 0),

        // 6. Descend to CPU Hard Core
        new THREE.Vector3(18, L.cpuHardCore.y + 8, 20),
        new THREE.Vector3(14, L.cpuHardCore.y + 3, 22),

        // 7. Orbit the motherboard
        new THREE.Vector3(-10, L.cpuHardCore.y + 2, 18),

        // 8. Down to VoltDB
        new THREE.Vector3(14, L.voltDB.y + 6, 20),
        new THREE.Vector3(10, L.voltDB.y, 16),

        // 9. Through to Output Cores
        new THREE.Vector3(8, L.outputCores.y + 5, 15),
        new THREE.Vector3(-5, L.outputCores.y, 12),

        // 10. Fly-by Continual Learning
        new THREE.Vector3(14, L.continualLearning.y + 3, 18),

        // 11. Intelligence Commons
        new THREE.Vector3(15, L.intelligenceCommons.y + 3, 18),

        // 12. UI/Test Bench
        new THREE.Vector3(10, L.uiTestBench.y + 3, 14),

        // 13. Socket Standard
        new THREE.Vector3(12, L.socketStandard.y + 3, 16),

        // 14. Pull back up to overview
        new THREE.Vector3(25, L.intelligenceCommons.y, 45),
        new THREE.Vector3(35, L.voltDB.y, 65),
        new THREE.Vector3(20, L.gpuSoftCore.y, 80),
        new THREE.Vector3(0, 110, 100), // Loop back to start
    ];

    return new THREE.CatmullRomCurve3(points, true);
}

function createTourLookPath() {
    const L = LAYOUT;
    const points = [
        new THREE.Vector3(0, 20, 0),          // Overview
        new THREE.Vector3(0, L.inputTranslators.y, 0),
        new THREE.Vector3(0, L.inputTranslators.y, 0),
        new THREE.Vector3(0, L.inputTranslators.y, 0),
        new THREE.Vector3(0, 75, 0),           // Bus
        new THREE.Vector3(0, L.gpuSoftCore.y, 0),
        // RAR torus — 7 points
        new THREE.Vector3(0, L.gpuSoftCore.y, 0),
        new THREE.Vector3(0, L.gpuSoftCore.y, 0),
        new THREE.Vector3(0, L.gpuSoftCore.y, 0),
        new THREE.Vector3(0, L.gpuSoftCore.y, 0),
        new THREE.Vector3(0, L.gpuSoftCore.y, 0),
        new THREE.Vector3(0, L.gpuSoftCore.y, 0),
        new THREE.Vector3(0, L.gpuSoftCore.y, 0),
        // CPU — 3 points
        new THREE.Vector3(0, L.cpuHardCore.y, 0),
        new THREE.Vector3(0, L.cpuHardCore.y, 0),
        new THREE.Vector3(0, L.cpuHardCore.y, 0),
        // VoltDB — 2 points
        new THREE.Vector3(0, L.voltDB.y, 0),
        new THREE.Vector3(0, L.voltDB.y, 0),
        // Output — 2 points
        new THREE.Vector3(0, L.outputCores.y, 0),
        new THREE.Vector3(0, L.outputCores.y, 0),
        // Learning
        new THREE.Vector3(0, L.continualLearning.y, 0),
        // Commons
        new THREE.Vector3(0, L.intelligenceCommons.y, 0),
        // UI
        new THREE.Vector3(0, L.uiTestBench.y, 0),
        // Sockets
        new THREE.Vector3(0, L.socketStandard.y, 0),
        // Return
        new THREE.Vector3(0, L.intelligenceCommons.y, 0),
        new THREE.Vector3(0, L.voltDB.y, 0),
        new THREE.Vector3(0, L.gpuSoftCore.y, 0),
        new THREE.Vector3(0, 20, 0),  // Loop back
    ];

    return new THREE.CatmullRomCurve3(points, true);
}
