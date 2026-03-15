# Session 060 — ScreenShakeCalc + ReviveCalc + AttackSpeedCalc

**Date**: 2026-03-13
**Round**: 60

## Modules Created

| Module          | Lines | Tests | Description                                         |
| --------------- | ----- | ----- | --------------------------------------------------- |
| ScreenShakeCalc | ~140  | 67    | Screen shake intensity, exponential decay, combine  |
| ReviveCalc      | ~160  | 78    | Extra lives, revive HP%, invincibility frames       |
| AttackSpeedCalc | ~170  | 72    | Attack speed scaling, linear/mult/diminishing modes |

## Issues & Fixes

1. **ScreenShakeCalc test unused variable**: `rng` declared but inline lambda used instead — removed.

## Metrics

- **Core modules**: 126
- **Test files**: 125
- **Total tests**: 7,037
- **Build**: ✓
- **Deploy**: ✓ (neon-survivors-tau.vercel.app)
- **Type check**: ✓ clean

## Milestone

Crossed **7,000 tests** this round!
