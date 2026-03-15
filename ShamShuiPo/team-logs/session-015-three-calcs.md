# Session 015 — Three Core Calc Modules (Parallel Build)

**Date**: 2026-03-13
**Duration**: ~8 min
**Agent**: programmer (3 parallel subagents)

## Changes

### KnockbackCalc (src/core/KnockbackCalc.ts)

- `calculateKnockback()`: direction away from projectile, force = damage _ 0.5 _ (1 - resist), cap 40px
- `applyKnockbackDecay()`: exponential decay with snap-to-zero threshold
- **19 tests** covering direction, resistance, cap, decay, edge cases

### EvolutionCalc (src/core/EvolutionCalc.ts)

- `getAvailableEvolutions()`: returns all eligible evolution recipes
- `canEvolve()`: check specific weapon evolution eligibility
- `getEvolutionProgress()`: detailed progress for UI display
- **23 tests** covering all 8 evolution recipes, edge cases

### CharacterPassiveCalc (src/core/CharacterPassiveCalc.ts)

- `calculateEffectiveStats()`: base stats + character bonus + passive upgrades + meta bonuses
- `getStartingWeapon()`: character's default weapon
- `getCharacterBonus()`: human-readable bonus info
- **14 tests** covering all 3 characters, passive stacking, meta bonuses

## Metrics

- Type errors: 0
- Tests: 277 passed (was 221, +56 new)
- Bundle: 1,562 KB (unchanged — pure calc modules tree-shake if unused)
- Core modules: 16 total
- Deploy: https://neon-survivors-tau.vercel.app
