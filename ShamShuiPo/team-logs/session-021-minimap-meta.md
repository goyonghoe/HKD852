# Session 021 — MinimapCalc + MetaScene Enhancement

**Date**: 2026-03-13
**Duration**: ~8 min
**Agent**: programmer

## Changes

### MinimapCalc (src/core/MinimapCalc.ts)

- `worldToMinimap()`: world-to-screen position mapping with range clamping
- `getEnemyDots()`: enemy/boss dot generation for radar display
- `getPickupDots()`: pickup dot generation
- `getDefaultMinimapConfig()`: 120px radar, 500 range, top-right corner
- **13 tests**

### MetaScene Enhancement

- Added DifficultyScalingCalc import for difficulty label display
- Footer now shows: Total Runs | Best Score | Difficulty level
- Prepared for NG+ loop display

## Metrics

- Type errors: 0
- Tests: 459 passed (was 446, +13 new)
- Core modules: 24 total
- Deploy: https://neon-survivors-tau.vercel.app

## Cumulative Session Stats (Rounds 14-21)

- Core modules: 13 → 24 (+11 new modules)
- Tests: 221 → 459 (+238 new tests)
- Deployments: 8 successful
- All zero type errors
