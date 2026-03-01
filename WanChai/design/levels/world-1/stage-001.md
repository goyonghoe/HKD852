# Level: W1-S001 "First Steps"

## Meta
- **Author**: Game Designer
- **Date**: 2026-02-25
- **Difficulty**: easy
- **Status**: ready (redesigned with color-layering + bench mechanic)
- **Numerical Bible Ref**: design/reference/numerical-bible.md

## Design Intent
Tutorial level. Teach the player three concepts:
1. Heroes orbit the belt and fire inward at matching-element cubes
2. Non-matching cubes BLOCK line of sight (LoS)
3. Heroes that find no match go to the bench (5 slots; bench full = game over)

**Color Layering (Gentle)**: Water cubes form the outer shell (rows 2-3), fire cubes sit inside (rows 0-1). A fire hero deployed early will struggle to find targets because water cubes block LoS from most edges. Water heroes should go first to peel the shell.

**Bench Introduction**: With only 2 elements and a well-shuffled queue, bench pressure is minimal. Players naturally learn the bench consequence without losing.

## Difficulty Curve Position (S6)
```
S-curve position: Tutorial (1/10) -- gentlest entry
Difficulty levers used:
- [x] Small board (4x4 = 16 belt positions)
- [ ] Element variety increase (2 elements only)
- [ ] Armored cubes
- [ ] Hero AP reduction
- [ ] Slot reduction
```

## Board Layout
```
         Col0  Col1  Col2  Col3
Row 3:   [  ]  [W ]  [W ]  [  ]     <- top (visual top)
Row 2:   [W ]  [W ]  [W ]  [W ]
Row 1:   [W ]  [F ]  [F ]  [W ]
Row 0:   [F ]  [F ]  [F ]  [F ]     <- bottom (visual bottom)
```
Legend: F=fire, W=water, [ ]=empty

### Cube Count
- Fire: 6 cubes (row 0: 4, row 1: 2)
- Water: 8 cubes (row 1: 2, row 2: 4, row 3: 2)
- Total: 14 cubes, all HP=1

### Color Layering Analysis
- **Top edge** (fires down col): first cube hit is water (rows 2-3). Fire heroes miss.
- **Bottom edge** (fires up col): first cube in cols 0,3 is fire (row 0). cols 1,2 = fire (row 0). Fire heroes get direct hits from bottom.
- **Left edge** (fires right across row): row 0 = fire (col 0), row 1 = water (col 0), row 2 = water (col 0), row 3 = empty.
- **Right edge** (fires left across row): row 0 = fire (col 3), row 1 = water (col 3), row 2 = water (col 3), row 3 = empty.

So fire heroes have access primarily from the bottom edge. Water heroes have access from all edges. This teaches layering gently.

## Hero Queue (Shuffled)
| # | Element | AP | Rationale |
|---|---------|-----|-----------|
| 1 | water | 2 | Start clearing outer water |
| 2 | fire | 2 | Bottom-edge fire access |
| 3 | water | 2 | Continue outer shell removal |
| 4 | fire | 2 | More fire clean-up |
| 5 | fire | 2 | Inner fire from opened lanes |
| 6 | water | 2 | Finish water |
| 7 | fire | 2 | Spare/safety |
| 8 | water | 2 | Spare/safety |

## Armored Cubes
None.

## Parameters
- Rows: 4, Cols: 4
- Conveyor Slots: 6
- Bench Slots: 5
- Gravity: false
- Star Thresholds: 3-star=1000, 2-star=600, 1-star=0

## Difficulty Metrics (S4)
| Metric | Formula | Value | Rating |
|--------|---------|-------|--------|
| **Total Cube HP** | 14 x 1 | 14 | |
| **Total Hero AP** | 8 x 2 | 16 | |
| **AP Ratio** | 16 / 14 | 1.14 | Within 1.05-1.3 |
| **Element Coverage** | 2/2 | 1.0 | Full |
| **Theoretical Min AP** | 14 | 14 | |
| **Belt Positions** | 2*(4+4) | 16 | |

### Per-Element Balance
| Element | Cubes | Cube HP | Hero AP Total | AP Ratio |
|---------|-------|---------|---------------|----------|
| fire | 6 | 6 | 8 (4x2) | 1.33 |
| water | 8 | 8 | 8 (4x2) | 1.00 |

## I/O Balance (S5)
```
Input:                          Output:
+-- Total AP: 16               +-- Destroyable cubes: 14
+-- Element spread: 2 types    +-- Expected score: 1400
+-- Strategy freedom: low      +-- Remaining hero bonus: up to 400
```
**Cost-effectiveness**: 1400 / 16 = 87.5 per AP

## Expected Solution
1. Water hero (queue #1) clears outer water from top/side edges
2. Fire hero (queue #2) fires from bottom edge hitting row 0 fires
3. Alternate water/fire to progressively peel layers
4. After water shell removed, fire heroes can also hit from sides
5. Generous AP means some heroes complete orbit with AP remaining

## JSON Path
`src/data/levels/world-1/stage-001.json`
