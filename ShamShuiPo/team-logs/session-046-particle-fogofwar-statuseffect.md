# Session 046 — ParticleEmitterCalc + FogOfWarCalc + StatusEffectCalc

**Date**: 2026-03-13
**Round**: 46

## Modules Created/Fixed

| Module              | Lines | Tests | Description                                                   |
| ------------------- | ----- | ----- | ------------------------------------------------------------- |
| ParticleEmitterCalc | ~315  | 72    | 6 presets, custom presets, emit/tick/clear, gravity, fade     |
| FogOfWarCalc        | ~252  | 65    | Hidden/explored/visible grid, reveal radius, Bresenham LOS    |
| StatusEffectCalc    | ~297  | 68    | 10 status types, immunities, tick damage, movement multiplier |

## Issues & Fixes

1. **ParticleEmitterCalc rewrite**: Background agent rewrote source with different API (ParticleState instead of EmitterState, tickParticles instead of tickEmitter). Test file also rewritten by agent. Fixed unused `ParticleState` type import and unused `t` variable.
2. **FogOfWarCalc unused import**: Removed unused `FogState` type import in test.
3. **StatusEffectCalc test complete rewrite**: Agent-generated test used entirely wrong API (`createEffect`, `applyEffect`, `tickEffects`, `removeEffect`, `hasEffect`, `getEffectDuration`, `getDefaultDuration`, `absorb`, `EffectType`). Source exports: `createStatusState`, `applyStatus`, `tickStatus`, `removeStatus`, `clearAllStatus`, `hasStatus`, etc. Rewrote entire 68-test file.

## Metrics

- **Test files**: 90
- **Total tests**: 4,512
- **Build**: ✓
- **Deploy**: ✓ (neon-survivors-tau.vercel.app)
- **Type check**: ✓ clean
