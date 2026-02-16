// HTML overlay panel that shows technical details for the focused component.
// Creates/manages a floating panel with component name, layer badge,
// description, formulas, and connection info.

const COMPONENT_INFO = {
    inputTranslators: {
        layer: 1,
        name: 'Input Translators',
        color: '#22d3ee',
        description: 'Convert raw modality inputs into Tensor Frames. Text translator uses a frozen LLM backbone (~1-7B params) with a trainable Frame Projection Head (~50M params) and VQ-VAE slot quantization.',
        details: [
            'Text: Frozen LLM → Projection Head → 16 Slot Channels',
            '5 Community Translators: Vision, Audio, Data, Sensor, OS',
            'VQ-VAE quantization: continuous → discrete codebook vectors',
            'Output: Sparse Tensor Frame F ∈ R^[16×4×256]',
        ],
        connections: { receives: 'External World', sends: 'LLL Vector Bus → GPU Soft Core' },
    },
    lllBus: {
        layer: 2,
        name: 'LLL Vector Bus',
        color: '#f59e0b',
        description: 'Central data spine carrying Tensor Frames between all layers using Hyperdimensional Computing (HDC) operations: Bind, Superpose, Permute, Unbind.',
        details: [
            '4 HDC Operations: Bind (FFT), Superpose (sum), Permute (shift), Unbind (FFT⁻¹)',
            'Codebook: 65,536 concept prototype vectors',
            'd = 256 dimensions per vector',
            'Branch conduits to all layers',
        ],
        connections: { receives: 'All Layers', sends: 'All Layers' },
    },
    gpuSoftCore: {
        layer: 3,
        name: 'GPU Soft Core — RAR Loop',
        color: '#3b82f6',
        description: 'Root-Attend-Refine iterative loop on GPU. 16 parallel VFN passes per slot, 16×16 cross-slot attention, progressive convergence with per-slot freezing. ~25M FLOPs/query — 36M× less than GPT-4.',
        details: [
            'ROOT: 16 parallel VFN (Vector Field Network) passes with denoising diffusion',
            'ATTEND: 16×16 attention matrix A_ij + ~1000 Ghost Frame gists',
            'REFINE: ε-convergence check, progressive slot freezing',
            'Budget: max 12 iterations, early-exit on full convergence',
            'Energy landscape: f_θ = -∇E with attractor basins',
        ],
        connections: { receives: 'LLL Bus (Tensor Frame)', sends: 'CPU Hard Core (converged Frame)' },
    },
    cpuHardCore: {
        layer: 4,
        name: 'CPU Hard Core',
        color: '#f59e0b',
        description: 'System 2 sequential processing with 10 specialized Hard Strands. Intent Router dispatches via cosine similarity. Safety Layer enforces 5 axiomatic invariants with hardware Omega Veto.',
        details: [
            'Intent Router: cosine similarity → best strand match',
            '10 Strands: Math, Code, API, HDC, Certainty, Proof, Causal, Ledger, Sleep, Mirror',
            'Safety: K1-K5 invariants (no harm, no CSAM, no WMD, no fraud, acknowledge AI)',
            'Omega Veto: hardware interrupt, cannot be overridden by software',
        ],
        connections: { receives: 'GPU Soft Core', sends: 'VoltDB + Output Cores' },
    },
    voltDB: {
        layer: 5,
        name: 'VoltDB — Three-Tier Memory',
        color: '#ec4899',
        description: 'Three-tier memory engine: T0 (GPU VRAM, 64 frames), T1 (RAM, ~500K frames with LSM-Tree + HNSW), T2 (NVMe, millions compressed with GC pipeline).',
        details: [
            'T0: 64-slot ring buffer + Ghost Bleed Buffer for R₀ gists',
            'T1: LSM-Tree indexing, HNSW approximate nearest neighbor, B-tree range queries',
            'T2: rkyv zero-copy serialization, GC: Full(64KB)→Compressed(8KB)→Gist(1KB)→Tombstone(32B)',
            'Prefetch T1→T0 ~2ms, Recall T2→T0 ~10-50ms',
        ],
        connections: { receives: 'CPU Hard Core + RAR Ghost reads', sends: 'RAR prefetch + Output' },
    },
    outputCores: {
        layer: 6,
        name: 'Output Action Cores',
        color: '#10b981',
        description: '6 parallel output channels that decode Tensor Frames into actions simultaneously. All 16 slots decode in parallel — the key insight is parallel, not sequential generation.',
        details: [
            'Text: Multi-token parallel decode',
            'Speech: Vocoder synthesis',
            'Image: Diffusion-based generation',
            'Motor: Robotic action vectors',
            'n8n: Workflow automation triggers',
            'Ledger: Blockchain transaction signing',
        ],
        connections: { receives: 'CPU Hard Core', sends: 'External World' },
    },
    continualLearning: {
        layer: 7,
        name: 'Continual Learning',
        color: '#059669',
        description: 'Three nested timescale learning loops: Instant (ms, online gradient), Sleep (hours, offline VFN replay + consolidation), Developmental (days-months, VFN evolution + strand creation).',
        details: [
            'Instant: Online gradient updates on active VFN parameters',
            'Sleep: Replay + consolidation, VFN layer-by-layer unfreezing',
            'Developmental: Architecture search, VFN depth evolution, strand splitting',
            'Spiral curriculum for progressive skill acquisition',
        ],
        connections: { receives: 'All inference signals', sends: 'VFN weights + VoltDB consolidation' },
    },
    intelligenceCommons: {
        layer: 8,
        name: 'Intelligence Commons',
        color: '#f97316',
        description: 'P2P network for sharing learned representations across Volt instances. L2 DAG for settlement and VOLT token incentives. Gossip protocol for model weight propagation.',
        details: [
            'P2P mesh with gossip-based weight sharing',
            'Merkle tree verification for model integrity',
            'L2 DAG settlement layer with VOLT tokens',
            'Federated learning with differential privacy',
        ],
        connections: { receives: 'Peer Volt instances', sends: 'Shared weights + rewards' },
    },
    uiTestBench: {
        layer: 9,
        name: 'UI / Test Bench',
        color: '#e2e8f0',
        description: 'n8n-compatible workflow interface for orchestrating Volt capabilities. Debug panel for inspecting Tensor Frame contents, RAR iteration traces, and memory state.',
        details: [
            'n8n workflow nodes: Chat Trigger → HTTP → Switch → Reply',
            'Visual workflow editor for complex multi-step tasks',
            'Debug panel: live Tensor Frame inspection',
            'Test harness for regression testing',
        ],
        connections: { receives: 'User input', sends: 'Pipeline trigger' },
    },
    socketStandard: {
        layer: 10,
        name: 'Socket Standard',
        color: '#b45309',
        description: 'Three Rust trait interfaces that define the extension API. Any module implementing these traits can be hot-plugged into the architecture.',
        details: [
            'TranslatorSocket: fn encode(&self, raw: &[u8]) → TensorFrame',
            'HardStrandSocket: fn execute(&self, frame: &TensorFrame) → StrandResult',
            'ActionCoreSocket: fn decode(&self, frame: &TensorFrame) → Action',
            'Hot-pluggable at runtime via dynamic dispatch',
        ],
        connections: { receives: 'Plugin modules', sends: 'Architecture integration' },
    },
};

export class InfoPanel {
    constructor() {
        this.panel = null;
        this.visible = false;
        this._createPanel();
    }

    _createPanel() {
        this.panel = document.createElement('div');
        this.panel.id = 'info-panel';
        this.panel.style.cssText = `
            display: none;
            position: absolute;
            top: 80px;
            right: 16px;
            width: 320px;
            max-height: calc(100vh - 120px);
            overflow-y: auto;
            background: rgba(15, 23, 42, 0.95);
            border: 1px solid #334155;
            border-radius: 10px;
            padding: 20px;
            font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
            font-size: 11px;
            line-height: 1.6;
            color: #94a3b8;
            z-index: 20;
            pointer-events: auto;
            backdrop-filter: blur(10px);
        `;

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '\u00D7';
        closeBtn.style.cssText = `
            position: absolute;
            top: 8px;
            right: 12px;
            background: none;
            border: none;
            color: #64748b;
            font-size: 18px;
            cursor: pointer;
            padding: 4px 8px;
        `;
        closeBtn.addEventListener('click', () => this.hide());
        this.panel.appendChild(closeBtn);

        // Content container
        this.content = document.createElement('div');
        this.panel.appendChild(this.content);

        document.getElementById('hud').appendChild(this.panel);
    }

    show(componentType) {
        const info = COMPONENT_INFO[componentType];
        if (!info) return;

        this.content.innerHTML = '';

        // Layer badge
        const badge = document.createElement('div');
        badge.style.cssText = `
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            color: ${info.color};
            border: 1px solid ${info.color}40;
            background: ${info.color}15;
            margin-bottom: 8px;
        `;
        badge.textContent = `Layer ${info.layer}`;
        this.content.appendChild(badge);

        // Name
        const name = document.createElement('h3');
        name.style.cssText = `
            color: #e2e8f0;
            font-size: 14px;
            font-weight: 600;
            margin: 4px 0 12px 0;
        `;
        name.textContent = info.name;
        this.content.appendChild(name);

        // Description
        const desc = document.createElement('p');
        desc.style.cssText = 'margin: 0 0 14px 0; color: #94a3b8;';
        desc.textContent = info.description;
        this.content.appendChild(desc);

        // Technical details
        const detailsHeader = document.createElement('div');
        detailsHeader.style.cssText = 'color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;';
        detailsHeader.textContent = 'Technical Details';
        this.content.appendChild(detailsHeader);

        const detailsList = document.createElement('ul');
        detailsList.style.cssText = 'margin: 0 0 14px 0; padding-left: 14px;';
        for (const detail of info.details) {
            const li = document.createElement('li');
            li.style.cssText = 'margin-bottom: 4px; color: #cbd5e1;';
            li.textContent = detail;
            detailsList.appendChild(li);
        }
        this.content.appendChild(detailsList);

        // Connections
        if (info.connections) {
            const connHeader = document.createElement('div');
            connHeader.style.cssText = 'color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;';
            connHeader.textContent = 'Connections';
            this.content.appendChild(connHeader);

            const connDiv = document.createElement('div');
            connDiv.style.cssText = 'font-size: 10px;';
            connDiv.innerHTML = `
                <div style="margin-bottom: 4px;">
                    <span style="color: #64748b;">Receives:</span>
                    <span style="color: #cbd5e1;">${info.connections.receives}</span>
                </div>
                <div>
                    <span style="color: #64748b;">Sends to:</span>
                    <span style="color: #cbd5e1;">${info.connections.sends}</span>
                </div>
            `;
            this.content.appendChild(connDiv);
        }

        this.panel.style.display = 'block';
        this.visible = true;
    }

    hide() {
        this.panel.style.display = 'none';
        this.visible = false;
    }

    toggle(componentType) {
        if (this.visible) {
            this.hide();
        } else {
            this.show(componentType);
        }
    }
}
