# Level: W1-S006 "Shining Path"

## Meta
- **Author**: Game Designer
- **Date**: 2026-02-25
- **Difficulty**: normal
- **Status**: ready (redesigned with color-layering + bench mechanic)
- **Numerical Bible Ref**: design/reference/numerical-bible.md

## Design Intent
Introduce 5th element (light). Light cubes form a partial border at top, bottom, and center-sides, encasing a 4-element rotated core. The diamond-shaped null pattern at corners creates selective LoS access. Players must manage 5 different hero types, increasing bench pressure.

**Bench Pressure (Medium-High)**: With 5 elements and a shuffled queue, the probability of deploying an inner-element hero (fire/water/earth/wind) before light is cleared is high. Expect 3-4 bench placements in a typical run. Players must track bench count carefully.

## Difficulty Curve Position (S6)
```
S-curve position: Core challenge (6/10)
Difficulty levers used:
- [x] Board: 5x6 (wider)
- [x] Element variety (4 -> 5, introduces light)
- [ ] Armored cubes
- [x] Multiple hero types increase bench risk
- [ ] Slot reduction
```

## Board Layout
```
         Col0  Col1  Col2  Col3  Col4  Col5
Row 4:   [  ]  [L ]  [L ]  [L ]  [L ]  [  ]     <- top
Row 3:   [  ]  [E ]  [Wi]  [F ]  [W ]  [  ]
Row 2:   [L ]  [Wi]  [F ]  [W ]  [E ]  [L ]
Row 1:   [  ]  [W ]  [E ]  [Wi]  [F ]  [  ]     WAIT -- this is wrong
Row 0:   [  ]  [L ]  [L ]  [L ]  [L ]  [  ]     <- bottom
```

Actually let me re-read the JSON I wrote to be accurate:
```
Row 4: null L L L L null
Row 3: null E Wi F W null
Row 2: L Wi F W E L
Row 1: null W E Wi F null -- WAIT, JSON has: null, "earth", "wind", "fire", "water", null
```

Let me re-read the actual JSON.

The JSON grid is:
```
Row 0: [null, "light", "light", "light", "light", null]
Row 1: [null, "fire", "water", "earth", "wind", null]
Row 2: ["light", "wind", "fire", "water", "earth", "light"]
Row 3: [null, "earth", "wind", "fire", "water", null]
Row 4: [null, "light", "light", "light", "light", null]
```

Visual (remember row 0 = bottom):
```
         Col0  Col1  Col2  Col3  Col4  Col5
Row 4:   [  ]  [L ]  [L ]  [L ]  [L ]  [  ]     <- top
Row 3:   [  ]  [E ]  [Wi]  [F ]  [W ]  [  ]
Row 2:   [L ]  [Wi]  [F ]  [W ]  [E ]  [L ]
Row 1:   [  ]  [F ]  [W ]  [E ]  [Wi]  [  ]
Row 0:   [  ]  [L ]  [L ]  [L ]  [L ]  [  ]     <- bottom
```
Legend: F=fire, W=water, E=earth, Wi=wind, L=light, [ ]=empty

### Cube Count
- Light: 10 cubes (top row 4, bottom row 0, sides row 2)
- Fire: 3 cubes (rows 1-3 scattered)
- Water: 3 cubes (rows 1-3 scattered)
- Earth: 3 cubes (rows 1-3 scattered)
- Wind: 3 cubes (rows 1-3 scattered)
- Total: 22 cubes, all HP=1

### Color Layering Analysis
- **Top edge** fires down: Row 4 = light. Inner elements blocked.
- **Bottom edge** fires up: Row 0 = light. Inner elements blocked.
- **Left edge** fires right: Row 2 col 0 = light. Rows 1,3 = null (no cube). Rows 0,4 = null.
- **Right edge** fires left: Row 2 col 5 = light. Same pattern.
- Light cubes form a horizontal barrier at top and bottom, plus side sentinels at row 2.
- Inner elements (fire/water/earth/wind) at rows 1-3 are shielded by light from top/bottom. Side access at rows 1 and 3 has null (no blocking), but those rows start with null (cols 0 and 5).

The 4-element core uses a rotated pattern so no column has the same inner element, requiring varied hero deployment.

## Hero Queue (Shuffled)
| # | Element | AP | Rationale |
|---|---------|-----|-----------|
| 1 | light | 2 | Start clearing light border |
| 2 | fire | 2 | Likely benches (light blocks) |
| 3 | earth | 3 | Likely benches |
| 4 | light | 3 | Continue border |
| 5 | water | 2 | Limited access |
| 6 | wind | 2 | Limited access |
| 7 | light | 2 | More border clearing |
| 8 | fire | 2 | Access opening up |
| 9 | water | 2 | More access |
| 10 | earth | 2 | Clean up |
| 11 | light | 3 | Finish light |
| 12 | wind | 3 | Finish wind |

### Per-Element Balance
| Element | Cubes | Cube HP | Hero AP Total | AP Ratio |
|---------|-------|---------|---------------|----------|
| light | 10 | 10 | 10 (2+3+2+3) | 1.00 |
| fire | 3 | 3 | 4 (2+2) | 1.33 |
| water | 3 | 3 | 4 (2+2) | 1.33 |
| earth | 3 | 3 | 5 (3+2) | 1.67 |
| wind | 3 | 3 | 5 (2+3) | 1.67 |
| **Total** | 22 | 22 | 28 | 1.27 |

## Parameters
- Rows: 5, Cols: 6
- Conveyor Slots: 6
- Bench Slots: 5
- Gravity: false
- Star Thresholds: 3-star=2400, 2-star=1600, 1-star=0

## Difficulty Metrics (S4)
| Metric | Formula | Value | Rating |
|--------|---------|-------|--------|
| **Total Cube HP** | 22 | 22 | |
| **Total Hero AP** | 28 | 28 | |
| **AP Ratio** | 28/22 | 1.27 | Normal |
| **Element Coverage** | 5/5 | 1.0 | Full |
| **Belt Positions** | 2*(5+6) | 22 | |
| **Bottleneck** | light | 1.00 | Tight |

## I/O Balance (S5)
```
Input:                          Output:
+-- Total AP: 28               +-- Destroyable cubes: 22
+-- Element spread: 5 types    +-- Expected score: 2200
+-- Strategy freedom: high     +-- Remaining hero bonus: up to 600
```
**Cost-effectiveness**: 2200 / 28 = 78.6 per AP

## Expected Solution
1. Light heroes peel top/bottom/side border
2. Inner element heroes bench early, then find access as light clears
3. Rotated inner pattern means each edge direction hits different elements
4. Light ratio exactly 1.00 -- every hit must count

## JSON Path
`src/data/levels/world-1/stage-006.json`
