# Session 028 — WeaponUpgradePathCalc + EnemyAICalc + ParticleCalc

**Date**: 2026-03-13
**Duration**: ~10 min
**Agent**: programmer

## Changes

### WeaponUpgradePathCalc (src/core/WeaponUpgradePathCalc.ts)

- Full upgrade tree for all 8 weapons (levels 1-5 + evolution)
- Evolution requirements lookup from EVOLUTIONS config
- DPS comparison between weapons at any level
- Weapon tier naming (basic→max)
- **35 tests**

### EnemyAICalc (src/core/EnemyAICalc.ts)

- 7 AI behaviors: chase, orbit, zigzag, charge, retreat, strafe, swarm
- Charge has 3-phase cycle: windup (0.3x) → dash (2x) → pause
- Auto behavior switching on low HP (retreat) or proximity
- Enemy-type to behavior mapping for all 9 enemy types
- **52 tests**

### ParticleCalc (src/core/ParticleCalc.ts)

- 7 particle effects: explosion, hit_spark, death_burst, xp_collect, level_up, heal, crit_flash
- Deterministic generation via mulberry32 PRNG
- Gravity, fade, shrink calculations per frame
- Performance-capped particle merging
- **31 tests**

### Files Created

- `src/core/WeaponUpgradePathCalc.ts` + `tests/core/WeaponUpgradePathCalc.test.ts`
- `src/core/EnemyAICalc.ts` + `tests/core/EnemyAICalc.test.ts`
- `src/core/ParticleCalc.ts` + `tests/core/ParticleCalc.test.ts`

## Metrics

- Type errors: 0
- Tests: 1,057 passed (was 939, +118 new) — **CROSSED 1,000 TESTS!**
- Core modules: 40 total
- Test files: 39 total
- Deploy: https://neon-survivors-tau.vercel.app

## Cumulative Session Stats (Rounds 14-28)

- Core modules: 13 → 40 (+27 new modules)
- Tests: 221 → 1,057 (+836 new tests)
- Deployments: 15 successful
- All zero type errors
