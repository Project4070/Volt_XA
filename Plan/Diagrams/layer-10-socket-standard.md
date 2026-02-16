# Layer 10 — Socket Standard (Detailed)

> The "AM5 Socket for AI" — three Rust traits defining the ecosystem boundary. Full trait signatures, auto-discovery, and module lifecycle.

```mermaid
%%{init: {"flowchart": {"defaultRenderer": "elk"}} }%%
flowchart TB

    subgraph L10["<b>Layer 10 — Socket Standard</b><br/><i>'AM5 Socket for AI' — One interface, infinite modules</i><br/><i>O(N+M) cost: N modules + M slots, not N×M integrations</i>"]

        %% ═══════════════════════════════════════════════
        %% TRANSLATOR TRAIT
        %% ═══════════════════════════════════════════════
        subgraph translator_trait["<b>Translator Trait</b><br/><i>Converts raw input → Tensor Frame</i>"]
            direction TB

            subgraph translator_sig["<b>Full Trait Signature</b>"]
                direction TB
                t_trait["<b>pub trait Translator: Send + Sync</b>"]
                t_name["fn name(&self) → &str<br/><i>Human-readable identifier</i><br/><i>e.g., 'text-llama-7b', 'vision-clip'</i>"]
                t_encode["fn encode(&self, raw: &[u8], modality: Modality) → TensorFrame<br/><i>Core method: raw bytes → structured frame</i><br/><i>Must fill appropriate slots based on modality</i><br/><i>Must quantize to VQ-VAE codebook</i>"]
                t_modalities["fn supported_modalities(&self) → Vec&lt;Modality&gt;<br/><i>Declares what input types this translator handles</i><br/><i>e.g., [Text, Markdown, Code] or [Image, Video]</i>"]
                t_trait --> t_name --> t_encode --> t_modalities
            end

            subgraph translator_modality["<b>Modality Enum</b>"]
                direction LR
                mod_text["Text"]
                mod_markdown["Markdown"]
                mod_code["Code"]
                mod_image["Image"]
                mod_video["Video"]
                mod_audio["Audio"]
                mod_speech["Speech"]
                mod_csv["CSV"]
                mod_json["JSON"]
                mod_sensor["Sensor"]
                mod_os_event["OSEvent"]
                mod_custom["Custom(String)"]
            end

            subgraph translator_impls["<b>Known Implementations</b>"]
                direction LR
                impl_text["<b>TextTranslator</b><br/>Frozen LLM + Projection Head<br/>+ VQ-VAE Quantizer<br/><i>Reference implementation</i>"]
                impl_vision["<b>VisionTranslator</b><br/>Frozen ViT/CLIP<br/>+ slot mapping"]
                impl_audio["<b>AudioTranslator</b><br/>VAD + ASR + mel<br/>+ dual branch"]
                impl_data["<b>DataTranslator</b><br/>Schema detect<br/>+ field mapping"]
                impl_sensor["<b>SensorTranslator</b><br/>Protocol decode<br/>+ event mapping"]
            end

            subgraph translator_contract["<b>Implementation Contract</b>"]
                direction TB
                contract_t1["MUST: Fill at minimum R₀ (discourse gist)"]
                contract_t2["MUST: Quantize all vectors to codebook"]
                contract_t3["MUST: Set slot mask and resolution mask"]
                contract_t4["MUST: Compute initial γ per filled slot"]
                contract_t5["SHOULD: Fill R₁ for proposition-level detail"]
                contract_t6["MAY: Fill R₂/R₃ for fine-grained detail"]
            end
        end

        %% ═══════════════════════════════════════════════
        %% HARDSTRAND TRAIT
        %% ═══════════════════════════════════════════════
        subgraph hardstrand_trait["<b>HardStrand Trait</b><br/><i>Deterministic computation module</i>"]
            direction TB

            subgraph hardstrand_sig["<b>Full Trait Signature</b>"]
                direction TB
                h_trait["<b>pub trait HardStrand: Send + Sync</b>"]
                h_id["fn id(&self) → StrandId<br/><i>Unique strand identifier</i><br/><i>Used for routing and storage</i>"]
                h_name["fn name(&self) → &str<br/><i>Human-readable name</i><br/><i>e.g., 'math-engine', 'code-runner'</i>"]
                h_cap["fn capability_vector(&self) → &[f32; 256]<br/><i>256-dim vector describing what this strand handles</i><br/><i>Used by Intent Router for cosine-sim dispatch</i><br/><i>Trained on representative query embeddings</i>"]
                h_execute["fn execute(&self, intent: &TensorFrame) → StrandResult<br/><i>Core computation method</i><br/><i>Takes input frame, produces result</i><br/><i>MUST be deterministic: same input → same output</i>"]
                h_can_handle["fn can_handle(&self, intent: &TensorFrame) → f32<br/><i>Self-reported confidence [0,1] for this input</i><br/><i>Finer-grained than capability_vector</i><br/><i>Called after Intent Router pre-filter</i>"]
                h_learning["fn learning_signal(&self) → Option&lt;LearningEvent&gt;<br/><i>Optional feedback to learning system</i><br/><i>e.g., 'this query type is becoming frequent'</i><br/><i>Informs strand graduation decisions</i>"]
                h_trait --> h_id --> h_name --> h_cap --> h_execute --> h_can_handle --> h_learning
            end

            subgraph strand_result["<b>StrandResult Enum</b>"]
                direction LR
                sr_resolved["<b>Resolved</b><br/>{ frame: TensorFrame,<br/>  proof: ProofChain }"]
                sr_needs["<b>NeedsMoreInfo</b><br/>{ missing: Vec&lt;SlotId&gt;,<br/>  question: TensorFrame }"]
                sr_delegated["<b>Delegated</b><br/>{ target: StrandId,<br/>  reason: String }"]
                sr_failed["<b>Failed</b><br/>{ error: StrandError,<br/>  partial: Option&lt;TensorFrame&gt; }"]
            end

            subgraph hardstrand_impls["<b>Known Implementations</b>"]
                direction LR
                impl_math["<b>MathEngine</b><br/>Arbitrary precision<br/>Algebra, calculus"]
                impl_code["<b>CodeRunner</b><br/>WASM sandbox<br/>Rust/Python"]
                impl_api["<b>APIDispatch</b><br/>Tokio async<br/>HTTP client"]
                impl_hdc["<b>HDCAlgebra</b><br/>FFT bind/unbind"]
                impl_cert["<b>CertaintyEngine</b><br/>Min-rule γ"]
                impl_proof["<b>ProofConstructor</b><br/>Trace builder"]
                impl_causal["<b>CausalSimulator</b><br/>do-calculus"]
                impl_mirror["<b>MirrorModule</b><br/>Self-monitor"]
                impl_sleep_s["<b>SleepLearner</b><br/>FF coordinator"]
                impl_ledger["<b>LedgerStrand</b><br/>Commons interface"]
            end

            subgraph hardstrand_contract["<b>Implementation Contract</b>"]
                direction TB
                contract_h1["MUST: Be deterministic (same input → same output)"]
                contract_h2["MUST: Return StrandResult (never panic)"]
                contract_h3["MUST: Provide accurate capability_vector"]
                contract_h4["MUST: Set γ on all output frame slots"]
                contract_h5["SHOULD: Include proof steps in Resolved result"]
                contract_h6["MAY: Emit LearningEvent for strand graduation"]
            end
        end

        %% ═══════════════════════════════════════════════
        %% ACTIONCORE TRAIT
        %% ═══════════════════════════════════════════════
        subgraph actioncore_trait["<b>ActionCore Trait</b><br/><i>Converts Tensor Frame → human-readable output</i>"]
            direction TB

            subgraph actioncore_sig["<b>Full Trait Signature</b>"]
                direction TB
                a_trait["<b>pub trait ActionCore: Send + Sync</b>"]
                a_name["fn name(&self) → &str<br/><i>Human-readable identifier</i><br/><i>e.g., 'text-output', 'speech-tts'</i>"]
                a_decode["fn decode(&self, frame: &TensorFrame) → Output<br/><i>Core method: structured frame → output</i><br/><i>Parallel slot decode internally</i><br/><i>Role-ordered assembly</i>"]
                a_outputs["fn supported_outputs(&self) → Vec&lt;OutputModality&gt;<br/><i>Declares what output types this core produces</i><br/><i>e.g., [PlainText, Markdown] or [WAV, Opus]</i>"]
                a_trait --> a_name --> a_decode --> a_outputs
            end

            subgraph output_modality["<b>OutputModality Enum</b>"]
                direction LR
                out_plaintext["PlainText"]
                out_markdown["Markdown"]
                out_html["HTML"]
                out_wav["WAV"]
                out_opus["Opus"]
                out_png["PNG"]
                out_svg["SVG"]
                out_motor_cmd["MotorCommand"]
                out_webhook["WebhookJSON"]
                out_signed_frame["SignedFrame"]
                out_custom["Custom(String)"]
            end

            subgraph actioncore_impls["<b>Known Implementations</b>"]
                direction LR
                impl_text_out["<b>TextOutput</b><br/>Slot decode + proof<br/>annotation"]
                impl_speech_out["<b>SpeechOutput</b><br/>Text → TTS<br/>SSML prosody"]
                impl_image_out["<b>ImageOutput</b><br/>Diffusion model<br/>from slot vectors"]
                impl_motor_out["<b>MotorOutput</b><br/>Motion planning<br/>control signals"]
                impl_n8n_out["<b>n8nOutput</b><br/>Webhook dispatch<br/>JSON serialize"]
                impl_ledger_out["<b>LedgerOutput</b><br/>Sign + publish<br/>P2P broadcast"]
            end

            subgraph actioncore_contract["<b>Implementation Contract</b>"]
                direction TB
                contract_a1["MUST: Decode all filled slots"]
                contract_a2["MUST: Preserve γ scores in output metadata"]
                contract_a3["MUST: Handle sparse frames (empty slots = skip)"]
                contract_a4["SHOULD: Decode slots in parallel"]
                contract_a5["SHOULD: Include proof references in output"]
                contract_a6["MAY: Support streaming output"]
            end
        end

        %% ═══════════════════════════════════════════════
        %% AUTO-DISCOVERY
        %% ═══════════════════════════════════════════════
        subgraph auto_discovery["<b>Auto-Discovery Mechanism</b><br/><i>No recompilation needed</i>"]
            direction TB

            subgraph discovery_process["<b>Discovery Process</b>"]
                direction TB
                scan_crates["Scan module directory<br/>for new Rust crates / WASM"]
                trait_check["Trait introspection:<br/>Does crate implement<br/>Translator, HardStrand,<br/>or ActionCore?"]
                load_dynamic["Dynamic loading:<br/>dlopen / WASM instantiate<br/>Load trait vtable"]
                register_module["Register module:<br/>Add to appropriate registry<br/>(translator list, strand list,<br/>or action core list)"]
                cap_vector_extract["Extract capability vector<br/>(for HardStrand) or<br/>modality list (for others)"]
                intent_router_update["Update Intent Router<br/>New capability vector<br/>available for dispatch"]
                scan_crates --> trait_check --> load_dynamic --> register_module --> cap_vector_extract --> intent_router_update
            end

            subgraph discovery_sources["<b>Module Sources</b>"]
                direction LR
                local_crate["Local crate:<br/>Built locally<br/>Immediate load"]
                ipfs_module["IPFS module:<br/>Downloaded via CID<br/>Hash-verified"]
                p2p_shared["P2P shared module:<br/>From peer node<br/>Signature-verified"]
            end

            subgraph module_lifecycle["<b>Module Lifecycle</b>"]
                direction TB
                lc_discover["Discover<br/>(trait introspection)"]
                lc_load["Load<br/>(dynamic linking)"]
                lc_test["Test<br/>(sandbox validation)"]
                lc_register["Register<br/>(add to registry)"]
                lc_active["Active<br/>(receiving dispatches)"]
                lc_update["Update<br/>(new version detected)"]
                lc_retire["Retire<br/>(unload, keep config)"]
                lc_discover --> lc_load --> lc_test --> lc_register --> lc_active
                lc_active --> lc_update --> lc_load
                lc_active --> lc_retire
            end
        end

        %% ═══════════════════════════════════════════════
        %% ECOSYSTEM ARCHITECTURE
        %% ═══════════════════════════════════════════════
        subgraph ecosystem["<b>Ecosystem Architecture</b><br/><i>Three traits = entire API surface</i>"]
            direction TB

            subgraph composition["<b>Composition Model</b>"]
                direction TB
                n_modules["N input modules (Translators)<br/>+ M computation modules (HardStrands)<br/>+ K output modules (ActionCores)"]
                cost_model["Integration cost: O(N + M + K)<br/>NOT O(N × M × K)<br/>Bus is universal intermediary"]
                add_module["Adding 1 new module:<br/>Implement 1 trait<br/>→ Works with ALL existing modules<br/>→ No changes to anything else"]
            end

            subgraph data_flow_guarantee["<b>Data Flow Guarantee</b>"]
                direction LR
                flow_in["Any Translator<br/>→ Tensor Frame"]
                flow_bus["Tensor Frame<br/>on Bus"]
                flow_compute["Any HardStrand<br/>can process"]
                flow_out["Any ActionCore<br/>can output"]
                flow_in --> flow_bus --> flow_compute --> flow_bus
                flow_bus --> flow_out
            end
        end
    end

    %% ═══════════════════════════════════════════════════
    %% CONNECTIONS TO LAYERS
    %% ═══════════════════════════════════════════════════
    translator_trait -.->|"governs"| layer1["Layer 1: Input Translators"]
    hardstrand_trait -.->|"governs"| layer4["Layer 4: CPU Hard Core (Strands)"]
    actioncore_trait -.->|"governs"| layer6["Layer 6: Output Action Cores"]
    auto_discovery -.->|"feeds"| layer7["Layer 7: Developmental Growth"]
    discovery_sources -.->|"modules from"| layer8["Layer 8: Intelligence Commons (IPFS)"]

    %% ═══════════════════════════════════════════════════
    %% STYLING
    %% ═══════════════════════════════════════════════════
    classDef traitStyle fill:#2e2a1a,stroke:#fbbf24,stroke-width:2px,color:#eee
    classDef translatorStyle fill:#2a1a2e,stroke:#a855f7,stroke-width:2px,color:#eee
    classDef strandStyle fill:#1a2a2e,stroke:#38bdf8,stroke-width:2px,color:#eee
    classDef coreStyle fill:#1a2e1a,stroke:#4ecca3,stroke-width:2px,color:#eee
    classDef discoveryStyle fill:#2e1a1a,stroke:#f87171,stroke-width:2px,color:#eee
    classDef ecoStyle fill:#1a1a2e,stroke:#818cf8,stroke-width:2px,color:#eee
    classDef extStyle fill:#2e2e2e,stroke:#94a3b8,stroke-width:1px,color:#aaa

    class L10 traitStyle
    class translator_trait,translator_sig,t_trait,t_name,t_encode,t_modalities translatorStyle
    class translator_modality,mod_text,mod_markdown,mod_code,mod_image,mod_video,mod_audio,mod_speech,mod_csv,mod_json,mod_sensor,mod_os_event,mod_custom translatorStyle
    class translator_impls,impl_text,impl_vision,impl_audio,impl_data,impl_sensor translatorStyle
    class translator_contract,contract_t1,contract_t2,contract_t3,contract_t4,contract_t5,contract_t6 translatorStyle
    class hardstrand_trait,hardstrand_sig,h_trait,h_id,h_name,h_cap,h_execute,h_can_handle,h_learning strandStyle
    class strand_result,sr_resolved,sr_needs,sr_delegated,sr_failed strandStyle
    class hardstrand_impls,impl_math,impl_code,impl_api,impl_hdc,impl_cert,impl_proof,impl_causal,impl_mirror,impl_sleep_s,impl_ledger strandStyle
    class hardstrand_contract,contract_h1,contract_h2,contract_h3,contract_h4,contract_h5,contract_h6 strandStyle
    class actioncore_trait,actioncore_sig,a_trait,a_name,a_decode,a_outputs coreStyle
    class output_modality,out_plaintext,out_markdown,out_html,out_wav,out_opus,out_png,out_svg,out_motor_cmd,out_webhook,out_signed_frame,out_custom coreStyle
    class actioncore_impls,impl_text_out,impl_speech_out,impl_image_out,impl_motor_out,impl_n8n_out,impl_ledger_out coreStyle
    class actioncore_contract,contract_a1,contract_a2,contract_a3,contract_a4,contract_a5,contract_a6 coreStyle
    class auto_discovery,discovery_process,scan_crates,trait_check,load_dynamic,register_module,cap_vector_extract,intent_router_update discoveryStyle
    class discovery_sources,local_crate,ipfs_module,p2p_shared discoveryStyle
    class module_lifecycle,lc_discover,lc_load,lc_test,lc_register,lc_active,lc_update,lc_retire discoveryStyle
    class ecosystem,composition,n_modules,cost_model,add_module ecoStyle
    class data_flow_guarantee,flow_in,flow_bus,flow_compute,flow_out ecoStyle
    class layer1,layer4,layer6,layer7,layer8 extStyle
```

## Trait Comparison

| Property | Translator | HardStrand | ActionCore |
|---|---|---|---|
| Direction | Input → Frame | Frame → Frame | Frame → Output |
| Key method | `encode()` | `execute()` | `decode()` |
| Discovery via | `supported_modalities()` | `capability_vector()` | `supported_outputs()` |
| Deterministic? | Yes (same input = same frame) | Yes (MUST be) | Yes (same frame = same output) |
| Send + Sync | Required | Required | Required |
| Count (built-in) | 5 | 10 | 6 |
| Extensible | Community crates | Community crates | Community crates |
