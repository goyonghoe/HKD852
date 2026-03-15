# Session 016 — Knockback + Evolution Integration

**Date**: 2026-03-13
**Duration**: ~10 min
**Agent**: programmer

## Changes

### Knockback System (GameScene Integration)

- Enemy knockback on projectile hit using `KnockbackCalc`
- Per-enemy knockback velocity tracking via `knockbackMap`
- Exponential decay applied each frame in `updateEnemies()`
- Knockback respects enemy `knockbackResist` stat (0-1)
- Knockback entries cleaned up on enemy death

### Weapon Evolution System (GameScene Integration)

- `getAvailableEvolutions()` checks eligibility each level-up
- Evolution choices injected as priority into upgrade panel
- Evolution display shows recipe name + description from `EVOLUTIONS` config
- Replaces last standard choice when evolution is available
- Applied as "add new weapon" with evolved weapon ID

### Files Modified

- `src/scenes/GameScene.ts` — imports, knockbackMap field, hit integration, updateEnemies decay, level-up evolution injection, evolution display

## Metrics

- Type errors: 0
- Tests: 277 passed
- Bundle: 1,564 KB (+1 KB from integrations)
- Deploy: https://neon-survivors-tau.vercel.app
