import { ANIM } from '../config.js';

// Per-slot convergence animation tracker

const SLOT_ROLES = [
    'AGENT', 'PREDICATE', 'PATIENT', 'LOCATION', 'TIME',
    'MANNER', 'INSTRUMENT', 'CAUSE', 'RESULT',
    'FREE_0', 'FREE_1', 'FREE_2', 'FREE_3', 'FREE_4', 'FREE_5', 'FREE_6'
];

export class ConvergenceVisualizer {
    constructor() {
        this.slots = [];
        this.currentIteration = 0;
        this.maxIterations = ANIM.maxRarIterations;

        // Initialize slot states
        for (let i = 0; i < 16; i++) {
            this.slots.push({
                index: i,
                role: SLOT_ROLES[i],
                converged: false,
                convergenceIteration: ANIM.defaultSlotConvergeIteration[i],
                progress: 0, // 0 to 1
                gamma: 0.3 + Math.random() * 0.4,
            });
        }
    }

    reset() {
        this.currentIteration = 0;
        for (const slot of this.slots) {
            slot.converged = false;
            slot.progress = 0;
            slot.gamma = 0.3 + Math.random() * 0.4;
        }
    }

    // Advance one RAR iteration
    iterate() {
        this.currentIteration++;

        for (const slot of this.slots) {
            if (slot.converged) continue;

            // Progress toward convergence
            slot.progress = Math.min(1, this.currentIteration / slot.convergenceIteration);

            // Check convergence
            if (this.currentIteration >= slot.convergenceIteration) {
                slot.converged = true;
                slot.progress = 1;
                slot.gamma = 0.7 + Math.random() * 0.3;
            }
        }

        return this.isFullyConverged();
    }

    isFullyConverged() {
        return this.slots.every(s => s.converged);
    }

    getActiveSlotCount() {
        return this.slots.filter(s => !s.converged).length;
    }

    getConvergedSlotCount() {
        return this.slots.filter(s => s.converged).length;
    }

    getGlobalGamma() {
        const filledSlots = this.slots.filter(s => s.converged);
        if (filledSlots.length === 0) return 0;
        return Math.min(...filledSlots.map(s => s.gamma));
    }

    getSlotStates() {
        return this.slots.map(s => ({
            ...s,
            active: !s.converged && this.currentIteration > 0,
        }));
    }
}
