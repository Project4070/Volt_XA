import * as THREE from 'three';
import { ANIM, COLORS, SIZES, gammaToHex } from '../config.js';
import { ConvergenceVisualizer } from './ConvergenceVisualizer.js';
import { createRARLoopPath, getRARSector } from './FlowPaths.js';

// Animates a single Tensor Frame particle through Root/Attend/Refine iterations
// inside the RAR torus. Manages slot expansion, VFN lane traversal,
// attention web drawing, convergence freezing, and torus loop-back.

const PHASES = { ROOT: 'root', ATTEND: 'attend', REFINE: 'refine', COALESCE: 'coalesce' };

export class RARLoopAnimator {
    constructor(gpuSoftCoreGroup) {
        this.group = gpuSoftCoreGroup;
        this.convergence = new ConvergenceVisualizer();
        this.loopPath = createRARLoopPath();

        this.iteration = 0;
        this.phase = PHASES.ROOT;
        this.phaseProgress = 0; // 0-1 within current phase
        this.active = false;
        this.particle = null;

        // Visual state
        this.slotSpheres = [];    // 16 expanded slot spheres during RAR
        this.attentionLines = []; // Attention web lines
        this.slotSpheresGroup = new THREE.Group();
        this.attentionGroup = new THREE.Group();

        // RAR torus world position offset (from the gpuSoftCore group)
        this.torusY = 0;
        this.majorR = SIZES.rarTorusMajorRadius;

        if (this.group) {
            this.group.add(this.slotSpheresGroup);
            this.group.add(this.attentionGroup);
        }
    }

    // Begin RAR animation for a particle
    start(particle) {
        this.particle = particle;
        this.iteration = 0;
        this.convergence.reset();
        this.phase = PHASES.ROOT;
        this.phaseProgress = 0;
        this.active = true;

        // Create 16 slot spheres (initially hidden, expand from particle in Root phase)
        this._createSlotSpheres();
    }

    // Returns true when RAR is complete (all converged or budget exhausted)
    update(deltaTime) {
        if (!this.active || !this.particle) return false;

        const phaseDuration = ANIM.rarIterationDuration / 3; // Each phase ~1s
        this.phaseProgress += deltaTime / phaseDuration;

        if (this.phaseProgress >= 1) {
            this.phaseProgress = 0;
            return this._advancePhase();
        }

        // Animate current phase
        switch (this.phase) {
            case PHASES.ROOT:
                this._animateRoot(this.phaseProgress);
                break;
            case PHASES.ATTEND:
                this._animateAttend(this.phaseProgress);
                break;
            case PHASES.REFINE:
                this._animateRefine(this.phaseProgress);
                break;
            case PHASES.COALESCE:
                this._animateCoalesce(this.phaseProgress);
                break;
        }

        return false;
    }

    _advancePhase() {
        switch (this.phase) {
            case PHASES.ROOT:
                this.phase = PHASES.ATTEND;
                this._setupAttendVisuals();
                break;

            case PHASES.ATTEND:
                this.phase = PHASES.REFINE;
                this._clearAttendVisuals();
                break;

            case PHASES.REFINE:
                // Complete one iteration
                this.iteration++;
                const fullyConverged = this.convergence.iterate();

                // Update convergence meters in the GPU Soft Core component
                this._updateConvergenceMeters();

                if (fullyConverged || this.iteration >= ANIM.maxRarIterations) {
                    // RAR complete — coalesce slots back into particle
                    this.phase = PHASES.COALESCE;
                    return false;
                }

                // Loop back to Root for next iteration
                this.phase = PHASES.ROOT;
                break;

            case PHASES.COALESCE:
                // Done — clean up
                this._cleanup();
                return true;
        }

        return false;
    }

    // === ROOT PHASE: Slots expand into VFN lanes, process through layers ===
    _animateRoot(t) {
        const convergedStates = this.convergence.getSlotStates();

        for (let i = 0; i < 16; i++) {
            const sphere = this.slotSpheres[i];
            if (!sphere || convergedStates[i].converged) continue;

            // Root sector spans 0 to 2π/3
            const slotAngle = (i / 16) * (Math.PI * 2 / 3) + Math.PI / 16;

            // Expand from center outward to VFN lane positions
            const expandT = Math.min(1, t * 2); // First half: expand
            const processT = Math.max(0, (t - 0.5) * 2); // Second half: process through layers

            const targetX = Math.cos(slotAngle) * this.majorR;
            const targetZ = Math.sin(slotAngle) * this.majorR;

            // Lerp from particle position (center of torus) to VFN lane
            sphere.position.x = targetX * expandT;
            sphere.position.z = targetZ * expandT;

            // VFN processing: vertical bounce through 4 layers
            if (processT > 0) {
                const layerIndex = Math.floor(processT * 4);
                const layerT = (processT * 4) % 1;
                sphere.position.y = -0.45 + layerIndex * 0.3 + Math.sin(layerT * Math.PI) * 0.2;

                // Flash brighter during processing
                sphere.material.emissiveIntensity = 0.5 + Math.sin(processT * Math.PI * 8) * 0.3;
            }

            // Scale with slight pulse
            const pulse = 1.0 + Math.sin(t * Math.PI * 4) * 0.1;
            sphere.scale.setScalar(sphere.userData.converged ? 0.6 : pulse);
        }

        // Add diffusion noise particles (orbiting per slot)
        this._updateDiffusionNoise(t);
    }

    // === ATTEND PHASE: Attention matrix lights up, ghost connections appear ===
    _animateAttend(t) {
        const convergedStates = this.convergence.getSlotStates();

        // Move slot spheres to Attend sector (2π/3 to 4π/3)
        for (let i = 0; i < 16; i++) {
            const sphere = this.slotSpheres[i];
            if (!sphere || convergedStates[i].converged) continue;

            const slotAngle = Math.PI * 2 / 3 + (i / 16) * (Math.PI * 2 / 3) + Math.PI / 16;
            const targetX = Math.cos(slotAngle) * this.majorR;
            const targetZ = Math.sin(slotAngle) * this.majorR;

            // Smooth transition
            sphere.position.x += (targetX - sphere.position.x) * 0.1;
            sphere.position.z += (targetZ - sphere.position.z) * 0.1;
            sphere.position.y *= 0.95; // Settle back to y=0
        }

        // Animate attention web — connections between non-converged slots
        this._updateAttentionWeb(t, convergedStates);

        // Pulse the attention matrix in the scene
        this._pulseAttentionMatrix(t);
    }

    // === REFINE PHASE: Snap to unit sphere, convergence check ===
    _animateRefine(t) {
        const convergedStates = this.convergence.getSlotStates();

        for (let i = 0; i < 16; i++) {
            const sphere = this.slotSpheres[i];
            if (!sphere) continue;

            // Move to Refine sector (4π/3 to 2π)
            const slotAngle = Math.PI * 4 / 3 + (i / 16) * (Math.PI * 2 / 3) + Math.PI / 16;
            const targetX = Math.cos(slotAngle) * this.majorR * 0.7;
            const targetZ = Math.sin(slotAngle) * this.majorR * 0.7;

            sphere.position.x += (targetX - sphere.position.x) * 0.12;
            sphere.position.z += (targetZ - sphere.position.z) * 0.12;

            // Elastic snap animation (like snapping to unit sphere)
            if (t > 0.3 && t < 0.6) {
                const snapT = (t - 0.3) / 0.3;
                const bounce = Math.sin(snapT * Math.PI * 3) * Math.exp(-snapT * 2);
                sphere.scale.setScalar(1.0 + bounce * 0.3);
            }

            // Check if this slot is about to converge
            const willConverge = this.iteration + 1 >= convergedStates[i].convergenceIteration;

            if (willConverge && t > 0.7) {
                // Flash green as it locks
                sphere.material.color.setHex(0x10b981);
                sphere.material.emissiveIntensity = 0.8;
                sphere.userData.converged = true;
            } else if (convergedStates[i].converged) {
                // Already converged: dim green, small
                sphere.material.color.setHex(0x10b981);
                sphere.material.emissiveIntensity = 0.3;
                sphere.scale.setScalar(0.5);
            } else {
                // Pulsing unconverged
                const pulse = 0.5 + Math.sin(t * Math.PI * 4 + i) * 0.2;
                sphere.material.emissiveIntensity = pulse;
            }
        }
    }

    // === COALESCE: 16 spheres merge back into single particle ===
    _animateCoalesce(t) {
        for (let i = 0; i < 16; i++) {
            const sphere = this.slotSpheres[i];
            if (!sphere) continue;

            // Fly toward center (particle position)
            sphere.position.x *= (1 - t * 0.15);
            sphere.position.z *= (1 - t * 0.15);
            sphere.position.y *= (1 - t * 0.15);

            // Shrink
            const scale = Math.max(0.05, 1.0 - t * 0.9);
            sphere.scale.setScalar(scale);

            // Fade
            sphere.material.opacity = Math.max(0, 1.0 - t);
        }
    }

    // === VISUAL HELPERS ===

    _createSlotSpheres() {
        // Clear existing
        while (this.slotSpheresGroup.children.length > 0) {
            const child = this.slotSpheresGroup.children[0];
            this.slotSpheresGroup.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        }
        this.slotSpheres = [];

        const geometry = new THREE.SphereGeometry(0.3, 12, 12);

        for (let i = 0; i < 16; i++) {
            const gamma = this.particle ? (this.particle.userData.slotGammas?.[i] ?? 0.5) : 0.5;
            const material = new THREE.MeshStandardMaterial({
                color: gammaToHex(gamma),
                emissive: gammaToHex(gamma),
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.85,
            });

            const sphere = new THREE.Mesh(geometry, material);
            sphere.userData = { slot: i, gamma: gamma, converged: false };
            sphere.position.set(0, 0, 0); // Start at center
            sphere.scale.setScalar(0.1); // Start tiny
            this.slotSpheres.push(sphere);
            this.slotSpheresGroup.add(sphere);
        }
    }

    _updateDiffusionNoise(t) {
        // Visual effect: small particles orbiting around each active slot sphere
        // Using the existing slot spheres' rotations for the effect
        for (const sphere of this.slotSpheres) {
            if (sphere.userData.converged) continue;
            sphere.rotation.x = t * Math.PI * 2 + sphere.userData.slot;
            sphere.rotation.z = t * Math.PI + sphere.userData.slot * 0.5;
        }
    }

    _setupAttendVisuals() {
        // Clear old attention lines
        this._clearAttendVisuals();
    }

    _clearAttendVisuals() {
        while (this.attentionGroup.children.length > 0) {
            const child = this.attentionGroup.children[0];
            this.attentionGroup.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        }
        this.attentionLines = [];
    }

    _updateAttentionWeb(t, convergedStates) {
        // Remove old lines
        this._clearAttendVisuals();

        // Draw attention connections between non-converged slots
        const activeSlots = this.slotSpheres.filter(
            (s, i) => s && !convergedStates[i].converged
        );

        if (activeSlots.length < 2) return;

        const lineMaterial = new THREE.LineBasicMaterial({
            color: COLORS.rarAttend,
            transparent: true,
            opacity: 0.15 + t * 0.25,
        });

        // Connect each active slot to 2-3 others (simulating attention weights)
        for (let i = 0; i < activeSlots.length; i++) {
            const from = activeSlots[i];
            const connections = Math.min(3, activeSlots.length - 1);

            for (let c = 0; c < connections; c++) {
                const toIdx = (i + c + 1) % activeSlots.length;
                const to = activeSlots[toIdx];

                const points = [from.position.clone(), to.position.clone()];
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.Line(geometry, lineMaterial);
                this.attentionGroup.add(line);
                this.attentionLines.push(line);
            }
        }
    }

    _pulseAttentionMatrix(t) {
        // Find the attention matrix instanced mesh in the GPU Soft Core group
        if (!this.group) return;

        this.group.traverse((child) => {
            if (child.userData?.type === 'attentionMatrix' && child.userData.instancedMesh) {
                const mesh = child.userData.instancedMesh;
                // Update random attention weight colors to simulate live computation
                if (t > 0.3 && t < 0.7 && mesh.instanceColor) {
                    const updateCount = Math.floor(Math.random() * 20);
                    for (let u = 0; u < updateCount; u++) {
                        const idx = Math.floor(Math.random() * 256);
                        const weight = Math.random();
                        const color = new THREE.Color();
                        color.setHSL(0.55, 0.8, 0.2 + weight * 0.6);
                        mesh.setColorAt(idx, color);
                    }
                    mesh.instanceColor.needsUpdate = true;
                }
            }
        });
    }

    _updateConvergenceMeters() {
        if (!this.group) return;

        const states = this.convergence.getSlotStates();

        this.group.traverse((child) => {
            if (child.userData?.type === 'convergenceMeter') {
                const slot = child.userData.slot;
                if (slot === undefined || !states[slot]) return;

                const state = states[slot];

                // Update the fill bar (second child of the meter group)
                const fillBar = child.children[1];
                if (fillBar) {
                    const fillHeight = state.progress * 2;
                    fillBar.scale.y = Math.max(0.01, fillHeight / 2);
                    fillBar.position.y = (fillHeight - 2) / 2;

                    if (state.converged) {
                        fillBar.material.color.setHex(0x10b981);
                        fillBar.material.emissiveIntensity = 0.6;
                    }
                }

                child.userData.converged = state.converged;
            }
        });
    }

    _cleanup() {
        // Remove slot spheres
        while (this.slotSpheresGroup.children.length > 0) {
            const child = this.slotSpheresGroup.children[0];
            this.slotSpheresGroup.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        }
        this.slotSpheres = [];
        this._clearAttendVisuals();
        this.active = false;
    }

    // Get animation state for external queries
    getState() {
        return {
            active: this.active,
            iteration: this.iteration,
            maxIterations: ANIM.maxRarIterations,
            phase: this.phase,
            phaseProgress: this.phaseProgress,
            convergedCount: this.convergence.getConvergedSlotCount(),
            activeCount: this.convergence.getActiveSlotCount(),
            globalGamma: this.convergence.getGlobalGamma(),
            fullyConverged: this.convergence.isFullyConverged(),
        };
    }

    dispose() {
        this._cleanup();
        if (this.group) {
            this.group.remove(this.slotSpheresGroup);
            this.group.remove(this.attentionGroup);
        }
    }
}
