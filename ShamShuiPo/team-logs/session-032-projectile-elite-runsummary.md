# Session 032 — ProjectilePatternCalc + EliteEnemyCalc + RunSummaryCalc

**Date**: 2026-03-13
**Duration**: ~8 min
**Agent**: programmer

## Changes

### ProjectilePatternCalc (src/core/ProjectilePatternCalc.ts)

- 7 fire patterns: single, spread, burst, cone, ring, spiral, random
- Spread evenly spaces projectiles in an arc
- Burst staggers speed for depth effect
- Ring covers 360°, spiral adds rotation offset
- Pattern count scaling by weapon level
- **~50 tests**

### EliteEnemyCalc (src/core/EliteEnemyCalc.ts)

- 8 elite modifiers: armored, swift, berserker, shielded, vampiric, splitting, teleporting, explosive
- Combined multiplier stacking for HP/damage/speed/XP/size
- Wave-based elite spawn probability (none at wave 1-3, up to 15% at wave 10+)
- Death effects: explode, split, both
- Split copy generation at 30% HP
- **~60 tests**

### RunSummaryCalc (src/core/RunSummaryCalc.ts)

- Post-run stats aggregation and record comparison
- Reward calculation: coins + XP based on kills/time/bosses/victory
- Grade system (S/A/B/C/D/F) by score thresholds
- Run highlights generation
- Milestone unlock tracking (cumulative stats)
- Serialization/deserialization with validation
- **~92 tests**

### Files Created

- `src/core/ProjectilePatternCalc.ts` + `tests/core/ProjectilePatternCalc.test.ts`
- `src/core/EliteEnemyCalc.ts` + `tests/core/EliteEnemyCalc.test.ts`
- `src/core/RunSummaryCalc.ts` + `tests/core/RunSummaryCalc.test.ts`

## Metrics

- Type errors: 0
- Tests: 1,692 passed (was 1,490, +202 new)
- Core modules: 52 total
- Test files: 51 total
- Deploy: https://neon-survivors-tau.vercel.app

## Cumulative Session Stats (Rounds 14-32)

- Core modules: 13 → 52 (+39 new modules)
- Tests: 221 → 1,692 (+1,471 new tests)
- Deployments: 19 successful
- All zero type errors
