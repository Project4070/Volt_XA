# Volt XA Blueprint

## Stateful Operating System for Sovereign Intelligence

Date: 2026/2/15
Classification: AGPL v3.0 open source

---

# 1. Executive Summary

Volt is a cognitive architecture treating intelligence as a stateful operating system. It separates thinking from speaking, verification from generation, and memory from computation on consumer hardware.

**Five architectural problems of current AI and Volt's solutions:**

| Problem | Solution | Mechanism |
|---|---|---|
| Fixed lifespan (context window) | Unlimited memory | Three-tier storage with background bleeding |
| Conflated thinking/speaking | Silent reasoning | Root-Attend-Refine over Tensor Frame slots |
| Statelessness | Persistent strands | Tensor Frames in RAM, organized by strand |
| Centralized dependence | Consumer hardware | GPU+CPU split, freed from KV cache |
| Frozen knowledge | Inference is learning | Frame accumulation + consolidation + graduation |

# 2. Design Principles

1. **Thinking ≠ speaking.** Computation in structured latent space; language only at output boundary.
2. **Adaptive computation.** Iteration count emerges from problem difficulty, not prompting.
3. **Verifiable conclusions.** Certainty scores from convergence; high-confidence outputs carry auditable proof chains.
4. **Unbounded memory.** Working memory small; accessible memory grows with use; long-term bounded only by storage.
5. **Architectural safety.** Constraints as deterministic CPU code. Omega Veto: hardware interrupt, no bypass.
6. **Sovereign intelligence.** User hardware, user-owned memory. No cloud dependency.
7. **Open ecosystem.** Standardized Rust traits. Value distributed via proof-of-contribution.

**Paradigm shift:** Intelligence as a data management problem, not a compute problem. Constraint shifts from massive GPU to database engineering.

# 3. Architecture

## 3.1 Layers

| Layer | Name | Function |
|---|---|---|
| 0 | External World | Users, APIs, sensors, P2P mesh |
| 1 | Input Translators | Raw input → Tensor Frame |
| 2 | LLL Tensor Frame Bus | Structured data protocol connecting all components |
| 3 | GPU Soft Core | Neural intuition via SDE dynamics (RAR loop) |
| 4 | CPU Hard Core | Deterministic logic: tools, proofs, safety |
| 5 | VoltDB | Three-tier memory, indexing, GC |
| 6 | Output Action Cores | Tensor Frame → human-readable output |
| 7 | Continual Learning | Frame accumulation, consolidation, graduation |
| 8 | Intelligence Commons | Post-blockchain ledger for knowledge/module trading |
| 9 | UI / Test Bench | Debugging, chat, workflow orchestration |
| 10 | Socket Standard | Translator, HardStrand, ActionCore trait interfaces |

## 3.2 Split-Brain Hardware

**GPU (Soft Core):** Parallel neural computation — pattern matching, energy landscape navigation, diffusion noise exploration. Operates via RAR loop.

**CPU (Hard Core):** Sequential deterministic logic — math, code execution, API dispatch, certainty, proofs, safety. Native Rust.

**RAM (VoltDB):** Persistent memory — millions of Tensor Frames in strands, indexed by HNSW (semantic), B-tree (temporal), inverted index (conceptual).

Interconnected via LLL Tensor Frame Bus carrying structured frames, not flat vectors or tokens.

# 4. Tensor Frame

## 4.1 Definition

F ∈ ℝ^[S × R × D] — a three-dimensional sparse tensor.

- **S = 16 slots:** AGENT, PREDICATE, PATIENT, LOCATION, TIME, MANNER, INSTRUMENT, CAUSE, RESULT, 7 FREE
- **R = 4 resolutions:** R₀ discourse → R₁ proposition → R₂ phrase → R₃ token
- **D = 256 dimensions** per slot per resolution

Max: 64 KB. Typical sparse: ~8 KB (4 slots × 2 resolutions).

A flat LLL vector is a Tensor Frame collapsed to one slot at one resolution — all HDC algebra (binding, superposition, permutation) still works on individual slot embeddings. The Tensor Frame is a strict generalization.

## 4.2 Resolution Mapping

| Level | Content | Consumer |
|---|---|---|
| R₀ Discourse | Topic, mood, intent | GPU Soft Core, Bleed Buffer |
| R₁ Proposition | Sentence-level semantics | GPU + CPU |
| R₂ Phrase | Entities, values, modifiers | CPU, Output Decoder |
| R₃ Token | Subword tokens | Output (decode only) |

## 4.3 Operations

- **Slot Write:** Random access — `F[slot=2, res=1] = encode("lifetime bug")`
- **Resolution Zoom:** Reason at R₀, drill to R₂/R₃ only where needed
- **Composition:** Merge non-empty slots, γ-priority conflict resolution, no information loss
- **Parallel Decode:** All slots simultaneously; 5-slot = 1-slot wall-clock
- **Sparse Attention:** O(16²×256) = 65,536 ops; ~20M× cheaper than 100K-context transformer

# 5. LLL Vector Bus

## 5.1 Operations (HDC/HRR-derived)

| Op | Function | Implementation |
|---|---|---|
| Binding (⊗) | Conjunctive association | `IFFT(FFT(a) ⊙ FFT(b))`, O(D log D) |
| Superposition (+) | Set combination | `normalize(a + b + c)` |
| Permutation (ρ) | Sequence encoding | Cyclic shift: `a + ρ(b) + ρ²(c)` |
| Unbinding (⊗⁻¹) | Constituent retrieval | Involution: `x⁻¹_i = x_{(-i mod D)}` |
| Role-Filler | Structured knowledge | `Σᵢ(role_i ⊗ filler_i)` |

## 5.2 Codebook

65,536 (2¹⁶) entries × 256-dim unit vectors = ~67 MB resident. u16 addressing, HNSW-indexed, bridges continuous vectors ↔ discrete storage. Initialized from clustered LLM hidden states, refined via VQ-VAE commitment loss + EMA centroid updates.

## 5.3 Certainty Propagation

Per-slot γ ∈ [0,1]. Min-rule: `γ(A→C) = min(γ(A→B), γ(B→C))`. Frame γ = min(all filled slots). One uncertain slot honestly reduces overall confidence.

# 6. Input Translators

## 6.1 Text Translator

Frozen encoder backbone (~1-7B params, e.g. Llama/Mistral/Qwen) produces contextual embeddings — parameters never modified, used as a "knowledge dictionary." Trainable Frame Projection Head (~50M params) maps LLM hidden states to Tensor Frame slots: semantic role detection → slot assignment → R₀/R₁ resolution filling → VQ-VAE codebook quantization via HNSW lookup.

## 6.2 Community Translators

| Translator | Input → Frame Mapping |
|---|---|
| Vision | Objects → AGENT/PATIENT; scene → LOCATION; actions → PREDICATE |
| Audio | Transcription → text pipeline; non-speech → MANNER/INSTRUMENT |
| Data | Schema fields → slots; aggregates → R₀ |
| Sensor | Readings → PATIENT; source → AGENT; time → TIME |
| OS | Events → PREDICATE; paths/PIDs → PATIENT |

Standalone Rust crates implementing Translator trait. Auto-discovered via trait introspection.

# 7. GPU Soft Core — Root-Attend-Refine

System 1: fast, parallel, associative, creative. Continuous dynamics on Tensor Frame slots via shared Vector Field Network. Three-phase loop: Root-Attend-Refine (RAR).

## 7.1 RAR Loop

**Root (parallel):** Each active slot gets independent VFN pass:
```
root_i = f_θ(S_i[R₀])                            # VFN: [256]→[256]
σ_i = σ_φ(S_i, convergence_rate_i, mirror_signal) # Adaptive noise
ΔS_i = root_i + σ_i × sample_orthogonal_to(root_i)
```
Shared weights (like conv filters). Energy landscape: `f_θ = -∇E`. Diffusion controller: converged → σ≈0; stuck → high σ; creative → higher baseline. All 16 slots embarrassingly parallel.

**Attend (cross-slot):** Scaled dot-product attention between slots + ghost frames:
```
A_ij = softmax((W_Q·root_i · W_K·root_j) / √64)
context_i = Σ_j(A_ij × W_V·root_j) + α × ghost_attention_i
```
Cost: 65,536 multiply-adds. Negligible.

**Refine (update + convergence):**
```
S_i(t+1) = normalize(S_i(t) + dt_i × (ΔS_i + β × context_i))
if ‖S_i(t+1) − S_i(t)‖ < ε: freeze slot, compute γ_i
```
Frozen slots still serve as K/V in Attend. Progressive convergence: easy slots freeze early, GPU load drops proportionally. Terminates when all converge or budget exhausted (honest partial γ).

## 7.2 VFN Configurations

| Config | Params | Architecture | Target |
|---|---|---|---|
| Edge | 100M | Gated MLP (4 layers) | Mobile |
| Standard | 500M | FNO (8 layers) | Consumer PC |
| Research | 2B | FNO + residual (16 layers) | Workstation |

## 7.3 Ghost Bleed Buffer

~1,000 R₀ ghosts in VRAM (~1 MB). Create energy dips during Attend. Cosine sim > threshold triggers page fault → full frame load from RAM. Bleed Engine (CPU) refreshes on significant R₀ change via HNSW query.

## 7.4 Compute Cost

~25M FLOPs per query (12 iterations). GPT-4 500-token response: ~900T FLOPs. **~36M× less compute.**

# 8. CPU Hard Core

System 2: sequential, logical, deterministic. Same input → same output. No hallucination on computational tasks.

## 8.1 Intent Router

Cosine similarity of R₀ gist against strand capability vectors. Pure vector geometry — no JSON, no string matching, no tool name hallucination.

## 8.2 Hard Strands

| Strand | Function |
|---|---|
| MathEngine | Arbitrary-precision arithmetic/algebra/calculus |
| CodeRunner | Sandboxed Rust/Python/WASM (wasmtime) |
| APIDispatch | Parallel HTTP via Tokio (50+ concurrent) |
| HDCAlgebra | FFT binding/unbinding/superposition |
| CertaintyEngine | Min-rule γ propagation + proof validation |
| ProofConstructor | Reasoning trace as proof steps |
| CausalSimulator | Pearl's do-calculus, consequence preview |
| LedgerStrand | Intelligence Commons interface |
| SleepLearner | Forward-Forward consolidation coordinator |
| MirrorModule | Self-monitoring, loop detection, uncertainty estimation |

Results: Resolved (frame + proof), NeedsMoreInfo, Delegated, or Failed.

Community: implement HardStrand trait → publish Rust crate → auto-discovered by Intent Router.

## 8.3 Safety Layer

**Axiomatic Guard:** Cryptographically signed invariants (no physical harm, no CSAM, no WMD, no identity fraud, acknowledge AI). Immune to training.

**Transition Monitor:** Every F(t)→F(t+1) checked against invariant vectors. Warning → diffusion increase. Critical → Omega Veto.

**Omega Veto:** Hardware interrupt, no software bypass. Halt → freeze → log → require human approval.

# 9. VoltDB

Embedded Rust library (not separate process) managing cognitive memory.

## 9.1 Three Tiers

| Tier | Location | Capacity | Access |
|---|---|---|---|
| T0 | GPU VRAM | 64 frames + weights + ghosts | Instant |
| T1 | System RAM | 8-32 GB, ~500K frames | ~2ms |
| T2 | RAM + NVMe | 64-160+ GB, millions compressed | ~10-50ms |

T0 evicts at 80%: `score = w₁·recency + w₂·γ + w₃·log(refs) + w₄·strand_importance - w₅·superseded`. R₀ ghost retained in Bleed Buffer.

T1: LSM-Tree (memtable → sorted runs → background compaction).

T2: `mmap`'d compressed archives, `rkyv` zero-copy deserialization.

## 9.2 Indexing

Strand routing (HashMap, O(1)) → per-strand HNSW + B-tree + inverted index (O(log N)) → frame-internal O(1). Total: O(log N). 10M frames ≈ 2.3ms. Bloom filters for O(1) negative checks (99.9%).

## 9.3 Bleed Engine

| Process | Path | Latency |
|---|---|---|
| Predictive Prefetch | T1→T0 (HNSW on new frame) | ~2ms |
| On-Demand Recall | T2→T1→T0 (ghost page fault) | ~10-50ms |
| Background Consolidation | T0→T1 (eviction, ghost retained) | Non-blocking |
| Sleep Archival | T1→T2 (compress R₀, distill wisdom) | At 80% T1 |

## 9.4 Garbage Collection

Full (64KB) → Compressed (8KB, R₀+R₁) → Gist (1KB, R₀) → Tombstone (32B).

Retention: `w₁·exp(-age/30d) + w₂·γ + w₃·log(1+refs) + w₄·strand + w₅·distilled - w₆·contradictions - w₇·redundancy`. Immortal: γ=1.0, high refs, or user-pinned.

## 9.5 Coherence

γ-priority wins contradictions. Superseded frames tagged + γ-penalized. Strand-scoped truth (active strand determines retrieval). Background contradiction detector via HDC negation.

## 9.6 Concurrency

MVCC via `crossbeam-epoch` RCU (readers never block). Per-strand mutex (cross-strand parallel writes). WAL per strand for crash recovery.

## 9.7 Capacity

| Tier | Full Frames | Compressed | ~Tokens |
|---|---|---|---|
| T0 (8GB) | 125K | — | 6M |
| T1 (32GB) | 500K | 32M | 1.6B |
| T2 (128GB+1TB) | 17M | 1.1B | 58B |

Total ~58B tokens. GPT-4 context: 128K.

# 10. Output Action Cores

All slots decode simultaneously (5-slot = 1-slot wall-clock). Slot R₁ decoded independently → assembled by role order + discourse connectives. Vs. autoregressive: 500 tokens = 500 serial passes.

| Core | Output | Mechanism |
|---|---|---|
| Text | Natural language | Per-slot decode + proof annotation |
| Speech | Audio | Text → TTS |
| Image | Generated images | PATIENT/MANNER → diffusion |
| Motor | Robot commands | ACTION/INSTRUMENT → primitives |
| n8n | Webhooks | PREDICATE → n8n dispatch |
| Ledger | Network publish | Frame → signed P2P |

# 11. Continual Learning

**Inference IS learning.** Every inference → stored frame → future context. No train/inference distinction.

**Instant (ms):** RAM strand writes. Zero forgetting, instant effect, no weight changes.

**Sleep (hours, idle):** CPU clusters frames → distills (50→3-5 wisdom frames) → Forward-Forward weight updates on VFN (one layer at a time, ~1× inference VRAM). Energy landscape reshapes: new attractors form, unused ones flatten.

**Developmental (days-months):** Strand graduation (topic clusters promoted to dedicated strands). Module hot-plug at runtime, auto-discovered via trait introspection.

# 12. Intelligence Commons

Trust-minimized accounting for sovereign intelligence, not crypto.

**L0 Local:** Append-only Merkle log, Ed25519 identity, ZK proofs. Fully offline.
**L1 P2P:** libp2p gossip, CRDT sync, IPFS module registry, encrypted strand marketplace.
**L2 Settlement:** DAG micropayments, high-γ fact anchoring, provenance, quadratic governance.

**Value flows:** Knowledge contribution → module marketplace → fact verification → strand trading (ZK).

Token (VOLT): zero pre-mine, 100% earned. Implemented as deferrable HardStrand.

# 13. UI / Test Bench

**Phase 1:** n8n workflow — Chat Trigger → HTTP (`localhost:8080/api/think`) → Switch → Reply (γ, strand, proof) + debug panel.

**Future:** Tauri desktop → mobile → IDE integration.

# 14. Socket Standard

Three Rust traits = ecosystem boundary ("AM5 socket for AI"):

```rust
pub trait Translator: Send + Sync {
    fn name(&self) -> &str;
    fn encode(&self, raw: &[u8], modality: Modality) -> TensorFrame;
    fn supported_modalities(&self) -> Vec<Modality>;
}

pub trait HardStrand: Send + Sync {
    fn id(&self) -> StrandId;
    fn name(&self) -> &str;
    fn capability_vector(&self) -> &[f32; 256];
    fn execute(&self, intent: &TensorFrame) -> StrandResult;
    fn can_handle(&self, intent: &TensorFrame) -> f32;
    fn learning_signal(&self) -> Option<LearningEvent>;
}

pub trait ActionCore: Send + Sync {
    fn name(&self) -> &str;
    fn decode(&self, frame: &TensorFrame) -> Output;
    fn supported_outputs(&self) -> Vec<OutputModality>;
}
```

One interface, infinite modules. O(N+M) cost. Auto-discovery via trait introspection, no recompilation.

# 15. Safety Architecture

## 15.1 Defense in Depth

Three layers, each catching what penetrates above:

1. **Soft biases (learned):** GPU energy landscape gradients — attract beneficial, repel harmful. Adjustable via fine-tuning. Handles majority of ethical considerations.
2. **Hard constraints (coded):** CPU Axiomatic Guard — deterministic, cryptographically signed, immune to training. (See §8.3)
3. **Emergency halt (hardware):** Omega Veto — no software bypass, human approval required.

## 15.2 Causal Safety

CausalSimulator: clone frame → intervene → run Soft Core forward → evaluate against safety criteria → flag/block harmful outcomes before real-world execution.

## 15.3 Certainty as Safety

Min-rule γ prevents overconfident harmful outputs. Uncertain components honestly reduce overall confidence. γ=0.50 presented as uncertain, not authoritative.