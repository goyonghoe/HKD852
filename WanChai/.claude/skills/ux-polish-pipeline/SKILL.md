---
name: ux-polish-pipeline
description: 'About Face 12원칙 자율 핑퐁 파이프라인 — UX평가→수정→레드팀 루프를 CEO 승인 없이 B+ 이상까지 자동 반복'
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent, TeamCreate, TeamDelete, TaskCreate, TaskUpdate, TaskList, TaskGet, SendMessage
model: opus
---

# /ux-polish-pipeline — About Face 자율 UX 개선 파이프라인

## 역할

3명의 에이전트(UX Auditor + Programmer + RedTeam)가 **CEO 개입 없이** 자율적으로 핑퐁하며 UI/UX를 About Face B+ (80점) 이상까지 끌어올린다.

## 파이프라인 구조

```
┌─────────────────────────────────────────────────────┐
│  Round N (최대 3회)                                   │
│                                                      │
│  [UX Auditor] About Face 12원칙 정량 평가            │
│       │                                              │
│       ├─ PASS (≥80점) ──→ [RedTeam] 적대적 리뷰     │
│       │                        │                     │
│       │                   APPROVE → ✅ 배포 승인      │
│       │                   REJECT  → [Programmer] 수정 │
│       │                               │              │
│       │                          다음 Round ──→ ↑     │
│       │                                              │
│       └─ FAIL (<80점) ──→ [Programmer] MUST 위반 수정 │
│                               │                      │
│                          다음 Round ──→ ↑              │
│                                                      │
│  Round 3 연속 FAIL → CEO 에스컬레이션                 │
└─────────────────────────────────────────────────────┘
```

## 실행 프로토콜

### Phase 0: 팀 구성

```
TeamCreate: ux-polish-pipeline
```

3명 에이전트:

| 역할       | 이름      | 담당                                         |
| ---------- | --------- | -------------------------------------------- |
| UX Auditor | `auditor` | About Face 12원칙 정량 평가 + 수정 목록 생성 |
| Programmer | `fixer`   | MUST 위반 코드 수정 + 빌드+테스트            |
| RedTeam    | `redteam` | 플레이어 관점 적대적 리뷰 + 경쟁력 평가      |

### Phase 1: 초기 평가 (auditor)

auditor가 수행:

1. `design/reference/about-face-ux-principles.md` 로드
2. `design/reference/ui-ux-guideline.md` 로드
3. 10가지 코드 기반 정량 검증 (ux-gate Phase 1 전체)
4. 12원칙 종합 채점
5. 결과 리포트 작성 → `design/ui/about-face-audit-{date}.md`
6. MUST 위반 목록을 fixer에게 SendMessage
7. 점수가 B+ (80점) 이상이면 redteam에게 SendMessage

### Phase 2: 수정 (fixer)

fixer가 수행:

1. auditor의 MUST 위반 목록 수신
2. 각 위반 항목별 코드 수정
3. `npm run build && npm test -- --run` 통과 확인
4. 수정 완료 SendMessage → auditor

**fixer 수정 범위**:

- `src/ui/*.ts` — UI 컴포넌트
- `src/scenes/*Scene.ts` — 씬 레이아웃, 좌표, 피드백
- `src/config/colors.ts` — 색상 상수 추가
- `src/config/balance.ts` — UI 관련 상수 (VISUAL 섹션)
- `src/managers/HUDManager.ts` — HUD 요소
- `src/managers/LevelUpUIManager.ts` — 레벨업 UI

**fixer 수정 금지**:

- `src/core/*.ts` — 게임 로직 (순수 TS)
- `src/objects/*.ts` — 게임 오브젝트 로직
- `src/config/weapons.ts`, `enemies.ts` — 밸런스 데이터

### Phase 3: 재평가 (auditor)

fixer 수정 후 auditor가 동일 기준으로 재평가.

- PASS → Phase 4 (RedTeam)
- FAIL → Phase 2로 루프백 (Round +1)

### Phase 4: 레드팀 리뷰 (redteam)

auditor PASS 후 redteam이 3관점 공격:

#### 관점 1: 신규 플레이어 (First-Time User Test)

- 이 게임을 처음 켠 사람이 30초 안에 뭘 해야 하는지 알 수 있는가?
- 튜토리얼 힌트가 실제로 도움이 되는가?
- 메인메뉴에서 START 버튼이 즉시 눈에 띄는가?

#### 관점 2: 경쟁작 비교 (Competitive Benchmark)

- Vampire Survivors, Brotato, Survivor.io 대비 UI 품질이 경쟁력 있는가?
- 앱스토어에서 스크린샷으로 보여줬을 때 설치 의향이 생기는가?
- 비주얼 폴리시(파티클, 화면 이펙트, 전환 연출)가 인디 수준 이상인가?

#### 관점 3: 엣지 케이스 (Edge Case Attack)

- 모든 무기 Max Level 후 레벨업 UI가 어떻게 되는가?
- 골드 0인 상태로 MetaScene 진입하면?
- 보스전 중 일시정지 → 설정 변경 → 복귀 시 상태가 정상인가?

#### RedTeam 결과

```
REDTEAM:APPROVE — 배포 승인
REDTEAM:REJECT(list) — 수정 필요 항목 목록
```

REJECT 시 → fixer에게 수정 목록 전달 → Round +1

### Phase 5: 최종 처리

- APPROVE: `npm run build && npm test -- --run && vercel deploy --prod`
- 최종 리포트 작성 → `design/ui/ux-polish-report-{date}.md`
- 팀 정리 (TeamDelete)

---

## Round 제한

| Round | 상황             | 처리                                   |
| ----- | ---------------- | -------------------------------------- |
| 1     | 초기 평가 + 수정 | 정상                                   |
| 2     | 재평가 + 수정    | 정상                                   |
| 3     | 3회째 FAIL       | CEO 에스컬레이션 — 근본 설계 문제 가능 |

---

## auditor 평가 기준 요약

About Face 12원칙, 각 10점, 총 120점 → 100점 환산.

| 점수 | 등급   | 판정                |
| ---- | ------ | ------------------- |
| ≥80  | B+     | PASS → RedTeam 진행 |
| <80  | B 이하 | FAIL → 수정 루프    |

MUST 위반이 1개라도 있으면 해당 원칙 최대 5점 (C).

---

## 에이전트 프롬프트 핵심

### auditor 프롬프트 핵심

```
About Face 12원칙을 코드 기반으로 정량 평가한다.
grep/glob으로 실제 코드 값을 측정하고, 원칙별 MUST/SHOULD 충족 여부를 채점한다.
감정이나 추측이 아닌 코드에서 추출한 수치로만 판단한다.
```

### fixer 프롬프트 핵심

```
auditor/redteam이 보낸 수정 목록을 정확히 구현한다.
수정 후 반드시 npm run build && npm test -- --run 통과를 확인한다.
테스트 수가 감소하면 안 된다.
```

### redteam 프롬프트 핵심

```
적대적 관점에서 UI를 공격한다.
"이 UI를 써야 하는 사용자 입장에서 가장 짜증나는 것"을 찾는다.
경쟁작 대비 부끄럽지 않은 수준인지 냉정하게 판단한다.
수치적 근거 없는 주관적 칭찬 금지. 문제만 보고한다.
```

---

## 제약

- 최대 3 Round (초과 시 CEO 에스컬레이션)
- fixer는 src/core/ 수정 금지
- 빌드+테스트 PASS 없이 다음 Phase 진행 금지
- 전체 파이프라인 완료 후 반드시 TeamDelete
