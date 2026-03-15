# WanChai UI/UX Quality Audit

**Date**: 2026-02-25
**Auditor**: UI Designer (ui-designer agent)
**Resolution target**: 720x1280 portrait, retro GBC/Pokemon-inspired dark theme
**Overall verdict**: REVISE — multiple screens have critical hierarchy, scale, and clarity failures

---

## Executive Summary

The retro GBC/Pokemon aesthetic direction is coherent and the code structure is clean. However the user's core complaint is validated: **elements are too small, screen intent is unclear, and the visual hierarchy is broken across all five screens**. The most severe systemic failures are:

1. The `GLASS` constant in `colors.ts` is deprecated and replaced by `RETRO`, but `RETRO.radius = 6` — far below the guideline-mandated 12–24px range. This makes every panel feel cramped and inconsistent.
2. The HUD score text (`42px`) and level name (`18px`) create no meaningful hierarchy. Everything reads at the same visual weight.
3. The PuzzleUIScene top bar is only 90px tall but tries to pack 6+ elements (pause, sound, level name, combo, cube count, progress bar, score) — resulting in a cluttered, unreadable bar.
4. Touch targets for the pause button (40x40px) and gear icon (28px text, no explicit hit zone) are below the 48dp minimum.
5. The ResultScene delivers no visual celebration moment — the star area at y=350 and buttons at y=800 leave 400px of dead space between them with no connecting rhythm.

---

## Screen-by-Screen Analysis

---

### Screen 1 — StageSelectScene (Main Menu / Stage Select)

**Grade: C-**

#### Hierarchy

- The title "WANCHAI" at 72px is strong and bold — this is the best hierarchy decision in the codebase.
- The subtitle "ELEMENTAL HEROES" at 22px immediately below is correct scale.
- **Critical failure**: After the title, the layout collapses into equal-weight elements. The stage info panel, board preview, element legend, and star progress all read at similar visual weights. There is no clear "this is the next action" signal until the START button at y=890.
- The START button at y=890 (in the bottom third, roughly y=853–1280) is correctly placed for thumb reach. However it is surrounded by too many competing elements above it — the board preview at y=600 and element legend at y=770 draw the eye away from the primary action.

#### Scale

- The board preview cells are 14x14 px dots — this is decorative at best and unreadable at worst. A player cannot discern element arrangement from dots this small on a real device. On a 720px-wide screen with DPR scaling, these will look like a smear of color.
- The difficulty badge (150x32px) is present but set at `fontSize: '16px'` — too small to be a bold, immediate signal.
- The star progress bar (360x12px) at y=1070 is positioned between the start button and the footer. On a 1280px screen this is nearly off-screen on shorter devices and separated from all related content.
- The "BOARD PREVIEW" label is 13px — not legible at mobile viewing distance.

#### Clarity

- The screen presents too many pieces of information simultaneously: game title, stage number, progress dots, level name, difficulty badge, best score, board preview, element legend, start button, TAP TO START, star progress bar, version number, and ambient particles. A first-time player cannot identify the primary call to action within 2 seconds.
- The blinking "TAP TO START" at 18px at y=975 sits below the start button, which is confusing — the button already is the tap target.
- The stage progress dots (36x20px each) do not have enough size differentiation between "current", "completed with stars", and "locked" states. The gold pill for completed stages is good, but "current" (accent fill) versus "future" (outline only) are nearly indistinguishable in dark themes at small sizes.

#### Touch Targets

- The gear/settings button is a text element (`'\u2699'`, 28px font) with no explicit interactive hit zone — the text bounding box is the touch target, approximately 28x28px. This is below the 48dp minimum.
- The START button is 440x90px — well above minimum. Good.
- Stage progress dots: 36x20px — significantly below 48dp minimum for touch. Players who try to tap a past stage will have difficulty.

#### Spacing

- The brand zone (y=60–220) and stage info zone (y=250–420) are well separated.
- The gap between the element legend (y=770) and start button (y=890) is only 120px and is partly occupied by the blinking text — this compression makes the button feel hemmed in rather than breathing.

#### Inconsistencies

- The gear button uses direct hex `'#718096'` as a color string. The style guide mandates no hardcoded colors — `UI_COLORS.textDim` should be used.
- `RETRO.radius = 6` is used for the difficulty badge (`borderRadius`). The guideline specifies 12–24px for cards/badges.
- The decorative accent divider at y=215 is drawn as a `rectangle(cx, 215, 480, 2, RETRO.borderColor, 0.4)` — this uses `RETRO.borderColor` directly which is `0x2d3748`, making it nearly invisible against the dark background.

#### Specific Fixes Required

| Issue                                          | Location      | Fix                                                               |
| ---------------------------------------------- | ------------- | ----------------------------------------------------------------- |
| Gear button hit zone too small                 | Line 60–80    | Replace `text` with explicit `zone(670, 50, 56, 56)` hit area     |
| Stage dots below 48dp touch target             | Lines 163–277 | Increase dot size to 44x44 minimum, reduce count to max 7 visible |
| Board preview cells too small (14px dots)      | Lines 430–488 | Increase to 20px cells or replace with element color swatches     |
| "BOARD PREVIEW" label 13px                     | Line 453      | Increase to 16px minimum, or remove this redundant label          |
| Blinking "TAP TO START" conflicts with button  | Lines 382–397 | Remove or move below button, use caption size 14px dimmer         |
| Star progress bar too far from related content | Lines 399–671 | Move star count directly under stage info panel (y~470)           |
| Difficulty badge radius 6px                    | Line 302      | Change to 12px                                                    |
| Hardcoded `'#718096'` color                    | Line 63       | Replace with `UI_COLORS.textDim` hex string                       |

---

### Screen 2 — PuzzleUIScene (Gameplay HUD)

**Grade: D**

#### Hierarchy

- The score text at 42px is the largest element in the HUD — this is correct. However the "SCORE" label above it is only 16px, creating an orphaned caption that reads as noise rather than structure.
- The level name at 18px and combo text at 22px compete visually in the same left zone. During active gameplay, the combo flash to 1.4x scale makes it jump to approximately 31px — which now dominates the level name but neither label has enough size contrast to form a clear hierarchy.
- The cube count text ("X cubes") at 16px center-top is the least visible element in the HUD, yet it represents the most important gameplay signal: how many cubes remain.

#### Scale

- The progress bar is 240x12px. At 720px width this is one-third of the screen. The bar height of 12px is too thin to read at a glance — the guideline specifies 200x12px, which this exceeds in width (good) but matches in height (borderline).
- The pause button background is 40x40px — below the 48dp minimum.
- The sound toggle button is 40x40px — below the 48dp minimum.
- Both icon buttons are placed at x=30 and x=72 — the spacing between them is 32px (center-to-center), meaning their 40px hit zones overlap by 8px.
- The score number at 42px is correct per spec, but the full HUD bar height is only 90px. With safe area top of 40px, the actual bar occupies y=40 to y=130. At 90px tall with score at 42px + 16px "SCORE" label stacked, plus pause/sound buttons, there is severe vertical compression.

#### Clarity

- **Critical**: There is no immediately visible "remaining cubes" or progress indicator that a player can comprehend at a glance. The "X cubes" text at 16px center reads as a tooltip, not a gameplay status.
- The sound toggle uses text characters `'x'` for muted and `'#'` for unmuted — these are not intuitive symbols. A player unfamiliar with this convention has no idea what `'#'` means as a sound state indicator.
- The level name appears in the HUD during play — while useful for reference, it competes with the combo display. In practice the combo text will replace the effective reading position of the level name label whenever active.

#### Spacing

- Left column: pause (x=30), sound (x=72), level name (x=100 left-aligned), combo (x=100 left-aligned). The level name starts at x=100 and the sound button ends at approximately x=92 — there is only 8px gap between the sound button and level name text.
- The right-side score area clips at x=GAME_WIDTH-30 = 690. The score at 42px bold with right-anchor at 690 means the score number can be as wide as ~120px, coming close to the center progress bar territory on high scores (5+ digit numbers).

#### Consistency with Spec

- Per guideline section 4.2: Score should be 42px monospace — PASS.
- Per guideline section 4.2: Progress bar at center-top — PASS on position, but the 12px bar height makes this weak.
- Per guideline section 3.1: Minimum 48dp touch targets — FAIL on pause (40x40) and sound (40x40).
- Per guideline section 4.2: Combo at left, 32px bold — FAIL, combo is 22px and only scales on event.

#### Specific Fixes Required

| Issue                                      | Location      | Fix                                                                                                |
| ------------------------------------------ | ------------- | -------------------------------------------------------------------------------------------------- |
| Pause button 40x40 below minimum           | Lines 65–68   | Increase to 48x48, zone to 56x56                                                                   |
| Sound button 40x40 below minimum           | Lines 91–95   | Increase to 48x48, zone to 56x56                                                                   |
| Sound icon `'#'` / `'x'` not intuitive     | Lines 98–104  | Replace with unicode speaker symbols: `'\uD83D\uDD0A'` / `'\uD83D\uDD07'` or simple `'ON'`/`'OFF'` |
| Cube count "X cubes" too small at 16px     | Lines 137–144 | Increase to 20px, change label to `'X LEFT'`, bold                                                 |
| Combo text 22px — too small for excitement | Lines 126–134 | Increase base to 28px bold, matching guideline 32px heading spec                                   |
| Progress bar 12px height — too thin        | Lines 148–157 | Increase to 16px minimum, increase bar corner radius to match                                      |
| Pause/sound buttons overlap hit zones      | Lines 63, 89  | Increase spacing: pause at x=36, sound at x=88 (52px gap)                                          |
| Score "SCORE" label 16px orphaned          | Lines 169–177 | Reduce "SCORE" label to caption 13px, increase contrast by using `UI_COLORS.textDim`               |

---

### Screen 3 — ResultScene (Stage Complete / Game Over)

**Grade: C**

#### Hierarchy

- The title ("STAGE CLEAR!" / "GAME OVER") at 56px is appropriately large and uses color to signal outcome (green vs red). This is the strongest hierarchy decision in this screen.
- Stars at y=350, score panel at y=515, buttons at y=800 — the vertical rhythm has three anchor points but no visual connectors. 250px of dead space sits between score (y=575 at panel bottom) and buttons (y=765 at button top). This break-in-rhythm reduces impact.
- The "SCORE" label at 18px above the score number at 56px is correctly smaller, but 18px is too large to read as a caption — it competes with the score value.

#### Scale

- Stars are `setDisplaySize(64, 64)` with `scale(0)` animate to 1.0 — final rendered star size is 64x64px. On a 720px screen this is modest. The guideline's retro aesthetic would benefit from larger stars (96x96 or even 80x80 display plus scale pop to 1.2).
- Star spacing: `starSpacing = 80` puts the three stars at x=280, 360, 440 — this is a 160px total span on a 720px screen. The star cluster feels small relative to the achievement it celebrates.
- The score panel (400x120px) hosts a 56px number — the panel is sized correctly but centered at y=515 puts it in the visual middle of the screen rather than reading as a clear focal point.
- The retry/next buttons (260x70px each) are correctly sized but side-by-side at 520px total width with 260px spacing means the two buttons nearly touch edge-to-edge. The gap between them is `btnSpacing - width = 260 - 260 = 0` — they are immediately adjacent with no breathing room.

#### Clarity

- The game over variant (loss) correctly changes title color to red and shows RETRY + MENU. This is clear.
- The win variant shows RETRY + NEXT — but "NEXT" may be confusing when all stages are complete and it reads "COMPLETE". "COMPLETE" as a button label implies action ("tap to complete") but actually navigates to VictoryScene. The label should be "FINISH" or "SEE RESULTS".
- The "BEST: XXXXX" text at 16px at y=610 is very small and easy to miss. This is valuable competitive information that should have more presence.
- "NEW BEST!" animation at 24px is reasonable but the pop-in at y=610 (just below score panel) is hard to notice because it appears after a 1600ms delay when the player has already moved their attention downward to the buttons.

#### Touch Targets

- Retry button: 260x70px — above minimum. Good.
- Next/Menu button: 260x70px — above minimum. Good.
- No other interactive elements on this screen.

#### Spacing

- Buttons at y=800 with height=70 means they span y=765–835. The screen bottom is at y=1280. The buttons are positioned at roughly 62% screen height — not in the bottom third (y=853+). This violates the guideline: primary actions must be in the bottom 1/3.
- The gap from score panel bottom (y=575) to button top (y=765) is 190px of unused space.

#### Inconsistencies

- The empty star texture is drawn with `fillStyle(0x2d3748)` — this is a dark grey star on a dark background, which renders as nearly invisible. Empty stars should be visually present (outline-only or lighter fill).
- The ambient particles use the same `createAmbientParticles()` logic as StageSelectScene — this is good consistency, but the particles are defined inline in both files rather than extracted to a shared utility.

#### Specific Fixes Required

| Issue                                  | Location                   | Fix                                                              |
| -------------------------------------- | -------------------------- | ---------------------------------------------------------------- |
| Buttons at y=800 not in bottom third   | Lines 270–338              | Move buttons to y=980–1060 range                                 |
| Star display size too modest (64px)    | Lines 117–130              | Increase to 80px display size                                    |
| Star cluster too narrow (160px span)   | Line 117                   | Increase `starSpacing` to 110, center at screen width            |
| Button gap = 0 between retry/next      | Lines 275–298              | Reduce each button width to 220, keep spacing at 260             |
| "COMPLETE" label misleading            | Line 301                   | Change to `'FINISH'`                                             |
| "BEST" text 16px — too small           | Line 220                   | Increase to 20px                                                 |
| "NEW BEST!" appears too late and small | Lines 231–266              | Increase to 28px, move to y=590, trigger at 1000ms               |
| Empty star nearly invisible            | TextureFactory.ts line 232 | Change `fillStyle(0x2d3748)` to outline-only star or `alpha 0.3` |

---

### Screen 4 — VictoryScene (All Stages Complete)

**Grade: C+**

#### Hierarchy

- "CONGRATULATIONS!" at 42px fades in from y=280 — the fade-in from above is a nice entrance but 42px for the most climactic screen title is too small. Per guideline, Title should be 48px. This is a special screen that warrants even larger — 64px or the same 72px used for the main "WANCHAI" brand title.
- The sub-message "All stages cleared!" at 22px (Body spec) is correct.
- The three trophy stars animate correctly with sequential reveals and particle bursts — this is the best-executed sequence in the game.

#### Scale

- Stars: outerR=36 for side stars, outerR=46 for center — these are procedural graphics with reasonable sizes. However at 46px outer radius, the center star renders approximately 92px wide, which on 720px is still modest for a victory screen.
- The main panel (580x420px centered at y=480) provides good structural presence.
- The PLAY AGAIN button is 280x70px — minimum spec calls for 200x56dp minimum, this exceeds it. Good.
- The "PLAY AGAIN" button is at y=800. Screen bottom is 1280. This places the button at 62% — not in the bottom third. Same violation as ResultScene.

#### Clarity

- The screen is clearer than ResultScene — there is only one action (PLAY AGAIN). The title, stars, and single button create a logical visual path.
- Missing: a total stars summary or high score review. The player has just completed the entire game but gets no retrospective on their performance. A "You collected X/30 stars" summary would add meaningful closure.

#### Touch Targets

- PLAY AGAIN button: 280x70px — PASS.

#### Spacing

- The confetti starts at y=700 (good), but the PLAY AGAIN button at y=800 is below the falling confetti starting point, causing confetti to overlap the button. Since confetti is depth 50 and the button is depth 100, the button visually wins — but the confetti occluding the button's surroundings creates visual noise around the primary action.

#### Specific Fixes Required

| Issue                                             | Location | Fix                                                          |
| ------------------------------------------------- | -------- | ------------------------------------------------------------ |
| Title 42px — too small for victory screen         | Line 41  | Increase to 64px                                             |
| PLAY AGAIN button at y=800 not in bottom third    | Line 85  | Move to y=1050                                               |
| No performance summary                            | —        | Add total stars + high score line at y=680                   |
| Top border uses `RETRO.borderColor` which is dark | Line 27  | Use `UI_COLORS.accent` for the top border like other screens |

---

### Screen 5 — PuzzleScene (Gameplay)

**Grade: C-**

#### Layout

- The layout calculation is dynamic and respects the grid size — this is architecturally sound.
- `topStart = VISUAL.UI.SAFE_AREA_TOP + VISUAL.UI.TOP_BAR_HEIGHT + 20 = 150` — the game area begins at y=150.
- `BELT_HERO_SIZE = 44px` — this is a file-local constant that bypasses `VISUAL.UI.MIN_TOUCH_TARGET = 56`. Belt heroes are 44px, which is below the 48dp minimum touch target. The game's primary interactive elements (heroes on belt) do not meet minimum touch spec.

#### Scale

- `VISUAL.CUBE_SIZE = 80px` — appropriate. However the board for a 6x6 grid would be `6 * (80+4) = 504px` wide, centering at x=360, leaving 108px margin per side. This is workable but very tight on 720px.
- The queue area at `VISUAL.QUEUE_HEIGHT = 120px` is reasonable for 48px hero sprites but the heroes in the queue use `hero_queue_${element}` at `3x` scale (48px) — correct per spec. However the bench slots at `BENCH_SLOT_SIZE = 64px` and bench area are drawn below the queue, pushing the bottom of the gameplay content zone down. The total from y=150 (game start) to y=(beltBottom + BELT_OFFSET + 20 + queue + bench) can exceed y=1100, leaving very little room.

#### Clarity

- The belt track draw function draws a solid black 2px line — consistent with the retro aesthetic. However, the belt hero positions on this track rely purely on position to convey "which hero fires at which column." There is no visual indicator (crosshair, arrow, or column highlight) showing the player where a given hero's projectile will land on the board above. This is a gameplay clarity issue that has UI implications.
- The bench area has `benchCountText` but no visual label explaining what the bench IS for new players. The tutorial only shows on Stage 1 first play.

#### Specific Fixes Required

| Issue                                    | Location            | Fix                                                                              |
| ---------------------------------------- | ------------------- | -------------------------------------------------------------------------------- |
| `BELT_HERO_SIZE = 44` below 48dp minimum | Line 21             | Increase to 56 (matches `VISUAL.UI.MIN_TOUCH_TARGET`)                            |
| No column alignment indicator            | `drawBeltTrack()`   | Add subtle vertical dashed line from belt position to corresponding board column |
| Bench has no persistent label            | `createBenchArea()` | Add "BENCH" label above bench area (14px caption)                                |

---

## Cross-Screen Systemic Issues

### 1. Panel Radius vs Spec

**Severity: High**

The `RETRO.radius = 6` is used everywhere as the default corner radius. The guideline mandates 12–24px.

| Location                            | Current              | Required                   |
| ----------------------------------- | -------------------- | -------------------------- |
| `createRetroPanel()` default        | 6px                  | 16px (HUD panel)           |
| `createButton()`                    | 6px (`RETRO.radius`) | 16px (Primary button spec) |
| Difficulty badge (StageSelectScene) | 6px                  | 12px                       |
| Stage progress dots                 | 4px                  | 8px                        |

**Fix**: Update `RETRO.radius` from 6 to 12 as the floor. Override to 16 in `createRetroPanel` and `createButton`. This single change improves the visual quality of every screen simultaneously.

### 2. Button Primary Action Placement

**Severity: High**

The guideline states primary actions must be in the bottom 1/3 (y > 853 for 1280px screen). Current violations:

| Screen                  | Button Y | Required Min Y |
| ----------------------- | -------- | -------------- |
| ResultScene RETRY/NEXT  | 800      | 853            |
| VictoryScene PLAY AGAIN | 800      | 853            |
| StageSelectScene START  | 890      | 853 — PASS     |

**Fix**: Move ResultScene and VictoryScene primary buttons to y=980–1080 range.

### 3. GLASS Constant Deprecated But Partially Used

**Severity: Medium**

`GLASS.panelAlpha = 1.0` and `GLASS.borderAlpha = 1.0` in `colors.ts` are explicitly deprecated. The `GlassPanelConfig` interface still accepts `alpha` and `borderAlpha` parameters but marks them "ignored (kept for compat)". Any future developer adding a panel will see alpha parameters in the config and expect them to work — they will not. The deprecated constant and the ignored parameters should be removed to prevent confusion.

**Fix**: Remove `GLASS` constant entirely from `colors.ts`. Remove `alpha` and `borderAlpha` from `GlassPanelConfig` or document them as removed.

### 4. Missing Disabled Button State

**Severity: Medium**

`createButton()` has no `disabled` parameter. The guideline requires disabled state at alpha 0.4 with interaction disabled. Currently every button is always enabled with no visual disabled state available.

**Fix**: Add `disabled?: boolean` to `ButtonConfig`. When true, set container alpha to 0.4 and skip adding event listeners.

### 5. Touch Feedback Hover Scale Too Low

**Severity: Low**

`createButton()` hover sets `container.setScale(1.02)`. The guideline specifies `scale 1.05x` on hover. The current 1.02x is imperceptible on mobile and provides no meaningful feedback.

**Fix**: Change hover scale from `1.02` to `1.05`.

### 6. Sound Toggle Icon Not Intuitive

**Severity: Medium**

The `'#'` and `'x'` characters for sound on/off are not universally understood symbols. The guideline states "do not use color alone to convey information" — but this goes further by using non-standard symbols. On real devices with small text, `'#'` looks like a hashtag and `'x'` looks like a close button.

**Fix**: Use unicode speaker symbols:

- Muted: `'\u{1F507}'` (muted speaker) or simple `'SFX'` label
- Unmuted: `'\u{1F50A}'` (loud speaker) or bold `'SFX'`

Alternatively, use a dedicated pixel-art texture from `TextureFactory.generateUITextures()`.

### 7. Ambient Particle Code Duplication

**Severity: Low**

`createAmbientParticles()` is identically implemented in both `StageSelectScene.ts` and `ResultScene.ts`. This violates DRY and makes future tweaks require dual edits.

**Fix**: Extract to a shared utility in `src/ui/AmbientParticles.ts`.

### 8. Score Counter Placement in ResultScene

**Severity: Medium**

The ScoreCounter rolls to the final score, but the score panel center is at y=515 with the score text at y=515+18=533. On a 1280px screen this puts the climactic score reveal at just 42% screen height — near the center, but well above where the player's thumb (and attention) naturally rests on a phone held vertically.

**Fix**: Move score panel to y=620, score text to y=638. This creates a stronger bottom-half emphasis rhythm alongside the stars above.

---

## Priority Action List

Actions ranked by player-visible impact:

| Priority | Issue                                                   | Screen(s)           | Effort  |
| -------- | ------------------------------------------------------- | ------------------- | ------- |
| P1       | Move primary action buttons to bottom third (y>853)     | Result, Victory     | Low     |
| P1       | Increase `RETRO.radius` from 6 to 12 globally           | All                 | Low     |
| P1       | Fix pause/sound buttons to 48dp minimum                 | PuzzleUI            | Low     |
| P1       | Fix gear button to have explicit 56x56 hit zone         | StageSelect         | Low     |
| P2       | Increase star cluster size and spacing in ResultScene   | Result              | Low     |
| P2       | Increase `BELT_HERO_SIZE` from 44 to 56                 | PuzzleScene         | Low     |
| P2       | Replace sound icon characters with speaker unicode      | PuzzleUI            | Low     |
| P2       | Increase hover scale from 1.02 to 1.05 in ButtonFactory | All                 | Trivial |
| P2       | Increase title size on VictoryScene from 42px to 64px   | Victory             | Trivial |
| P3       | Extract `createAmbientParticles` to shared utility      | StageSelect, Result | Medium  |
| P3       | Add `disabled` state to `createButton()`                | ButtonFactory       | Low     |
| P3       | Remove deprecated `GLASS` constant                      | colors.ts           | Trivial |
| P3       | Add column alignment indicator on belt                  | PuzzleScene         | Medium  |
| P3       | Move score panel lower in ResultScene                   | Result              | Low     |

---

## What Is Working Well

These elements are correctly implemented and should be preserved:

- **Title "WANCHAI" at 72px with glow pulse**: Strong brand presence, correct scale
- **Star sequential reveal animation**: `Back.easeOut`, 300ms delay per star — matches spec exactly
- **ScoreCounter class** with `rollTo()`: 800–1500ms Power2 easeOut — matches spec exactly
- **Confetti in VictoryScene**: Element color palette, continuous loop, correct depth layering
- **Scene fade transitions**: Camera fadeIn/fadeOut at 500ms — matches `VISUAL.ANIM.SCENE_FADE`
- **START button idle pulse**: 1.03x scale Sine.easeInOut — subtle and appropriate
- **Sling combo text scale pop**: 1.4x Back.easeOut — readable and exciting
- **Board preview panel**: Centered, properly labeled, good depth layering
- **Star fly-out animation on NEXT**: Gold trail particles + spin + flight to top — delightful detail
- **Dynamic layout calculation** in PuzzleScene: Correctly responds to board dimensions

---

## Files Requiring Changes (Summary)

| File                              | Changes Needed                                                            |
| --------------------------------- | ------------------------------------------------------------------------- |
| `/src/config/colors.ts`           | Remove `GLASS` constant; update `RETRO.radius` from 6 to 12               |
| `/src/ui/GlassPanel.ts`           | Remove `alpha`/`borderAlpha` params; update default radius to 16          |
| `/src/ui/ButtonFactory.ts`        | Add `disabled` param; fix hover scale 1.02→1.05; update radius            |
| `/src/scenes/StageSelectScene.ts` | Gear button hit zone; stage dot sizes; star progress position             |
| `/src/scenes/PuzzleUIScene.ts`    | Pause/sound button sizes; sound icon; cube count size; combo text size    |
| `/src/scenes/ResultScene.ts`      | Move buttons to bottom third; increase star sizes; fix empty star texture |
| `/src/scenes/VictoryScene.ts`     | Increase title size; move button to bottom third; add score summary       |
| `/src/scenes/PuzzleScene.ts`      | Increase `BELT_HERO_SIZE` to 56; add column alignment indicators          |
| `/src/utils/TextureFactory.ts`    | Fix empty star texture visibility                                         |

---

_End of audit. Overall recommendation: address all P1 items before next playtesting session. P2 items target the next sprint. P3 items are polish for release candidate._
