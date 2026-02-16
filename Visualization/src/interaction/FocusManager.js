import * as THREE from 'three';

// Manages component focus: when a component is clicked, smooth fly-to it,
// dim all other components to 30% opacity, and show info panel.

export class FocusManager {
    constructor(flyCamera) {
        this.flyCamera = flyCamera;
        this.focusedComponent = null;
        this.allComponents = [];
        this.dimOpacity = 0.3;
        this.originalMaterials = new Map(); // mesh -> { opacity, transparent }

        // Callbacks
        this.onFocus = null;   // (component) => {}
        this.onUnfocus = null; // () => {}
    }

    setComponents(components) {
        this.allComponents = Object.values(components).filter(c => c && c.isObject3D);
    }

    // Focus on a component: fly to it, dim others
    focus(component) {
        if (this.focusedComponent === component) {
            this.unfocus();
            return;
        }

        this.unfocus(); // Clear previous focus first
        this.focusedComponent = component;

        // Dim all other components
        for (const comp of this.allComponents) {
            if (comp === component) continue;
            this._dimComponent(comp);
        }

        // Fly camera to the component
        if (component.userData?.type) {
            const focus = this._getFocusPosition(component);
            if (focus) {
                this.flyCamera.flyTo(focus.pos, focus.lookAt);
            }
        }

        if (this.onFocus) this.onFocus(component);
    }

    // Remove focus: restore all components
    unfocus() {
        if (!this.focusedComponent) return;

        // Restore all dimmed components
        for (const [mesh, original] of this.originalMaterials) {
            if (mesh.material) {
                mesh.material.opacity = original.opacity;
                mesh.material.transparent = original.transparent;
            }
        }
        this.originalMaterials.clear();
        this.focusedComponent = null;

        if (this.onUnfocus) this.onUnfocus();
    }

    _dimComponent(component) {
        component.traverse((child) => {
            if (child.isMesh && child.material) {
                // Save original state
                if (!this.originalMaterials.has(child)) {
                    this.originalMaterials.set(child, {
                        opacity: child.material.opacity,
                        transparent: child.material.transparent,
                    });
                }

                // Dim
                child.material.transparent = true;
                child.material.opacity = Math.min(child.material.opacity, this.dimOpacity);
            }
        });
    }

    _getFocusPosition(component) {
        // Compute bounding box center for the component
        const box = new THREE.Box3().setFromObject(component);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        // Position camera at a comfortable distance
        const distance = maxDim * 1.5 + 10;

        return {
            pos: { x: center.x + distance * 0.5, y: center.y + distance * 0.3, z: center.z + distance * 0.7 },
            lookAt: { x: center.x, y: center.y, z: center.z },
        };
    }

    isFocused() {
        return this.focusedComponent !== null;
    }
}
