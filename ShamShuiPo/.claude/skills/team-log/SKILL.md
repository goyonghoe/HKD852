---
name: team-log
description: "팀 커뮤니케이션 로그 기록 + Vault 동기화"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob
---

# /team-log — 팀 대화 로그 관리

## 사용법

`/team-log [command]`

### Commands

- `/team-log start` — 새 세션 로그 시작
- `/team-log sync` — 현재 로그를 Vault에 동기화
- `/team-log summary` — 오늘의 세션들을 요약

## 로그 기록 형식

에이전트 간 통신 시 다음 형식으로 `team-logs/` 에 append:

```
### [HH:MM] {sender} → {receiver}
> {message}

**Context**: {task context}
**Decision**: {decision if any}
```

## Vault 동기화

```bash
cp ShamShuiPo/team-logs/*.md /Users/yong/MainFolder/My_AI_Project/HKD852_Vault/02_Projects/ShamShuiPo/team-logs/
```

## 세션 요약 생성

각 세션 로그에서 다음을 추출하여 `YYYY-MM-DD-summary.md` 생성:

1. 참여 에이전트
2. 주요 결정 사항
3. 작업 완료 항목
4. 미해결 이슈
5. 다음 액션 아이템
