---
name: guide-update-check
description: "Claude Code 공식 가이드 업데이트 확인 및 로컬 문서 동기화"
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, Write, Edit, WebFetch, WebSearch, Glob, Grep
---

# Claude Code 공식 가이드 업데이트 체크

Claude Code/Agent SDK 공식 문서의 변경사항을 확인하고 HKD852 루트의 로컬 가이드를 업데이트합니다.

## 공식 문서 소스

### 핵심 문서 URL
1. **스킬 가이드**: https://docs.anthropic.com/en/docs/claude-code/skills
2. **Agent SDK**: https://docs.anthropic.com/en/docs/agents/agent-sdk
3. **베스트 프랙티스**: https://docs.anthropic.com/en/docs/claude-code/best-practices
4. **모델 정보**: https://docs.anthropic.com/en/docs/about-claude/models

### 보조 문서
- Claude Code 개요: https://docs.anthropic.com/en/docs/claude-code
- API 레퍼런스: https://docs.anthropic.com/en/api

## 체크 절차

### 1단계: 현재 버전 확인
```bash
# 로컬 가이드 버전 확인
grep -r "최종 동기화\|최종 업데이트" docs/claude-code-guide/
```

### 2단계: 공식 문서 확인
WebFetch로 각 공식 문서 페이지 내용 확인:
- 새로운 필드/옵션 추가 여부
- API 변경사항
- 베스트 프랙티스 업데이트
- 새로운 모델 버전 (예: Opus 4.6)

### 3단계: 변경사항 분석
로컬 문서와 공식 문서 비교:
- 누락된 내용
- 변경된 내용
- 폐기된 내용

### 4단계: 업데이트 적용
변경사항을 로컬 문서에 반영:
1. 해당 섹션 업데이트
2. `최종 동기화` 날짜 갱신
3. `변경 이력` 추가

## 로컬 가이드 위치 (HKD852 루트)

```
docs/claude-code-guide/
├── INDEX.md                     # 인덱스 (적용 범위, 참조 링크)
├── skills/
│   ├── 01-skill-structure.md    # 스킬 구조
│   └── 02-skill-examples.md     # 스킬 예제
├── agent-sdk/
│   └── 01-overview.md           # SDK 개요
└── best-practices/
    └── 01-skill-best-practices.md
```

## 적용 범위

이 가이드는 HKD852 하위 모든 에이전트에 적용:
- GameDesign_Agent
- PT_Agent
- Income_Factory
- Video_Analyzer
- team-kowloon

## 출력: 업데이트 보고서

```yaml
업데이트_체크_보고서:
  체크_일시: "[YYYY-MM-DD HH:MM]"

  문서별_상태:
    스킬_가이드:
      로컬_버전: "v1.0 (2026-02-06)"
      공식_상태: "변경없음|업데이트필요"
      변경_내용: "[있으면 기재]"

    Agent_SDK:
      로컬_버전: "v1.0 (2026-02-06)"
      공식_상태: "변경없음|업데이트필요"
      변경_내용: "[있으면 기재]"

    베스트_프랙티스:
      로컬_버전: "v1.0 (2026-02-06)"
      공식_상태: "변경없음|업데이트필요"
      변경_내용: "[있으면 기재]"

    모델_정보:
      현재_최신: "[모델명 및 버전]"
      로컬_설정: "opus"
      업데이트_필요: "예|아니오"

  권장_조치:
    - "[업데이트 필요한 항목]"

  자동_적용_가능: "예|아니오"
```

## 업데이트 적용 시 규칙

1. **원본 보존**: 기존 내용 삭제 전 백업
2. **버전 명시**: 모든 문서에 버전과 동기화 날짜 기록
3. **변경 이력**: 무엇이 변경되었는지 명확히 기록
4. **하위 에이전트 알림**: 중요 변경 시 각 에이전트 CLAUDE.md 업데이트
5. **검증**: 업데이트 후 기존 스킬들이 여전히 유효한지 확인

## 주기적 체크 권장

- **권장 주기**: 월 1회
- **중요 릴리스 시**: 즉시 체크 (새 모델 출시 등)
- **문제 발생 시**: 가이드 변경 여부 우선 확인
