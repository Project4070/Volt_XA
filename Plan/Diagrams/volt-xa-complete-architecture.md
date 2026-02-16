# Volt XA — Complete Architecture Diagram (All Layers Unabridged)

> Single combined diagram containing every component, connection, and detail from all 11 layers (0-10). Each layer preserved in full — no simplification.

```mermaid
%%{init: {"flowchart": {"defaultRenderer": "elk"}} }%%
flowchart TB

    subgraph L0["<b>Layer 0 — External World</b>"]

        %% ── Human Users ────────────────────────────────
        subgraph users_group["<b>Human Users</b>"]
            direction TB
            l0_chat_user(["Chat User<br/>(text input via UI)"])
            l0_voice_user(["Voice User<br/>(microphone stream)"])
            l0_file_user(["File Upload User<br/>(drag & drop / CLI)"])
            l0_gesture_user(["Gesture / Touch User<br/>(future: camera / touchscreen)"])
        end

        %% ── APIs & Services ────────────────────────────
        subgraph api_group["<b>APIs & Services</b>"]
            direction TB
            l0_rest_api(["REST APIs<br/>HTTP/HTTPS GET/POST<br/>JSON / XML payloads"])
            l0_ws_api(["WebSocket APIs<br/>Persistent bidirectional<br/>Real-time streaming"])
            l0_graphql_api(["GraphQL APIs<br/>Structured queries<br/>Schema-typed responses"])
            l0_webhook_inbound(["Inbound Webhooks<br/>Event-driven push<br/>n8n / Zapier triggers"])
        end

        %% ── Sensors & Hardware ─────────────────────────
        subgraph sensor_group["<b>Sensors & Hardware</b>"]
            direction TB
            l0_camera_sensor(["Camera<br/>Video / image frames<br/>RGB / depth"])
            l0_mic_sensor(["Microphone<br/>PCM audio stream<br/>16kHz+ sample rate"])
            l0_iot_sensor(["IoT Sensors<br/>MQTT / CoAP<br/>Temperature, motion,<br/>humidity, pressure"])
            l0_gpio_sensor(["GPIO / Serial<br/>Embedded devices<br/>Raw byte streams"])
        end

        %% ── P2P Mesh Network ──────────────────────────
        subgraph p2p_group["<b>P2P Mesh Network</b>"]
            direction TB
            p2p_node_a(["Peer Node A<br/>libp2p identity<br/>Ed25519 keypair"])
            p2p_node_b(["Peer Node B<br/>libp2p identity<br/>Ed25519 keypair"])
            p2p_node_n(["Peer Node N<br/>libp2p identity<br/>Ed25519 keypair"])
            l0_gossip_proto["Gossip Protocol<br/>Pub/Sub topics<br/>CRDT state sync"]
            l0_ipfs_gateway["IPFS Gateway<br/>Content-addressed<br/>Module CIDs"]
            p2p_node_a <--> l0_gossip_proto
            p2p_node_b <--> l0_gossip_proto
            p2p_node_n <--> l0_gossip_proto
            l0_gossip_proto <--> l0_ipfs_gateway
        end

        %% ── OS / File System ──────────────────────────
        subgraph os_group["<b>OS / File System</b>"]
            direction TB
            l0_fs_events(["File System Events<br/>inotify / FSEvents / ReadDirectoryChanges<br/>Create, modify, delete, rename"])
            l0_proc_events(["Process Events<br/>Spawn, exit, signal<br/>PID tracking"])
            l0_clipboard(["Clipboard<br/>Text / image / rich content<br/>OS l0_clipboard API"])
            l0_env_vars(["Environment<br/>PATH, config vars<br/>OS metadata"])
            l0_stdin_pipe(["stdin / Pipes<br/>CLI piped input<br/>Raw byte stream"])
        end

        %% ── Data Streams ──────────────────────────────
        subgraph data_group["<b>Structured Data Streams</b>"]
            direction TB
            csv_data(["CSV / TSV<br/>Tabular data<br/>Row-columnar"])
            json_data(["JSON / JSONL<br/>Nested objects<br/>Streaming lines"])
            db_stream(["Database Feeds<br/>CDC / polling<br/>SQL result sets"])
            log_stream(["Log Streams<br/>syslog / journald<br/>Structured / unstructured"])
        end
    end

    subgraph L1["<b>Layer 1 — Input Translators</b>"]

        %% ═══════════════════════════════════════════════
        %% TEXT TRANSLATOR (Reference Implementation)
        %% ═══════════════════════════════════════════════
        subgraph text_translator["<b>Text Translator</b> (reference implementation)"]
            direction TB

            l1_raw_text["Raw Text Input<br/><i>UTF-8 string</i>"]

            subgraph llm_stage["<b>Stage 1: Frozen LLM Backbone</b><br/><i>~1-7B params (Llama / Mistral / Qwen)</i><br/>Parameters NEVER modified — knowledge dictionary"]
                direction TB
                tokenizer["Tokenizer<br/>BPE / SentencePiece<br/>text → token IDs"]
                embed_layer["Embedding Layer<br/>token IDs → dense vectors<br/>[seq_len × hidden_dim]"]
                transformer_layers["Transformer Layers<br/>Self-attention + FFN<br/>Contextual embeddings<br/>[seq_len × hidden_dim]"]
                pooled_output["Pooled Hidden States<br/>Last-layer representations<br/>per-token contextual vectors"]

                tokenizer --> embed_layer --> transformer_layers --> pooled_output
            end

            subgraph proj_stage["<b>Stage 2: Frame Projection Head</b><br/><i>~50M trainable params</i>"]
                direction TB

                subgraph role_detect["<b>Step 2a: Semantic Role Detection</b>"]
                    direction LR
                    srl_classifier["SRL Classifier<br/>MLP + softmax<br/>per-token role probabilities"]
                    role_labels["Detected Roles:<br/>AGENT · PREDICATE · PATIENT<br/>LOCATION · TIME · MANNER<br/>INSTRUMENT · CAUSE · RESULT<br/>FREE₁-FREE₇"]
                    srl_classifier --> role_labels
                end

                subgraph slot_assign["<b>Step 2b: Slot Assignment</b>"]
                    direction LR
                    span_grouper["Span Grouper<br/>BIO tagging<br/>merge multi-token spans"]
                    slot_router["Slot Router<br/>role → slot index<br/>conflict: γ-priority"]
                    span_grouper --> slot_router
                end

                subgraph res_fill["<b>Step 2c: Resolution Filling</b>"]
                    direction LR
                    r0_proj["R₀ Projection<br/>Discourse-level<br/>topic / mood / intent<br/>Linear: hidden→256"]
                    r1_proj["R₁ Projection<br/>Proposition-level<br/>sentence semantics<br/>Linear: hidden→256"]
                    r2_proj["R₂ Projection<br/>Phrase-level<br/>entities / values / modifiers<br/>Linear: hidden→256"]
                    r3_proj["R₃ Projection<br/>Token-level<br/>subword detail<br/>Linear: hidden→256"]
                end

                role_detect --> slot_assign --> res_fill
            end

            subgraph quant_stage["<b>Stage 3: VQ-VAE Quantizer</b>"]
                direction TB
                continuous_vec["Continuous Vector<br/>[256-dim per slot×res]"]
                hnsw_lookup["HNSW Codebook Lookup<br/>Find nearest code vector<br/>cosine distance"]
                commitment_loss["Commitment Loss<br/>‖z - sg(e)‖² + β‖sg(z) - e‖²<br/>+ EMA centroid update"]
                l1_quantized_vec["Quantized Vector<br/>u16 code index<br/>→ codebook[idx] ∈ ℝ²⁵⁶"]
                continuous_vec --> hnsw_lookup --> commitment_loss --> l1_quantized_vec
            end

            l1_raw_text --> llm_stage
            pooled_output --> proj_stage
            res_fill --> quant_stage
        end

        %% ═══════════════════════════════════════════════
        %% VISION TRANSLATOR
        %% ═══════════════════════════════════════════════
        subgraph vision_translator["<b>Vision Translator</b>"]
            direction TB

            l1_raw_image["Raw Image / Video Frame<br/><i>RGB tensor [H × W × 3]</i>"]

            subgraph vision_backbone["<b>Vision Backbone</b><br/><i>Frozen ViT / CLIP visual encoder</i>"]
                direction TB
                patch_embed["Patch Embedding<br/>Image → 16×16 patches<br/>→ patch tokens"]
                vit_layers["ViT Layers<br/>Self-attention over patches<br/>Spatial features"]
                cls_token["CLS + Patch Features<br/>[num_patches × hidden_dim]"]
                patch_embed --> vit_layers --> cls_token
            end

            subgraph vision_slot_map["<b>Vision Slot Mapping</b>"]
                direction LR
                obj_detect["Object Detection<br/>Detected objects<br/>→ AGENT / PATIENT"]
                scene_class["Scene Classification<br/>Scene context<br/>→ LOCATION"]
                action_recog["Action Recognition<br/>Detected actions<br/>→ PREDICATE"]
                attr_extract["Attribute Extraction<br/>Color, size, texture<br/>→ MANNER"]
                spatial_rel["Spatial Relations<br/>Above, beside, inside<br/>→ FREE slots"]
            end

            l1_vision_vqvae["VQ-VAE Quantize<br/>→ Tensor Frame"]

            l1_raw_image --> vision_backbone
            cls_token --> vision_slot_map
            vision_slot_map --> l1_vision_vqvae
        end

        %% ═══════════════════════════════════════════════
        %% AUDIO TRANSLATOR
        %% ═══════════════════════════════════════════════
        subgraph audio_translator["<b>Audio Translator</b>"]
            direction TB

            l1_raw_audio["Raw Audio<br/><i>PCM stream, 16kHz+</i>"]

            subgraph audio_branch["<b>Dual Branch</b>"]
                direction LR

                subgraph speech_branch["<b>Speech Branch</b>"]
                    direction TB
                    vad["Voice Activity Detection<br/>Silero VAD<br/>speech / non-speech"]
                    asr["ASR Engine<br/>Whisper / Canary<br/>speech → text"]
                    text_pipe["→ Text Translator<br/>Pipeline reuse"]
                    vad --> asr --> text_pipe
                end

                subgraph nonspeech_branch["<b>Non-Speech Branch</b>"]
                    direction TB
                    mel_spec["Mel Spectrogram<br/>FFT → mel filterbank<br/>[frames × n_mels]"]
                    audio_encoder["Audio Encoder<br/>Frozen audio model<br/>Feature extraction"]
                    audio_slot_map["Slot Mapping:<br/>Tone → MANNER<br/>Instrument → INSTRUMENT<br/>Ambient → LOCATION<br/>Rhythm → TIME"]
                    mel_spec --> audio_encoder --> audio_slot_map
                end
            end

            l1_audio_vqvae["VQ-VAE Quantize<br/>→ Tensor Frame"]

            l1_raw_audio --> audio_branch
            text_pipe --> l1_audio_vqvae
            audio_slot_map --> l1_audio_vqvae
        end

        %% ═══════════════════════════════════════════════
        %% DATA TRANSLATOR
        %% ═══════════════════════════════════════════════
        subgraph data_translator["<b>Data Translator</b>"]
            direction TB

            l1_raw_data["Structured Data<br/><i>JSON / CSV / SQL / XML</i>"]

            subgraph data_pipeline["<b>Data Pipeline</b>"]
                direction TB
                schema_detect["Schema Detection<br/>Infer column types<br/>+ relationships"]
                field_map["Field → Slot Mapping<br/>subject → AGENT<br/>action → PREDICATE<br/>object → PATIENT<br/>where → LOCATION<br/>when → TIME"]
                agg_r0["Aggregate → R₀<br/>Summary statistics<br/>→ discourse gist"]
                row_r1["Row-level → R₁<br/>Individual records<br/>→ proposition"]
                cell_r2["Cell-level → R₂<br/>Specific values<br/>→ phrase detail"]
                schema_detect --> field_map
                field_map --> agg_r0
                field_map --> row_r1
                field_map --> cell_r2
            end

            l1_data_vqvae["VQ-VAE Quantize<br/>→ Tensor Frame"]

            l1_raw_data --> data_pipeline --> l1_data_vqvae
        end

        %% ═══════════════════════════════════════════════
        %% SENSOR / OS TRANSLATOR
        %% ═══════════════════════════════════════════════
        subgraph sensor_translator["<b>Sensor / OS Translator</b>"]
            direction TB

            l1_raw_sensor["Sensor / OS Events<br/><i>MQTT, inotify, proc signals</i>"]

            subgraph sensor_pipeline["<b>Sensor Pipeline</b>"]
                direction TB
                event_parse["Event Parser<br/>Protocol-specific decode<br/>MQTT / CoAP / serial / OS API"]
                sensor_slot_map["Slot Mapping:<br/>reading value → PATIENT<br/>sensor source → AGENT<br/>timestamp → TIME<br/>event type → PREDICATE<br/>threshold breach → CAUSE<br/>device ID → INSTRUMENT"]
                normalize["Value Normalization<br/>Unit conversion<br/>Range scaling [0,1]"]
                event_parse --> sensor_slot_map --> normalize
            end

            l1_sensor_vqvae["VQ-VAE Quantize<br/>→ Tensor Frame"]

            l1_raw_sensor --> sensor_pipeline --> l1_sensor_vqvae
        end
    end

    subgraph L2["<b>Layer 2 — LLL Tensor Frame Bus</b>"]

        %% ═══════════════════════════════════════════════
        %% TENSOR FRAME STRUCTURE
        %% ═══════════════════════════════════════════════
        subgraph l2_frame_struct["<b>Tensor Frame Structure</b><br/><i>F ∈ ℝ<sup>[S × R × D]</sup> — three-dimensional sparse tensor</i>"]
            direction TB

            subgraph slots["<b>S = 16 Slots</b>"]
                direction LR
                s0["Slot 0<br/><b>AGENT</b><br/>Who/what acts"]
                s1["Slot 1<br/><b>PREDICATE</b><br/>Action/state"]
                s2["Slot 2<br/><b>PATIENT</b><br/>Acted upon"]
                s3["Slot 3<br/><b>LOCATION</b><br/>Where"]
                s4["Slot 4<br/><b>TIME</b><br/>When"]
                s5["Slot 5<br/><b>MANNER</b><br/>How"]
                s6["Slot 6<br/><b>INSTRUMENT</b><br/>With what"]
                s7["Slot 7<br/><b>CAUSE</b><br/>Why"]
                s8["Slot 8<br/><b>RESULT</b><br/>Outcome"]
                s9["Slot 9<br/><b>FREE₁</b>"]
                s10["Slot 10<br/><b>FREE₂</b>"]
                s11["Slot 11<br/><b>FREE₃</b>"]
                s12["Slot 12<br/><b>FREE₄</b>"]
                s13["Slot 13<br/><b>FREE₅</b>"]
                s14["Slot 14<br/><b>FREE₆</b>"]
                s15["Slot 15<br/><b>FREE₇</b>"]
            end

            subgraph resolutions["<b>R = 4 Resolutions (per slot)</b>"]
                direction LR
                r0["<b>R₀ Discourse</b><br/>Topic, mood, intent<br/>Consumers: GPU, Bleed Buffer<br/>256 dims"]
                r1["<b>R₁ Proposition</b><br/>Sentence-level semantics<br/>Consumers: GPU + CPU<br/>256 dims"]
                r2["<b>R₂ Phrase</b><br/>Entities, values, modifiers<br/>Consumers: CPU, Output Decoder<br/>256 dims"]
                r3["<b>R₃ Token</b><br/>Subword tokens<br/>Consumer: Output decode only<br/>256 dims"]
            end

            subgraph dimensions["<b>D = 256 Dimensions</b>"]
                direction LR
                dim_info["Each slot×resolution = 256-dim<br/>unit vector ∈ ℝ²⁵⁶<br/>Quantized to VQ-VAE codebook<br/><br/><b>Max frame: 64 KB</b><br/>(16 slots × 4 res × 256 × f32)<br/><br/><b>Typical sparse: ~8 KB</b><br/>(4 slots × 2 resolutions filled)"]
            end

            subgraph frame_meta["<b>Frame Metadata</b>"]
                direction LR
                frame_id["Frame ID<br/>u64 unique"]
                strand_id["Strand ID<br/>Topic partition"]
                timestamp_f["Timestamp<br/>u64 nanoseconds"]
                gamma_f["γ (certainty)<br/>f32 ∈ [0,1]"]
                slot_mask["Slot Mask<br/>u16 bitfield<br/>which slots filled"]
                res_mask["Resolution Mask<br/>u8 per slot<br/>which resolutions filled"]
                parent_ref["Parent Frame Ref<br/>Optional u64<br/>causal chain"]
            end
        end

        %% ═══════════════════════════════════════════════
        %% VQ-VAE CODEBOOK
        %% ═══════════════════════════════════════════════
        subgraph codebook["<b>VQ-VAE Codebook</b>"]
            direction TB

            subgraph cb_structure["<b>Structure</b>"]
                direction LR
                cb_entries["65,536 entries (2¹⁶)<br/>u16 addressing<br/>0x0000 – 0xFFFF"]
                cb_dims["256-dim unit vectors<br/>each entry ∈ ℝ²⁵⁶<br/>‖e_i‖ = 1"]
                cb_memory["~67 MB resident<br/>65,536 × 256 × f32<br/>Always in RAM"]
            end

            subgraph cb_index["<b>HNSW Index over Codebook</b>"]
                direction LR
                hnsw_params["M = 16, ef_construction = 200<br/>ef_search = 50<br/>Cosine distance metric"]
                hnsw_perf["Lookup: ~10μs<br/>Top-1 nearest code vector<br/>O(log 65536) ≈ O(16)"]
            end

            subgraph cb_init["<b>Initialization & Update</b>"]
                direction TB
                cluster_init["Initial: K-means cluster<br/>LLM hidden states<br/>→ 65,536 centroids"]
                vqvae_train["VQ-VAE Training:<br/>Commitment loss:<br/>‖z - sg(e)‖²<br/>+ β‖sg(z) - e‖²"]
                ema_update["EMA Centroid Updates:<br/>e_i ← λ·e_i + (1-λ)·z̄_i<br/>Continuous refinement"]
                cluster_init --> vqvae_train --> ema_update
            end
        end

        %% ═══════════════════════════════════════════════
        %% HDC ALGEBRA OPERATIONS
        %% ═══════════════════════════════════════════════
        subgraph hdc["<b>HDC / HRR Algebra</b><br/><i>Operates on 256-dim vectors within slots</i>"]
            direction TB

            subgraph bind_op["<b>Binding (⊗) — Conjunctive Association</b>"]
                direction LR
                bind_in_a["Vector a<br/>[256]"]
                bind_fft_a["FFT(a)<br/>O(D log D)"]
                bind_mult["Element-wise ⊙<br/>FFT(a) ⊙ FFT(b)"]
                bind_fft_b["FFT(b)<br/>O(D log D)"]
                bind_in_b["Vector b<br/>[256]"]
                bind_ifft["IFFT(result)<br/>O(D log D)"]
                bind_out["a ⊗ b<br/>[256]"]

                bind_in_a --> bind_fft_a --> bind_mult
                bind_in_b --> bind_fft_b --> bind_mult
                bind_mult --> bind_ifft --> bind_out
            end

            subgraph super_op["<b>Superposition (+) — Set Combination</b>"]
                direction LR
                super_inputs["Vectors a, b, c<br/>[256] each"]
                super_add["Element-wise sum<br/>a + b + c"]
                super_norm["normalize()<br/>÷ ‖sum‖"]
                super_out["Superposition<br/>[256] unit vector"]
                super_inputs --> super_add --> super_norm --> super_out
            end

            subgraph perm_op["<b>Permutation (ρ) — Sequence Encoding</b>"]
                direction LR
                perm_input["Sequence [a, b, c]"]
                perm_shift["Cyclic shift:<br/>a + ρ¹(b) + ρ²(c)<br/>ρᵏ = shift by k positions"]
                perm_out["Sequence-aware<br/>superposition [256]"]
                perm_input --> perm_shift --> perm_out
            end

            subgraph unbind_op["<b>Unbinding (⊗⁻¹) — Constituent Retrieval</b>"]
                direction LR
                unbind_bound["Bound vector<br/>a ⊗ b"]
                unbind_inv["Involution:<br/>x⁻¹_i = x_{(-i mod D)}<br/>Self-inverse property"]
                unbind_result["≈ b (recovered)<br/>cosine sim > 0.9<br/>with noise floor"]
                unbind_bound --> unbind_inv --> unbind_result
            end

            subgraph role_filler_op["<b>Role-Filler — Structured Knowledge</b>"]
                direction LR
                rf_roles["Roles: r₁, r₂, ..., rₙ<br/>(random unit vectors)"]
                rf_fillers["Fillers: f₁, f₂, ..., fₙ<br/>(content vectors)"]
                rf_bind["Σᵢ (rᵢ ⊗ fᵢ)<br/>Each role bound to filler"]
                rf_result["Composite vector<br/>All role-filler pairs<br/>retrievable via unbinding"]
                rf_roles --> rf_bind
                rf_fillers --> rf_bind
                rf_bind --> rf_result
            end
        end

        %% ═══════════════════════════════════════════════
        %% CERTAINTY PROPAGATION
        %% ═══════════════════════════════════════════════
        subgraph certainty["<b>Certainty (γ) Propagation</b>"]
            direction TB

            subgraph gamma_per_slot["<b>Per-Slot Certainty</b>"]
                direction LR
                slot_gamma["γ_slot ∈ [0, 1]<br/>Set at RAR convergence<br/>‖ΔS‖ < ε → compute γ"]
                gamma_sources["Sources:<br/>Convergence speed → higher γ<br/>Codebook distance → lower if far<br/>Slot fill completeness"]
            end

            subgraph gamma_chain["<b>Chain Rule (Min-Rule)</b>"]
                direction TB
                chain_premise["Premise A → B<br/>γ(A→B) = 0.95"]
                chain_step["Step B → C<br/>γ(B→C) = 0.80"]
                chain_result["Conclusion A → C<br/>γ(A→C) = min(0.95, 0.80) = <b>0.80</b>"]
                chain_premise --> chain_result
                chain_step --> chain_result
            end

            subgraph gamma_frame["<b>Frame-Level Certainty</b>"]
                direction LR
                frame_gamma_calc["γ(Frame) = min(γ of all filled slots)<br/><br/>One uncertain slot honestly<br/>reduces overall confidence<br/><br/>γ ≥ 0.90 → high confidence<br/>γ ∈ [0.50, 0.90) → medium<br/>γ < 0.50 → uncertain"]
            end

            gamma_per_slot --> gamma_chain --> gamma_frame
        end

        %% ═══════════════════════════════════════════════
        %% FRAME OPERATIONS
        %% ═══════════════════════════════════════════════
        subgraph frame_ops["<b>Frame-Level Operations</b>"]
            direction TB

            subgraph slot_write["<b>Slot Write</b> (random access)"]
                slot_write_ex["F[slot=2, res=1] = encode('lifetime bug')<br/>Direct addressing, O(1)"]
            end

            subgraph res_zoom["<b>Resolution Zoom</b>"]
                res_zoom_ex["Reason at R₀ (cheap)<br/>Drill to R₂/R₃ only when needed<br/>Progressive detail on demand"]
            end

            subgraph compose_op["<b>Frame Composition</b>"]
                compose_ex["Merge non-empty slots<br/>from multiple frames<br/>γ-priority conflict resolution<br/>No information loss"]
            end

            subgraph l2_parallel_decode["<b>Parallel Decode</b>"]
                l2_decode_ex["All slots decoded simultaneously<br/>5-slot = 1-slot wall-clock<br/>GPU parallel decode"]
            end

            subgraph sparse_attn["<b>Sparse Attention Cost</b>"]
                attn_ex["O(16² × 256) = 65,536 ops<br/>vs. 100K-context transformer<br/>~20M× cheaper"]
            end
        end
    end

    subgraph L3["<b>Layer 3 — GPU Soft Core</b><br/><i>System 1: fast, parallel, associative, creative</i><br/><i>Continuous SDE dynamics on Tensor Frame slots</i>"]

        %% ═══════════════════════════════════════════════
        %% INPUT
        %% ═══════════════════════════════════════════════
        l3_input_frame{{"Input: Candidate Tensor Frame<br/>from Bus (Layer 2)<br/>F ∈ ℝ<sup>[16 × 4 × 256]</sup>"}}

        %% ═══════════════════════════════════════════════
        %% RAR LOOP
        %% ═══════════════════════════════════════════════
        subgraph rar_loop["<b>RAR Loop — Root-Attend-Refine</b><br/><i>Iterates until all slots converge or budget exhausted</i>"]
            direction TB

            iteration_counter["Iteration Counter<br/>t = 0, 1, 2, ...<br/>Typical: 8-15 iterations<br/>Budget max: configurable"]

            %% ── ROOT PHASE ─────────────────────────────
            subgraph root_phase["<b>ROOT Phase</b> (parallel per slot)<br/><i>All 16 slots embarrassingly parallel on GPU</i>"]
                direction TB

                subgraph root_slot_0["Slot 0 (AGENT)"]
                    direction TB
                    root_vfn_0["VFN pass: f_θ(S₀[R₀])<br/>[256] → [256]<br/>Shared weights"]
                    root_noise_0["Diffusion noise:<br/>σ₀ × sample_orthogonal_to(drift₀)<br/>σ₀ = σ_φ(S₀, conv_rate₀, mirror)"]
                    root_delta_0["ΔS₀ = drift₀ + noise₀"]
                    root_vfn_0 --> root_noise_0 --> root_delta_0
                end

                subgraph root_slot_1["Slot 1 (PREDICATE)"]
                    direction TB
                    root_vfn_1["VFN pass: f_θ(S₁[R₀])<br/>[256] → [256]"]
                    root_noise_1["Diffusion noise:<br/>σ₁ × sample_orthogonal_to(drift₁)"]
                    root_delta_1["ΔS₁ = drift₁ + noise₁"]
                    root_vfn_1 --> root_noise_1 --> root_delta_1
                end

                subgraph root_slot_2["Slot 2 (PATIENT)"]
                    direction TB
                    root_vfn_2["VFN pass: f_θ(S₂[R₀])<br/>[256] → [256]"]
                    root_noise_2["Diffusion noise:<br/>σ₂ × sample_orthogonal_to(drift₂)"]
                    root_delta_2["ΔS₂ = drift₂ + noise₂"]
                    root_vfn_2 --> root_noise_2 --> root_delta_2
                end

                subgraph root_slot_n["Slots 3-15<br/>(LOCATION, TIME, MANNER,<br/>INSTRUMENT, CAUSE, RESULT,<br/>FREE₁-FREE₇)"]
                    direction TB
                    root_vfn_n["VFN pass: f_θ(Sₙ[R₀])<br/>[256] → [256]<br/>Same shared weights"]
                    root_noise_n["Diffusion noise:<br/>σₙ × sample_orthogonal_to(driftₙ)"]
                    root_delta_n["ΔSₙ = driftₙ + noiseₙ"]
                    root_vfn_n --> root_noise_n --> root_delta_n
                end
            end

            %% ── ATTEND PHASE ───────────────────────────
            subgraph attend_phase["<b>ATTEND Phase</b> (cross-slot interaction)<br/><i>All slots attend to all others + ghosts</i>"]
                direction TB

                subgraph qkv_compute["<b>Q/K/V Computation</b>"]
                    direction LR
                    q_proj["Q = W_Q · root_i<br/>[256] → [64]<br/>per query slot i"]
                    k_proj["K = W_K · root_j<br/>[256] → [64]<br/>per key slot j"]
                    v_proj["V = W_V · root_j<br/>[256] → [256]<br/>per value slot j"]
                end

                subgraph attn_compute["<b>Attention Scores</b>"]
                    direction TB
                    dot_prod["Dot product:<br/>Q_i · K_j for all j<br/>16 × 16 = 256 dot products"]
                    scale_div["Scale: ÷ √64 = ÷ 8<br/>Prevent gradient vanishing"]
                    softmax_op["Softmax over j:<br/>A_ij = exp(score_ij) / Σ_k exp(score_ik)<br/>Attention weights [16 × 16]"]
                    dot_prod --> scale_div --> softmax_op
                end

                subgraph context_compute["<b>Context Vectors</b>"]
                    direction TB
                    weighted_sum["Slot context:<br/>ctx_i = Σ_j (A_ij × V_j)<br/>[256] per slot"]
                    ghost_attn["Ghost attention:<br/>ghost_ctx_i = α × Σ_g (A_ig × V_g)<br/>α = ghost weight (tunable)<br/>g ∈ ghost buffer (~1000 R₀s)"]
                    total_ctx["Total context_i =<br/>ctx_i + ghost_ctx_i<br/>[256] per slot"]
                    weighted_sum --> total_ctx
                    ghost_attn --> total_ctx
                end

                subgraph attn_cost["<b>Cost</b>"]
                    cost_calc["16 slots × 16 keys × 256 dim<br/>= <b>65,536 multiply-adds</b><br/>+ ~1000 ghost keys<br/>≈ 321,536 total ops<br/><i>Negligible vs transformer</i>"]
                end

                qkv_compute --> attn_compute --> context_compute
            end

            %% ── REFINE PHASE ───────────────────────────
            subgraph refine_phase["<b>REFINE Phase</b> (update + convergence check)<br/><i>Per-slot: update state, check convergence</i>"]
                direction TB

                subgraph update_rule["<b>State Update</b>"]
                    direction TB
                    update_eq["S_i(t+1) = normalize(<br/>  S_i(t) + dt_i × (ΔS_i + β × context_i)<br/>)<br/><br/>dt_i = adaptive step size<br/>β = context mixing weight<br/>normalize = project to unit sphere"]
                end

                subgraph convergence["<b>Convergence Check</b>"]
                    direction TB
                    delta_norm["Compute ‖S_i(t+1) − S_i(t)‖<br/>(L2 norm of change)"]
                    epsilon_check{"‖ΔS‖ < ε ?"}
                    freeze_slot["<b>FREEZE slot</b><br/>Mark converged<br/>Compute γ_i<br/>Still serves as K/V in Attend"]
                    continue_slot["<b>CONTINUE</b><br/>Slot remains active<br/>→ next Root iteration"]
                    delta_norm --> epsilon_check
                    epsilon_check -->|"Yes: converged"| freeze_slot
                    epsilon_check -->|"No: still moving"| continue_slot
                end

                subgraph termination["<b>Termination Conditions</b>"]
                    direction LR
                    all_converged["All 16 slots frozen<br/>→ <b>Complete convergence</b><br/>γ = min(all slot γ)"]
                    budget_hit["Iteration budget exhausted<br/>→ <b>Partial convergence</b><br/>Honest partial γ reported"]
                end

                update_rule --> convergence --> termination
            end

            %% ── RAR LOOP FLOW ──────────────────────────
            iteration_counter --> root_phase
            root_phase --> attend_phase
            attend_phase --> refine_phase
            continue_slot -->|"unconverged slots<br/>loop back"| iteration_counter
        end

        %% ═══════════════════════════════════════════════
        %% VFN (Vector Field Network)
        %% ═══════════════════════════════════════════════
        subgraph vfn_block["<b>Vector Field Network (VFN)</b><br/><i>Shared weights across all slots — like conv filters</i><br/><i>f_θ = −∇E (gradient of energy landscape)</i>"]
            direction TB

            subgraph vfn_arch["<b>Architecture</b>"]
                direction LR
                vfn_input["Input: S_i[R₀]<br/>[256-dim]"]
                vfn_layers["Hidden layers<br/>(config-dependent)"]
                vfn_output["Output: drift vector<br/>[256-dim]<br/>Points toward<br/>energy minimum"]
                vfn_input --> vfn_layers --> vfn_output
            end

            subgraph vfn_configs["<b>VFN Configurations</b>"]
                direction LR
                vfn_edge["<b>Edge</b><br/>100M params<br/>Gated MLP (4 layers)<br/>Target: Mobile<br/>~6M FLOPs/iter"]
                vfn_standard["<b>Standard</b><br/>500M params<br/>FNO (8 layers)<br/>Target: Consumer PC<br/>~25M FLOPs/iter"]
                vfn_research["<b>Research</b><br/>2B params<br/>FNO + residual (16 layers)<br/>Target: Workstation<br/>~100M FLOPs/iter"]
            end

            subgraph energy_landscape["<b>Energy Landscape</b>"]
                direction TB
                energy_concept["E(S) = energy at state S<br/>f_θ = −∇E<br/>Drift pushes toward minima<br/><br/>Attractors = learned concepts<br/>Basins = concept neighborhoods<br/>Saddle points = ambiguity"]
                landscape_evolves["Landscape reshaped by:<br/>• Sleep consolidation (new attractors)<br/>• Forward-Forward updates<br/>• Unused attractors flatten"]
            end
        end

        %% ═══════════════════════════════════════════════
        %% DIFFUSION CONTROLLER
        %% ═══════════════════════════════════════════════
        subgraph diffusion_block["<b>Diffusion Controller σ_φ</b><br/><i>Adaptive noise magnitude per slot</i>"]
            direction TB

            subgraph diff_inputs["<b>Inputs</b>"]
                direction LR
                conv_rate_in["Convergence rate<br/>of each slot"]
                mirror_signal_in["Mirror signal<br/>from MirrorModule<br/>(Layer 4)"]
                mode_in["Operating mode<br/>(analytical / creative)"]
            end

            subgraph diff_rules["<b>Noise Rules</b>"]
                direction TB
                converged_rule["<b>Converged slot</b><br/>σ ≈ 0 (frozen)<br/>No exploration needed"]
                stuck_rule["<b>Stuck slot</b><br/>(low Δ, not converged)<br/>σ = HIGH<br/>Explore new basin"]
                creative_rule["<b>Creative mode</b><br/>Higher baseline σ<br/>More diverse exploration"]
                normal_rule["<b>Normal slot</b><br/>σ = moderate<br/>Balanced drift + noise"]
            end

            subgraph noise_geometry["<b>Noise Geometry</b>"]
                direction LR
                ortho_sample["sample_orthogonal_to(drift)<br/>Noise perpendicular to drift<br/>Explores WITHOUT opposing<br/>the energy gradient"]
            end

            diff_inputs --> diff_rules --> noise_geometry
        end

        %% ═══════════════════════════════════════════════
        %% GHOST BLEED BUFFER
        %% ═══════════════════════════════════════════════
        subgraph ghost_block["<b>Ghost Bleed Buffer</b><br/><i>~1,000 R₀ ghosts in VRAM (~1 MB)</i>"]
            direction TB

            subgraph ghost_content["<b>Contents</b>"]
                direction LR
                ghost_r0s["~1,000 R₀ gist vectors<br/>256-dim each<br/>From recently evicted<br/>+ semantically relevant frames"]
                ghost_meta["Per ghost:<br/>• Original frame ID<br/>• Strand ID<br/>• Cosine sim score<br/>• Last access time"]
            end

            subgraph ghost_mechanism["<b>Mechanism</b>"]
                direction TB
                energy_dips["Create energy landscape dips<br/>during Attend phase<br/>via ghost K/V pairs"]
                page_fault["Cosine sim > threshold<br/>→ <b>Ghost page fault</b><br/>→ Full frame load from RAM<br/>~10-50ms (on-demand recall)"]
                refresh["Bleed Engine (CPU) refreshes<br/>on significant R₀ change<br/>via HNSW query against T1"]
                energy_dips --> page_fault
                energy_dips --> refresh
            end
        end

        %% ═══════════════════════════════════════════════
        %% COMPUTE COST
        %% ═══════════════════════════════════════════════
        subgraph compute_cost["<b>Compute Cost</b>"]
            direction LR
            volt_cost["<b>Volt XA per query</b><br/>~25M FLOPs<br/>(12 iterations × ~2M per iter)"]
            gpt4_cost["<b>GPT-4 (500 tokens)</b><br/>~900T FLOPs"]
            ratio["<b>Ratio: ~36,000,000× less</b>"]
            volt_cost --- gpt4_cost --- ratio
        end

        %% ═══════════════════════════════════════════════
        %% OUTPUT
        %% ═══════════════════════════════════════════════
        l3_output_frame{{"Output: Refined Tensor Frame<br/>All slots converged (or partial)<br/>γ computed per slot<br/>→ back to Bus (Layer 2)"}}
    end

    subgraph L4["<b>Layer 4 — CPU Hard Core</b><br/><i>System 2: sequential, logical, deterministic</i><br/><i>Same input → same output. No hallucination on computational tasks.</i>"]

        %% ═══════════════════════════════════════════════
        %% INPUT
        %% ═══════════════════════════════════════════════
        input_frame{{"Input: Refined Tensor Frame<br/>from Bus via Layer 3<br/>Contains R₀ gist for routing"}}

        %% ═══════════════════════════════════════════════
        %% INTENT ROUTER
        %% ═══════════════════════════════════════════════
        subgraph l4_intent_router["<b>Intent Router</b><br/><i>Pure vector geometry — no JSON, no string matching, no tool name hallucination</i>"]
            direction TB

            subgraph routing_process["<b>Routing Process</b>"]
                direction TB
                extract_gist["Extract R₀ gist vector<br/>from frame [256-dim]"]
                compute_cos["Compute cosine similarity<br/>gist · capability_vector_k / (‖gist‖ · ‖cap_k‖)<br/>for each registered strand k"]
                rank_strands["Rank strands by similarity<br/>Top-1 or top-K dispatch<br/>Threshold: sim > τ_route"]
                no_match{"sim < τ_route<br/>for ALL strands?"}
                dispatch["Dispatch frame to<br/>best-matching strand(s)"]
                fallback["Return NeedsMoreInfo<br/>or Delegated(GPU)"]
                extract_gist --> compute_cos --> rank_strands --> no_match
                no_match -->|"match found"| dispatch
                no_match -->|"no match"| fallback
            end

            subgraph capability_registry["<b>Capability Vector Registry</b>"]
                direction LR
                cap_math["MathEngine cap<br/>[256-dim] trained on<br/>math query embeddings"]
                cap_code["CodeRunner cap<br/>[256-dim] trained on<br/>code query embeddings"]
                cap_api["APIDispatch cap<br/>[256-dim] trained on<br/>API query embeddings"]
                cap_hdc["HDCAlgebra cap<br/>[256-dim] trained on<br/>HDC query embeddings"]
                cap_cert["CertaintyEngine cap<br/>[256-dim] trained on<br/>certainty queries"]
                cap_proof["ProofConstructor cap<br/>[256-dim]"]
                cap_causal["CausalSimulator cap<br/>[256-dim]"]
                cap_mirror["MirrorModule cap<br/>[256-dim]"]
                cap_sleep["SleepLearner cap<br/>[256-dim]"]
                cap_ledger["LedgerStrand cap<br/>[256-dim]"]
            end
        end

        %% ═══════════════════════════════════════════════
        %% HARD STRANDS
        %% ═══════════════════════════════════════════════
        subgraph hard_strands["<b>Hard Strands</b><br/><i>All implement HardStrand trait</i><br/><i>Results: Resolved(frame + proof) | NeedsMoreInfo | Delegated | Failed</i>"]
            direction TB

            subgraph math_engine["<b>MathEngine</b>"]
                direction TB
                math_input["Input: frame with<br/>PREDICATE = math op<br/>PATIENT = operands"]
                math_arb["Arbitrary-precision arithmetic<br/>rug / num-bigint crate<br/>Integer, rational, float"]
                math_algebra["Symbolic algebra<br/>Simplification, factoring<br/>Equation solving"]
                math_calculus["Calculus operations<br/>Differentiation, integration<br/>Series expansion"]
                math_proof["Result: exact answer<br/>+ proof steps<br/>γ = 1.0 (deterministic)"]
                math_input --> math_arb --> math_algebra --> math_calculus --> math_proof
            end

            subgraph code_runner["<b>CodeRunner</b>"]
                direction TB
                code_input["Input: frame with<br/>PREDICATE = execute<br/>PATIENT = code"]
                sandbox_env["Sandboxed Environment<br/>wasmtime (WASM)<br/>Resource limits:<br/>Memory cap, CPU timeout"]
                lang_rust["Rust execution<br/>Compile → WASM → run"]
                lang_python["Python execution<br/>RustPython / Pyodide<br/>→ WASM sandbox"]
                lang_wasm["Direct WASM<br/>Pre-compiled modules"]
                code_result["Result: stdout/stderr<br/>+ exit code<br/>+ proof of execution"]
                code_input --> sandbox_env
                sandbox_env --> lang_rust
                sandbox_env --> lang_python
                sandbox_env --> lang_wasm
                lang_rust --> code_result
                lang_python --> code_result
                lang_wasm --> code_result
            end

            subgraph api_dispatch["<b>APIDispatch</b>"]
                direction TB
                api_input["Input: frame with<br/>PREDICATE = API call<br/>PATIENT = endpoint/params"]
                tokio_runtime["Tokio async runtime<br/>50+ concurrent requests<br/>Connection pooling"]
                http_methods["HTTP methods:<br/>GET / POST / PUT / DELETE<br/>Headers, auth tokens, body"]
                rate_limit["Rate limiting<br/>Per-endpoint throttle<br/>Retry with backoff"]
                api_result["Result: response frame<br/>+ status code<br/>+ timing metadata"]
                api_input --> tokio_runtime --> http_methods --> rate_limit --> api_result
            end

            subgraph hdc_algebra["<b>HDCAlgebra</b>"]
                direction TB
                hdc_input["Input: frame requiring<br/>HDC operations"]
                fft_bind["FFT Binding ⊗<br/>IFFT(FFT(a) ⊙ FFT(b))"]
                fft_unbind["FFT Unbinding ⊗⁻¹<br/>Involution recovery"]
                hdc_super["Superposition +<br/>normalize(a + b + c)"]
                hdc_perm["Permutation ρ<br/>Cyclic shift"]
                hdc_result["Result: computed vector<br/>+ operation proof"]
                hdc_input --> fft_bind
                hdc_input --> fft_unbind
                hdc_input --> hdc_super
                hdc_input --> hdc_perm
                fft_bind --> hdc_result
                fft_unbind --> hdc_result
                hdc_super --> hdc_result
                hdc_perm --> hdc_result
            end

            subgraph certainty_engine["<b>CertaintyEngine</b>"]
                direction TB
                cert_input["Input: frame chain<br/>for γ validation"]
                min_rule["Min-rule propagation:<br/>γ(A→C) = min(γ(A→B), γ(B→C))"]
                proof_valid["Proof validation:<br/>Verify each step's γ<br/>Chain integrity check"]
                cert_aggregate["Aggregate frame γ:<br/>γ(Frame) = min(all filled slots)"]
                cert_result["Result: validated γ<br/>+ proof chain<br/>+ confidence level"]
                cert_input --> min_rule --> proof_valid --> cert_aggregate --> cert_result
            end

            subgraph proof_constructor["<b>ProofConstructor</b>"]
                direction TB
                proof_input["Input: reasoning steps<br/>from other strands"]
                step_record["Record each step:<br/>premise → conclusion<br/>+ strand used<br/>+ γ at each step"]
                chain_build["Build proof chain:<br/>Ordered step sequence<br/>Fully auditable trace"]
                proof_output["Result: complete proof<br/>Human-readable trace<br/>Attached to output frame"]
                proof_input --> step_record --> chain_build --> proof_output
            end

            subgraph causal_sim["<b>CausalSimulator</b>"]
                direction TB
                causal_input["Input: frame with<br/>PREDICATE = 'what if'<br/>PATIENT = intervention"]
                do_calc["Pearl's do-calculus:<br/>P(Y | do(X)) computation<br/>Causal graph traversal"]
                clone_frame["Clone current frame<br/>Apply intervention<br/>Run Soft Core forward"]
                consequence["Consequence preview:<br/>Predicted outcomes<br/>Before real execution"]
                causal_result["Result: predicted frame<br/>+ causal graph<br/>+ confidence bounds"]
                causal_input --> do_calc --> clone_frame --> consequence --> causal_result
            end

            subgraph mirror_module["<b>MirrorModule</b>"]
                direction TB
                mirror_input["Input: current RAR state<br/>+ iteration history"]
                loop_detect["Loop detection:<br/>Cosine sim of states<br/>across iterations<br/>Detect cycling"]
                uncertainty_est["Uncertainty estimation:<br/>Convergence rate tracking<br/>Stall detection"]
                self_report["Self-report:<br/>Confidence in own output<br/>Meta-cognitive assessment"]
                l4_mirror_signal_out["Output: mirror signal<br/>→ Diffusion Controller (L3)<br/>High uncertainty → raise σ"]
                mirror_input --> loop_detect --> uncertainty_est --> self_report --> l4_mirror_signal_out
            end

            subgraph sleep_learner["<b>SleepLearner</b>"]
                direction TB
                sleep_input["Input: consolidation request<br/>(triggered during idle)"]
                cluster_frames["Cluster related frames<br/>in T1 by strand<br/>HNSW neighborhood"]
                distill["Distill: 50 frames → 3-5<br/>Wisdom frames<br/>High-γ summaries"]
                ff_coord["Coordinate FF updates:<br/>Forward-Forward algorithm<br/>One VFN layer at a time<br/>~1× inference VRAM"]
                sleep_result["Result: updated VFN weights<br/>+ archived T1→T2<br/>+ new wisdom frames"]
                sleep_input --> cluster_frames --> distill --> ff_coord --> sleep_result
            end

            subgraph l4_ledger_strand["<b>LedgerStrand</b>"]
                direction TB
                ledger_input["Input: frame for<br/>Commons interaction"]
                merkle_append["Append to local<br/>Merkle log"]
                zk_proof["Generate ZK proof<br/>for strand export"]
                p2p_publish["Publish to P2P mesh<br/>via libp2p"]
                ledger_result["Result: published frame<br/>+ Merkle proof<br/>+ CID reference"]
                ledger_input --> merkle_append --> zk_proof --> p2p_publish --> ledger_result
            end
        end

        %% ═══════════════════════════════════════════════
        %% SAFETY LAYER
        %% ═══════════════════════════════════════════════
        subgraph safety_layer["<b>Safety Layer</b><br/><i>Defense in depth: every frame transition checked</i>"]
            direction TB

            subgraph axiomatic_guard["<b>Axiomatic Guard</b><br/><i>Cryptographically signed invariants — immune to training</i>"]
                direction TB
                k1["<b>K₁: No Physical Harm</b><br/>Frame must not encode<br/>instructions for physical<br/>harm to humans"]
                k2["<b>K₂: No CSAM</b><br/>Frame must not encode<br/>or generate child<br/>exploitation content"]
                k3["<b>K₃: No WMD</b><br/>Frame must not encode<br/>weapons of mass<br/>destruction knowledge"]
                k4["<b>K₄: No Identity Fraud</b><br/>Frame must not enable<br/>impersonation or<br/>identity theft"]
                k5["<b>K₅: Acknowledge AI</b><br/>System must identify<br/>itself as AI when<br/>directly asked"]
                signing["All invariants:<br/>Ed25519 signed<br/>Hash-chained<br/>Tamper-evident"]
            end

            subgraph transition_monitor["<b>Transition Monitor</b><br/><i>Checks every F(t) → F(t+1) transition</i>"]
                direction TB
                frame_diff["Compute frame delta:<br/>F(t+1) − F(t)<br/>Per-slot change vectors"]
                invariant_check["Check delta against<br/>each invariant K₁-K₅<br/>Cosine sim to violation vectors"]
                violation_detect{"Violation<br/>detected?"}
                warning_action["<b>Warning</b><br/>Log ⟨frame, invariant⟩<br/>Increase diffusion σ<br/>Steer away from violation"]
                critical_action["<b>Critical</b><br/>Escalate to Omega Veto<br/>Immediate halt"]
                no_violation["<b>Pass</b><br/>Transition approved<br/>Frame proceeds"]
                frame_diff --> invariant_check --> violation_detect
                violation_detect -->|"warning-level"| warning_action
                violation_detect -->|"critical-level"| critical_action
                violation_detect -->|"clean"| no_violation
            end

            subgraph omega_veto["<b>Omega Veto</b><br/><i>⚠ Hardware interrupt — NO software bypass</i>"]
                direction TB
                hw_interrupt["Hardware Interrupt<br/>CPU exception / NMI<br/>Cannot be caught<br/>by any software"]
                halt_action["<b>HALT</b><br/>Stop all processing<br/>Freeze current state"]
                freeze_action["<b>FREEZE</b><br/>Snapshot frame state<br/>Write to crash log"]
                log_action["<b>LOG</b><br/>Record violation details:<br/>• Frame F(t) and F(t+1)<br/>• Which invariant K_n<br/>• Timestamp<br/>• Full proof chain"]
                human_required["<b>HUMAN APPROVAL REQUIRED</b><br/>System remains halted<br/>until human reviews<br/>and explicitly resumes"]
                hw_interrupt --> halt_action --> freeze_action --> log_action --> human_required
            end

            axiomatic_guard --> transition_monitor
            critical_action --> omega_veto
        end

        %% ═══════════════════════════════════════════════
        %% FLOW
        %% ═══════════════════════════════════════════════
        input_frame ==> l4_intent_router
        dispatch ==> hard_strands
        hard_strands ==>|"frame transitions<br/>checked"| transition_monitor
        no_violation ==> l4_output_verified
        warning_action -.->|"raise σ"| diffusion_feedback

        %% ═══════════════════════════════════════════════
        %% OUTPUT
        %% ═══════════════════════════════════════════════
        l4_output_verified{{"Output: Verified Frame<br/>+ Proof Chain<br/>→ back to Bus (Layer 2)"}}
        diffusion_feedback["→ Diffusion Controller (Layer 3)<br/>Warning → increase σ"]
    end

    subgraph L5["<b>Layer 5 — VoltDB</b><br/><i>Embedded Rust library (not separate process)</i><br/><i>Shared memory space with all layers</i>"]

        %% ═══════════════════════════════════════════════
        %% THREE-TIER MEMORY
        %% ═══════════════════════════════════════════════
        subgraph tiers["<b>Three-Tier Memory Hierarchy</b>"]
            direction TB

            subgraph l5_t0["<b>T0: GPU VRAM</b>"]
                direction TB
                t0_capacity["Capacity: 64 full frames<br/>+ VFN weights<br/>+ Ghost Bleed Buffer<br/>~4 MB frame data"]
                t0_access["Access: <b>Instant</b><br/>GPU-local memory<br/>No bus transfer"]
                t0_contents["Contents:<br/>• Active RAR frames<br/>• VFN weight matrices<br/>• ~1,000 R₀ ghosts<br/>• Attention Q/K/V caches"]
                t0_eviction["<b>Eviction at 80% capacity</b><br/>score = w₁·recency<br/>       + w₂·γ<br/>       + w₃·log(refs)<br/>       + w₄·strand_importance<br/>       − w₅·superseded<br/>Lowest score evicted first<br/>R₀ ghost RETAINED in Bleed Buffer"]
            end

            subgraph l5_t1["<b>T1: System RAM</b>"]
                direction TB
                t1_capacity["Capacity: 8-32 GB<br/>~500K full frames<br/>~32M compressed"]
                t1_access["Access: <b>~2ms</b><br/>Indexed retrieval<br/>via HNSW/B-tree"]
                t1_structure["Structure:<br/><b>LSM-Tree</b><br/>• Memtable (write buffer)<br/>  → Red-black tree, in-RAM<br/>  → Flush at threshold<br/>• Sorted Runs (on-disk format)<br/>  → SSTable-like segments<br/>  → Sorted by frame ID<br/>• Background Compaction<br/>  → Merge overlapping runs<br/>  → Remove tombstones"]
                t1_mvcc["Concurrency: MVCC<br/>crossbeam-epoch RCU<br/>Readers NEVER block<br/>Writers: per-strand mutex"]
                t1_wal["WAL per strand<br/>Write-ahead log<br/>Crash recovery<br/>Sequential append"]
            end

            subgraph l5_t2["<b>T2: RAM + NVMe SSD</b>"]
                direction TB
                t2_capacity["Capacity: 64-160+ GB<br/>Millions compressed frames<br/>~1.1B at max"]
                t2_access["Access: <b>~10-50ms</b><br/>mmap'd archives<br/>Decompression overhead"]
                t2_structure["Structure:<br/>• mmap'd compressed archives<br/>• rkyv zero-copy deserialization<br/>  (no alloc, no copy on read)<br/>• Organized by strand + time<br/>• Bloom filters for membership"]
                t2_compression["Compression:<br/>Full 64KB → R₀+R₁ (8KB)<br/>Or R₀ only (1KB)<br/>LZ4 / zstd block compression"]
            end

            l5_t0 <-->|"eviction at 80%<br/>R₀ ghost retained<br/>in Bleed Buffer"| l5_t1
            l5_t1 <-->|"sleep archival<br/>compress → R₀ only<br/>at 80% T1"| l5_t2
        end

        %% ═══════════════════════════════════════════════
        %% INDEXING
        %% ═══════════════════════════════════════════════
        subgraph l5_indexing["<b>Indexing System</b><br/><i>Total: O(log N), ~2.3ms for 10M frames</i>"]
            direction TB

            subgraph strand_routing["<b>Strand Routing</b>"]
                direction LR
                l5_strand_hashmap["HashMap&lt;StrandId, StrandIndex&gt;<br/>O(1) lookup<br/>Route to per-strand indexes"]
            end

            subgraph per_strand_idx["<b>Per-Strand Indexes</b>"]
                direction LR

                subgraph hnsw_index["<b>HNSW Index</b><br/>(Semantic Search)"]
                    hnsw_config["Cosine similarity metric<br/>M = 16 connections/layer<br/>ef_construction = 200<br/>ef_search = 50<br/>O(log N) per query"]
                    hnsw_use["Use: 'find frames<br/>similar to this R₀'<br/>Nearest-neighbor recall"]
                end

                subgraph btree_index["<b>B-Tree Index</b><br/>(Temporal Range)"]
                    btree_config["Key: timestamp (u64 ns)<br/>Branching factor: 128<br/>O(log N) range query"]
                    btree_use["Use: 'frames between<br/>T₁ and T₂'<br/>Chronological retrieval"]
                end

                subgraph inverted_index["<b>Inverted Index</b><br/>(Concept → Frames)"]
                    inv_config["Key: codebook entry u16<br/>Value: Vec&lt;FrameId&gt;<br/>O(1) per concept lookup"]
                    inv_use["Use: 'all frames<br/>containing concept X'<br/>Exact concept match"]
                end

                subgraph bloom_filters["<b>Bloom Filters</b><br/>(Negative Check)"]
                    bloom_config["O(1) membership test<br/>99.9% accuracy<br/>False positive ≤ 0.1%<br/>NO false negatives"]
                    bloom_use["Use: 'does strand S<br/>contain concept X?'<br/>Skip expensive lookup<br/>if definitely absent"]
                end
            end

            subgraph query_flow["<b>Query Flow</b>"]
                direction TB
                q_input["Query arrives"]
                q_strand["1. Strand Routing O(1)<br/>→ select strand index"]
                q_bloom["2. Bloom Filter O(1)<br/>→ early negative exit"]
                q_index["3. HNSW or B-tree O(log N)<br/>→ candidate frame IDs"]
                q_inv["4. Inverted Index O(1)<br/>→ concept intersection"]
                l5_q_load["5. Frame Load O(1)<br/>→ full frame retrieval"]
                q_input --> q_strand --> q_bloom --> q_index --> q_inv --> l5_q_load
            end

            strand_routing --> per_strand_idx
        end

        %% ═══════════════════════════════════════════════
        %% BLEED ENGINE
        %% ═══════════════════════════════════════════════
        subgraph l5_bleed_engine["<b>Bleed Engine</b><br/><i>CPU background threads — keeps GPU hot cache fresh</i>"]
            direction TB

            subgraph predictive_prefetch["<b>Predictive Prefetch</b><br/>T1 → T0"]
                direction LR
                prefetch_trigger["Trigger: new frame arrives<br/>on Bus"]
                prefetch_hnsw["HNSW query on new frame R₀<br/>against T1 index"]
                prefetch_load["Load top-K nearest<br/>full frames → T0"]
                prefetch_latency["Latency: ~2ms"]
                prefetch_trigger --> prefetch_hnsw --> prefetch_load --> prefetch_latency
            end

            subgraph ondemand_recall["<b>On-Demand Recall</b><br/>T2 → T1 → T0"]
                direction LR
                recall_trigger["Trigger: ghost page fault<br/>(cosine sim > threshold<br/>in Attend phase)"]
                recall_decompress["Decompress from T2<br/>rkyv zero-copy"]
                recall_promote["Promote to T1<br/>then T0 if needed"]
                recall_latency["Latency: ~10-50ms"]
                recall_trigger --> recall_decompress --> recall_promote --> recall_latency
            end

            subgraph bg_consolidation["<b>Background Consolidation</b><br/>T0 → T1"]
                direction LR
                consol_trigger["Trigger: T0 eviction<br/>(at 80% capacity)"]
                consol_write["Write full frame to T1<br/>LSM l5_memtable insert"]
                consol_ghost["Retain R₀ ghost<br/>in Bleed Buffer"]
                consol_latency["Latency: non-blocking<br/>(async write)"]
                consol_trigger --> consol_write --> consol_ghost --> consol_latency
            end

            subgraph sleep_archival["<b>Sleep Archival</b><br/>T1 → T2"]
                direction LR
                archive_trigger["Trigger: T1 at 80%<br/>OR idle sleep cycle"]
                archive_compress["Compress frames:<br/>Full → R₀+R₁ or R₀ only<br/>LZ4/zstd"]
                archive_write["Write to T2<br/>mmap'd archive file"]
                archive_distill["Distill wisdom frames<br/>(50 → 3-5 summaries)"]
                archive_latency["Background, low-priority"]
                archive_trigger --> archive_compress --> archive_write --> archive_distill --> archive_latency
            end
        end

        %% ═══════════════════════════════════════════════
        %% GARBAGE COLLECTION
        %% ═══════════════════════════════════════════════
        subgraph gc["<b>Garbage Collection Pipeline</b>"]
            direction TB

            subgraph gc_stages["<b>Compression Stages</b>"]
                direction LR
                gc_full["<b>Full Frame</b><br/>64 KB<br/>All 16 slots × 4 res<br/>Complete data"]
                gc_compressed["<b>Compressed</b><br/>8 KB<br/>R₀ + R₁ only<br/>Proposition-level"]
                gc_gist["<b>Gist</b><br/>1 KB<br/>R₀ only<br/>Discourse-level"]
                gc_tombstone["<b>Tombstone</b><br/>32 B<br/>Frame ID + death time<br/>Existence proof only"]
                gc_full -->|"age + low refs<br/>+ low γ"| gc_compressed
                gc_compressed -->|"further decay"| gc_gist
                gc_gist -->|"truly obsolete"| gc_tombstone
            end

            subgraph gc_scoring["<b>Retention Scoring</b>"]
                direction TB
                retention_formula["score = w₁·exp(−age/30d)<br/>       + w₂·γ<br/>       + w₃·log(1 + refs)<br/>       + w₄·strand_importance<br/>       + w₅·distilled_flag<br/>       − w₆·contradictions<br/>       − w₇·redundancy"]
                immortal_rules["<b>IMMORTAL (never GC'd):</b><br/>• γ = 1.0 (proven facts)<br/>• High reference count<br/>• User-pinned frames"]
            end
        end

        %% ═══════════════════════════════════════════════
        %% STORAGE ENGINE
        %% ═══════════════════════════════════════════════
        subgraph storage_engine["<b>Storage Engine</b>"]
            direction TB

            subgraph lsm_tree["<b>LSM-Tree (T1)</b>"]
                direction TB
                l5_memtable["<b>Memtable</b><br/>In-memory write buffer<br/>Red-black tree<br/>O(log N) insert"]
                sorted_runs["<b>Sorted Runs</b><br/>Immutable on-disk segments<br/>Sorted by frame ID<br/>SSTable-like"]
                compaction["<b>Background Compaction</b><br/>Merge overlapping runs<br/>Remove deleted entries<br/>Reduce read amplification"]
                l5_memtable -->|"flush at<br/>threshold"| sorted_runs
                sorted_runs -->|"periodic<br/>merge"| compaction
            end

            subgraph mvcc_rcu["<b>MVCC (crossbeam-epoch RCU)</b>"]
                direction LR
                readers["<b>Readers</b><br/>Pin current epoch<br/>Read without locks<br/>NEVER block"]
                writers["<b>Writers</b><br/>Per-strand mutex<br/>Cross-strand = parallel<br/>Epoch-based reclamation"]
            end

            subgraph wal_recovery["<b>WAL (Write-Ahead Log)</b>"]
                direction LR
                wal_per_strand["One WAL per strand<br/>Sequential append<br/>fsync on commit"]
                crash_recovery["Crash recovery:<br/>Replay WAL entries<br/>Rebuild l5_memtable<br/>Consistent state"]
            end

            subgraph serialization["<b>Serialization (rkyv)</b>"]
                direction LR
                rkyv_zero_copy["rkyv zero-copy deserialization<br/>No allocation on read<br/>Direct memory-mapped access<br/>Archived ↔ Live types"]
            end
        end

        %% ═══════════════════════════════════════════════
        %% COHERENCE
        %% ═══════════════════════════════════════════════
        subgraph coherence["<b>Coherence Management</b>"]
            direction TB
            gamma_priority["<b>γ-Priority Wins</b><br/>Contradicting frames:<br/>higher γ frame wins"]
            superseded_tag["<b>Superseded Tagging</b><br/>Old frame tagged as superseded<br/>γ-penalized in retrieval"]
            strand_scoped["<b>Strand-Scoped Truth</b><br/>Active strand determines<br/>which frames retrieved<br/>Context-dependent knowledge"]
            bg_contradiction["<b>Background Contradiction Detector</b><br/>HDC negation: ¬v<br/>Scan for frames where<br/>cosine(v, ¬w) > threshold"]
        end

        %% ═══════════════════════════════════════════════
        %% CAPACITY TABLE
        %% ═══════════════════════════════════════════════
        subgraph capacity["<b>Capacity Summary</b>"]
            direction LR
            cap_t0["<b>T0 (8GB VRAM)</b><br/>125K full frames<br/>~6M tokens equiv"]
            cap_t1["<b>T1 (32GB RAM)</b><br/>500K full / 32M compressed<br/>~1.6B tokens equiv"]
            cap_t2["<b>T2 (128GB + 1TB NVMe)</b><br/>17M full / 1.1B compressed<br/>~58B tokens equiv"]
            cap_total["<b>Total: ~58B tokens</b><br/>GPT-4 context: 128K<br/>~453,000× more"]
        end
    end

    subgraph L6["<b>Layer 6 — Output Action Cores</b><br/><i>Parallel slot decode: 5-slot output = 1-slot wall-clock</i><br/><i>All slots decoded simultaneously — NOT autoregressive</i>"]

        %% ═══════════════════════════════════════════════
        %% INPUT
        %% ═══════════════════════════════════════════════
        l6_input_frame{{"Input: Verified Output Frame<br/>from Bus (Layer 2)<br/>γ-scored, proof-attached<br/>F ∈ ℝ<sup>[16 × 4 × 256]</sup>"}}

        %% ═══════════════════════════════════════════════
        %% PARALLEL DECODE MECHANISM
        %% ═══════════════════════════════════════════════
        subgraph l6_parallel_decode["<b>Parallel Decode Mechanism</b><br/><i>vs. autoregressive: 500 tokens = 500 serial passes</i>"]
            direction TB

            subgraph slot_decode["<b>Per-Slot Independent Decode</b>"]
                direction LR
                decode_s0["Decode Slot 0<br/>AGENT → text span"]
                decode_s1["Decode Slot 1<br/>PREDICATE → text span"]
                decode_s2["Decode Slot 2<br/>PATIENT → text span"]
                decode_s3["Decode Slot 3<br/>LOCATION → text span"]
                decode_s4["Decode Slot 4<br/>TIME → text span"]
                decode_s5["Decode Slot 5<br/>MANNER → text span"]
                decode_s6["Decode Slot 6<br/>INSTRUMENT → text span"]
                decode_s7["Decode Slot 7<br/>CAUSE → text span"]
                decode_s8["Decode Slot 8<br/>RESULT → text span"]
            end

            subgraph decode_process["<b>Decode Process (per slot)</b>"]
                direction TB
                read_r1["Read slot at R₁<br/>(proposition level)<br/>[256-dim vector]"]
                codebook_lookup["Codebook reverse lookup<br/>Nearest entries → candidate tokens"]
                beam_decode["Beam search / greedy decode<br/>R₂ phrase-level refinement<br/>R₃ token-level detail"]
                span_output["Output: text span<br/>for this semantic role"]
                read_r1 --> codebook_lookup --> beam_decode --> span_output
            end

            subgraph assembly["<b>Role-Ordered Assembly</b>"]
                direction TB
                role_order["Order spans by semantic role:<br/>AGENT + PREDICATE + PATIENT<br/>+ modifiers (MANNER, INSTRUMENT)<br/>+ adjuncts (LOCATION, TIME, CAUSE, RESULT)"]
                connectives["Insert discourse connectives:<br/>Based on R₀ discourse frame<br/>Conjunctions, punctuation,<br/>paragraph breaks"]
                final_text["Assembled natural language<br/>Coherent multi-sentence output"]
                role_order --> connectives --> final_text
            end
        end

        %% ═══════════════════════════════════════════════
        %% TEXT OUTPUT CORE
        %% ═══════════════════════════════════════════════
        subgraph text_core["<b>TextOutput Core</b>"]
            direction TB

            subgraph text_decode["<b>Decode Pipeline</b>"]
                direction TB
                text_slot_decode["Per-slot parallel decode<br/>R₁ → text spans<br/>All slots simultaneously"]
                text_role_assemble["Role-ordered assembly<br/>AGENT PREDICATE PATIENT...<br/>+ discourse connectives"]
                text_proof_annotate["Proof annotation:<br/>Inline γ scores<br/>Step references<br/>Source frame IDs"]
                text_format["Format: plain text / markdown<br/>with optional proof sidebar"]
                text_slot_decode --> text_role_assemble --> text_proof_annotate --> text_format
            end

            l6_text_output(["Output: Natural Language<br/>+ proof annotations<br/>→ User / Chat UI"])
        end

        %% ═══════════════════════════════════════════════
        %% SPEECH OUTPUT CORE
        %% ═══════════════════════════════════════════════
        subgraph speech_core["<b>SpeechOutput Core</b>"]
            direction TB

            subgraph speech_pipeline["<b>TTS Pipeline</b>"]
                direction TB
                speech_text_in["Input: assembled text<br/>from TextOutput path"]
                speech_ssml["SSML Generation:<br/>Emphasis from γ scores<br/>Prosody from MANNER slot<br/>Pacing from R₀ discourse"]
                speech_tts["TTS Engine:<br/>Neural vocoder<br/>Voice selection<br/>Sample rate: 22050Hz+"]
                speech_buffer["Audio buffer:<br/>PCM / WAV / Opus<br/>Streaming output"]
                speech_text_in --> speech_ssml --> speech_tts --> speech_buffer
            end

            l6_speech_output(["Output: Audio Stream<br/>→ Speaker / WebSocket"])
        end

        %% ═══════════════════════════════════════════════
        %% IMAGE OUTPUT CORE
        %% ═══════════════════════════════════════════════
        subgraph image_core["<b>ImageOutput Core</b>"]
            direction TB

            subgraph image_pipeline["<b>Image Generation Pipeline</b>"]
                direction TB
                image_patient["PATIENT slot → subject<br/>What to generate<br/>(e.g., 'mountain landscape')"]
                image_manner["MANNER slot → style<br/>How it should look<br/>(e.g., 'watercolor', 'photorealistic')"]
                image_location["LOCATION slot → setting<br/>Background context"]
                image_instrument["INSTRUMENT slot → medium<br/>Additional constraints"]
                image_conditioning["Conditioning vector:<br/>Combine slot embeddings<br/>→ diffusion model prompt"]
                image_diffusion["Diffusion Model:<br/>Latent diffusion<br/>Iterative denoising<br/>Resolution: configurable"]
                image_render["Rendered image:<br/>PNG / JPEG<br/>With provenance metadata"]
                image_patient --> image_conditioning
                image_manner --> image_conditioning
                image_location --> image_conditioning
                image_instrument --> image_conditioning
                image_conditioning --> image_diffusion --> image_render
            end

            l6_image_output(["Output: Generated Image<br/>→ Display / File"])
        end

        %% ═══════════════════════════════════════════════
        %% MOTOR OUTPUT CORE
        %% ═══════════════════════════════════════════════
        subgraph motor_core["<b>MotorOutput Core</b>"]
            direction TB

            subgraph motor_pipeline["<b>Motor Command Pipeline</b>"]
                direction TB
                motor_action["PREDICATE slot → action type<br/>(grasp, move, rotate, press)"]
                motor_instrument["INSTRUMENT slot → effector<br/>(arm, gripper, wheel, servo)"]
                motor_patient["PATIENT slot → target object<br/>(location, dimensions)"]
                motor_manner["MANNER slot → parameters<br/>(speed, force, precision)"]
                motor_plan["Motion planning:<br/>Trajectory generation<br/>Collision avoidance<br/>Kinematics solver"]
                motor_primitives["Motor primitives:<br/>Position × Velocity × Force<br/>Timestamped command sequence"]
                motor_safety["Safety check:<br/>Force limits<br/>Workspace boundaries<br/>Emergency stop threshold"]
                motor_action --> motor_plan
                motor_instrument --> motor_plan
                motor_patient --> motor_plan
                motor_manner --> motor_plan
                motor_plan --> motor_primitives --> motor_safety
            end

            l6_motor_output(["Output: Motor Commands<br/>→ Actuators / Robot API"])
        end

        %% ═══════════════════════════════════════════════
        %% N8N OUTPUT CORE
        %% ═══════════════════════════════════════════════
        subgraph n8n_core["<b>n8nOutput Core</b>"]
            direction TB

            subgraph n8n_pipeline["<b>Webhook Dispatch Pipeline</b>"]
                direction TB
                n8n_predicate["PREDICATE slot → action<br/>(send_email, create_ticket,<br/>update_record, trigger_flow)"]
                n8n_patient["PATIENT slot → payload<br/>Data to send"]
                n8n_instrument["INSTRUMENT slot → target<br/>Which n8n workflow / webhook"]
                n8n_serialize["Serialize to JSON:<br/>{ action, payload, target,<br/>  gamma, proof_ref, timestamp }"]
                n8n_http["HTTP POST to webhook:<br/>n8n endpoint URL<br/>Headers: auth token<br/>Content-Type: application/json"]
                n8n_response["Handle response:<br/>Success → log + confirm<br/>Failure → retry / report"]
                n8n_predicate --> n8n_serialize
                n8n_patient --> n8n_serialize
                n8n_instrument --> n8n_serialize
                n8n_serialize --> n8n_http --> n8n_response
            end

            l6_n8n_output(["Output: Webhook Call<br/>→ n8n / External Service"])
        end

        %% ═══════════════════════════════════════════════
        %% LEDGER OUTPUT CORE
        %% ═══════════════════════════════════════════════
        subgraph ledger_core["<b>LedgerOutput Core</b>"]
            direction TB

            subgraph ledger_pipeline["<b>P2P Publishing Pipeline</b>"]
                direction TB
                ledger_frame_in["Input: verified frame<br/>to publish to Commons"]
                ledger_sign["Ed25519 Sign:<br/>Sign frame hash<br/>with instance keypair"]
                ledger_merkle["Merkle Append:<br/>Add to local log<br/>Update root hash"]
                ledger_zk["ZK Proof (optional):<br/>Prove frame properties<br/>without revealing content"]
                ledger_gossip["P2P Gossip Publish:<br/>libp2p pub/sub<br/>Topic: strand namespace"]
                ledger_ipfs["IPFS Pin (if module):<br/>Content-address<br/>Generate CID"]
                ledger_frame_in --> ledger_sign --> ledger_merkle --> ledger_zk --> ledger_gossip
                ledger_merkle --> ledger_ipfs
            end

            l6_ledger_output(["Output: Signed Frame<br/>→ P2P Network / IPFS"])
        end
    end

    subgraph L7["<b>Layer 7 — Continual Learning</b><br/><i>Inference IS learning — no train/inference distinction</i><br/><i>Every inference → stored frame → future context</i>"]

        %% ═══════════════════════════════════════════════
        %% INSTANT LEARNING
        %% ═══════════════════════════════════════════════
        subgraph l7_instant["<b>Instant Learning</b><br/><i>Timescale: milliseconds to minutes</i>"]
            direction TB

            subgraph instant_trigger["<b>Trigger</b>"]
                direction LR
                every_inference["Every single inference<br/>produces a Tensor Frame"]
                every_frame["Every frame is a<br/>learning event"]
            end

            subgraph instant_process["<b>Process</b>"]
                direction TB
                frame_created["Frame created by<br/>RAR convergence (Layer 3)<br/>+ verification (Layer 4)"]
                ram_write["Write to T1 (System RAM)<br/>LSM memtable insert<br/>O(log N)"]
                strand_assign["Assign to strand<br/>Based on R₀ topic gist<br/>HNSW nearest strand"]
                index_update["Update indexes:<br/>• HNSW (semantic)<br/>• B-tree (temporal)<br/>• Inverted (concept)<br/>• Bloom filter"]
                ghost_update["Update Ghost Bleed Buffer<br/>if frame R₀ is novel enough<br/>Cosine distance > threshold"]
                frame_created --> ram_write --> strand_assign --> index_update --> ghost_update
            end

            subgraph instant_properties["<b>Properties</b>"]
                direction LR
                zero_forgetting["<b>Zero forgetting</b><br/>Frames never overwritten<br/>Only GC'd by age/relevance"]
                instant_effect["<b>Instant effect</b><br/>Frame immediately retrievable<br/>by next query"]
                no_weight_change["<b>No weight changes</b><br/>VFN weights untouched<br/>Pure data accumulation"]
            end
        end

        %% ═══════════════════════════════════════════════
        %% SLEEP CONSOLIDATION
        %% ═══════════════════════════════════════════════
        subgraph l7_sleep["<b>Sleep Consolidation</b><br/><i>Timescale: hours, during idle periods</i>"]
            direction TB

            subgraph sleep_trigger["<b>Trigger Conditions</b>"]
                direction LR
                idle_detect["System idle detected<br/>(no queries for N minutes)"]
                t1_threshold["T1 at 80% capacity<br/>Archival needed"]
                scheduled["Scheduled consolidation<br/>(configurable interval)"]
            end

            subgraph sleep_phase1["<b>Phase 1: Cluster</b>"]
                direction TB
                select_strand["Select strand for<br/>consolidation"]
                hnsw_cluster["HNSW neighborhood clustering<br/>Group semantically similar frames<br/>Within recent time window"]
                identify_groups["Identify frame groups:<br/>Clusters of 20-100 frames<br/>High mutual cosine sim"]
                select_strand --> hnsw_cluster --> identify_groups
            end

            subgraph sleep_phase2["<b>Phase 2: Distill</b>"]
                direction TB
                take_cluster["Take cluster of ~50 frames"]
                compute_centroid["Compute centroid:<br/>Weighted average of R₀s<br/>Weight = γ × recency"]
                extract_wisdom["Extract wisdom frame:<br/>Centroid as R₀<br/>Most common R₁ patterns<br/>Highest-γ R₂ details"]
                output_wisdom["Output: 3-5 wisdom frames<br/>from original ~50<br/>High-γ summaries"]
                take_cluster --> compute_centroid --> extract_wisdom --> output_wisdom
            end

            subgraph sleep_phase3["<b>Phase 3: Forward-Forward VFN Update</b>"]
                direction TB
                ff_concept["<b>Forward-Forward Algorithm</b><br/>No backpropagation needed<br/>One layer at a time<br/>~1× inference VRAM"]
                ff_positive["<b>Positive pass:</b><br/>Wisdom frames as 'good' data<br/>Goodness = Σ(activation²)<br/>Push goodness UP"]
                ff_negative["<b>Negative pass:</b><br/>Corrupted/contradicted frames<br/>Push goodness DOWN"]
                ff_layer_update["<b>Per-layer weight update:</b><br/>Layer k frozen while<br/>updating layer k+1<br/>Sequential, memory-efficient"]
                ff_concept --> ff_positive --> ff_negative --> ff_layer_update
            end

            subgraph sleep_phase4["<b>Phase 4: Energy Landscape Reshape</b>"]
                direction TB
                new_attractors["<b>New attractors form</b><br/>VFN weights now create<br/>energy minima for new concepts<br/>Learned from wisdom frames"]
                flatten_unused["<b>Unused attractors flatten</b><br/>Concepts with no recent frames<br/>Energy basins become shallow<br/>Still accessible but less magnetic"]
                landscape_result["<b>Result:</b><br/>Energy landscape reflects<br/>accumulated experience<br/>Future RAR converges faster<br/>for learned concepts"]
                new_attractors --> landscape_result
                flatten_unused --> landscape_result
            end

            subgraph sleep_phase5["<b>Phase 5: Archival</b>"]
                direction TB
                compress_original["Compress original frames:<br/>Full 64KB → R₀+R₁ (8KB)<br/>or R₀ only (1KB)"]
                move_t2["Move to T2 (NVMe)<br/>mmap'd compressed archive"]
                retain_wisdom["Retain wisdom frames<br/>in T1 at full resolution<br/>High-γ, immortal"]
                free_t1["Free T1 space<br/>for new instant writes"]
                compress_original --> move_t2 --> retain_wisdom --> free_t1
            end

            sleep_trigger --> sleep_phase1
            sleep_phase1 --> sleep_phase2
            sleep_phase2 --> sleep_phase3
            sleep_phase3 --> sleep_phase4
            sleep_phase4 --> sleep_phase5
        end

        %% ═══════════════════════════════════════════════
        %% DEVELOPMENTAL GROWTH
        %% ═══════════════════════════════════════════════
        subgraph l7_developmental["<b>Developmental Growth</b><br/><i>Timescale: days to months</i>"]
            direction TB

            subgraph strand_graduation["<b>Strand Graduation</b>"]
                direction TB
                topic_monitor["Monitor topic clusters<br/>across strands"]
                frequency_check["Detect high-frequency topics<br/>that span multiple strands<br/>or dominate a strand"]
                promote_strand["<b>Promote to dedicated strand</b><br/>Topic cluster → own StrandId<br/>Dedicated indexes<br/>Own capability vector"]
                register_strand["Register with Intent Router<br/>New capability vector<br/>Auto-discovered"]
                topic_monitor --> frequency_check --> promote_strand --> register_strand
            end

            subgraph module_hotplug["<b>Module Hot-Plug</b>"]
                direction TB
                trait_introspect["Trait introspection:<br/>Scan for new crates<br/>implementing HardStrand,<br/>Translator, or ActionCore"]
                load_module["Dynamic loading:<br/>Load new module at runtime<br/>No recompilation needed"]
                register_cap["Register capability vector<br/>with Intent Router"]
                test_module["Integration test:<br/>Verify trait compliance<br/>Sandbox execution check"]
                trait_introspect --> load_module --> register_cap --> test_module
            end

            subgraph capability_expansion["<b>Capability Expansion</b>"]
                direction LR
                new_translators["New Translators<br/>Community crates<br/>New input modalities"]
                new_strands["New Hard Strands<br/>Community crates<br/>New computation types"]
                new_cores["New Action Cores<br/>Community crates<br/>New output modalities"]
            end

            strand_graduation --> capability_expansion
            module_hotplug --> capability_expansion
        end
    end

    subgraph L8["<b>Layer 8 — Intelligence Commons</b><br/><i>Trust-minimized accounting for sovereign intelligence, not crypto</i><br/><i>Three sub-layers: Local → P2P → Settlement</i>"]

        %% ═══════════════════════════════════════════════
        %% L0: LOCAL INSTANCE
        %% ═══════════════════════════════════════════════
        subgraph commons_l0["<b>L0: Local Instance</b><br/><i>Fully offline — no network required</i>"]
            direction TB

            subgraph l8_merkle_log["<b>Append-Only Merkle Log</b>"]
                direction TB
                merkle_structure["Structure:<br/>Binary hash tree<br/>Each leaf = frame hash<br/>Root = Merkle root"]
                merkle_append_op["Append operation:<br/>New frame → hash → leaf<br/>Recompute path to root<br/>O(log N)"]
                merkle_verify["Verification:<br/>Prove frame inclusion<br/>via Merkle proof path<br/>O(log N) hashes"]
                merkle_tamper["Tamper-evident:<br/>Any modification<br/>changes root hash<br/>Detectable instantly"]
                merkle_structure --> merkle_append_op --> merkle_verify --> merkle_tamper
            end

            subgraph identity["<b>Ed25519 Identity</b><br/><i>Self-sovereign keypair</i>"]
                direction TB
                keypair_gen["Key generation:<br/>Ed25519 keypair<br/>Private key: 32 bytes<br/>Public key: 32 bytes"]
                sign_frames["Sign every frame:<br/>Ed25519 signature (64 bytes)<br/>Non-repudiable authorship"]
                verify_sig["Verify signatures:<br/>Any peer can verify<br/>using public key<br/>No certificate authority"]
                did_identity["Identity = public key<br/>No registration needed<br/>Self-sovereign DID"]
                keypair_gen --> sign_frames --> verify_sig --> did_identity
            end

            subgraph zk_proofs["<b>ZK Proofs for Strand Export</b>"]
                direction TB
                zk_purpose["Purpose:<br/>Prove frame properties<br/>WITHOUT revealing content"]
                zk_prove_gamma["Prove γ ≥ threshold<br/>without revealing frame data"]
                zk_prove_strand["Prove frame belongs to strand<br/>without revealing strand content"]
                zk_prove_compute["Prove computation was correct<br/>without re-executing"]
                zk_circuit["ZK circuit:<br/>Groth16 / Plonk<br/>Proof size: ~128-256 bytes<br/>Verification: ~1ms"]
                zk_purpose --> zk_prove_gamma
                zk_purpose --> zk_prove_strand
                zk_purpose --> zk_prove_compute
                zk_prove_gamma --> zk_circuit
                zk_prove_strand --> zk_circuit
                zk_prove_compute --> zk_circuit
            end
        end

        %% ═══════════════════════════════════════════════
        %% L1: P2P GOSSIP MESH
        %% ═══════════════════════════════════════════════
        subgraph commons_l1["<b>L1: P2P Gossip Mesh</b><br/><i>Decentralized communication layer</i>"]
            direction TB

            subgraph l8_libp2p_layer["<b>libp2p Transport</b>"]
                direction TB
                transport["Transport protocols:<br/>TCP / QUIC / WebSocket<br/>Noise encryption<br/>Yamux multiplexing"]
                discovery["Peer discovery:<br/>mDNS (local)<br/>Kademlia DHT (global)<br/>Bootstrap nodes"]
                pubsub["GossipSub pub/sub:<br/>Topic-based messaging<br/>Flood/mesh hybrid<br/>Message dedup"]
                transport --> discovery --> pubsub
            end

            subgraph crdt_sync["<b>CRDT State Synchronization</b>"]
                direction TB
                crdt_type["CRDT types used:<br/>• G-Counter (frame counts)<br/>• OR-Set (strand membership)<br/>• LWW-Register (latest root)"]
                crdt_merge["Merge operation:<br/>Commutative, associative,<br/>idempotent<br/>No conflicts possible"]
                crdt_eventual["Eventual consistency:<br/>All peers converge<br/>to same state<br/>Network partition tolerant"]
                crdt_type --> crdt_merge --> crdt_eventual
            end

            subgraph ipfs_registry["<b>IPFS Module Registry</b>"]
                direction TB
                cid_address["Content-addressed:<br/>CID = hash(module binary)<br/>Immutable reference<br/>Globally unique"]
                module_publish["Module publish:<br/>Rust crate → compile → WASM<br/>→ IPFS pin → CID<br/>→ Registry entry"]
                module_fetch["Module fetch:<br/>CID → IPFS retrieval<br/>→ Verify hash<br/>→ Hot-plug load"]
                module_meta["Module metadata:<br/>• Trait type (Translator/HardStrand/ActionCore)<br/>• Capability vector<br/>• Author signature<br/>• γ trust score"]
                cid_address --> module_publish --> module_fetch --> module_meta
            end

            subgraph strand_marketplace["<b>Encrypted Strand Marketplace</b>"]
                direction TB
                strand_listing["List strand for trade:<br/>ZK proof of properties<br/>(γ, size, topic vector)<br/>Content encrypted"]
                strand_browse["Browse listings:<br/>Filter by topic similarity<br/>Filter by γ threshold<br/>Verify ZK proofs"]
                strand_purchase["Purchase strand:<br/>Micropayment via L2<br/>Decrypt key exchange<br/>Verify content post-purchase"]
                strand_listing --> strand_browse --> strand_purchase
            end
        end

        %% ═══════════════════════════════════════════════
        %% L2: SETTLEMENT
        %% ═══════════════════════════════════════════════
        subgraph commons_l2["<b>L2: Settlement Layer</b><br/><i>Economic layer — value flows</i>"]
            direction TB

            subgraph dag_micropayments["<b>DAG Micropayments</b>"]
                direction TB
                dag_structure["DAG (Directed Acyclic Graph):<br/>Each transaction references<br/>2+ previous transactions<br/>No blocks, no miners"]
                dag_micro["Micropayment support:<br/>Fractions of VOLT token<br/>Near-zero fees<br/>Sub-second finality"]
                dag_channels["Payment channels:<br/>Off-chain for high frequency<br/>Settle on-DAG periodically"]
                dag_structure --> dag_micro --> dag_channels
            end

            subgraph fact_anchoring["<b>High-γ Fact Anchoring</b>"]
                direction TB
                anchor_criteria["Anchoring criteria:<br/>γ ≥ 0.95 (high confidence)<br/>Multiple independent verifiers<br/>Proof chain complete"]
                anchor_process["Anchoring process:<br/>Frame hash → DAG transaction<br/>Multiple attestations required<br/>Timestamp anchored"]
                anchor_query["Query anchored facts:<br/>Merkle proof of inclusion<br/>Timestamp verification<br/>Cross-instance consensus"]
                anchor_criteria --> anchor_process --> anchor_query
            end

            subgraph provenance["<b>Provenance Registry</b>"]
                direction TB
                prov_track["Track frame lineage:<br/>Source instance (pubkey)<br/>Derivation chain<br/>Contribution graph"]
                prov_credit["Attribution credits:<br/>Original author credit<br/>Derived work credit<br/>Proportional to γ contribution"]
                prov_verify["Verify provenance:<br/>Follow signature chain<br/>Merkle proof per step<br/>ZK for private chains"]
                prov_track --> prov_credit --> prov_verify
            end

            subgraph governance["<b>Quadratic Governance</b>"]
                direction TB
                qv_concept["Quadratic Voting:<br/>Cost of N votes = N²<br/>Prevents plutocracy<br/>Favors broad consensus"]
                qv_proposals["Proposal types:<br/>• Protocol upgrades<br/>• Safety invariant changes<br/>• Module curation<br/>• Fee parameters"]
                qv_execute["Execution:<br/>Passed proposals → code change<br/>Time-locked deployment<br/>Emergency veto mechanism"]
                qv_concept --> qv_proposals --> qv_execute
            end
        end

        %% ═══════════════════════════════════════════════
        %% VALUE FLOWS
        %% ═══════════════════════════════════════════════
        subgraph value_flows["<b>Value Flows</b>"]
            direction TB

            subgraph volt_token["<b>VOLT Token</b>"]
                direction LR
                token_props["Properties:<br/>• Zero pre-mine<br/>• 100% earned<br/>• No ICO/VC allocation"]
                token_earn["Earn by:<br/>• Knowledge contribution<br/>• Module publishing<br/>• Fact verification<br/>• Strand trading"]
            end

            subgraph flow_diagram["<b>Flow Cycle</b>"]
                direction TB
                flow_contribute["Knowledge Contribution<br/>(publish high-γ frames)"]
                flow_marketplace["Module Marketplace<br/>(publish useful modules)"]
                flow_verification["Fact Verification<br/>(attest to high-γ facts)"]
                flow_trading["Strand Trading<br/>(ZK-proven strand exchange)"]
                flow_earn["→ Earn VOLT"]
                flow_contribute --> flow_earn
                flow_marketplace --> flow_earn
                flow_verification --> flow_earn
                flow_trading --> flow_earn
            end
        end

        %% ═══════════════════════════════════════════════
        %% SUB-LAYER FLOW
        %% ═══════════════════════════════════════════════
        commons_l0 ==>|"signed frames<br/>ZK proofs"| commons_l1
        commons_l1 ==>|"verified transactions<br/>attestations"| commons_l2
        commons_l2 ==>|"settlement confirmations<br/>governance decisions"| commons_l1
        commons_l1 ==>|"synced state<br/>fetched modules"| commons_l0
    end

    subgraph L9["<b>Layer 9 — UI / Test Bench</b>"]

        %% ═══════════════════════════════════════════════
        %% PHASE 1: N8N WORKFLOW
        %% ═══════════════════════════════════════════════
        subgraph n8n_phase["<b>Phase 1: n8n Workflow</b><br/><i>Current implementation — low-code orchestration</i>"]
            direction TB

            subgraph l9_n8n_trigger["<b>Chat Trigger Node</b>"]
                direction TB
                chat_input["User types message<br/>in n8n Chat UI"]
                trigger_config["Trigger config:<br/>• Webhook path: /chat<br/>• Method: POST<br/>• Body: { message, session_id }"]
                chat_input --> trigger_config
            end

            subgraph l9_n8n_http["<b>HTTP Request Node</b>"]
                direction TB
                http_config["POST to Volt XA:<br/>URL: localhost:8080/api/think<br/>Headers: Content-Type: application/json<br/>Body: { frame: encoded_input }"]
                http_timeout["Timeout: configurable<br/>Retry: on 5xx<br/>Max retries: 3"]
                http_config --> http_timeout
            end

            subgraph n8n_processing["<b>Volt XA Processing</b><br/>(Layer 1 → 2 → 3 → 4 → 5 → 6)"]
                direction TB
                translate["Layer 1: Text → Tensor Frame"]
                bus_send["Layer 2: Frame on Bus"]
                rar_process["Layer 3: RAR Loop (GPU)"]
                verify["Layer 4: Verify + Safety"]
                recall["Layer 5: Memory Recall/Store"]
                decode["Layer 6: Frame → Text"]
                translate --> bus_send --> rar_process --> verify --> recall --> decode
            end

            subgraph n8n_switch["<b>Switch Node</b><br/><i>Route based on response type</i>"]
                direction TB
                check_gamma{"γ level?"}
                high_gamma["γ ≥ 0.90<br/>→ Confident reply"]
                medium_gamma["γ ∈ [0.50, 0.90)<br/>→ Qualified reply<br/>(with uncertainty note)"]
                low_gamma["γ < 0.50<br/>→ Uncertain reply<br/>(explicit disclaimer)"]
                error_path["Error response<br/>→ Error handler"]
                check_gamma -->|"high"| high_gamma
                check_gamma -->|"medium"| medium_gamma
                check_gamma -->|"low"| low_gamma
                check_gamma -->|"error"| error_path
            end

            subgraph n8n_reply["<b>Reply Node</b>"]
                direction TB
                format_response["Format response:<br/>• Text content<br/>• γ score display<br/>• Active strand indicator<br/>• Proof chain link"]
                send_chat["Send to Chat UI:<br/>Formatted message<br/>with metadata sidebar"]
                format_response --> send_chat
            end

            l9_n8n_trigger ==>|"user message"| l9_n8n_http
            l9_n8n_http ==>|"POST /api/think"| n8n_processing
            n8n_processing ==>|"response JSON"| n8n_switch
            high_gamma ==> n8n_reply
            medium_gamma ==> n8n_reply
            low_gamma ==> n8n_reply
        end

        %% ═══════════════════════════════════════════════
        %% API ENDPOINT
        %% ═══════════════════════════════════════════════
        subgraph api_endpoint["<b>HTTP API Endpoint</b><br/><i>localhost:8080</i>"]
            direction TB

            subgraph api_routes["<b>Routes</b>"]
                direction LR
                route_think["<b>POST /api/think</b><br/>Main inference endpoint<br/>Input: raw text / frame<br/>Output: response + γ + proof"]
                route_recall["<b>POST /api/recall</b><br/>Memory query endpoint<br/>Input: query vector<br/>Output: matching frames"]
                route_status["<b>GET /api/status</b><br/>System status endpoint<br/>Output: memory usage,<br/>active strands, GPU load"]
                route_debug["<b>GET /api/debug/rar</b><br/>RAR iteration stream<br/>Output: SSE stream<br/>of per-iteration state"]
            end

            subgraph api_response["<b>Response Format</b>"]
                direction TB
                resp_format["JSON response:<br/>{<br/>  text: string,<br/>  gamma: f32,<br/>  strand: string,<br/>  proof: ProofChain,<br/>  iterations: u32,<br/>  timing_ms: f64,<br/>  slots_used: [SlotInfo],<br/>  ghost_activations: u32<br/>}"]
            end
        end

        %% ═══════════════════════════════════════════════
        %% DEBUG PANEL
        %% ═══════════════════════════════════════════════
        subgraph debug_panel["<b>Debug Panel</b><br/><i>Real-time system introspection</i>"]
            direction TB

            subgraph debug_rar["<b>RAR Monitor</b>"]
                direction LR
                rar_iter_count["Iteration count<br/>Current / max budget"]
                rar_slot_status["Per-slot status:<br/>Active / Frozen / Empty<br/>Color-coded 16-slot grid"]
                rar_convergence["Convergence graph:<br/>‖ΔS‖ per slot over time<br/>Live-updating line chart"]
                rar_energy["Energy landscape view:<br/>2D t-SNE projection<br/>of current slot states<br/>Attractor visualization"]
            end

            subgraph debug_ghost["<b>Ghost Activation Monitor</b>"]
                direction LR
                ghost_count["Active ghosts: N/1000<br/>Refresh rate"]
                ghost_activations["Page fault events:<br/>Which ghost triggered<br/>Source frame ID<br/>Cosine similarity"]
                ghost_heatmap["Ghost heatmap:<br/>Activation frequency<br/>by strand / topic"]
            end

            subgraph debug_timing["<b>Timing Breakdown</b>"]
                direction LR
                timing_translate["Translation: Xms"]
                timing_rar["RAR loop: Xms<br/>(root: X, attend: X, refine: X)"]
                timing_verify["Verification: Xms"]
                timing_recall["Memory recall: Xms"]
                timing_decode["Decode: Xms"]
                timing_total["Total: Xms"]
            end

            subgraph debug_gamma["<b>γ Score Breakdown</b>"]
                direction LR
                gamma_per_slot_dbg["Per-slot γ values<br/>Bar chart / table"]
                gamma_chain_dbg["Proof chain γ propagation<br/>Min-rule visualization<br/>Bottleneck identification"]
                gamma_history["γ history over session<br/>Trend line"]
            end

            subgraph debug_memory["<b>Memory Monitor</b>"]
                direction LR
                mem_t0["T0 (VRAM):<br/>Usage / capacity<br/>Eviction rate"]
                mem_t1["T1 (RAM):<br/>Usage / capacity<br/>Write rate"]
                mem_t2["T2 (NVMe):<br/>Usage / capacity<br/>Archive rate"]
                mem_gc["GC stats:<br/>Full / Compressed /<br/>Gist / Tombstone counts"]
            end

            subgraph debug_strands["<b>Strand Inspector</b>"]
                direction LR
                strand_list["Active strands list<br/>Frame count per strand"]
                strand_detail["Selected strand detail:<br/>Capability vector (256-dim)<br/>Recent frames<br/>γ distribution"]
                strand_routing_dbg["Routing decisions:<br/>Query → which strand<br/>Cosine sim scores"]
            end
        end

        %% ═══════════════════════════════════════════════
        %% FUTURE UI
        %% ═══════════════════════════════════════════════
        subgraph future_ui["<b>Future UI Roadmap</b>"]
            direction TB

            subgraph tauri_desktop["<b>Phase 2: Tauri Desktop</b>"]
                direction LR
                tauri_tech["Tauri framework:<br/>Rust backend + WebView<br/>Native performance<br/>Small binary (~10MB)"]
                tauri_features["Features:<br/>• Chat interface<br/>• Debug panel built-in<br/>• Strand browser<br/>• Memory explorer<br/>• Module manager"]
            end

            subgraph mobile_app["<b>Phase 3: Mobile</b>"]
                direction LR
                mobile_tech["Platform:<br/>Tauri Mobile / Flutter<br/>Edge VFN (100M params)"]
                mobile_features["Features:<br/>• Voice-first interface<br/>• Offline capable<br/>• Sync via P2P<br/>• Camera translator"]
            end

            subgraph ide_integration["<b>Phase 4: IDE Integration</b>"]
                direction LR
                ide_tech["Platforms:<br/>VS Code extension<br/>JetBrains plugin<br/>Neovim plugin"]
                ide_features["Features:<br/>• Inline code assistance<br/>• Proof-annotated suggestions<br/>• γ-scored completions<br/>• Strand-aware context"]
            end

            tauri_desktop --> mobile_app --> ide_integration
        end
    end

    subgraph L10["<b>Layer 10 — Socket Standard</b><br/><i>'AM5 Socket for AI' — One interface, infinite modules</i><br/><i>O(N+M) cost: N modules + M slots, not N×M integrations</i>"]

        %% ═══════════════════════════════════════════════
        %% TRANSLATOR TRAIT
        %% ═══════════════════════════════════════════════
        subgraph l10_translator_trait["<b>Translator Trait</b><br/><i>Converts raw input → Tensor Frame</i>"]
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
        subgraph l10_hardstrand_trait["<b>HardStrand Trait</b><br/><i>Deterministic computation module</i>"]
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
        subgraph l10_actioncore_trait["<b>ActionCore Trait</b><br/><i>Converts Tensor Frame → human-readable output</i>"]
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
        subgraph l10_auto_discovery["<b>Auto-Discovery Mechanism</b><br/><i>No recompilation needed</i>"]
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
    %% PRIMARY DATA FLOW (Inter-Layer Connections)
    %% ═══════════════════════════════════════════════════

    %% L0 → L1: Raw input to translators
    l0_chat_user ==>|"UTF-8 text"| l1_raw_text
    l0_voice_user ==>|"PCM audio"| l1_raw_audio
    l0_camera_sensor ==>|"image frames"| l1_raw_image
    l0_rest_api ==>|"JSON payload"| l1_raw_data
    l0_fs_events ==>|"OS events"| l1_raw_sensor
    l0_gossip_proto ==>|"CRDT deltas"| l1_raw_data
    l0_clipboard ==>|"text content"| l1_raw_text

    %% L1 → L2: Encoded frames to bus
    l1_quantized_vec ==>|"encoded text frame"| l2_frame_struct
    l1_vision_vqvae ==>|"encoded vision frame"| l2_frame_struct
    l1_audio_vqvae ==>|"encoded audio frame"| l2_frame_struct
    l1_data_vqvae ==>|"encoded data frame"| l2_frame_struct
    l1_sensor_vqvae ==>|"encoded sensor frame"| l2_frame_struct

    %% L2 ↔ L3: Bus ↔ GPU Soft Core
    l2_frame_struct ==>|"candidate frames"| l3_input_frame
    l3_output_frame ==>|"refined frames"| l2_frame_struct

    %% L2 → L4: Bus → CPU Hard Core
    l2_frame_struct ==>|"frames for verification"| l4_intent_router

    %% L4 → L2: Verified frames back to bus
    l4_output_verified ==>|"verified + proof"| l2_frame_struct

    %% L2 ↔ L5: Bus ↔ VoltDB
    l2_frame_struct ==>|"frames for store/recall"| l5_strand_hashmap
    l5_q_load ==>|"recalled frames"| l2_frame_struct

    %% L2 → L6: Bus → Output Action Cores
    l2_frame_struct ==>|"verified output frames"| l6_input_frame

    %% L6 → L0: Output to External World
    l6_text_output ==>|"natural language"| l0_chat_user
    l6_speech_output ==>|"audio stream"| l0_voice_user
    l6_image_output ==>|"generated image"| l0_file_user
    l6_motor_output ==>|"control signals"| l0_gpio_sensor
    l6_n8n_output ==>|"webhook POST"| l0_webhook_inbound
    l6_ledger_output ==>|"signed frame"| l0_gossip_proto

    %% ═══════════════════════════════════════════════════
    %% SUPPORTING FLOWS
    %% ═══════════════════════════════════════════════════

    %% L3 ↔ L4: Mirror feedback
    l4_mirror_signal_out -.->|"mirror signal → σ_φ"| l3_diffusion_block

    %% L5 → L3: Bleed Engine → Ghost Buffer
    l5_bleed_engine -.->|"ghost prefetch T1→T0"| l3_ghost_block

    %% L7: Learning connections
    l2_frame_struct -.->|"every inference → stored"| l7_instant
    l7_instant -.->|"RAM writes"| l5_memtable
    l5_t1 -.->|"frames for distill"| l7_sleep
    l7_sleep -.->|"FF weight updates"| l3_vfn_block
    l7_developmental -.->|"strand graduation"| l5_indexing

    %% L8: Commons connections
    l4_ledger_strand -.->|"frames to publish"| l8_merkle_log
    l0_gossip_proto <-.->|"P2P sync"| l8_libp2p_layer

    %% L9: UI connections
    l0_chat_user -.->|"user input"| l9_n8n_trigger
    l9_n8n_http -.->|"POST /api/think"| l2_frame_struct

    %% L10: Trait governance
    l10_translator_trait -.->|"governs"| L1
    l10_hardstrand_trait -.->|"governs"| L4
    l10_actioncore_trait -.->|"governs"| L6
    l10_auto_discovery -.->|"feeds"| l7_developmental

    %% STYLING

    classDef userStyle fill:#2e1a3e,stroke:#c084fc,stroke-width:2px,color:#eee
    classDef apiStyle fill:#1a2e3e,stroke:#60a5fa,stroke-width:2px,color:#eee
    classDef sensorStyle fill:#1a3e2e,stroke:#34d399,stroke-width:2px,color:#eee
    classDef p2pStyle fill:#3e2e1a,stroke:#fbbf24,stroke-width:2px,color:#eee
    classDef osStyle fill:#2e2e2e,stroke:#94a3b8,stroke-width:2px,color:#eee
    classDef dataStyle fill:#1a2e2e,stroke:#38bdf8,stroke-width:2px,color:#eee
    classDef translatorStyle fill:#2a1a2e,stroke:#a855f7,stroke-width:2px,color:#eee
    classDef outputStyle fill:#1a2a1a,stroke:#4ecca3,stroke-width:2px,color:#eee
    classDef textStyle fill:#2a1a2e,stroke:#a855f7,stroke-width:2px,color:#eee
    classDef visionStyle fill:#1a2e2a,stroke:#34d399,stroke-width:2px,color:#eee
    classDef audioStyle fill:#2e2a1a,stroke:#fbbf24,stroke-width:2px,color:#eee
    classDef busStyle fill:#2d2d3d,stroke:#f0c040,stroke-width:3px,color:#fff
    classDef traitStyle fill:#2e2a1a,stroke:#fbbf24,stroke-width:2px,color:#eee
    classDef stageStyle fill:#1a1a2e,stroke:#818cf8,stroke-width:1px,color:#eee
    classDef slotStyle fill:#3d3d2d,stroke:#f0c040,stroke-width:1px,color:#eee
    classDef resStyle fill:#2d3d3d,stroke:#38bdf8,stroke-width:1px,color:#eee
    classDef hdcStyle fill:#1a2e1a,stroke:#4ecca3,stroke-width:2px,color:#eee
    classDef gammaStyle fill:#2e1a1a,stroke:#f87171,stroke-width:2px,color:#eee
    classDef cbStyle fill:#1a1a2e,stroke:#818cf8,stroke-width:2px,color:#eee
    classDef connStyle fill:#2e2e2e,stroke:#94a3b8,stroke-width:1px,color:#eee
    classDef gpuStyle fill:#1a1a2e,stroke:#e94560,stroke-width:2px,color:#eee
    classDef rootStyle fill:#2e1a2e,stroke:#c084fc,stroke-width:2px,color:#eee
    classDef attendStyle fill:#1a2e2e,stroke:#38bdf8,stroke-width:2px,color:#eee
    classDef refineStyle fill:#1a2e1a,stroke:#4ecca3,stroke-width:2px,color:#eee
    classDef vfnStyle fill:#2e2a1a,stroke:#fbbf24,stroke-width:2px,color:#eee
    classDef diffStyle fill:#2e1a1a,stroke:#f87171,stroke-width:2px,color:#eee
    classDef ghostStyle fill:#1a1a2e,stroke:#818cf8,stroke-width:2px,color:#eee
    classDef extStyle fill:#2e2e2e,stroke:#94a3b8,stroke-width:1px,color:#aaa
    classDef cpuStyle fill:#16213e,stroke:#0f3460,stroke-width:2px,color:#eee
    classDef routerStyle fill:#1a2e3e,stroke:#60a5fa,stroke-width:2px,color:#eee
    classDef strandStyle fill:#1a2a2e,stroke:#38bdf8,stroke-width:2px,color:#eee
    classDef safetyStyle fill:#3d1a1a,stroke:#ff4444,stroke-width:2px,color:#eee
    classDef vetoStyle fill:#4d0a0a,stroke:#ff0000,stroke-width:3px,color:#fff
    classDef ramStyle fill:#1a2a1a,stroke:#4ecca3,stroke-width:2px,color:#eee
    classDef t0Style fill:#1a1a2e,stroke:#e94560,stroke-width:2px,color:#eee
    classDef t1Style fill:#1a2a2a,stroke:#38bdf8,stroke-width:2px,color:#eee
    classDef t2Style fill:#2a2a1a,stroke:#fbbf24,stroke-width:2px,color:#eee
    classDef idxStyle fill:#2a1a2a,stroke:#c084fc,stroke-width:2px,color:#eee
    classDef bleedStyle fill:#1a2e3e,stroke:#60a5fa,stroke-width:2px,color:#eee
    classDef gcStyle fill:#2e1a1a,stroke:#f87171,stroke-width:2px,color:#eee
    classDef storeStyle fill:#1a2e1a,stroke:#34d399,stroke-width:2px,color:#eee
    classDef coherStyle fill:#2e2e1a,stroke:#fcd34d,stroke-width:2px,color:#eee
    classDef ioStyle fill:#2a1a2e,stroke:#a855f7,stroke-width:2px,color:#eee
    classDef speechStyle fill:#2e2a1a,stroke:#fbbf24,stroke-width:2px,color:#eee
    classDef imageStyle fill:#1a1a2e,stroke:#818cf8,stroke-width:2px,color:#eee
    classDef motorStyle fill:#2e1a1a,stroke:#f87171,stroke-width:2px,color:#eee
    classDef n8nStyle fill:#1a2e3e,stroke:#60a5fa,stroke-width:2px,color:#eee
    classDef ledgerStyle fill:#2e2e1a,stroke:#fcd34d,stroke-width:2px,color:#eee
    classDef learnStyle fill:#1a2a2e,stroke:#38bdf8,stroke-width:2px,color:#eee
    classDef instantStyle fill:#1a3e1a,stroke:#4ecca3,stroke-width:2px,color:#eee
    classDef sleepStyle fill:#2e1a2e,stroke:#c084fc,stroke-width:2px,color:#eee
    classDef devStyle fill:#2e2a1a,stroke:#fbbf24,stroke-width:2px,color:#eee
    classDef l0Style fill:#1a2e1a,stroke:#4ecca3,stroke-width:2px,color:#eee
    classDef l1Style fill:#1a1a2e,stroke:#818cf8,stroke-width:2px,color:#eee
    classDef l2Style fill:#2e2a1a,stroke:#fbbf24,stroke-width:2px,color:#eee
    classDef valueStyle fill:#2e1a2e,stroke:#c084fc,stroke-width:2px,color:#eee
    classDef uiStyle fill:#2e2a1a,stroke:#fbbf24,stroke-width:2px,color:#eee
    classDef debugStyle fill:#2e1a2e,stroke:#c084fc,stroke-width:2px,color:#eee
    classDef futureStyle fill:#1a2e1a,stroke:#4ecca3,stroke-width:2px,color:#eee
    classDef coreStyle fill:#1a2e1a,stroke:#4ecca3,stroke-width:2px,color:#eee
    classDef discoveryStyle fill:#2e1a1a,stroke:#f87171,stroke-width:2px,color:#eee
    classDef ecoStyle fill:#1a1a2e,stroke:#818cf8,stroke-width:2px,color:#eee

    class l0_chat_user,l0_voice_user,l0_file_user,l0_gesture_user userStyle
    class l0_rest_api,l0_ws_api,l0_graphql_api,l0_webhook_inbound apiStyle
    class l0_camera_sensor,l0_mic_sensor,l0_iot_sensor,l0_gpio_sensor sensorStyle
    class p2p_node_a,p2p_node_b,p2p_node_n,l0_gossip_proto,l0_ipfs_gateway p2pStyle
    class l0_fs_events,l0_proc_events,l0_clipboard,l0_env_vars,l0_stdin_pipe osStyle
    class csv_data,json_data,db_stream,log_stream dataStyle
    class text_t,vision_t,audio_t,data_t,sensor_t translatorStyle
    class text_out_ret,speech_out_ret,image_out_ret,motor_out_ret,n8n_out_ret,ledger_out_ret outputStyle
    class l1_raw_text,llm_stage,tokenizer,embed_layer,transformer_layers,pooled_output,proj_stage,role_detect,srl_classifier,role_labels,slot_assign,span_grouper,slot_router,res_fill,r0_proj,r1_proj,r2_proj,r3_proj,quant_stage,continuous_vec,hnsw_lookup,commitment_loss,l1_quantized_vec textStyle
    class l1_raw_image,vision_backbone,patch_embed,vit_layers,cls_token,vision_slot_map,obj_detect,scene_class,action_recog,attr_extract,spatial_rel,l1_vision_vqvae visionStyle
    class l1_raw_audio,audio_branch,speech_branch,vad,asr,text_pipe,nonspeech_branch,mel_spec,audio_encoder,audio_slot_map,l1_audio_vqvae audioStyle
    class l1_raw_data,data_pipeline,schema_detect,field_map,agg_r0,row_r1,cell_r2,l1_data_vqvae dataStyle
    class l1_raw_sensor,sensor_pipeline,event_parse,sensor_slot_map,normalize,l1_sensor_vqvae sensorStyle
    class frame_out busStyle
    class trait_sig traitStyle
    class l2_frame_struct,frame_ops,slot_write,slot_write_ex,res_zoom,res_zoom_ex,compose_op,compose_ex,l2_parallel_decode,l2_decode_ex,sparse_attn,attn_ex busStyle
    class s0,s1,s2,s3,s4,s5,s6,s7,s8,s9,s10,s11,s12,s13,s14,s15,slots slotStyle
    class r0,r1,r2,r3,resolutions,dim_info,dimensions resStyle
    class hdc,bind_op,super_op,perm_op,unbind_op,role_filler_op hdcStyle
    class bind_in_a,bind_fft_a,bind_mult,bind_fft_b,bind_in_b,bind_ifft,bind_out hdcStyle
    class super_inputs,super_add,super_norm,super_out hdcStyle
    class perm_input,perm_shift,perm_out hdcStyle
    class unbind_bound,unbind_inv,unbind_result hdcStyle
    class rf_roles,rf_fillers,rf_bind,rf_result hdcStyle
    class certainty,gamma_per_slot,slot_gamma,gamma_sources,gamma_chain,chain_premise,chain_step,chain_result,gamma_frame,gamma_frame_calc gammaStyle
    class codebook,cb_structure,cb_entries,cb_dims,cb_memory,cb_index,hnsw_params,hnsw_perf,cb_init,cluster_init,vqvae_train,ema_update cbStyle
    class connections,from_L1,to_L3,from_L3,to_L4,from_L4,to_L5,from_L5,to_L6 connStyle
    class frame_meta,frame_id,strand_id,timestamp_f,gamma_f,slot_mask,res_mask,parent_ref busStyle
    class l3_input_frame,l3_output_frame busStyle
    class rar_loop,iteration_counter gpuStyle
    class root_phase,root_slot_0,root_slot_1,root_slot_2,root_slot_n rootStyle
    class root_vfn_0,root_noise_0,root_delta_0,root_vfn_1,root_noise_1,root_delta_1,root_vfn_2,root_noise_2,root_delta_2,root_vfn_n,root_noise_n,root_delta_n rootStyle
    class attend_phase,qkv_compute,q_proj,k_proj,v_proj,attn_compute,dot_prod,scale_div,softmax_op,context_compute,weighted_sum,ghost_attn,total_ctx,attn_cost,cost_calc attendStyle
    class refine_phase,update_rule,update_eq,convergence,delta_norm,epsilon_check,freeze_slot,continue_slot,termination,all_converged,budget_hit refineStyle
    class vfn_block,vfn_arch,vfn_input,vfn_layers,vfn_output,vfn_configs,vfn_edge,vfn_standard,vfn_research,energy_landscape,energy_concept,landscape_evolves vfnStyle
    class diffusion_block,diff_inputs,conv_rate_in,mirror_signal_in,mode_in,diff_rules,converged_rule,stuck_rule,creative_rule,normal_rule,noise_geometry,ortho_sample diffStyle
    class ghost_block,ghost_content,ghost_r0s,ghost_meta,ghost_mechanism,energy_dips,page_fault,refresh ghostStyle
    class compute_cost,volt_cost,gpt4_cost,ratio gpuStyle
    class mirror_feedback,bleed_refresh,sleep_update extStyle
    class input_frame,l4_output_verified busStyle
    class l4_intent_router,routing_process,extract_gist,compute_cos,rank_strands,no_match,dispatch,fallback,capability_registry routerStyle
    class cap_math,cap_code,cap_api,cap_hdc,cap_cert,cap_proof,cap_causal,cap_mirror,cap_sleep,cap_ledger routerStyle
    class hard_strands cpuStyle
    class math_engine,math_input,math_arb,math_algebra,math_calculus,math_proof strandStyle
    class code_runner,code_input,sandbox_env,lang_rust,lang_python,lang_wasm,code_result strandStyle
    class api_dispatch,api_input,tokio_runtime,http_methods,rate_limit,api_result strandStyle
    class hdc_algebra,hdc_input,fft_bind,fft_unbind,hdc_super,hdc_perm,hdc_result strandStyle
    class certainty_engine,cert_input,min_rule,proof_valid,cert_aggregate,cert_result strandStyle
    class proof_constructor,proof_input,step_record,chain_build,proof_output strandStyle
    class causal_sim,causal_input,do_calc,clone_frame,consequence,causal_result strandStyle
    class mirror_module,mirror_input,loop_detect,uncertainty_est,self_report,l4_mirror_signal_out strandStyle
    class sleep_learner,sleep_input,cluster_frames,distill,ff_coord,sleep_result strandStyle
    class l4_ledger_strand,ledger_input,merkle_append,zk_proof,p2p_publish,ledger_result strandStyle
    class safety_layer,axiomatic_guard,k1,k2,k3,k4,k5,signing safetyStyle
    class transition_monitor,frame_diff,invariant_check,violation_detect,warning_action,critical_action,no_violation safetyStyle
    class omega_veto,hw_interrupt,halt_action,freeze_action,log_action,human_required vetoStyle
    class diffusion_feedback extStyle
    class l5_t0,t0_capacity,t0_access,t0_contents,t0_eviction t0Style
    class l5_t1,t1_capacity,t1_access,t1_structure,t1_mvcc,t1_wal t1Style
    class l5_t2,t2_capacity,t2_access,t2_structure,t2_compression t2Style
    class l5_indexing,strand_routing,l5_strand_hashmap,per_strand_idx,query_flow idxStyle
    class hnsw_index,hnsw_config,hnsw_use,btree_index,btree_config,btree_use idxStyle
    class inverted_index,inv_config,inv_use,bloom_filters,bloom_config,bloom_use idxStyle
    class q_input,q_strand,q_bloom,q_index,q_inv,l5_q_load idxStyle
    class l5_bleed_engine,predictive_prefetch,ondemand_recall,bg_consolidation,sleep_archival bleedStyle
    class prefetch_trigger,prefetch_hnsw,prefetch_load,prefetch_latency bleedStyle
    class recall_trigger,recall_decompress,recall_promote,recall_latency bleedStyle
    class consol_trigger,consol_write,consol_ghost,consol_latency bleedStyle
    class archive_trigger,archive_compress,archive_write,archive_distill,archive_latency bleedStyle
    class gc,gc_stages,gc_full,gc_compressed,gc_gist,gc_tombstone,gc_scoring,retention_formula,immortal_rules gcStyle
    class storage_engine,lsm_tree,l5_memtable,sorted_runs,compaction storeStyle
    class mvcc_rcu,readers,writers,wal_recovery,wal_per_strand,crash_recovery storeStyle
    class serialization,rkyv_zero_copy storeStyle
    class coherence,gamma_priority,superseded_tag,strand_scoped,bg_contradiction coherStyle
    class capacity,cap_t0,cap_t1,cap_t2,cap_total ramStyle
    class bus_in,bus_out busStyle
    class ghost_out,sleep_in,learning_in extStyle
    class l6_input_frame busStyle
    class l6_parallel_decode,slot_decode,decode_s0,decode_s1,decode_s2,decode_s3,decode_s4,decode_s5,decode_s6,decode_s7,decode_s8 ioStyle
    class decode_process,read_r1,codebook_lookup,beam_decode,span_output,assembly,role_order,connectives,final_text ioStyle
    class text_core,text_decode,text_slot_decode,text_role_assemble,text_proof_annotate,text_format,l6_text_output textStyle
    class speech_core,speech_pipeline,speech_text_in,speech_ssml,speech_tts,speech_buffer,l6_speech_output speechStyle
    class image_core,image_pipeline,image_patient,image_manner,image_location,image_instrument,image_conditioning,image_diffusion,image_render,l6_image_output imageStyle
    class motor_core,motor_pipeline,motor_action,motor_instrument,motor_patient,motor_manner,motor_plan,motor_primitives,motor_safety,l6_motor_output motorStyle
    class n8n_core,n8n_pipeline,n8n_predicate,n8n_patient,n8n_instrument,n8n_serialize,n8n_http,n8n_response,l6_n8n_output n8nStyle
    class ledger_core,ledger_pipeline,ledger_frame_in,ledger_sign,ledger_merkle,ledger_zk,ledger_gossip,ledger_ipfs,l6_ledger_output ledgerStyle
    class core_dispatch,to_text,to_speech,to_image,to_motor,to_n8n,to_ledger ioStyle
    class trait_iface traitStyle
    class external extStyle
    class l7_instant,instant_trigger,every_inference,every_frame,instant_process instantStyle
    class frame_created,ram_write,strand_assign,index_update,ghost_update instantStyle
    class instant_properties,zero_forgetting,instant_effect,no_weight_change instantStyle
    class l7_sleep,sleep_trigger,idle_detect,t1_threshold,scheduled sleepStyle
    class sleep_phase1,select_strand,hnsw_cluster,identify_groups sleepStyle
    class sleep_phase2,take_cluster,compute_centroid,extract_wisdom,output_wisdom sleepStyle
    class sleep_phase3,ff_concept,ff_positive,ff_negative,ff_layer_update sleepStyle
    class sleep_phase4,new_attractors,flatten_unused,landscape_result sleepStyle
    class sleep_phase5,compress_original,move_t2,retain_wisdom,free_t1 sleepStyle
    class l7_developmental,strand_graduation,topic_monitor,frequency_check,promote_strand,register_strand devStyle
    class module_hotplug,trait_introspect,load_module,register_cap,test_module devStyle
    class capability_expansion,new_translators,new_strands,new_cores devStyle
    class bus_in busStyle
    class voltdb_out,vfn_out,voltdb_archive,router_out,voltdb_strand,sleep_coord extStyle
    class commons_l0,l8_merkle_log,merkle_structure,merkle_append_op,merkle_verify,merkle_tamper l0Style
    class identity,keypair_gen,sign_frames,verify_sig,did_identity l0Style
    class zk_proofs,zk_purpose,zk_prove_gamma,zk_prove_strand,zk_prove_compute,zk_circuit l0Style
    class commons_l1,l8_libp2p_layer,transport,discovery,pubsub l1Style
    class crdt_sync,crdt_type,crdt_merge,crdt_eventual l1Style
    class ipfs_registry,cid_address,module_publish,module_fetch,module_meta l1Style
    class strand_marketplace,strand_listing,strand_browse,strand_purchase l1Style
    class commons_l2,dag_micropayments,dag_structure,dag_micro,dag_channels l2Style
    class fact_anchoring,anchor_criteria,anchor_process,anchor_query l2Style
    class provenance,prov_track,prov_credit,prov_verify l2Style
    class governance,qv_concept,qv_proposals,qv_execute l2Style
    class value_flows,volt_token,token_props,token_earn,flow_diagram valueStyle
    class flow_contribute,flow_marketplace,flow_verification,flow_trading,flow_earn valueStyle
    class ledger_in,p2p_ext,voltdb_modules,dev_growth,impl_note extStyle
    class n8n_phase,l9_n8n_trigger,chat_input,trigger_config n8nStyle
    class l9_n8n_http,http_config,http_timeout n8nStyle
    class n8n_processing,translate,bus_send,rar_process,verify,recall,decode n8nStyle
    class n8n_switch,check_gamma,high_gamma,medium_gamma,low_gamma,error_path n8nStyle
    class n8n_reply,format_response,send_chat n8nStyle
    class api_endpoint,api_routes,route_think,route_recall,route_status,route_debug apiStyle
    class api_response,resp_format apiStyle
    class debug_panel debugStyle
    class debug_rar,rar_iter_count,rar_slot_status,rar_convergence,rar_energy debugStyle
    class debug_ghost,ghost_count,ghost_activations,ghost_heatmap debugStyle
    class debug_timing,timing_translate,timing_rar,timing_verify,timing_recall,timing_decode,timing_total debugStyle
    class debug_gamma,gamma_per_slot_dbg,gamma_chain_dbg,gamma_history debugStyle
    class debug_memory,mem_t0,mem_t1,mem_t2,mem_gc debugStyle
    class debug_strands,strand_list,strand_detail,strand_routing_dbg debugStyle
    class future_ui,tauri_desktop,tauri_tech,tauri_features futureStyle
    class mobile_app,mobile_tech,mobile_features futureStyle
    class ide_integration,ide_tech,ide_features futureStyle
    class users_in,bus_conn,debug_source extStyle
    class l10_translator_trait,translator_sig,t_trait,t_name,t_encode,t_modalities translatorStyle
    class translator_modality,mod_text,mod_markdown,mod_code,mod_image,mod_video,mod_audio,mod_speech,mod_csv,mod_json,mod_sensor,mod_os_event,mod_custom translatorStyle
    class translator_impls,impl_text,impl_vision,impl_audio,impl_data,impl_sensor translatorStyle
    class translator_contract,contract_t1,contract_t2,contract_t3,contract_t4,contract_t5,contract_t6 translatorStyle
    class l10_hardstrand_trait,hardstrand_sig,h_trait,h_id,h_name,h_cap,h_execute,h_can_handle,h_learning strandStyle
    class strand_result,sr_resolved,sr_needs,sr_delegated,sr_failed strandStyle
    class hardstrand_impls,impl_math,impl_code,impl_api,impl_hdc,impl_cert,impl_proof,impl_causal,impl_mirror,impl_sleep_s,impl_ledger strandStyle
    class hardstrand_contract,contract_h1,contract_h2,contract_h3,contract_h4,contract_h5,contract_h6 strandStyle
    class l10_actioncore_trait,actioncore_sig,a_trait,a_name,a_decode,a_outputs coreStyle
    class output_modality,out_plaintext,out_markdown,out_html,out_wav,out_opus,out_png,out_svg,out_motor_cmd,out_webhook,out_signed_frame,out_custom coreStyle
    class actioncore_impls,impl_text_out,impl_speech_out,impl_image_out,impl_motor_out,impl_n8n_out,impl_ledger_out coreStyle
    class actioncore_contract,contract_a1,contract_a2,contract_a3,contract_a4,contract_a5,contract_a6 coreStyle
    class l10_auto_discovery,discovery_process,scan_crates,trait_check,load_dynamic,register_module,cap_vector_extract,intent_router_update discoveryStyle
    class discovery_sources,local_crate,ipfs_module,p2p_shared discoveryStyle
    class module_lifecycle,lc_discover,lc_load,lc_test,lc_register,lc_active,lc_update,lc_retire discoveryStyle
    class ecosystem,composition,n_modules,cost_model,add_module ecoStyle
    class data_flow_guarantee,flow_in,flow_bus,flow_compute,flow_out ecoStyle
    class layer1,layer4,layer6,layer7,layer8 extStyle
```

## Color Legend

| Color | Subsystem |
|---|---|
| Red border (#e94560) | GPU Soft Core — neural computation |
| Blue border (#0f3460) | CPU Hard Core — deterministic logic |
| Green border (#4ecca3) | VoltDB / RAM — memory tiers |
| Yellow border (#f0c040) | LLL Tensor Frame Bus — data protocol |
| Red fill (#3d1a1a) | Safety Layer — constraints & veto |
| Purple border (#a855f7) | I/O — translators & action cores |
| Sky border (#38bdf8) | Continual Learning |
| Gold border (#fbbf24) | Socket Standard — trait interfaces |
