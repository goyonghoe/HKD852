# Project WanChai — Phaser 3 Puzzle Game

> Circular conveyor puzzle with element matching

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

5 specialized agents in `.claude/agents/`:

| Agent | Role | Model | Skills |
|-------|------|-------|--------|
| `game-designer` | Define experience, design mechanics, levels, balance | opus | `/gd-*` (7) |
| `programmer` | Implement specs into code, wiring/playtest checks | opus | `/pg-*` (8) |
| `art-director` | Procedural textures, VFX | opus | `/art-*` (4) |
| `ui-designer` | Layouts, animations, polish, UX gate | opus | `/ui-*` (5) |
| `balance-designer` | DPS/TTK analysis, growth curves, economy sim, difficulty audit | opus | `/bal-*` (6) |

Cross-agent: `/design-status-sync` (1), `/log-mistake` (1)
**Total: 34 skills**

## Key References

- @design/reference/numerical-bible.md
- @design/reference/art-style-guide.md
- @design/reference/ui-ux-guideline.md
- @design/status.json

## Process Infrastructure

- **Mistake Registry**: `.claude/rules/mistake-registry.md` — 자동 로드, 실수 방지
- **Verification Gates**: `.claude/rules/verification-gates.md` — 코드 변경 후 필수 검증
- **Session Log**: `memory/SESSION_LOG.md` — 세션 체크포인트, 이어하기 지원
- **Sprint Summary**: `memory/SPRINT_SUMMARY.md` — 주간 진행 추적
- `/pg-checkpoint` — 빌드+테스트 검증 + 영구 로그 기록
- `/log-mistake` — 실수/교훈을 레지스트리에 기록
