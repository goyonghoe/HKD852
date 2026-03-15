# Session 031 — InventoryCalc + ShopCalc + CritCalc

**Date**: 2026-03-13
**Duration**: ~8 min
**Agent**: programmer

## Changes

### InventoryCalc (src/core/InventoryCalc.ts)

- Weapon and passive slot management (configurable max 6 each)
- Add/remove/upgrade/evolve weapons and passives
- Duplicate prevention, max level 5 cap
- Slot availability queries
- **~55 tests**

### ShopCalc (src/core/ShopCalc.ts)

- In-run shop with procedural offerings via mulberry32 PRNG
- Rarity distribution scales with player level (4 tiers)
- Purchase, reroll (exponential cost), discount system
- Item pool: weapons, passives, heal, reroll tokens
- **~62 tests**

### CritCalc (src/core/CritCalc.ts)

- Crit chance/damage calculation with bonus system
- Pity system: +2% per non-crit after 3 consecutive misses (max +20%)
- Crit tier classification (none/low/medium/high/hyper)
- Streak tracking and crit rate statistics
- **~66 tests**

### Files Created

- `src/core/InventoryCalc.ts` + `tests/core/InventoryCalc.test.ts`
- `src/core/ShopCalc.ts` + `tests/core/ShopCalc.test.ts`
- `src/core/CritCalc.ts` + `tests/core/CritCalc.test.ts`

## Metrics

- Type errors: 0
- Tests: 1,490 passed (was 1,307, +183 new)
- Core modules: 49 total
- Test files: 48 total
- Deploy: https://neon-survivors-tau.vercel.app

## Cumulative Session Stats (Rounds 14-31)

- Core modules: 13 → 49 (+36 new modules)
- Tests: 221 → 1,490 (+1,269 new tests)
- Deployments: 18 successful
- All zero type errors
