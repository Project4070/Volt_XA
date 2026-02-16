import { LAYOUT } from '../config.js';

// World-space positions for all layers
// Returns an object mapping component names to { x, y, z } positions

export function getLayerPositions() {
    return {
        externalWorld:       { x: 0, y: LAYOUT.externalWorld.y,       z: 0 },
        inputTranslators:    { x: 0, y: LAYOUT.inputTranslators.y,    z: 0 },
        lllBus:              { x: 0, y: (LAYOUT.lllBusTop.y + LAYOUT.lllBusBottom.y) / 2, z: 0 },
        gpuSoftCore:         { x: 0, y: LAYOUT.gpuSoftCore.y,         z: 0 },
        cpuHardCore:         { x: 0, y: LAYOUT.cpuHardCore.y,         z: 0 },
        voltDB:              { x: 0, y: LAYOUT.voltDB.y,              z: 0 },
        outputCores:         { x: 0, y: LAYOUT.outputCores.y,         z: 0 },
        continualLearning:   { x: 0, y: LAYOUT.continualLearning.y,   z: 0 },
        intelligenceCommons: { x: 0, y: LAYOUT.intelligenceCommons.y, z: 0 },
        uiTestBench:         { x: 0, y: LAYOUT.uiTestBench.y,         z: 0 },
        socketStandard:      { x: 0, y: LAYOUT.socketStandard.y,      z: 0 },
    };
}

// LLL Bus spans from top to bottom
export function getBusExtent() {
    return {
        top: LAYOUT.lllBusTop.y,
        bottom: LAYOUT.lllBusBottom.y,
        height: LAYOUT.lllBusTop.y - LAYOUT.lllBusBottom.y,
    };
}
