---
paths:
  - 'design/**'
---

# Design Principles

## Numerical Bible (design/reference/numerical-bible.md)

Always read the numerical bible before any balance/level/mechanic work.

Key principles:

- **Attribute Hierarchy**: 1st (baseDamage, cooldownMs, baseHp, baseSpeed) → 2nd (critChance, piercing) → 3rd (damageMultiplier, attackSpeedMultiplier)
- **Panel Formula**: `actual = baseDamage × levelMult × damageMultiplier × critMultiplier`
- **Counter-Attributes**: every attribute must have a counter-pair (DPS ↔ HP, speed ↔ knockback)
- **I/O Balance**: Input (survival time, kills) ↔ Output (XP, gold, level-ups) must be proportional
- **S-Curve Difficulty**: stages 1-2 learning → 3-4 challenge → 5-6 mastery
- **4 KPIs**: stage clear rate, avg survival time, DPS efficiency, level-up frequency

## Combat Spec (design/specs/auto-shooter-combat-spec.md)

Always read the combat spec before modifying weapon/enemy/wave systems.

## Level Design Templates

Use `design/specs/_template.md` for new mechanic specs.
Use `design/balance/_template.md` for balance reviews.

## Status Tracking

Always update `design/status.json` when creating or modifying design documents.
