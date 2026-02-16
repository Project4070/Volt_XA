// Volt Architecture Visualization — Configuration Constants

// === COLOR PALETTE ===
export const COLORS = {
    // Background
    background: 0x06060f,
    gridFloor: 0x1a1a2e,
    gridLines: 0x2a2a44,

    // Layer colors
    externalWorld: 0xe2e8f0,
    inputTranslators: 0x22d3ee,
    lllBus: 0xf59e0b,
    gpuSoftCore: 0x3b82f6,
    gpuSoftCoreAccent: 0x22d3ee,
    cpuHardCore: 0xf59e0b,
    cpuHardCoreAccent: 0xf97316,
    safety: 0xef4444,
    voltDB: 0xec4899,
    outputCores: 0x10b981,
    continualLearning: 0x059669,
    intelligenceCommons: 0xf97316,
    uiTestBench: 0xe2e8f0,
    socketStandard: 0xb45309,

    // RAR sectors
    rarRoot: 0x3b82f6,
    rarAttend: 0x22d3ee,
    rarRefine: 0x1e3a5f,

    // HDC helix strands
    hdcBind: 0x3b82f6,
    hdcSuperpose: 0x10b981,
    hdcPermute: 0xf59e0b,
    hdcUnbind: 0xef4444,

    // Safety pillars
    safetyPillar: 0xef4444,
    omegaVetoDormant: 0x4a1010,
    omegaVetoActive: 0xff0000,

    // Tensor Frame
    tensorFrameCore: 0xffffff,
    tensorFrameTrail: 0x8888ff,

    // Labels
    labelText: 0xe2e8f0,
    labelDim: 0x64748b,
};

// Certainty gamma to HSL: 0=red(0), 0.5=yellow(60), 1.0=green(120)
export function gammaToColor(gamma) {
    const h = gamma * 120;
    const s = 100;
    const l = 30 + gamma * 40;
    return `hsl(${h}, ${s}%, ${l}%)`;
}

export function gammaToHex(gamma) {
    const h = gamma * 120 / 360;
    const s = 1.0;
    const l = 0.3 + gamma * 0.4;
    // HSL to RGB
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = l - c / 2;
    let r, g, b;
    const hue6 = h * 6;
    if (hue6 < 1) { r = c; g = x; b = 0; }
    else if (hue6 < 2) { r = x; g = c; b = 0; }
    else if (hue6 < 3) { r = 0; g = c; b = x; }
    else if (hue6 < 4) { r = 0; g = x; b = c; }
    else if (hue6 < 5) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    const ri = Math.round((r + m) * 255);
    const gi = Math.round((g + m) * 255);
    const bi = Math.round((b + m) * 255);
    return (ri << 16) | (gi << 8) | bi;
}

// === SPATIAL LAYOUT ===
export const LAYOUT = {
    // Y positions for each layer (generous 30-unit gaps to prevent overlap)
    externalWorld:       { y: 120, z: 0 },
    inputTranslators:    { y: 95,  z: 0 },
    lllBusTop:           { y: 105, z: 0 },
    lllBusBottom:        { y: -145,z: 0 },
    gpuSoftCore:         { y: 60,  z: 0 },
    cpuHardCore:         { y: 28,  z: 0 },
    voltDB:              { y: -5,  z: 0 },
    outputCores:         { y: -38, z: 0 },
    continualLearning:   { y: -65, z: 0 },
    intelligenceCommons: { y: -92, z: 0 },
    uiTestBench:         { y: -116,z: 0 },
    socketStandard:      { y: -140,z: 0 },

    // Spacing
    layerGap: 30,
    busRadius: 2,
    busBranchRadius: 0.4,
};

// === SIZES ===
export const SIZES = {
    // Tensor Frame exhibit
    tensorSlotCube: 0.3,
    tensorExhibitSpacing: 0.5,
    tensorParticleRadius: 0.5,

    // Component dimensions (scaled to fit 30-unit layer gaps)
    translatorFunnelTopRadius: 3,
    translatorFunnelBottomRadius: 1.2,
    translatorFunnelHeight: 8,

    rarTorusMajorRadius: 10,
    rarTorusMinorRadius: 2.5,

    motherboardWidth: 22,
    motherboardDepth: 18,
    motherboardHeight: 0.4,
    strandChipSize: 2.2,

    voltdbPlatformWidth: 20,
    voltdbT0Width: 10,
    voltdbT1Width: 16,
    voltdbT2Width: 22,
    voltdbTierGap: 4,

    outputPipeRadius: 1.2,
    outputPipeHeight: 6,

    learningOrbitRadii: [4, 8, 12],

    commonsNodeRadius: 0.8,
    commonsSpread: 14,

    socketWidth: 6,
    socketHeight: 1.5,
    socketDepth: 4,
};

// === ANIMATION ===
export const ANIM = {
    // Pipeline state durations (seconds)
    translateDuration: 2.0,
    prefetchDuration: 1.5,
    rarIterationDuration: 3.0,
    cpuRoutingDuration: 1.5,
    cpuExecuteDuration: 2.0,
    cpuSafetyDuration: 1.0,
    decodeDuration: 2.0,
    storeDuration: 0.5,

    // RAR specifics
    maxRarIterations: 8,
    convergenceEpsilon: 0.01,
    defaultSlotConvergeIteration: [2, 3, 3, 5, 5, 6, 6, 7, 8, 4, 4, 5, 6, 7, 7, 8],

    // Particle
    particlePoolSize: 200,
    trailLength: 20,
    trailFadeRate: 0.05,

    // Ambient speeds
    helixParticleSpeed: 0.5,
    energyUndulationSpeed: 0.3,
    ghostDriftSpeed: 0.1,
    safetyBeamSpeed: 1.0,
    learningOrbitSpeeds: [2.0, 0.5, 0.1],

    // Camera
    cameraSpringStiffness: 3.0,
    cameraMoveSpeed: 20.0,
    cameraLookSensitivity: 0.002,
    autoTourDuration: 90,
};

// === CAMERA ===
export const CAMERA = {
    fov: 60,
    near: 0.1,
    far: 800,
    startPosition: { x: 0, y: 40, z: 100 },
    startLookAt: { x: 0, y: -10, z: 0 },

    // Per-layer focus positions (matched to new LAYOUT Y values)
    layerFocus: {
        overview:     { pos: { x: 0, y: 40, z: 100 },  lookAt: { x: 0, y: -10, z: 0 } },
        translators:  { pos: { x: 0, y: 98, z: 30 },   lookAt: { x: 0, y: 95, z: 0 } },
        bus:          { pos: { x: 18, y: 30, z: 18 },   lookAt: { x: 0, y: -20, z: 0 } },
        gpuSoftCore:  { pos: { x: 20, y: 65, z: 22 },   lookAt: { x: 0, y: 60, z: 0 } },
        cpuHardCore:  { pos: { x: 20, y: 34, z: 25 },   lookAt: { x: 0, y: 28, z: 0 } },
        voltDB:       { pos: { x: 20, y: 2, z: 25 },    lookAt: { x: 0, y: -5, z: 0 } },
        outputCores:  { pos: { x: 15, y: -32, z: 22 },  lookAt: { x: 0, y: -38, z: 0 } },
        learning:     { pos: { x: 18, y: -58, z: 22 },  lookAt: { x: 0, y: -65, z: 0 } },
        commons:      { pos: { x: 18, y: -86, z: 22 },  lookAt: { x: 0, y: -92, z: 0 } },
        ui:           { pos: { x: 14, y: -110, z: 18 }, lookAt: { x: 0, y: -116, z: 0 } },
        sockets:      { pos: { x: 14, y: -134, z: 18 }, lookAt: { x: 0, y: -140, z: 0 } },
    },
};

// === LOD THRESHOLDS ===
export const LOD = {
    highDistance: 20,
    mediumDistance: 60,
};
