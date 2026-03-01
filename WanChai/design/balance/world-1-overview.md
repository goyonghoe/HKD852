# Balance: World 1 Overview (Color-Layered Redesign)

## Meta
- **Author**: Game Designer
- **Date**: 2026-02-25
- **Status**: ready
- **Numerical Bible Ref**: design/reference/numerical-bible.md

## Design Philosophy: Color-Layered Enemies + Bench Mechanic

All 10 levels have been redesigned around two core principles:
1. **Color Layering**: Outer cubes of one element block LoS to inner cubes of different elements. Players must peel layers in order.
2. **Bench Mechanic**: Heroes that complete a full orbit without hitting any matching target go to the bench (5 slots). Bench full = game over.

These two mechanics interact: deploying an inner-element hero before the outer layer is cleared results in a bench placement. Queue management becomes a core strategic skill.

---

## Cross-Level Balance Sheet

### Master Comparison Table

| Stage | Name | Diff | Board | Elements | Cubes | Total HP | Heroes | Total AP | Ratio | Bottleneck | Gravity | Armor |
|-------|------|------|-------|----------|-------|----------|--------|----------|-------|------------|---------|-------|
| 1 | First Steps | easy | 4x4 | 2 | 14 | 14 | 8 | 16 | 1.14 | W 1.00 | no | no |
| 2 | Triple Threat | easy | 4x5 | 3 | 12 | 12 | 8 | 18 | 1.50 | E 1.17 | no | no |
| 3 | Tight Quarters | normal | 5x5 | 3 | 21 | 21 | 12 | 28 | 1.33 | E 1.08 | no | no |
| 4 | Split Decision | normal | 4x6 | 4 | 20 | 20 | 10 | 23 | 1.15 | F 1.00 | no | no |
| 5 | Gravity Well | normal | 5x5 | 4 | 19 | 19 | 10 | 24 | 1.26 | Wi 1.00 | yes | no |
| 6 | Shining Path | normal | 5x6 | 5 | 22 | 22 | 12 | 28 | 1.27 | L 1.00 | no | no |
| 7 | Dark Curtain | hard | 5x6 | 6 | 22 | 22 | 16 | 34 | 1.55 | D 1.00 | no | no |
| 8 | Iron Wall | hard | 5x6 | 4 | 18 | 24 | 14 | 33 | 1.38 | E 1.08 | no | yes |
| 9 | Gauntlet | hard | 6x6 | 6 | 28 | 28 | 16 | 36 | 1.29 | D/L 1.00 | yes | no |
| 10 | Final Stand | boss | 6x7 | 6 | 30 | 36 | 19 | 43 | 1.19 | D 1.00 | no | yes |

### Layer Count Progression

| Stage | Layers | Outer Element | Middle Element | Core Elements |
|-------|--------|--------------|----------------|---------------|
| 1 | 1.5 | water (partial) | -- | fire |
| 2 | 1 | earth (cross) | -- | fire, water |
| 3 | 3 | earth (ring) | water (ring) | fire (center) |
| 4 | 2 (split) | wind/earth (hemispheres) | -- | fire, water |
| 5 | 2 (vertical) | wind (top) | earth (middle) | fire, water (bottom) |
| 6 | 2 | light (border) | -- | fire, water, earth, wind |
| 7 | 2 | dark (border) | -- | fire, water, earth, wind, light |
| 8 | 2 (armored) | earth HP=2 (cross) | -- | fire, water, wind |
| 9 | 3 | dark (ring) | light (ring) | fire, water, earth, wind |
| 10 | 3 (armored) | earth HP=2 (wall) | dark (curtain) | light, fire, water, wind |

---

## Bench Pressure Analysis

### Expected Bench Count Per Level

| Stage | Expected Benches | Max Tolerable | Bench Loss (AP) | Remaining/HP | Viable? |
|-------|-----------------|---------------|-----------------|--------------|---------|
| 1 | 0-1 | 1 | 0-2 | 14-16/14 | Yes |
| 2 | 1-2 | 3 | 2-4 | 14-16/12 | Yes |
| 3 | 2 | 3 | 4-6 | 22-24/21 | Yes |
| 4 | 0 | 1 | 0-2 | 21-23/20 | Yes |
| 5 | 0-1 | 2 | 0-4 | 20-24/19 | Yes |
| 6 | 1-2 | 3 | 2-6 | 22-26/22 | Yes |
| 7 | 3-5 | 5 | 6-10 | 24-28/22 | Yes |
| 8 | 0-1 | 3 | 0-6 | 27-33/24 | Yes |
| 9 | 2-4 | 4 | 4-8 | 28-32/28 | Yes |
| 10 | 2-3 | 3 | 4-6 | 37-39/36 | Yes |

**Key Insight**: Levels with high bench tolerance (7, 8) compensate with doubled inner-element AP ratios (2.00). Boss level (10) has minimal bench tolerance (max 3) as intended.

---

## S-Curve Difficulty Analysis (Section 6)

```
Difficulty
  |
  |                                           [S10] Boss
  |                                      [S09] ____/
  |                                 [S08]____/
  |                            [S07]____/        <- 7-10: Hard/Boss plateau
  |                       [S06]____/
  |                  [S05]____/                  <- 4-6: Core challenge (steep)
  |             [S04]____/
  |        [S03]____/
  |   [S02]____/                                 <- 1-3: Tutorial (gentle)
  | [S01]
  +---------------------------------------------------> Stage
    1    2    3    4    5    6    7    8    9   10
```

### Difficulty Drivers Per Stage

| Stage | New Concept | Board Growth | Element Growth | Mechanic |
|-------|------------|-------------|----------------|----------|
| 1 | Basic matching, layering intro | 4x4 | 2 | -- |
| 2 | 3rd element, bench intro | 4x5 | +1 (earth) | -- |
| 3 | Concentric rings, strict layering | 5x5 | -- | -- |
| 4 | Split hemispheres, 4th element | 4x6 | +1 (wind) | -- |
| 5 | Gravity, vertical layering | 5x5 | -- | gravity |
| 6 | 5th element (light) | 5x6 | +1 (light) | -- |
| 7 | All 6 elements, curtain layering | 5x6 | +1 (dark) | -- |
| 8 | Armored cubes + layering | 5x6 | -2 (4 elements) | armor |
| 9 | Triple layers, gravity + 6 elements | 6x6 | +2 (6 elements) | gravity |
| 10 | Boss: armor + triple layers + all | 6x7 | all 6 | armor |

---

## Per-Element AP Ratio Table (All Levels)

| Element | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9 | S10 |
|---------|----|----|----|----|----|----|----|----|----|----|
| fire | 1.33 | 2.00 | 4.00 | 1.00 | 1.25 | 1.33 | 2.00 | 1.50 | 4.00 | 2.00 |
| water | 1.00 | 1.67 | 1.38 | 1.25 | 1.67 | 1.33 | 2.00 | 1.75 | 4.00 | 2.00 |
| earth | -- | 1.17 | 1.08 | 1.17 | 1.40 | 1.67 | 2.00 | **1.08** | 2.00 | **1.06** |
| wind | -- | -- | -- | 1.17 | 1.00 | 1.67 | 2.00 | 1.75 | 2.00 | 2.00 |
| light | -- | -- | -- | -- | -- | **1.00** | 1.33 | -- | **1.00** | 2.00 |
| dark | -- | -- | -- | -- | -- | -- | **1.00** | -- | **1.00** | **1.00** |

**Bold = bottleneck (ratio <= 1.10)**. These are the "hard gates" of each level.

---

## Attribute Hierarchy (Section 2)

### 1st-Tier Attributes (Direct Combat)
| Attribute | Range (W1) | Role |
|-----------|-----------|------|
| Hero AP | 2-3 | Primary resource, consumed on hit |
| Element | 6 types | Matching filter |
| Cube HP | 1-2 | Target durability |
| Board Size | 4x4 to 6x7 | Belt length, LoS complexity |

### 2nd-Tier Attributes (Probabilistic/Situational)
| Attribute | Value | Cap |
|-----------|-------|-----|
| Sling Combo | +10%/level | Max 50% |
| Belt Position Efficiency | Varies by layout | -- |

### 3rd-Tier Attributes (Correction)
| Attribute | Range |
|-----------|-------|
| Star Thresholds | 600-3400 |
| Remaining Hero Bonus | 200/hero |

---

## Counter-Attribute Pairs (Section 8)

| Attribute | Counter-Attribute | Balance Mechanism |
|-----------|-------------------|-------------------|
| Hero AP | Cube HP | AP >= cube HP per element required |
| Element matching | Element diversity | More elements = more bench risk |
| Outer layer cubes | Layer peel heroes | Must deploy shell-element heroes first |
| Bench slots (5) | Queue ordering | Shuffled queue creates bench pressure |
| Gravity (cube fall) | Layer integrity | Destroying lower cubes disrupts layers |
| Armored cubes (HP=2) | Extra AP allocation | Need more heroes of that element |

---

## Star Threshold Calibration

| Stage | Cubes | Base Score | 3-Star | 2-Star | 3-Star as % of Base |
|-------|-------|-----------|--------|--------|---------------------|
| 1 | 14 | 1400 | 1000 | 600 | 71% |
| 2 | 12 | 1200 | 1200 | 800 | 100% |
| 3 | 21 | 2100 | 2200 | 1400 | 105% (needs hero bonus) |
| 4 | 20 | 2000 | 2000 | 1200 | 100% |
| 5 | 19 | 1900 | 2000 | 1200 | 105% |
| 6 | 22 | 2200 | 2400 | 1600 | 109% |
| 7 | 22 | 2200 | 2400 | 1600 | 109% |
| 8 | 18 | 1800 | 2800 | 2000 | 156% (heavy bonus needed) |
| 9 | 28 | 2800 | 3000 | 2000 | 107% |
| 10 | 30 | 3000 | 3400 | 2400 | 113% |

**Note**: Stages 3, 5-10 require hero remaining bonus or sling combos for 3 stars. This rewards efficient play (fewer benched heroes = more remaining hero bonus).

---

## KPI Targets (Section 7)

| KPI | Easy (1-2) | Normal (3-6) | Hard (7-9) | Boss (10) |
|-----|-----------|-------------|-----------|----------|
| Clear Rate | 90%+ | 60-80% | 30-50% | 20-30% |
| Avg Stars | 2.5+ | 1.5-2.0 | 1.0-1.5 | 0.8-1.2 |
| AP Usage | 80-100% | 70-90% | 60-80% | 50-70% |
| Bench Fill Rate | 0-10% | 15-30% | 30-50% | 40-60% |

---

## Conveyor Slots and Bench Slots

All levels: conveyorSlots = 6, benchSlots = 5.

This is intentional: consistent slot counts let players build intuition about queue management across all levels. Difficulty scales through board layout, elements, and AP ratios rather than slot manipulation.

---

## Recommendations for Implementation

1. **heroGrid removed**: All levels use heroQueue only (single shuffled queue). Set heroGrid to empty array or omit.
2. **Bench visual**: Bench should clearly show 0/5 to 5/5 with urgency indicator at 4/5.
3. **Bench game-over**: When 6th hero would bench and bench is 5/5, trigger game over immediately.
4. **AP consumed only on hit**: Heroes should NOT spend AP on miss/move. Only matching hits consume AP.
5. **Full orbit detection**: A hero that completes one full loop (returns to starting belt position) without any hit goes to bench.
