# Session 035 — QuestCalc + TalentTreeCalc + ArenaCalc

**Date**: 2026-03-13
**Duration**: ~10 min
**Agent**: programmer

## Changes

### QuestCalc (src/core/QuestCalc.ts)

- 9 quest types: kill_count, kill_type, survive_time, reach_level, collect_coins, no_damage, use_ability, combo_chain, boss_kill
- Procedural quest generation based on wave + seed
- Progress tracking, completion detection, reward claiming
- Quest difficulty classification
- **~70 tests**

### TalentTreeCalc (src/core/TalentTreeCalc.ts)

- 20 talents across 4 categories (offense/defense/utility/special)
- Prerequisite system for advanced talents
- Variable costs per level
- Refund (single/all), stat aggregation
- Serialization/deserialization
- **~80 tests**

### ArenaCalc (src/core/ArenaCalc.ts)

- 3 arena shapes: rectangle, circle, hexagon
- Spawn zones, safe zones, obstacles
- Boundary checks (clamp, distance-to-border, isNear)
- Procedural arena generation scaling with wave
- Arena shrinking mechanic for late-game pressure
- **~62 tests**

### Files Created

- `src/core/QuestCalc.ts` + `tests/core/QuestCalc.test.ts`
- `src/core/TalentTreeCalc.ts` + `tests/core/TalentTreeCalc.test.ts`
- `src/core/ArenaCalc.ts` + `tests/core/ArenaCalc.test.ts`

## Metrics

- Type errors: 0
- Tests: 2,292 passed (was 2,080, +212 new)
- Core modules: 61 total
- Test files: 60 total
- Deploy: https://neon-survivors-tau.vercel.app

## Cumulative Session Stats (Rounds 14-35)

- Core modules: 13 → 61 (+48 new modules)
- Tests: 221 → 2,292 (+2,071 new tests)
- Deployments: 22 successful
- All zero type errors
