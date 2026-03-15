# Session 057 — AuraCalc + TrapCalc + MissCalc

**Date**: 2026-03-13
**Round**: 57

## Modules Created

| Module   | Lines | Tests | Description                                           |
| -------- | ----- | ----- | ----------------------------------------------------- |
| AuraCalc | ~140  | 71    | Passive damage aura, tick-based, element types        |
| TrapCalc | ~170  | 70    | Deployable traps, arm/trigger, lifetime, 5 trap types |
| MissCalc | ~150  | 66    | Evasion/dodge chance, diminishing returns, immunity   |

## Issues & Fixes

1. **AuraCalc test unused imports**: `AuraConfig`, `AuraState` — removed.
2. **TrapCalc test unused import**: `TrapState` — removed.

## Metrics

- **Core modules**: 117
- **Test files**: 116
- **Total tests**: 6,389
- **Build**: ✓
- **Deploy**: ✓ (neon-survivors-tau.vercel.app)
- **Type check**: ✓ clean
