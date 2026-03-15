# Session 030 — MapGeneratorCalc + AudioCalc + UIAnimCalc

**Date**: 2026-03-13
**Duration**: ~10 min
**Agent**: programmer

## Changes

### MapGeneratorCalc (src/core/MapGeneratorCalc.ts)

- Procedural map generation with seeded PRNG
- Hazard placement, decoration spawning, pickup zones
- Tile-based map with spawn points
- **38+ tests**

### AudioCalc (src/core/AudioCalc.ts)

- Audio state management: BGM fades, combat intensity
- Stereo panning, pitch variation
- Dynamic mixing based on game state
- **28+ tests**

### UIAnimCalc (src/core/UIAnimCalc.ts)

- 7 easing functions: linear, easeIn, easeOut, easeInOut, bounce, elastic, back
- Animation lifecycle: create, tick, getValue (immutable)
- Number popup system: float, fade, crit scale
- Smooth damp (critically-damped spring)
- Color lerp (per-channel)
- **42 tests**

### Files Created

- `src/core/MapGeneratorCalc.ts` + `tests/core/MapGeneratorCalc.test.ts`
- `src/core/AudioCalc.ts` + `tests/core/AudioCalc.test.ts`
- `src/core/UIAnimCalc.ts` + `tests/core/UIAnimCalc.test.ts`

## Metrics

- Type errors: 0
- Tests: 1,307 passed (was 1,174, +133 new)
- Core modules: 46 total
- Test files: 45 total
- Deploy: https://neon-survivors-tau.vercel.app

## Cumulative Session Stats (Rounds 14-30)

- Core modules: 13 → 46 (+33 new modules)
- Tests: 221 → 1,307 (+1,086 new tests)
- Deployments: 17 successful
- All zero type errors
