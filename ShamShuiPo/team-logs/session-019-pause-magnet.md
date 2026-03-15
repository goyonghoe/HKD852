# Session 019 — PauseCalc + MagnetCalc Modules

**Date**: 2026-03-13
**Duration**: ~8 min
**Agent**: programmer (2 parallel subagents)

## Changes

### PauseCalc (src/core/PauseCalc.ts)

- `createPauseState()`: initial pause state
- `pause(state, time)` / `resume(state, time)`: immutable state transitions
- `getEffectiveElapsed()`: total elapsed minus paused time
- `canPause(runPhase)`: phase-aware pause permission
- `getPauseStats()`: analytics (total paused, count, average)
- **18 tests**

### MagnetCalc (src/core/MagnetCalc.ts)

- `getEffectiveMagnetRadius()`: base + passive level + meta bonus
- `getPickupsInRange()`: squared distance filter for pickups
- `calculateMagnetPull()`: fractional pull toward player
- `getMagnetBurstRadius()`: burst multiplier
- `shouldAutoCollect()`: collect threshold detection
- **21 tests**

## Metrics

- Type errors: 0
- Tests: 427 passed (was 388, +39 new)
- Core modules: 22 total
- Deploy: https://neon-survivors-tau.vercel.app
