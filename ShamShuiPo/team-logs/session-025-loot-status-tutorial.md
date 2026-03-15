# Session 025 — LootTable Integration + StatusEffectCalc + TutorialCalc

**Date**: 2026-03-13
**Duration**: ~8 min
**Agent**: programmer

## Changes

### LootTableCalc Integration (GameScene)

- ENEMY_LOOT_TABLE constant with 8 entries (common→legendary)
- selectLoot() called in killEnemy for bonus drops
- Wave-gated drops (e.g., bomb at wave 6+, shield at wave 8+)

### StatusEffectCalc (src/core/StatusEffectCalc.ts)

- 6 effect types: burn, freeze, poison, stun, bleed, shield
- Stacking system with per-type max stacks
- `tickEffects()` computes damage/speed modifiers per frame
- `absorb()` for shield damage absorption
- All functions immutable
- **44 tests**

### TutorialCalc (src/core/TutorialCalc.ts)

- 7 tutorial steps with trigger conditions (time, kills, level, etc.)
- First-run detection and show count tracking
- Priority-based hint selection
- `checkTrigger()`, `getNextHint()`, `markCompleted()`
- **34 tests**

### Files Modified

- `src/scenes/GameScene.ts` — loot table integration in killEnemy

### Files Created

- `src/core/StatusEffectCalc.ts` + `tests/core/StatusEffectCalc.test.ts`
- `src/core/TutorialCalc.ts` + `tests/core/TutorialCalc.test.ts`

## Metrics

- Type errors: 0
- Tests: 716 passed (was 638, +78 new)
- Core modules: 31 total
- Test files: 30 total
- Deploy: https://neon-survivors-tau.vercel.app
