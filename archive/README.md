# Volt X Archive — Reference for Volt XA

This directory contains the complete source code and documentation from
**Volt X** (Feb 2025), the first implementation of the cognitive architecture.
It serves as a read-only reference for the Volt XA rebuild.

**Do not modify files in this archive.** If you find something useful,
adapt it into the new codebase — don't edit it in place.

---

## Directory Layout

```
archive/
├── code/          ← 10 Rust crates (~50K lines), all source + tests + benches
├── docs/          ← 6 key design documents
├── config/        ← Cargo workspace, build config, training paths
└── tools/         ← Python training scripts
```

---

## Quick Reference: "If you need X, look in Y"

### Core Data Structures
| What | Where |
|------|-------|
| TensorFrame (16 slots × 4 resolutions × 256 dims) | `code/volt-core/src/frame.rs` |
| SlotData, SlotRole, SlotMeta | `code/volt-core/src/slot.rs` |
| FrameMeta | `code/volt-core/src/meta.rs` |
| VoltError enum | `code/volt-core/src/error.rs` |
| ModuleInfo / ModuleType | `code/volt-core/src/module_info.rs` |

### HDC Algebra (Hyperdimensional Computing)
| What | Where |
|------|-------|
| bind / unbind / superpose / permute | `code/volt-bus/src/ops.rs` |
| Batch operations | `code/volt-bus/src/batch.rs` |
| FFT-accelerated binding | `code/volt-bus/src/fft.rs` |
| Codebook (symbol ↔ vector) | `code/volt-bus/src/codebook.rs` |

### Inference (Root-Attend-Refine)
| What | Where |
|------|-------|
| RAR loop (CPU) | `code/volt-soft/src/rar.rs` |
| Slot attention mechanism | `code/volt-soft/src/attention.rs` |
| Code attention bias (16×16) | `code/volt-soft/src/code_attention.rs` |
| VFN (Volt Flow Network) | `code/volt-soft/src/vfn.rs` |
| GPU RAR / GPU VFN | `code/volt-soft/src/gpu/` |
| Flow matching training | `code/volt-soft/src/training/` |

### Intent Routing & Hard Strands
| What | Where |
|------|-------|
| IntentRouter (with catch_unwind) | `code/volt-hard/src/router.rs` |
| Pipeline (translate → route → infer) | `code/volt-hard/src/pipeline.rs` |
| Certainty engine | `code/volt-hard/src/certainty_engine.rs` |
| Math strand example | `code/volt-hard/src/math_engine.rs` |
| Weather strand example | `code/volt-hard/src/weather_strand.rs` |

### Memory (VoltDB Three-Tier)
| What | Where |
|------|-------|
| T0 Working Memory | `code/volt-db/src/tier0.rs` |
| T1 Strand Store | `code/volt-db/src/tier1.rs` |
| T2 LSM-Tree compressed store | `code/volt-db/src/tier2.rs` |
| HNSW nearest-neighbor index | `code/volt-db/src/hnsw_index.rs` |
| Ghost buffer + bleed engine | `code/volt-db/src/ghost.rs` |
| Frame gist (compressed repr) | `code/volt-db/src/gist.rs` |
| Bloom filter | `code/volt-db/src/bloom.rs` |
| Write-ahead log | `code/volt-db/src/wal.rs` |
| GC engine | `code/volt-db/src/gc.rs` |
| Consolidation engine | `code/volt-db/src/consolidation.rs` |

### Translation (NL ↔ Frame)
| What | Where |
|------|-------|
| Stub translator (rule-based) | `code/volt-translate/src/stub.rs` |
| Learned translator (neural) | `code/volt-translate/src/learned.rs` |
| Code encoder / decoder | `code/volt-translate/src/code_encoder.rs`, `code_decoder.rs` |
| LLM backbone + projection | `code/volt-translate/src/llm/` |
| ActionCore trait (module system) | `code/volt-translate/src/action_core.rs` |

### Learning
| What | Where |
|------|-------|
| Forward-Forward training | `code/volt-learn/src/forward_forward.rs` |
| RLVF (reinforcement from verification) | `code/volt-learn/src/rlvf.rs` |
| Sleep consolidation scheduler | `code/volt-learn/src/sleep.rs` |
| Strand graduation | `code/volt-learn/src/graduation.rs` |
| Code dataset pipeline | `code/volt-learn/src/code_dataset.rs` |
| Mini-batch K-means | `code/volt-learn/src/kmeans.rs` |
| Training binaries | `code/volt-learn/src/bin/` |

### Safety
| What | Where |
|------|-------|
| Safety axioms | `code/volt-safety/src/axiom.rs` |
| Layer-based safety checks | `code/volt-safety/src/layer.rs` |
| Omega veto | `code/volt-safety/src/veto.rs` |

### Server
| What | Where |
|------|-------|
| Axum routes (HTTP API) | `code/volt-server/src/routes.rs` |
| Module registry | `code/volt-server/src/registry.rs` |
| Web UI (static files) | `code/volt-server/static/` |

---

## Key Lessons Learned (from Volt X development)

### Platform: Windows-Specific
- **Stack overflow with TensorFrame**: TensorFrame is ~64KB. Windows default
  thread stack is 1MB. serde_json's recursive descent overflows. Fix: spawn
  threads with `stack_size(8 * 1024 * 1024)` for serialize/deserialize.
  Use `Box<TensorFrame>` in collections.
- **catch_unwind SEH overhead**: Adding panic safety to IntentRouter increased
  stack usage. Integration tests need `stack_size(4 * 1024 * 1024)`.
- **`.cargo/config.toml`**: `jobs = 0` is invalid on Windows. Omit it.

### Rust 2024 Edition
- `[const { None }; N]` works for const-initializing arrays of `Option<T>`.
- Clippy prefers let-chains: `if let A && let B { }` over nested ifs.
- serde doesn't support `[f32; 256]` arrays natively — use custom binary
  codec for large fixed-size arrays.

### Architecture
- Dependencies must flow one direction: core ← bus ← soft/hard/db ← others ← server.
- No async in volt-core or volt-bus (pure synchronous logic).
- All cross-crate communication through TensorFrame.
- No unwrap() in library code — `Result<T, VoltError>` everywhere.

### Performance Targets (from Volt X)
- TensorFrame creation: < 1us
- LLL bind (256 dims): < 10us
- HNSW query (65K entries): < 500us
- Single RAR iteration: < 1ms
- Full inference (simple): < 50ms

---

## Documentation Index

| File | Contents |
|------|----------|
| `docs/ARCHITECTURE.md` | Technical design reference (160 lines) |
| `docs/DECISIONS.md` | 30 ADRs with rationale (ADR-001 through ADR-030) |
| `docs/TRAINING.md` | Unified training plan v3.0 — spiral curriculum |
| `docs/master_blueprint.md` | Full system design narrative (1200 lines) |
| `docs/dev_history.md` | Chronological build record (Feb 9-15, 2025) |
| `docs/svgs.md` | Architecture diagrams — read in 500-line chunks |

---

## What Was Dropped

These files from Volt X were intentionally excluded:

- **Binary artifacts**: codebook.bin (65M), checkpoints (439M), models (304M),
  hidden_states_cache.pt (345M) — all regenerable from training pipeline
- **Stale docs**: VOLT X — Temp.md, VOLT X — Roadmap.md, VOLT X guide.md
- **Superseded docs**: 8 files from archive/training/ (replaced by TRAINING.md v3.0)
- **One-time artifacts**: 3 audit files, 7 roadmap phase files, PNGs, n8n workflow
- **Personal config**: .vscode/, .bashrc, scripts/dev.ps1
