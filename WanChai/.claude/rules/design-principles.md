---
paths:
  - "design/**"
---

# Design Principles

## Numerical Bible (design/reference/numerical-bible.md)

Always read the numerical bible before any balance/level/mechanic work.

Key principles:
- **Attribute Hierarchy**: 1st (AP, Element, CubeHP) → 2nd (sling combo) → 3rd (star thresholds, bonuses)
- **Panel Formula**: `actual = base × coefficient + offset`
- **Counter-Attributes**: every attribute must have a counter-pair
- **I/O Balance**: Input (AP, elements) ↔ Output (score, stars) must be proportional
- **S-Curve Difficulty**: stages 1-3 gentle → 4-7 steep → 8-10 plateau
- **4 KPIs**: clear rate, avg stars, AP usage rate, miss fire rate

## Level Design Templates

Use `design/levels/_template.md` for new levels.
Use `design/specs/_template.md` for new mechanic specs.
Use `design/balance/_template.md` for balance reviews.

## Status Tracking

Always update `design/status.json` when creating or modifying design documents.
