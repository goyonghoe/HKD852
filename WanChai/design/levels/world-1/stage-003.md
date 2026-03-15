# Level: W1-S003 "Tight Quarters"

## Meta

- **Author**: Game Designer
- **Date**: 2026-02-25
- **Difficulty**: normal
- **Status**: ready (redesigned with color-layering + bench mechanic)
- **Numerical Bible Ref**: design/reference/numerical-bible.md

## Design Intent

True concentric 3-ring design: earth outer ring (minus corners), water middle ring, fire core. The purest expression of color-layering. Players must peel layers in order: earth first, then water, finally fire. The null corners provide some diagonal access but the strict layering forces sequential element deployment.

**Bench Pressure (Medium)**: Water and fire heroes deployed before earth clearing will bench. Expected 2 benches. With generous AP headroom (28 AP for 21 HP), even with bench losses the level remains clearable.

## Board Layout

```
         Col0  Col1  Col2  Col3  Col4
Row 4:   [  ]  [E ]  [E ]  [E ]  [  ]     <- top
Row 3:   [E ]  [W ]  [W ]  [W ]  [E ]
Row 2:   [E ]  [W ]  [F ]  [W ]  [E ]
Row 1:   [E ]  [W ]  [W ]  [W ]  [E ]
Row 0:   [  ]  [E ]  [E ]  [E ]  [  ]     <- bottom
```

### Cube Count

- Earth: 12, Water: 8, Fire: 1. Total: 21 cubes, all HP=1.

## Hero Queue (12 heroes, shuffled)

| #   | Element | AP  | Bench?                         |
| --- | ------- | --- | ------------------------------ |
| 1   | earth   | 3   | HITS                           |
| 2   | water   | 2   | BENCHES (earth blocks)         |
| 3   | earth   | 3   | HITS                           |
| 4   | fire    | 2   | BENCHES (earth+water block)    |
| 5   | earth   | 3   | HITS                           |
| 6   | water   | 3   | HITS (earth partially cleared) |
| 7   | earth   | 2   | HITS                           |
| 8   | water   | 2   | HITS                           |
| 9   | fire    | 2   | HITS (layers peeled)           |
| 10  | water   | 2   | HITS                           |
| 11  | earth   | 2   | HITS                           |
| 12  | water   | 2   | HITS                           |

### Per-Element Balance

| Element   | Cubes | HP  | Hero AP | Ratio |
| --------- | ----- | --- | ------- | ----- |
| earth     | 12    | 12  | 13      | 1.08  |
| water     | 8     | 8   | 11      | 1.38  |
| fire      | 1     | 1   | 4       | 4.00  |
| **Total** | 21    | 21  | 28      | 1.33  |

### Bench Tolerance

- Expected benches: 2 (heroes #2, #4). Lost AP: 4.
- Remaining usable AP: 28 - 4 = 24 for 21 HP. Ratio: 1.14. CLEARABLE.
- Max tolerable benches: 3 (6 AP lost -> 22 AP for 21 HP = 1.05). Still clearable.

## Parameters

- Rows: 5, Cols: 5, Conveyor: 6, Bench: 5, Gravity: false
- Stars: 3=2200, 2=1400, 1=0

## JSON Path

`src/data/levels/world-1/stage-003.json`
