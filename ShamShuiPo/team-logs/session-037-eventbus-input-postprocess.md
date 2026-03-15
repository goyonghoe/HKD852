# Session 037 — EventBusCalc + InputCalc + PostProcessCalc

**Date**: 2026-03-13
**Duration**: ~10 min
**Agent**: programmer

## Changes

### EventBusCalc (src/core/EventBusCalc.ts)

- 13 game event types with type-safe handlers
- Subscribe/unsubscribe, once (auto-remove), batch emit
- Event history with configurable limit
- Pause/resume with event queuing
- **~65 tests**

### InputCalc (src/core/InputCalc.ts)

- Joystick input normalization with dead zone
- Left/right handed positioning
- Swipe gesture detection and classification
- Angle/distance utilities, input smoothing
- **~55 tests**

### PostProcessCalc (src/core/PostProcessCalc.ts)

- Zoom pulse, chromatic aberration, vignette, slow motion, color grading
- Timed effects with easeOut decay
- Damage flash auto-vignette based on HP
- Kill streak visual escalation
- **~100 tests**

### Files Created

- `src/core/EventBusCalc.ts` + `tests/core/EventBusCalc.test.ts`
- `src/core/InputCalc.ts` + `tests/core/InputCalc.test.ts`
- `src/core/PostProcessCalc.ts` + `tests/core/PostProcessCalc.test.ts`

## Metrics

- Type errors: 0
- Tests: 2,699 passed (was 2,479, +220 new)
- Core modules: 67 total
- Test files: 66 total
- Deploy: https://neon-survivors-tau.vercel.app

## Cumulative Session Stats (Rounds 14-37)

- Core modules: 13 → 67 (+54 new modules)
- Tests: 221 → 2,699 (+2,478 new tests)
- Deployments: 24 successful
- All zero type errors
