---
paths:
  - 'src/**/*.ts'
---

# Architecture Rules

- `src/core/` = pure TypeScript. **No Phaser imports.** Must be testable without game engine.
- `src/scenes/` = Phaser rendering layer only. No game logic here.
- Communication between core and scenes via `EventBus` pattern.
- 16:9 landscape (1280x720 base resolution).
- All balance constants in `src/config/balance.ts` — no magic numbers in logic.
- Color hex literals must come from `src/config/colors.ts` — never hardcode.
