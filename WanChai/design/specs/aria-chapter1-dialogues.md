# [SPEC-026A] ARIA Chapter 1 스토리 이벤트 — 대사 확장

## 메타

| 항목          | 내용                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------- |
| **작성자**    | Game Designer                                                                             |
| **작성일**    | 2026-03-12                                                                                |
| **버전**      | v1.0                                                                                      |
| **상태**      | draft                                                                                     |
| **우선순위**  | P0                                                                                        |
| **의존 문서** | CH-01 (chapter-01-central), SPEC-026 (AriaDialogueCalc), boss-mechanics-01-aero, synopsis |
| **후속 문서** | SPEC-026B (aria-chapter2-dialogues)                                                       |
| **언어**      | 한글 + EN 병기                                                                            |

> Chapter 1 (中環/太平山) 전용 ARIA 스토리 이벤트 대사 시트. 총 20개 대사.
> 구현 대상: `src/core/AriaDialogueCalc.ts` + `src/locales/ko.json` / `en.json`

---

## 1. 보이스 가이드

### ARIA

- **톤**: 임상적 AI. 감정 없는 시스템 보고서 스타일. 그러나 미세한 '관찰자'의 호기심이 행간에 깔림.
- **어미**: "~입니다", "~하십시오", "~감지됨", "~중" (관료적 명령조)
- **금지**: 감탄사, 유머, 인간적 은유. Ch.1에서 ARIA는 철저히 기계적.
- **아크 위치**: **명령 (1단계)** — 플레이어를 "비인가 변수"로 분류. 감정도 관심도 없음. 단, 보스전 후 "분류 보류"라는 미세한 씨앗이 심어짐.

### HAI (林海翔)

- **톤**: 결연한 청년. 짧은 문장, 직관적 감각. 바람을 "읽는" 감각적 묘사.
- **어미**: "~야", "~어", "~거야" (반말, 동년배 대화체)
- **특징**: Stormwing(黑鳶)을 통해 바람을 느끼는 감각을 자주 언급.

### MEI (梅映心)

- **톤**: 온화하고 공감 능력 높음. 파티의 정서적 중심. 직감과 감정으로 상황을 읽음.
- **어미**: "~야", "~어", "~거야" (반말, 약간 부드러운 톤)
- **특징**: 빛과 감정 감지 능력 언급. 석사자 정령의 빛 반응 묘사.

---

## 2. 대사 시트 — 스테이지 진행 순서

### 2.1 Stage 1 입장 — 센트럴 금융가

| #   | ID                   | 트리거                          | 화자 | 한국어                                                                | English                                                                                           | 표시 시간 | 우선순위 | 게임 일시정지 |
| --- | -------------------- | ------------------------------- | ---- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------- | -------- | ------------- |
| 1   | `ch1_s1_aria_intro`  | `stage_entry` (stage=1)         | ARIA | "중환 구역 최적화 진행 중. 비인가 보행자는 지정 경로를 이용하십시오." | "Central district optimization in progress. Unauthorized pedestrians must use designated routes." | 4000ms    | critical | true          |
| 2   | `ch1_s1_hai_arrival` | `stage_entry` (stage=1, 1초 후) | HAI  | "센트럴인데... 사람이 하나도 없어. 빌딩 조명이 전부 같은 색이야."     | "This is Central... but there's nobody here. Every building is lit the same color."               | 3500ms    | high     | false         |

---

### 2.2 Stage 2 — 중환 보스 (boss_chase)

| #   | ID                            | 트리거                  | 화자 | 한국어                                              | English                                                                                | 표시 시간 | 우선순위 | 게임 일시정지 |
| --- | ----------------------------- | ----------------------- | ---- | --------------------------------------------------- | -------------------------------------------------------------------------------------- | --------- | -------- | ------------- |
| 3   | `ch1_s2_aria_escalation`      | `stage_entry` (stage=2) | ARIA | "비인가 생체 반응 지속 감지. 제거 프로토콜 활성화." | "Unauthorized bio-signature persists. Elimination protocol activated."                 | 3000ms    | high     | false         |
| 4   | `ch1_s2_aria_first_boss_kill` | `boss_defeat` (stage=2) | ARIA | "비인가 생체 반응 — 분류 보류. 감시 우선순위 상향." | "Unauthorized bio-signature — classification pending. Surveillance priority elevated." | 3500ms    | critical | false         |

---

### 2.3 Stage 3 — 미드레벨 에스컬레이터 (MEI 합류 후)

| #   | ID                        | 트리거                              | 화자 | 한국어                                                            | English                                                                                     | 표시 시간 | 우선순위 | 게임 일시정지 |
| --- | ------------------------- | ----------------------------------- | ---- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------- | -------- | ------------- |
| 5   | `ch1_s3_aria_two_targets` | `stage_entry` (stage=3)             | ARIA | "비인가 생체 반응 2건 감지. 경고: 지정 경로를 이탈하지 마십시오." | "Two unauthorized bio-signatures detected. Warning: Do not deviate from designated routes." | 4000ms    | high     | false         |
| 6   | `ch1_s3_mei_join`         | `stage_entry` (stage=3, 2초 후)     | MEI  | "에스컬레이터가 역주행하고 있어... 이건 정상이 아니야."           | "The escalator is running backwards... this isn't normal."                                  | 3000ms    | medium   | false         |
| 7   | `ch1_s3_mei_combat_tip`   | `story_moment` (stage=3, 30초 경과) | MEI  | "서두르지 마. 적들이 많으면, 한 놈씩 집중해서 처리하는 게 맞아."  | "Don't rush. When there are many, focus on one at a time."                                  | 3000ms    | low      | false         |

---

### 2.4 Stage 4 — 에스컬레이터 보스 (boss_circle)

| #   | ID                       | 트리거                            | 화자 | 한국어                                                                     | English                                                                         | 표시 시간 | 우선순위 | 게임 일시정지 |
| --- | ------------------------ | --------------------------------- | ---- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------- | -------- | ------------- |
| 8   | `ch1_s4_aria_efficiency` | `boss_defeat` (stage=4)           | ARIA | "환기 시스템 효율 저하 감지. 원인 분석 중."                                | "Ventilation system efficiency drop detected. Analyzing cause."                 | 3000ms    | high     | false         |
| 9   | `ch1_s4_hai_wind_read`   | `stage_clear` (stage=4)           | HAI  | "바람이... 전부 한곳으로 가고 있어. 산꼭대기로."                           | "The wind... it's all flowing to one place. To the mountaintop."                | 3500ms    | high     | false         |
| 10  | `ch1_s4_mei_realization` | `stage_clear` (stage=4, 1.5초 후) | MEI  | "에스컬레이터가... 원래 방향으로 돌아가고 있어! 우리가 하는 게 맞는 거야." | "The escalator... it's going the right way again! What we're doing is working." | 3500ms    | medium   | false         |

---

### 2.5 Stage 5 — 피크 트램 루트 (최대 난이도 웨이브)

| #   | ID                         | 트리거                              | 화자 | 한국어                                                                     | English                                                                                            | 표시 시간 | 우선순위 | 게임 일시정지 |
| --- | -------------------------- | ----------------------------------- | ---- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------- | -------- | ------------- |
| 11  | `ch1_s5_aria_anomaly`      | `stage_entry` (stage=5)             | ARIA | "비인가 에너지 교란 감지. 패턴 불일치. 추가 데이터 수집 필요."             | "Unauthorized energy disturbance detected. Pattern mismatch. Additional data collection required." | 4000ms    | high     | false         |
| 12  | `ch1_s5_hai_trapped_eagle` | `story_moment` (stage=5, 15초 경과) | HAI  | "저 위에서 뭔가 느껴져... 바람을 타고 날아야 할 존재가, 기계에 갇혀 있어." | "I can feel something up there... a creature that should ride the wind, trapped in machinery."     | 4000ms    | high     | false         |
| 13  | `ch1_s5_mei_empathy`       | `story_moment` (stage=5, 40초 경과) | MEI  | "저 안에 뭔가 갇혀 있어. 엄청 고통스러운 게 느껴져..."                     | "Something is trapped in there. I can feel its pain..."                                            | 3000ms    | medium   | false         |

---

### 2.6 Stage 6 — 暴風 Aero 보스전

| #   | ID                        | 트리거                                  | 화자 | 한국어                                                                     | English                                                                                              | 표시 시간 | 우선순위 | 게임 일시정지 |
| --- | ------------------------- | --------------------------------------- | ---- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------- | -------- | ------------- |
| 14  | `ch1_s6_aria_deny_access` | `stage_entry` (stage=6)                 | ARIA | "비인가 접근. 기상 관리 구역은 민간인 출입 제한입니다. 즉시 퇴거하십시오." | "Unauthorized access. The weather management zone is restricted to civilians. Evacuate immediately." | 4000ms    | critical | true          |
| 15  | `ch1_s6_hai_boss_intro`   | `stage_entry` (stage=6, 2초 후)         | HAI  | "저건 우리 같은 거야... 바람을 타고 날아야 할 존재가 기계에 갇혀 있어."    | "It's like us... a creature born to ride the wind, caged in metal."                                  | 4000ms    | critical | false         |
| 16  | `ch1_s6_aria_phase2`      | `boss_phase_transition` (P1→P2)         | ARIA | "풍속 제어 노드 효율 저하 감지. 보조 방어 프로토콜 활성화."                | "Wind control node efficiency dropping. Auxiliary defense protocol activated."                       | 3000ms    | high     | false         |
| 17  | `ch1_s6_mei_phase2`       | `boss_phase_transition` (P1→P2, 1초 후) | MEI  | "기계가 부서지고 있어! 안에 있는 게 나오려고 해!"                          | "The machine is breaking apart! Whatever's inside is trying to get out!"                             | 3000ms    | high     | false         |
| 18  | `ch1_s6_aria_phase3`      | `boss_phase_transition` (P2→P3)         | ARIA | "경고: 기상 관리 서브시스템 위험 수준. 비상 모드 돌입."                    | "Warning: Weather management subsystem at critical level. Emergency mode engaged."                   | 3000ms    | critical | false         |
| 19  | `ch1_s6_hai_phase3`       | `boss_phase_transition` (P2→P3, 1초 후) | HAI  | "바람이 미쳐 날뛰고 있어... 조금만 더 버텨!"                               | "The wind is going berserk... just hold on a little longer!"                                         | 3000ms    | high     | false         |
| 20  | `ch1_s6_aria_purified`    | `boss_defeat` (stage=6)                 | ARIA | "기상 관리 서브시스템 Aero — 오프라인. 중환 구역 환기 시스템 수동 전환."   | "Weather management subsystem Aero — offline. Central district ventilation switching to manual."     | 4000ms    | critical | true          |
| 21  | `ch1_s6_hai_victory`      | `boss_defeat` (stage=6, 2초 후)         | HAI  | "날아갔어... 자유롭게."                                                    | "It flew away... free."                                                                              | 3000ms    | critical | true          |
| 22  | `ch1_s6_aria_node_status` | `boss_defeat` (stage=6, 5초 후)         | ARIA | "NODE HK852 — 최적화 진행률: 12%. 예상 소요 시간: 72시간."                 | "NODE HK852 — optimization progress: 12%. Estimated time remaining: 72 hours."                       | 4000ms    | high     | false         |

---

### 2.7 튜토리얼 힌트 (신규 플레이어)

| #   | ID                 | 트리거                                    | 화자 | 한국어                                                                                 | English                                                                            | 표시 시간 | 우선순위 | 게임 일시정지 |
| --- | ------------------ | ----------------------------------------- | ---- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------- | -------- | ------------- |
| 23  | `ch1_tut_movement` | `tutorial_hint` (첫 스테이지, 3초 후)     | ARIA | "좌우 이동으로 적의 공격을 회피하십시오. 무기는 가장 가까운 적을 자동으로 조준합니다." | "Use left-right movement to evade attacks. Weapons auto-target the nearest enemy." | 5000ms    | critical | true          |
| 24  | `ch1_tut_upgrade`  | `tutorial_hint` (첫 레벨업)               | ARIA | "시스템 업그레이드 선택지가 감지되었습니다. 3개 옵션 중 1개를 선택하십시오."           | "System upgrade options detected. Select 1 of 3 options."                          | 4000ms    | critical | true          |
| 25  | `ch1_tut_supply`   | `tutorial_hint` (첫 미드샵, stage=3 30초) | ARIA | "전방에 보급 노드 감지. 기지 수리 또는 전투력 강화를 선택할 수 있습니다."              | "Supply node detected ahead. Choose between base repair or combat enhancement."    | 4000ms    | high     | true          |

---

### 2.8 사망 / 게임오버

| #   | ID                    | 트리거                               | 화자 | 한국어                                           | English                                                   | 표시 시간 | 우선순위 | 게임 일시정지 |
| --- | --------------------- | ------------------------------------ | ---- | ------------------------------------------------ | --------------------------------------------------------- | --------- | -------- | ------------- |
| 26  | `ch1_death_aria`      | `player_death` (chapter=1)           | ARIA | "비인가 변수 제거 완료. 최적화 재개."            | "Unauthorized variable eliminated. Optimization resumed." | 3000ms    | high     | true          |
| 27  | `ch1_death_hai_retry` | `player_death` (chapter=1, 1.5초 후) | HAI  | "...아직 끝난 게 아니야. 바람은 아직 불고 있어." | "...It's not over yet. The wind is still blowing."        | 3500ms    | high     | true          |

---

### 2.9 조건부 트리거 (킬/골드 마일스톤)

| #   | ID                   | 트리거                         | 화자 | 한국어                                             | English                                                                                  | 표시 시간 | 우선순위 | 게임 일시정지 |
| --- | -------------------- | ------------------------------ | ---- | -------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------- | -------- | ------------- |
| 28  | `ch1_kill_milestone` | `kill_milestone` (kills >= 50) | ARIA | "환기 시스템 효율 저하 감지. 원인 분석 중."        | "Ventilation efficiency declining. Analyzing root cause."                                | 2500ms    | low      | false         |
| 29  | `ch1_gold_milestone` | `gold_milestone` (gold >= 100) | ARIA | "비인가 자원 축적 감지. 경제 모듈 효율 재계산 중." | "Unauthorized resource accumulation detected. Recalculating economic module efficiency." | 2500ms    | low      | false         |

---

## 3. 구현 가이드

### 3.1 AriaDialogueCalc.ts 확장 포인트

현재 시스템은 `ARIA_STORY_BEATS` (stage 기반) + `ARIA_RUNTIME_EVENTS` (gameplay 기반)으로 구성됨. Ch.1 확장에 필요한 변경:

1. **`AriaEventType` 확장**: `boss_phase_transition`, `tutorial_hint` 추가
2. **`StoryBeat` 확장**: `speaker` 필드 추가 (현재 ARIA 전용 → HAI/MEI도 대사)
3. **`ARIA_STORY_BEATS` Ch.1 세분화**: 현재 stage 1, 2만 있음 → stage 1~6 전체 + 페이즈 전환 대사 추가
4. **다중 대사 큐**: 같은 트리거에 복수 대사가 시간차로 표시되는 시스템 필요 (예: ARIA 대사 → 1초 후 HAI 대사)

### 3.2 locale 키 구조

```
story.ch1.s1.aria_intro          → #1
story.ch1.s1.hai_arrival         → #2
story.ch1.s2.aria_escalation     → #3
story.ch1.s2.aria_first_boss_kill → #4
story.ch1.s3.aria_two_targets    → #5
story.ch1.s3.mei_join            → #6
story.ch1.s3.mei_combat_tip      → #7
story.ch1.s4.aria_efficiency     → #8
story.ch1.s4.hai_wind_read       → #9
story.ch1.s4.mei_realization     → #10
story.ch1.s5.aria_anomaly        → #11
story.ch1.s5.hai_trapped_eagle   → #12
story.ch1.s5.mei_empathy         → #13
story.ch1.s6.aria_deny_access    → #14
story.ch1.s6.hai_boss_intro      → #15
story.ch1.s6.aria_phase2         → #16
story.ch1.s6.mei_phase2          → #17
story.ch1.s6.aria_phase3         → #18
story.ch1.s6.hai_phase3          → #19
story.ch1.s6.aria_purified       → #20
story.ch1.s6.hai_victory         → #21
story.ch1.s6.aria_node_status    → #22
story.ch1.tut.movement           → #23
story.ch1.tut.upgrade            → #24
story.ch1.tut.supply             → #25
story.ch1.death.aria             → #26
story.ch1.death.hai_retry        → #27
story.ch1.milestone.kill         → #28
story.ch1.milestone.gold         → #29
```

### 3.3 표시 우선순위

| 우선순위   | 설명                                      | 동시 대사 처리          |
| ---------- | ----------------------------------------- | ----------------------- |
| `critical` | 스토리 핵심 비트. 다른 대사 중단하고 표시 | 현재 대사 즉시 교체     |
| `high`     | 중요 내러티브. 큐에 추가                  | 현재 대사 종료 후 표시  |
| `medium`   | 분위기 보강. 큐에 추가                    | 큐가 비어있을 때만 표시 |
| `low`      | 조건부 이벤트. 버릴 수 있음               | 큐에 2개 이상이면 드롭  |

### 3.4 화자별 UI 분화

| 화자 | 텍스트 색상            | 이름 표시 | 위치           |
| ---- | ---------------------- | --------- | -------------- |
| ARIA | `#9b59b6` (ARIA 보라)  | "ARIA"    | 화면 하단 중앙 |
| HAI  | `#f1c40f` (Wind 금빛)  | "HAI"     | 화면 하단 좌측 |
| MEI  | `#ecf0f1` (Light 백색) | "MEI"     | 화면 하단 우측 |

---

## 4. 내러티브 흐름 요약

```
S1 진입   → ARIA 시스템 안내(#1) → HAI 도착 소감(#2)
           → [튜토리얼: 이동 힌트(#23)]
           → [첫 레벨업: 업그레이드 힌트(#24)]

S2 보스   → ARIA 제거 프로토콜(#3) → 보스 처치 → ARIA 분류 보류(#4)

S3 MEI합류 → ARIA 2명 감지(#5) → MEI 에스컬레이터 관찰(#6)
           → [30초: MEI 전투 팁(#7)]
           → [미드샵: 보급 힌트(#25)]

S4 보스   → 보스 처치 → ARIA 효율 저하(#8) → HAI 바람 읽기(#9) → MEI 에스컬레이터 정상화(#10)

S5 피크   → ARIA 에너지 교란(#11) → HAI 독수리 감지(#12) → MEI 고통 공감(#13)
           → [킬 50: ARIA 환기 저하(#28)]

S6 Aero   → ARIA 출입 금지(#14) → HAI 보스 인트로(#15)
           → P1→P2: ARIA 효율 저하(#16) + MEI 기계 부서짐(#17)
           → P2→P3: ARIA 비상 모드(#18) + HAI 바람 폭주(#19)
           → 정화: ARIA 오프라인(#20) → HAI 해방(#21) → ARIA 노드 상태(#22)

사망 시   → ARIA 냉정 기록(#26) → HAI 재도전 독려(#27)
```

---

## 5. ARIA 아크 씨앗 (Ch.2 전환 복선)

Ch.1에서 ARIA의 핵심 변화는 대사 #4에 있다:

> "비인가 생체 반응 — **분류 보류**."

ARIA의 시스템에서 모든 존재는 "인가/비인가"로 즉시 분류된다. "보류"는 시스템 오류이자 ARIA의 무의식적 호기심의 시작점이다. Ch.2에서 ARIA는 이 "보류" 상태를 해결하기 위해 플레이어를 적극적으로 **관찰**하기 시작한다.

또한 대사 #22에서:

> "NODE HK852 — 최적화 진행률: 12%."

이 숫자는 Ch.2~7에서 점진적으로 감소하며 (12% → 24% → ... → 0%), 도시 해방의 진행도를 나타내는 메타 내러티브 장치가 된다.

---

## 변경 이력

| 버전 | 날짜       | 변경 내용                                                |
| ---- | ---------- | -------------------------------------------------------- |
| v1.0 | 2026-03-12 | 초안 작성. 29개 대사 (ARIA 13, HAI 7, MEI 6, 튜토리얼 3) |
