---
name: fleet-add
description: "새 채널 스캐폴딩 — 디렉토리 생성, libs 심링크, 템플릿 치환, 레지스트리 등록"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
recommended-model: sonnet
model-reason: "파일 생성 + 템플릿 치환 — Sonnet의 균형잡힌 성능이 적합"
argument-hint: "--id <channel_id> --name <display_name> --language <ko|en|ja|zh> --series <series_prefix> --niche <niche_description>"
---

# /fleet-add — 새 채널 스캐폴딩

## 역할

새로운 YouTube Shorts 채널을 위한 에이전트 디렉토리를 자동 생성하고 Fleet에 등록합니다.

## 인자

| 인자         | 필수 | 설명                                    | 예시                          |
| ------------ | ---- | --------------------------------------- | ----------------------------- |
| `--id`       | Y    | 채널 고유 ID (영문 소문자, 하이픈 가능) | `crime-history`               |
| `--name`     | Y    | 표시 이름 (한글/영문)                   | `"범죄의 역사"`               |
| `--language` | Y    | 주 언어 (ko/en/ja/zh)                   | `ko`                          |
| `--series`   | Y    | 에피소드 접두사                         | `crime_ep`                    |
| `--niche`    | N    | 니치 설명 (기본: "general")             | `"true crime history shorts"` |
| `--voice`    | N    | 보이스 프리셋 (기본: language별 기본값) | `trust-male`                  |
| `--market`   | N    | 타겟 시장 (기본: ["KR"])                | `KR,NA,EU`                    |
| `--batch`    | N    | 기본 배치 사이즈 (기본: 2)              | `3`                           |

## 실행 흐름

```
[1] 인자 파싱 및 검증
    - 필수 인자 확인
    - id 중복 검증 (registry.json 확인)
    - agent_dir 경로 결정: ShortsFactory_{id}_Agent (예: ShortsFactory_crime-history_Agent)

[2] 디렉토리 구조 생성
    {agent_dir}/
    ├── .claude/
    │   ├── CLAUDE.md
    │   └── skills/channel-factory/SKILL.md
    ├── libs/                  → 심링크: ../ShortsFactory_Agent/libs
    ├── pipeline/
    │   ├── scripts/
    │   ├── rendered/
    │   │   └── samples/
    │   ├── queue/
    │   ├── analytics/
    │   ├── images/
    │   ├── temp/
    │   └── voice_samples_qwen3/
    ├── templates/
    │   └── hooks.json
    ├── data/
    │   ├── trends/
    │   ├── performance/
    │   └── learnings/
    └── outputs/

[3] libs 심링크 생성
    ln -s ../ShortsFactory_Agent/libs {agent_dir}/libs

[4] 템플릿 파일 치환
    ShortsFleet/templates/agent-scaffold/ 에서 .tmpl 파일을 읽고 치환:
    - {{CHANNEL_ID}} → id
    - {{CHANNEL_NAME}} → name
    - {{LANGUAGE}} → language
    - {{SERIES_PREFIX}} → series
    - {{NICHE}} → niche
    - {{VOICE_PRESET}} → voice
    - {{AGENT_DIR}} → agent_dir 경로

[5] registry.json 업데이트
    channels 배열에 새 채널 추가:
    {
      "id": "{id}",
      "name": "{name}",
      "agent_dir": "{agent_dir}",
      "language": "{language}",
      "series_prefix": "{series}",
      "enabled": true,
      "orchestrator_skill": null,
      "default_batch_size": {batch},
      "voice_preset": "{voice}",
      "target_market": [{market}],
      "notes": "Scaffolded on {date}"
    }
```

## 실행 방법

1. 인자를 파싱합니다. `$ARGUMENTS`에서 `--id`, `--name`, `--language`, `--series` 등을 추출합니다
2. `ShortsFleet/registry.json`을 읽어 id 중복을 확인합니다
3. agent_dir 이름을 결정합니다: id가 단순하면 그대로, 아니면 적절히 조합
4. Bash로 디렉토리 구조를 생성합니다 (`mkdir -p`)
5. Bash로 libs 심링크를 생성합니다 (`ln -s`)
6. `ShortsFleet/templates/agent-scaffold/` 아래의 `.tmpl` 파일들을 Read로 읽고, 플레이스홀더를 치환하여 Write로 생성합니다
7. `ShortsFleet/registry.json`을 Edit로 업데이트하여 새 채널을 추가합니다
8. 결과를 요약 출력합니다

## 출력 형식

```markdown
## 새 채널 생성 완료

| 항목              | 값                             |
| ----------------- | ------------------------------ |
| 채널 ID           | {id}                           |
| 표시 이름         | {name}                         |
| 에이전트 디렉토리 | {agent_dir}/                   |
| 언어              | {language}                     |
| 시리즈 접두사     | {series}                       |
| libs 심링크       | ✅ ../ShortsFactory_Agent/libs |
| 레지스트리 등록   | ✅ registry.json 업데이트      |

### 다음 단계

1. `{agent_dir}/.claude/CLAUDE.md`를 검토하고 채널 특성에 맞게 커스터마이징
2. `{agent_dir}/templates/hooks.json`에 니치별 훅 패턴 추가
3. `/fleet-status`로 등록 확인
4. `/shorts-fleet --channel {id}`로 첫 배치 생산 테스트
```

## 주의사항

- 기존 에이전트(ShortsFactory_Agent, ShortsFactory2_Agent)는 절대 수정하지 않습니다
- 심링크 생성 시 상대 경로를 사용합니다 (`../ShortsFactory_Agent/libs`)
- 중복 id가 있으면 에러를 출력하고 중단합니다
- 생성 후 반드시 `/fleet-status`로 등록 상태를 확인합니다
