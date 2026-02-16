import * as THREE from 'three';

// Hover and click detection for scene components via raycasting.
// Detects which architecture component (layer group) the user is pointing at.

export class Raycaster {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredObject = null;

        // Callbacks
        this.onHover = null;      // (object, intersection) => {}
        this.onHoverEnd = null;   // (previousObject) => {}
        this.onClick = null;      // (object, intersection) => {}
        this.onDoubleClick = null; // (object, intersection) => {}

        // Intersection targets (populated by scene builder)
        this.targets = [];

        this._bindEvents();
    }

    setTargets(targets) {
        this.targets = targets;
    }

    _bindEvents() {
        this.domElement.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / this.domElement.clientWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / this.domElement.clientHeight) * 2 + 1;
        });

        this.domElement.addEventListener('click', (e) => {
            // Don't trigger on right-click
            if (e.button !== 0) return;

            const hit = this._cast();
            if (hit && this.onClick) {
                this.onClick(hit.object, hit);
            }
        });

        this.domElement.addEventListener('dblclick', (e) => {
            const hit = this._cast();
            if (hit && this.onDoubleClick) {
                this.onDoubleClick(hit.object, hit);
            }
        });
    }

    update() {
        const hit = this._cast();

        if (hit) {
            const obj = this._findComponentAncestor(hit.object);
            if (obj !== this.hoveredObject) {
                if (this.hoveredObject && this.onHoverEnd) {
                    this.onHoverEnd(this.hoveredObject);
                }
                this.hoveredObject = obj;
                if (this.onHover) {
                    this.onHover(obj, hit);
                }
            }
        } else if (this.hoveredObject) {
            if (this.onHoverEnd) {
                this.onHoverEnd(this.hoveredObject);
            }
            this.hoveredObject = null;
        }
    }

    _cast() {
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Raycast against all targets recursively
        const intersections = this.raycaster.intersectObjects(this.targets, true);

        if (intersections.length > 0) {
            return intersections[0];
        }
        return null;
    }

    // Walk up the scene graph to find the component group (has userData.type)
    _findComponentAncestor(object) {
        let current = object;
        while (current) {
            if (current.userData && current.userData.type) {
                return current;
            }
            current = current.parent;
        }
        return object;
    }
}
