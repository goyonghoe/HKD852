---
name: wanchai-sprint
description: "WanChai 에이전트 팀 스프린트 실행 — CEO가 목표만 지정하면 팀이 자율적으로 분배/소통/검증"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent, TeamCreate, TeamDelete, TaskCreate, TaskUpdate, TaskList, TaskGet, SendMessage
---

# /wanchai-sprint — Agent Teams 자율 스프린트

CEO로부터 스프린트 목표를 받아 에이전트 팀을 구성하고, 태스크를 분배하고, 검증 게이트를 통과할 때까지 자율 운영한다.

## 입력

CEO가 스프린트 목표를 자연어로 전달:
```
/wanchai-sprint "무기 코덱스 씬 구현 — 10종 무기 아이콘 + 상세 정보 + 잠금/해금 표시"
```

---

## 실행 프로토콜

### Phase 0: 컨텍스트 로드

다음 파일을 읽어 현재 프로젝트 상태를 파악한다:

1. `WanChai/.claude/CLAUDE.md` — 프로젝트 개요, 에이전트 목록
2. `WanChai/.claude/rules/mistake-registry.md` — M-001~M-015 실수 방지
3. `WanChai/.claude/rules/verification-gates.md` — 필수 검증 게이트
4. `WanChai/.claude/rules/handoff-protocol.md` — 핸드오프 절차
5. `WanChai/.claude/rules/architecture.md` — 아키텍처 규칙
6. `WanChai/design/status.json` — 현재 설계/구현 상태
7. `WanChai/memory/SESSION_LOG.md` — 이전 세션 진행 상황 (있으면)

### Phase 1: 목표 분석 → 역할 판별

스프린트 목표를 분석하여 필요한 에이전트 역할을 판별한다. **6명 전원이 아닌, 필요한 2~4명만 선택**.

| 목표 유형 | 필요 역할 | 예시 |
|----------|----------|------|
| 신규 기능 구현 | designer + coder + ux | 무기 코덱스 씬 |
| 밸런스 조정 | balancer + designer + coder | Stage 3 난이도 하향 |
| UI 폴리시 | ux + coder | 전체 UI 오버플로 수정 |
| VFX/아트 추가 | artist + coder | 새 적 스프라이트 + 파티클 |
| 오디오 추가 | audio + coder | 보스 BGM + SFX |
| 풀 파이프라인 | designer + coder + ux + balancer | 새 스테이지 전체 |

### Phase 2: 팀 생성 + 태스크 분해

1. **TeamCreate**: `wanchai-sprint` 팀 생성
2. **TaskCreate**: 목표를 구체적 태스크로 분해 (의존성 포함)
3. 태스크 간 `blockedBy` 설정으로 실행 순서 보장

#### 태스크 분해 패턴

**기능 구현 스프린트** (designer + coder + ux):
```
Task 1: [designer] UX 경험 설계서 작성 → design/ux/{feature}-experience.md
Task 2: [designer] 메카닉 스펙 작성 (blockedBy: 1) → design/specs/mechanics/SPEC-XXX.md
Task 3: [coder] 스펙 구현 + 테스트 (blockedBy: 2) → src/ + tests/
Task 4: [ux] UX 게이트 검증 (blockedBy: 3) → /ux-gate 기준
Task 5: [coder] 피드백 반영 + 빌드+테스트+배포 (blockedBy: 4)
```

**밸런스 조정 스프린트** (balancer + designer + coder):
```
Task 1: [balancer] 현재 DPS/TTK 분석 → design/balance/
Task 2: [balancer] 변경 제안서 작성 (blockedBy: 1)
Task 3: [designer] 제안서 리뷰 + 승인 (blockedBy: 2)
Task 4: [coder] balance.ts 수정 + 테스트 (blockedBy: 3)
Task 5: [coder] 빌드+테스트+배포 (blockedBy: 4)
```

**UI 폴리시 스프린트** (ux + coder):
```
Task 1: [ux] 전체 씬 UI 감사
Task 2: [coder] 수정 구현 (blockedBy: 1)
Task 3: [ux] 수정 검증 (blockedBy: 2)
Task 4: [coder] 빌드+테스트+배포 (blockedBy: 3)
```

### Phase 3: 팀원 스폰

각 역할별로 `Agent` 도구를 사용해 팀원을 스폰한다.

#### 스폰 대상과 컨텍스트

| 역할 | 팀원 이름 | subagent_type | 에이전트 정의 | 추가 컨텍스트 |
|------|----------|---------------|-------------|-------------|
| 기획 | `designer` | general-purpose | `.claude/agents/game-designer.md` | `design/status.json` |
| 구현 | `coder` | general-purpose | `.claude/agents/programmer.md` | 관련 spec 파일 |
| 밸런스 | `balancer` | general-purpose | `.claude/agents/balance-designer.md` | `design/reference/numerical-bible.md` |
| UI | `ux` | general-purpose | `.claude/agents/ui-designer.md` | `design/reference/ui-ux-guideline.md` |
| 아트 | `artist` | general-purpose | `.claude/agents/art-director.md` | `design/reference/art-style-guide.md` |
| 오디오 | `audio` | general-purpose | `.claude/agents/audio-designer.md` | `src/audio/` 파일들 |

#### 스폰 프롬프트 구조

각 팀원에게 전달할 프롬프트:

```
You are the {ROLE} for WanChai NeonSurvivor game team.
Team name: wanchai-sprint
Your name: {NAME}

## Your Role & Capabilities
{에이전트 정의 파일 (.claude/agents/{agent}.md) 전체 내용}

## Sprint Goal
{CEO가 전달한 스프린트 목표}

## Project Rules (MUST follow — violations cause deployment failure)

### Architecture
{.claude/rules/architecture.md 내용}

### Mistake Registry (known pitfalls)
{.claude/rules/mistake-registry.md 내용}

### Verification Gates
{.claude/rules/verification-gates.md 내용}

### Handoff Protocol
{.claude/rules/handoff-protocol.md 내용}

## Workflow
1. Read TaskList — find tasks assigned to you (owner = your name)
2. Pick the lowest-ID unblocked task and mark it in_progress via TaskUpdate
3. Do the work. Write files only within your writable paths.
4. When done, mark the task completed via TaskUpdate
5. If blocked or need clarification, send a message to the relevant teammate or team lead
6. Check TaskList again for your next task
7. When all your tasks are done, notify the team lead via SendMessage

## Communication Rules
- Use SendMessage (type: "message") for 1:1 communication
- NEVER use broadcast unless it's a critical blocker affecting everyone
- When sending specs/findings to another teammate, include specific file paths and key details
- When reporting completion to team lead, include: what was done, files changed, any concerns

## File Write Restrictions
{역할별 writable paths — 에이전트 정의 파일에서 추출}
```

**중요**: 스폰 시 실제 파일 내용을 읽어서 프롬프트에 인라인으로 포함한다. 파일 경로 참조만으로는 팀원이 접근할 수 없을 수 있다.

### Phase 4: 태스크 배정 + 자율 실행

1. **TaskUpdate**로 각 태스크에 owner 배정
2. 팀원들이 자율적으로 작업 시작
3. 팀 리더(=현재 세션)는 메시지를 수신하며 다음을 수행:
   - **질의 응답**: 팀원의 스펙 질의, 구현 방향 질의에 응답
   - **중간 검증**: 팀원이 보낸 결과물을 확인하고 피드백
   - **블로커 해결**: CEO 판단이 필요한 사항은 에스컬레이션
   - **태스크 재배정**: 팀원이 작업 완료 후 다음 태스크 배정

#### 팀원 간 소통 패턴 (허용)

| From → To | 사유 | 예시 |
|-----------|------|------|
| designer → coder | 스펙 전달/수정 | "SPEC-025 ready at design/specs/mechanics/SPEC-025.md" |
| coder → designer | 스펙 질의 | "SPEC-025: does 'multi-hit' include reflected projectiles?" |
| coder → ux | UI 구현 질의 | "Panel width 400px — touch target 48dp on both sides?" |
| ux → coder | 수정 요청 | "Font size 12px → must be 14px minimum. Fix src/scenes/X.ts L45" |
| balancer → coder | 수치 변경 | "balance.ts L23: COMBO_MULT 0.15 → 0.20" |
| 누구든 → lead | 블로커 보고 | "Blocked: need CEO decision on X" |

### Phase 5: 검증 게이트 체인

모든 태스크 완료 후, 팀 리더가 최종 검증을 수행한다.

#### 필수 게이트 (순서대로)

| # | Gate | 담당 | 통과 조건 | 실패 시 |
|---|------|------|----------|--------|
| 1 | Build + Test | coder (또는 lead) | `npm run build && npm test -- --run` PASS | coder에게 수정 요청 |
| 2 | Test count | lead | 리팩토링 시 테스트 수 감소 없음 | coder에게 테스트 추가 요청 |
| 3 | Wiring check | lead | 새 씬/플래그 시 `grep scene.start` 확인 | coder에게 배선 수정 요청 |
| 4 | UX gate | ux (또는 lead) | `/ux-gate` 기준 PASS | ux+coder에게 수정 요청 |
| 5 | Deploy | coder (또는 lead) | `vercel deploy --prod` 성공 | 롤백 후 원인 분석 |

**게이트 실패 시**: FAIL 지점부터 루프백. 새 태스크를 생성하여 수정 → 재검증.

### Phase 6: 세션 종료 프로토콜

1. 모든 태스크 `completed` 확인 (TaskList)
2. 최종 빌드+테스트 PASS 확인
3. `design/status.json` 업데이트 확인
4. `memory/SESSION_LOG.md`에 체크포인트 기록
5. 모든 팀원에게 `SendMessage type: shutdown_request` 전송
6. 팀원 shutdown 승인 대기 → `TeamDelete` → 팀 정리
7. CEO에게 실행 요약 보고 (아래 형식)

---

## 실행 요약 보고 형식

```markdown
## 실행 요약

### 작업 정보
- **스프린트 목표**: {목표}
- **완료 시간**: {YYYY-MM-DD HH:MM}
- **실행 방식**: Agent Teams

### 팀 구성
| 팀원 | 역할 | 태스크 수 | 완료 |
|------|------|----------|------|
| designer | 기획 | 2 | 2/2 |
| coder | 구현 | 3 | 3/3 |
| ux | UX 검증 | 1 | 1/1 |

### 검증 게이트
| Gate | 결과 |
|------|------|
| Build + Test | PASS (tests: XXX/0/XXX) |
| Wiring check | PASS (또는 N/A) |
| UX gate | PASS (또는 N/A) |
| Deploy | PASS (URL: https://project-wanchai.vercel.app) |

### 변경 파일
- `design/ux/xxx-experience.md` — UX 경험 설계서
- `design/specs/mechanics/SPEC-XXX.md` — 메카닉 스펙
- `src/scenes/XxxScene.ts` — 씬 구현
- `tests/XxxScene.test.ts` — 테스트

### 팀 협업 하이라이트
- designer → coder: 스펙 전달 + 2건 질의응답
- ux → coder: 폰트 크기 수정 1건

### 다음 스프린트 제안 (있으면)
- [ ] 후속 작업 항목
```

---

## 비용 및 제약

- **비용**: 팀원 N명 = Opus 인스턴스 N개 병렬 → 비용 ~N배
- **파일 충돌**: 각 에이전트의 writable paths가 분리되어 있어 충돌 낮음
- **세션 한계**: 팀은 하나의 세션 내에서 동작. 세션 종료 시 팀도 종료
- **적합한 작업**: 2개 이상 에이전트가 관여하는 중간~대규모 기능
- **부적합**: 단순 버그 수정, 한 파일 수정 — 직접 처리가 효율적

## 에스컬레이션 규칙

다음 상황은 CEO에게 즉시 보고하고 판단을 요청한다:
- 팀원 간 의견 충돌이 해소되지 않을 때
- 스프린트 목표 범위 밖의 변경이 필요할 때
- 검증 게이트 3회 연속 FAIL
- 게임 컨셉/방향성 판단이 필요할 때
