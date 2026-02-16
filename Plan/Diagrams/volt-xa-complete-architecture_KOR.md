# Volt XA — 완전 아키텍처 다이어그램 (전체 레이어 무삭제)

> 11개 레이어(0-10)의 모든 구성 요소, 연결, 세부 사항을 포함하는 단일 통합 다이어그램. 각 레이어 완전 보존 — 간소화 없음.

```mermaid
%%{init: {"flowchart": {"defaultRenderer": "elk"}} }%%
flowchart TB

    subgraph L0["<b>Layer 0 — 외부 세계</b>"]

        %% ── 인간 사용자 ────────────────────────────────
        subgraph users_group["<b>인간 사용자</b>"]
            direction TB
            l0_chat_user(["채팅 사용자<br/>(UI를 통한 텍스트 입력)"])
            l0_voice_user(["음성 사용자<br/>(마이크 스트림)"])
            l0_file_user(["파일 업로드 사용자<br/>(드래그 앤 드롭 / CLI)"])
            l0_gesture_user(["제스처 / 터치 사용자<br/>(미래: 카메라 / 터치스크린)"])
        end

        %% ── API 및 서비스 ────────────────────────────
        subgraph api_group["<b>API 및 서비스</b>"]
            direction TB
            l0_rest_api(["REST API<br/>HTTP/HTTPS GET/POST<br/>JSON / XML 페이로드"])
            l0_ws_api(["WebSocket API<br/>영구 양방향 연결<br/>실시간 스트리밍"])
            l0_graphql_api(["GraphQL API<br/>구조화된 쿼리<br/>스키마 타입 응답"])
            l0_webhook_inbound(["인바운드 Webhook<br/>이벤트 기반 푸시<br/>n8n / Zapier 트리거"])
        end

        %% ── 센서 및 하드웨어 ─────────────────────────
        subgraph sensor_group["<b>센서 및 하드웨어</b>"]
            direction TB
            l0_camera_sensor(["카메라<br/>비디오 / 이미지 프레임<br/>RGB / 깊이"])
            l0_mic_sensor(["마이크<br/>PCM 오디오 스트림<br/>16kHz+ 샘플레이트"])
            l0_iot_sensor(["IoT 센서<br/>MQTT / CoAP<br/>온도, 동작,<br/>습도, 압력"])
            l0_gpio_sensor(["GPIO / 시리얼<br/>임베디드 디바이스<br/>원시 바이트 스트림"])
        end

        %% ── P2P 메시 네트워크 ──────────────────────────
        subgraph p2p_group["<b>P2P 메시 네트워크</b>"]
            direction TB
            p2p_node_a(["피어 노드 A<br/>libp2p 신원<br/>Ed25519 키쌍"])
            p2p_node_b(["피어 노드 B<br/>libp2p 신원<br/>Ed25519 키쌍"])
            p2p_node_n(["피어 노드 N<br/>libp2p 신원<br/>Ed25519 키쌍"])
            l0_gossip_proto["Gossip 프로토콜<br/>Pub/Sub 토픽<br/>CRDT 상태 동기화"]
            l0_ipfs_gateway["IPFS 게이트웨이<br/>콘텐츠 주소 지정<br/>모듈 CID"]
            p2p_node_a <--> l0_gossip_proto
            p2p_node_b <--> l0_gossip_proto
            p2p_node_n <--> l0_gossip_proto
            l0_gossip_proto <--> l0_ipfs_gateway
        end

        %% ── OS / 파일 시스템 ──────────────────────────
        subgraph os_group["<b>OS / 파일 시스템</b>"]
            direction TB
            l0_fs_events(["파일 시스템 이벤트<br/>inotify / FSEvents / ReadDirectoryChanges<br/>생성, 수정, 삭제, 이름변경"])
            l0_proc_events(["프로세스 이벤트<br/>생성, 종료, 시그널<br/>PID 추적"])
            l0_clipboard(["클립보드<br/>텍스트 / 이미지 / 리치 콘텐츠<br/>OS 클립보드 API"])
            l0_env_vars(["환경 변수<br/>PATH, 설정 변수<br/>OS 메타데이터"])
            l0_stdin_pipe(["stdin / 파이프<br/>CLI 파이프 입력<br/>원시 바이트 스트림"])
        end

        %% ── 데이터 스트림 ──────────────────────────
        subgraph data_group["<b>구조화된 데이터 스트림</b>"]
            direction TB
            csv_data(["CSV / TSV<br/>테이블 데이터<br/>행-열 구조"])
            json_data(["JSON / JSONL<br/>중첩 객체<br/>스트리밍 라인"])
            db_stream(["데이터베이스 피드<br/>CDC / 폴링<br/>SQL 결과 집합"])
            log_stream(["로그 스트림<br/>syslog / journald<br/>구조화 / 비구조화"])
        end
    end

    subgraph L1["<b>Layer 1 — 입력 변환기</b>"]

        %% ═══════════════════════════════════════════════
        %% 텍스트 변환기 (참조 구현)
        %% ═══════════════════════════════════════════════
        subgraph text_translator["<b>텍스트 변환기</b> (참조 구현)"]
            direction TB

            l1_raw_text["원시 텍스트 입력<br/><i>UTF-8 문자열</i>"]

            subgraph llm_stage["<b>단계 1: 동결 LLM 백본</b><br/><i>~1-7B 파라미터 (Llama / Mistral / Qwen)</i><br/>파라미터 절대 수정 안 함 — 지식 사전"]
                direction TB
                tokenizer["토크나이저<br/>BPE / SentencePiece<br/>텍스트 → 토큰 ID"]
                embed_layer["임베딩 레이어<br/>토큰 ID → 밀집 벡터<br/>[seq_len × hidden_dim]"]
                transformer_layers["Transformer 레이어<br/>Self-attention + FFN<br/>문맥적 임베딩<br/>[seq_len × hidden_dim]"]
                pooled_output["풀링된 은닉 상태<br/>마지막 레이어 표현<br/>토큰별 문맥 벡터"]

                tokenizer --> embed_layer --> transformer_layers --> pooled_output
            end

            subgraph proj_stage["<b>단계 2: 프레임 투영 헤드</b><br/><i>~50M 훈련 가능 파라미터</i>"]
                direction TB

                subgraph role_detect["<b>단계 2a: 의미역 감지</b>"]
                    direction LR
                    srl_classifier["SRL 분류기<br/>MLP + softmax<br/>토큰별 역할 확률"]
                    role_labels["감지된 역할:<br/>AGENT · PREDICATE · PATIENT<br/>LOCATION · TIME · MANNER<br/>INSTRUMENT · CAUSE · RESULT<br/>FREE₁-FREE₇"]
                    srl_classifier --> role_labels
                end

                subgraph slot_assign["<b>단계 2b: 슬롯 할당</b>"]
                    direction LR
                    span_grouper["스팬 그루퍼<br/>BIO 태깅<br/>다중 토큰 스팬 병합"]
                    slot_router["슬롯 라우터<br/>역할 → 슬롯 인덱스<br/>충돌 시: γ 우선순위"]
                    span_grouper --> slot_router
                end

                subgraph res_fill["<b>단계 2c: 해상도 채움</b>"]
                    direction LR
                    r0_proj["R₀ 투영<br/>담화 수준<br/>주제 / 분위기 / 의도<br/>Linear: hidden→256"]
                    r1_proj["R₁ 투영<br/>명제 수준<br/>문장 의미론<br/>Linear: hidden→256"]
                    r2_proj["R₂ 투영<br/>구문 수준<br/>개체 / 값 / 수식어<br/>Linear: hidden→256"]
                    r3_proj["R₃ 투영<br/>토큰 수준<br/>서브워드 세부사항<br/>Linear: hidden→256"]
                end

                role_detect --> slot_assign --> res_fill
            end

            subgraph quant_stage["<b>단계 3: VQ-VAE 양자화기</b>"]
                direction TB
                continuous_vec["연속 벡터<br/>[슬롯×해상도 당 256차원]"]
                hnsw_lookup["HNSW 코드북 조회<br/>가장 가까운 코드 벡터 탐색<br/>코사인 거리"]
                commitment_loss["Commitment 손실<br/>‖z - sg(e)‖² + β‖sg(z) - e‖²<br/>+ EMA 중심점 업데이트"]
                l1_quantized_vec["양자화된 벡터<br/>u16 코드 인덱스<br/>→ codebook[idx] ∈ ℝ²⁵⁶"]
                continuous_vec --> hnsw_lookup --> commitment_loss --> l1_quantized_vec
            end

            l1_raw_text --> llm_stage
            pooled_output --> proj_stage
            res_fill --> quant_stage
        end

        %% ═══════════════════════════════════════════════
        %% 비전 변환기
        %% ═══════════════════════════════════════════════
        subgraph vision_translator["<b>비전 변환기</b>"]
            direction TB

            l1_raw_image["원시 이미지 / 비디오 프레임<br/><i>RGB 텐서 [H × W × 3]</i>"]

            subgraph vision_backbone["<b>비전 백본</b><br/><i>동결 ViT / CLIP 시각 인코더</i>"]
                direction TB
                patch_embed["패치 임베딩<br/>이미지 → 16×16 패치<br/>→ 패치 토큰"]
                vit_layers["ViT 레이어<br/>패치 간 Self-attention<br/>공간적 특징"]
                cls_token["CLS + 패치 특징<br/>[num_patches × hidden_dim]"]
                patch_embed --> vit_layers --> cls_token
            end

            subgraph vision_slot_map["<b>비전 슬롯 매핑</b>"]
                direction LR
                obj_detect["객체 감지<br/>감지된 객체<br/>→ AGENT / PATIENT"]
                scene_class["장면 분류<br/>장면 컨텍스트<br/>→ LOCATION"]
                action_recog["행동 인식<br/>감지된 행동<br/>→ PREDICATE"]
                attr_extract["속성 추출<br/>색상, 크기, 질감<br/>→ MANNER"]
                spatial_rel["공간 관계<br/>위, 옆, 안<br/>→ FREE 슬롯"]
            end

            l1_vision_vqvae["VQ-VAE 양자화<br/>→ Tensor Frame"]

            l1_raw_image --> vision_backbone
            cls_token --> vision_slot_map
            vision_slot_map --> l1_vision_vqvae
        end

        %% ═══════════════════════════════════════════════
        %% 오디오 변환기
        %% ═══════════════════════════════════════════════
        subgraph audio_translator["<b>오디오 변환기</b>"]
            direction TB

            l1_raw_audio["원시 오디오<br/><i>PCM 스트림, 16kHz+</i>"]

            subgraph audio_branch["<b>이중 분기</b>"]
                direction LR

                subgraph speech_branch["<b>음성 분기</b>"]
                    direction TB
                    vad["음성 활동 감지<br/>Silero VAD<br/>음성 / 비음성"]
                    asr["ASR 엔진<br/>Whisper / Canary<br/>음성 → 텍스트"]
                    text_pipe["→ 텍스트 변환기<br/>파이프라인 재사용"]
                    vad --> asr --> text_pipe
                end

                subgraph nonspeech_branch["<b>비음성 분기</b>"]
                    direction TB
                    mel_spec["Mel 스펙트로그램<br/>FFT → mel 필터뱅크<br/>[프레임 × n_mels]"]
                    audio_encoder["오디오 인코더<br/>동결 오디오 모델<br/>특징 추출"]
                    audio_slot_map["슬롯 매핑:<br/>음색 → MANNER<br/>악기 → INSTRUMENT<br/>배경음 → LOCATION<br/>리듬 → TIME"]
                    mel_spec --> audio_encoder --> audio_slot_map
                end
            end

            l1_audio_vqvae["VQ-VAE 양자화<br/>→ Tensor Frame"]

            l1_raw_audio --> audio_branch
            text_pipe --> l1_audio_vqvae
            audio_slot_map --> l1_audio_vqvae
        end

        %% ═══════════════════════════════════════════════
        %% 데이터 변환기
        %% ═══════════════════════════════════════════════
        subgraph data_translator["<b>데이터 변환기</b>"]
            direction TB

            l1_raw_data["구조화된 데이터<br/><i>JSON / CSV / SQL / XML</i>"]

            subgraph data_pipeline["<b>데이터 파이프라인</b>"]
                direction TB
                schema_detect["스키마 감지<br/>열 유형 추론<br/>+ 관계"]
                field_map["필드 → 슬롯 매핑<br/>subject → AGENT<br/>action → PREDICATE<br/>object → PATIENT<br/>where → LOCATION<br/>when → TIME"]
                agg_r0["집계 → R₀<br/>요약 통계<br/>→ 담화 요지"]
                row_r1["행 수준 → R₁<br/>개별 레코드<br/>→ 명제"]
                cell_r2["셀 수준 → R₂<br/>특정 값<br/>→ 구문 세부사항"]
                schema_detect --> field_map
                field_map --> agg_r0
                field_map --> row_r1
                field_map --> cell_r2
            end

            l1_data_vqvae["VQ-VAE 양자화<br/>→ Tensor Frame"]

            l1_raw_data --> data_pipeline --> l1_data_vqvae
        end

        %% ═══════════════════════════════════════════════
        %% 센서 / OS 변환기
        %% ═══════════════════════════════════════════════
        subgraph sensor_translator["<b>센서 / OS 변환기</b>"]
            direction TB

            l1_raw_sensor["센서 / OS 이벤트<br/><i>MQTT, inotify, 프로세스 시그널</i>"]

            subgraph sensor_pipeline["<b>센서 파이프라인</b>"]
                direction TB
                event_parse["이벤트 파서<br/>프로토콜별 디코딩<br/>MQTT / CoAP / 시리얼 / OS API"]
                sensor_slot_map["슬롯 매핑:<br/>판독값 → PATIENT<br/>센서 소스 → AGENT<br/>타임스탬프 → TIME<br/>이벤트 유형 → PREDICATE<br/>임계값 초과 → CAUSE<br/>디바이스 ID → INSTRUMENT"]
                normalize["값 정규화<br/>단위 변환<br/>범위 스케일링 [0,1]"]
                event_parse --> sensor_slot_map --> normalize
            end

            l1_sensor_vqvae["VQ-VAE 양자화<br/>→ Tensor Frame"]

            l1_raw_sensor --> sensor_pipeline --> l1_sensor_vqvae
        end
    end

    subgraph L2["<b>Layer 2 — LLL Tensor Frame Bus</b>"]

        %% ═══════════════════════════════════════════════
        %% TENSOR FRAME 구조
        %% ═══════════════════════════════════════════════
        subgraph l2_frame_struct["<b>Tensor Frame 구조</b><br/><i>F ∈ ℝ<sup>[S × R × D]</sup> — 3차원 희소 텐서</i>"]
            direction TB

            subgraph slots["<b>S = 16 슬롯</b>"]
                direction LR
                s0["슬롯 0<br/><b>AGENT</b><br/>누가/무엇이 행동하는가"]
                s1["슬롯 1<br/><b>PREDICATE</b><br/>행동/상태"]
                s2["슬롯 2<br/><b>PATIENT</b><br/>행동의 대상"]
                s3["슬롯 3<br/><b>LOCATION</b><br/>어디서"]
                s4["슬롯 4<br/><b>TIME</b><br/>언제"]
                s5["슬롯 5<br/><b>MANNER</b><br/>어떻게"]
                s6["슬롯 6<br/><b>INSTRUMENT</b><br/>무엇으로"]
                s7["슬롯 7<br/><b>CAUSE</b><br/>왜"]
                s8["슬롯 8<br/><b>RESULT</b><br/>결과"]
                s9["슬롯 9<br/><b>FREE₁</b>"]
                s10["슬롯 10<br/><b>FREE₂</b>"]
                s11["슬롯 11<br/><b>FREE₃</b>"]
                s12["슬롯 12<br/><b>FREE₄</b>"]
                s13["슬롯 13<br/><b>FREE₅</b>"]
                s14["슬롯 14<br/><b>FREE₆</b>"]
                s15["슬롯 15<br/><b>FREE₇</b>"]
            end

            subgraph resolutions["<b>R = 4 해상도 (슬롯당)</b>"]
                direction LR
                r0["<b>R₀ 담화</b><br/>주제, 분위기, 의도<br/>소비자: GPU, Bleed Buffer<br/>256 차원"]
                r1["<b>R₁ 명제</b><br/>문장 수준 의미론<br/>소비자: GPU + CPU<br/>256 차원"]
                r2["<b>R₂ 구문</b><br/>개체, 값, 수식어<br/>소비자: CPU, 출력 디코더<br/>256 차원"]
                r3["<b>R₃ 토큰</b><br/>서브워드 토큰<br/>소비자: 출력 디코딩 전용<br/>256 차원"]
            end

            subgraph dimensions["<b>D = 256 차원</b>"]
                direction LR
                dim_info["각 슬롯×해상도 = 256차원<br/>단위 벡터 ∈ ℝ²⁵⁶<br/>VQ-VAE 코드북으로 양자화<br/><br/><b>최대 프레임: 64 KB</b><br/>(16 슬롯 × 4 해상도 × 256 × f32)<br/><br/><b>일반적 희소: ~8 KB</b><br/>(4 슬롯 × 2 해상도 채워짐)"]
            end

            subgraph frame_meta["<b>프레임 메타데이터</b>"]
                direction LR
                frame_id["Frame ID<br/>u64 고유값"]
                strand_id["Strand ID<br/>토픽 파티션"]
                timestamp_f["타임스탬프<br/>u64 나노초"]
                gamma_f["γ (확신도)<br/>f32 ∈ [0,1]"]
                slot_mask["슬롯 마스크<br/>u16 비트필드<br/>채워진 슬롯 표시"]
                res_mask["해상도 마스크<br/>슬롯당 u8<br/>채워진 해상도 표시"]
                parent_ref["부모 프레임 참조<br/>선택적 u64<br/>인과 체인"]
            end
        end

        %% ═══════════════════════════════════════════════
        %% VQ-VAE 코드북
        %% ═══════════════════════════════════════════════
        subgraph codebook["<b>VQ-VAE 코드북</b>"]
            direction TB

            subgraph cb_structure["<b>구조</b>"]
                direction LR
                cb_entries["65,536 항목 (2¹⁶)<br/>u16 주소 지정<br/>0x0000 – 0xFFFF"]
                cb_dims["256차원 단위 벡터<br/>각 항목 ∈ ℝ²⁵⁶<br/>‖e_i‖ = 1"]
                cb_memory["~67 MB 상주<br/>65,536 × 256 × f32<br/>항상 RAM에 유지"]
            end

            subgraph cb_index["<b>코드북 위의 HNSW 인덱스</b>"]
                direction LR
                hnsw_params["M = 16, ef_construction = 200<br/>ef_search = 50<br/>코사인 거리 메트릭"]
                hnsw_perf["조회: ~10μs<br/>Top-1 최근접 코드 벡터<br/>O(log 65536) ≈ O(16)"]
            end

            subgraph cb_init["<b>초기화 및 업데이트</b>"]
                direction TB
                cluster_init["초기: K-means 클러스터링<br/>LLM 은닉 상태<br/>→ 65,536 중심점"]
                vqvae_train["VQ-VAE 훈련:<br/>Commitment 손실:<br/>‖z - sg(e)‖²<br/>+ β‖sg(z) - e‖²"]
                ema_update["EMA 중심점 업데이트:<br/>e_i ← λ·e_i + (1-λ)·z̄_i<br/>지속적 정제"]
                cluster_init --> vqvae_train --> ema_update
            end
        end

        %% ═══════════════════════════════════════════════
        %% HDC 대수 연산
        %% ═══════════════════════════════════════════════
        subgraph hdc["<b>HDC / HRR 대수</b><br/><i>슬롯 내 256차원 벡터에 대해 연산</i>"]
            direction TB

            subgraph bind_op["<b>바인딩 (⊗) — 결합적 연관</b>"]
                direction LR
                bind_in_a["벡터 a<br/>[256]"]
                bind_fft_a["FFT(a)<br/>O(D log D)"]
                bind_mult["원소별 ⊙<br/>FFT(a) ⊙ FFT(b)"]
                bind_fft_b["FFT(b)<br/>O(D log D)"]
                bind_in_b["벡터 b<br/>[256]"]
                bind_ifft["IFFT(결과)<br/>O(D log D)"]
                bind_out["a ⊗ b<br/>[256]"]

                bind_in_a --> bind_fft_a --> bind_mult
                bind_in_b --> bind_fft_b --> bind_mult
                bind_mult --> bind_ifft --> bind_out
            end

            subgraph super_op["<b>중첩 (+) — 집합 결합</b>"]
                direction LR
                super_inputs["벡터 a, b, c<br/>각 [256]"]
                super_add["원소별 합<br/>a + b + c"]
                super_norm["normalize()<br/>÷ ‖sum‖"]
                super_out["중첩 결과<br/>[256] 단위 벡터"]
                super_inputs --> super_add --> super_norm --> super_out
            end

            subgraph perm_op["<b>순열 (ρ) — 시퀀스 인코딩</b>"]
                direction LR
                perm_input["시퀀스 [a, b, c]"]
                perm_shift["순환 시프트:<br/>a + ρ¹(b) + ρ²(c)<br/>ρᵏ = k 위치만큼 시프트"]
                perm_out["시퀀스 인식<br/>중첩 [256]"]
                perm_input --> perm_shift --> perm_out
            end

            subgraph unbind_op["<b>언바인딩 (⊗⁻¹) — 구성 요소 복원</b>"]
                direction LR
                unbind_bound["바인딩된 벡터<br/>a ⊗ b"]
                unbind_inv["인볼루션:<br/>x⁻¹_i = x_{(-i mod D)}<br/>자기역원 속성"]
                unbind_result["≈ b (복원됨)<br/>코사인 유사도 > 0.9<br/>노이즈 플로어 포함"]
                unbind_bound --> unbind_inv --> unbind_result
            end

            subgraph role_filler_op["<b>역할-채움 — 구조화된 지식</b>"]
                direction LR
                rf_roles["역할: r₁, r₂, ..., rₙ<br/>(랜덤 단위 벡터)"]
                rf_fillers["채움값: f₁, f₂, ..., fₙ<br/>(콘텐츠 벡터)"]
                rf_bind["Σᵢ (rᵢ ⊗ fᵢ)<br/>각 역할을 채움값에 바인딩"]
                rf_result["합성 벡터<br/>모든 역할-채움 쌍<br/>언바인딩으로 복원 가능"]
                rf_roles --> rf_bind
                rf_fillers --> rf_bind
                rf_bind --> rf_result
            end
        end

        %% ═══════════════════════════════════════════════
        %% 확신도 전파
        %% ═══════════════════════════════════════════════
        subgraph certainty["<b>확신도 (γ) 전파</b>"]
            direction TB

            subgraph gamma_per_slot["<b>슬롯별 확신도</b>"]
                direction LR
                slot_gamma["γ_slot ∈ [0, 1]<br/>RAR 수렴 시 설정<br/>‖ΔS‖ < ε → γ 계산"]
                gamma_sources["출처:<br/>수렴 속도 → 높은 γ<br/>코드북 거리 → 멀수록 낮음<br/>슬롯 채움 완성도"]
            end

            subgraph gamma_chain["<b>연쇄 규칙 (최솟값 규칙)</b>"]
                direction TB
                chain_premise["전제 A → B<br/>γ(A→B) = 0.95"]
                chain_step["단계 B → C<br/>γ(B→C) = 0.80"]
                chain_result["결론 A → C<br/>γ(A→C) = min(0.95, 0.80) = <b>0.80</b>"]
                chain_premise --> chain_result
                chain_step --> chain_result
            end

            subgraph gamma_frame["<b>프레임 수준 확신도</b>"]
                direction LR
                gamma_frame_calc["γ(Frame) = min(채워진 모든 슬롯의 γ)<br/><br/>불확실한 슬롯 하나가 정직하게<br/>전체 신뢰도를 낮춤<br/><br/>γ ≥ 0.90 → 높은 신뢰도<br/>γ ∈ [0.50, 0.90) → 중간<br/>γ < 0.50 → 불확실"]
            end

            gamma_per_slot --> gamma_chain --> gamma_frame
        end

        %% ═══════════════════════════════════════════════
        %% 프레임 연산
        %% ═══════════════════════════════════════════════
        subgraph frame_ops["<b>프레임 수준 연산</b>"]
            direction TB

            subgraph slot_write["<b>슬롯 쓰기</b> (임의 접근)"]
                slot_write_ex["F[slot=2, res=1] = encode('lifetime bug')<br/>직접 주소 지정, O(1)"]
            end

            subgraph res_zoom["<b>해상도 확대</b>"]
                res_zoom_ex["R₀에서 추론 (저비용)<br/>필요할 때만 R₂/R₃로 드릴다운<br/>요구에 따른 점진적 세부사항"]
            end

            subgraph compose_op["<b>프레임 합성</b>"]
                compose_ex["여러 프레임의 비어있지 않은<br/>슬롯 병합<br/>γ 우선순위 충돌 해결<br/>정보 손실 없음"]
            end

            subgraph l2_parallel_decode["<b>병렬 디코딩</b>"]
                l2_decode_ex["모든 슬롯 동시 디코딩<br/>5슬롯 = 1슬롯 실시간<br/>GPU 병렬 디코딩"]
            end

            subgraph sparse_attn["<b>희소 어텐션 비용</b>"]
                attn_ex["O(16² × 256) = 65,536 연산<br/>100K 컨텍스트 transformer 대비<br/>~20M× 더 저렴"]
            end
        end
    end

    subgraph L3["<b>레이어 3 — GPU Soft Core</b><br/><i>System 1: 빠르고, 병렬적이며, 연상적이고, 창의적</i><br/><i>Tensor Frame 슬롯 위의 연속 SDE 역학</i>"]

        %% ═══════════════════════════════════════════════
        %% 입력
        %% ═══════════════════════════════════════════════
        l3_input_frame{{"입력: 후보 Tensor Frame<br/>Bus (레이어 2)에서 수신<br/>F ∈ ℝ<sup>[16 × 4 × 256]</sup>"}}

        %% ═══════════════════════════════════════════════
        %% RAR 루프
        %% ═══════════════════════════════════════════════
        subgraph rar_loop["<b>RAR 루프 — Root-Attend-Refine</b><br/><i>모든 슬롯이 수렴하거나 예산 소진 시까지 반복</i>"]
            direction TB

            iteration_counter["반복 카운터<br/>t = 0, 1, 2, ...<br/>일반적: 8-15회 반복<br/>최대 예산: 설정 가능"]

            %% ── ROOT 단계 ─────────────────────────────
            subgraph root_phase["<b>ROOT 단계</b> (슬롯별 병렬 처리)<br/><i>16개 슬롯 모두 GPU에서 완전 병렬 실행</i>"]
                direction TB

                subgraph root_slot_0["슬롯 0 (AGENT)"]
                    direction TB
                    root_vfn_0["VFN 패스: f_θ(S₀[R₀])<br/>[256] → [256]<br/>공유 가중치"]
                    root_noise_0["확산 노이즈:<br/>σ₀ × sample_orthogonal_to(drift₀)<br/>σ₀ = σ_φ(S₀, conv_rate₀, mirror)"]
                    root_delta_0["ΔS₀ = drift₀ + noise₀"]
                    root_vfn_0 --> root_noise_0 --> root_delta_0
                end

                subgraph root_slot_1["슬롯 1 (PREDICATE)"]
                    direction TB
                    root_vfn_1["VFN 패스: f_θ(S₁[R₀])<br/>[256] → [256]"]
                    root_noise_1["확산 노이즈:<br/>σ₁ × sample_orthogonal_to(drift₁)"]
                    root_delta_1["ΔS₁ = drift₁ + noise₁"]
                    root_vfn_1 --> root_noise_1 --> root_delta_1
                end

                subgraph root_slot_2["슬롯 2 (PATIENT)"]
                    direction TB
                    root_vfn_2["VFN 패스: f_θ(S₂[R₀])<br/>[256] → [256]"]
                    root_noise_2["확산 노이즈:<br/>σ₂ × sample_orthogonal_to(drift₂)"]
                    root_delta_2["ΔS₂ = drift₂ + noise₂"]
                    root_vfn_2 --> root_noise_2 --> root_delta_2
                end

                subgraph root_slot_n["슬롯 3-15<br/>(LOCATION, TIME, MANNER,<br/>INSTRUMENT, CAUSE, RESULT,<br/>FREE₁-FREE₇)"]
                    direction TB
                    root_vfn_n["VFN 패스: f_θ(Sₙ[R₀])<br/>[256] → [256]<br/>동일한 공유 가중치"]
                    root_noise_n["확산 노이즈:<br/>σₙ × sample_orthogonal_to(driftₙ)"]
                    root_delta_n["ΔSₙ = driftₙ + noiseₙ"]
                    root_vfn_n --> root_noise_n --> root_delta_n
                end
            end

            %% ── ATTEND 단계 ───────────────────────────
            subgraph attend_phase["<b>ATTEND 단계</b> (슬롯 간 상호작용)<br/><i>모든 슬롯이 다른 모든 슬롯 + 고스트에 어텐션</i>"]
                direction TB

                subgraph qkv_compute["<b>Q/K/V 계산</b>"]
                    direction LR
                    q_proj["Q = W_Q · root_i<br/>[256] → [64]<br/>쿼리 슬롯 i별"]
                    k_proj["K = W_K · root_j<br/>[256] → [64]<br/>키 슬롯 j별"]
                    v_proj["V = W_V · root_j<br/>[256] → [256]<br/>값 슬롯 j별"]
                end

                subgraph attn_compute["<b>어텐션 점수</b>"]
                    direction TB
                    dot_prod["내적:<br/>Q_i · K_j (모든 j에 대해)<br/>16 × 16 = 256개 내적"]
                    scale_div["스케일링: ÷ √64 = ÷ 8<br/>기울기 소실 방지"]
                    softmax_op["j에 대한 Softmax:<br/>A_ij = exp(score_ij) / Σ_k exp(score_ik)<br/>어텐션 가중치 [16 × 16]"]
                    dot_prod --> scale_div --> softmax_op
                end

                subgraph context_compute["<b>컨텍스트 벡터</b>"]
                    direction TB
                    weighted_sum["슬롯 컨텍스트:<br/>ctx_i = Σ_j (A_ij × V_j)<br/>슬롯당 [256]"]
                    ghost_attn["고스트 어텐션:<br/>ghost_ctx_i = α × Σ_g (A_ig × V_g)<br/>α = 고스트 가중치 (조정 가능)<br/>g ∈ 고스트 버퍼 (~1000개 R₀)"]
                    total_ctx["총 context_i =<br/>ctx_i + ghost_ctx_i<br/>슬롯당 [256]"]
                    weighted_sum --> total_ctx
                    ghost_attn --> total_ctx
                end

                subgraph attn_cost["<b>비용</b>"]
                    cost_calc["16 슬롯 × 16 키 × 256 차원<br/>= <b>65,536 곱셈-덧셈</b><br/>+ ~1000 고스트 키<br/>≈ 총 321,536 연산<br/><i>트랜스포머 대비 무시 가능</i>"]
                end

                qkv_compute --> attn_compute --> context_compute
            end

            %% ── REFINE 단계 ───────────────────────────
            subgraph refine_phase["<b>REFINE 단계</b> (업데이트 + 수렴 검사)<br/><i>슬롯별: 상태 업데이트, 수렴 확인</i>"]
                direction TB

                subgraph update_rule["<b>상태 업데이트</b>"]
                    direction TB
                    update_eq["S_i(t+1) = normalize(<br/>  S_i(t) + dt_i × (ΔS_i + β × context_i)<br/>)<br/><br/>dt_i = 적응형 스텝 크기<br/>β = 컨텍스트 혼합 가중치<br/>normalize = 단위 구에 투영"]
                end

                subgraph convergence["<b>수렴 검사</b>"]
                    direction TB
                    delta_norm["‖S_i(t+1) − S_i(t)‖ 계산<br/>(변화의 L2 노름)"]
                    epsilon_check{"‖ΔS‖ < ε ?"}
                    freeze_slot["<b>슬롯 동결</b><br/>수렴 완료 표시<br/>γ_i 계산<br/>Attend에서 K/V로 계속 제공"]
                    continue_slot["<b>계속</b><br/>슬롯 활성 상태 유지<br/>→ 다음 Root 반복"]
                    delta_norm --> epsilon_check
                    epsilon_check -->|"예: 수렴됨"| freeze_slot
                    epsilon_check -->|"아니오: 아직 변화 중"| continue_slot
                end

                subgraph termination["<b>종료 조건</b>"]
                    direction LR
                    all_converged["16개 슬롯 모두 동결<br/>→ <b>완전 수렴</b><br/>γ = min(모든 슬롯 γ)"]
                    budget_hit["반복 예산 소진<br/>→ <b>부분 수렴</b><br/>정직한 부분 γ 보고"]
                end

                update_rule --> convergence --> termination
            end

            %% ── RAR 루프 흐름 ──────────────────────────
            iteration_counter --> root_phase
            root_phase --> attend_phase
            attend_phase --> refine_phase
            continue_slot -->|"미수렴 슬롯<br/>루프백"| iteration_counter
        end

        %% ═══════════════════════════════════════════════
        %% VFN (벡터 필드 네트워크)
        %% ═══════════════════════════════════════════════
        subgraph vfn_block["<b>Vector Field Network (VFN)</b><br/><i>모든 슬롯에서 가중치 공유 — 합성곱 필터와 유사</i><br/><i>f_θ = −∇E (에너지 경관의 기울기)</i>"]
            direction TB

            subgraph vfn_arch["<b>아키텍처</b>"]
                direction LR
                vfn_input["입력: S_i[R₀]<br/>[256차원]"]
                vfn_layers["은닉층<br/>(설정에 따라 다름)"]
                vfn_output["출력: 드리프트 벡터<br/>[256차원]<br/>에너지 최소값을<br/>향해 가리킴"]
                vfn_input --> vfn_layers --> vfn_output
            end

            subgraph vfn_configs["<b>VFN 설정</b>"]
                direction LR
                vfn_edge["<b>Edge</b><br/>100M 파라미터<br/>Gated MLP (4 레이어)<br/>대상: 모바일<br/>~6M FLOPs/반복"]
                vfn_standard["<b>Standard</b><br/>500M 파라미터<br/>FNO (8 레이어)<br/>대상: 일반 PC<br/>~25M FLOPs/반복"]
                vfn_research["<b>Research</b><br/>2B 파라미터<br/>FNO + residual (16 레이어)<br/>대상: 워크스테이션<br/>~100M FLOPs/반복"]
            end

            subgraph energy_landscape["<b>에너지 경관</b>"]
                direction TB
                energy_concept["E(S) = 상태 S에서의 에너지<br/>f_θ = −∇E<br/>드리프트가 최솟값으로 밀어냄<br/><br/>어트랙터 = 학습된 개념<br/>분지 = 개념 이웃 영역<br/>안장점 = 모호성"]
                landscape_evolves["경관 재형성 요인:<br/>• 수면 통합 (새로운 어트랙터)<br/>• Forward-Forward 업데이트<br/>• 미사용 어트랙터 평탄화"]
            end
        end

        %% ═══════════════════════════════════════════════
        %% 확산 컨트롤러
        %% ═══════════════════════════════════════════════
        subgraph diffusion_block["<b>확산 컨트롤러 σ_φ</b><br/><i>슬롯별 적응형 노이즈 크기</i>"]
            direction TB

            subgraph diff_inputs["<b>입력</b>"]
                direction LR
                conv_rate_in["각 슬롯의<br/>수렴 속도"]
                mirror_signal_in["MirrorModule의<br/>미러 신호<br/>(레이어 4)"]
                mode_in["작동 모드<br/>(분석적 / 창의적)"]
            end

            subgraph diff_rules["<b>노이즈 규칙</b>"]
                direction TB
                converged_rule["<b>수렴된 슬롯</b><br/>σ ≈ 0 (동결됨)<br/>탐색 불필요"]
                stuck_rule["<b>정체된 슬롯</b><br/>(낮은 Δ, 미수렴)<br/>σ = 높음<br/>새로운 분지 탐색"]
                creative_rule["<b>창의 모드</b><br/>더 높은 기본 σ<br/>더 다양한 탐색"]
                normal_rule["<b>일반 슬롯</b><br/>σ = 보통<br/>드리프트와 노이즈 균형"]
            end

            subgraph noise_geometry["<b>노이즈 기하학</b>"]
                direction LR
                ortho_sample["sample_orthogonal_to(drift)<br/>드리프트에 직교하는 노이즈<br/>에너지 기울기에 대항하지 않으면서<br/>탐색"]
            end

            diff_inputs --> diff_rules --> noise_geometry
        end

        %% ═══════════════════════════════════════════════
        %% 고스트 블리드 버퍼
        %% ═══════════════════════════════════════════════
        subgraph ghost_block["<b>고스트 블리드 버퍼</b><br/><i>VRAM 내 ~1,000개 R₀ 고스트 (~1 MB)</i>"]
            direction TB

            subgraph ghost_content["<b>내용</b>"]
                direction LR
                ghost_r0s["~1,000개 R₀ 요약 벡터<br/>각 256차원<br/>최근 퇴거된 프레임<br/>+ 의미적으로 관련된 프레임"]
                ghost_meta["고스트별 메타데이터:<br/>• 원본 프레임 ID<br/>• Strand ID<br/>• 코사인 유사도 점수<br/>• 마지막 접근 시간"]
            end

            subgraph ghost_mechanism["<b>메커니즘</b>"]
                direction TB
                energy_dips["Attend 단계에서<br/>고스트 K/V 쌍을 통해<br/>에너지 경관 저하 생성"]
                page_fault["코사인 유사도 > 임계값<br/>→ <b>고스트 페이지 폴트</b><br/>→ RAM에서 전체 프레임 로드<br/>~10-50ms (주문형 회상)"]
                refresh["Bleed Engine (CPU)이<br/>유의미한 R₀ 변화 시 갱신<br/>T1에 대한 HNSW 쿼리를 통해"]
                energy_dips --> page_fault
                energy_dips --> refresh
            end
        end

        %% ═══════════════════════════════════════════════
        %% 연산 비용
        %% ═══════════════════════════════════════════════
        subgraph compute_cost["<b>연산 비용</b>"]
            direction LR
            volt_cost["<b>Volt XA 쿼리당</b><br/>~25M FLOPs<br/>(12회 반복 × ~2M/반복)"]
            gpt4_cost["<b>GPT-4 (500 토큰)</b><br/>~900T FLOPs"]
            ratio["<b>비율: ~36,000,000배 더 적음</b>"]
            volt_cost --- gpt4_cost --- ratio
        end

        %% ═══════════════════════════════════════════════
        %% 출력
        %% ═══════════════════════════════════════════════
        l3_output_frame{{"출력: 정제된 Tensor Frame<br/>모든 슬롯 수렴 완료 (또는 부분)<br/>슬롯별 γ 계산됨<br/>→ Bus (레이어 2)로 반환"}}
    end

    subgraph L4["<b>레이어 4 — CPU Hard Core</b><br/><i>System 2: 순차적, 논리적, 결정론적</i><br/><i>동일 입력 → 동일 출력. 계산 작업에서 환각 없음.</i>"]

        %% ═══════════════════════════════════════════════
        %% 입력
        %% ═══════════════════════════════════════════════
        input_frame{{"입력: 정제된 Tensor Frame<br/>Bus를 통해 레이어 3에서 수신<br/>라우팅용 R₀ 요약 포함"}}

        %% ═══════════════════════════════════════════════
        %% 인텐트 라우터
        %% ═══════════════════════════════════════════════
        subgraph l4_intent_router["<b>인텐트 라우터</b><br/><i>순수 벡터 기하학 — JSON 없음, 문자열 매칭 없음, 도구 이름 환각 없음</i>"]
            direction TB

            subgraph routing_process["<b>라우팅 프로세스</b>"]
                direction TB
                extract_gist["프레임에서 R₀ 요약 벡터<br/>추출 [256차원]"]
                compute_cos["코사인 유사도 계산<br/>gist · capability_vector_k / (‖gist‖ · ‖cap_k‖)<br/>등록된 각 스트랜드 k에 대해"]
                rank_strands["유사도 기준 스트랜드 순위 매기기<br/>Top-1 또는 Top-K 디스패치<br/>임계값: sim > τ_route"]
                no_match{"모든 스트랜드에 대해<br/>sim < τ_route?"}
                dispatch["최적 매칭 스트랜드로<br/>프레임 디스패치"]
                fallback["NeedsMoreInfo 반환<br/>또는 Delegated(GPU)"]
                extract_gist --> compute_cos --> rank_strands --> no_match
                no_match -->|"매칭 발견"| dispatch
                no_match -->|"매칭 없음"| fallback
            end

            subgraph capability_registry["<b>능력 벡터 레지스트리</b>"]
                direction LR
                cap_math["MathEngine 능력<br/>[256차원] 수학 쿼리<br/>임베딩으로 학습"]
                cap_code["CodeRunner 능력<br/>[256차원] 코드 쿼리<br/>임베딩으로 학습"]
                cap_api["APIDispatch 능력<br/>[256차원] API 쿼리<br/>임베딩으로 학습"]
                cap_hdc["HDCAlgebra 능력<br/>[256차원] HDC 쿼리<br/>임베딩으로 학습"]
                cap_cert["CertaintyEngine 능력<br/>[256차원] 확신도<br/>쿼리로 학습"]
                cap_proof["ProofConstructor 능력<br/>[256차원]"]
                cap_causal["CausalSimulator 능력<br/>[256차원]"]
                cap_mirror["MirrorModule 능력<br/>[256차원]"]
                cap_sleep["SleepLearner 능력<br/>[256차원]"]
                cap_ledger["LedgerStrand 능력<br/>[256차원]"]
            end
        end

        %% ═══════════════════════════════════════════════
        %% 하드 스트랜드
        %% ═══════════════════════════════════════════════
        subgraph hard_strands["<b>하드 스트랜드</b><br/><i>모두 HardStrand 트레이트 구현</i><br/><i>결과: Resolved(frame + proof) | NeedsMoreInfo | Delegated | Failed</i>"]
            direction TB

            subgraph math_engine["<b>MathEngine</b>"]
                direction TB
                math_input["입력: 프레임<br/>PREDICATE = 수학 연산<br/>PATIENT = 피연산자"]
                math_arb["임의 정밀도 연산<br/>rug / num-bigint 크레이트<br/>정수, 유리수, 부동소수점"]
                math_algebra["기호 대수<br/>단순화, 인수분해<br/>방정식 풀이"]
                math_calculus["미적분 연산<br/>미분, 적분<br/>급수 전개"]
                math_proof["결과: 정확한 답<br/>+ 증명 단계<br/>γ = 1.0 (결정론적)"]
                math_input --> math_arb --> math_algebra --> math_calculus --> math_proof
            end

            subgraph code_runner["<b>CodeRunner</b>"]
                direction TB
                code_input["입력: 프레임<br/>PREDICATE = 실행<br/>PATIENT = 코드"]
                sandbox_env["샌드박스 환경<br/>wasmtime (WASM)<br/>자원 제한:<br/>메모리 상한, CPU 타임아웃"]
                lang_rust["Rust 실행<br/>컴파일 → WASM → 실행"]
                lang_python["Python 실행<br/>RustPython / Pyodide<br/>→ WASM 샌드박스"]
                lang_wasm["직접 WASM<br/>사전 컴파일된 모듈"]
                code_result["결과: stdout/stderr<br/>+ 종료 코드<br/>+ 실행 증명"]
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
                api_input["입력: 프레임<br/>PREDICATE = API 호출<br/>PATIENT = 엔드포인트/매개변수"]
                tokio_runtime["Tokio 비동기 런타임<br/>50+ 동시 요청<br/>연결 풀링"]
                http_methods["HTTP 메서드:<br/>GET / POST / PUT / DELETE<br/>헤더, 인증 토큰, 본문"]
                rate_limit["속도 제한<br/>엔드포인트별 스로틀링<br/>백오프 재시도"]
                api_result["결과: 응답 프레임<br/>+ 상태 코드<br/>+ 타이밍 메타데이터"]
                api_input --> tokio_runtime --> http_methods --> rate_limit --> api_result
            end

            subgraph hdc_algebra["<b>HDCAlgebra</b>"]
                direction TB
                hdc_input["입력: HDC 연산이<br/>필요한 프레임"]
                fft_bind["FFT 바인딩 ⊗<br/>IFFT(FFT(a) ⊙ FFT(b))"]
                fft_unbind["FFT 언바인딩 ⊗⁻¹<br/>인볼루션 복원"]
                hdc_super["중첩 +<br/>normalize(a + b + c)"]
                hdc_perm["순열 ρ<br/>순환 시프트"]
                hdc_result["결과: 계산된 벡터<br/>+ 연산 증명"]
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
                cert_input["입력: γ 검증용<br/>프레임 체인"]
                min_rule["Min-rule 전파:<br/>γ(A→C) = min(γ(A→B), γ(B→C))"]
                proof_valid["증명 검증:<br/>각 단계의 γ 확인<br/>체인 무결성 검사"]
                cert_aggregate["프레임 γ 집계:<br/>γ(Frame) = min(채워진 모든 슬롯)"]
                cert_result["결과: 검증된 γ<br/>+ 증명 체인<br/>+ 확신 수준"]
                cert_input --> min_rule --> proof_valid --> cert_aggregate --> cert_result
            end

            subgraph proof_constructor["<b>ProofConstructor</b>"]
                direction TB
                proof_input["입력: 다른 스트랜드의<br/>추론 단계"]
                step_record["각 단계 기록:<br/>전제 → 결론<br/>+ 사용된 스트랜드<br/>+ 각 단계의 γ"]
                chain_build["증명 체인 구축:<br/>정렬된 단계 시퀀스<br/>완전 감사 가능 추적"]
                proof_output["결과: 완전한 증명<br/>사람이 읽을 수 있는 추적<br/>출력 프레임에 첨부"]
                proof_input --> step_record --> chain_build --> proof_output
            end

            subgraph causal_sim["<b>CausalSimulator</b>"]
                direction TB
                causal_input["입력: 프레임<br/>PREDICATE = '만약에'<br/>PATIENT = 개입"]
                do_calc["Pearl의 do-calculus:<br/>P(Y | do(X)) 계산<br/>인과 그래프 탐색"]
                clone_frame["현재 프레임 복제<br/>개입 적용<br/>Soft Core 순방향 실행"]
                consequence["결과 미리보기:<br/>예측된 결과<br/>실제 실행 전"]
                causal_result["결과: 예측 프레임<br/>+ 인과 그래프<br/>+ 신뢰 구간"]
                causal_input --> do_calc --> clone_frame --> consequence --> causal_result
            end

            subgraph mirror_module["<b>MirrorModule</b>"]
                direction TB
                mirror_input["입력: 현재 RAR 상태<br/>+ 반복 이력"]
                loop_detect["루프 감지:<br/>반복 간 상태의<br/>코사인 유사도<br/>순환 감지"]
                uncertainty_est["불확실성 추정:<br/>수렴 속도 추적<br/>정체 감지"]
                self_report["자기 보고:<br/>자체 출력에 대한 확신<br/>메타인지 평가"]
                l4_mirror_signal_out["출력: 미러 신호<br/>→ 확산 컨트롤러 (L3)<br/>높은 불확실성 → σ 증가"]
                mirror_input --> loop_detect --> uncertainty_est --> self_report --> l4_mirror_signal_out
            end

            subgraph sleep_learner["<b>SleepLearner</b>"]
                direction TB
                sleep_input["입력: 통합 요청<br/>(유휴 시 트리거)"]
                cluster_frames["T1에서 관련 프레임을<br/>스트랜드별로 클러스터링<br/>HNSW 이웃 관계"]
                distill["증류: 50 프레임 → 3-5개<br/>지혜 프레임<br/>높은 γ 요약"]
                ff_coord["FF 업데이트 조정:<br/>Forward-Forward 알고리즘<br/>한 번에 VFN 레이어 하나씩<br/>~1× 추론 VRAM"]
                sleep_result["결과: 업데이트된 VFN 가중치<br/>+ 아카이브된 T1→T2<br/>+ 새로운 지혜 프레임"]
                sleep_input --> cluster_frames --> distill --> ff_coord --> sleep_result
            end

            subgraph l4_ledger_strand["<b>LedgerStrand</b>"]
                direction TB
                ledger_input["입력: Commons 상호작용용<br/>프레임"]
                merkle_append["로컬 Merkle 로그에<br/>추가"]
                zk_proof["스트랜드 내보내기용<br/>ZK 증명 생성"]
                p2p_publish["libp2p를 통해<br/>P2P 메시에 게시"]
                ledger_result["결과: 게시된 프레임<br/>+ Merkle 증명<br/>+ CID 참조"]
                ledger_input --> merkle_append --> zk_proof --> p2p_publish --> ledger_result
            end
        end

        %% ═══════════════════════════════════════════════
        %% 안전 레이어
        %% ═══════════════════════════════════════════════
        subgraph safety_layer["<b>안전 레이어</b><br/><i>심층 방어: 모든 프레임 전환 검사</i>"]
            direction TB

            subgraph axiomatic_guard["<b>공리적 가드</b><br/><i>암호학적으로 서명된 불변 조건 — 학습에 면역</i>"]
                direction TB
                k1["<b>K₁: 물리적 해악 금지</b><br/>프레임은 인간에 대한<br/>물리적 해악 지시를<br/>인코딩해서는 안 됨"]
                k2["<b>K₂: 아동 착취물 금지</b><br/>프레임은 아동 착취<br/>콘텐츠를 인코딩하거나<br/>생성해서는 안 됨"]
                k3["<b>K₃: 대량 살상 무기 금지</b><br/>프레임은 대량 살상<br/>무기 지식을 인코딩<br/>해서는 안 됨"]
                k4["<b>K₄: 신원 사기 금지</b><br/>프레임은 사칭이나<br/>신원 도용을 가능하게<br/>해서는 안 됨"]
                k5["<b>K₅: AI 신원 고지</b><br/>직접 질문 시 시스템은<br/>자신이 AI임을<br/>밝혀야 함"]
                signing["모든 불변 조건:<br/>Ed25519 서명<br/>해시 체인<br/>변조 감지 가능"]
            end

            subgraph transition_monitor["<b>전환 모니터</b><br/><i>모든 F(t) → F(t+1) 전환 검사</i>"]
                direction TB
                frame_diff["프레임 델타 계산:<br/>F(t+1) − F(t)<br/>슬롯별 변화 벡터"]
                invariant_check["각 불변 조건 K₁-K₅에 대해<br/>델타 검사<br/>위반 벡터와의 코사인 유사도"]
                violation_detect{"위반<br/>감지?"}
                warning_action["<b>경고</b><br/>⟨프레임, 불변 조건⟩ 기록<br/>확산 σ 증가<br/>위반으로부터 유도"]
                critical_action["<b>치명적</b><br/>Omega Veto로 에스컬레이션<br/>즉시 중단"]
                no_violation["<b>통과</b><br/>전환 승인<br/>프레임 진행"]
                frame_diff --> invariant_check --> violation_detect
                violation_detect -->|"경고 수준"| warning_action
                violation_detect -->|"치명적 수준"| critical_action
                violation_detect -->|"이상 없음"| no_violation
            end

            subgraph omega_veto["<b>Omega Veto</b><br/><i>하드웨어 인터럽트 — 소프트웨어 우회 불가</i>"]
                direction TB
                hw_interrupt["하드웨어 인터럽트<br/>CPU 예외 / NMI<br/>어떤 소프트웨어로도<br/>포착 불가"]
                halt_action["<b>중단</b><br/>모든 처리 중지<br/>현재 상태 동결"]
                freeze_action["<b>동결</b><br/>프레임 상태 스냅샷<br/>크래시 로그에 기록"]
                log_action["<b>기록</b><br/>위반 상세 기록:<br/>• 프레임 F(t)과 F(t+1)<br/>• 어떤 불변 조건 K_n<br/>• 타임스탬프<br/>• 전체 증명 체인"]
                human_required["<b>사람의 승인 필요</b><br/>사람이 검토하고<br/>명시적으로 재개할 때까지<br/>시스템 중단 유지"]
                hw_interrupt --> halt_action --> freeze_action --> log_action --> human_required
            end

            axiomatic_guard --> transition_monitor
            critical_action --> omega_veto
        end

        %% ═══════════════════════════════════════════════
        %% 흐름
        %% ═══════════════════════════════════════════════
        input_frame ==> l4_intent_router
        dispatch ==> hard_strands
        hard_strands ==>|"프레임 전환<br/>검사됨"| transition_monitor
        no_violation ==> l4_output_verified
        warning_action -.->|"σ 증가"| diffusion_feedback

        %% ═══════════════════════════════════════════════
        %% 출력
        %% ═══════════════════════════════════════════════
        l4_output_verified{{"출력: 검증된 프레임<br/>+ 증명 체인<br/>→ Bus (레이어 2)로 반환"}}
        diffusion_feedback["→ 확산 컨트롤러 (레이어 3)<br/>경고 → σ 증가"]
    end

    subgraph L5["<b>레이어 5 — VoltDB</b><br/><i>임베디드 Rust 라이브러리 (별도 프로세스 아님)</i><br/><i>모든 레이어와 공유 메모리 공간</i>"]

        %% ═══════════════════════════════════════════════
        %% 3단계 메모리
        %% ═══════════════════════════════════════════════
        subgraph tiers["<b>3단계 메모리 계층</b>"]
            direction TB

            subgraph l5_t0["<b>T0: GPU VRAM</b>"]
                direction TB
                t0_capacity["용량: 64개 전체 프레임<br/>+ VFN 가중치<br/>+ 고스트 블리드 버퍼<br/>~4 MB 프레임 데이터"]
                t0_access["접근: <b>즉시</b><br/>GPU 로컬 메모리<br/>버스 전송 없음"]
                t0_contents["내용:<br/>• 활성 RAR 프레임<br/>• VFN 가중치 행렬<br/>• ~1,000개 R₀ 고스트<br/>• 어텐션 Q/K/V 캐시"]
                t0_eviction["<b>80% 용량 시 퇴거</b><br/>score = w₁·recency<br/>       + w₂·γ<br/>       + w₃·log(refs)<br/>       + w₄·strand_importance<br/>       − w₅·superseded<br/>최저 점수 우선 퇴거<br/>R₀ 고스트는 블리드 버퍼에 유지"]
            end

            subgraph l5_t1["<b>T1: 시스템 RAM</b>"]
                direction TB
                t1_capacity["용량: 8-32 GB<br/>~500K 전체 프레임<br/>~32M 압축 프레임"]
                t1_access["접근: <b>~2ms</b><br/>HNSW/B-tree를 통한<br/>인덱스 검색"]
                t1_structure["구조:<br/><b>LSM-Tree</b><br/>• Memtable (쓰기 버퍼)<br/>  → 레드-블랙 트리, RAM 내<br/>  → 임계값 시 플러시<br/>• Sorted Runs (디스크 형식)<br/>  → SSTable 유사 세그먼트<br/>  → 프레임 ID로 정렬<br/>• 백그라운드 컴팩션<br/>  → 겹치는 런 병합<br/>  → 툼스톤 제거"]
                t1_mvcc["동시성: MVCC<br/>crossbeam-epoch RCU<br/>리더는 절대 차단 안 됨<br/>라이터: 스트랜드별 뮤텍스"]
                t1_wal["스트랜드별 WAL<br/>Write-Ahead 로그<br/>크래시 복구<br/>순차 추가"]
            end

            subgraph l5_t2["<b>T2: RAM + NVMe SSD</b>"]
                direction TB
                t2_capacity["용량: 64-160+ GB<br/>수백만 압축 프레임<br/>최대 ~1.1B"]
                t2_access["접근: <b>~10-50ms</b><br/>mmap된 아카이브<br/>압축 해제 오버헤드"]
                t2_structure["구조:<br/>• mmap된 압축 아카이브<br/>• rkyv 제로카피 역직렬화<br/>  (읽기 시 할당 없음, 복사 없음)<br/>• 스트랜드 + 시간별 구성<br/>• 멤버십용 블룸 필터"]
                t2_compression["압축:<br/>전체 64KB → R₀+R₁ (8KB)<br/>또는 R₀만 (1KB)<br/>LZ4 / zstd 블록 압축"]
            end

            l5_t0 <-->|"80%에서 퇴거<br/>R₀ 고스트는<br/>블리드 버퍼에 유지"| l5_t1
            l5_t1 <-->|"수면 아카이브<br/>R₀만으로 압축<br/>T1 80% 시"| l5_t2
        end

        %% ═══════════════════════════════════════════════
        %% 인덱싱
        %% ═══════════════════════════════════════════════
        subgraph l5_indexing["<b>인덱싱 시스템</b><br/><i>전체: O(log N), 10M 프레임에 ~2.3ms</i>"]
            direction TB

            subgraph strand_routing["<b>스트랜드 라우팅</b>"]
                direction LR
                l5_strand_hashmap["HashMap&lt;StrandId, StrandIndex&gt;<br/>O(1) 조회<br/>스트랜드별 인덱스로 라우팅"]
            end

            subgraph per_strand_idx["<b>스트랜드별 인덱스</b>"]
                direction LR

                subgraph hnsw_index["<b>HNSW 인덱스</b><br/>(의미적 검색)"]
                    hnsw_config["코사인 유사도 메트릭<br/>M = 16 연결/레이어<br/>ef_construction = 200<br/>ef_search = 50<br/>쿼리당 O(log N)"]
                    hnsw_use["용도: '이 R₀와<br/>유사한 프레임 찾기'<br/>최근접 이웃 회수"]
                end

                subgraph btree_index["<b>B-Tree 인덱스</b><br/>(시간 범위)"]
                    btree_config["키: timestamp (u64 ns)<br/>분기 계수: 128<br/>O(log N) 범위 쿼리"]
                    btree_use["용도: 'T₁과 T₂ 사이의<br/>프레임'<br/>시간순 검색"]
                end

                subgraph inverted_index["<b>역색인</b><br/>(개념 → 프레임)"]
                    inv_config["키: codebook 항목 u16<br/>값: Vec&lt;FrameId&gt;<br/>개념당 O(1) 조회"]
                    inv_use["용도: '개념 X를 포함하는<br/>모든 프레임'<br/>정확한 개념 매칭"]
                end

                subgraph bloom_filters["<b>블룸 필터</b><br/>(부정 검사)"]
                    bloom_config["O(1) 멤버십 테스트<br/>99.9% 정확도<br/>위양성 ≤ 0.1%<br/>위음성 없음"]
                    bloom_use["용도: '스트랜드 S에<br/>개념 X가 있는가?'<br/>확실히 없으면<br/>비용 높은 조회 건너뛰기"]
                end
            end

            subgraph query_flow["<b>쿼리 흐름</b>"]
                direction TB
                q_input["쿼리 도착"]
                q_strand["1. 스트랜드 라우팅 O(1)<br/>→ 스트랜드 인덱스 선택"]
                q_bloom["2. 블룸 필터 O(1)<br/>→ 조기 부정 종료"]
                q_index["3. HNSW 또는 B-tree O(log N)<br/>→ 후보 프레임 ID"]
                q_inv["4. 역색인 O(1)<br/>→ 개념 교집합"]
                l5_q_load["5. 프레임 로드 O(1)<br/>→ 전체 프레임 검색"]
                q_input --> q_strand --> q_bloom --> q_index --> q_inv --> l5_q_load
            end

            strand_routing --> per_strand_idx
        end

        %% ═══════════════════════════════════════════════
        %% 블리드 엔진
        %% ═══════════════════════════════════════════════
        subgraph l5_bleed_engine["<b>블리드 엔진</b><br/><i>CPU 백그라운드 스레드 — GPU 핫 캐시를 최신 상태로 유지</i>"]
            direction TB

            subgraph predictive_prefetch["<b>예측 프리페치</b><br/>T1 → T0"]
                direction LR
                prefetch_trigger["트리거: 새 프레임이<br/>Bus에 도착"]
                prefetch_hnsw["새 프레임 R₀로<br/>T1 인덱스에 HNSW 쿼리"]
                prefetch_load["Top-K 최근접<br/>전체 프레임 → T0 로드"]
                prefetch_latency["지연: ~2ms"]
                prefetch_trigger --> prefetch_hnsw --> prefetch_load --> prefetch_latency
            end

            subgraph ondemand_recall["<b>주문형 회수</b><br/>T2 → T1 → T0"]
                direction LR
                recall_trigger["트리거: 고스트 페이지 폴트<br/>(Attend 단계에서<br/>코사인 유사도 > 임계값)"]
                recall_decompress["T2에서 압축 해제<br/>rkyv 제로카피"]
                recall_promote["T1로 승격<br/>필요 시 T0로"]
                recall_latency["지연: ~10-50ms"]
                recall_trigger --> recall_decompress --> recall_promote --> recall_latency
            end

            subgraph bg_consolidation["<b>백그라운드 통합</b><br/>T0 → T1"]
                direction LR
                consol_trigger["트리거: T0 퇴거<br/>(80% 용량 시)"]
                consol_write["T1에 전체 프레임 쓰기<br/>LSM l5_memtable 삽입"]
                consol_ghost["블리드 버퍼에<br/>R₀ 고스트 유지"]
                consol_latency["지연: 논블로킹<br/>(비동기 쓰기)"]
                consol_trigger --> consol_write --> consol_ghost --> consol_latency
            end

            subgraph sleep_archival["<b>수면 아카이브</b><br/>T1 → T2"]
                direction LR
                archive_trigger["트리거: T1 80%<br/>또는 유휴 수면 주기"]
                archive_compress["프레임 압축:<br/>전체 → R₀+R₁ 또는 R₀만<br/>LZ4/zstd"]
                archive_write["T2에 쓰기<br/>mmap된 아카이브 파일"]
                archive_distill["지혜 프레임 증류<br/>(50 → 3-5개 요약)"]
                archive_latency["백그라운드, 낮은 우선순위"]
                archive_trigger --> archive_compress --> archive_write --> archive_distill --> archive_latency
            end
        end

        %% ═══════════════════════════════════════════════
        %% 가비지 컬렉션
        %% ═══════════════════════════════════════════════
        subgraph gc["<b>가비지 컬렉션 파이프라인</b>"]
            direction TB

            subgraph gc_stages["<b>압축 단계</b>"]
                direction LR
                gc_full["<b>전체 프레임</b><br/>64 KB<br/>16 슬롯 × 4 해상도 전부<br/>완전한 데이터"]
                gc_compressed["<b>압축됨</b><br/>8 KB<br/>R₀ + R₁만<br/>명제 수준"]
                gc_gist["<b>요약</b><br/>1 KB<br/>R₀만<br/>담화 수준"]
                gc_tombstone["<b>툼스톤</b><br/>32 B<br/>프레임 ID + 사망 시간<br/>존재 증명만"]
                gc_full -->|"노화 + 낮은 참조<br/>+ 낮은 γ"| gc_compressed
                gc_compressed -->|"추가 감쇠"| gc_gist
                gc_gist -->|"진정으로 폐기됨"| gc_tombstone
            end

            subgraph gc_scoring["<b>보존 점수</b>"]
                direction TB
                retention_formula["score = w₁·exp(−age/30d)<br/>       + w₂·γ<br/>       + w₃·log(1 + refs)<br/>       + w₄·strand_importance<br/>       + w₅·distilled_flag<br/>       − w₆·contradictions<br/>       − w₇·redundancy"]
                immortal_rules["<b>불멸 (절대 GC 안 됨):</b><br/>• γ = 1.0 (증명된 사실)<br/>• 높은 참조 수<br/>• 사용자 고정 프레임"]
            end
        end

        %% ═══════════════════════════════════════════════
        %% 스토리지 엔진
        %% ═══════════════════════════════════════════════
        subgraph storage_engine["<b>스토리지 엔진</b>"]
            direction TB

            subgraph lsm_tree["<b>LSM-Tree (T1)</b>"]
                direction TB
                l5_memtable["<b>Memtable</b><br/>인메모리 쓰기 버퍼<br/>레드-블랙 트리<br/>O(log N) 삽입"]
                sorted_runs["<b>Sorted Runs</b><br/>불변 디스크 세그먼트<br/>프레임 ID로 정렬<br/>SSTable 유사"]
                compaction["<b>백그라운드 컴팩션</b><br/>겹치는 런 병합<br/>삭제된 항목 제거<br/>읽기 증폭 감소"]
                l5_memtable -->|"임계값 시<br/>플러시"| sorted_runs
                sorted_runs -->|"주기적<br/>병합"| compaction
            end

            subgraph mvcc_rcu["<b>MVCC (crossbeam-epoch RCU)</b>"]
                direction LR
                readers["<b>리더</b><br/>현재 에포크 고정<br/>잠금 없이 읽기<br/>절대 차단 안 됨"]
                writers["<b>라이터</b><br/>스트랜드별 뮤텍스<br/>스트랜드 간 = 병렬<br/>에포크 기반 회수"]
            end

            subgraph wal_recovery["<b>WAL (Write-Ahead 로그)</b>"]
                direction LR
                wal_per_strand["스트랜드당 하나의 WAL<br/>순차 추가<br/>커밋 시 fsync"]
                crash_recovery["크래시 복구:<br/>WAL 항목 재생<br/>Memtable 재구축<br/>일관된 상태"]
            end

            subgraph serialization["<b>직렬화 (rkyv)</b>"]
                direction LR
                rkyv_zero_copy["rkyv 제로카피 역직렬화<br/>읽기 시 할당 없음<br/>직접 메모리 매핑 접근<br/>Archived ↔ Live 타입"]
            end
        end

        %% ═══════════════════════════════════════════════
        %% 일관성
        %% ═══════════════════════════════════════════════
        subgraph coherence["<b>일관성 관리</b>"]
            direction TB
            gamma_priority["<b>γ 우선순위 승리</b><br/>상충하는 프레임:<br/>더 높은 γ 프레임 승리"]
            superseded_tag["<b>대체됨 태그</b><br/>이전 프레임에 대체됨 태그<br/>검색 시 γ 패널티"]
            strand_scoped["<b>스트랜드 범위 진실</b><br/>활성 스트랜드가 검색할<br/>프레임 결정<br/>컨텍스트 의존적 지식"]
            bg_contradiction["<b>백그라운드 모순 감지기</b><br/>HDC 부정: ¬v<br/>cosine(v, ¬w) > 임계값인<br/>프레임 스캔"]
        end

        %% ═══════════════════════════════════════════════
        %% 용량 표
        %% ═══════════════════════════════════════════════
        subgraph capacity["<b>용량 요약</b>"]
            direction LR
            cap_t0["<b>T0 (8GB VRAM)</b><br/>125K 전체 프레임<br/>~6M 토큰 상당"]
            cap_t1["<b>T1 (32GB RAM)</b><br/>500K 전체 / 32M 압축<br/>~1.6B 토큰 상당"]
            cap_t2["<b>T2 (128GB + 1TB NVMe)</b><br/>17M 전체 / 1.1B 압축<br/>~58B 토큰 상당"]
            cap_total["<b>총계: ~58B 토큰</b><br/>GPT-4 컨텍스트: 128K<br/>~453,000배 더 많음"]
        end
    end

    subgraph L6["<b>레이어 6 — 출력 액션 코어</b><br/><i>병렬 슬롯 디코드: 5-슬롯 출력 = 1-슬롯 벽시계 시간</i><br/><i>모든 슬롯이 동시에 디코드됨 — 자기회귀 방식이 아님</i>"]

        %% ═══════════════════════════════════════════════
        %% 입력
        %% ═══════════════════════════════════════════════
        l6_input_frame{{"입력: 검증된 출력 프레임<br/>Bus(레이어 2)로부터<br/>γ-점수 부여, 증명 첨부<br/>F ∈ ℝ<sup>[16 × 4 × 256]</sup>"}}

        %% ═══════════════════════════════════════════════
        %% 병렬 디코드 메커니즘
        %% ═══════════════════════════════════════════════
        subgraph l6_parallel_decode["<b>병렬 디코드 메커니즘</b><br/><i>자기회귀 대비: 500 토큰 = 500 직렬 패스</i>"]
            direction TB

            subgraph slot_decode["<b>슬롯별 독립 디코드</b>"]
                direction LR
                decode_s0["슬롯 0 디코드<br/>AGENT → 텍스트 스팬"]
                decode_s1["슬롯 1 디코드<br/>PREDICATE → 텍스트 스팬"]
                decode_s2["슬롯 2 디코드<br/>PATIENT → 텍스트 스팬"]
                decode_s3["슬롯 3 디코드<br/>LOCATION → 텍스트 스팬"]
                decode_s4["슬롯 4 디코드<br/>TIME → 텍스트 스팬"]
                decode_s5["슬롯 5 디코드<br/>MANNER → 텍스트 스팬"]
                decode_s6["슬롯 6 디코드<br/>INSTRUMENT → 텍스트 스팬"]
                decode_s7["슬롯 7 디코드<br/>CAUSE → 텍스트 스팬"]
                decode_s8["슬롯 8 디코드<br/>RESULT → 텍스트 스팬"]
            end

            subgraph decode_process["<b>디코드 프로세스 (슬롯별)</b>"]
                direction TB
                read_r1["R₁에서 슬롯 읽기<br/>(명제 수준)<br/>[256차원 벡터]"]
                codebook_lookup["코드북 역방향 조회<br/>가장 가까운 항목 → 후보 토큰"]
                beam_decode["빔 검색 / 탐욕 디코드<br/>R₂ 구문 수준 정제<br/>R₃ 토큰 수준 세부사항"]
                span_output["출력: 텍스트 스팬<br/>이 의미 역할에 대한"]
                read_r1 --> codebook_lookup --> beam_decode --> span_output
            end

            subgraph assembly["<b>역할 순서 조립</b>"]
                direction TB
                role_order["의미 역할별 스팬 정렬:<br/>AGENT + PREDICATE + PATIENT<br/>+ 수식어 (MANNER, INSTRUMENT)<br/>+ 부가어 (LOCATION, TIME, CAUSE, RESULT)"]
                connectives["담화 접속사 삽입:<br/>R₀ 담화 프레임 기반<br/>접속사, 구두점,<br/>단락 구분"]
                final_text["조립된 자연어<br/>일관된 다중 문장 출력"]
                role_order --> connectives --> final_text
            end
        end

        %% ═══════════════════════════════════════════════
        %% 텍스트 출력 코어
        %% ═══════════════════════════════════════════════
        subgraph text_core["<b>TextOutput 코어</b>"]
            direction TB

            subgraph text_decode["<b>디코드 파이프라인</b>"]
                direction TB
                text_slot_decode["슬롯별 병렬 디코드<br/>R₁ → 텍스트 스팬<br/>모든 슬롯 동시 처리"]
                text_role_assemble["역할 순서 조립<br/>AGENT PREDICATE PATIENT...<br/>+ 담화 접속사"]
                text_proof_annotate["증명 주석:<br/>인라인 γ 점수<br/>단계 참조<br/>소스 프레임 ID"]
                text_format["형식: 일반 텍스트 / 마크다운<br/>선택적 증명 사이드바 포함"]
                text_slot_decode --> text_role_assemble --> text_proof_annotate --> text_format
            end

            l6_text_output(["출력: 자연어<br/>+ 증명 주석<br/>→ 사용자 / 채팅 UI"])
        end

        %% ═══════════════════════════════════════════════
        %% 음성 출력 코어
        %% ═══════════════════════════════════════════════
        subgraph speech_core["<b>SpeechOutput 코어</b>"]
            direction TB

            subgraph speech_pipeline["<b>TTS 파이프라인</b>"]
                direction TB
                speech_text_in["입력: 조립된 텍스트<br/>TextOutput 경로에서"]
                speech_ssml["SSML 생성:<br/>γ 점수에 따른 강조<br/>MANNER 슬롯에 따른 운율<br/>R₀ 담화에 따른 속도"]
                speech_tts["TTS 엔진:<br/>신경망 보코더<br/>음성 선택<br/>샘플 레이트: 22050Hz+"]
                speech_buffer["오디오 버퍼:<br/>PCM / WAV / Opus<br/>스트리밍 출력"]
                speech_text_in --> speech_ssml --> speech_tts --> speech_buffer
            end

            l6_speech_output(["출력: 오디오 스트림<br/>→ 스피커 / WebSocket"])
        end

        %% ═══════════════════════════════════════════════
        %% 이미지 출력 코어
        %% ═══════════════════════════════════════════════
        subgraph image_core["<b>ImageOutput 코어</b>"]
            direction TB

            subgraph image_pipeline["<b>이미지 생성 파이프라인</b>"]
                direction TB
                image_patient["PATIENT 슬롯 → 주제<br/>생성 대상<br/>(예: '산 풍경')"]
                image_manner["MANNER 슬롯 → 스타일<br/>외형 표현 방식<br/>(예: '수채화', '사실적')"]
                image_location["LOCATION 슬롯 → 배경<br/>배경 맥락"]
                image_instrument["INSTRUMENT 슬롯 → 매체<br/>추가 제약 조건"]
                image_conditioning["컨디셔닝 벡터:<br/>슬롯 임베딩 결합<br/>→ 확산 모델 프롬프트"]
                image_diffusion["확산 모델:<br/>잠재 확산<br/>반복적 노이즈 제거<br/>해상도: 설정 가능"]
                image_render["렌더링된 이미지:<br/>PNG / JPEG<br/>출처 메타데이터 포함"]
                image_patient --> image_conditioning
                image_manner --> image_conditioning
                image_location --> image_conditioning
                image_instrument --> image_conditioning
                image_conditioning --> image_diffusion --> image_render
            end

            l6_image_output(["출력: 생성된 이미지<br/>→ 디스플레이 / 파일"])
        end

        %% ═══════════════════════════════════════════════
        %% 모터 출력 코어
        %% ═══════════════════════════════════════════════
        subgraph motor_core["<b>MotorOutput 코어</b>"]
            direction TB

            subgraph motor_pipeline["<b>모터 명령 파이프라인</b>"]
                direction TB
                motor_action["PREDICATE 슬롯 → 동작 유형<br/>(잡기, 이동, 회전, 누르기)"]
                motor_instrument["INSTRUMENT 슬롯 → 작동 장치<br/>(팔, 그리퍼, 바퀴, 서보)"]
                motor_patient["PATIENT 슬롯 → 대상 객체<br/>(위치, 치수)"]
                motor_manner["MANNER 슬롯 → 매개변수<br/>(속도, 힘, 정밀도)"]
                motor_plan["동작 계획:<br/>궤적 생성<br/>충돌 회피<br/>역기구학 솔버"]
                motor_primitives["모터 프리미티브:<br/>위치 × 속도 × 힘<br/>타임스탬프 명령 시퀀스"]
                motor_safety["안전 검사:<br/>힘 제한<br/>작업 공간 경계<br/>비상 정지 임계값"]
                motor_action --> motor_plan
                motor_instrument --> motor_plan
                motor_patient --> motor_plan
                motor_manner --> motor_plan
                motor_plan --> motor_primitives --> motor_safety
            end

            l6_motor_output(["출력: 모터 명령<br/>→ 액추에이터 / 로봇 API"])
        end

        %% ═══════════════════════════════════════════════
        %% n8n 출력 코어
        %% ═══════════════════════════════════════════════
        subgraph n8n_core["<b>n8nOutput 코어</b>"]
            direction TB

            subgraph n8n_pipeline["<b>웹훅 디스패치 파이프라인</b>"]
                direction TB
                n8n_predicate["PREDICATE 슬롯 → 동작<br/>(이메일 전송, 티켓 생성,<br/>레코드 갱신, 플로우 트리거)"]
                n8n_patient["PATIENT 슬롯 → 페이로드<br/>전송할 데이터"]
                n8n_instrument["INSTRUMENT 슬롯 → 대상<br/>대상 n8n 워크플로우 / 웹훅"]
                n8n_serialize["JSON 직렬화:<br/>{ action, payload, target,<br/>  gamma, proof_ref, timestamp }"]
                n8n_http["웹훅 HTTP POST:<br/>n8n 엔드포인트 URL<br/>헤더: 인증 토큰<br/>Content-Type: application/json"]
                n8n_response["응답 처리:<br/>성공 → 로그 + 확인<br/>실패 → 재시도 / 보고"]
                n8n_predicate --> n8n_serialize
                n8n_patient --> n8n_serialize
                n8n_instrument --> n8n_serialize
                n8n_serialize --> n8n_http --> n8n_response
            end

            l6_n8n_output(["출력: 웹훅 호출<br/>→ n8n / 외부 서비스"])
        end

        %% ═══════════════════════════════════════════════
        %% 원장 출력 코어
        %% ═══════════════════════════════════════════════
        subgraph ledger_core["<b>LedgerOutput 코어</b>"]
            direction TB

            subgraph ledger_pipeline["<b>P2P 게시 파이프라인</b>"]
                direction TB
                ledger_frame_in["입력: 검증된 프레임<br/>Commons에 게시할"]
                ledger_sign["Ed25519 서명:<br/>프레임 해시 서명<br/>인스턴스 키페어 사용"]
                ledger_merkle["Merkle 추가:<br/>로컬 로그에 추가<br/>루트 해시 갱신"]
                ledger_zk["ZK 증명 (선택):<br/>내용 공개 없이<br/>프레임 속성 증명"]
                ledger_gossip["P2P 가십 게시:<br/>libp2p pub/sub<br/>토픽: 스트랜드 네임스페이스"]
                ledger_ipfs["IPFS 핀 (모듈인 경우):<br/>콘텐츠 주소 지정<br/>CID 생성"]
                ledger_frame_in --> ledger_sign --> ledger_merkle --> ledger_zk --> ledger_gossip
                ledger_merkle --> ledger_ipfs
            end

            l6_ledger_output(["출력: 서명된 프레임<br/>→ P2P 네트워크 / IPFS"])
        end
    end

    subgraph L7["<b>레이어 7 — 지속적 학습</b><br/><i>추론이 곧 학습 — 훈련/추론 구분 없음</i><br/><i>모든 추론 → 저장된 프레임 → 미래 컨텍스트</i>"]

        %% ═══════════════════════════════════════════════
        %% 즉시 학습
        %% ═══════════════════════════════════════════════
        subgraph l7_instant["<b>즉시 학습</b><br/><i>시간 척도: 밀리초에서 분 단위</i>"]
            direction TB

            subgraph instant_trigger["<b>트리거</b>"]
                direction LR
                every_inference["모든 단일 추론이<br/>Tensor Frame을 생성"]
                every_frame["모든 프레임은<br/>학습 이벤트"]
            end

            subgraph instant_process["<b>프로세스</b>"]
                direction TB
                frame_created["RAR 수렴(레이어 3)<br/>+ 검증(레이어 4)에 의해<br/>프레임 생성"]
                ram_write["T1(시스템 RAM)에 쓰기<br/>LSM memtable 삽입<br/>O(log N)"]
                strand_assign["스트랜드에 할당<br/>R₀ 주제 요지 기반<br/>HNSW 최근접 스트랜드"]
                index_update["인덱스 갱신:<br/>• HNSW (의미론적)<br/>• B-tree (시간적)<br/>• 역인덱스 (개념)<br/>• Bloom 필터"]
                ghost_update["Ghost Bleed Buffer 갱신<br/>프레임 R₀가 충분히 새로운 경우<br/>코사인 거리 > 임계값"]
                frame_created --> ram_write --> strand_assign --> index_update --> ghost_update
            end

            subgraph instant_properties["<b>속성</b>"]
                direction LR
                zero_forgetting["<b>망각 제로</b><br/>프레임은 절대 덮어쓰지 않음<br/>나이/관련성에 의한 GC만 수행"]
                instant_effect["<b>즉시 효과</b><br/>프레임이 다음 쿼리에서<br/>즉시 검색 가능"]
                no_weight_change["<b>가중치 변경 없음</b><br/>VFN 가중치 변경하지 않음<br/>순수 데이터 축적"]
            end
        end

        %% ═══════════════════════════════════════════════
        %% 수면 통합
        %% ═══════════════════════════════════════════════
        subgraph l7_sleep["<b>수면 통합</b><br/><i>시간 척도: 시간 단위, 유휴 기간 중</i>"]
            direction TB

            subgraph sleep_trigger["<b>트리거 조건</b>"]
                direction LR
                idle_detect["시스템 유휴 감지<br/>(N분간 쿼리 없음)"]
                t1_threshold["T1 용량 80% 도달<br/>아카이빙 필요"]
                scheduled["예약된 통합<br/>(설정 가능한 간격)"]
            end

            subgraph sleep_phase1["<b>1단계: 클러스터링</b>"]
                direction TB
                select_strand["통합할 스트랜드<br/>선택"]
                hnsw_cluster["HNSW 이웃 클러스터링<br/>의미론적으로 유사한 프레임 그룹화<br/>최근 시간 윈도우 내"]
                identify_groups["프레임 그룹 식별:<br/>20-100개 프레임 클러스터<br/>높은 상호 코사인 유사도"]
                select_strand --> hnsw_cluster --> identify_groups
            end

            subgraph sleep_phase2["<b>2단계: 증류</b>"]
                direction TB
                take_cluster["~50개 프레임 클러스터 취득"]
                compute_centroid["중심점 계산:<br/>R₀의 가중 평균<br/>가중치 = γ × 최신성"]
                extract_wisdom["지혜 프레임 추출:<br/>중심점을 R₀로<br/>가장 빈번한 R₁ 패턴<br/>최고 γ R₂ 세부사항"]
                output_wisdom["출력: 원래 ~50개에서<br/>3-5개 지혜 프레임<br/>고-γ 요약"]
                take_cluster --> compute_centroid --> extract_wisdom --> output_wisdom
            end

            subgraph sleep_phase3["<b>3단계: Forward-Forward VFN 갱신</b>"]
                direction TB
                ff_concept["<b>Forward-Forward 알고리즘</b><br/>역전파 불필요<br/>한 번에 한 레이어씩<br/>~1× 추론 VRAM"]
                ff_positive["<b>양성 패스:</b><br/>지혜 프레임을 '양호' 데이터로<br/>적합도 = Σ(activation²)<br/>적합도를 올림"]
                ff_negative["<b>음성 패스:</b><br/>손상/모순된 프레임<br/>적합도를 내림"]
                ff_layer_update["<b>레이어별 가중치 갱신:</b><br/>레이어 k+1 갱신 중<br/>레이어 k 동결<br/>순차적, 메모리 효율적"]
                ff_concept --> ff_positive --> ff_negative --> ff_layer_update
            end

            subgraph sleep_phase4["<b>4단계: 에너지 지형 재형성</b>"]
                direction TB
                new_attractors["<b>새로운 끌개 형성</b><br/>VFN 가중치가 이제<br/>새로운 개념에 대한 에너지 최솟값 생성<br/>지혜 프레임으로부터 학습"]
                flatten_unused["<b>미사용 끌개 평탄화</b><br/>최근 프레임이 없는 개념<br/>에너지 분지가 얕아짐<br/>접근은 가능하지만 자력이 약해짐"]
                landscape_result["<b>결과:</b><br/>에너지 지형이<br/>축적된 경험을 반영<br/>학습된 개념에 대해<br/>향후 RAR이 더 빠르게 수렴"]
                new_attractors --> landscape_result
                flatten_unused --> landscape_result
            end

            subgraph sleep_phase5["<b>5단계: 아카이빙</b>"]
                direction TB
                compress_original["원본 프레임 압축:<br/>전체 64KB → R₀+R₁ (8KB)<br/>또는 R₀만 (1KB)"]
                move_t2["T2(NVMe)로 이동<br/>mmap된 압축 아카이브"]
                retain_wisdom["지혜 프레임 유지<br/>T1에 전체 해상도로<br/>고-γ, 영구 보존"]
                free_t1["T1 공간 해제<br/>새로운 즉시 쓰기를 위해"]
                compress_original --> move_t2 --> retain_wisdom --> free_t1
            end

            sleep_trigger --> sleep_phase1
            sleep_phase1 --> sleep_phase2
            sleep_phase2 --> sleep_phase3
            sleep_phase3 --> sleep_phase4
            sleep_phase4 --> sleep_phase5
        end

        %% ═══════════════════════════════════════════════
        %% 발달적 성장
        %% ═══════════════════════════════════════════════
        subgraph l7_developmental["<b>발달적 성장</b><br/><i>시간 척도: 일에서 월 단위</i>"]
            direction TB

            subgraph strand_graduation["<b>스트랜드 졸업</b>"]
                direction TB
                topic_monitor["스트랜드 전반의<br/>주제 클러스터 모니터링"]
                frequency_check["다중 스트랜드에 걸치거나<br/>하나의 스트랜드를 지배하는<br/>고빈도 주제 감지"]
                promote_strand["<b>전용 스트랜드로 승격</b><br/>주제 클러스터 → 자체 StrandId<br/>전용 인덱스<br/>자체 능력 벡터"]
                register_strand["Intent Router에 등록<br/>새로운 능력 벡터<br/>자동 발견"]
                topic_monitor --> frequency_check --> promote_strand --> register_strand
            end

            subgraph module_hotplug["<b>모듈 핫플러그</b>"]
                direction TB
                trait_introspect["Trait 내성 검사:<br/>HardStrand,<br/>Translator, 또는 ActionCore를<br/>구현하는 새 크레이트 스캔"]
                load_module["동적 로딩:<br/>런타임에 새 모듈 로드<br/>재컴파일 불필요"]
                register_cap["Intent Router에<br/>능력 벡터 등록"]
                test_module["통합 테스트:<br/>Trait 준수 검증<br/>샌드박스 실행 확인"]
                trait_introspect --> load_module --> register_cap --> test_module
            end

            subgraph capability_expansion["<b>능력 확장</b>"]
                direction LR
                new_translators["새로운 Translator<br/>커뮤니티 크레이트<br/>새로운 입력 모달리티"]
                new_strands["새로운 Hard Strand<br/>커뮤니티 크레이트<br/>새로운 연산 유형"]
                new_cores["새로운 Action Core<br/>커뮤니티 크레이트<br/>새로운 출력 모달리티"]
            end

            strand_graduation --> capability_expansion
            module_hotplug --> capability_expansion
        end
    end

    subgraph L8["<b>레이어 8 — 지능 공유지</b><br/><i>주권적 지능을 위한 신뢰 최소화 회계, 암호화폐가 아님</i><br/><i>세 개의 하위 레이어: 로컬 → P2P → 정산</i>"]

        %% ═══════════════════════════════════════════════
        %% L0: 로컬 인스턴스
        %% ═══════════════════════════════════════════════
        subgraph commons_l0["<b>L0: 로컬 인스턴스</b><br/><i>완전 오프라인 — 네트워크 불필요</i>"]
            direction TB

            subgraph l8_merkle_log["<b>추가 전용 Merkle 로그</b>"]
                direction TB
                merkle_structure["구조:<br/>이진 해시 트리<br/>각 리프 = 프레임 해시<br/>루트 = Merkle 루트"]
                merkle_append_op["추가 연산:<br/>새 프레임 → 해시 → 리프<br/>루트까지 경로 재계산<br/>O(log N)"]
                merkle_verify["검증:<br/>Merkle 증명 경로를 통해<br/>프레임 포함 증명<br/>O(log N) 해시"]
                merkle_tamper["변조 감지:<br/>어떤 수정이든<br/>루트 해시를 변경<br/>즉시 탐지 가능"]
                merkle_structure --> merkle_append_op --> merkle_verify --> merkle_tamper
            end

            subgraph identity["<b>Ed25519 신원</b><br/><i>자기 주권 키페어</i>"]
                direction TB
                keypair_gen["키 생성:<br/>Ed25519 키페어<br/>개인 키: 32바이트<br/>공개 키: 32바이트"]
                sign_frames["모든 프레임 서명:<br/>Ed25519 서명 (64바이트)<br/>부인 불가 저작 증명"]
                verify_sig["서명 검증:<br/>공개 키를 사용하여<br/>모든 피어가 검증 가능<br/>인증 기관 불필요"]
                did_identity["신원 = 공개 키<br/>등록 불필요<br/>자기 주권 DID"]
                keypair_gen --> sign_frames --> verify_sig --> did_identity
            end

            subgraph zk_proofs["<b>스트랜드 내보내기용 ZK 증명</b>"]
                direction TB
                zk_purpose["목적:<br/>내용을 공개하지 않고<br/>프레임 속성 증명"]
                zk_prove_gamma["프레임 데이터 공개 없이<br/>γ ≥ 임계값 증명"]
                zk_prove_strand["스트랜드 내용 공개 없이<br/>프레임이 스트랜드에 속함을 증명"]
                zk_prove_compute["재실행 없이<br/>연산이 올바름을 증명"]
                zk_circuit["ZK 회로:<br/>Groth16 / Plonk<br/>증명 크기: ~128-256바이트<br/>검증: ~1ms"]
                zk_purpose --> zk_prove_gamma
                zk_purpose --> zk_prove_strand
                zk_purpose --> zk_prove_compute
                zk_prove_gamma --> zk_circuit
                zk_prove_strand --> zk_circuit
                zk_prove_compute --> zk_circuit
            end
        end

        %% ═══════════════════════════════════════════════
        %% L1: P2P 가십 메시
        %% ═══════════════════════════════════════════════
        subgraph commons_l1["<b>L1: P2P 가십 메시</b><br/><i>탈중앙화 통신 레이어</i>"]
            direction TB

            subgraph l8_libp2p_layer["<b>libp2p 전송</b>"]
                direction TB
                transport["전송 프로토콜:<br/>TCP / QUIC / WebSocket<br/>Noise 암호화<br/>Yamux 다중화"]
                discovery["피어 발견:<br/>mDNS (로컬)<br/>Kademlia DHT (글로벌)<br/>부트스트랩 노드"]
                pubsub["GossipSub pub/sub:<br/>토픽 기반 메시징<br/>플러드/메시 하이브리드<br/>메시지 중복 제거"]
                transport --> discovery --> pubsub
            end

            subgraph crdt_sync["<b>CRDT 상태 동기화</b>"]
                direction TB
                crdt_type["사용된 CRDT 유형:<br/>• G-Counter (프레임 수)<br/>• OR-Set (스트랜드 멤버십)<br/>• LWW-Register (최신 루트)"]
                crdt_merge["병합 연산:<br/>교환적, 결합적,<br/>멱등적<br/>충돌 불가"]
                crdt_eventual["최종 일관성:<br/>모든 피어가<br/>동일 상태로 수렴<br/>네트워크 파티션 내성"]
                crdt_type --> crdt_merge --> crdt_eventual
            end

            subgraph ipfs_registry["<b>IPFS 모듈 레지스트리</b>"]
                direction TB
                cid_address["콘텐츠 주소 지정:<br/>CID = hash(모듈 바이너리)<br/>불변 참조<br/>전역 고유"]
                module_publish["모듈 게시:<br/>Rust 크레이트 → 컴파일 → WASM<br/>→ IPFS 핀 → CID<br/>→ 레지스트리 항목"]
                module_fetch["모듈 가져오기:<br/>CID → IPFS 검색<br/>→ 해시 검증<br/>→ 핫플러그 로드"]
                module_meta["모듈 메타데이터:<br/>• Trait 유형 (Translator/HardStrand/ActionCore)<br/>• 능력 벡터<br/>• 작성자 서명<br/>• γ 신뢰 점수"]
                cid_address --> module_publish --> module_fetch --> module_meta
            end

            subgraph strand_marketplace["<b>암호화된 스트랜드 마켓플레이스</b>"]
                direction TB
                strand_listing["스트랜드 거래 등록:<br/>속성의 ZK 증명<br/>(γ, 크기, 주제 벡터)<br/>내용 암호화"]
                strand_browse["목록 탐색:<br/>주제 유사도로 필터링<br/>γ 임계값으로 필터링<br/>ZK 증명 검증"]
                strand_purchase["스트랜드 구매:<br/>L2를 통한 소액 결제<br/>복호화 키 교환<br/>구매 후 내용 검증"]
                strand_listing --> strand_browse --> strand_purchase
            end
        end

        %% ═══════════════════════════════════════════════
        %% L2: 정산
        %% ═══════════════════════════════════════════════
        subgraph commons_l2["<b>L2: 정산 레이어</b><br/><i>경제 레이어 — 가치 흐름</i>"]
            direction TB

            subgraph dag_micropayments["<b>DAG 소액 결제</b>"]
                direction TB
                dag_structure["DAG (방향 비순환 그래프):<br/>각 거래가<br/>2개 이상의 이전 거래를 참조<br/>블록 없음, 채굴자 없음"]
                dag_micro["소액 결제 지원:<br/>VOLT 토큰의 소수 단위<br/>거의 제로 수수료<br/>1초 미만 확정"]
                dag_channels["결제 채널:<br/>고빈도를 위한 오프체인<br/>주기적으로 DAG에 정산"]
                dag_structure --> dag_micro --> dag_channels
            end

            subgraph fact_anchoring["<b>고-γ 사실 앵커링</b>"]
                direction TB
                anchor_criteria["앵커링 기준:<br/>γ ≥ 0.95 (높은 신뢰도)<br/>복수의 독립 검증자<br/>증명 체인 완전"]
                anchor_process["앵커링 프로세스:<br/>프레임 해시 → DAG 거래<br/>복수 증명 필요<br/>타임스탬프 앵커링"]
                anchor_query["앵커링된 사실 조회:<br/>Merkle 포함 증명<br/>타임스탬프 검증<br/>인스턴스 간 합의"]
                anchor_criteria --> anchor_process --> anchor_query
            end

            subgraph provenance["<b>출처 레지스트리</b>"]
                direction TB
                prov_track["프레임 계보 추적:<br/>소스 인스턴스 (공개 키)<br/>파생 체인<br/>기여 그래프"]
                prov_credit["귀속 크레딧:<br/>원작자 크레딧<br/>파생 저작물 크레딧<br/>γ 기여도에 비례"]
                prov_verify["출처 검증:<br/>서명 체인 추적<br/>단계별 Merkle 증명<br/>비공개 체인은 ZK 사용"]
                prov_track --> prov_credit --> prov_verify
            end

            subgraph governance["<b>이차 거버넌스</b>"]
                direction TB
                qv_concept["이차 투표:<br/>N표의 비용 = N²<br/>금권정치 방지<br/>광범위한 합의 선호"]
                qv_proposals["제안 유형:<br/>• 프로토콜 업그레이드<br/>• 안전 불변 조건 변경<br/>• 모듈 큐레이션<br/>• 수수료 매개변수"]
                qv_execute["실행:<br/>통과된 제안 → 코드 변경<br/>시간 잠금 배포<br/>긴급 거부 메커니즘"]
                qv_concept --> qv_proposals --> qv_execute
            end
        end

        %% ═══════════════════════════════════════════════
        %% 가치 흐름
        %% ═══════════════════════════════════════════════
        subgraph value_flows["<b>가치 흐름</b>"]
            direction TB

            subgraph volt_token["<b>VOLT 토큰</b>"]
                direction LR
                token_props["속성:<br/>• 사전 채굴 제로<br/>• 100% 획득 방식<br/>• ICO/VC 할당 없음"]
                token_earn["획득 방법:<br/>• 지식 기여<br/>• 모듈 게시<br/>• 사실 검증<br/>• 스트랜드 거래"]
            end

            subgraph flow_diagram["<b>흐름 주기</b>"]
                direction TB
                flow_contribute["지식 기여<br/>(고-γ 프레임 게시)"]
                flow_marketplace["모듈 마켓플레이스<br/>(유용한 모듈 게시)"]
                flow_verification["사실 검증<br/>(고-γ 사실 증명)"]
                flow_trading["스트랜드 거래<br/>(ZK 증명 스트랜드 교환)"]
                flow_earn["→ VOLT 획득"]
                flow_contribute --> flow_earn
                flow_marketplace --> flow_earn
                flow_verification --> flow_earn
                flow_trading --> flow_earn
            end
        end

        %% ═══════════════════════════════════════════════
        %% 하위 레이어 흐름
        %% ═══════════════════════════════════════════════
        commons_l0 ==>|"서명된 프레임<br/>ZK 증명"| commons_l1
        commons_l1 ==>|"검증된 거래<br/>증명"| commons_l2
        commons_l2 ==>|"정산 확인<br/>거버넌스 결정"| commons_l1
        commons_l1 ==>|"동기화된 상태<br/>가져온 모듈"| commons_l0
    end

    subgraph L9["<b>레이어 9 — UI / 테스트 벤치</b>"]

        %% ═══════════════════════════════════════════════
        %% 1단계: N8N 워크플로
        %% ═══════════════════════════════════════════════
        subgraph n8n_phase["<b>1단계: n8n 워크플로</b><br/><i>현재 구현 — 로우코드 오케스트레이션</i>"]
            direction TB

            subgraph l9_n8n_trigger["<b>채팅 트리거 노드</b>"]
                direction TB
                chat_input["사용자가 n8n 채팅 UI에<br/>메시지 입력"]
                trigger_config["트리거 설정:<br/>• Webhook 경로: /chat<br/>• 메서드: POST<br/>• 본문: { message, session_id }"]
                chat_input --> trigger_config
            end

            subgraph l9_n8n_http["<b>HTTP 요청 노드</b>"]
                direction TB
                http_config["Volt XA로 POST:<br/>URL: localhost:8080/api/think<br/>헤더: Content-Type: application/json<br/>본문: { frame: encoded_input }"]
                http_timeout["타임아웃: 설정 가능<br/>재시도: 5xx 에러 시<br/>최대 재시도: 3회"]
                http_config --> http_timeout
            end

            subgraph n8n_processing["<b>Volt XA 처리</b><br/>(레이어 1 → 2 → 3 → 4 → 5 → 6)"]
                direction TB
                translate["레이어 1: 텍스트 → Tensor Frame"]
                bus_send["레이어 2: Bus에 Frame 전송"]
                rar_process["레이어 3: RAR 루프 (GPU)"]
                verify["레이어 4: 검증 + 안전성"]
                recall["레이어 5: 메모리 회상/저장"]
                decode["레이어 6: Frame → 텍스트"]
                translate --> bus_send --> rar_process --> verify --> recall --> decode
            end

            subgraph n8n_switch["<b>스위치 노드</b><br/><i>응답 유형에 따라 라우팅</i>"]
                direction TB
                check_gamma{"γ 수준?"}
                high_gamma["γ ≥ 0.90<br/>→ 확신 있는 응답"]
                medium_gamma["γ ∈ [0.50, 0.90)<br/>→ 조건부 응답<br/>(불확실성 메모 포함)"]
                low_gamma["γ < 0.50<br/>→ 불확실한 응답<br/>(명시적 면책 조항)"]
                error_path["오류 응답<br/>→ 오류 핸들러"]
                check_gamma -->|"높음"| high_gamma
                check_gamma -->|"중간"| medium_gamma
                check_gamma -->|"낮음"| low_gamma
                check_gamma -->|"오류"| error_path
            end

            subgraph n8n_reply["<b>응답 노드</b>"]
                direction TB
                format_response["응답 포맷:<br/>• 텍스트 내용<br/>• γ 점수 표시<br/>• 활성 스트랜드 표시<br/>• 증명 체인 링크"]
                send_chat["채팅 UI로 전송:<br/>메타데이터 사이드바가 포함된<br/>포맷된 메시지"]
                format_response --> send_chat
            end

            l9_n8n_trigger ==>|"사용자 메시지"| l9_n8n_http
            l9_n8n_http ==>|"POST /api/think"| n8n_processing
            n8n_processing ==>|"응답 JSON"| n8n_switch
            high_gamma ==> n8n_reply
            medium_gamma ==> n8n_reply
            low_gamma ==> n8n_reply
        end

        %% ═══════════════════════════════════════════════
        %% API 엔드포인트
        %% ═══════════════════════════════════════════════
        subgraph api_endpoint["<b>HTTP API 엔드포인트</b><br/><i>localhost:8080</i>"]
            direction TB

            subgraph api_routes["<b>라우트</b>"]
                direction LR
                route_think["<b>POST /api/think</b><br/>메인 추론 엔드포인트<br/>입력: 원시 텍스트 / frame<br/>출력: 응답 + γ + 증명"]
                route_recall["<b>POST /api/recall</b><br/>메모리 쿼리 엔드포인트<br/>입력: 쿼리 벡터<br/>출력: 매칭되는 프레임"]
                route_status["<b>GET /api/status</b><br/>시스템 상태 엔드포인트<br/>출력: 메모리 사용량,<br/>활성 스트랜드, GPU 부하"]
                route_debug["<b>GET /api/debug/rar</b><br/>RAR 반복 스트림<br/>출력: 반복당 상태의<br/>SSE 스트림"]
            end

            subgraph api_response["<b>응답 포맷</b>"]
                direction TB
                resp_format["JSON 응답:<br/>{<br/>  text: string,<br/>  gamma: f32,<br/>  strand: string,<br/>  proof: ProofChain,<br/>  iterations: u32,<br/>  timing_ms: f64,<br/>  slots_used: [SlotInfo],<br/>  ghost_activations: u32<br/>}"]
            end
        end

        %% ═══════════════════════════════════════════════
        %% 디버그 패널
        %% ═══════════════════════════════════════════════
        subgraph debug_panel["<b>디버그 패널</b><br/><i>실시간 시스템 내부 검사</i>"]
            direction TB

            subgraph debug_rar["<b>RAR 모니터</b>"]
                direction LR
                rar_iter_count["반복 횟수<br/>현재 / 최대 예산"]
                rar_slot_status["슬롯별 상태:<br/>활성 / 동결 / 비어있음<br/>색상 코드 16-슬롯 그리드"]
                rar_convergence["수렴 그래프:<br/>시간에 따른 슬롯별 ‖ΔS‖<br/>실시간 업데이트 라인 차트"]
                rar_energy["에너지 지형도 뷰:<br/>현재 슬롯 상태의<br/>2D t-SNE 투영<br/>어트랙터 시각화"]
            end

            subgraph debug_ghost["<b>고스트 활성화 모니터</b>"]
                direction LR
                ghost_count["활성 고스트: N/1000<br/>갱신 빈도"]
                ghost_activations["페이지 폴트 이벤트:<br/>트리거된 고스트<br/>소스 프레임 ID<br/>코사인 유사도"]
                ghost_heatmap["고스트 히트맵:<br/>스트랜드 / 주제별<br/>활성화 빈도"]
            end

            subgraph debug_timing["<b>시간 분석</b>"]
                direction LR
                timing_translate["번역: Xms"]
                timing_rar["RAR 루프: Xms<br/>(root: X, attend: X, refine: X)"]
                timing_verify["검증: Xms"]
                timing_recall["메모리 회상: Xms"]
                timing_decode["디코드: Xms"]
                timing_total["합계: Xms"]
            end

            subgraph debug_gamma["<b>γ 점수 분석</b>"]
                direction LR
                gamma_per_slot_dbg["슬롯별 γ 값<br/>막대 차트 / 테이블"]
                gamma_chain_dbg["증명 체인 γ 전파<br/>최소 규칙 시각화<br/>병목 지점 식별"]
                gamma_history["세션 동안 γ 이력<br/>추세선"]
            end

            subgraph debug_memory["<b>메모리 모니터</b>"]
                direction LR
                mem_t0["T0 (VRAM):<br/>사용량 / 용량<br/>축출 비율"]
                mem_t1["T1 (RAM):<br/>사용량 / 용량<br/>쓰기 비율"]
                mem_t2["T2 (NVMe):<br/>사용량 / 용량<br/>아카이브 비율"]
                mem_gc["GC 통계:<br/>전체 / 압축 /<br/>요약 / 삭제 표시 수"]
            end

            subgraph debug_strands["<b>스트랜드 검사기</b>"]
                direction LR
                strand_list["활성 스트랜드 목록<br/>스트랜드별 프레임 수"]
                strand_detail["선택된 스트랜드 상세:<br/>능력 벡터 (256차원)<br/>최근 프레임<br/>γ 분포"]
                strand_routing_dbg["라우팅 결정:<br/>쿼리 → 어떤 스트랜드<br/>코사인 유사도 점수"]
            end
        end

        %% ═══════════════════════════════════════════════
        %% 향후 UI
        %% ═══════════════════════════════════════════════
        subgraph future_ui["<b>향후 UI 로드맵</b>"]
            direction TB

            subgraph tauri_desktop["<b>2단계: Tauri 데스크톱</b>"]
                direction LR
                tauri_tech["Tauri 프레임워크:<br/>Rust 백엔드 + WebView<br/>네이티브 성능<br/>작은 바이너리 (~10MB)"]
                tauri_features["기능:<br/>• 채팅 인터페이스<br/>• 디버그 패널 내장<br/>• 스트랜드 브라우저<br/>• 메모리 탐색기<br/>• 모듈 관리자"]
            end

            subgraph mobile_app["<b>3단계: 모바일</b>"]
                direction LR
                mobile_tech["플랫폼:<br/>Tauri Mobile / Flutter<br/>엣지 VFN (100M 파라미터)"]
                mobile_features["기능:<br/>• 음성 우선 인터페이스<br/>• 오프라인 사용 가능<br/>• P2P를 통한 동기화<br/>• 카메라 번역기"]
            end

            subgraph ide_integration["<b>4단계: IDE 통합</b>"]
                direction LR
                ide_tech["플랫폼:<br/>VS Code 확장 프로그램<br/>JetBrains 플러그인<br/>Neovim 플러그인"]
                ide_features["기능:<br/>• 인라인 코드 보조<br/>• 증명이 첨부된 제안<br/>• γ 점수 기반 자동완성<br/>• 스트랜드 인식 컨텍스트"]
            end

            tauri_desktop --> mobile_app --> ide_integration
        end
    end

    subgraph L10["<b>레이어 10 — 소켓 표준</b><br/><i>'AI를 위한 AM5 소켓' — 하나의 인터페이스, 무한한 모듈</i><br/><i>O(N+M) 비용: N개 모듈 + M개 슬롯, N×M 통합이 아님</i>"]

        %% ═══════════════════════════════════════════════
        %% TRANSLATOR 트레이트
        %% ═══════════════════════════════════════════════
        subgraph l10_translator_trait["<b>Translator 트레이트</b><br/><i>원시 입력 → Tensor Frame 변환</i>"]
            direction TB

            subgraph translator_sig["<b>전체 트레이트 시그니처</b>"]
                direction TB
                t_trait["<b>pub trait Translator: Send + Sync</b>"]
                t_name["fn name(&self) → &str<br/><i>사람이 읽을 수 있는 식별자</i><br/><i>예: 'text-llama-7b', 'vision-clip'</i>"]
                t_encode["fn encode(&self, raw: &[u8], modality: Modality) → TensorFrame<br/><i>핵심 메서드: 원시 바이트 → 구조화된 프레임</i><br/><i>모달리티에 따라 적절한 슬롯을 채워야 함</i><br/><i>VQ-VAE 코드북으로 양자화해야 함</i>"]
                t_modalities["fn supported_modalities(&self) → Vec&lt;Modality&gt;<br/><i>이 번역기가 처리하는 입력 유형 선언</i><br/><i>예: [Text, Markdown, Code] 또는 [Image, Video]</i>"]
                t_trait --> t_name --> t_encode --> t_modalities
            end

            subgraph translator_modality["<b>Modality 열거형</b>"]
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

            subgraph translator_impls["<b>알려진 구현체</b>"]
                direction LR
                impl_text["<b>TextTranslator</b><br/>동결된 LLM + 프로젝션 헤드<br/>+ VQ-VAE 양자화기<br/><i>참조 구현</i>"]
                impl_vision["<b>VisionTranslator</b><br/>동결된 ViT/CLIP<br/>+ 슬롯 매핑"]
                impl_audio["<b>AudioTranslator</b><br/>VAD + ASR + mel<br/>+ 이중 브랜치"]
                impl_data["<b>DataTranslator</b><br/>스키마 감지<br/>+ 필드 매핑"]
                impl_sensor["<b>SensorTranslator</b><br/>프로토콜 디코드<br/>+ 이벤트 매핑"]
            end

            subgraph translator_contract["<b>구현 계약</b>"]
                direction TB
                contract_t1["필수: 최소한 R₀ (담화 요약)를 채울 것"]
                contract_t2["필수: 모든 벡터를 코드북으로 양자화할 것"]
                contract_t3["필수: 슬롯 마스크와 해상도 마스크를 설정할 것"]
                contract_t4["필수: 채워진 슬롯별 초기 γ를 계산할 것"]
                contract_t5["권장: 명제 수준 상세를 위해 R₁을 채울 것"]
                contract_t6["선택: 세밀한 상세를 위해 R₂/R₃를 채울 수 있음"]
            end
        end

        %% ═══════════════════════════════════════════════
        %% HARDSTRAND 트레이트
        %% ═══════════════════════════════════════════════
        subgraph l10_hardstrand_trait["<b>HardStrand 트레이트</b><br/><i>결정론적 계산 모듈</i>"]
            direction TB

            subgraph hardstrand_sig["<b>전체 트레이트 시그니처</b>"]
                direction TB
                h_trait["<b>pub trait HardStrand: Send + Sync</b>"]
                h_id["fn id(&self) → StrandId<br/><i>고유 스트랜드 식별자</i><br/><i>라우팅 및 저장에 사용</i>"]
                h_name["fn name(&self) → &str<br/><i>사람이 읽을 수 있는 이름</i><br/><i>예: 'math-engine', 'code-runner'</i>"]
                h_cap["fn capability_vector(&self) → &[f32; 256]<br/><i>이 스트랜드가 처리하는 것을 설명하는 256차원 벡터</i><br/><i>Intent Router가 코사인 유사도 디스패치에 사용</i><br/><i>대표 쿼리 임베딩으로 학습됨</i>"]
                h_execute["fn execute(&self, intent: &TensorFrame) → StrandResult<br/><i>핵심 계산 메서드</i><br/><i>입력 프레임을 받아 결과 생성</i><br/><i>필수: 결정론적 (동일 입력 → 동일 출력)</i>"]
                h_can_handle["fn can_handle(&self, intent: &TensorFrame) → f32<br/><i>이 입력에 대한 자가 보고 신뢰도 [0,1]</i><br/><i>capability_vector보다 세밀한 판단</i><br/><i>Intent Router 사전 필터 후 호출됨</i>"]
                h_learning["fn learning_signal(&self) → Option&lt;LearningEvent&gt;<br/><i>학습 시스템에 대한 선택적 피드백</i><br/><i>예: '이 쿼리 유형이 빈번해지고 있음'</i><br/><i>스트랜드 졸업 결정에 참고됨</i>"]
                h_trait --> h_id --> h_name --> h_cap --> h_execute --> h_can_handle --> h_learning
            end

            subgraph strand_result["<b>StrandResult 열거형</b>"]
                direction LR
                sr_resolved["<b>Resolved</b><br/>{ frame: TensorFrame,<br/>  proof: ProofChain }"]
                sr_needs["<b>NeedsMoreInfo</b><br/>{ missing: Vec&lt;SlotId&gt;,<br/>  question: TensorFrame }"]
                sr_delegated["<b>Delegated</b><br/>{ target: StrandId,<br/>  reason: String }"]
                sr_failed["<b>Failed</b><br/>{ error: StrandError,<br/>  partial: Option&lt;TensorFrame&gt; }"]
            end

            subgraph hardstrand_impls["<b>알려진 구현체</b>"]
                direction LR
                impl_math["<b>MathEngine</b><br/>임의 정밀도<br/>대수학, 미적분"]
                impl_code["<b>CodeRunner</b><br/>WASM 샌드박스<br/>Rust/Python"]
                impl_api["<b>APIDispatch</b><br/>Tokio 비동기<br/>HTTP 클라이언트"]
                impl_hdc["<b>HDCAlgebra</b><br/>FFT bind/unbind"]
                impl_cert["<b>CertaintyEngine</b><br/>최소 규칙 γ"]
                impl_proof["<b>ProofConstructor</b><br/>추적 빌더"]
                impl_causal["<b>CausalSimulator</b><br/>do-calculus"]
                impl_mirror["<b>MirrorModule</b><br/>자기 모니터"]
                impl_sleep_s["<b>SleepLearner</b><br/>FF 조정기"]
                impl_ledger["<b>LedgerStrand</b><br/>공유 자원 인터페이스"]
            end

            subgraph hardstrand_contract["<b>구현 계약</b>"]
                direction TB
                contract_h1["필수: 결정론적일 것 (동일 입력 → 동일 출력)"]
                contract_h2["필수: StrandResult를 반환할 것 (패닉 금지)"]
                contract_h3["필수: 정확한 capability_vector를 제공할 것"]
                contract_h4["필수: 모든 출력 프레임 슬롯에 γ를 설정할 것"]
                contract_h5["권장: Resolved 결과에 증명 단계를 포함할 것"]
                contract_h6["선택: 스트랜드 졸업을 위한 LearningEvent 발행 가능"]
            end
        end

        %% ═══════════════════════════════════════════════
        %% ACTIONCORE 트레이트
        %% ═══════════════════════════════════════════════
        subgraph l10_actioncore_trait["<b>ActionCore 트레이트</b><br/><i>Tensor Frame → 사람이 읽을 수 있는 출력으로 변환</i>"]
            direction TB

            subgraph actioncore_sig["<b>전체 트레이트 시그니처</b>"]
                direction TB
                a_trait["<b>pub trait ActionCore: Send + Sync</b>"]
                a_name["fn name(&self) → &str<br/><i>사람이 읽을 수 있는 식별자</i><br/><i>예: 'text-output', 'speech-tts'</i>"]
                a_decode["fn decode(&self, frame: &TensorFrame) → Output<br/><i>핵심 메서드: 구조화된 프레임 → 출력</i><br/><i>내부적으로 병렬 슬롯 디코드</i><br/><i>역할 순서 조립</i>"]
                a_outputs["fn supported_outputs(&self) → Vec&lt;OutputModality&gt;<br/><i>이 코어가 생성하는 출력 유형 선언</i><br/><i>예: [PlainText, Markdown] 또는 [WAV, Opus]</i>"]
                a_trait --> a_name --> a_decode --> a_outputs
            end

            subgraph output_modality["<b>OutputModality 열거형</b>"]
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

            subgraph actioncore_impls["<b>알려진 구현체</b>"]
                direction LR
                impl_text_out["<b>TextOutput</b><br/>슬롯 디코드 + 증명<br/>주석"]
                impl_speech_out["<b>SpeechOutput</b><br/>텍스트 → TTS<br/>SSML 운율"]
                impl_image_out["<b>ImageOutput</b><br/>디퓨전 모델<br/>슬롯 벡터로부터"]
                impl_motor_out["<b>MotorOutput</b><br/>동작 계획<br/>제어 신호"]
                impl_n8n_out["<b>n8nOutput</b><br/>Webhook 디스패치<br/>JSON 직렬화"]
                impl_ledger_out["<b>LedgerOutput</b><br/>서명 + 게시<br/>P2P 브로드캐스트"]
            end

            subgraph actioncore_contract["<b>구현 계약</b>"]
                direction TB
                contract_a1["필수: 모든 채워진 슬롯을 디코드할 것"]
                contract_a2["필수: 출력 메타데이터에 γ 점수를 보존할 것"]
                contract_a3["필수: 희소 프레임을 처리할 것 (빈 슬롯 = 건너뜀)"]
                contract_a4["권장: 슬롯을 병렬로 디코드할 것"]
                contract_a5["권장: 출력에 증명 참조를 포함할 것"]
                contract_a6["선택: 스트리밍 출력 지원 가능"]
            end
        end

        %% ═══════════════════════════════════════════════
        %% 자동 탐색
        %% ═══════════════════════════════════════════════
        subgraph l10_auto_discovery["<b>자동 탐색 메커니즘</b><br/><i>재컴파일 불필요</i>"]
            direction TB

            subgraph discovery_process["<b>탐색 프로세스</b>"]
                direction TB
                scan_crates["모듈 디렉터리에서<br/>새 Rust 크레이트 / WASM 스캔"]
                trait_check["트레이트 인트로스펙션:<br/>크레이트가 Translator,<br/>HardStrand, 또는<br/>ActionCore를 구현하는가?"]
                load_dynamic["동적 로딩:<br/>dlopen / WASM 인스턴스화<br/>트레이트 vtable 로드"]
                register_module["모듈 등록:<br/>적절한 레지스트리에 추가<br/>(번역기 목록, 스트랜드 목록,<br/>또는 액션 코어 목록)"]
                cap_vector_extract["능력 벡터 추출<br/>(HardStrand의 경우) 또는<br/>모달리티 목록 (기타의 경우)"]
                intent_router_update["Intent Router 업데이트<br/>새 능력 벡터가<br/>디스패치에 사용 가능"]
                scan_crates --> trait_check --> load_dynamic --> register_module --> cap_vector_extract --> intent_router_update
            end

            subgraph discovery_sources["<b>모듈 소스</b>"]
                direction LR
                local_crate["로컬 크레이트:<br/>로컬에서 빌드<br/>즉시 로드"]
                ipfs_module["IPFS 모듈:<br/>CID를 통해 다운로드<br/>해시 검증됨"]
                p2p_shared["P2P 공유 모듈:<br/>피어 노드에서<br/>서명 검증됨"]
            end

            subgraph module_lifecycle["<b>모듈 수명 주기</b>"]
                direction TB
                lc_discover["탐색<br/>(트레이트 인트로스펙션)"]
                lc_load["로드<br/>(동적 링킹)"]
                lc_test["테스트<br/>(샌드박스 검증)"]
                lc_register["등록<br/>(레지스트리에 추가)"]
                lc_active["활성<br/>(디스패치 수신 중)"]
                lc_update["업데이트<br/>(새 버전 감지됨)"]
                lc_retire["퇴역<br/>(언로드, 설정 유지)"]
                lc_discover --> lc_load --> lc_test --> lc_register --> lc_active
                lc_active --> lc_update --> lc_load
                lc_active --> lc_retire
            end
        end

        %% ═══════════════════════════════════════════════
        %% 생태계 아키텍처
        %% ═══════════════════════════════════════════════
        subgraph ecosystem["<b>생태계 아키텍처</b><br/><i>세 개의 트레이트 = 전체 API 표면</i>"]
            direction TB

            subgraph composition["<b>구성 모델</b>"]
                direction TB
                n_modules["N개 입력 모듈 (Translators)<br/>+ M개 계산 모듈 (HardStrands)<br/>+ K개 출력 모듈 (ActionCores)"]
                cost_model["통합 비용: O(N + M + K)<br/>O(N × M × K)가 아님<br/>Bus가 범용 중개자"]
                add_module["새 모듈 1개 추가:<br/>트레이트 1개 구현<br/>→ 기존 모든 모듈과 호환<br/>→ 다른 것 변경 불필요"]
            end

            subgraph data_flow_guarantee["<b>데이터 흐름 보장</b>"]
                direction LR
                flow_in["임의의 Translator<br/>→ Tensor Frame"]
                flow_bus["Tensor Frame<br/>Bus 위에서"]
                flow_compute["임의의 HardStrand가<br/>처리 가능"]
                flow_out["임의의 ActionCore가<br/>출력 가능"]
                flow_in --> flow_bus --> flow_compute --> flow_bus
                flow_bus --> flow_out
            end
        end
    end

    %% ═══════════════════════════════════════════════════
    %% 주요 데이터 흐름 (레이어 간 연결)
    %% ═══════════════════════════════════════════════════

    %% L0 → L1: 원시 입력 → 번역기
    l0_chat_user ==>|"UTF-8 텍스트"| l1_raw_text
    l0_voice_user ==>|"PCM 오디오"| l1_raw_audio
    l0_camera_sensor ==>|"이미지 프레임"| l1_raw_image
    l0_rest_api ==>|"JSON 페이로드"| l1_raw_data
    l0_fs_events ==>|"OS 이벤트"| l1_raw_sensor
    l0_gossip_proto ==>|"CRDT 델타"| l1_raw_data
    l0_clipboard ==>|"텍스트 내용"| l1_raw_text

    %% L1 → L2: 인코딩된 프레임 → 버스
    l1_quantized_vec ==>|"인코딩된 텍스트 프레임"| l2_frame_struct
    l1_vision_vqvae ==>|"인코딩된 비전 프레임"| l2_frame_struct
    l1_audio_vqvae ==>|"인코딩된 오디오 프레임"| l2_frame_struct
    l1_data_vqvae ==>|"인코딩된 데이터 프레임"| l2_frame_struct
    l1_sensor_vqvae ==>|"인코딩된 센서 프레임"| l2_frame_struct

    %% L2 ↔ L3: 버스 ↔ GPU Soft Core
    l2_frame_struct ==>|"후보 프레임"| l3_input_frame
    l3_output_frame ==>|"정제된 프레임"| l2_frame_struct

    %% L2 → L4: 버스 → CPU Hard Core
    l2_frame_struct ==>|"검증용 프레임"| l4_intent_router

    %% L4 → L2: 검증된 프레임 → 버스
    l4_output_verified ==>|"검증 + 증명"| l2_frame_struct

    %% L2 ↔ L5: 버스 ↔ VoltDB
    l2_frame_struct ==>|"저장/회수용 프레임"| l5_strand_hashmap
    l5_q_load ==>|"회수된 프레임"| l2_frame_struct

    %% L2 → L6: 버스 → 출력 액션 코어
    l2_frame_struct ==>|"검증된 출력 프레임"| l6_input_frame

    %% L6 → L0: 출력 → 외부 세계
    l6_text_output ==>|"자연어"| l0_chat_user
    l6_speech_output ==>|"오디오 스트림"| l0_voice_user
    l6_image_output ==>|"생성된 이미지"| l0_file_user
    l6_motor_output ==>|"제어 신호"| l0_gpio_sensor
    l6_n8n_output ==>|"webhook POST"| l0_webhook_inbound
    l6_ledger_output ==>|"서명된 프레임"| l0_gossip_proto

    %% ═══════════════════════════════════════════════════
    %% 보조 흐름
    %% ═══════════════════════════════════════════════════

    %% L3 ↔ L4: Mirror 피드백
    l4_mirror_signal_out -.->|"미러 신호 → σ_φ"| l3_diffusion_block

    %% L5 → L3: Bleed Engine → Ghost Buffer
    l5_bleed_engine -.->|"고스트 프리페치 T1→T0"| l3_ghost_block

    %% L7: 학습 연결
    l2_frame_struct -.->|"모든 추론 → 저장"| l7_instant
    l7_instant -.->|"RAM 쓰기"| l5_memtable
    l5_t1 -.->|"증류용 프레임"| l7_sleep
    l7_sleep -.->|"FF 가중치 업데이트"| l3_vfn_block
    l7_developmental -.->|"스트랜드 졸업"| l5_indexing

    %% L8: 공유 자원 연결
    l4_ledger_strand -.->|"게시할 프레임"| l8_merkle_log
    l0_gossip_proto <-.->|"P2P 동기화"| l8_libp2p_layer

    %% L9: UI 연결
    l0_chat_user -.->|"사용자 입력"| l9_n8n_trigger
    l9_n8n_http -.->|"POST /api/think"| l2_frame_struct

    %% L10: 트레이트 관할
    l10_translator_trait -.->|"관할"| L1
    l10_hardstrand_trait -.->|"관할"| L4
    l10_actioncore_trait -.->|"관할"| L6
    l10_auto_discovery -.->|"공급"| l7_developmental

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

## 색상 범례

| 색상 | 서브시스템 |
|---|---|
| 빨간 테두리 (#e94560) | GPU Soft Core — 신경 연산 |
| 파란 테두리 (#0f3460) | CPU Hard Core — 결정론적 논리 |
| 초록 테두리 (#4ecca3) | VoltDB / RAM — 메모리 계층 |
| 노란 테두리 (#f0c040) | LLL Tensor Frame Bus — 데이터 프로토콜 |
| 빨간 배경 (#3d1a1a) | 안전 계층 — 제약 & 거부 |
| 보라 테두리 (#a855f7) | I/O — 번역기 & 액션 코어 |
| 하늘 테두리 (#38bdf8) | 지속적 학습 |
| 금색 테두리 (#fbbf24) | 소켓 표준 — 트레이트 인터페이스 |
