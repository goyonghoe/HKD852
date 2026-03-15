# Session 041 — PathfindingCalc + WaveScheduleCalc + PlayerProgressionCalc

**Date**: 2026-03-13
**Duration**: ~10 min
**Agent**: programmer

## Changes

### PathfindingCalc (src/core/PathfindingCalc.ts)

- A* pathfinding on tile grid
- 8-directional movement with corner-cutting prevention
- Octile distance heuristic
- Bresenham line-of-sight check
- Path smoothing (remove redundant waypoints)
- World/grid coordinate conversion
- **~55 tests**

### WaveScheduleCalc (src/core/WaveScheduleCalc.ts)

- Full wave schedule generation (10 waves)
- Enemy composition scaling by wave
- Boss waves at wave 5 and 10
- Break periods between waves (skippable)
- Difficulty ramp curve
- 6 enemy types with wave-appropriate distribution
- **~66 tests**

### PlayerProgressionCalc (src/core/PlayerProgressionCalc.ts)

- 5 character presets (kai/mei/punk/cyborg/biker)
- Per-level stat growth with 3 growth types (linear/diminishing/exponential)
- XP system with multi-level-up handling
- Effective DPS, toughness, power level calculations
- Heal/damage with armor reduction
- Stat buff application
- **~90 tests**

### Files Created

- `src/core/PathfindingCalc.ts` + `tests/core/PathfindingCalc.test.ts`
- `src/core/WaveScheduleCalc.ts` + `tests/core/WaveScheduleCalc.test.ts`
- `src/core/PlayerProgressionCalc.ts` + `tests/core/PlayerProgressionCalc.test.ts`

## Metrics

- Type errors: 0
- Tests: 3,520 passed (was 3,309, +211 new)
- Core modules: 79 total
- Test files: 78 total
- Deploy: https://neon-survivors-tau.vercel.app

## Cumulative Session Stats (Rounds 14-41)

- Core modules: 13 → 79 (+66 new modules)
- Tests: 221 → 3,520 (+3,299 new tests)
- Deployments: 28 successful
- All zero type errors
