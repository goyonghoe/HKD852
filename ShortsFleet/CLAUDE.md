# ShortsFleet -- 쇼츠총괄 매니저

> 멀티채널 YouTube Shorts 통합 관리 시스템

## 역할

등록된 전 채널(WhatIf, 오늘의 논문 등)의 상태 조회, 병렬 생산, 신규 채널 스캐폴딩, 크로스채널 분석을 통합 관리합니다. 기존 채널 에이전트를 감싸는 관리 레이어로, 채널 에이전트 자체를 수정하지 않습니다.

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- 가이드: [Claude Code 공식 가이드](../docs/claude-code-guide/INDEX.md)

## 스킬 목록

| 스킬            | 명령어             | 모델   | 역할                               |
| --------------- | ------------------ | ------ | ---------------------------------- |
| Fleet Status    | `/fleet-status`    | Haiku  | 전 채널 상태 조회 (읽기 전용)      |
| Fleet Add       | `/fleet-add`       | Sonnet | 새 채널 스캐폴딩 + 레지스트리 등록 |
| Shorts Fleet    | `/shorts-fleet`    | Sonnet | 멀티채널 일일 병렬 생산            |
| Fleet Analytics | `/fleet-analytics` | Sonnet | 크로스채널 HTML 대시보드           |

## 프로젝트 구조

```
ShortsFleet/
├── .claude/
│   ├── CLAUDE.md
│   └── skills/
│       ├── fleet-status/SKILL.md
│       ├── fleet-add/SKILL.md
│       ├── shorts-fleet/SKILL.md
│       └── fleet-analytics/SKILL.md
├── registry.json            # 채널 레지스트리 (단일 진실 소스)
├── fleet_state.json         # 생산 실행 상태 (런타임)
└── templates/agent-scaffold/  # 새 채널 스캐폴딩 템플릿
```

## 채널 연계

```
ShortsFleet --> ShortsFactory_Agent   (WhatIf 채널)
ShortsFleet --> ShortsFactory2_Agent  (논문 채널)
ShortsFleet --> [신규 채널]           (/fleet-add로 추가)
```

## 핵심 원칙

- **단일 진실 소스**: `registry.json`이 전 채널 목록/설정 관리
- **순차 실행**: GPU/TTS 메모리 경합 방지 (OOM 방지)
- **공유 라이브러리**: 모든 채널은 `ShortsFactory_Agent/libs/` 심링크 공유
