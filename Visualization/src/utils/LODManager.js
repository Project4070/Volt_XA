import * as THREE from 'three';
import { LOD } from '../config.js';

// Three-tier Level of Detail manager.
// HIGH (<20 units): full detail — all inner meshes visible
// MEDIUM (20-60 units): simplified — hide small decorative elements
// LOW (>60 units): bounding box — only main shape + label visible
//
// Walks each component group every N frames and toggles child visibility
// based on camera distance.

const UPDATE_INTERVAL = 10; // frames between LOD checks

export class LODManager {
    constructor(camera) {
        this.camera = camera;
        this.components = [];
        this.frameCount = 0;
    }

    // Register a component group for LOD management
    // Each entry: { group, center (Vector3), children categorized by LOD tier }
    register(group) {
        if (!group || !group.isObject3D) return;

        const entry = {
            group: group,
            currentLevel: 'high',
            // Categorize children by importance
            highOnly: [],    // Only visible at HIGH
            mediumUp: [],    // Visible at MEDIUM and HIGH
            alwaysVisible: [], // Always visible (main shapes, labels)
        };

        this._categorizeChildren(group, entry);
        this.components.push(entry);
    }

    // Register all components from the scene builder
    registerAll(components) {
        for (const key in components) {
            const comp = components[key];
            if (comp && comp.isObject3D) {
                this.register(comp);
            }
        }
    }

    update() {
        this.frameCount++;
        if (this.frameCount % UPDATE_INTERVAL !== 0) return;

        const cameraPos = this.camera.position;

        for (const entry of this.components) {
            const box = new THREE.Box3().setFromObject(entry.group);
            const center = box.getCenter(new THREE.Vector3());
            const distance = cameraPos.distanceTo(center);

            let level;
            if (distance < LOD.highDistance) {
                level = 'high';
            } else if (distance < LOD.mediumDistance) {
                level = 'medium';
            } else {
                level = 'low';
            }

            if (level !== entry.currentLevel) {
                this._applyLevel(entry, level);
                entry.currentLevel = level;
            }
        }
    }

    _categorizeChildren(group, entry) {
        group.traverse((child) => {
            if (child === group) return;

            // Skip CSS2DObjects (labels) — always visible
            if (child.isCSS2DObject) {
                entry.alwaysVisible.push(child);
                return;
            }

            if (!child.isMesh && !child.isLine && !child.isPoints) return;

            // Heuristic categorization:
            // - Very small geometries (< 0.5 bounding radius) → highOnly
            // - Wireframe overlays → highOnly
            // - Circuit traces, small indicators → highOnly
            // - Main platforms, torus sectors, big shapes → alwaysVisible
            // - Mid-size elements → mediumUp

            const isWireframe = child.material?.wireframe;
            const isSmall = this._isSmallMesh(child);
            const isLabel = child.userData?.type === 'annotation';

            if (isWireframe || isSmall || isLabel) {
                entry.highOnly.push(child);
            } else if (this._isMediumMesh(child)) {
                entry.mediumUp.push(child);
            } else {
                entry.alwaysVisible.push(child);
            }
        });
    }

    _isSmallMesh(mesh) {
        if (!mesh.geometry) return false;
        mesh.geometry.computeBoundingSphere();
        const sphere = mesh.geometry.boundingSphere;
        return sphere && sphere.radius < 0.5;
    }

    _isMediumMesh(mesh) {
        if (!mesh.geometry) return false;
        mesh.geometry.computeBoundingSphere();
        const sphere = mesh.geometry.boundingSphere;
        return sphere && sphere.radius < 2.0;
    }

    _applyLevel(entry, level) {
        switch (level) {
            case 'high':
                // Everything visible
                for (const child of entry.highOnly) child.visible = true;
                for (const child of entry.mediumUp) child.visible = true;
                for (const child of entry.alwaysVisible) child.visible = true;
                break;

            case 'medium':
                // Hide high-only details
                for (const child of entry.highOnly) child.visible = false;
                for (const child of entry.mediumUp) child.visible = true;
                for (const child of entry.alwaysVisible) child.visible = true;
                break;

            case 'low':
                // Only main shapes and labels
                for (const child of entry.highOnly) child.visible = false;
                for (const child of entry.mediumUp) child.visible = false;
                for (const child of entry.alwaysVisible) child.visible = true;
                break;
        }
    }
}
