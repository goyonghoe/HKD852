# Project WanChai — Phaser 3 Auto-Shooter Survivor

> Vertical auto-shooter survivor set in cyberpunk Hong Kong (NeonSurvivor)

## Tech Stack

- **Engine**: Phaser 3.90+ (WebGL/Canvas)
- **Language**: TypeScript 5.7+ (strict)
- **Build**: Vite 6
- **Testing**: Vitest 3
- **Deploy**: Vercel (https://project-wanchai.vercel.app)
- **Resolution**: 720x1280 (9:16 portrait mobile-first)

## Commands

```bash
npm install      # install deps
npm run dev      # dev server
npm run build    # production build
npm test         # unit tests
vercel deploy --prod  # deploy
```

## Agents

6 specialized agents in `.claude/agents/`:

| Agent | Role | Model | Skills |
|-------|------|-------|--------|
| `game-designer` | Define experience, design mechanics, levels, balance | opus | `/gd-*` (7) |
| `programmer` | Implement specs into code, wiring/playtest checks | opus | `/pg-*` (8) |
| `art-director` | Procedural textures, VFX | opus | `/art-*` (4) |
| `ui-designer` | Layouts, animations, polish, UX gate | opus | `/ui-*` (5) |
| `balance-designer` | DPS/TTK analysis, growth curves, economy sim, difficulty audit | opus | `/bal-*` (6) |
| `audio-designer` | Procedural BGM/SFX, audio mixing, cyberpunk soundscape | opus | `/aud-*` (4) |

Cross-agent: `/design-status-sync` (1), `/log-mistake` (1)

### Kanban (프로젝트 관리)

| Skill | Description | Model |
|-------|-------------|-------|
| `/kanban-create` | 태스크 생성 | opus |
| `/kanban-pickup` | 태스크 시작 (backlog → in_progress) | opus |
| `/kanban-done` | 태스크 완료 (in_progress → done) | opus |
| `/kanban-qa` | CFMC 품질 평가 | opus |
| `/kanban-redteam` | 적대적 리뷰 | opus |
| `/kanban-status` | 현황 조회 (읽기 전용) | opus |
| `/kanban-deploy` | 대시보드 빌드+배포 | opus |

- **데이터**: `WanChai/kanban.json` (단일 진실 소스)
- **대시보드**: https://pmo-kanban.vercel.app
- **파이프라인**: Backlog → In Progress → Done → QA (CFMC 80+) → RedTeam → Final Done
- **토큰 추적**: 태스크별 AI 토큰 사용량 기록 (`token_usage` 필드)
  - `/kanban-done --tokens <input>,<output>,<model>` 로 기록
  - QA/RedTeam 리뷰 시 자동 기록
  - `token_budget` 필드로 월간 예산 설정 가능 (수동)

**Total: 45 skills**

## Key References

- @design/reference/numerical-bible.md
- @design/reference/art-style-guide.md
- @design/reference/ui-ux-guideline.md
- @design/reference/about-face-ux-principles.md
- @design/status.json

## Process Infrastructure

- **Mistake Registry**: `.claude/rules/mistake-registry.md` — 자동 로드, 실수 방지
- **Verification Gates**: `.claude/rules/verification-gates.md` — 코드 변경 후 필수 검증
- **Session Log**: `memory/SESSION_LOG.md` — 세션 체크포인트, 이어하기 지원
- **Sprint Summary**: `memory/SPRINT_SUMMARY.md` — 주간 진행 추적
- `/pg-checkpoint` — 빌드+테스트 검증 + 영구 로그 기록
- `/log-mistake` — 실수/교훈을 레지스트리에 기록
