import * as THREE from 'three';
import { ANIM, CAMERA } from '../config.js';

export class FlyCamera {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;

        // State
        this.enabled = true;
        this.isManual = true;
        this.isFollowing = false;

        // Movement
        this.velocity = new THREE.Vector3();
        this.moveSpeed = ANIM.cameraMoveSpeed;
        this.lookSensitivity = ANIM.cameraLookSensitivity;
        this.damping = 0.9;

        // Rotation (Euler angles in radians)
        this.pitch = 0;
        this.yaw = 0;

        // Input state
        this.keys = {};
        this.isRightMouseDown = false;
        this.prevMouseX = 0;
        this.prevMouseY = 0;

        // Spring target (for smooth fly-to)
        this.springTarget = null;
        this.springLookAt = null;
        this.springStiffness = ANIM.cameraSpringStiffness;

        // Initialize rotation from camera
        const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
        this.pitch = euler.x;
        this.yaw = euler.y;

        this._bindEvents();
    }

    _bindEvents() {
        this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

        this.domElement.addEventListener('mousedown', (e) => {
            if (e.button === 2) this.isRightMouseDown = true;
        });

        this.domElement.addEventListener('mouseup', (e) => {
            if (e.button === 2) this.isRightMouseDown = false;
        });

        this.domElement.addEventListener('mousemove', (e) => {
            if (this.isRightMouseDown && this.isManual && this.enabled) {
                const dx = e.movementX || (e.clientX - this.prevMouseX);
                const dy = e.movementY || (e.clientY - this.prevMouseY);

                this.yaw -= dx * this.lookSensitivity;
                this.pitch -= dy * this.lookSensitivity;
                this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
            }
            this.prevMouseX = e.clientX;
            this.prevMouseY = e.clientY;
        });

        this.domElement.addEventListener('wheel', (e) => {
            if (!this.enabled) return;
            this.moveSpeed = Math.max(5, Math.min(80, this.moveSpeed - e.deltaY * 0.05));
        });

        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;

            // Space: toggle auto-tour / manual
            if (e.key === ' ') {
                e.preventDefault();
                this.isManual = !this.isManual;
                if (this.isManual) {
                    this.springTarget = null;
                    this.springLookAt = null;
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    // Smooth fly to a target position and look-at point
    flyTo(position, lookAt) {
        this.springTarget = new THREE.Vector3(position.x, position.y, position.z);
        this.springLookAt = new THREE.Vector3(lookAt.x, lookAt.y, lookAt.z);
        this.isManual = false;
        this.isFollowing = false;
    }

    // Snap to a named focus preset from config
    focusOn(name) {
        const focus = CAMERA.layerFocus[name];
        if (focus) {
            this.flyTo(focus.pos, focus.lookAt);
        }
    }

    update(deltaTime) {
        if (!this.enabled) return;

        if (this.isManual) {
            this._updateManual(deltaTime);
        } else if (this.springTarget) {
            this._updateSpring(deltaTime);
        }
    }

    _updateManual(deltaTime) {
        // Build direction vectors from yaw
        const forward = new THREE.Vector3(
            -Math.sin(this.yaw) * Math.cos(this.pitch),
            Math.sin(this.pitch),
            -Math.cos(this.yaw) * Math.cos(this.pitch)
        );
        const right = new THREE.Vector3(
            Math.cos(this.yaw), 0, -Math.sin(this.yaw)
        );
        const up = new THREE.Vector3(0, 1, 0);

        // Accumulate input
        const accel = new THREE.Vector3();
        if (this.keys['w']) accel.add(forward);
        if (this.keys['s']) accel.sub(forward);
        if (this.keys['d']) accel.add(right);
        if (this.keys['a']) accel.sub(right);
        if (this.keys['e']) accel.add(up);
        if (this.keys['q']) accel.sub(up);

        if (accel.lengthSq() > 0) {
            accel.normalize().multiplyScalar(this.moveSpeed * deltaTime);
            this.velocity.add(accel);
        }

        // Apply damping
        this.velocity.multiplyScalar(this.damping);

        // Update position
        this.camera.position.add(this.velocity.clone().multiplyScalar(deltaTime * 60));

        // Apply rotation
        const quaternion = new THREE.Quaternion();
        quaternion.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
        this.camera.quaternion.copy(quaternion);
    }

    _updateSpring(deltaTime) {
        const stiffness = this.springStiffness * deltaTime;

        // Lerp position
        this.camera.position.lerp(this.springTarget, Math.min(stiffness, 1));

        // Lerp look-at via quaternion slerp
        const targetQuaternion = new THREE.Quaternion();
        const lookMatrix = new THREE.Matrix4();
        lookMatrix.lookAt(this.camera.position, this.springLookAt, new THREE.Vector3(0, 1, 0));
        targetQuaternion.setFromRotationMatrix(lookMatrix);
        this.camera.quaternion.slerp(targetQuaternion, Math.min(stiffness, 1));

        // Update euler from camera so manual mode picks up correctly
        const euler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
        this.pitch = euler.x;
        this.yaw = euler.y;

        // Check if arrived
        if (this.camera.position.distanceTo(this.springTarget) < 0.1) {
            // Stay in spring mode until user takes over (space key)
        }
    }
}
