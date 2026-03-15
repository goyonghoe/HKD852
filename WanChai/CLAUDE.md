# WanChai -- 게임 프로젝트 (NeonSurvivor)

> 사이버펑크 홍콩 배경 세로형 오토슈터 서바이버 (Phaser 3)

## 역할

WanChai(NeonSurvivor) 게임의 설계, 구현, 아트, 오디오, 밸런스, UI를 총괄합니다. 6개 전문 에이전트가 협업하여 게임을 개발합니다.

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- 가이드: [Claude Code 공식 가이드](../docs/claude-code-guide/INDEX.md)

## 기술 스택

- **엔진**: Phaser 3.90+ (WebGL/Canvas)
- **언어**: TypeScript 5.7+ (strict)
- **빌드**: Vite 6 / **테스트**: Vitest 3
- **배포**: Vercel (https://project-wanchai.vercel.app)
- **해상도**: 1280x720 (16:9 랜드스케이프)

## 명령어

```bash
npm install && npm run dev      # 개발 서버
npm run build && npm test       # 빌드 + 테스트
vercel deploy --prod            # 프로덕션 배포
```

## 에이전트 팀 (6명)

| 에이전트           | 역할                           | 모델   | 스킬         |
| ------------------ | ------------------------------ | ------ | ------------ |
| game-designer      | 경험/메카닉/레벨/밸런스 설계   | opus   | `/gd-*` (7)  |
| programmer         | 코드 구현, 빌드, 배포          | sonnet | `/pg-*` (11) |
| art-director       | 텍스처, VFX, 스타일 관리       | sonnet | `/art-*` (4) |
| ui-designer        | 레이아웃, 애니메이션, UX 게이트 | sonnet | `/ui-*` (5)  |
| balance-designer   | DPS/경제/난이도/성장곡선 분석  | opus   | `/bal-*` (6) |
| audio-designer     | BGM/SFX 생성, 오디오 믹싱      | sonnet | `/aud-*` (4) |

## 크로스 에이전트 스킬

| 스킬                 | 명령어                | 모델   | 역할                         |
| -------------------- | --------------------- | ------ | ---------------------------- |
| Design Status Sync   | `/design-status-sync` | Haiku  | status.json 자동 동기화      |
| Log Mistake          | `/log-mistake`        | Haiku  | 실수/교훈 레지스트리 기록    |
| Model Audit          | `/model-audit`        | Haiku  | 모델 배분 감사               |
| WanChai Sprint       | `/wanchai-sprint`     | Sonnet | Agent Teams 자율 스프린트    |

## 칸반 (프로젝트 관리)

| 스킬             | 명령어            | 모델  |
| ---------------- | ----------------- | ----- |
| Kanban Create    | `/kanban-create`  | Sonnet |
| Kanban Pickup    | `/kanban-pickup`  | Haiku |
| Kanban Done      | `/kanban-done`    | Haiku |
| Kanban QA        | `/kanban-qa`      | Opus  |
| Kanban RedTeam   | `/kanban-redteam` | Opus  |
| Kanban Status    | `/kanban-status`  | Haiku |
| Kanban Deploy    | `/kanban-deploy`  | Haiku |

## QA 자동화 (코드 분석 기반)

| 스킬             | 명령어            | 모델   | 역할                              |
| ---------------- | ----------------- | ------ | --------------------------------- |
| QA Smoke         | `/qa-smoke`       | Haiku  | 빌드+테스트+타입 원커맨드 검증    |
| QA Type          | `/qa-type`        | Sonnet | any/assertion/미사용 코드 탐지    |
| QA Balance       | `/qa-balance`     | Sonnet | 밸런스 수치 범위+매직넘버 검증    |
| QA Regression    | `/qa-regression`  | Sonnet | 변경 파일 영향도+배선 분석        |
| QA Spec          | `/qa-spec`        | Opus   | 기획서 ↔ 코드 정합성 체크         |
| QA Report        | `/qa-report`      | Sonnet | 전체 QA 결과 HTML 대시보드        |

**총 스킬: 52개**

## 핵심 레퍼런스

- `design/reference/numerical-bible.md` -- 수치 설계 바이블
- `design/reference/art-style-guide.md` -- 아트 스타일 가이드
- `design/reference/ui-ux-guideline.md` -- UI/UX 가이드라인
- `design/resource-inventory.md` -- CraftPix 그래픽 리소스 인벤토리 (157팩, 14,975파일, 12카테고리)
- `design/status.json` -- 구현 상태 추적
- `.claude/rules/mistake-registry.md` -- 실수 방지 규칙
- `.claude/rules/verification-gates.md` -- 배포 전 검증 게이트
