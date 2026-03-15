# ShamShuiPo — Neon Survivors

> 사이버펑크 불릿 헤븐 액션 로그라이크. 한 손가락 조이스틱, 자동 공격, Kill→Collect→Upgrade 코어 루프.

## 역할

ShamShuiPo 게임의 설계, 구현, 아트, 오디오, 밸런스, UI를 총괄합니다. 6개 전문 에이전트가 협업하여 게임을 개발합니다.

## Core Loop

```
Kill → Collect → Upgrade (반복)
```

- **세션 길이**: 10분 (한 판)
- **조작**: 한 손가락 조이스틱 (이동만), 공격은 자동
- **핵심 경험**: 적 처치 → XP/아이템 수집 → 레벨업 업그레이드 선택 → 더 강해져서 더 많은 적 처치

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- 가이드: [Claude Code 공식 가이드](../docs/claude-code-guide/INDEX.md)

## 기술 스택

- **엔진**: Phaser 3.90+ (WebGL/Canvas)
- **언어**: TypeScript 5.7+ (strict)
- **빌드**: Vite 6 / **테스트**: Vitest 3
- **배포**: Vercel — https://neon-survivors-tau.vercel.app
- **타겟**: Web → iOS (App Store) → Android (Google Play) → Steam
- **해상도**: 720x1280 (9:16 포트레이트)

## 명령어

```bash
npm install && npm run dev      # 개발 서버
npm run build && npm test       # 빌드 + 테스트
vercel deploy --prod            # 프로덕션 배포
```

## 에이전트 팀 (6명)

| 에이전트         | 역할                            | 모델   | 스킬     |
| ---------------- | ------------------------------- | ------ | -------- |
| game-designer    | 경험/메카닉/레벨/밸런스 설계    | opus   | `/gd-*`  |
| programmer       | 코드 구현, 빌드, 배포           | sonnet | `/pg-*`  |
| art-director     | 텍스처, VFX, 스타일 관리        | sonnet | `/art-*` |
| ui-designer      | 레이아웃, 애니메이션, UX 게이트 | sonnet | `/ui-*`  |
| balance-designer | DPS/경제/난이도/성장곡선 분석   | opus   | `/bal-*` |
| audio-designer   | BGM/SFX 생성, 오디오 믹싱       | sonnet | `/aud-*` |

## 크로스 에이전트 스킬

| 스킬               | 명령어                | 모델  | 역할                      |
| ------------------ | --------------------- | ----- | ------------------------- |
| Design Status Sync | `/design-status-sync` | Haiku | status.json 자동 동기화   |
| Log Mistake        | `/log-mistake`        | Haiku | 실수/교훈 레지스트리 기록 |

## 칸반 (프로젝트 관리)

| 스킬           | 명령어            | 모델   |
| -------------- | ----------------- | ------ |
| Kanban Create  | `/kanban-create`  | Sonnet |
| Kanban Pickup  | `/kanban-pickup`  | Haiku  |
| Kanban Done    | `/kanban-done`    | Haiku  |
| Kanban QA      | `/kanban-qa`      | Opus   |
| Kanban RedTeam | `/kanban-redteam` | Opus   |
| Kanban Status  | `/kanban-status`  | Haiku  |
| Kanban Deploy  | `/kanban-deploy`  | Haiku  |

## 핵심 레퍼런스

- `design/reference/numerical-bible.md` — 수치 설계 바이블
- `design/reference/art-style-guide.md` — 아트 스타일 가이드
- `design/reference/ui-ux-guideline.md` — UI/UX 가이드라인
- `design/reference/about-face-ux-principles.md` — About Face 12원칙 UX 지침
- `design/status.json` — 구현 상태 추적
- `.claude/rules/mistake-registry.md` — 실수 방지 규칙
- `.claude/rules/verification-gates.md` — 배포 전 검증 게이트

## Team Log System

- **로그 디렉토리**: `team-logs/`
- **구조**: 에이전트별 raw 로그 + 요약본 저장
- **Vault 동기화**: 작업 완료 시 `HKD852_Vault/02_Projects/ShamShuiPo/`에 요약 동기화
- **형식**: `team-logs/{agent}-{YYYY-MM-DD}.md` (raw), `team-logs/summary-{YYYY-MM-DD}.md` (요약)
