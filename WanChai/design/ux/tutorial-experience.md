# Tutorial System UX Design -- WanChai NeonSurvivor

> Contextual hint system for first-time players in Stage 1.
> Non-blocking, progressive disclosure. Follows About Face principles.

**Status**: Active
**Date**: 2026-03-12
**Resolution**: 1280x720 (16:9 landscape)
**Scene**: RunScene (Stage 1 only, first run)

---

## Design Philosophy

1. **No forced interruption** (About Face Principle 5: Flow Protection) -- hints overlay gameplay without pausing or blocking input
2. **Contextual triggers** (Principle 12: Progressive Disclosure) -- each hint appears at the exact moment its concept becomes relevant
3. **Dismiss-on-acknowledgment** -- hints fade after player demonstrates understanding or after a timeout
4. **One hint at a time** -- never stack multiple hints simultaneously
5. **First run only** -- `SaveManager.isTutorialCompleted()` gates the entire system. After all 4 steps complete, tutorial is permanently marked done.

---

## Overview: 4-Step Tutorial Flow

| Step | Name         | Trigger                 | Concept                              |
| ---- | ------------ | ----------------------- | ------------------------------------ |
| 1    | Movement     | Game start (0.5s delay) | Player moves left/right, auto-shoots |
| 2    | Weapons      | First enemy killed      | Auto-fire explained, upgrades teased |
| 3    | Level Up     | First level-up popup    | Upgrade selection system             |
| 4    | Supply Point | First mid-shop opens    | Healing and gold spending            |

---

## Step 1: Movement

### Trigger

- **Condition**: `elapsedMs >= 500` (0.5s after RunScene create)
- **Guard**: Tutorial not already completed (`!SaveManager.isTutorialCompleted()`)

### Display

```
Position: center of screen (x=640, y=540)
         -- just above the player (playerBaseY=620), in the game area
         -- visible but not blocking HUD or enemies spawning from top

┌─────────────────────────────────────────────────────────┐
│                                                         │
│   ← ←    Drag left/right to move.                      │
│          Your character auto-shoots the nearest enemy.  │
│                                              → →        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

| Property        | Value                                                                           |
| --------------- | ------------------------------------------------------------------------------- |
| **Position**    | x=640 (center), y=540                                                           |
| **Text (EN)**   | "Drag left/right to move.\nYour character auto-shoots the nearest enemy."       |
| **Text (KO)**   | "좌우로 드래그하여 이동하세요.\n캐릭터가 가장 가까운 적을 자동으로 공격합니다." |
| **i18n keys**   | `tutorial.step1_line1`, `tutorial.step1_line2`                                  |
| **Font**        | 28px Bold, monospace, `#ecf0f1` (UI_CSS.TEXT_WHITE)                             |
| **Stroke**      | 4px black (`#000000`)                                                           |
| **Arrows**      | Left/right pulsing arrows flanking the text                                     |
| **Arrow style** | 4px stroke, NEON.UI_ACCENT color, pulse alpha 0.4-1.0, 600ms cycle              |
| **Panel**       | None (text with stroke over gameplay, no glass panel)                           |

### Dismiss Condition

- **Primary**: Player drags left or right (pointer move > 30px horizontal)
- **Fallback**: Auto-dismiss after 5000ms
- **Transition**: Fade out 400ms (Quad.Out easing)

### Visual Style

- No background dimming -- gameplay continues underneath
- No input blocking -- player can drag immediately
- Depth: 1500 (above game objects, below pause overlay)

---

## Step 2: Weapons

### Trigger

- **Condition**: First enemy killed (`onEnemyDeath` event, `tutorialKillCount` reaches 1)
- **Guard**: Step 1 already dismissed

### Display

```
Position: upper-center area (x=640, y=200)
         -- above the combat zone where enemies are dying
         -- away from the player zone at bottom

┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Your weapon fires automatically!                      │
│   Defeat enemies to earn XP and level up.               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

| Property      | Value                                                                       |
| ------------- | --------------------------------------------------------------------------- |
| **Position**  | x=640 (center), y=200                                                       |
| **Text (EN)** | "Your weapon fires automatically!\nDefeat enemies to earn XP and level up." |
| **Text (KO)** | "무기가 자동으로 발사됩니다!\n적을 처치하면 XP를 얻고 레벨업합니다."        |
| **i18n keys** | `tutorial.step2_line1`, `tutorial.step2_line2`                              |
| **Font**      | 28px Bold, monospace, `#ecf0f1`                                             |
| **Stroke**    | 4px black                                                                   |
| **Arrows**    | None                                                                        |
| **Panel**     | None                                                                        |

### Dismiss Condition

- **Primary**: 3 more enemies killed (total kill count reaches 4)
- **Fallback**: Auto-dismiss after 5000ms
- **Transition**: Fade out 400ms

### Visual Style

- Same as Step 1 (no dim, no blocking, depth 1500)
- Optional: brief XP bar highlight glow when this hint appears (200ms pulse on XP bar)

---

## Step 3: Level Up

### Trigger

- **Condition**: First level-up card selection UI appears (`phase === 'levelup'`, `playerLevel` reaches 2 for the first time)
- **Guard**: Step 2 already dismissed

### Display

```
Position: above the 3 level-up cards (x=640, y=180)
         -- the level-up modal overlay is active (alpha 0.40 background)
         -- hint sits above the cards but below the modal top

┌─────────────────────────────────────────────────────────┐
│                                                         │
│   ★ Choose an upgrade! Each one changes your run. ★    │
│                                                         │
└─────────────────────────────────────────────────────────┘
                    ┌─────┐ ┌─────┐ ┌─────┐
                    │Card1│ │Card2│ │Card3│
                    └─────┘ └─────┘ └─────┘
```

| Property        | Value                                                   |
| --------------- | ------------------------------------------------------- |
| **Position**    | x=640 (center), y=180                                   |
| **Text (EN)**   | "Choose an upgrade! Each one changes your run."         |
| **Text (KO)**   | "업그레이드를 선택하세요! 선택이 런의 방향을 바꿉니다." |
| **i18n key**    | `tutorial.step3`                                        |
| **Font**        | 28px Bold, monospace, `#e94560` (ACCENT color)          |
| **Stroke**      | 4px black                                               |
| **Arrows**      | Down-pointing arrow below text, pointing toward cards   |
| **Arrow style** | Pulsing, NEON.UI_ACCENT, bounce y +8px, 600ms cycle     |
| **Panel**       | None                                                    |

### Dismiss Condition

- **Primary**: Player taps any card (upgrade selected)
- **Fallback**: Auto-dismiss after 8000ms (longer timeout since this is a decision moment)
- **Transition**: Fade out 300ms

### Visual Style

- Appears ON TOP of the level-up modal overlay
- Depth: 2100 (above level-up UI depth of 2000)
- No additional dimming beyond what level-up modal already provides

---

## Step 4: Supply Point

### Trigger

- **Condition**: Mid-shop overlay opens for the first time (`phase === 'shop'`, triggered at 30s elapsed)
- **Guard**: Step 3 already dismissed

### Display

```
Position: above the shop options (x=640, y=160)
         -- shop overlay is active
         -- hint guides player to understand gold spending

┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Supply point! Spend gold to repair your base          │
│   or boost your firepower.                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
                  ┌──────┐ ┌──────┐ ┌──────┐
                  │Repair│ │Damage│ │Armor │
                  └──────┘ └──────┘ └──────┘
```

| Property        | Value                                                                    |
| --------------- | ------------------------------------------------------------------------ |
| **Position**    | x=640 (center), y=160                                                    |
| **Text (EN)**   | "Supply point! Spend gold to repair\nyour base or boost your firepower." |
| **Text (KO)**   | "보급 지점! 골드를 사용해 기지를 수리하거나\n화력을 강화하세요."         |
| **i18n keys**   | `tutorial.step4_line1`, `tutorial.step4_line2`                           |
| **Font**        | 28px Bold, monospace, `#ecf0f1`                                          |
| **Stroke**      | 4px black                                                                |
| **Arrows**      | Down-pointing arrow toward shop buttons                                  |
| **Arrow style** | Same as Step 3                                                           |
| **Panel**       | None                                                                     |

### Dismiss Condition

- **Primary**: Player taps any shop option (purchase or skip)
- **Fallback**: Auto-dismiss after 6000ms
- **Transition**: Fade out 400ms

### Visual Style

- Appears on top of shop overlay
- Depth: 2100
- No additional dimming

---

## Data Model: TutorialHintCalc Extension

Current `TutorialHintCalc.ts` supports only timer-based hints. The new system needs event-driven triggers.

### Updated Interface

```typescript
export interface TutorialHint {
  id: string; // unique step identifier
  key: string; // i18n key (primary line)
  key2?: string; // i18n key (secondary line, if any)
  trigger: TutorialTrigger;
  x: number; // screen X position
  y: number; // screen Y position
  dismissCondition: DismissCondition;
  timeoutMs: number; // auto-dismiss fallback
  showArrows: boolean;
  arrowDirection?: 'left-right' | 'down';
  accentColor?: boolean; // use accent color instead of white
  depth: number; // render depth
}

export type TutorialTrigger =
  | { type: 'timer'; delayMs: number }
  | { type: 'event'; event: string; threshold?: number }
  | { type: 'phase'; phase: string };

export type DismissCondition =
  | { type: 'timer'; durationMs: number }
  | { type: 'event'; event: string }
  | { type: 'input'; action: string }
  | { type: 'phase_exit'; phase: string };
```

### Step Definitions (Pure Data)

```typescript
export function getTutorialSteps(): TutorialHint[] {
  return [
    {
      id: 'step1_movement',
      key: 'tutorial.step1_line1',
      key2: 'tutorial.step1_line2',
      trigger: { type: 'timer', delayMs: 500 },
      x: 640,
      y: 540,
      dismissCondition: { type: 'input', action: 'drag_horizontal' },
      timeoutMs: 5000,
      showArrows: true,
      arrowDirection: 'left-right',
      depth: 1500,
    },
    {
      id: 'step2_weapons',
      key: 'tutorial.step2_line1',
      key2: 'tutorial.step2_line2',
      trigger: { type: 'event', event: 'enemy_killed', threshold: 1 },
      x: 640,
      y: 200,
      dismissCondition: { type: 'event', event: 'enemy_killed_count_4' },
      timeoutMs: 5000,
      showArrows: false,
      depth: 1500,
    },
    {
      id: 'step3_levelup',
      key: 'tutorial.step3',
      trigger: { type: 'phase', phase: 'levelup' },
      x: 640,
      y: 180,
      dismissCondition: { type: 'phase_exit', phase: 'levelup' },
      timeoutMs: 8000,
      showArrows: true,
      arrowDirection: 'down',
      accentColor: true,
      depth: 2100,
    },
    {
      id: 'step4_supply',
      key: 'tutorial.step4_line1',
      key2: 'tutorial.step4_line2',
      trigger: { type: 'phase', phase: 'shop' },
      x: 640,
      y: 160,
      dismissCondition: { type: 'phase_exit', phase: 'shop' },
      timeoutMs: 6000,
      showArrows: true,
      arrowDirection: 'down',
      depth: 2100,
    },
  ];
}
```

---

## i18n Keys Required

### English (`src/locales/en.ts`)

```typescript
'tutorial.step1_line1': 'Drag left/right to move.',
'tutorial.step1_line2': 'Your character auto-shoots the nearest enemy.',
'tutorial.step2_line1': 'Your weapon fires automatically!',
'tutorial.step2_line2': 'Defeat enemies to earn XP and level up.',
'tutorial.step3': 'Choose an upgrade! Each one changes your run.',
'tutorial.step4_line1': 'Supply point! Spend gold to repair',
'tutorial.step4_line2': 'your base or boost your firepower.',
```

### Korean (`src/locales/ko.ts`)

```typescript
'tutorial.step1_line1': '좌우로 드래그하여 이동하세요.',
'tutorial.step1_line2': '캐릭터가 가장 가까운 적을 자동으로 공격합니다.',
'tutorial.step2_line1': '무기가 자동으로 발사됩니다!',
'tutorial.step2_line2': '적을 처치하면 XP를 얻고 레벨업합니다.',
'tutorial.step3': '업그레이드를 선택하세요! 선택이 런의 방향을 바꿉니다.',
'tutorial.step4_line1': '보급 지점! 골드를 사용해 기지를 수리하거나',
'tutorial.step4_line2': '화력을 강화하세요.',
```

---

## Implementation Notes for Programmer

### TutorialOverlay Changes

The existing `TutorialOverlay` class needs to be extended from timer-only to event-driven:

1. **State machine**: Track `currentStep` (0-3). Only advance sequentially.
2. **Event listeners**: Register for `enemy_killed`, `phase_change` events from RunScene.
3. **Input detection**: For Step 1, listen to pointer drag events.
4. **Step guard**: Each step only triggers if the previous step was dismissed.
5. **Completion**: After Step 4 dismisses, call `SaveManager.setTutorialCompleted()`.

### Integration Points in RunScene

| Integration Point  | File            | Action                                            |
| ------------------ | --------------- | ------------------------------------------------- |
| Tutorial init      | RunScene.create | `new TutorialOverlay(this)` (exists)              |
| Enemy killed event | RunScene        | Emit `tutorial:enemy_killed` on kill              |
| Phase change       | RunScene        | Emit `tutorial:phase_change` on phase transition  |
| Drag detection     | RunScene/Player | Forward pointer drag delta to overlay             |
| Depth layering     | TutorialOverlay | Steps 3-4 use depth 2100 (above level-up/shop UI) |

### Backward Compatibility

- Old i18n keys (`tutorial.move`, `tutorial.auto_fire`) can be deprecated after migration
- `SaveManager.isTutorialCompleted()` check remains the same -- no save data changes needed
- If tutorial was already completed in a previous version, the new tutorial will NOT show

---

## Acceptance Criteria

- [ ] AC-01: Step 1 appears 0.5s after game start on first run only
- [ ] AC-02: Step 1 shows left/right pulsing arrows
- [ ] AC-03: Step 1 dismisses when player drags horizontally OR after 5s
- [ ] AC-04: Step 2 appears on first enemy kill (not before)
- [ ] AC-05: Step 3 appears when level-up card UI opens
- [ ] AC-06: Step 3 uses accent color (#e94560) for emphasis
- [ ] AC-07: Step 4 appears when mid-shop opens
- [ ] AC-08: No two hints display simultaneously
- [ ] AC-09: All hints are non-blocking (no input interception)
- [ ] AC-10: Tutorial does not appear on subsequent runs after completion
- [ ] AC-11: All text uses 28px Bold monospace with 4px black stroke
- [ ] AC-12: All hints render at depth 1500 (steps 1-2) or 2100 (steps 3-4)
- [ ] AC-13: EN and KO translations provided for all hint text
- [ ] AC-14: Font size >= 14px minimum (28px used, well above threshold)
- [ ] AC-15: No forced pause or modal blocking during hints
