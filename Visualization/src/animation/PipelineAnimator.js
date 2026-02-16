import * as THREE from 'three';
import { ANIM, LAYOUT, SIZES, gammaToHex } from '../config.js';
import { ParticleSystem } from './ParticleSystem.js';
import { RARLoopAnimator } from './RARLoopAnimator.js';
import { createPipelinePath, createRARLoopPath, createPostRARPath } from './FlowPaths.js';
import { updateParticleCertainty } from '../components/TensorFrame.js';

// Master state machine for the full inference pipeline animation.
// Drives a Tensor Frame particle through:
//   IDLE → TRANSLATING → PREFETCHING → RAR_LOOP → CPU_ROUTING
//   → CPU_EXECUTING → CPU_SAFETY → DECODING → STORING → COMPLETE

const STATES = {
    IDLE:           'idle',
    TRANSLATING:    'translating',
    PREFETCHING:    'prefetching',
    RAR_LOOP:       'rar_loop',
    CPU_ROUTING:    'cpu_routing',
    CPU_EXECUTING:  'cpu_executing',
    CPU_SAFETY:     'cpu_safety',
    DECODING:       'decoding',
    STORING:        'storing',
    COMPLETE:       'complete',
};

export { STATES as PIPELINE_STATES };

export class PipelineAnimator {
    constructor(scene, components) {
        this.scene = scene;
        this.components = components; // Reference to SceneBuilder component groups

        // Sub-systems
        this.particleSystem = new ParticleSystem(scene);
        this.rarAnimator = new RARLoopAnimator(components?.gpuSoftCore ?? null);

        // Paths
        this.pipelinePath = createPipelinePath();
        this.rarLoopPath = createRARLoopPath();
        this.postRARPath = createPostRARPath();

        // State
        this.state = STATES.IDLE;
        this.stateTimer = 0;
        this.stateDuration = 0;
        this.activeParticle = null;
        this.speedMultiplier = 1.0;
        this.paused = false;
        this.continuous = true; // Auto-spawn new particles after completion

        // Visual feedback references
        this._safetyFlashTimer = 0;
        this._routingTargetStrand = null;
        this._decodeProgress = 0;

        // Callbacks
        this.onStateChange = null; // (newState, oldState) => {}
        this.onComplete = null;    // () => {}
    }

    // Start a new pipeline run
    start() {
        if (this.state !== STATES.IDLE && this.state !== STATES.COMPLETE) return;

        // Spawn particle at the top of the pipeline
        const spawnPos = new THREE.Vector3(0, LAYOUT.externalWorld.y, 10);
        this.activeParticle = this.particleSystem.spawn(spawnPos, 0.3);

        if (!this.activeParticle) return;

        this._transitionTo(STATES.TRANSLATING);
    }

    // Pause/resume
    togglePause() {
        this.paused = !this.paused;
        return this.paused;
    }

    setPaused(paused) {
        this.paused = paused;
    }

    setSpeed(multiplier) {
        this.speedMultiplier = Math.max(0.25, Math.min(4.0, multiplier));
    }

    // Main update (called each frame)
    update(deltaTime) {
        if (this.paused) return;

        const dt = deltaTime * this.speedMultiplier;

        // Always update particle visuals
        this.particleSystem.update(dt);

        // State machine
        switch (this.state) {
            case STATES.IDLE:
                break;

            case STATES.TRANSLATING:
                this._updateTranslating(dt);
                break;

            case STATES.PREFETCHING:
                this._updatePrefetching(dt);
                break;

            case STATES.RAR_LOOP:
                this._updateRARLoop(dt);
                break;

            case STATES.CPU_ROUTING:
                this._updateCPURouting(dt);
                break;

            case STATES.CPU_EXECUTING:
                this._updateCPUExecuting(dt);
                break;

            case STATES.CPU_SAFETY:
                this._updateCPUSafety(dt);
                break;

            case STATES.DECODING:
                this._updateDecoding(dt);
                break;

            case STATES.STORING:
                this._updateStoring(dt);
                break;

            case STATES.COMPLETE:
                this._updateComplete(dt);
                break;
        }
    }

    // === STATE HANDLERS ===

    // TRANSLATING: Particle moves from external world through input translators
    _updateTranslating(dt) {
        this.stateTimer += dt;
        const t = this.stateTimer / this.stateDuration;

        if (this.activeParticle) {
            // Move along pipeline path (first ~40% of the path covers translators)
            const pathT = t * 0.6;
            const done = this.particleSystem.moveAlongPath(
                this.activeParticle, this.pipelinePath, 0.6 / this.stateDuration, dt
            );

            // Gradually increase gamma as translation processes input
            const gamma = 0.2 + t * 0.3;
            updateParticleCertainty(this.activeParticle, gamma);

            // Flash input translators when particle passes through
            this._flashComponent('inputTranslators', t);
        }

        if (this.stateTimer >= this.stateDuration) {
            this._transitionTo(STATES.PREFETCHING);
        }
    }

    // PREFETCHING: VoltDB T1→T0 prefetch (particle pauses while ghosts load)
    _updatePrefetching(dt) {
        this.stateTimer += dt;
        const t = this.stateTimer / this.stateDuration;

        if (this.activeParticle) {
            // Continue along pipeline path toward RAR torus
            this.particleSystem.moveAlongPath(
                this.activeParticle, this.pipelinePath, 0.4 / this.stateDuration, dt
            );

            // Pulse VoltDB transfer conduits
            this._flashComponent('voltDB', t);
        }

        if (this.stateTimer >= this.stateDuration) {
            // Position particle at RAR torus entrance
            if (this.activeParticle) {
                this.activeParticle.position.set(
                    SIZES.rarTorusMajorRadius + 3,
                    LAYOUT.gpuSoftCore.y,
                    0
                );
                this.activeParticle.userData.pathProgress = 0;
            }
            this._transitionTo(STATES.RAR_LOOP);
        }
    }

    // RAR_LOOP: Detailed Root/Attend/Refine iterations (delegated to RARLoopAnimator)
    _updateRARLoop(dt) {
        if (this.activeParticle) {
            // Hide the main particle during RAR — slot spheres are shown instead
            this.activeParticle.visible = false;

            const done = this.rarAnimator.update(dt);

            if (done) {
                // RAR complete — update particle with final gamma
                const rarState = this.rarAnimator.getState();
                const finalGamma = rarState.fullyConverged
                    ? 0.7 + Math.random() * 0.3
                    : 0.3 + rarState.globalGamma * 0.4;

                this.activeParticle.visible = true;
                updateParticleCertainty(this.activeParticle, finalGamma);

                // Position at RAR exit (bottom of torus)
                this.activeParticle.position.set(
                    SIZES.rarTorusMajorRadius,
                    LAYOUT.gpuSoftCore.y,
                    0
                );
                this.activeParticle.userData.pathProgress = 0;

                this._transitionTo(STATES.CPU_ROUTING);
            }
        }
    }

    // CPU_ROUTING: Intent Router cosine similarity match
    _updateCPURouting(dt) {
        this.stateTimer += dt;
        const t = this.stateTimer / this.stateDuration;

        if (this.activeParticle) {
            // Move from RAR exit to CPU Hard Core
            const postRARSpeed = 0.3 / this.stateDuration;
            this.particleSystem.moveAlongPath(
                this.activeParticle, this.postRARPath, postRARSpeed, dt
            );

            // Animate Intent Router rings expanding
            this._animateIntentRouter(t);
        }

        if (this.stateTimer >= this.stateDuration) {
            // Pick a target strand
            const strandNames = [
                'MathEngine', 'CodeRunner', 'APIDispatch', 'HDCAlgebra',
                'CertaintyEngine', 'ProofConstructor', 'CausalSimulator',
                'LedgerStrand', 'SleepLearner', 'MirrorModule'
            ];
            this._routingTargetStrand = strandNames[Math.floor(Math.random() * strandNames.length)];

            this._transitionTo(STATES.CPU_EXECUTING);
        }
    }

    // CPU_EXECUTING: Selected Hard Strand processes the frame
    _updateCPUExecuting(dt) {
        this.stateTimer += dt;
        const t = this.stateTimer / this.stateDuration;

        if (this.activeParticle) {
            // Park particle near CPU Hard Core center
            const cpuY = LAYOUT.cpuHardCore.y;
            this.activeParticle.position.y += (cpuY - this.activeParticle.position.y) * 0.1;
            this.activeParticle.position.x *= 0.95;
            this.activeParticle.position.z *= 0.95;

            // Flash the target strand chip
            this._flashStrandChip(this._routingTargetStrand, t);

            // Gamma increases during hard strand processing
            const currentGamma = this.activeParticle.userData.gamma || 0.5;
            updateParticleCertainty(this.activeParticle, currentGamma + t * 0.1);
        }

        if (this.stateTimer >= this.stateDuration) {
            this._transitionTo(STATES.CPU_SAFETY);
        }
    }

    // CPU_SAFETY: Safety layer check (scanning beam sweep)
    _updateCPUSafety(dt) {
        this.stateTimer += dt;
        const t = this.stateTimer / this.stateDuration;

        // Flash safety pillars sequentially
        this._flashSafetyPillars(t);

        if (this.stateTimer >= this.stateDuration) {
            // Safety passed — continue to decode
            if (this.activeParticle) {
                this.activeParticle.userData.pathProgress = 0.3; // Past CPU on post-RAR path
            }
            this._transitionTo(STATES.DECODING);
        }
    }

    // DECODING: Output Action Cores — parallel 16-slot decode
    _updateDecoding(dt) {
        this.stateTimer += dt;
        const t = this.stateTimer / this.stateDuration;

        if (this.activeParticle) {
            // Move toward output cores
            this.particleSystem.moveAlongPath(
                this.activeParticle, this.postRARPath, 0.4 / this.stateDuration, dt
            );

            // Flash output cores
            this._flashComponent('outputCores', t);
        }

        if (this.stateTimer >= this.stateDuration) {
            this._transitionTo(STATES.STORING);
        }
    }

    // STORING: Write to VoltDB T0
    _updateStoring(dt) {
        this.stateTimer += dt;
        const t = this.stateTimer / this.stateDuration;

        // Brief store flash
        this._flashComponent('voltDB', t);

        if (this.stateTimer >= this.stateDuration) {
            this._transitionTo(STATES.COMPLETE);
        }
    }

    // COMPLETE: Recycle particle, optionally restart
    _updateComplete(dt) {
        if (this.activeParticle) {
            this.particleSystem.recycle(this.activeParticle);
            this.activeParticle = null;
        }

        if (this.onComplete) this.onComplete();

        if (this.continuous) {
            // Brief delay before next run
            this.stateTimer += dt;
            if (this.stateTimer >= 1.5) {
                this._transitionTo(STATES.IDLE);
                this.start();
            }
        } else {
            this._transitionTo(STATES.IDLE);
        }
    }

    // === STATE TRANSITION ===

    _transitionTo(newState) {
        const oldState = this.state;
        this.state = newState;
        this.stateTimer = 0;

        // Set duration for the new state
        switch (newState) {
            case STATES.TRANSLATING:
                this.stateDuration = ANIM.translateDuration;
                break;
            case STATES.PREFETCHING:
                this.stateDuration = ANIM.prefetchDuration;
                break;
            case STATES.RAR_LOOP:
                // Duration managed by RARLoopAnimator internally
                this.stateDuration = Infinity;
                if (this.activeParticle) {
                    this.rarAnimator.start(this.activeParticle);
                }
                break;
            case STATES.CPU_ROUTING:
                this.stateDuration = ANIM.cpuRoutingDuration;
                break;
            case STATES.CPU_EXECUTING:
                this.stateDuration = ANIM.cpuExecuteDuration;
                break;
            case STATES.CPU_SAFETY:
                this.stateDuration = ANIM.cpuSafetyDuration;
                break;
            case STATES.DECODING:
                this.stateDuration = ANIM.decodeDuration;
                break;
            case STATES.STORING:
                this.stateDuration = ANIM.storeDuration;
                break;
            case STATES.COMPLETE:
                this.stateDuration = Infinity;
                break;
            default:
                this.stateDuration = Infinity;
        }

        if (this.onStateChange) {
            this.onStateChange(newState, oldState);
        }
    }

    // === VISUAL FEEDBACK HELPERS ===

    // Temporarily brighten a component group
    _flashComponent(name, t) {
        const group = this.components?.[name];
        if (!group) return;

        const flash = Math.sin(t * Math.PI) * 0.3;
        group.traverse((child) => {
            if (child.isMesh && child.material && child.material.emissiveIntensity !== undefined) {
                // Store original if not saved
                if (child.userData._origEmissive === undefined) {
                    child.userData._origEmissive = child.material.emissiveIntensity;
                }
                child.material.emissiveIntensity = child.userData._origEmissive + flash;
            }
        });
    }

    // Animate Intent Router rings
    _animateIntentRouter(t) {
        const cpu = this.components?.cpuHardCore;
        if (!cpu) return;

        cpu.traverse((child) => {
            if (child.isGroup && child.children.length > 0) {
                // Find the router hub (cylinder at center)
                child.traverse((sub) => {
                    if (sub.isMesh && sub.geometry?.type === 'TorusGeometry') {
                        // Pulse the cosine similarity rings
                        const pulse = Math.sin(t * Math.PI * 4) * 0.3;
                        if (sub.material) {
                            sub.material.opacity = Math.min(1, 0.3 + pulse);
                        }
                    }
                });
            }
        });
    }

    // Flash a specific Hard Strand chip
    _flashStrandChip(strandName, t) {
        const cpu = this.components?.cpuHardCore;
        if (!cpu) return;

        cpu.traverse((child) => {
            if (child.userData?.type === 'hardStrand' && child.userData.name === strandName) {
                // Find the indicator sphere
                child.traverse((sub) => {
                    if (sub.isMesh && sub.geometry?.type === 'SphereGeometry') {
                        const pulse = 0.5 + Math.sin(t * Math.PI * 6) * 0.5;
                        sub.material.emissiveIntensity = pulse;
                    }
                });
            }
        });
    }

    // Flash safety pillars one by one
    _flashSafetyPillars(t) {
        const cpu = this.components?.cpuHardCore;
        if (!cpu) return;

        // Find the Omega Veto dome and flash it briefly
        cpu.traverse((child) => {
            if (child.userData?.type === 'omegaVeto') {
                // Quick flash at the end of safety check (pass)
                if (t > 0.8) {
                    child.material.opacity = 0.05 + (t - 0.8) * 0.5;
                    child.material.color.setHex(0x10b981); // Green = pass
                } else {
                    child.material.opacity = 0.05;
                    child.material.color.setHex(0x4a1010); // Dormant
                }
            }
        });
    }

    // === PUBLIC GETTERS ===

    getState() {
        return {
            state: this.state,
            stateTimer: this.stateTimer,
            stateDuration: this.stateDuration,
            progress: this.stateDuration === Infinity ? 0 : this.stateTimer / this.stateDuration,
            speedMultiplier: this.speedMultiplier,
            paused: this.paused,
            continuous: this.continuous,
            rarState: this.rarAnimator.getState(),
            activeParticleCount: this.particleSystem.getActiveParticles().length,
        };
    }

    getStateName() {
        const labels = {
            [STATES.IDLE]: 'Idle',
            [STATES.TRANSLATING]: 'Translating Input',
            [STATES.PREFETCHING]: 'Prefetching Memory',
            [STATES.RAR_LOOP]: 'RAR Loop',
            [STATES.CPU_ROUTING]: 'Intent Routing',
            [STATES.CPU_EXECUTING]: 'Hard Strand Executing',
            [STATES.CPU_SAFETY]: 'Safety Check',
            [STATES.DECODING]: 'Decoding Output',
            [STATES.STORING]: 'Storing to VoltDB',
            [STATES.COMPLETE]: 'Complete',
        };

        let label = labels[this.state] || this.state;

        // Add RAR detail
        if (this.state === STATES.RAR_LOOP) {
            const rar = this.rarAnimator.getState();
            label += ` — Iter ${rar.iteration}/${rar.maxIterations} (${rar.phase}) [${rar.convergedCount}/16 converged]`;
        }

        return label;
    }

    dispose() {
        this.rarAnimator.dispose();
    }
}
