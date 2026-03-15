# Session 017 — DifficultyScaling + CombatStats Calc Modules

**Date**: 2026-03-13
**Duration**: ~8 min
**Agent**: programmer (2 parallel subagents)

## Changes

### DifficultyScalingCalc (src/core/DifficultyScalingCalc.ts)

- `getDifficultyForLoop(loop)`: NG+ multipliers (HP/damage/speed/coins/spawnRate)
- `getEffectiveWaveConfig(minute, loop)`: wave config merged with loop scaling
- `getDifficultyLabel(loop)`: NORMAL → HARD → VERY HARD → NIGHTMARE → HELL → IMPOSSIBLE
- `getEnemyScaling(minute, loop)`: combined wave × loop multipliers
- **21 tests**

### CombatStatsCalc (src/core/CombatStatsCalc.ts)

- `calculateWeaponDps()`: per-weapon DPS with level scaling + damage bonus
- `calculateTotalDps()`: sum of all weapon DPS
- `calculateTTK()`: time-to-kill for given enemy HP
- `calculateSurvivability()`: effective HP, hits-to-kill, survival time
- `calculateBuildSummary()`: full build breakdown
- **23 tests**

## Metrics

- Type errors: 0
- Tests: 321 passed (was 277, +44 new)
- Core modules: 18 total
- Deploy: https://neon-survivors-tau.vercel.app
