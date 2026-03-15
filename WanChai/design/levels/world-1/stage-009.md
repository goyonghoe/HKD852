# Level: W1-S009 "Gauntlet"

## Meta

- **Author**: Game Designer
- **Date**: 2026-02-25
- **Difficulty**: hard
- **Status**: ready (redesigned with color-layering + bench mechanic)
- **Numerical Bible Ref**: design/reference/numerical-bible.md

## Design Intent

Triple concentric ring design using 6 elements. Dark outer ring, light middle ring, 4-element core (fire, water, earth, wind). This is the definitive color-layering challenge: three complete layers that must be peeled in strict order. Combined with gravity, destroyed cubes collapse and can shift layer positions dynamically.

**Bench Pressure (Very High)**: 6 elements, but only dark heroes can hit the outer ring, and only light heroes can hit the middle ring. All 4 core-element heroes deployed before their layer is accessible will bench. With 16 heroes and 5 bench slots, the player must carefully time deployments. One mistake = game over.

## Difficulty Curve Position (S6)

```
S-curve position: Hard mastery (9/10)
Difficulty levers used:
- [x] Board: 6x6 (largest yet)
- [x] Element variety (all 6 elements)
- [ ] Armored cubes
- [x] Triple concentric layering
- [x] Gravity: true
- [x] Very tight outer layer ratios (both 1.00)
```

## Board Layout

```
         Col0  Col1  Col2  Col3  Col4  Col5
Row 5:   [  ]  [D ]  [D ]  [D ]  [D ]  [  ]     <- top
Row 4:   [D ]  [L ]  [L ]  [L ]  [L ]  [D ]
Row 3:   [  ]  [L ]  [E ]  [Wi]  [L ]  [  ]
Row 2:   [  ]  [L ]  [F ]  [W ]  [L ]  [  ]
Row 1:   [D ]  [L ]  [L ]  [L ]  [L ]  [D ]
Row 0:   [  ]  [D ]  [D ]  [D ]  [D ]  [  ]     <- bottom
```

Legend: D=dark, L=light, F=fire, W=water, E=earth, Wi=wind, [ ]=empty

### Cube Count

- Dark: 12 cubes (outer ring minus corners)
- Light: 12 cubes (middle ring)
- Fire: 1 cube (core)
- Water: 1 cube (core)
- Earth: 1 cube (core)
- Wind: 1 cube (core)
- Total: 28 cubes, all HP=1

### Color Layering Analysis (Triple Concentric)

**Layer 1 (Outer)**: Dark ring at rows 0,5 (top/bottom) and cols 0,5 at rows 1,4.

- Top/bottom edges: dark blocks everything.
- Side edges: dark at rows 1,4 blocks; rows 2,3 = null (some access through sides).

**Layer 2 (Middle)**: Light ring at rows 1,4 inner cols and rows 2,3 at cols 1,4.

- After dark is cleared, light still blocks core elements.
- Light heroes needed before core is accessible.

**Layer 3 (Core)**: 4 elements at (2,2)=fire, (2,3)=water, (3,2)=earth, (3,3)=wind.

- Only accessible after both dark AND light in that line are cleared.
- Requires clearing at least 2 layers of cubes to reach any core cube.

**Gravity Impact**: When lower cubes are destroyed, upper cubes fall, potentially rearranging layers. Players must think about destruction order to avoid creating unfavorable configurations.

## Hero Queue (Shuffled)

| #   | Element | AP  | Rationale                         |
| --- | ------- | --- | --------------------------------- |
| 1   | dark    | 2   | Start outer layer                 |
| 2   | light   | 2   | Will bench (dark blocks)          |
| 3   | fire    | 2   | Will bench (doubly blocked)       |
| 4   | dark    | 3   | Continue outer                    |
| 5   | water   | 2   | Will bench                        |
| 6   | light   | 3   | May still bench                   |
| 7   | earth   | 2   | Will bench                        |
| 8   | dark    | 2   | Continue outer                    |
| 9   | wind    | 2   | Will bench                        |
| 10  | light   | 2   | Some dark cleared, partial access |
| 11  | dark    | 3   | Major outer clearing              |
| 12  | light   | 3   | Access to middle ring             |
| 13  | dark    | 2   | Finish outer                      |
| 14  | light   | 2   | Continue middle                   |
| 15  | fire    | 2   | Core access                       |
| 16  | water   | 2   | Core access                       |

### Per-Element Balance

| Element   | Cubes | Cube HP | Hero AP Total  | AP Ratio |
| --------- | ----- | ------- | -------------- | -------- |
| dark      | 12    | 12      | 12 (2+3+2+3+2) | 1.00     |
| light     | 12    | 12      | 12 (2+3+2+3+2) | 1.00     |
| fire      | 1     | 1       | 4 (2+2)        | 4.00     |
| water     | 1     | 1       | 4 (2+2)        | 4.00     |
| earth     | 1     | 1       | 2              | 2.00     |
| wind      | 1     | 1       | 2              | 2.00     |
| **Total** | 28    | 28      | 36             | 1.29     |

## Parameters

- Rows: 6, Cols: 6
- Conveyor Slots: 6
- Bench Slots: 5
- Gravity: true
- Star Thresholds: 3-star=3000, 2-star=2000, 1-star=0

## Difficulty Metrics (S4)

| Metric               | Formula  | Value | Rating            |
| -------------------- | -------- | ----- | ----------------- |
| **Total Cube HP**    | 28       | 28    |                   |
| **Total Hero AP**    | 36       | 36    |                   |
| **AP Ratio**         | 36/28    | 1.29  | Looks OK...       |
| **Dark Ratio**       | 12/12    | 1.00  | Exactly clearable |
| **Light Ratio**      | 12/12    | 1.00  | Exactly clearable |
| **Element Coverage** | 6/6      | 1.0   | Full              |
| **Belt Positions**   | 2\*(6+6) | 24    |                   |

**CRITICAL DIFFICULTY NOTE**: Both outer layers (dark AND light) are at exactly 1.00 ratio. Zero tolerance for wasted AP on either. This is the hardest non-boss level. The overall ratio of 1.29 is misleading -- it is inflated by the generous core element AP.

## Bench Risk Analysis

In a 16-hero queue with 5 bench slots:

- Heroes #2,3,5,7,9 are likely benches (light, fire, water, earth, wind) = 5 benches
- This exactly fills the bench. Hero #10 (light) MUST find targets or game over.
- After dark heroes #1,4,8 clear some dark, hero #10 (light) should have access.
- RAZOR-THIN margin for bench management.

## I/O Balance (S5)

```
Input:                          Output:
+-- Total AP: 36               +-- Destroyable cubes: 28
+-- Element spread: 6 types    +-- Expected score: 2800
+-- Strategy freedom: very low +-- Remaining hero bonus: up to 800
```

**Cost-effectiveness**: 2800 / 36 = 77.8 per AP

## Expected Solution

1. Dark heroes (#1,4,8,11,13) systematically peel outer ring
2. Light heroes (#6,10,12,14) peel middle ring after dark clears
3. Core heroes (#3,5,7,9 from bench + #15,16) hit core cubes last
4. Gravity causes cascading after lower cubes destroyed -- plan around this
5. Bench fills to exactly 5, then clears as layers open up
6. Perfect play required for both dark and light layers (0 wasted AP)

## JSON Path

`src/data/levels/world-1/stage-009.json`
