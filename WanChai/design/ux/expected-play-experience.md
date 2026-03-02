# Expected Play Experience -- WanChai

> Authoritative reference for scene-by-scene UX goals, font hierarchy, touch targets,
> layout zones, and emotional arc. Every UI/UX overhaul MUST satisfy the acceptance
> criteria defined here.

**Status**: Draft (Updated for auto-shooter pivot)
**Date**: 2026-03-02
**Resolution**: 720 x 1280 (9:16 portrait mobile-first)
**Primary mode**: Auto-shooter Survivor (vertical scrolling, wave-based stages)

---

## Table of Contents

1. [Layout Zone System](#1-layout-zone-system)
2. [Font Hierarchy Standard](#2-font-hierarchy-standard)
3. [Touch Target Standard](#3-touch-target-standard)
4. [Scene-by-Scene UX Goals](#4-scene-by-scene-ux-goals)
5. [Player Emotional Journey](#5-player-emotional-journey)
6. [Global Acceptance Criteria](#6-global-acceptance-criteria)
7. [Scene-Specific Acceptance Criteria](#7-scene-specific-acceptance-criteria)
8. [Violation Inventory (Current State)](#8-violation-inventory-current-state)

---

## 1. Layout Zone System

All 9 scenes share a consistent four-zone layout on the 720x1280 canvas.
Primary action buttons MUST live in Zone C. Critical information belongs in
the top portion of Zone B.

```
y=0
+========================================+ - - -
|             Zone D (Safe Top)          |  40px
+----------------------------------------+ y=40
|                                        |
|             Zone A (Title)             |  90px
|  Scene title, brand, stage indicator   |
|                                        |
+----------------------------------------+ y=130
|                                        |
|                                        |
|             Zone B (Content)           |  720px
|  Primary content: game area, stats,    |
|  cards, weapon lists, enemy info       |
|                                        |
|                                        |
+----------------------------------------+ y=850
|                                        |
|             Zone C (Actions)           |  390px
|  Primary buttons, secondary buttons,   |
|  continue/start/retry controls,        |
|  progress indicators                   |
|                                        |
+----------------------------------------+ y=1240
|             Zone D (Safe Bottom)       |  40px
+========================================+ y=1280
```

### Zone Definitions

| Zone | Y Range     | Height | Purpose                                    |
|------|-------------|--------|--------------------------------------------|
| D    | 0--40       | 40px   | Safe area (notch, punch-hole). No content. |
| A    | 40--130     | 90px   | Scene title, stage indicator, brand         |
| B    | 130--850    | 720px  | Primary content area                        |
| C    | 850--1240   | 390px  | Action buttons, progress, footer controls   |
| D    | 1240--1280  | 40px   | Safe area (home indicator). No content.     |

### Zone Rules

- **Zone A**: Title text centered at y~85. Font: 40--48px bold. Optional subtitle
  at y~120, font 18--22px.
- **Zone B**: Scrollable if content exceeds 720px. 40px horizontal margins on each
  side (effective content width: 640px).
- **Zone C**: The primary action button center must fall between y=900 and y=1100.
  Secondary buttons may sit higher. Footer version text at y=1250 (inside lower
  Zone D only if cosmetic).
- **Zone D**: Absolutely no interactive elements. Decorative accent lines only
  (4px border at y=4 and y=1276).

**Note**: RunScene is an exception -- the game area uses the full screen from
Zone A to Zone C, with HUD overlaid on top.

---

## 2. Font Hierarchy Standard

Every text element in the game MUST use one of the sizes below. Nothing below
14px is permitted on the 720px-wide canvas.

| Category          | Size   | Weight        | Color Token      | Usage                              |
|-------------------|--------|---------------|------------------|------------------------------------|
| Scene Title       | 48px   | Bold (700)    | `#ffffff`        | Scene heading                      |
| Brand Title       | 72px   | Bold (700)    | `#ffffff`        | WANCHAI logo only                  |
| Score Display     | 42px   | Bold (700)    | `#e2e8f0`        | Score counters (monospace)         |
| Section Heading   | 28--32px | Bold (700)  | `#e2e8f0`        | Card titles, result headers        |
| Subsection        | 22px   | SemiBold (600)| `#e2e8f0`        | Subtitle, item names               |
| Button Label      | 22--28px | Bold (700)  | `#ffffff`        | Primary/secondary button text      |
| Body Primary      | 20px   | Regular (400) | `#a0aec0`        | Descriptions, instructions         |
| Body Secondary    | 18px   | Regular (400) | `#718096`        | Flavor text, hints                 |
| Info Label        | 16px   | Regular (400) | `#718096`        | HP, cost, status labels            |
| Caption (minimum) | 14px   | Regular (400) | `#4a5568`        | Footnotes, version, progress       |

### Absolute Rules

1. **Minimum font size: 14px.** Any text currently below 14px must be raised.
2. **Monospace** for all numeric displays (scores, HP, DPS, timers, levels).
3. **No font below 16px on interactive elements** (button labels, card names).
4. **Text shadow**: `2px 2px 4px rgba(0,0,0,0.5)` on all text over non-panel
   backgrounds to guarantee readability.
5. **Contrast ratio**: 4.5:1 minimum against immediate background.

---

## 3. Touch Target Standard

All interactive elements must meet these minimum dimensions. Measurements are in
logical pixels on the 720x1280 canvas.

| Element Type          | Minimum Size       | Notes                               |
|-----------------------|--------------------|-------------------------------------|
| Primary Button        | 220 x 60           | Full-width preferred (640 x 70)     |
| Secondary Button      | 200 x 56           | Paired side-by-side: 280 x 60 each |
| Icon Button           | 64 x 64            | Includes hit zone padding           |
| Level-up Card         | 200 x 240          | Three cards side-by-side            |
| List Item / Card      | full-width x 56    | Minimum row height                  |
| Close Button (X)      | 48 x 48            | Must have zone, not just text       |
| Speed Toggle          | 48 x 48            | In-game HUD                         |

### Spacing Rules

- Adjacent touch targets: minimum 8px gap.
- Touch target must extend 12px beyond visible boundary in all directions when
  the visible element is smaller than 48x48.
- No overlapping hit zones.

---

## 4. Scene-by-Scene UX Goals

### 4.1 BootScene

**Primary goal**: Initialize game config and transition immediately.

**Emotional target**: Anticipation -- the game is waking up.

**Time-on-screen**: < 0.5 seconds.

**Exit conditions**: Immediate transition to PreloadScene.

---

### 4.2 PreloadScene

**Primary goal**: Load assets and generate procedural textures.

**Emotional target**: Anticipation -- assets loading, game preparing.

**Information hierarchy**:
1. Loading progress bar (center of screen)
2. "Loading..." label (above bar)

**Time-on-screen**: 0.5--2.0 seconds (asset-dependent).

**Exit conditions**: All assets loaded and textures generated → MainMenuScene.

**Layout**:
```
Zone A: (empty)
Zone B: Loading bar centered at y=640 (exact screen center)
Zone C: (empty)
```

---

### 4.3 MainMenuScene

**Primary goal**: Start a new run or access meta features (codex, upgrades, world map).

**Emotional target**: Welcome, identity -- "this is WANCHAI / NEON SURVIVOR."
The START button should feel like the exciting, primary option.

**Information hierarchy**:
1. Game brand (WANCHAI title + NEON SURVIVOR subtitle)
2. START button (biggest, most prominent)
3. Meta navigation buttons (Weapon Codex, Enemy Codex, World Map, Upgrades)
4. ARIA lore messages (ambient flavor text)

**Time-on-screen**: 3--15 seconds (decision time).

**Exit conditions**:
- Tap START → RunScene
- Tap UPGRADES → MetaScene
- Tap WEAPON CODEX → WeaponCodexScene
- Tap ENEMY CODEX → EnemyCodexScene
- Tap WORLD MAP → WorldMapScene

**Layout**:
```
Zone A: WANCHAI brand (72px), subtitle "NEON SURVIVOR" (22px)
Zone B: ARIA message panel (flavor text)
        Navigation buttons grid
Zone C: START button (y~980, primary, full-width)
        Version number at y=1250
```

---

### 4.4 RunScene (Core Gameplay)

**Primary goal**: Survive waves of enemies by auto-firing weapons while dodging.
Level up by collecting XP orbs. Protect the base wall.

**Emotional target**: Focus, flow, tension -- pure survival engagement.

**Information hierarchy**:
1. Game area (enemies descending, player at bottom, projectiles flying)
2. Base HP bar (critical survival indicator)
3. XP bar + level (growth indicator)
4. Stage name + timer (progress indicator)
5. Weapon list HUD (current loadout)
6. Pause / Sound / Speed buttons (small, top-left)

**Time-on-screen**: 1--6 minutes per run (6 stages, 60s each + boss stages).

**Exit conditions**:
- Base HP reaches 0 → GameOverScene
- All 6 stages cleared → GameOverScene (victory)
- Level up → in-scene overlay (3 upgrade cards)
- Stage clear → in-scene overlay (2s pause)
- Mid-shop trigger → in-scene overlay (30s mark)

**Layout**:
```
Zone A: HUD bar (y=40--80):
        [Pause 48x48] [Sound 48x48] [Speed 48x48] | Stage Name 18px | Timer 22px
        XP bar (y=88, 600x8)
Zone B: Game area (y=100--1070):
        Enemies spawn at y=-50 and descend
        Projectiles fly upward from player
        XP orbs float down from killed enemies
Zone C: Base HP bar (y=1070, 680x16)
        Base wall (y=1100, 720x30)
        Player (y=1200, horizontal movement only)
        Weapon list icons (y=1220)
```

**Design notes**: This scene uses the FULL screen. Zone system is relaxed --
the game area occupies everything. HUD is thin overlay at top and bottom.
All interaction is via left/right drag (player movement) and tap (aim assist).
Level-up overlay pauses the game and shows 3 cards in the center.

---

### 4.5 GameOverScene

**Primary goal**: Show run results -- victory/defeat, stats, gold earned.

**Emotional target**:
- Victory: Pride, accomplishment -- "I survived all stages"
- Defeat: Determination -- "I will try again with upgrades"

**Information hierarchy**:
1. RUN COMPLETE! or GAME OVER (giant title)
2. Stats: Stage reached, enemies killed, gold earned, time survived
3. RETRY and MENU buttons

**Time-on-screen**: 5--15 seconds.

**Exit conditions**:
- Tap RETRY → RunScene (new run)
- Tap MENU → MainMenuScene

**Layout**:
```
Zone A: (empty -- title is in Zone B for dramatic effect)
Zone B: Title (y~200, 48px, green/red)
        Stats panel (y~350, 640x200): kills, stage, gold, time
Zone C: RETRY button (left, y~980, 260x70)
        MENU button (right, y~980, 260x70)
```

---

### 4.6 MetaScene

**Primary goal**: Spend gold on permanent upgrades (damage, HP, speed, crit).

**Emotional target**: Investment, growth -- "I am getting stronger for next run."

**Information hierarchy**:
1. Gold balance (how much can I spend?)
2. Upgrade list with costs and current levels
3. BACK button

**Time-on-screen**: 10--30 seconds.

**Exit conditions**:
- Tap BACK → MainMenuScene

**Layout**:
```
Zone A: "UPGRADES" (48px), Gold balance (22px, gold color)
Zone B: Upgrade cards stacked vertically:
        Each: icon, name (22px), description (16px), cost (22px), level bar
Zone C: BACK button (y~1050, 280x60)
```

---

### 4.7 WeaponCodexScene

**Primary goal**: Browse all weapons -- see stats, descriptions, projectile types.

**Emotional target**: Discovery, planning -- "what weapons can I get?"

**Information hierarchy**:
1. Weapon list with icons and names
2. Selected weapon detail panel (stats, DPS, description)
3. BACK button

**Time-on-screen**: 10--60 seconds (browsing).

**Exit conditions**:
- Tap BACK → MainMenuScene

---

### 4.8 EnemyCodexScene

**Primary goal**: Browse all enemy types -- see stats, behaviors, shapes.

**Emotional target**: Knowledge, strategy -- "know thy enemy."

**Information hierarchy**:
1. Enemy list with shape icons and names
2. Selected enemy detail panel (HP, speed, behavior, attack style)
3. BACK button

**Time-on-screen**: 10--60 seconds (browsing).

**Exit conditions**:
- Tap BACK → MainMenuScene

---

### 4.9 WorldMapScene

**Primary goal**: View the 3-zone world map of Hong Kong (WanChai, Tsim Sha Tsui,
Victoria Peak). See stage/enemy composition per zone. Tap for info popups.

**Emotional target**: Exploration, narrative context -- "this is the world I am fighting in."

**Information hierarchy**:
1. Map visualization with 3 zones
2. Zone info on tap (enemy types, boss info)
3. BACK button

**Time-on-screen**: 10--30 seconds.

**Exit conditions**:
- Tap BACK → MainMenuScene

---

## 5. Player Emotional Journey

### 5.1 Run Arc (Single Run)

```
MainMenu -----> RunScene (Stage 1: Wave) -----> RunScene (Stage 2: Boss)
  (excitement,    (learning weapons,               (first boss tension,
   anticipation)   easy enemies)                    can I beat it?)
                     |                                    |
                     +------------------------------------+
                     |
              RunScene (Stage 3-4: Wave + Boss)
              (mid-game pressure, harder enemies,
               more weapons, mid-shop decision)
                     |
              RunScene (Stage 5-6: Wave + Final Boss)
              (climax, full build, maximum enemy pressure,
               final boss HP 3000)
                     |
              GameOverScene
              (reflection: victory pride OR
               defeat determination)
                     |
              MainMenuScene → MetaScene (spend gold, get stronger)
```

### 5.2 Emotional Beat Map

| Scene/Phase          | Arousal | Valence   | Pacing   |
|----------------------|---------|-----------|----------|
| MainMenu             | Low     | Positive  | Slow     |
| Stage 1 (Wave)       | Medium  | Positive  | Moderate |
| Stage 2 (Boss)       | High    | Tense     | Fast     |
| Level-up overlay     | Low     | Positive  | Slow     |
| Stage 3-4            | High    | Neutral   | Fast     |
| Mid-shop overlay     | Low     | Positive  | Slow     |
| Stage 5-6            | Maximum | Tense     | Fast     |
| Final Boss           | Maximum | Climax    | Fast     |
| GameOver (win)       | High    | Positive  | Slow     |
| GameOver (loss)      | Medium  | Negative  | Slow     |
| MetaScene            | Low     | Positive  | Slow     |

### 5.3 Pacing Principles

1. **Wave-Boss Alternation**: Wave stages (60s tension) alternate with boss stages
   (short climax), creating a natural tension-release rhythm.
2. **Escalating Stakes**: Each stage has harder enemies and scaling (HP ×1.5,
   Speed ×1.15, Damage ×1.25 per stage).
3. **Level-up as Breather**: Level-up overlay pauses the game -- a moment of
   calm decision-making amid chaos.
4. **Mid-shop as Checkpoint**: At 30 seconds, the mid-shop offers healing or
   power-ups -- a strategic checkpoint.
5. **Meta Progression as Hook**: Even on defeat, earned gold provides permanent
   upgrades, creating a "one more run" loop.

### 5.4 Session Pacing

```
Run 1 (3 min, reach Stage 2) → MetaScene → Run 2 (4 min, reach Stage 4) → ...
```

Short, repeatable runs with persistent progression. Each run teaches and rewards.

---

## 6. Global Acceptance Criteria

These criteria apply to EVERY scene. A scene fails its UX audit if any of these
are violated.

### 6.1 Typography

| ID     | Criterion                                                      |
|--------|----------------------------------------------------------------|
| TYP-01 | No text element below 14px anywhere in the scene               |
| TYP-02 | No interactive text (buttons, labels) below 16px               |
| TYP-03 | Scene title uses 40--48px bold                                 |
| TYP-04 | Score/timer displays use monospace bold                         |
| TYP-05 | All numeric values use monospace font                          |
| TYP-06 | Text contrast ratio >= 4.5:1 against background               |
| TYP-07 | Text shadow applied on all text over non-panel backgrounds     |

### 6.2 Touch Targets

| ID     | Criterion                                                      |
|--------|----------------------------------------------------------------|
| TCH-01 | All interactive elements >= 48 x 48 logical pixels             |
| TCH-02 | Primary buttons >= 220 x 60                                    |
| TCH-03 | Icon buttons >= 64 x 64 (including hit zone)                   |
| TCH-04 | Adjacent touch targets spaced >= 8px apart                     |
| TCH-05 | No overlapping hit zones                                       |

### 6.3 Layout

| ID     | Criterion                                                      |
|--------|----------------------------------------------------------------|
| LAY-01 | No interactive content in Zone D (y < 40 or y > 1240)         |
| LAY-02 | Primary action button center falls within y=900 to y=1100     |
| LAY-03 | Scene title positioned within Zone A (y=40 to y=130)          |
| LAY-04 | Content respects 40px horizontal margins (x=40 to x=680)      |
| LAY-05 | No content clipped or overlapping at 720x1280                  |

### 6.4 Information Hierarchy

| ID     | Criterion                                                      |
|--------|----------------------------------------------------------------|
| INF-01 | Most important information is largest and highest on screen     |
| INF-02 | Visual grouping via panels distinguishes content sections       |
| INF-03 | Interactive elements visually differentiated from static text   |
| INF-04 | Disabled states clearly communicated (alpha <= 0.4)            |
| INF-05 | Selected states clearly communicated (border + overlay)        |

### 6.5 Transitions

| ID     | Criterion                                                      |
|--------|----------------------------------------------------------------|
| TRN-01 | Every scene transition uses camera fadeOut/fadeIn               |
| TRN-02 | No scene accepts input during fade transitions                 |
| TRN-03 | Fade duration matches VISUAL.ANIM.SCENE_FADE constant          |
| TRN-04 | Every scene has a back/exit path (no dead ends)                |

### 6.6 Accessibility

| ID     | Criterion                                                      |
|--------|----------------------------------------------------------------|
| ACC-01 | Color is never the sole differentiator (icon/shape required)   |
| ACC-02 | Enemy types identifiable by shape (circle/triangle/rect/diamond/hexagon) |
| ACC-03 | Tap feedback: scale 0.95 + alpha 0.8, duration 80ms           |

---

## 7. Scene-Specific Acceptance Criteria

### 7.1 BootScene / PreloadScene

| ID       | Criterion                                             |
|----------|-------------------------------------------------------|
| BOOT-01  | Loading bar centered at screen center (y=640)         |
| BOOT-02  | "Loading..." text >= 20px                             |
| BOOT-03  | Transition to next scene within 3 seconds             |

### 7.2 MainMenuScene

| ID       | Criterion                                             |
|----------|-------------------------------------------------------|
| MENU-01  | WANCHAI title at 72px bold in Zone A                  |
| MENU-02  | START button in Zone C, primary variant, >= 440x70    |
| MENU-03  | Navigation buttons >= 200x56 each                     |
| MENU-04  | Version text >= 14px                                  |
| MENU-05  | ARIA message text >= 16px                             |

### 7.3 RunScene

| ID       | Criterion                                             |
|----------|-------------------------------------------------------|
| RUN-01   | HUD bar height <= 80px (maximize game area)           |
| RUN-02   | Timer at 22px monospace bold                          |
| RUN-03   | Pause + Sound + Speed buttons >= 48 x 48             |
| RUN-04   | XP bar clearly visible (600px wide)                   |
| RUN-05   | Base HP bar clearly visible (680px wide)              |
| RUN-06   | Stage name >= 18px                                    |
| RUN-07   | Level-up cards >= 200x240 each, 3 cards visible      |
| RUN-08   | Stage clear overlay text >= 32px                      |
| RUN-09   | Mid-shop overlay buttons >= 220x60                    |

### 7.4 GameOverScene

| ID       | Criterion                                             |
|----------|-------------------------------------------------------|
| GOVER-01 | Title at 48px (green for victory, red for defeat)     |
| GOVER-02 | Stats labels >= 16px                                  |
| GOVER-03 | Stats values >= 22px bold monospace                   |
| GOVER-04 | RETRY and MENU buttons in Zone C, >= 260 x 70        |
| GOVER-05 | Gold earned displayed prominently (22px, gold color)  |

### 7.5 MetaScene

| ID       | Criterion                                             |
|----------|-------------------------------------------------------|
| META-01  | Gold balance prominent (22px, gold)                   |
| META-02  | Upgrade costs >= 22px                                 |
| META-03  | Upgrade descriptions >= 16px                          |
| META-04  | BACK button in Zone C                                 |
| META-05  | Maxed upgrades clearly marked                         |

### 7.6 WeaponCodexScene

| ID       | Criterion                                             |
|----------|-------------------------------------------------------|
| WCDX-01  | Weapon names >= 22px                                  |
| WCDX-02  | Weapon stats >= 16px                                  |
| WCDX-03  | BACK button in Zone C                                 |

### 7.7 EnemyCodexScene

| ID       | Criterion                                             |
|----------|-------------------------------------------------------|
| ECDX-01  | Enemy names >= 22px                                   |
| ECDX-02  | Enemy stats >= 16px                                   |
| ECDX-03  | BACK button in Zone C                                 |

### 7.8 WorldMapScene

| ID       | Criterion                                             |
|----------|-------------------------------------------------------|
| WMAP-01  | Zone names >= 22px                                    |
| WMAP-02  | Info popup text >= 16px                               |
| WMAP-03  | BACK button in Zone C                                 |
| WMAP-04  | Map zones tappable with >= 48x48 hit zones            |

---

## 8. Violation Inventory (Current State)

Summary of known violations in the current codebase. This section will be
updated as the UX audit progresses.

### 8.1 Methodology Note

The game pivoted from 13-scene puzzle RPG to 9-scene auto-shooter. Many
violations from the old codebase (RunMapScene, ShopScene, RestScene, EventScene,
RewardScene, etc.) are no longer applicable as those scenes were removed.

Current violations should be verified against the active 9-scene structure.

### 8.2 Known Issues

| Scene            | Issue                  | Violation IDs  | Fix                       |
|------------------|------------------------|----------------|---------------------------|
| (To be audited)  | Full UX audit pending  | —              | Run /ux-gate after pivot  |

### 8.3 Total Violation Count

- **Critical**: TBD (post-audit)
- **Major**: TBD (post-audit)
- **Minor**: TBD (post-audit)
- **Total**: TBD (post-audit)

---

## Appendix A: Scene Flow Diagram

```
              BootScene
                 |
            PreloadScene
                 |
           MainMenuScene
          /    |    |    \
     RunScene  Meta  Codex  WorldMap
         |     Scene  Scenes  Scene
    GameOverScene
       /    \
  [RETRY]  [MENU]
     |        |
  RunScene  MainMenuScene
```

---

## Appendix B: Color Token Reference

For quick reference when verifying text colors against acceptance criteria.

| Token       | Hex       | Usage                          | Contrast vs #0a0a1a |
|-------------|-----------|--------------------------------|---------------------|
| `#ffffff`   | White     | Titles, button labels          | 18.6:1              |
| `#e2e8f0`   | Light     | Primary body text, values      | 15.0:1              |
| `#a0aec0`   | Medium    | Descriptions, subtitles        | 8.2:1               |
| `#718096`   | Muted     | Secondary info, labels         | 4.9:1               |
| `#4a5568`   | Dim       | Captions, footer, disabled     | 2.8:1 (decorative)  |
| `#e94560`   | Accent    | Highlights, emphasis           | 6.0:1               |
| `#38b868`   | Success   | Win states, confirm            | 6.5:1               |
| `#f0d050`   | Gold      | Stars, premium, rewards        | 11.0:1              |

**Note**: `#4a5568` at 2.8:1 is below the 4.5:1 minimum for body text. It is
acceptable ONLY for decorative/non-essential labels. Any informational text using
this color must be raised to `#a0aec0` (8.2:1).

---

## Appendix C: Responsive Scaling Notes

The game uses `Phaser.Scale.FIT` with `CENTER_BOTH`. All coordinates in this
document assume the native 720x1280 canvas. On physical devices:

- **Phones (360px--430px physical width)**: Canvas scales to 50--60% physical size.
  A 14px canvas font renders at ~7--8px physical, which remains readable on high-DPI
  screens (2x--3x pixel ratio = 14--24 physical pixels tall).
- **Tablets (768px+ physical width)**: Canvas scales to ~100% or letterboxes.
  All sizes remain comfortable.
- **Desktop (browser)**: Canvas centered, sizes as designed.

The 14px minimum is calibrated for the worst case: a 360px-wide phone at 2x DPI
rendering 14px canvas text at 7 physical pixels = 14 device pixels, which is the
absolute minimum for legibility.
