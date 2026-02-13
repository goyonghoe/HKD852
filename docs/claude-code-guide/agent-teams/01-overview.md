# Agent Teams 공식 가이드

> **출처**: https://code.claude.com/docs/en/agent-teams
> **최종 동기화**: 2026-02-06
> **버전**: v1.0 (Opus 4.6)

## 개요

Agent Teams는 여러 Claude Code 인스턴스가 팀으로 협업하는 기능입니다. 하나의 세션이 팀 리드로 작업을 조율하고, 팀원들은 독립적으로 작업하며 서로 직접 통신합니다.

> **주의**: Agent Teams는 실험적 기능이며 기본 비활성화입니다.

## 활성화 방법

`settings.json`에 환경 변수 추가:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

## 언제 사용하나요?

### 적합한 경우
- **리서치 & 리뷰**: 여러 관점에서 동시 조사
- **새 모듈/기능**: 팀원이 각자 담당 영역 소유
- **경쟁 가설 디버깅**: 여러 이론 병렬 테스트
- **레이어 간 조율**: 프론트엔드/백엔드/테스트 각각 담당

### 부적합한 경우
- 순차적 작업
- 같은 파일 편집
- 의존성이 많은 작업
- 단순 작업 (비용 대비 효과 낮음)

## vs 서브에이전트

| 특성 | 서브에이전트 | Agent Teams |
|------|-------------|-------------|
| **컨텍스트** | 결과만 반환 | 완전 독립 |
| **통신** | 메인에게만 보고 | 팀원 간 직접 메시징 |
| **조율** | 메인이 모든 작업 관리 | 공유 Task List + 자율 조율 |
| **적합한 경우** | 결과만 필요한 집중 작업 | 토론/협업 필요한 복잡한 작업 |
| **토큰 비용** | 낮음 | 높음 (각 팀원 별도 인스턴스) |

## 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                     Agent Team                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐                                        │
│  │  Team Lead  │ ← 팀 생성, 조율, 결과 종합             │
│  └──────┬──────┘                                        │
│         │                                               │
│    ┌────┴────┬────────────┐                             │
│    │         │            │                             │
│    ▼         ▼            ▼                             │
│ ┌──────┐ ┌──────┐    ┌──────┐                           │
│ │ 팀원1 │ │ 팀원2 │ ...│ 팀원N │ ← 독립적 Claude 인스턴스 │
│ └──────┘ └──────┘    └──────┘                           │
│    │         │            │                             │
│    └─────────┴────────────┘                             │
│              │                                          │
│              ▼                                          │
│      ┌──────────────┐                                   │
│      │ Shared Tasks │ ← 공유 작업 목록                   │
│      │   Mailbox    │ ← 팀원 간 메시징                   │
│      └──────────────┘                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 구성요소

| 구성요소 | 역할 |
|---------|------|
| **Team Lead** | 팀 생성, 팀원 스폰, 작업 조율 |
| **Teammates** | 독립적으로 할당된 작업 수행 |
| **Task List** | 팀원들이 claim하고 완료하는 공유 작업 목록 |
| **Mailbox** | 에이전트 간 통신 시스템 |

### 저장 위치

```
~/.claude/teams/{team-name}/config.json  # 팀 설정
~/.claude/tasks/{team-name}/             # 작업 목록
```

## 팀 시작하기

자연어로 팀 생성을 요청:

```
Create an agent team to review PR #142. Spawn three reviewers:
- One focused on security implications
- One checking performance impact
- One validating test coverage
Have them each review and report findings.
```

## 디스플레이 모드

### In-process (기본)
- 모든 팀원이 메인 터미널에서 실행
- **Shift+Up/Down**: 팀원 선택
- 추가 설정 불필요

### Split-pane
- 각 팀원이 별도 창에서 실행
- tmux 또는 iTerm2 필요

설정:
```json
{
  "teammateMode": "in-process"  // 또는 "tmux", "auto"
}
```

## 팀 제어

### 팀원 및 모델 지정
```
Create a team with 4 teammates to refactor these modules in parallel.
Use Sonnet for each teammate.
```

### 계획 승인 요구
```
Spawn an architect teammate to refactor the authentication module.
Require plan approval before they make any changes.
```

### 위임 모드 (Shift+Tab)
리드가 직접 구현하지 않고 조율만 하도록 제한

### 팀원에게 직접 메시지
- **In-process**: Shift+Up/Down으로 선택 후 타이핑
- **Split-pane**: 해당 창 클릭

### 팀 정리
```
Clean up the team
```

## 사용 예시

### 병렬 코드 리뷰
```
Create an agent team to review PR #142. Spawn three reviewers:
- One focused on security implications
- One checking performance impact
- One validating test coverage
Have them each review and report findings.
```

### 경쟁 가설 조사
```
Users report the app exits after one message instead of staying connected.
Spawn 5 agent teammates to investigate different hypotheses. Have them talk to
each other to try to disprove each other's theories, like a scientific
debate. Update the findings doc with whatever consensus emerges.
```

## 베스트 프랙티스

### 1. 충분한 컨텍스트 제공
팀원은 리드의 대화 기록을 상속받지 않음. 스폰 프롬프트에 상세 정보 포함:

```
Spawn a security reviewer teammate with the prompt: "Review the authentication module
at src/auth/ for security vulnerabilities. Focus on token handling, session
management, and input validation. The app uses JWT tokens stored in
httpOnly cookies. Report any issues with severity ratings."
```

### 2. 적절한 작업 크기
- **너무 작음**: 조율 오버헤드가 이점 초과
- **너무 큼**: 체크인 없이 너무 오래 작업
- **적절함**: 명확한 산출물이 있는 독립 단위

### 3. 팀원 완료 대기
```
Wait for your teammates to complete their tasks before proceeding
```

### 4. 파일 충돌 방지
두 팀원이 같은 파일 편집하면 덮어쓰기 발생. 각 팀원이 다른 파일 담당하도록 분배.

### 5. 모니터링 및 조정
팀원 진행 상황 체크, 비효율적인 접근 방향 전환, 결과 종합

## 제한사항

- **세션 재개 불가**: `/resume`, `/rewind`로 in-process 팀원 복구 안됨
- **작업 상태 지연**: 팀원이 완료 표시 누락 가능
- **종료 지연**: 팀원이 현재 요청 완료 후 종료
- **세션당 하나의 팀**: 새 팀 전에 현재 팀 정리 필요
- **중첩 팀 불가**: 팀원은 자체 팀 생성 불가
- **리드 고정**: 팀 리드 변경 불가
- **권한 스폰 시 설정**: 팀원은 리드의 권한 상속

## CLAUDE.md 지원

> **중요**: 팀원들도 작업 디렉토리의 `CLAUDE.md` 파일을 읽습니다.

이를 활용하여 모든 팀원에게 프로젝트별 가이드 제공 가능.

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-02-06 | v1.0 | 최초 작성 (Opus 4.6 출시) |
