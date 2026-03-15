# Level: W1-S002 "Triple Threat"

## Meta

- **Author**: Game Designer
- **Date**: 2026-02-25
- **Difficulty**: easy
- **Status**: ready (redesigned with color-layering + bench mechanic)
- **Numerical Bible Ref**: design/reference/numerical-bible.md

## Design Intent

Introduce 3rd element (earth) and demonstrate clear color-layering. Earth cubes form a cross-shaped border at the cardinal edges, while fire and water cubes are locked in the 2x3 interior. Players learn that deploying fire/water heroes before clearing earth results in bench placements.

**Bench Pressure (Low-Medium)**: A fire hero deployed at position #2 will likely find no targets since earth blocks all LoS to interior fire cubes. The hero completes a full orbit and goes to the bench. This is the player's first intentional bench experience.

## Difficulty Curve Position (S6)

```
S-curve position: Tutorial (2/10)
Difficulty levers used:
- [x] Board increase (4x4 -> 4x5)
- [x] Element variety (2 -> 3)
- [ ] Armored cubes
- [ ] Hero AP reduction
- [ ] Slot reduction
```

## Board Layout

```
         Col0  Col1  Col2  Col3  Col4
Row 3:   [  ]  [  ]  [E ]  [  ]  [  ]     <- top
Row 2:   [E ]  [F ]  [W ]  [F ]  [E ]
Row 1:   [E ]  [W ]  [F ]  [W ]  [E ]
Row 0:   [  ]  [  ]  [E ]  [  ]  [  ]     <- bottom
```

Legend: F=fire, W=water, E=earth, [ ]=empty

### Cube Count

- Earth: 6 cubes (cross-border)
- Fire: 3 cubes (interior)
- Water: 3 cubes (interior)
- Total: 12 cubes, all HP=1

### Color Layering Analysis

- **Top edge** fires down: Col 2 hits earth (row 3). Others hit nothing (null). Fire/water blocked at col 2.
- **Bottom edge** fires up: Col 2 hits earth (row 0). Others hit nothing. Fire/water blocked at col 2.
- **Left edge** fires right: Rows 1-2 hit earth (col 0). Fire/water blocked.
- **Right edge** fires left: Rows 1-2 hit earth (col 4). Fire/water blocked.

Interior fire/water cubes CANNOT be reached until earth at the border positions is cleared. Strong layering for tutorial purposes. However, the null corners at (0,0), (0,1), etc. mean some belt positions have no cubes at all, which is fine for a 12-cube level.

## Hero Queue (Shuffled)

| #   | Element | AP  | Rationale                               |
| --- | ------- | --- | --------------------------------------- |
| 1   | earth   | 2   | Start clearing border                   |
| 2   | fire    | 2   | Likely benches (teaches bench mechanic) |
| 3   | water   | 3   | Likely benches or finds limited access  |
| 4   | earth   | 3   | Continue peeling border                 |
| 5   | fire    | 2   | Earth partially cleared, some access    |
| 6   | water   | 2   | More access as earth clears             |
| 7   | earth   | 2   | Finish earth border                     |
| 8   | fire    | 2   | Clean up remaining fire                 |

### Per-Element Balance

| Element   | Cubes | Cube HP | Hero AP Total | AP Ratio |
| --------- | ----- | ------- | ------------- | -------- |
| earth     | 6     | 6       | 7 (2+3+2)     | 1.17     |
| fire      | 3     | 3       | 6 (2+2+2)     | 2.00     |
| water     | 3     | 3       | 5 (3+2)       | 1.67     |
| **Total** | 12    | 12      | 18            | 1.50     |

## Parameters

- Rows: 4, Cols: 5
- Conveyor Slots: 6
- Bench Slots: 5
- Gravity: false
- Star Thresholds: 3-star=1200, 2-star=800, 1-star=0

## Difficulty Metrics (S4)

| Metric               | Formula  | Value | Rating            |
| -------------------- | -------- | ----- | ----------------- |
| **Total Cube HP**    | 12       | 12    |                   |
| **Total Hero AP**    | 18       | 18    |                   |
| **AP Ratio**         | 18/12    | 1.50  | Generous for easy |
| **Element Coverage** | 3/3      | 1.0   | Full              |
| **Belt Positions**   | 2\*(4+5) | 18    |                   |

## I/O Balance (S5)

```
Input:                          Output:
+-- Total AP: 18               +-- Destroyable cubes: 12
+-- Element spread: 3 types    +-- Expected score: 1200
+-- Strategy freedom: medium   +-- Remaining hero bonus: up to 400
```

**Cost-effectiveness**: 1200 / 18 = 66.7 per AP

## Expected Solution

1. Earth hero #1 clears 2 border earth cubes
2. Fire hero #2 likely benches (teaches bench mechanic)
3. Water hero #3 may also bench
4. Earth hero #4 clears more border, opening gaps
5. Fire hero #5 now has access through cleared earth positions
6. Remaining heroes clean up

## JSON Path

`src/data/levels/world-1/stage-002.json`
