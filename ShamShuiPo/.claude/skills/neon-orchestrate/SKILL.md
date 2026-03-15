---
name: neon-orchestrate
description: "Neon Survivors 멀티에이전트 오케스트레이터 — 병렬 작업 분배, 릴레이 통신, 대화 로그 기록"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent
model: opus
---

# /neon-orchestrate — 멀티에이전트 오케스트레이터

## 역할

CEO의 요청을 분석하여 적절한 에이전트 팀을 구성하고, 병렬로 작업을 분배하며,
에이전트 간 통신을 중계하고 모든 대화를 로그로 기록합니다.

## 실행 프로세스

### 1. 요청 분석

- CEO 요청을 파싱하여 필요한 에이전트 식별
- 작업을 독립 단위로 분해
- 의존성 그래프 작성

### 2. 세션 로그 초기화

```bash
# 새 세션 로그 파일 생성
SESSION_FILE="team-logs/$(date +%Y-%m-%d)-session-$(printf '%03d' $NEXT_NUM).md"
```

### 3. 에이전트 병렬 실행

- 독립 작업은 Agent tool로 병렬 실행
- 각 에이전트 프롬프트에 로그 형식 지시 포함
- 결과를 수집하여 다음 단계에 릴레이

### 4. 릴레이 통신 기록

에이전트 A의 결과를 에이전트 B에 전달할 때:

```markdown
### [HH:MM] ORCH → PG (relay from GD)

> GD가 작성한 무기 스펙을 전달합니다:
>
> - Plasma Pistol: base_dmg 10, fire_rate 0.5s, range 300px
> - Laser Beam: base_dmg 5/tick, continuous, range 400px
>
> 이 스펙대로 WeaponSystem에 구현해주세요.

**Context**: Week 1 프로토타입 - 무기 시스템 구현
**Decision**: GD 스펙 확정, PG 구현 시작
```

### 5. 세션 종료 & 요약

- 모든 에이전트 작업 완료 후 세션 요약 생성
- Raw 로그 + 요약을 Vault에 동기화

## 에이전트 분배 기준

| 작업 유형     | 에이전트 조합                 | 병렬 가능            |
| ------------- | ----------------------------- | -------------------- |
| 신규 기능     | GD → PG + AD + UID            | GD 선행, 나머지 병렬 |
| 밸런스 조정   | BD → PG                       | 순차                 |
| UI 작업       | UID → PG                      | 순차                 |
| 사운드 통합   | AUD → PG                      | 순차                 |
| 전체 스프린트 | GD + BD → PG + AD + UID + AUD | 2단계                |

## 로그 저장 위치

- Raw: `ShamShuiPo/team-logs/YYYY-MM-DD-session-NNN.md`
- Summary: `ShamShuiPo/team-logs/YYYY-MM-DD-summary.md`
- Vault: `/Users/yong/MainFolder/My_AI_Project/HKD852_Vault/02_Projects/ShamShuiPo/team-logs/`

## Vault 동기화 명령

```bash
cp -r /Users/yong/MainFolder/My_AI_Project/HKD852/ShamShuiPo/team-logs/*.md \
  /Users/yong/MainFolder/My_AI_Project/HKD852_Vault/02_Projects/ShamShuiPo/team-logs/
```
