# Level: W1-S008 "Iron Wall"

## Meta

- **Author**: Game Designer
- **Date**: 2026-02-25
- **Difficulty**: hard
- **Status**: ready (redesigned with color-layering + bench mechanic)
- **Numerical Bible Ref**: design/reference/numerical-bible.md

## Design Intent

Reintroduce armored cubes with color-layering. Earth cubes form a thin border with HP=2 (armored) at cardinal positions, requiring double hits. Three inner elements (fire, water, wind) are locked behind the armored earth wall. Players must commit heavy earth hero AP to break through the iron wall before accessing the soft interior.

**Bench Pressure (High)**: 4 elements, but earth requires 13 AP for 12 HP (6 armored cubes at HP=2). Non-earth heroes deployed early bench immediately. With 14 heroes and tight earth ratio (1.08), precision is mandatory.

**Armor + Layering Combo**: This level combines the two hardest mechanics -- armored cubes absorb extra hits AND block LoS. An armored earth cube at (0,2) blocks the entire column from the bottom edge until it takes 2 earth hits.

## Difficulty Curve Position (S6)

```
S-curve position: Hard mastery (8/10)
Difficulty levers used:
- [x] Board: 5x6
- [ ] Element variety (4 elements, reduced from 6)
- [x] Armored cubes (6 earth cubes at HP=2)
- [x] Very tight bottleneck ratio (1.08)
- [ ] Slot reduction
```

## Board Layout

```
         Col0  Col1  Col2  Col3  Col4  Col5
Row 4:   [  ]  [  ]  [E2]  [E2]  [  ]  [  ]     <- top
Row 3:   [  ]  [W ]  [Wi]  [F ]  [W ]  [  ]
Row 2:   [E2]  [F ]  [W ]  [Wi]  [F ]  [E2]
Row 1:   [  ]  [Wi]  [F ]  [W ]  [Wi]  [  ]     WAIT -- let me re-check
Row 0:   [  ]  [  ]  [E2]  [E2]  [  ]  [  ]     <- bottom
```

Actually, re-reading the JSON:

```
Row 0: null null earth(2) earth(2) null null
Row 1: null wind fire water wind null
Row 2: earth(2) fire water wind fire earth(2)
Row 3: null water wind fire water null
Row 4: null null earth(2) earth(2) null null
```

Legend: E2=earth(armored HP=2), F=fire, W=water, Wi=wind, [ ]=empty

### Cube Count

- Earth: 6 cubes (all armored HP=2), total HP = 12
- Fire: 4 cubes (HP=1), total HP = 4
- Water: 4 cubes (HP=1), total HP = 4
- Wind: 4 cubes (HP=1), total HP = 4
- Total: 18 cubes, total HP = 24

### Color Layering Analysis

- **Top edge** fires down: Cols 2,3 hit armored earth (row 4). All non-earth blocked.
- **Bottom edge** fires up: Cols 2,3 hit armored earth (row 0). All non-earth blocked.
- **Left edge** fires right: Row 2 hits armored earth (col 0). Other rows = null.
- **Right edge** fires left: Row 2 hits armored earth (col 5). Other rows = null.

Earth armored cubes create a cross-shaped fortress. Inner fire/water/wind cubes at rows 1-3, cols 1-4 are completely shielded. The null corners allow some diagonal-like access, but the core is well protected.

The armored earth cubes each need 2 hits to destroy, making the peeling process slower. Earth heroes must be deployed efficiently.

## Hero Queue (Shuffled)

| #   | Element | AP  | Rationale                         |
| --- | ------- | --- | --------------------------------- |
| 1   | earth   | 3   | Start breaking iron wall          |
| 2   | fire    | 2   | Will bench                        |
| 3   | wind    | 3   | Will bench                        |
| 4   | water   | 2   | Will bench                        |
| 5   | earth   | 3   | Continue breaking                 |
| 6   | wind    | 2   | May find access through null gaps |
| 7   | fire    | 2   | Limited access                    |
| 8   | earth   | 3   | Critical earth clearing           |
| 9   | water   | 3   | Access opening                    |
| 10  | earth   | 2   | Finish earth                      |
| 11  | fire    | 2   | Clean up                          |
| 12  | earth   | 2   | Safety                            |
| 13  | wind    | 2   | Clean up                          |
| 14  | water   | 2   | Final                             |

### Per-Element Balance

| Element   | Cubes | Cube HP       | Hero AP Total  | AP Ratio |
| --------- | ----- | ------------- | -------------- | -------- |
| earth     | 6     | 12 (all HP=2) | 13 (3+3+3+2+2) | 1.08     |
| fire      | 4     | 4             | 6 (2+2+2)      | 1.50     |
| water     | 4     | 4             | 7 (2+3+2)      | 1.75     |
| wind      | 4     | 4             | 7 (3+2+2)      | 1.75     |
| **Total** | 18    | 24            | 33             | 1.38     |

## Parameters

- Rows: 5, Cols: 6
- Conveyor Slots: 6
- Bench Slots: 5
- Gravity: false
- Star Thresholds: 3-star=2800, 2-star=2000, 1-star=0

## Difficulty Metrics (S4)

| Metric                 | Formula                     | Value | Rating            |
| ---------------------- | --------------------------- | ----- | ----------------- |
| **Total Cube HP**      | 24 (12 armored + 12 normal) | 24    |                   |
| **Total Hero AP**      | 33                          | 33    |                   |
| **AP Ratio**           | 33/24                       | 1.38  | Looks generous... |
| **...but Earth Ratio** | 13/12                       | 1.08  | VERY tight        |
| **Element Coverage**   | 4/4                         | 1.0   | Full              |
| **Belt Positions**     | 2\*(5+6)                    | 22    |                   |

**Design Note**: The overall AP ratio (1.38) seems easy, but the earth bottleneck (1.08) is the true difficulty. Earth heroes must waste almost zero AP on misses. The armored cubes double the AP requirement per cube, creating a resource sink that forces careful deployment.

## I/O Balance (S5)

```
Input:                          Output:
+-- Total AP: 33               +-- Destroyable cubes: 18
+-- Element spread: 4 types    +-- Expected score: 1800
+-- Armored HP: 12 extra       +-- Remaining hero bonus: up to 600
```

**Cost-effectiveness**: 1800 / 33 = 54.5 per AP (lowest so far due to armor)

## Expected Solution

1. Earth heroes break armored wall cubes (need 13 AP for 12 HP)
2. Non-earth heroes bench early (expect 3-4 bench fills)
3. As earth opens holes, inner element heroes access fire/water/wind
4. Tight earth ratio means no wasted earth AP -- every earth shot MUST hit an earth cube
5. The 5 bench slots can hold the early non-earth heroes while earth is processed

## JSON Path

`src/data/levels/world-1/stage-008.json`
