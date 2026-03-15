---
name: model-audit
description: 'WanChai 에이전트/스킬 모델 배분 감사 — 스프린트 리뷰 시 과잉 Opus 사용 탐지'
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
model: haiku
---

# /model-audit — 모델 배분 감사

## 역할

스프린트 리뷰 시 WanChai 에이전트 6개와 스킬 46개의 model 설정을 전수 조사하여
과잉/부족한 모델 사용을 탐지하고 최적화 권고안을 출력합니다.

## 기준 (CLAUDE.md 표준)

| 작업 유형                                  | 권장 모델  | 판단 기준 키워드                                     |
| ------------------------------------------ | ---------- | ---------------------------------------------------- |
| 비판적 분석, 리뷰, 설계 판단, 품질 게이트  | **opus**   | review, audit, gate, analysis, judgment, bal-\*      |
| 콘텐츠 생성, 코드 작성, 구현, BGM/SFX 생성 | **sonnet** | implement, generate, create, scene, sprite, bgm, sfx |
| 단순 조회, 상태 변경, 빌드 실행, 라우팅    | **haiku**  | status, pickup, done, deploy, check, sync            |

## 절차

### 1. 에이전트 모델 수집

```bash
for f in /path/to/WanChai/.claude/agents/*.md; do
  name=$(grep -m1 '^name:' "$f" | sed 's/name: *//')
  model=$(grep -m1 '^model:' "$f" | sed 's/model: *//')
  echo "$name | $model"
done
```

각 에이전트 역할을 읽고 기준 표와 대조한다:

- `game-designer`: opus (설계 판단) — 유지
- `programmer`: sonnet (코드 구현) — 유지
- `art-director`: sonnet (텍스처 생성) — 유지
- `ui-designer`: sonnet (UI 구현) — 유지
- `balance-designer`: opus (수치 분석) — 유지
- `audio-designer`: sonnet (오디오 생성) — 유지

### 2. 스킬 모델 전수 조사

```bash
for f in /path/to/WanChai/.claude/skills/*/SKILL.md; do
  skill=$(basename $(dirname $f))
  model=$(grep -m1 '^model:' "$f" | sed 's/model: *//')
  if [ -z "$model" ]; then model="(none)"; fi
  echo "$skill | $model"
done
```

### 3. 이상 탐지 규칙

다음 패턴을 플래그로 표시한다:

**OVER-ENGINEERED (Opus → 하향 검토)**:

- `model: opus` + description에 "조회", "status", "pickup", "done", "deploy" 포함
- `model: opus` + allowed-tools에 Write/Edit 없음 (읽기 전용)

**UNDER-POWERED (Sonnet/Haiku → 상향 검토)**:

- `model: sonnet` + description에 "리뷰", "감사", "게이트", "평가", "경제 시뮬레이션" 포함
- `model: haiku` + description에 "설계", "분석", "판단" 포함

**MISSING (model 필드 없음)**:

- `(none)` → 반드시 명시적 모델 추가 권고

### 4. 보고서 출력

```
## WanChai 모델 배분 감사 보고서
날짜: [오늘 날짜]
스프린트: [현재 스프린트 번호]

### 에이전트 현황 (6개)
| 에이전트 | 현재 모델 | 권장 | 판정 |
|----------|----------|------|------|
| game-designer | opus | opus | OK |
| ...

### 스킬 현황 (46개)
| 스킬 | 현재 모델 | 권장 | 판정 |
|------|----------|------|------|
| kanban-status | haiku | haiku | OK |
| ...

### 이상 탐지
- OVER-ENGINEERED: [목록]
- UNDER-POWERED: [목록]
- MISSING: [목록]

### 권고 액션
1. ...

### 비용 영향
- Opus 스킬 수: N개
- Sonnet 스킬 수: N개
- Haiku 스킬 수: N개
- 전 스프린트 대비 변화: [delta]
```

## 실행 타이밍

- **스프린트 리뷰 종료 시** `/wanchai-sprint` 파이프라인 마지막 단계
- **새 스킬 추가 후** 모델 일관성 확인
- **월간 비용 검토 시** 과잉 Opus 사용 탐지

## 예시 실행

```
/model-audit
/model-audit --sprint 028
/model-audit --focus kanban
```
