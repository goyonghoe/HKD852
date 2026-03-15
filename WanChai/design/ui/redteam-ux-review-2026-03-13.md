# RedTeam Adversarial UX Review — 2026-03-13

> **Project**: WanChai NeonSurvivor (Phaser 3, 1280x720 landscape)
> **Reviewer**: RedTeam Agent
> **Final Verdict**: **REDTEAM:APPROVE** (Round 3)

---

## Round 3 Review (post-fixer RedTeam fixes)

> **Auditor Score**: 73/100 (B-)
> **Score progression**: R1 70 → R2 72 → R3 73
> **RedTeam fix items applied**: **4 of 4**
> **Round 3 Verdict**: **REDTEAM:APPROVE**

### Verification of All 4 Fix Items

| #   | Item                            | Status    | Evidence                                                                                       |
| --- | ------------------------------- | --------- | ---------------------------------------------------------------------------------------------- |
| 1   | Scene transition fadeOut (HIGH) | **FIXED** | `SceneNav.ts:45-51` — fadeOut(300) + camerafadeoutcomplete wrapping all non-launch transitions |
| 2   | Empty LevelUp when maxed (MED)  | **FIXED** | `LevelUpUIManager.ts:202-213` — shows gold "All maxed" text + auto-skip after 1s               |
| 3   | CodexScene cleanup (LOW)        | **FIXED** | `WeaponCodexScene.ts:18-20` + `EnemyCodexScene.ts:100-105` — shutdown() destroys containers    |
| 4   | GameOver button overflow (LOW)  | **FIXED** | `GameOverCalc.ts:76-78` — Math.min(computed, GAME_HEIGHT_REF - 180) cap                        |

### Remaining Items (accepted, not blocking)

- P8 (21 distinct font sizes) — systemic, needs consolidation sprint. Not a RedTeam concern.
- P12 (codex lock/unlock) — already partially implemented (silhouettes + "???"). Auditor may re-score.

### Approval Conditions

All competitive-gap and edge-case issues identified in Round 1 have been addressed. The game now has:

- Smooth fade transitions on ALL scene exits (not just MainMenu/CharacterSelect)
- Graceful handling of max-upgrade edge case
- Proper scene cleanup to prevent memory leaks
- Button overflow protection in challenge mode

---

## Round 2 Review (post-fixer auditor fixes)

> **Auditor Score**: 72/100 (B-) — up from 70/100 in Round 1
> **Fixer applied**: Auditor MUST fixes (P10 error prevention, button feedback, corner radius)
> **RedTeam Round 1 fixes applied**: **0 of 4**
> **Round 2 Verdict**: **REDTEAM:REJECT** (same 4 fix items outstanding)

### Re-verification of Round 1 Fix Items

| #   | Item                            | Status        | Evidence                                                       |
| --- | ------------------------------- | ------------- | -------------------------------------------------------------- |
| 1   | Scene transition fadeOut (HIGH) | **NOT FIXED** | `src/utils/SceneNav.ts` unchanged — no fadeOut integration     |
| 2   | Empty LevelUp when maxed (MED)  | **NOT FIXED** | `src/managers/LevelUpUIManager.ts` — no empty-choices handling |
| 3   | CodexScene cleanup (LOW)        | **NOT FIXED** | `src/scenes/WeaponCodexScene.ts` — no `shutdown()` method      |
| 4   | GameOver button overflow (LOW)  | **NOT FIXED** | `src/core/GameOverCalc.ts:76` — no Math.min cap                |

### Positive Changes Noted

- P10 error prevention: MetaScene unaffordable cards now properly gated (5 to 7 points)
- Button feedback scale values corrected (1.05/0.95)
- Corner radius normalized

**Rejection reason unchanged**: P2-3 scene transitions remain BELOW STANDARD. The fixer addressed auditor items only, not RedTeam items. All 4 RedTeam fix items must be addressed before APPROVE.

---

## Round 1 Full Review (original analysis below)

---

## Perspective 1: First-Time User Test

> "Can a player who has never seen this game understand what to do within 30 seconds?"

### 1-1. MainMenuScene — START button visibility

**Verdict: PASS**

- PLAY button: 340x80px, `variant: 'primary'` (accent color), centered at y=420.
- Largest interactive element on screen. Immediately draws attention.
- `MainMenuScene.ts:89-104`: fadeOut(300) before navigating — smooth transition.
- 4 icon buttons at y=630 (codex, settings, etc.) are secondary and smaller — correct visual hierarchy.

**Evidence**: `src/scenes/MainMenuScene.ts:89` — `width: 340, height: 80, variant: 'primary'`

### 1-2. CharacterSelectScene — Can the player choose in <5 seconds?

**Verdict: PASS (marginal)**

- 5 character cards (200x260) in a single row. Element badges visible. Passive descriptions via i18n.
- Locked characters: alpha 0.6 + no setInteractive — clear locked state.
- GO button appears only after selection (300x72 at bottom) — prevents confusion.
- **Concern**: Passive descriptions use i18n keys. If text is long, 200px card width may truncate. Not a FAIL but worth monitoring with localized strings.

**Evidence**: `src/scenes/CharacterSelectScene.ts:136-180` — card layout, `src/scenes/CharacterSelectScene.ts:287` — fadeOut(500) on GO.

### 1-3. Tutorial — Does it actually help a total newcomer?

**Verdict: PASS**

- 4-step progressive tutorial: movement (500ms timer) → weapons (first kill) → level up (levelup phase) → supply point (shop phase).
- Non-blocking overlay — player can still play while reading. Good design for auto-shooter genre.
- Auto-dismiss on timeout (5-8s per step) — won't block progress if ignored.
- Event-driven via `handleEvent()` — triggers at correct moments, not arbitrary timers.

**Evidence**: `src/core/TutorialHintCalc.ts:1-80` — pure state machine. `src/ui/TutorialOverlay.ts` — renderer.

### 1-4. RunScene HUD — Information overload?

**Verdict: PASS (marginal)**

- HUD elements: kill counter, timer, level, gold, stage, speed, weather, district, FPS, weapon slots, HP gauge.
- Organized by rows via HUDManager + GaugePanel + WeaponSlotPanel.
- Dirty-flag caching prevents per-frame text updates — performance is fine.
- **Concern**: 10+ simultaneous text elements on a 1280x720 screen. For a first-time player, this is a lot to absorb. However, the auto-shooter genre convention is to show all stats, and the tutorial guides attention progressively. Acceptable.

**Evidence**: `src/managers/HUDManager.ts` — delegates to sub-panels.

### 1-5. LevelUpUI — Clear enough choice presentation?

**Verdict: PASS**

- Cards show: name (24px), description (20px), stat desc (14px), level label (22px).
- Auto-select timer bar provides urgency without pressure (player can still manually choose).
- Skip button (160x48) available.
- `scoreBestChoice()` highlights recommended option — helpful for newcomers.

**Evidence**: `src/managers/LevelUpUIManager.ts:101-102` — scoreBestChoice, `LevelUpUIManager.ts` card layout.

### Perspective 1 Summary

| Sub-check            | Verdict         |
| -------------------- | --------------- |
| 1-1 START button     | PASS            |
| 1-2 Character select | PASS (marginal) |
| 1-3 Tutorial         | PASS            |
| 1-4 HUD clarity      | PASS (marginal) |
| 1-5 LevelUp UI       | PASS            |

**Perspective 1 Overall: PASS** — No FAIL items. Two marginal items noted but within genre norms.

---

## Perspective 2: Competitive Benchmark

> Compared against Vampire Survivors, Brotato, Survivor.io

### 2-1. VFX Density & Juice

**Verdict: COMPETITIVE**

- VFXManager: 80 pooled particles, 6 lightning, 4 napalm, 3 muzzle, 2 aura. Zero-allocation pooling.
- Effects catalog: enemyDeath (4 particles), hitSpark (2), lightning bolt, napalm zone, bomb flash, muzzle flash, aura pulse, screen flash, screen shake, camera zoom punch, glitch scanlines, boss freedom burst, ultimate flash/beam, wind vortex, eagle dive, phase transition debris.
- DamageNumber: pooled 20 text objects, float-up animation, color-coded by type (crit gold/effective green/resist gray).
- This is on par with Vampire Survivors' visual feedback density.

**Evidence**: `src/utils/VFXManager.ts` — full effect catalog.

### 2-2. Audio Feedback

**Verdict: COMPETITIVE**

- 7 procedural BGM tracks (88-160 BPM range) via Web Audio API buffer generation.
- 25+ SFX methods covering every game event: weapon fire (8 variants), enemy hit/death, boss entrance/defeat, UI interactions, collectibles.
- Procedural generation means unique audio identity — not stock assets.
- PauseOverlay has BGM/SFX separate volume controls with visual segments.

**Evidence**: `src/audio/RetroAudio.ts` — 7 tracks. `src/audio/RetroSFX.ts` — 25+ methods.

### 2-3. Scene Transitions

**Verdict: BELOW STANDARD** <<<

- **fadeIn**: 8 of 10 scenes have `fadeIn(300)` on create. Good.
- **fadeOut**: Only 2 scenes have fadeOut before exit:
  - `MainMenuScene.ts:102,120` — PLAY button and Weapon Codex button
  - `CharacterSelectScene.ts:287` — GO button
- **All other exits are abrupt**: GameOver→Meta, GameOver→Run (retry), Meta→MainMenu, CodexScenes→MainMenu, WorldMap→MainMenu — all use `navigateScene()` which calls `SceneLifecycleCalc` actions (sleep/wake/start/stop) with **no fadeOut**.
- Vampire Survivors, Brotato, and Survivor.io all use smooth transitions between every screen. Abrupt cuts feel unpolished.
- **Impact**: 8+ scene exit points have jarring instant cuts. This is the single most visible polish gap vs competitors.

**Evidence**:

- `src/utils/SceneNav.ts` — `navigateScene` wraps `SceneLifecycleCalc`, no fadeOut.
- Grep result: only `MainMenuScene` and `CharacterSelectScene` call `fadeOut`.
- Missing fadeOut locations:
  - `GameOverScene.ts:331` — navigateScene to MetaScene (no fade)
  - `GameOverScene.ts:340` — navigateScene to RunScene retry (no fade)
  - `GameOverScene.ts:350+` — navigateScene to MainMenu (no fade)
  - `MetaScene.ts` — footer Main Menu button (no fade)
  - `WeaponCodexScene.ts:154` — Back button (no fade)
  - `EnemyCodexScene.ts` — Back button (no fade)
  - `WorldMapScene.ts` — Back button (no fade)

### 2-4. UI Polish Level

**Verdict: COMPETITIVE**

- ButtonFactory: retro Pokemon-style cursor arrow, drop shadow, accent/panel fill, thick border, top bevel. Hover 1.05x, press 0.95x with tween yoyo. This is charming and distinctive.
- GlassPanel: retro opaque panel with drop shadow, inner bevel (top-left highlight, bottom-right shadow). Consistent visual language.
- Color system: centralized in `colors.ts` with NEON palette. Cyberpunk identity is strong.
- DragScroll on long lists (EnemyCodex, WorldMap). Fixed headers/footers.

**Evidence**: `src/ui/ButtonFactory.ts`, `src/ui/GlassPanel.ts`.

### 2-5. Overall First Impression (Screenshot Test)

**Verdict: COMPETITIVE**

- Neon cyberpunk aesthetic with parallax backgrounds is visually distinctive.
- Retro-styled UI with consistent GlassPanel + ButtonFactory language.
- The procedural audio gives a unique identity vs stock-asset competitors.
- **Caveat**: The scene transition abruptness (2-3) would be noticeable in a gameplay video/trailer.

### Perspective 2 Summary

| Sub-check             | Verdict            |
| --------------------- | ------------------ |
| 2-1 VFX density       | COMPETITIVE        |
| 2-2 Audio feedback    | COMPETITIVE        |
| 2-3 Scene transitions | **BELOW STANDARD** |
| 2-4 UI polish         | COMPETITIVE        |
| 2-5 Screenshot test   | COMPETITIVE        |

**Perspective 2 Overall: REJECT** — One BELOW_STANDARD item (scene transitions). This is the most visible polish gap and would be immediately noticed by players coming from Vampire Survivors or Brotato.

---

## Perspective 3: Edge Case Attack

### 3-1. All Weapons Max Level → LevelUp UI

**Verdict: RISKY**

- `UpgradeSelector.selectUpgrades()` returns empty array when all weapons/passives are maxed.
- `LevelUpUIManager.createUpgradeCards()` receives empty choices:
  - Creates backdrop + title + skip button, but **zero cards**.
  - `scoreBestChoice([])` returns `undefined` → auto-select timer bar has no target.
  - Player sees: dark overlay, "LEVEL UP" title, skip button, empty space. No cards to choose from.
- **Not a crash**, but **confusing UX**. Player doesn't know why there are no options.
- **Missing**: A message like "All upgrades maxed!" or automatic skip when choices are empty.
- Vampire Survivors handles this by awarding gold/bonus items when upgrade pool is exhausted.

**Evidence**: `src/core/UpgradeSelector.ts` — empty pool returns `[]`. `src/managers/LevelUpUIManager.ts:101-102` — `scoreBestChoice` returns undefined for empty array.

### 3-2. Zero Gold → MetaScene

**Verdict: SAFE**

- `MetaScene.ts:355`: `if (!maxed && affordable)` wrapping `setInteractive`.
- Unaffordable cards do NOT get `setInteractive` — cannot be clicked.
- Visual differentiation exists (non-interactive cards lack hover/cursor feedback).
- Gold display shows current balance.
- **No crash, no misleading UI**. Player can browse but not purchase. This is correct behavior.

**Evidence**: `src/scenes/MetaScene.ts:355` — conditional setInteractive gate.

### 3-3. Boss Fight + Pause + Settings Change + Resume

**Verdict: SAFE**

- PauseOverlay: dark backdrop (0.7 alpha), BGM/SFX toggle + volume rows, Resume/Menu buttons.
- Volume segments 36x36 with 48x48 hit zones — properly sized.
- Auto-mute/unmute on volume change — state is consistent.
- PhaseManager handles pause/resume state transitions.
- M-014 in mistake-registry documents a boss+levelup softlock that was fixed — indicates this path has been stress-tested.

**Evidence**: `src/ui/PauseOverlay.ts` — volume controls. `.claude/rules/mistake-registry.md:M-014` — boss phase fix.

### 3-4. Dead Time Between Waves

**Verdict: SAFE**

- WaveDirector manages spawn timing. Speed control exists in RunScene.
- No reported softlocks between waves in mistake registry.
- PhaseManager transitions from `playing` through wave phases without dead states.

### 3-5. Rapid Scene Switching (Codex → Back → Codex → Back)

**Verdict: RISKY**

- CodexScenes (Weapon, Enemy) use `navigateScene()` which calls SceneLifecycleCalc actions.
- `DragScroll` is applied but **no explicit cleanup/destroy** is visible in codex scene code.
- Rapid switching could accumulate:
  - DragScroll event listeners if not cleaned up on scene stop/sleep
  - Card container children if scene is re-created without full cleanup
- Phaser's scene lifecycle should handle this via `shutdown` event, but without explicit cleanup code, this is a potential memory leak under rapid switching.
- **Not immediately breaking**, but could degrade performance over a long session.

**Evidence**: `src/scenes/WeaponCodexScene.ts` — no explicit `shutdown()` or `destroy()` cleanup. `src/scenes/EnemyCodexScene.ts` — same pattern.

### 3-6. GameOverScene Button Overflow (Bonus Finding)

**Verdict: RISKY**

- `calculateButtonBaseY()` in challenge mode: `Math.max(520, statsEnd + recordGap + achieveGap + leaderboardHeight + 20)`.
- With many achievements + leaderboard + new records, `btnBaseY` can exceed 600.
- Third button at `btnBaseY + 2*80 = btnBaseY + 160`. If btnBaseY = 600, third button at y=760 — **below 720px screen height**.
- Non-challenge mode always returns 520 → buttons at 520, 600, 680 — safe.
- Challenge mode with many achievements: third button can be clipped.

**Evidence**: `src/core/GameOverCalc.ts:69-77` — `calculateButtonBaseY`. `src/scenes/GameOverScene.ts:318` — `btnGap = 80`, three buttons stacked.

### Perspective 3 Summary

| Sub-check                    | Verdict   |
| ---------------------------- | --------- |
| 3-1 Max weapons LevelUp      | **RISKY** |
| 3-2 Zero gold MetaScene      | SAFE      |
| 3-3 Boss+Pause+Resume        | SAFE      |
| 3-4 Dead time between waves  | SAFE      |
| 3-5 Rapid scene switching    | RISKY     |
| 3-6 GameOver button overflow | RISKY     |

**Perspective 3 Overall: CONDITIONAL PASS** — No BROKEN items. Three RISKY items that should be addressed but are not blocking for initial deployment. Item 3-1 (empty LevelUp) is the most user-facing.

---

## Verdict: REDTEAM:REJECT

### Rejection Criteria Met

- **P2 BELOW_STANDARD**: Scene transitions (2-3) — abrupt exits on 8+ navigation paths. This is the most visible competitive gap.

### Mandatory Fix List (4 items)

| #   | Severity | Perspective | Issue                                                                               | File(s)                                                           | Fix                                                                                                                 |
| --- | -------- | ----------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1   | **HIGH** | P2-3        | Abrupt scene exits — 8+ navigateScene calls with no fadeOut                         | `src/utils/SceneNav.ts`, all scenes using `navigateScene`         | Add `fadeOut(300)` before every `navigateScene` call, OR integrate fadeOut into `navigateScene` itself as a wrapper |
| 2   | **MED**  | P3-1        | Empty LevelUp UI when all upgrades maxed — confusing blank overlay                  | `src/managers/LevelUpUIManager.ts`                                | When choices is empty, show "All upgrades maxed!" message and auto-skip after 1s, OR award bonus gold               |
| 3   | **LOW**  | P3-5        | No explicit scene cleanup in CodexScenes — potential memory leak on rapid switching | `src/scenes/WeaponCodexScene.ts`, `src/scenes/EnemyCodexScene.ts` | Add `shutdown()` method to clean up DragScroll listeners and containers                                             |
| 4   | **LOW**  | P3-6        | GameOverScene button overflow in challenge mode with many achievements              | `src/core/GameOverCalc.ts`                                        | Cap `calculateButtonBaseY` to `Math.min(result, GAME_HEIGHT - 180)` to ensure 3 buttons fit                         |

### Items NOT Requiring Fix (informational)

- P1-2 (CharacterSelect i18n truncation) — monitor with localized strings, no current issue
- P1-4 (HUD element count) — within genre norms
- P3-4 (Dead time between waves) — no issue found

---

## Appendix: EnemyCodex Progressive Disclosure

The auditor flagged P12 (progressive disclosure) as a MUST violation citing "no silhouettes in codex." However, code review shows:

- `EnemyCodexScene.ts:360-484`: Locked enemies get **glitch silhouette** treatment — dark tinted sprite (alpha 0.3) with pulsing glitch tween (alpha 0.2→0.4) and scan line overlay.
- `WeaponCodexScene.ts:67-78`: Locked weapons show "???" placeholder.

**Both codexes already implement progressive disclosure for locked content.** The auditor's P12 MUST violation may have been based on incomplete code reading. This does NOT change the RedTeam verdict (rejection is based on P2-3 scene transitions, not P12).
