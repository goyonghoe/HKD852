# [SPEC-006A] Hero Grid Level Data for World 1

## Meta
- **Author**: Game Designer
- **Date**: 2026-02-25
- **Status**: implemented
- **Parent Spec**: SPEC-006 (Hero Grid Deployment)

## Summary

`heroGrid` field added to all 10 World 1 stage JSON files. Groups heroes by element into 2-4 columns with peel-order column ordering (outer layers first).

## Rules

1. **Group by element**: Each column = same element (merge when >4 types)
2. **Max 4 columns**: HERO_GRID_MAX_COLS = 4
3. **Peel order**: Outer-layer-first (leftmost) to inner-layer-last (rightmost)
4. **Exact preservation**: Every hero in `heroQueue` appears once in `heroGrid`
5. **heroQueue unchanged**: `heroGrid` is sibling field

## Stage Summary

| Stage | Elements | Cols | Grouping | Heroes |
|-------|----------|------|----------|--------|
| 001 | fire, water | 2 | [water], [fire] | 8 |
| 002 | earth, fire, water | 3 | [earth], [fire], [water] | 8 |
| 003 | earth, water, fire | 3 | [earth], [water], [fire] | 12 |
| 004 | wind, earth, fire, water | 4 | [wind], [fire], [water], [earth] | 10 |
| 005 | wind, fire, earth, water | 4 | [wind], [fire], [water], [earth] | 10 |
| 006 | light+4 inner | 4 | [light], [fire], [water], [earth+wind] | 12 |
| 007 | dark+5 inner | 4 | [dark], [light+fire], [water+earth], [wind] | 16 |
| 008 | earth, fire, wind, water | 4 | [earth], [fire], [wind], [water] | 14 |
| 009 | dark+light+4 core | 4 | [dark], [light], [fire+water], [earth+wind] | 16 |
| 010 | earth+dark+4 core | 4 | [earth], [dark], [light+water], [fire+wind] | 19 |

## Merge Rationale

- **Stage 006**: earth+wind merged (furthest from border, fewest cubes)
- **Stage 007**: light+fire (mid-zone, 3 each), water+earth (rare core, 2 each)
- **Stage 009**: fire+water (both 2, same zone), earth+wind (both 1, same zone)
- **Stage 010**: light+water (both 2, inner ring), fire+wind (both 1, rarest)

## Implementation

JSON files: `src/data/levels/world-1/stage-{001..010}.json`
Insert `heroGrid` after `heroQueue`, before `gravity`.

Validation: hero count and element distribution match exactly between heroQueue and heroGrid.
