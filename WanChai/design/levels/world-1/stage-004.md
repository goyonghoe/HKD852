# Level: W1-S004 "Split Decision"

## Meta
- **Author**: Game Designer
- **Date**: 2026-02-25
- **Difficulty**: normal
- **Status**: ready (redesigned with color-layering + bench mechanic)
- **Numerical Bible Ref**: design/reference/numerical-bible.md

## Design Intent
Introduce 4th element (wind) with a split-hemisphere layout. Left half: wind exterior shielding fire interior. Right half: earth exterior shielding water interior. Teaches spatial awareness -- the player must recognize which elements are accessible from which belt edges.

**Bench Pressure (Medium)**: Fire heroes can only hit from the left-half edges; water heroes only from the right-half edges. A water hero on the left side of the belt hits wind (no match) and benches. Spatial planning becomes critical.

## Difficulty Curve Position (S6)
```
S-curve position: Core challenge start (4/10)
Difficulty levers used:
- [x] Board increase (5x5 -> 4x6)
- [x] Element variety (3 -> 4)
- [ ] Armored cubes
- [ ] Hero AP reduction
- [ ] Slot reduction
```

## Board Layout
```
         Col0  Col1  Col2  Col3  Col4  Col5
Row 3:   [Wi]  [Wi]  [  ]  [  ]  [E ]  [E ]     <- top
Row 2:   [Wi]  [F ]  [F ]  [W ]  [W ]  [E ]
Row 1:   [Wi]  [F ]  [F ]  [W ]  [W ]  [E ]
Row 0:   [Wi]  [Wi]  [  ]  [  ]  [E ]  [E ]     <- bottom
```
Legend: F=fire, W=water, E=earth, Wi=wind, [ ]=empty

### Cube Count
- Wind: 6 cubes (left border)
- Earth: 6 cubes (right border)
- Fire: 4 cubes (left interior)
- Water: 4 cubes (right interior)
- Total: 20 cubes, all HP=1

### Color Layering Analysis (Hemispheres)
**Left hemisphere** (cols 0-2):
- Left edge fires right: hits wind (col 0) in rows 0-3. Fire heroes blocked.
- Top/bottom edge at cols 0-1: hits wind. Col 2: null.
- Fire cubes at (1,1),(1,2),(2,1),(2,2) only reachable after wind cleared or from the center gap (cols 2-3 have null at rows 0,3).

**Right hemisphere** (cols 3-5):
- Right edge fires left: hits earth (col 5) in rows 0-3. Water heroes blocked.
- Top/bottom edge at cols 4-5: hits earth. Col 3: null.
- Water cubes at (1,3),(1,4),(2,3),(2,4) only reachable after earth cleared or from center gap.

**Center gap** (cols 2-3, rows 0 and 3 are null): creates a corridor where heroes can potentially fire through, but the targets behind the gap depend on the column.

## Hero Queue (Shuffled)
| # | Element | AP | Rationale |
|---|---------|-----|-----------|
| 1 | wind | 2 | Start clearing left border |
| 2 | earth | 3 | Start clearing right border |
| 3 | fire | 2 | Limited access until wind peeled |
| 4 | water | 3 | Limited access until earth peeled |
| 5 | wind | 3 | Continue left border |
| 6 | earth | 2 | Continue right border |
| 7 | fire | 2 | More access as wind clears |
| 8 | water | 2 | More access as earth clears |
| 9 | wind | 2 | Finish wind |
| 10 | earth | 2 | Finish earth |

### Per-Element Balance
| Element | Cubes | Cube HP | Hero AP Total | AP Ratio |
|---------|-------|---------|---------------|----------|
| wind | 6 | 6 | 7 (2+3+2) | 1.17 |
| earth | 6 | 6 | 7 (3+2+2) | 1.17 |
| fire | 4 | 4 | 4 (2+2) | 1.00 |
| water | 4 | 4 | 5 (3+2) | 1.25 |
| **Total** | 20 | 20 | 23 | 1.15 |

## Parameters
- Rows: 4, Cols: 6
- Conveyor Slots: 6
- Bench Slots: 5
- Gravity: false
- Star Thresholds: 3-star=2000, 2-star=1200, 1-star=0

## Difficulty Metrics (S4)
| Metric | Formula | Value | Rating |
|--------|---------|-------|--------|
| **Total Cube HP** | 20 | 20 | |
| **Total Hero AP** | 23 | 23 | |
| **AP Ratio** | 23/20 | 1.15 | Normal |
| **Element Coverage** | 4/4 | 1.0 | Full |
| **Belt Positions** | 2*(4+6) | 20 | |
| **Bottleneck** | fire | 1.00 | Tight |

## I/O Balance (S5)
```
Input:                          Output:
+-- Total AP: 23               +-- Destroyable cubes: 20
+-- Element spread: 4 types    +-- Expected score: 2000
+-- Strategy freedom: medium   +-- Remaining hero bonus: up to 400
```
**Cost-effectiveness**: 2000 / 23 = 87.0 per AP

## Expected Solution
1. Deploy wind/earth heroes early to clear respective borders
2. Fire heroes deploy -- find targets through opened wind gaps on left side
3. Water heroes deploy -- find targets through opened earth gaps on right side
4. Center null gap allows some cross-hemisphere access
5. Tight fire ratio (1.00) means no fire AP can be wasted

## JSON Path
`src/data/levels/world-1/stage-004.json`
