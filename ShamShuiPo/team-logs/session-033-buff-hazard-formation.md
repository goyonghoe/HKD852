# Session 033 — BuffDebuffCalc + EnvironmentHazardCalc + FormationCalc

**Date**: 2026-03-13
**Duration**: ~8 min
**Agent**: programmer

## Changes

### BuffDebuffCalc (src/core/BuffDebuffCalc.ts)

- 7 buff types + 6 debuff types with duration management
- Same source refreshes duration; different sources stack multiplicatively
- Max stacking limits (5 buffs, 3 debuffs per type)
- Combined multiplier queries for damage, speed, DoT
- Invincible/silence state checks
- **~55 tests**

### EnvironmentHazardCalc (src/core/EnvironmentHazardCalc.ts)

- 6 hazard types: lava, poison_fog, lightning, ice_field, acid_pool, laser_grid
- Zone-based damage with configurable tick rates
- Point-in-hazard queries, DPS at point calculation
- Warning radius (1.5x) for UI display
- Hazard lifecycle with expiration
- **~55 tests**

### FormationCalc (src/core/FormationCalc.ts)

- 7 formation types: line, v_shape, circle, grid, pincer, ambush, swarm_cloud
- Spawn position generation with rotation support
- Staggered spawn delays for dramatic effect
- Wave-based formation selection via seeded PRNG
- Bounding radius calculation
- **~67 tests**

### Files Created

- `src/core/BuffDebuffCalc.ts` + `tests/core/BuffDebuffCalc.test.ts`
- `src/core/EnvironmentHazardCalc.ts` + `tests/core/EnvironmentHazardCalc.test.ts`
- `src/core/FormationCalc.ts` + `tests/core/FormationCalc.test.ts`

## Metrics

- Type errors: 0
- Tests: 1,878 passed (was 1,692, +186 new)
- Core modules: 55 total
- Test files: 54 total
- Deploy: https://neon-survivors-tau.vercel.app

## Cumulative Session Stats (Rounds 14-33)

- Core modules: 13 → 55 (+42 new modules)
- Tests: 221 → 1,878 (+1,657 new tests)
- Deployments: 20 successful
- All zero type errors
