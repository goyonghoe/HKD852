# Session 027 — RelicCalc + SynergyCalc + ChallengeCalc

**Date**: 2026-03-13
**Duration**: ~8 min
**Agent**: programmer

## Changes

### RelicCalc (src/core/RelicCalc.ts)

- 12 relics across 3 rarity tiers (common/rare/legendary)
- Stat boost, on-kill, on-hit, aura, and passive effect types
- Luck-based drop rolling, slot management
- **42 tests**

### SynergyCalc (src/core/SynergyCalc.ts)

- 8 weapon+passive synergy combos with requirement checking
- Progress tracking (0-1) and bonus accumulation
- Per-weapon synergy lookup
- **29 tests**

### ChallengeCalc (src/core/ChallengeCalc.ts)

- 15-challenge pool (easy/medium/hard) across 7 challenge types
- Deterministic daily (3) and weekly (2) generation via seeded PRNG
- Completion tracking, progress calculation, reward totals
- Auto-reset on date/week change
- **44 tests**

### Files Created

- `src/core/RelicCalc.ts` + `tests/core/RelicCalc.test.ts`
- `src/core/SynergyCalc.ts` + `tests/core/SynergyCalc.test.ts`
- `src/core/ChallengeCalc.ts` + `tests/core/ChallengeCalc.test.ts`

## Metrics

- Type errors: 0
- Tests: 939 passed (was 824, +115 new)
- Core modules: 37 total
- Test files: 36 total
- Deploy: https://neon-survivors-tau.vercel.app

## Cumulative Session Stats (Rounds 14-27)

- Core modules: 13 → 37 (+24 new modules)
- Tests: 221 → 939 (+718 new tests)
- Deployments: 14 successful
- All zero type errors
