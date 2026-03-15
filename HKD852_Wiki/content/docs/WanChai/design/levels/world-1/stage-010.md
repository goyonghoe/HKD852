# Level: W1-S010 "Final Stand"

## Meta

- **Author**: Game Designer
- **Date**: 2026-02-25
- **Difficulty**: boss
- **Status**: ready (redesigned with color-layering + bench mechanic)
- **Numerical Bible Ref**: design/reference/numerical-bible.md

## Design Intent

Boss level combining ALL difficulty mechanics: triple concentric layering, armored outer cubes, all 6 elements, and the largest board (6x7). Earth armored wall (HP=2) surrounds dark curtain, which surrounds the light+core interior. Players must master every mechanic from stages 1-9 to clear this gauntlet.

**Boss Philosophy**: The AP ratios for earth (1.06) and dark (1.00) are the tightest in the game. Max tolerable bench: 3 heroes. The queue alternates earth/dark with inner elements to create controlled bench pressure without game-over spirals.

## Board Layout

```
         Col0  Col1  Col2  Col3  Col4  Col5  Col6
Row 5:   [  ]  [  ]  [E2]  [E2]  [E2]  [  ]  [  ]     <- top
Row 4:   [  ]  [D ]  [D ]  [D ]  [D ]  [D ]  [  ]
Row 3:   [E ]  [D ]  [W ]  [Wi]  [W ]  [D ]  [E ]
Row 2:   [E ]  [D ]  [L ]  [F ]  [L ]  [D ]  [E ]
Row 1:   [  ]  [D ]  [D ]  [D ]  [D ]  [D ]  [  ]
Row 0:   [  ]  [  ]  [E2]  [E2]  [E2]  [  ]  [  ]     <- bottom
```

### Cube Count

- Earth: 10 cubes (6 armored HP=2 at rows 0,5 + 4 normal at rows 2,3 sides). Total HP: 16.
- Dark: 14 cubes (rows 1,4 full + rows 2,3 cols 1,5). Total HP: 14.
- Light: 2 cubes. Total HP: 2.
- Fire: 1 cube. Total HP: 1.
- Water: 2 cubes. Total HP: 2.
- Wind: 1 cube. Total HP: 1.
- **Grand Total**: 30 cubes, 36 HP.

### Triple Layering

1. **Armored Earth Wall** (outer): Rows 0,5 (cols 2-4, HP=2) + rows 2,3 (cols 0,6, HP=1)
2. **Dark Curtain** (middle): Rows 1,4 (cols 1-5) + rows 2,3 (cols 1,5)
3. **Light + Core** (inner): Light at (2,2),(2,4). Fire at (2,3). Water at (3,2),(3,4). Wind at (3,3).

## Hero Queue (19 heroes)

| #   | Element | AP  |
| --- | ------- | --- |
| 1   | earth   | 3   |
| 2   | dark    | 3   |
| 3   | fire    | 2   |
| 4   | earth   | 3   |
| 5   | light   | 2   |
| 6   | dark    | 2   |
| 7   | water   | 2   |
| 8   | earth   | 2   |
| 9   | dark    | 2   |
| 10  | wind    | 2   |
| 11  | earth   | 3   |
| 12  | dark    | 3   |
| 13  | earth   | 2   |
| 14  | light   | 2   |
| 15  | dark    | 2   |
| 16  | earth   | 2   |
| 17  | water   | 2   |
| 18  | dark    | 2   |
| 19  | earth   | 2   |

### Per-Element Balance

| Element   | Cubes | HP  | Hero AP | Ratio |
| --------- | ----- | --- | ------- | ----- |
| earth     | 10    | 16  | 17      | 1.06  |
| dark      | 14    | 14  | 14      | 1.00  |
| light     | 2     | 2   | 4       | 2.00  |
| fire      | 1     | 1   | 2       | 2.00  |
| water     | 2     | 2   | 4       | 2.00  |
| wind      | 1     | 1   | 2       | 2.00  |
| **Total** | 30    | 36  | 43      | 1.19  |

### Bench Tolerance

- Expected benches: 2-3 (fire #3, water #7, possibly light #5 or wind #10)
- 3 benches (6 AP lost): 43-6 = 37 AP for 36 HP = 1.03. BARELY clearable.
- 4 benches (8 AP lost): 43-8 = 35 AP for 36 HP = 0.97. UNCLEARABLE.
- The queue places earth/dark heroes frequently to maintain clearing progress.
- Earth #1 clears side earth cubes, opening dark access for #2.
- This prevents catastrophic bench cascades.

### Critical Path

1. Earth heroes (#1,4,8,11,13,16,19) clear armored wall = 17 AP for 16 HP
2. Dark heroes (#2,6,9,12,15,18) clear dark curtain = 14 AP for 14 HP
3. Inner heroes (#3,5,7,10,14,17) clear core = 12 AP for 6 HP (generous headroom)
4. Earth and dark must alternate efficiently to prevent bench overflow

## Parameters

- Rows: 6, Cols: 7, Conveyor: 6, Bench: 5, Gravity: false
- Stars: 3=3400, 2=2400, 1=0

## JSON Path

`src/data/levels/world-1/stage-010.json`
