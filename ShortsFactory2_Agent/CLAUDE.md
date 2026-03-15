# ShortsFactory2_Agent -- 논문쇼츠공장

> 투자 심리/행동경제학 학술 논문 기반 YouTube Shorts 생산 에이전트

## 역할

학술 논문을 발굴하여 30~45초 YouTube Shorts 에피소드로 변환하는 전체 파이프라인을 운영합니다.
채널: "오늘의 논문" (논문맨 @paper-man-xyz)

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- 가이드: [Claude Code 공식 가이드](../docs/claude-code-guide/INDEX.md)

## 스킬 목록

| 스킬              | 명령어             | 모델   | 역할                           |
| ----------------- | ------------------ | ------ | ------------------------------ |
| Paper Factory     | `/paper-factory`   | Sonnet | 일일 파이프라인 오케스트레이터 |
| Paper Mine        | `/paper-mine`      | Sonnet | 논문 발굴 + 스코어링          |
| Paper Script      | `/paper-script`    | Sonnet | 스크립트 + 메타데이터 생성     |
| Paper Render      | `/paper-render`    | Haiku  | 이미지 + TTS + MP4 렌더링     |
| Paper Review      | `/paper-review`    | Opus   | 정책 + 학술 정확성 검증        |
| Paper Translate   | `/paper-translate` | Haiku  | KO->EN/JA 번역                 |
| Paper Upload      | `/paper-upload`    | Haiku  | YouTube 업로드 매니저          |

## 프로젝트 구조

```
ShortsFactory2_Agent/
├── .claude/
│   ├── CLAUDE.md
│   └── skills/paper-*/SKILL.md   # 7개 스킬
├── pipeline/
│   ├── topics/                   # 논문 토픽 YAML
│   ├── scripts/                  # 에피소드 JSON
│   ├── rendered/                 # MP4 결과물
│   ├── queue/                    # 업로드 대기열
│   ├── analytics/                # 업로드 히스토리
│   └── voice_ref/                # TTS 레퍼런스 음성
├── libs/ -> ../ShortsFactory_Agent/libs/  # 공유 렌더링 엔진
├── templates/                    # 언어별 설정
└── monitor/                      # 파이프라인 로거
```

## 파이프라인 흐름

```
/paper-mine -> /paper-script -> /paper-render -> /paper-review -> /paper-upload
     |              |                |               |                |
  논문 발굴    스크립트 생성    MP4 렌더링      품질 검증       업로드 관리
```
