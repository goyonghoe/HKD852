# team-kowloon -- 아트디렉터

> SSBL 아트 리소스 파이프라인 및 게임 아트 스펙 관리

## 역할

SSBL(SUPERSTAR THEBLACKLABEL) 프로젝트의 아트 리소스 제작 명세서 작성, 이미지 검증, 데이터 관리를 총괄합니다. 앨범 아트/게임 아트 파이프라인을 운영합니다.

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- 가이드: [Claude Code 공식 가이드](../docs/claude-code-guide/INDEX.md)

## 스킬 목록

| 스킬         | 명령어       | 역할                                      |
| ------------ | ------------ | ----------------------------------------- |
| SSBL CTO     | `/ssbl-cto`  | 전체 파이프라인 총괄 (요청 분석, 팀 배정) |

## 관리 대상 아티스트

- TAEYANG
- JEON SOMI
- MEOVV
- ALLDAY PROJECT

## 프로젝트 구조

```
team-kowloon/
├── 0_organization/        # 조직 구조, 파이프라인 설계
├── 1_human_control/       # 마스터 데이터 (albums, artists JSON)
│   ├── config/            # 설정, 이미지 검증 규칙
│   └── reference_images/  # 레퍼런스 이미지 매핑
├── 2_ai_agents/           # AI 에이전트 작업 영역
├── 3_ai_output/           # AI 생성 결과물 (스펙, 리포트)
├── 4_human_view/          # 최종 검토 영역
├── skills/ssbl-cto/       # CTO 스킬
├── docs/                  # 문서 (아키텍처, 가이드, 프레젠테이션)
└── scripts/               # 명세서 스크립트
```

## 파이프라인 구조

```
1_human_control (입력) --> 2_ai_agents (처리) --> 3_ai_output (결과) --> 4_human_view (검토)
```
