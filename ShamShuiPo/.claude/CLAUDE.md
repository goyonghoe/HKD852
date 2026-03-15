# Project ShamShuiPo — Neon Survivors

> 사이버펑크 불릿 헤븐 액션 로그라이크. 한 손가락 조이스틱, 자동 공격, Kill→Collect→Upgrade 코어 루프. → App Store / Google Play 출시 목표

> **HTML 산출물 생성 시**: `outputs/templates/`에서 주제에 맞는 템플릿을 Read로 읽고 스타일을 따를 것. Pretendard 15px, 행간 1.8, 한글 중심. 상세: 루트 CLAUDE.md 참조.

## Tech Stack

- **Engine**: Phaser 3.90+ (WebGL/Canvas)
- **Language**: TypeScript 5.7+ (strict)
- **Build**: Vite 6
- **Testing**: Vitest 3
- **Deploy**: Vercel — https://neon-survivors-tau.vercel.app
- **Target**: Web → iOS → Android → Steam
- **Resolution**: 720x1280 (9:16 portrait)

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

| Agent              | Role                                                           | Model  | Skills   |
| ------------------ | -------------------------------------------------------------- | ------ | -------- |
| `game-designer`    | Define experience, design mechanics, levels, balance           | opus   | `/gd-*`  |
| `programmer`       | Implement specs into code, wiring/playtest checks              | sonnet | `/pg-*`  |
| `art-director`     | Procedural textures, VFX, style management                     | sonnet | `/art-*` |
| `ui-designer`      | Layouts, animations, polish, UX gate                           | sonnet | `/ui-*`  |
| `balance-designer` | DPS/TTK analysis, growth curves, economy sim, difficulty audit | opus   | `/bal-*` |
| `audio-designer`   | Procedural BGM/SFX, audio mixing                               | sonnet | `/aud-*` |

Cross-agent: `/design-status-sync`, `/log-mistake`

## Key References

- @design/reference/numerical-bible.md
- @design/reference/art-style-guide.md
- @design/reference/ui-ux-guideline.md
- @design/reference/about-face-ux-principles.md
- @design/status.json

## Process Infrastructure

- **Mistake Registry**: `.claude/rules/mistake-registry.md` — 자동 로드, 실수 방지
- **Verification Gates**: `.claude/rules/verification-gates.md` — 코드 변경 후 필수 검증
- **Architecture Rules**: `.claude/rules/architecture.md` — 코드 구조 규칙
- **Design Principles**: `.claude/rules/design-principles.md` — 게임 디자인 원칙
- **Handoff Protocol**: `.claude/rules/handoff-protocol.md` — 에이전트 간 인수인계

## Team Log System

- **Directory**: `team-logs/` — 에이전트별 raw 로그 + 요약본
- **Format**: `team-logs/{agent}-{YYYY-MM-DD}.md` (raw), `team-logs/summary-{YYYY-MM-DD}.md` (summary)
- **Vault Sync**: 작업 완료 시 `HKD852_Vault/02_Projects/ShamShuiPo/`에 동기화
