import * as THREE from 'three';

// Reusable geometry and material constructors

// Emissive glowing material
export function createGlowMaterial(color, intensity = 0.5, opacity = 1.0) {
    return new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: intensity,
        transparent: opacity < 1.0,
        opacity: opacity,
        side: THREE.FrontSide,
    });
}

// Translucent glass-like material
export function createGlassMaterial(color, opacity = 0.3) {
    return new THREE.MeshPhysicalMaterial({
        color: color,
        transparent: true,
        opacity: opacity,
        roughness: 0.1,
        metalness: 0.0,
        side: THREE.DoubleSide,
    });
}

// Wireframe material
export function createWireframeMaterial(color, opacity = 0.5) {
    return new THREE.MeshBasicMaterial({
        color: color,
        wireframe: true,
        transparent: true,
        opacity: opacity,
    });
}

// Metallic material (for sockets, motherboard)
export function createMetallicMaterial(color) {
    return new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.8,
        roughness: 0.3,
    });
}

// Create a rounded box (using standard box + slight scale trick)
export function createRoundedBox(width, height, depth, material) {
    const geometry = new THREE.BoxGeometry(width, height, depth, 2, 2, 2);
    return new THREE.Mesh(geometry, material);
}

// Create a tapered cylinder (funnel shape)
export function createFunnel(topRadius, bottomRadius, height, material, segments = 32) {
    const geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments);
    return new THREE.Mesh(geometry, material);
}

// Create a torus
export function createTorus(majorRadius, minorRadius, material, radialSegments = 32, tubularSegments = 100) {
    const geometry = new THREE.TorusGeometry(majorRadius, minorRadius, radialSegments, tubularSegments);
    return new THREE.Mesh(geometry, material);
}

// Create a glowing sphere (for particles, nodes)
export function createGlowSphere(radius, color, emissiveIntensity = 0.8) {
    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const material = createGlowMaterial(color, emissiveIntensity);
    return new THREE.Mesh(geometry, material);
}

// Create a thin disc/platform
export function createPlatform(width, depth, height, material) {
    const geometry = new THREE.BoxGeometry(width, height, depth, 1, 1, 1);
    return new THREE.Mesh(geometry, material);
}

// Create a tube along a curve (for conduits, helices)
export function createTube(curve, radius, material, segments = 64, radialSegments = 8) {
    const geometry = new THREE.TubeGeometry(curve, segments, radius, radialSegments, false);
    return new THREE.Mesh(geometry, material);
}

// Create a line from points
export function createLine(points, color, opacity = 1.0) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
        color: color,
        transparent: opacity < 1.0,
        opacity: opacity,
    });
    return new THREE.Line(geometry, material);
}

// Create instanced mesh from a geometry
export function createInstancedMesh(geometry, material, count) {
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    return mesh;
}

// Create a helical curve
export function createHelicalCurve(radius, height, turns, pointsPerTurn = 32) {
    const points = [];
    const totalPoints = turns * pointsPerTurn;
    for (let i = 0; i <= totalPoints; i++) {
        const t = i / totalPoints;
        const angle = t * turns * Math.PI * 2;
        points.push(new THREE.Vector3(
            Math.cos(angle) * radius,
            t * height - height / 2,
            Math.sin(angle) * radius
        ));
    }
    return new THREE.CatmullRomCurve3(points);
}
