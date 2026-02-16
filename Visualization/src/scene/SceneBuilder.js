import { createTensorFrameExhibit } from '../components/TensorFrame.js';
import { createLLLVectorBus, updateBusAnimation } from '../components/LLLVectorBus.js';
import { createInputTranslators } from '../components/InputTranslators.js';
import { createGPUSoftCore, updateGPUSoftCore } from '../components/GPUSoftCore.js';
import { createCPUHardCore, updateCPUHardCore } from '../components/CPUHardCore.js';
import { createVoltDB } from '../components/VoltDB.js';
import { createOutputActionCores } from '../components/OutputActionCores.js';
import { createContinualLearning, updateContinualLearning } from '../components/ContinualLearning.js';
import { createIntelligenceCommons } from '../components/IntelligenceCommons.js';
import { createUITestBench } from '../components/UITestBench.js';
import { createSocketStandard } from '../components/SocketStandard.js';
import { LAYOUT } from '../config.js';

// All component groups stored for animation updates
const components = {};

export function buildScene(scene) {
    // Tensor Frame exhibit (positioned near the bus, between layers 1 and 3)
    const tensorExhibit = createTensorFrameExhibit({ x: 18, y: 78, z: 0 });
    scene.add(tensorExhibit);
    components.tensorExhibit = tensorExhibit;

    // Layer 2: LLL Vector Bus (central spine)
    components.lllBus = createLLLVectorBus(scene);

    // Layer 1: Input Translators
    components.inputTranslators = createInputTranslators(scene);

    // Layer 3: GPU Soft Core (RAR Loop)
    components.gpuSoftCore = createGPUSoftCore(scene);

    // Layer 4: CPU Hard Core
    components.cpuHardCore = createCPUHardCore(scene);

    // Layer 5: VoltDB
    components.voltDB = createVoltDB(scene);

    // Layer 6: Output Action Cores
    components.outputCores = createOutputActionCores(scene);

    // Layer 7: Continual Learning
    components.continualLearning = createContinualLearning(scene);

    // Layer 8: Intelligence Commons
    components.intelligenceCommons = createIntelligenceCommons(scene);

    // Layer 9: UI / Test Bench
    components.uiTestBench = createUITestBench(scene);

    // Layer 10: Socket Standard
    components.socketStandard = createSocketStandard(scene);

    return components;
}

// Update all ambient animations (called each frame)
export function updateScene(elapsed) {
    if (components.lllBus) updateBusAnimation(components.lllBus, elapsed);
    if (components.gpuSoftCore) updateGPUSoftCore(components.gpuSoftCore, elapsed);
    if (components.cpuHardCore) updateCPUHardCore(components.cpuHardCore, elapsed);
    if (components.continualLearning) updateContinualLearning(components.continualLearning, elapsed);
}

export function getComponents() {
    return components;
}
