# ShortsFleet — 멀티채널 쇼츠 통합 관리 시스템

> 전 채널 상태 조회, 병렬 생산, 신규 채널 스캐폴딩, 크로스채널 분석을 한 곳에서 관리

---

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- **가이드 인덱스**: [Claude Code 공식 가이드](../../docs/claude-code-guide/INDEX.md)
- **스킬 표준**: [스킬 구조 가이드](../../docs/claude-code-guide/skills/01-skill-structure.md)

---

## 핵심 철학

```
ShortsFleet는 기존 채널 에이전트를 감싸는 관리 레이어입니다.
기존 에이전트(ShortsFactory_Agent, ShortsFactory2_Agent 등)는 수정하지 않습니다.
```

- **단일 진실 소스**: `registry.json`이 전체 채널 목록과 설정의 유일한 소스
- **채널 독립성**: 각 채널은 독자적 에이전트로 운영, Fleet은 조율만 담당
- **점진적 확장**: `/fleet-add`로 새 채널을 추가하면 자동으로 Fleet에 편입
- **순차 실행**: GPU/TTS 메모리 경합 방지를 위해 채널별 순차 실행 (OOM 방지)
- **재개 가능**: `fleet_state.json`으로 중단/재개 지원

---

## 스킬 목록

| 스킬            | 명령어             | 모델   | 역할                               |
| --------------- | ------------------ | ------ | ---------------------------------- |
| Fleet Status    | `/fleet-status`    | Haiku  | 전 채널 상태 조회 (읽기 전용)      |
| Fleet Add       | `/fleet-add`       | Sonnet | 새 채널 스캐폴딩 + 레지스트리 등록 |
| Shorts Fleet    | `/shorts-fleet`    | Sonnet | 일일 병렬 생산 오케스트레이터      |
| Fleet Analytics | `/fleet-analytics` | Sonnet | 크로스채널 HTML 대시보드           |

---

## 디렉토리 구조

```
ShortsFleet/
├── .claude/
│   ├── CLAUDE.md                        ← 이 문서
│   └── skills/
│       ├── fleet-status/SKILL.md        ← 상태 조회
│       ├── fleet-add/SKILL.md           ← 채널 추가
│       ├── shorts-fleet/SKILL.md        ← 생산 오케스트레이터
│       └── fleet-analytics/SKILL.md     ← 분석 대시보드
├── registry.json                        ← 채널 레지스트리 (단일 진실 소스)
├── fleet_state.json                     ← 생산 실행 상태 (런타임 생성)
└── templates/
    └── agent-scaffold/                  ← 새 채널 스캐폴딩 템플릿
        ├── .claude/
        │   ├── CLAUDE.md.tmpl
        │   └── skills/channel-factory/SKILL.md.tmpl
        └── templates/
            └── hooks.json.tmpl
```

---

## 레지스트리 (registry.json)

모든 채널 정보의 단일 진실 소스입니다. 채널 추가/변경 시 반드시 이 파일을 업데이트합니다.

주요 필드:

- `id`: 채널 고유 식별자 (디렉토리명에 사용)
- `agent_dir`: 실제 에이전트 디렉토리 경로
- `enabled`: 생산 대상 여부
- `orchestrator_skill`: 해당 채널의 오케스트레이터 스킬 (없으면 null)
- `default_batch_size`: 1회 배치 생산량

---

## 타 에이전트 연계

```
ShortsFleet ──→ ShortsFactory_Agent   (WhatIf 채널 생산 위임)
ShortsFleet ──→ ShortsFactory2_Agent  (논문 채널 생산 위임)
ShortsFleet ──→ [신규 채널]           (fleet-add로 추가된 채널)
Growth_Agent ──→ ShortsFleet          (크로스채널 KPI)
PMO_Agent    ──→ ShortsFleet          (스프린트 진행률)
```

---

## 컨텍스트 관리 안전장치

### 1. 서브에이전트 격리

```
각 채널 생산은 독립 Task(서브에이전트)로 실행
메인 컨텍스트에는 에피소드당 1줄 JSON만 반환:
  {"ep": "whatif_ep042", "status": "PASS", "duration": "38s", "path": "rendered/..."}
```

### 2. 파일 기반 상태

```
fleet_state.json으로 전체 실행 상태 관리
채널 간 데이터 교환 없음 (각 채널 독립)
```

### 3. 컨텍스트 위험 신호

```
- 3개 이상 채널 연속 실행 → 중간 요약 수행
- 렌더링 로그 100줄 이상 → 즉시 정리
- 동일 세션 10편 이상 → /compact 권고
```

---

## 공유 라이브러리 전략

모든 채널은 `ShortsFactory_Agent/libs/`를 심링크로 공유합니다:

```
[새 채널]/libs → ../ShortsFactory_Agent/libs
```

공유 라이브러리:

- `tts_engine.py` — Qwen3-TTS 다국어 래퍼
- `video_composer.py` — FFmpeg 영상 합성
- `subtitle_gen.py` — 자막 생성기
- `metadata_gen.py` — 메타데이터 생성
- `image_gen.py` — SSD-1B 이미지 생성
- `mood_profiles.py` — 무드 프로필

---

## 버전 정보

- 생성일: 2026-02-22
- 최종 업데이트: 2026-02-22
- Fleet 버전: 1.0
- 등록 채널: 2 (WhatIf, 오늘의 논문)
