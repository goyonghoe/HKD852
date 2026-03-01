# Level: W1-S007 "Dark Curtain"

## Meta
- **Author**: Game Designer
- **Date**: 2026-02-25
- **Difficulty**: hard
- **Status**: ready (redesigned with color-layering + bench mechanic)
- **Numerical Bible Ref**: design/reference/numerical-bible.md

## Design Intent
Introduce all 6 elements. Dark cubes form a partial border (top, bottom, center-sides), creating a "curtain" hiding 5 inner elements. With 6 hero types but only dark clearing the outer layer, bench management becomes critical. Each inner element has doubled AP (ratio 2.00) to survive bench losses.

## Board Layout
```
         Col0  Col1  Col2  Col3  Col4  Col5
Row 4:   [  ]  [D ]  [D ]  [D ]  [D ]  [  ]     <- top
Row 3:   [  ]  [Wi]  [E ]  [L ]  [F ]  [  ]
Row 2:   [D ]  [L ]  [F ]  [W ]  [L ]  [D ]
Row 1:   [  ]  [F ]  [W ]  [E ]  [Wi]  [  ]
Row 0:   [  ]  [D ]  [D ]  [D ]  [D ]  [  ]     <- bottom
```

### Cube Count
Dark: 10, Fire: 3, Water: 2, Earth: 2, Wind: 2, Light: 3. Total: 22, all HP=1.

### LoS Analysis
Rows 1 and 3 have null at cols 0,5 -- inner heroes CAN fire from side edges through these gaps to reach inner cubes without waiting for dark to clear. This provides partial access, reducing bench pressure compared to a fully sealed curtain.

## Hero Queue (16 heroes, shuffled)
| # | Element | AP |
|---|---------|-----|
| 1 | dark | 3 |
| 2 | fire | 2 |
| 3 | light | 2 |
| 4 | dark | 3 |
| 5 | water | 2 |
| 6 | earth | 2 |
| 7 | dark | 2 |
| 8 | wind | 2 |
| 9 | fire | 2 |
| 10 | dark | 2 |
| 11 | light | 2 |
| 12 | water | 2 |
| 13 | fire | 2 |
| 14 | earth | 2 |
| 15 | wind | 2 |
| 16 | light | 2 |

### Per-Element Balance
| Element | Cubes | HP | Hero AP | Ratio |
|---------|-------|----|---------|-------|
| dark | 10 | 10 | 10 | 1.00 |
| fire | 3 | 3 | 6 | 2.00 |
| water | 2 | 2 | 4 | 2.00 |
| earth | 2 | 2 | 4 | 2.00 |
| wind | 2 | 2 | 4 | 2.00 |
| light | 3 | 3 | 6 | 2.00 |
| **Total** | 22 | 22 | 34 | 1.55 |

### Bench Tolerance
- Inner elements have 2.00x AP ratio, so even with 50% bench loss per inner element, each is still clearable.
- Max 5 benches lose 10 AP. Remaining: 34-10 = 24 for 22 HP. Every element still clearable.
- Dark at 1.00 ratio means ZERO dark AP can bench. All 4 dark heroes must find targets.

## Parameters
- Rows: 5, Cols: 6, Conveyor: 6, Bench: 5, Gravity: false
- Stars: 3=2400, 2=1600, 1=0

## JSON Path
`src/data/levels/world-1/stage-007.json`
