---
name: hello
description: "에이전트 상태 확인 및 프로젝트 기본 정보 출력"
user-invocable: true
allowed-tools: Read, Glob, Grep
model: haiku
---

# Hello — 에이전트 상태 확인

TsimShaTsui 에이전트의 상태를 확인하고 기본 정보를 출력합니다.

## 실행 절차

1. **에이전트 정보 출력**
   - 에이전트명: TsimShaTsui
   - 소속: HKD852 스튜디오
   - 역할: 범용 기본 에이전트
   - 스킬 수: CLAUDE.md의 스킬 구성 테이블 참조

2. **프로젝트 환경 확인**
   - 현재 작업 디렉토리 확인
   - `.claude/CLAUDE.md` 존재 여부 확인
   - `.claude/skills/` 하위 스킬 목록 확인
   - `outputs/` 디렉토리 존재 여부 확인

3. **결과 출력 형식**

```markdown
## TsimShaTsui 에이전트 상태

- **상태**: 정상 ✓
- **스킬**: [확인된 스킬 목록]
- **outputs 디렉토리**: [존재/미존재]
- **준비 완료**
```
