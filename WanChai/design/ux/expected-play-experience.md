# Expected Play Experience -- WanChai

> Authoritative reference for scene-by-scene UX goals, font hierarchy, touch targets,
> layout zones, and emotional arc. Every UI/UX overhaul MUST satisfy the acceptance
> criteria defined here.

**Status**: Draft
**Date**: 2026-02-27
**Resolution**: 720 x 1280 (9:16 portrait mobile-first)
**Primary mode**: Roguelike (the scene list below follows roguelike play order first,
then appends classic-only scenes)

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

All 15 scenes share a consistent four-zone layout on the 720x1280 canvas.
Primary action buttons MUST live in Zone C. Critical information belongs in
the top portion of Zone B.

```
y=0
+========================================+ - - -
|             Zone D (Safe Top)          |  40px
+----------------------------------------+ y=40
|                                        |
|             Zone A (Title)             |  90px
|  Scene title, brand, floor indicator   |
|                                        |
+----------------------------------------+ y=130
|                                        |
|                                        |
|             Zone B (Content)           |  720px
|  Primary content: grids, maps, cards,  |
|  boards, stats, reward options         |
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
| A    | 40--130     | 90px   | Scene title, floor/stage indicator, brand   |
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

---

## 2. Font Hierarchy Standard

Every text element in the game MUST use one of the sizes below. Nothing below
14px is permitted on the 720px-wide canvas.

| Category          | Size   | Weight        | Color Token      | Usage                              |
|-------------------|--------|---------------|------------------|------------------------------------|
| Scene Title       | 48px   | Bold (700)    | `#ffffff`        | Scene heading (PARTY SELECT, etc.) |
| Brand Title       | 72px   | Bold (700)    | `#ffffff`        | WANCHAI logo only                  |
| Score Display     | 42px   | Bold (700)    | `#e2e8f0`        | Score counters (monospace)         |
| Section Heading   | 28--32px | Bold (700)  | `#e2e8f0`        | Card titles, result headers        |
| Subsection        | 22px   | SemiBold (600)| `#e2e8f0`        | Subtitle, shop item names          |
| Button Label      | 22--28px | Bold (700)  | `#ffffff`        | Primary/secondary button text      |
| Body Primary      | 20px   | Regular (400) | `#a0aec0`        | Descriptions, instructions         |
| Body Secondary    | 18px   | Regular (400) | `#718096`        | Flavor text, hints                 |
| Info Label        | 16px   | Regular (400) | `#718096`        | HP, cost, status labels            |
| Caption (minimum) | 14px   | Regular (400) | `#4a5568`        | Footnotes, version, progress       |

### Absolute Rules

1. **Minimum font size: 14px.** Any text currently below 14px must be raised.
2. **Monospace** for all numeric displays (scores, AP, HP, costs, timers).
3. **No font below 16px on interactive elements** (button labels, card names).
4. **Text shadow**: `2px 2px 4px rgba(0,0,0,0.5)` on all text over non-panel
   backgrounds to guarantee readability.
5. **Contrast ratio**: 4.5:1 minimum against immediate background.

### Known Violations (Current Codebase)

| Scene             | Element           | Current | Required | Action         |
|-------------------|-------------------|---------|----------|----------------|
| PartySelectScene  | Critter name      | 10px    | 14px     | Raise to 14px  |
| PartySelectScene  | AP badge          | 12px    | 16px     | Raise to 16px  |
| PartySelectScene  | Selected Party lbl| 13px    | 14px     | Raise to 14px  |
| RunMapScene       | Node type label   | 10px    | 14px     | Raise to 14px  |
| RunMapScene       | Purification lbl  | 12px    | 14px     | Raise to 14px  |
| RunMapScene       | YOUR PARTY lbl    | 12px    | 14px     | Raise to 14px  |
| RunMapScene       | Stage progress    | 12px    | 14px     | Raise to 14px  |
| RewardScene       | Card description  | 13px    | 16px     | Raise to 16px  |
| RewardScene       | SELECTED text     | 13px    | 14px     | Raise to 14px  |
| ShopScene         | PTS label         | 13px    | 14px     | Raise to 14px  |
| RestScene         | Sub-description   | 13px    | 14px     | Raise to 14px  |
| RunResultScene    | Stats label       | 11px    | 14px     | Raise to 14px  |
| RunResultScene    | Critter level     | 12px    | 14px     | Raise to 14px  |
| StageSelectScene  | Board Preview lbl | 13px    | 14px     | Raise to 14px  |
| StageSelectScene  | Element name      | 13px    | 14px     | Raise to 14px  |
| StageSelectScene  | Stage pill number | 11px    | 14px     | Raise to 14px  |
| ModeSelectScene   | Version           | 13px    | 14px     | Raise to 14px  |
| PuzzleUIScene     | Level name        | 18px    | 18px     | OK             |
| VictoryScene      | (none critical)   |         |          | OK             |

---

## 3. Touch Target Standard

All interactive elements must meet these minimum dimensions. Measurements are in
logical pixels on the 720x1280 canvas.

| Element Type          | Minimum Size       | Notes                               |
|-----------------------|--------------------|-------------------------------------|
| Primary Button        | 220 x 60           | Full-width preferred (640 x 70)     |
| Secondary Button      | 200 x 56           | Paired side-by-side: 280 x 60 each |
| Icon Button           | 64 x 64            | Includes hit zone padding           |
| Grid Cell (critter)   | 120 x 130          | Current 110x120 needs increase      |
| Map Node              | 72px diameter (r=36)| Current r=30 too small              |
| List Item / Card      | full-width x 56    | Minimum row height                  |
| Reward Card           | 196 x 280          | Already meets minimum               |
| Shop Card Hit Zone    | 620 x 180          | Already meets minimum               |
| Close Button (X)      | 48 x 48            | Must have zone, not just text       |

### Spacing Rules

- Adjacent touch targets: minimum 8px gap.
- Touch target must extend 12px beyond visible boundary in all directions when
  the visible element is smaller than 48x48.
- No overlapping hit zones.

### Known Violations (Current Codebase)

| Scene            | Element              | Current       | Required     |
|------------------|----------------------|---------------|--------------|
| PartySelectScene | Critter cell         | 110 x 120     | 120 x 130    |
| RunMapScene      | Map node             | r=30 (60px)   | r=36 (72px)  |
| ShopScene        | Close button (X)     | text only     | 48 x 48 zone |
| RestScene        | Close button (X)     | text only     | 48 x 48 zone |

---

## 4. Scene-by-Scene UX Goals

### 4.1 BootScene / PreloadScene

**Primary goal**: Load assets and generate procedural textures as fast as possible.

**Emotional target**: Anticipation -- the game is waking up.

**Information hierarchy**:
1. Loading progress bar (center of screen)
2. "Loading..." label (above bar)

**Time-on-screen**: 0.5--2.0 seconds (asset-dependent).

**Exit conditions**: All assets loaded and textures generated.

**Layout**:
```
Zone A: (empty)
Zone B: Loading bar centered at y=640 (exact screen center)
Zone C: (empty)
```

---

### 4.2 ModeSelectScene

**Primary goal**: Choose between Classic mode and Roguelike mode (or continue
a saved roguelike run).

**Emotional target**: Welcome, identity -- "this is WANCHAI." Roguelike should
feel like the exciting, primary option.

**Information hierarchy**:
1. Game brand (WANCHAI title)
2. Roguelike mode card (primary recommendation)
3. Classic mode card (secondary option)
4. Continue Run button (if saved run exists -- highest priority action)

**Time-on-screen**: 3--10 seconds (decision time).

**Exit conditions**:
- Tap Classic SELECT -> StageSelectScene
- Tap Roguelike SELECT -> PartySelectScene
- Tap CONTINUE RUN -> RunMapScene (with loaded RunState)

**Layout**:
```
Zone A: WANCHAI brand (72px), subtitle "ELEMENTAL HEROES" (22px)
Zone B: Two mode cards stacked vertically
        - Roguelike card (y~400): icon [R], title 34px, desc, SELECT button
        - Classic card (y~650): icon [C], title 38px, desc, SELECT button
Zone C: CONTINUE RUN button (if save exists, y~980)
        Version number at y=1250
```

**Design notes**: The roguelike card should have a subtle visual emphasis (accent
border glow) to signal it as the primary mode. The classic card can be more muted.
If a saved run exists, the CONTINUE RUN button should be the most visually
prominent element on screen (Zone C, primary variant, full-width).

---

### 4.3 StageSelectScene (Classic Only)

**Primary goal**: Preview the next puzzle stage and tap START.

**Emotional target**: Readiness, confidence -- "I know what I am facing."

**Information hierarchy**:
1. Stage number and name (STAGE 5 -- "Gravity Well")
2. START button (biggest, most visually prominent)
3. Board preview (color grid showing element layout)
4. Difficulty badge + best score/stars
5. Stage progress dots (which stage out of 10)
6. Element legend
7. Star progress bar

**Time-on-screen**: 3--15 seconds.

**Exit conditions**:
- Tap START -> PuzzleScene
- Settings gear -> SettingsOverlay

**Layout**:
```
Zone A: WANCHAI brand (72px), subtitle, decorative divider
Zone B: Stage info panel (y~335): STAGE N (48px), progress dots,
        level name, difficulty badge, best score
        Board preview (y~600): color grid
        Element legend (y~770): colored dots + names
Zone C: START button (y~890, 440x90, 36px label)
        TAP TO START blink (y~975)
        Star progress bar (y~1070)
        Version (y~1250)
```

---

### 4.4 PartySelectScene (Roguelike Entry)

**Primary goal**: Pick exactly 4 critters from the 18 available to form a party.

**Emotional target**: Hope, agency -- "I am building MY team."

**Information hierarchy**:
1. Selection counter ("2 / 4 SELECTED") -- must update in real-time
2. Critter grid -- element color, rarity, AP visible at a glance
3. Selected Party preview row (bottom of Zone B)
4. START RUN button (disabled until 4 selected)

**Time-on-screen**: 15--60 seconds.

**Exit conditions**:
- Select 4 critters + tap START RUN -> RunMapScene

**Layout**:
```
Zone A: "PARTY SELECT" (40px), counter "2/4 SELECTED" (18px)
Zone B: Critter grid (6 columns, 3 rows = 18 cells)
        Each cell: 120x130 minimum
        Element dot, rarity dots, 2-char icon, AP badge, name
Zone C: Selected Party preview row (4 slots, y~958)
        START RUN button (y~1060, 400x72)
```

**Design notes**: Each critter cell must communicate three things instantly:
element (border color + dot), rarity (dot count + dot color), and AP (badge).
The critter name is tertiary information and can be small (14px) since players
learn critters by icon/color.

---

### 4.5 RunMapScene (Roguelike Hub)

**Primary goal**: Choose the next node to visit on the current floor map.

**Emotional target**: Strategy, anticipation -- "which path do I take?"

**Information hierarchy**:
1. Available nodes (pulsing, bright -- these are the ONLY tappable elements)
2. Current node indicator (if any)
3. Floor number + Purification Score (HUD)
4. Node type labels and connections
5. Party health preview (AP bars)
6. Info panel (description of selected/current node)

**Time-on-screen**: 5--20 seconds per node selection.

**Exit conditions**:
- Tap battle/elite/boss node -> PuzzleScene
- Tap shop node -> ShopScene
- Tap rest node -> RestScene
- Tap event node -> EventScene

**Layout**:
```
Zone A: HUD bar (y=28--108): FLOOR N (22px), Purification Score,
        Relic count
Zone B: Map visualization (y=160--860): nodes, connections, icons
        Nodes: 72px diameter minimum, type icon (22px), label (14px)
        Available nodes pulse; visited nodes dim
Zone C: Party preview (y~958): 4 critter icons with AP bars
        Info panel (y~1085): node type + description
```

**Design notes**: The map must clearly distinguish four node states: visited
(dim/gray), current (bright glow + pulse), available (bright + pulse), locked
(dim outline). Connections between nodes use matching visual language: visited
path = green, available path = white, locked path = dim gray.

---

### 4.6 PuzzleScene + PuzzleUIScene (Core Gameplay)

**Primary goal**: Deploy heroes from the conveyor belt to destroy cubes/enemies.

**Emotional target**: Focus, flow, tension -- pure puzzle engagement.

**Information hierarchy**:
1. Conveyor belt + board (the puzzle itself -- largest visual area)
2. Hero queue / available heroes
3. Score (rolling counter, top-right)
4. Combo indicator (top-left, transient)
5. Progress bar or HP bar (center-top)
6. Pause + Sound buttons (top-left, small)

**Time-on-screen**: 30 seconds -- 5 minutes per battle.

**Exit conditions**:
- Classic: All cubes destroyed (win) -> ResultScene
- Classic: No heroes left / bench full (lose) -> ResultScene
- Roguelike: All enemies killed -> RewardScene
- Roguelike: Player HP reaches 0 -> RunResultScene (loss)

**Layout**:
```
Zone A: PuzzleUIScene HUD bar (y=40--100):
        [Pause 48x48] [Sound 48x48] | Level Name 18px | Progress bar |
        Score label 16px + Score 42px
Zone B: PuzzleScene game area (y=130--1100):
        Conveyor belt track (dual rails)
        Board grid (cubes/enemies)
        Hero queue at bottom
Zone C: (minimal -- hero queue bottom extends into upper Zone C)
```

**Design notes**: This is the only scene where Zone C is minimal. The game board
needs maximum vertical space. The HUD is a thin bar at the top. All interaction
is via tapping belt positions or heroes -- no buttons in Zone C during active play.

---

### 4.7 RewardScene (Post-Battle, Roguelike)

**Primary goal**: Choose one of three rewards (Recruit, Level Up, Relic) after
winning a battle.

**Emotional target**: Satisfaction, growth -- "I earned this. Which reward helps
my run the most?"

**Information hierarchy**:
1. "BATTLE CLEAR!" title (celebration)
2. Score + Stars summary
3. Three reward cards (the decision)
4. CONTINUE button (enabled after selection)
5. Floor progress info

**Time-on-screen**: 5--20 seconds.

**Exit conditions**:
- Select a reward + tap CONTINUE -> RunMapScene or RunResultScene

**Layout**:
```
Zone A: "BATTLE CLEAR!" (48px, green), subtitle (18px)
Zone B: Score panel (y~258): score + stars side by side
        "CHOOSE A REWARD" label (y~345, 16px)
        Three reward cards (y~535, each 196x280):
          Icon (36px), title (18px), description (16px)
Zone C: CONTINUE button (y~800, 380x70)
        Progress info (y~905, 16px)
```

---

### 4.8 ShopScene (Roguelike)

**Primary goal**: Spend Purification Score points to buy upgrades (Level Up,
Recruit, Relic).

**Emotional target**: Evaluation, investment -- "is this worth the cost?"

**Information hierarchy**:
1. Purification Score balance (how much can I spend?)
2. Three shop cards with costs
3. LEAVE SHOP button
4. SOLD / disabled overlays on purchased/unavailable items

**Time-on-screen**: 10--30 seconds.

**Exit conditions**:
- Tap LEAVE SHOP -> RunMapScene

**Layout**:
```
Zone A: "SHOP" (32px, gold), Purification balance (22px)
Zone B: Three shop cards stacked vertically (y=310, 530, 750):
        Each 620x180: icon, title (22px), desc (16px), cost (22px)
Zone C: Separator (y~910)
        LEAVE SHOP button (y~990, 280x60)
```

---

### 4.9 RestScene (Roguelike)

**Primary goal**: Choose one of three rest actions (Recover, Train, Scout).

**Emotional target**: Relief, calm -- "a safe moment to breathe and plan."

**Information hierarchy**:
1. "REST SITE" title + flavor text
2. Three option cards (the decision)
3. Result text (shown after choosing)
4. CONTINUE button (enabled after choosing)

**Time-on-screen**: 5--15 seconds.

**Exit conditions**:
- Select an option + tap CONTINUE -> RunMapScene

**Layout**:
```
Zone A: "REST SITE" (32px, green), flavor text (18px)
Zone B: Three option cards stacked (y=310, 480, 650):
        Each 620x140: icon, title (22px), desc (16px), sub-desc (14px)
        Result text (y~825, 18px)
Zone C: CONTINUE button (y~1000, 320x68)
```

---

### 4.10 EventScene (Roguelike)

**Primary goal**: Read a random encounter description and choose between two options.

**Emotional target**: Intrigue, risk assessment -- "what will happen if I choose
this?"

**Information hierarchy**:
1. Event title + description (the narrative)
2. Event card with icon (visual anchor)
3. Two option buttons (the decision -- side by side)
4. Result text (after choosing)
5. CONTINUE button

**Time-on-screen**: 10--30 seconds (reading + deciding).

**Exit conditions**:
- Choose option A or B, read result, tap CONTINUE -> RunMapScene

**Layout**:
```
Zone A: Event title (28px, purple), description (18px, word-wrapped)
Zone B: Event card panel (y~500, 620x200): large icon, event name, detail
        Option A button (y~730, left half, 300x60)
        Option B button (y~730, right half, 300x60)
        Result text (y~830, 18px)
Zone C: CONTINUE button (y~990, 320x68)
```

---

### 4.11 ResultScene (Classic Only)

**Primary goal**: Show stage result -- win/loss, score, stars.

**Emotional target**:
- Win: Pride, accomplishment -- star reveal ceremony
- Loss: Determination -- "I will retry"

**Information hierarchy**:
1. STAGE CLEAR! or GAME OVER (giant title)
2. Star reveal animation (3 stars, sequential)
3. Score (rolling counter)
4. Best score / NEW BEST indicator
5. RETRY and NEXT/MENU buttons

**Time-on-screen**: 5--15 seconds (watching animations + deciding).

**Exit conditions**:
- Tap RETRY -> PuzzleScene (same level)
- Tap NEXT -> StageSelectScene (next level)
- Tap MENU -> StageSelectScene
- Tap COMPLETE -> VictoryScene (if last stage)

**Layout**:
```
Zone A: (empty -- title is in Zone B for dramatic effect)
Zone B: Title (y~200, 56px)
        Stars (y~350, sequential animation)
        Score panel (y~515, 400x120): label + rolling counter (56px)
        Best score / NEW BEST (y~610)
Zone C: RETRY button (left, y~980, 260x70)
        NEXT/MENU button (right, y~980, 260x70)
```

---

### 4.12 VictoryScene (Classic Completion)

**Primary goal**: Celebrate clearing all 10 classic stages.

**Emotional target**: Triumph, celebration -- confetti, trophy stars, fanfare.

**Information hierarchy**:
1. "CONGRATULATIONS!" (dramatic reveal)
2. "All stages cleared!" subtitle
3. Trophy stars (3 large golden stars)
4. PLAY AGAIN button
5. Continuous confetti

**Time-on-screen**: 10--30 seconds (savoring the victory).

**Exit conditions**:
- Tap PLAY AGAIN -> StageSelectScene (reset)

**Layout**:
```
Zone A: (empty -- title reveals into Zone B)
Zone B: Panel (y~480, 580x420):
        "CONGRATULATIONS!" (42px, red, animated reveal)
        "All stages cleared!" (22px)
        Trophy stars (y~520, 3 large golden procedural stars)
Zone C: PLAY AGAIN button (y~1050, 280x70)
```

---

### 4.13 RunResultScene (Roguelike Run Summary)

**Primary goal**: Show the full run summary -- stages cleared, score, party status.

**Emotional target**:
- Win: Epic accomplishment -- "I conquered the run"
- Loss: Reflection -- "here is what I achieved before falling"

**Information hierarchy**:
1. RUN COMPLETE! or RUN FAILED (giant title)
2. Stats panel: Stages Cleared, Turns Total, Purification Score
3. Party Summary: each critter with level, element, XP bar
4. Rewards Summary: best floor, final purification score
5. NEW RUN and MENU buttons

**Time-on-screen**: 10--30 seconds.

**Exit conditions**:
- Tap NEW RUN -> PartySelectScene
- Tap MENU -> PartySelectScene (currently both go to PartySelectScene)

**Layout**:
```
Zone A: Title (y~125, 56px, green/red), subtitle (y~182, 18px)
Zone B: Stats panel (y~298, 640x110): 3 columns
        PARTY SUMMARY label (y~390, 16px)
        Party grid (y~415--730): critter cards with levels + XP bars
        Rewards panel (y~790, full-width x 90)
Zone C: NEW RUN button (left, y~960, 250x65)
        MENU button (right, y~960, 250x65)
```

---

## 5. Player Emotional Journey

### 5.1 Roguelike Run Arc (Primary Game Mode)

```
PartySelect -----> RunMap -------> Battle -------> Reward
  (hope,            (strategy,      (tension,       (satisfaction,
   agency)           anticipation)   focus, flow)    growth)
     |                  ^                               |
     |                  |                               |
     |                  +-------------------------------+
     |                  |
     |              RunMap -------> Shop/Rest/Event
     |              (strategy)      (calm, evaluation,
     |                               intrigue)
     |                  |
     |              RunMap -------> Boss Battle
     |              (strategy,      (climax, maximum
     |               tension)        tension)
     |                  |
     |              RunResult
     |              (reflection,
     |               accomplishment
     |               or determination)
     |                  |
     +------------------+ (NEW RUN -- the cycle repeats)
```

### 5.2 Emotional Beat Map

| Scene          | Arousal | Valence   | Pacing   |
|----------------|---------|-----------|----------|
| PartySelect    | Medium  | Positive  | Slow     |
| RunMap         | Low-Med | Neutral+  | Moderate |
| Battle (normal)| High    | Neutral   | Fast     |
| Battle (boss)  | Maximum | Tense     | Fast     |
| Reward         | Medium  | Positive  | Slow     |
| Shop           | Low     | Positive  | Slow     |
| Rest           | Lowest  | Positive  | Slow     |
| Event          | Medium  | Mixed     | Moderate |
| RunResult(win) | High    | Positive  | Slow     |
| RunResult(loss)| Medium  | Negative  | Slow     |

### 5.3 Pacing Principles

1. **Tension-Release Cycle**: Every battle (tension) must be followed by a
   non-combat scene (release): Reward, Shop, Rest, or Event.
2. **Escalating Stakes**: Floor difficulty increases, making each battle
   slightly more tense than the last.
3. **Boss as Climax**: The boss intro animation (dark overlay, "BOSS BATTLE"
   text scale-in) serves as the emotional peak of each floor.
4. **Rest as Valley**: RestScene is the lowest-arousal scene, designed to
   let the player breathe and plan.
5. **Run End as Reflection**: RunResultScene gives time to process the run
   before immediately offering NEW RUN for re-engagement.

### 5.4 Classic Mode Arc (Secondary)

```
StageSelect -> Puzzle -> Result -> StageSelect -> ... -> Victory
  (readiness)  (flow)   (pride/    (readiness)           (triumph)
                        determination)
```

The classic arc is simpler: a repeating StageSelect-Puzzle-Result loop with
an S-curve difficulty ramp (stages 1--3 easy, 4--7 challenging, 8--10 mastery).

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
| TYP-04 | Score displays use 42px monospace bold                          |
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
| TCH-06 | Map nodes >= 72px diameter (r >= 36)                           |
| TCH-07 | Grid cells >= 120 x 130                                        |

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
| ACC-02 | Element types identifiable by shape/symbol, not just color     |
| ACC-03 | Tap feedback: scale 0.95 + alpha 0.8, duration 80ms           |

---

## 7. Scene-Specific Acceptance Criteria

### 7.1 BootScene / PreloadScene

| ID       | Criterion                                             |
|----------|-------------------------------------------------------|
| BOOT-01  | Loading bar centered at screen center (y=640)         |
| BOOT-02  | "Loading..." text >= 20px                             |
| BOOT-03  | Transition to next scene within 3 seconds             |

### 7.2 ModeSelectScene

| ID       | Criterion                                             |
|----------|-------------------------------------------------------|
| MODE-01  | WANCHAI title at 72px bold in Zone A                  |
| MODE-02  | Both mode cards in Zone B with SELECT buttons         |
| MODE-03  | CONTINUE RUN button in Zone C (if save exists)        |
| MODE-04  | Roguelike card has visual emphasis (accent border)     |
| MODE-05  | Version text >= 14px                                  |
| MODE-06  | SELECT buttons >= 280 x 52                            |

### 7.3 StageSelectScene

| ID       | Criterion                                             |
|----------|-------------------------------------------------------|
| STGE-01  | STAGE N displayed at 48px bold                        |
| STGE-02  | START button is the largest interactive element        |
| STGE-03  | START button >= 440 x 90 in Zone C                    |
| STGE-04  | Board preview cells clearly show element colors       |
| STGE-05  | Stage progress dots all >= 14px text                  |
| STGE-06  | Element legend labels >= 14px                         |
| STGE-07  | Best score + stars visible for completed stages       |

### 7.4 PartySelectScene

| ID       | Criterion                                             |
|----------|-------------------------------------------------------|
| PRTY-01  | Selection counter updates in real-time                |
| PRTY-02  | Critter cells >= 120 x 130 each                       |
| PRTY-03  | Critter name text >= 14px                             |
| PRTY-04  | AP badge text >= 16px                                 |
| PRTY-05  | Selected party preview label >= 14px                  |
| PRTY-06  | START RUN button disabled (alpha 0.4) until 4 selected|
| PRTY-07  | START RUN button in Zone C (y >= 1000)                |
| PRTY-08  | Element, rarity, and AP readable at a glance per cell |

### 7.5 RunMapScene

| ID       | Criterion                                             |
|----------|-------------------------------------------------------|
| RMAP-01  | Map nodes >= 72px diameter                            |
| RMAP-02  | Node type labels >= 14px                              |
| RMAP-03  | Floor number and purification score >= 22px           |
| RMAP-04  | Available nodes visually distinct (pulse animation)   |
| RMAP-05  | Current node has white border glow                    |
| RMAP-06  | Party preview label >= 14px                           |
| RMAP-07  | Info panel description >= 14px                        |
| RMAP-08  | Connection lines clearly show visited vs available    |

### 7.6 PuzzleScene + PuzzleUIScene

| ID       | Criterion                                             |
|----------|-------------------------------------------------------|
| PZLE-01  | HUD bar height <= 80px (maximize board space)         |
| PZLE-02  | Score counter at 42px monospace bold                  |
| PZLE-03  | Pause + Sound buttons >= 48 x 48                     |
| PZLE-04  | Combo text >= 22px                                    |
| PZLE-05  | Progress/HP bar clearly visible (240px wide)          |
| PZLE-06  | Level name >= 18px                                    |
| PZLE-07  | Cube count / HP text >= 16px                          |

### 7.7 RewardScene

| ID       | Criterion                                             |
|----------|-------------------------------------------------------|
| RWRD-01  | "BATTLE CLEAR!" at 48px in Zone A                     |
| RWRD-02  | Three reward cards clearly differentiated by color     |
| RWRD-03  | Reward card descriptions >= 16px                      |
| RWRD-04  | CONTINUE button disabled until reward selected        |
| RWRD-05  | CONTINUE button in Zone C (y >= 850)                  |
| RWRD-06  | Disabled cards dimmed with overlay (alpha >= 0.4)     |
| RWRD-07  | Score display uses 28px+ bold                         |

### 7.8 ShopScene

| ID       | Criterion                                             |
|----------|-------------------------------------------------------|
| SHOP-01  | Purification balance prominent (22px, gold)           |
| SHOP-02  | Cost values >= 22px                                   |
| SHOP-03  | PTS labels >= 14px                                    |
| SHOP-04  | LEAVE SHOP button in Zone C                           |
| SHOP-05  | Sold items clearly marked (SOLD! overlay)             |
| SHOP-06  | Party select overlay close button >= 48 x 48          |

### 7.9 RestScene

| ID       | Criterion                                             |
|----------|-------------------------------------------------------|
| REST-01  | Three option cards clearly distinguishable             |
| REST-02  | Option descriptions >= 16px                           |
| REST-03  | Sub-descriptions >= 14px                              |
| REST-04  | CONTINUE button disabled until option selected        |
| REST-05  | Selected option highlighted; unselected dimmed        |
| REST-06  | Result text >= 18px                                   |

### 7.10 EventScene

| ID       | Criterion                                             |
|----------|-------------------------------------------------------|
| EVNT-01  | Event title >= 28px                                   |
| EVNT-02  | Event description >= 18px with word wrap              |
| EVNT-03  | Both option buttons >= 300 x 60                       |
| EVNT-04  | Options disabled after choice (alpha 0.35)            |
| EVNT-05  | Result text >= 18px                                   |
| EVNT-06  | CONTINUE button in Zone C                             |
| EVNT-07  | 800ms delay before CONTINUE enables (read time)       |

### 7.11 ResultScene

| ID       | Criterion                                             |
|----------|-------------------------------------------------------|
| RSLT-01  | Title (STAGE CLEAR / GAME OVER) at 56px              |
| RSLT-02  | Star reveal animation plays sequentially (300ms each) |
| RSLT-03  | Score rolling counter at 56px monospace               |
| RSLT-04  | RETRY and NEXT buttons side-by-side in Zone C         |
| RSLT-05  | Both buttons >= 260 x 70                              |
| RSLT-06  | NEW BEST animation triggers when applicable           |

### 7.12 VictoryScene

| ID       | Criterion                                             |
|----------|-------------------------------------------------------|
| VICT-01  | "CONGRATULATIONS!" at 42px with animated reveal       |
| VICT-02  | Three trophy stars with sequential Back.easeOut       |
| VICT-03  | Confetti uses all 6 element colors                    |
| VICT-04  | PLAY AGAIN button in Zone C (y >= 1000)               |
| VICT-05  | Confetti does not obscure PLAY AGAIN button           |

### 7.13 RunResultScene

| ID       | Criterion                                             |
|----------|-------------------------------------------------------|
| RRES-01  | Title at 56px (green for win, red for loss)           |
| RRES-02  | Stats labels >= 14px (currently 11px -- violation)    |
| RRES-03  | Stats values >= 22px bold                             |
| RRES-04  | Party critter names >= 14px                           |
| RRES-05  | Critter level text >= 14px (currently 12px)           |
| RRES-06  | NEW RUN and MENU buttons in Zone C, >= 250 x 65      |
| RRES-07  | MENU goes to ModeSelectScene (not PartySelectScene)   |

---

## 8. Violation Inventory (Current State)

Summary of all violations found in the current codebase, organized by severity.

### 8.1 Critical (Blocks Usability)

| Scene            | Issue                  | Violation IDs  | Fix                       |
|------------------|------------------------|----------------|---------------------------|
| PartySelectScene | Critter name at 10px   | TYP-01, PRTY-03| Raise to 14px             |
| PartySelectScene | AP badge at 12px       | TYP-02, PRTY-04| Raise to 16px             |
| RunMapScene      | Node label at 10px     | TYP-01, RMAP-02| Raise to 14px             |
| RunResultScene   | Stats label at 11px    | TYP-01, RRES-02| Raise to 14px             |
| RunMapScene      | Node radius 30px       | TCH-06, RMAP-01| Increase to r=36          |

### 8.2 Major (Degrades Experience)

| Scene            | Issue                  | Violation IDs  | Fix                       |
|------------------|------------------------|----------------|---------------------------|
| PartySelectScene | Cell size 110x120      | TCH-07, PRTY-02| Increase to 120x130       |
| PartySelectScene | Selected Party at 13px | TYP-01, PRTY-05| Raise to 14px             |
| RunMapScene      | YOUR PARTY at 12px     | TYP-01, RMAP-06| Raise to 14px             |
| RunMapScene      | PURIFICATION at 12px   | TYP-01         | Raise to 14px             |
| RunMapScene      | Stage progress at 12px | TYP-01         | Raise to 14px             |
| RunResultScene   | Critter level at 12px  | TYP-01, RRES-05| Raise to 14px             |
| RewardScene      | Card description 13px  | TYP-01, RWRD-03| Raise to 16px             |
| ShopScene        | PTS label at 13px      | TYP-01, SHOP-03| Raise to 14px             |
| RestScene        | Sub-description 13px   | TYP-01, REST-03| Raise to 14px             |
| RewardScene      | SELECTED text 13px     | TYP-01         | Raise to 14px             |
| ShopScene        | Close btn no hit zone  | TCH-01, SHOP-06| Add 48x48 zone            |
| RestScene        | Close btn no hit zone  | TCH-01, REST-01| Add 48x48 zone            |
| RunResultScene   | MENU goes to wrong scene| RRES-07       | Navigate to ModeSelectScene|

### 8.3 Minor (Polish)

| Scene            | Issue                  | Violation IDs  | Fix                       |
|------------------|------------------------|----------------|---------------------------|
| ModeSelectScene  | Version at 13px        | TYP-01, MODE-05| Raise to 14px             |
| StageSelectScene | Board Preview lbl 13px | TYP-01         | Raise to 14px             |
| StageSelectScene | Element name 13px      | TYP-01, STGE-06| Raise to 14px             |
| StageSelectScene | Stage pill text 11px   | TYP-01, STGE-05| Raise to 14px             |

### 8.4 Total Violation Count

- **Critical**: 5
- **Major**: 13
- **Minor**: 4
- **Total**: 22

---

## Appendix A: Scene Flow Diagram

```
                    BootScene
                       |
                  PreloadScene
                       |
                 ModeSelectScene
                  /          \
          [Classic]        [Roguelike]
             |                 |
      StageSelectScene   PartySelectScene
             |                 |
        PuzzleScene       RunMapScene <------------------+
        + PuzzleUI        /   |   |    \                 |
             |        battle shop rest event              |
        ResultScene   PuzzleScene ShopScene RestScene EventScene
          /    \      + PuzzleUI     |        |         |
       [win] [lose]      |          |        |         |
         |      |    RewardScene    |        |         |
     [next] [retry]      |         |        |         |
         |      |        +---------+--------+---------+
   StageSelectScene           |
         |              RunMapScene (next node / next floor)
    (after stage 10)         |
         |             [floor boss killed -> next floor OR run complete]
    VictoryScene             |
                      RunResultScene
                        /        \
                  [NEW RUN]   [MENU]
                      |          |
              PartySelectScene  ModeSelectScene
```

---

## Appendix B: Color Token Reference

For quick reference when verifying text colors against acceptance criteria.

| Token       | Hex       | Usage                          | Contrast vs #1a1a2e |
|-------------|-----------|--------------------------------|---------------------|
| `#ffffff`   | White     | Titles, button labels          | 15.3:1              |
| `#e2e8f0`   | Light     | Primary body text, values      | 12.8:1              |
| `#a0aec0`   | Medium    | Descriptions, subtitles        | 6.8:1               |
| `#718096`   | Muted     | Secondary info, labels         | 4.0:1 (borderline)  |
| `#4a5568`   | Dim       | Captions, footer, disabled     | 2.3:1 (decorative)  |
| `#e94560`   | Accent    | Highlights, emphasis           | 5.2:1               |
| `#38b868`   | Success   | Win states, confirm            | 5.5:1               |
| `#f0d050`   | Gold      | Stars, premium, rewards        | 9.2:1               |
| `#50c878`   | Green     | Rest, recruit, heal            | 6.3:1               |
| `#5090f8`   | Blue      | Battle nodes, scout            | 4.8:1               |
| `#9060d8`   | Purple    | Events, relics                 | 3.6:1 (caution)     |

**Note**: `#718096` at 4.0:1 is below the 4.5:1 minimum for body text. It is
acceptable ONLY for decorative/non-essential labels. Any informational text using
this color must be raised to `#a0aec0` (6.8:1) or the font size must be >= 18px
(which reduces the required ratio to 3.0:1 for "large text" per WCAG).
Similarly, `#9060d8` at 3.6:1 should only be used at >= 18px bold.

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
