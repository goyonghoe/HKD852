# Level: W1-S005 "Gravity Well"

## Meta
- **Author**: Game Designer
- **Date**: 2026-02-25
- **Difficulty**: normal
- **Status**: ready (redesigned with color-layering + bench mechanic)
- **Numerical Bible Ref**: design/reference/numerical-bible.md

## Design Intent
Introduce gravity mechanic with 4-element vertical layering. Wind cubes at the top (visually), earth in the middle barrier, fire/water at the bottom. Gravity causes destroyed cubes to collapse downward, dynamically changing the board and opening new LoS paths. Players learn to think about destruction ORDER -- clearing top cubes first can cascade access to lower cubes.

**Gravity Interaction with Layering**: When wind cubes at top are destroyed, earth cubes above (visually) do NOT fall because gravity in Phaser is "visual bottom = row 0". But if a cube in the middle is destroyed, cubes above it fall down to fill the gap, potentially shuffling the layers.

## Difficulty Curve Position (S6)
```
S-curve position: Core challenge (5/10)
Difficulty levers used:
- [x] Board: 5x5
- [ ] Element variety (stays at 4)
- [ ] Armored cubes
- [x] Gravity: true (new mechanic)
- [ ] Slot reduction
```

## Board Layout
```
         Col0  Col1  Col2  Col3  Col4
Row 4:   [Wi]  [  ]  [Wi]  [  ]  [Wi]     <- top (visual top)
Row 3:   [  ]  [Wi]  [E ]  [Wi]  [  ]
Row 2:   [Wi]  [E ]  [F ]  [E ]  [Wi]
Row 1:   [  ]  [E ]  [W ]  [E ]  [  ]
Row 0:   [F ]  [W ]  [F ]  [W ]  [F ]     <- bottom (visual bottom)
```
Legend: F=fire, W=water, E=earth, Wi=wind, [ ]=empty

### Cube Count
- Wind: 7 cubes (outer/top scattered)
- Earth: 5 cubes (middle barrier)
- Fire: 4 cubes (bottom + center)
- Water: 3 cubes (bottom scattered)
- Total: 19 cubes, all HP=1

### Color Layering Analysis (Vertical)
- **Top edge** fires down: Hits wind at rows 4,3,2. Earth/fire/water heroes blocked.
- **Bottom edge** fires up: Hits fire/water at row 0 directly. Good access for these elements.
- **Left edge** fires right: Mixed -- row 0 = fire (col 0), row 2 = wind (col 0), row 4 = wind (col 0). Other rows have null.
- **Right edge** fires left: Similar pattern.

Bottom row gives direct access to fire/water. Top requires wind clearing first. Gravity adds dynamic re-layering.

## Hero Queue (Shuffled)
| # | Element | AP | Rationale |
|---|---------|-----|-----------|
| 1 | wind | 2 | Start clearing wind layer |
| 2 | fire | 3 | Bottom edge gives direct access |
| 3 | earth | 2 | Limited access, some benching expected |
| 4 | water | 3 | Bottom edge access |
| 5 | wind | 3 | Continue wind clearing |
| 6 | earth | 3 | Gravity may open paths |
| 7 | fire | 2 | Clean up fire |
| 8 | water | 2 | Clean up water |
| 9 | wind | 2 | Finish wind |
| 10 | earth | 2 | Finish earth |

### Per-Element Balance
| Element | Cubes | Cube HP | Hero AP Total | AP Ratio |
|---------|-------|---------|---------------|----------|
| wind | 7 | 7 | 7 (2+3+2) | 1.00 |
| earth | 5 | 5 | 7 (2+3+2) | 1.40 |
| fire | 4 | 4 | 5 (3+2) | 1.25 |
| water | 3 | 3 | 5 (3+2) | 1.67 |
| **Total** | 19 | 19 | 24 | 1.26 |

## Parameters
- Rows: 5, Cols: 5
- Conveyor Slots: 6
- Bench Slots: 5
- Gravity: true
- Star Thresholds: 3-star=2000, 2-star=1200, 1-star=0

## Difficulty Metrics (S4)
| Metric | Formula | Value | Rating |
|--------|---------|-------|--------|
| **Total Cube HP** | 19 | 19 | |
| **Total Hero AP** | 24 | 24 | |
| **AP Ratio** | 24/19 | 1.26 | Normal |
| **Element Coverage** | 4/4 | 1.0 | Full |
| **Belt Positions** | 2*(5+5) | 20 | |
| **Bottleneck** | wind | 1.00 | Tight |

## I/O Balance (S5)
```
Input:                          Output:
+-- Total AP: 24               +-- Destroyable cubes: 19
+-- Element spread: 4 types    +-- Expected score: 1900
+-- Strategy freedom: medium   +-- Remaining hero bonus: up to 600
```
**Cost-effectiveness**: 1900 / 24 = 79.2 per AP

## Expected Solution
1. Wind hero clears some outer wind cubes from top edge
2. Fire/water heroes hit bottom row directly (row 0 is accessible)
3. Gravity collapses cubes as lower ones are destroyed
4. Earth heroes clear middle barrier as gaps open
5. Wind ratio is exactly 1.00 -- every wind hit must count

## JSON Path
`src/data/levels/world-1/stage-005.json`
