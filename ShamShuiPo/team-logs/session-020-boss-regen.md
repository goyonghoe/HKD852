# Session 020 — Boss Phase Integration + RegenCalc

**Date**: 2026-03-13
**Duration**: ~8 min
**Agent**: programmer

## Changes

### Boss Phase Integration (GameScene)

- Imported `getBossPhase()` from BossPhaseCalc
- Boss enemies now have phase-dependent speed multiplier (1.0 → 1.2 → 1.5)
- Boss enemies now deal phase-dependent damage (1.0x → 1.3x → 1.8x)
- Phase transitions based on HP thresholds

### RegenCalc (src/core/RegenCalc.ts)

- `getRegenRate()`: passive level + bonus regen
- `calculateRegenTick()`: HP regen per frame, capped at maxHp
- `getRegenEfficiency()`: 0-1 utility ratio
- `getTimeToFullHp()`: seconds to full HP
- **19 tests**

### Files Modified

- `src/scenes/GameScene.ts` — boss phase speed/damage modifiers in updateEnemies

## Metrics

- Type errors: 0
- Tests: 446 passed (was 427, +19 new)
- Core modules: 23 total
- Deploy: https://neon-survivors-tau.vercel.app
