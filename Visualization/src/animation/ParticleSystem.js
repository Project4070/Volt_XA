import * as THREE from 'three';
import { ANIM, COLORS, gammaToHex } from '../config.js';
import { createTensorFrameParticle, updateParticleTrail } from '../components/TensorFrame.js';

// Pool of reusable Tensor Frame particles

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.pool = [];
        this.active = [];
        this.maxActive = 5;

        // Pre-allocate particle pool
        for (let i = 0; i < 20; i++) {
            const particle = createTensorFrameParticle(0.5);
            particle.visible = false;
            scene.add(particle);
            this.pool.push(particle);
        }
    }

    // Get an available particle from the pool
    spawn(position, gamma = 0.5) {
        let particle;

        if (this.pool.length > 0) {
            particle = this.pool.pop();
        } else if (this.active.length > 0) {
            // Recycle oldest active particle
            particle = this.active.shift();
        } else {
            return null;
        }

        particle.visible = true;
        particle.position.copy(position);
        particle.userData.gamma = gamma;
        particle.userData.trail = [];
        particle.userData.state = 'moving';
        particle.userData.pathProgress = 0;
        particle.userData.iteration = 0;

        // Reset slot gammas with some variation
        const slotGammas = [];
        for (let i = 0; i < 16; i++) {
            slotGammas.push(Math.max(0, Math.min(1, gamma + (Math.random() - 0.5) * 0.4)));
        }
        particle.userData.slotGammas = slotGammas;

        this.active.push(particle);
        return particle;
    }

    // Return a particle to the pool
    recycle(particle) {
        particle.visible = false;
        particle.userData.trail = [];
        particle.userData.state = 'idle';
        const idx = this.active.indexOf(particle);
        if (idx !== -1) this.active.splice(idx, 1);
        this.pool.push(particle);
    }

    // Move a particle along a path
    moveAlongPath(particle, path, speed, deltaTime) {
        if (!particle || particle.userData.state !== 'moving') return false;

        particle.userData.pathProgress += speed * deltaTime;

        if (particle.userData.pathProgress >= 1) {
            particle.userData.pathProgress = 1;
            return true; // Reached end
        }

        const point = path.getPointAt(particle.userData.pathProgress);
        particle.position.copy(point);

        // Update trail
        updateParticleTrail(particle);

        return false;
    }

    // Update all active particles (called each frame)
    update(deltaTime) {
        for (const particle of this.active) {
            if (particle.visible) {
                // Gentle rotation for visual interest
                particle.rotation.y += deltaTime * 0.5;

                // Pulse the halo
                if (particle.userData.haloMaterial) {
                    const pulse = Math.sin(performance.now() * 0.003) * 0.05;
                    particle.userData.haloMaterial.opacity = 0.15 + particle.userData.gamma * 0.2 + pulse;
                }
            }
        }
    }

    getActiveParticles() {
        return this.active;
    }
}
