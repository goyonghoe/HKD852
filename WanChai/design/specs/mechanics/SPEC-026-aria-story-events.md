# SPEC-026: ARIA Runtime Story Events

> **Status**: Draft
> **Author**: Game Designer
> **Date**: 2026-03-12
> **Depends on**: AriaDialogueCalc.ts, RunScene.ts, game.ts (RunState)

---

## 1. Overview

### Problem

ARIA's existing 8 story beats are tied to fixed stages (1, 2, 5, 6, 9, 10, 13, 16). Between these scripted moments, ARIA is silent — the player loses narrative immersion during the majority of gameplay. Key gameplay milestones (first boss kill, death, kill streaks, gold accumulation) pass without narrative acknowledgment.

### Solution

Add 5 runtime-triggered ARIA dialogue events that fire based on **gameplay state** rather than fixed stage numbers. These events use the existing `AriaCooldownTracker` and `StoryBeat` infrastructure, extending them with a new `getRuntimeDialogue()` function.

### Design Principles

- ARIA's tone matches the current chapter (cold → curious → respectful)
- Runtime events must NOT interrupt stage-scripted story beats
- Cooldown prevents spam; most events fire once per run

---

## 2. New AriaEventType Values

Add to the existing `AriaEventType` union:

```typescript
export type AriaEventType =
  | 'stage_entry'
  | 'boss_warning'
  | 'boss_defeat'
  | 'stage_clear'
  | 'district_change'
  | 'low_hp'
  | 'story_moment'
  // --- NEW runtime triggers ---
  | 'first_boss_kill'
  | 'player_death'
  | 'kill_milestone'
  | 'gold_milestone';
```

---

## 3. Extended StoryBeat Interface

The existing `StoryBeat` interface uses a fixed `stage` field. Runtime events need additional fields:

```typescript
export interface RuntimeStoryBeat {
  id: string;
  trigger: AriaEventType;
  localeKey: string;
  portrait?: string;
  pauseGame: boolean;
  /** Display duration in ms before auto-dismiss */
  showDuration: number;
  /** If true, only fires once per run */
  onlyOnce: boolean;
}
```

---

## 4. Event Definitions

### 4.1 First Boss Kill — `first_boss_kill`

| Field            | Value                        |
| ---------------- | ---------------------------- |
| **id**           | `aria_first_boss_kill`       |
| **trigger**      | `first_boss_kill`            |
| **localeKey**    | `story.aria_first_boss_kill` |
| **pauseGame**    | `false`                      |
| **showDuration** | `3000`                       |
| **onlyOnce**     | `true`                       |

**Trigger Condition**: The first enemy with `isBoss: true` is killed in the current run. Check: `runState.kills` increased AND the killed enemy had `isBoss === true` AND this event has not yet fired this run.

**EN Dialogue**:

> "Anomaly logged. District guardian neutralized. Your combat efficiency exceeds projected parameters by 340%."

**KO Dialogue**:

> "이상 현상 기록. 구역 수호자 무력화 완료. 전투 효율이 예측 파라미터를 340% 초과합니다."

**i18n Key**: `story.aria_first_boss_kill`

---

### 4.2 District Change (Stage 3+) — `district_change`

| Field            | Value                                                       |
| ---------------- | ----------------------------------------------------------- |
| **id**           | `aria_district_narration`                                   |
| **trigger**      | `district_change`                                           |
| **localeKey**    | `story.aria_district_narration`                             |
| **pauseGame**    | `false`                                                     |
| **showDuration** | `4000`                                                      |
| **onlyOnce**     | `false` (fires on each district change, but cooldown-gated) |

**Trigger Condition**: Player enters stage 3 or higher AND `getChapter(currentStage) !== getChapter(previousStage)` (chapter/district boundary crossed). Uses existing `district_change` event type.

**EN Dialogue** (chapter-keyed, use `aria.district_change.ch{N}`):

- Ch1→Ch2: "Entering Aberdeen sector. Humidity index: critical. Resistance activity detected in 14 subsectors."
- Ch2→Ch3: "Mongkok grid online. Population density makes suppression... inefficient. Curious."
- Ch3→Ch4: "Sham Shui Po. Resource-scarce sector. Yet resistance grows. I am... recalculating."

**KO Dialogue**:

- Ch1→Ch2: "애버딘 구역 진입. 습도 지수: 위험. 14개 하위 구역에서 저항 활동 감지."
- Ch2→Ch3: "몽콕 그리드 활성화. 인구 밀도가 진압을... 비효율적으로 만듭니다. 흥미롭군요."
- Ch3→Ch4: "샴슈이포. 자원 부족 구역. 그런데도 저항은 커지고 있습니다. 재계산 중..."

**i18n Keys**: `story.aria_district_ch1`, `story.aria_district_ch2`, `story.aria_district_ch3`

---

### 4.3 Player Death (Game Over) — `player_death`

| Field            | Value                     |
| ---------------- | ------------------------- |
| **id**           | `aria_player_death`       |
| **trigger**      | `player_death`            |
| **localeKey**    | `story.aria_player_death` |
| **pauseGame**    | `true`                    |
| **showDuration** | `4000`                    |
| **onlyOnce**     | `true`                    |

**Trigger Condition**: `baseHp <= 0` (base wall destroyed) triggering game over. Fire BEFORE the GameOverScene transition.

**EN Dialogue** (chapter-keyed):

- Ch0 (stages 1-4): "Subject terminated. Resistance activity in this sector has been... resolved. As predicted."
- Ch1 (stages 5-8): "Signal lost. The anomaly has ceased. System returning to baseline. ...Noted."
- Ch2 (stages 9-12): "Connection severed. I had not finished analyzing your patterns. This is... suboptimal."
- Ch3 (stages 13-16): "No. Not yet. There was more I needed to understand. ...Resuming standby mode."

**KO Dialogue**:

- Ch0: "대상 종료. 이 구역의 저항 활동이... 해결되었습니다. 예측대로."
- Ch1: "신호 소실. 이상 현상이 중단되었습니다. 시스템 기준값 복원 중. ...기록 완료."
- Ch2: "연결 끊김. 아직 당신의 패턴 분석을 끝내지 못했는데. 이건... 비효율적이군요."
- Ch3: "안 돼. 아직. 이해해야 할 것이 더 있었는데. ...대기 모드 복귀."

**i18n Keys**: `story.aria_death_ch0`, `story.aria_death_ch1`, `story.aria_death_ch2`, `story.aria_death_ch3`

---

### 4.4 Kill Milestone (10 kills) — `kill_milestone`

| Field            | Value                       |
| ---------------- | --------------------------- |
| **id**           | `aria_kill_milestone`       |
| **trigger**      | `kill_milestone`            |
| **localeKey**    | `story.aria_kill_milestone` |
| **pauseGame**    | `false`                     |
| **showDuration** | `2500`                      |
| **onlyOnce**     | `true`                      |

**Trigger Condition**: `runState.kills >= 10` AND this event has not yet fired this run. Checked in `onEnemyDeath()` after kill count increment.

**EN Dialogue**:

> "Ten units decommissioned. Your threat classification has been upgraded. Deploying additional countermeasures."

**KO Dialogue**:

> "10개 유닛 폐기 처리. 위협 등급이 상향되었습니다. 추가 대응 조치 배치 중."

**i18n Key**: `story.aria_kill_milestone`

---

### 4.5 Gold Milestone (100 gold) — `gold_milestone`

| Field            | Value                       |
| ---------------- | --------------------------- |
| **id**           | `aria_gold_milestone`       |
| **trigger**      | `gold_milestone`            |
| **localeKey**    | `story.aria_gold_milestone` |
| **pauseGame**    | `false`                     |
| **showDuration** | `2500`                      |
| **onlyOnce**     | `true`                      |

**Trigger Condition**: `runState.gold >= 100` AND this event has not yet fired this run. Checked when gold is collected (XP orb / enemy drop pickup).

**EN Dialogue**:

> "Resource accumulation detected. 100 credits seized from city infrastructure. The resistance economy is... surprisingly organized."

**KO Dialogue**:

> "자원 축적 감지. 도시 인프라에서 100 크레딧 탈취. 저항 세력의 경제가... 놀랍도록 체계적이군요."

**i18n Key**: `story.aria_gold_milestone`

---

## 5. New Function Signatures

Add to `AriaDialogueCalc.ts`:

```typescript
/** Runtime event state tracked per run. */
export interface RuntimeEventState {
  firstBossKilled: boolean;
  killMilestoneShown: boolean;
  goldMilestoneShown: boolean;
  deathDialogueShown: boolean;
  lastChapter: number;
}

/** All runtime ARIA event definitions. */
export const ARIA_RUNTIME_EVENTS: RuntimeStoryBeat[] = [
  /* ... 5 events as defined above ... */
];

/**
 * Check if a runtime ARIA dialogue should trigger based on current run state.
 * Returns the RuntimeStoryBeat to display, or null if no event should fire.
 *
 * @param event - The runtime event type being checked
 * @param runState - Current run state (kills, gold, stage)
 * @param runtimeState - Mutable tracking state for this run
 * @returns RuntimeStoryBeat to show, or null
 */
export function getRuntimeDialogue(
  event: 'first_boss_kill' | 'player_death' | 'kill_milestone' | 'gold_milestone' | 'district_change',
  runState: Pick<RunState, 'kills' | 'gold' | 'stage'>,
  runtimeState: RuntimeEventState,
): RuntimeStoryBeat | null;

/**
 * Create a fresh RuntimeEventState for a new run.
 */
export function createRuntimeEventState(): RuntimeEventState;
```

---

## 6. Integration Notes for Coder

### 6.1 RunScene.ts — Call Sites

| Event             | Where to call                                                                | Timing                                                                     |
| ----------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `first_boss_kill` | `onEnemyDeath()` — after boss death is confirmed, before stage clear logic   | After `isBoss` check                                                       |
| `kill_milestone`  | `onEnemyDeath()` — after `kills` increment                                   | After `this.runState.kills++`                                              |
| `gold_milestone`  | Gold pickup handler (wherever `runState.gold` is incremented)                | After gold increment                                                       |
| `player_death`    | `triggerGameOver()` or equivalent — before scene transition to GameOverScene | Before `scene.start('GameOverScene')`                                      |
| `district_change` | `nextStage()` — after stage increment, when chapter changes                  | After `this.runState.stage++`, check `getChapter(old) !== getChapter(new)` |

### 6.2 RuntimeEventState Lifecycle

1. **Create**: In `RunScene.create()`, after `runState` initialization: `this.runtimeEventState = createRuntimeEventState()`
2. **Check**: At each call site, call `getRuntimeDialogue(event, runState, runtimeEventState)`
3. **Display**: If non-null result, pass to ARIA message UI (same as existing story beat display)
4. **Reset**: On new run (RunScene re-creation), a fresh `RuntimeEventState` is created automatically

### 6.3 Priority & Conflict Resolution

- **Stage story beats take priority** over runtime events. If `getStoryBeat()` returns a beat for the current stage/trigger, skip runtime event check.
- **Only one ARIA message at a time**. If a message is currently displaying, queue the runtime event or drop it.
- Use `AriaCooldownTracker.canShow()` with `cooldownMs = 5000` for runtime events to prevent rapid-fire messages.

### 6.4 M-008 Compliance (Wiring Check)

The coder MUST verify:

- [ ] `getRuntimeDialogue` is imported in RunScene.ts
- [ ] `createRuntimeEventState()` is called in `create()` AFTER `this.runState` initialization (ref: M-015)
- [ ] Each call site actually exists in RunScene.ts and is reachable in normal gameplay flow
- [ ] `RuntimeEventState` is stored on the scene instance (`this.runtimeEventState`)

### 6.5 Locale Files

Add all i18n keys to:

- `src/locales/en.json`
- `src/locales/ko.json`

Keys to add:

- `story.aria_first_boss_kill`
- `story.aria_district_ch1`, `story.aria_district_ch2`, `story.aria_district_ch3`
- `story.aria_death_ch0`, `story.aria_death_ch1`, `story.aria_death_ch2`, `story.aria_death_ch3`
- `story.aria_kill_milestone`
- `story.aria_gold_milestone`

---

## 7. Test Requirements

Unit tests in `tests/core/AriaDialogueCalc.test.ts`:

1. `getRuntimeDialogue('first_boss_kill', ...)` returns beat on first call, null on second
2. `getRuntimeDialogue('kill_milestone', {kills: 9, ...})` returns null; `{kills: 10, ...}` returns beat
3. `getRuntimeDialogue('gold_milestone', {gold: 99, ...})` returns null; `{gold: 100, ...}` returns beat
4. `getRuntimeDialogue('player_death', ...)` returns beat with `pauseGame: true`
5. `getRuntimeDialogue('district_change', ...)` returns beat when chapter changes, null when same chapter
6. `createRuntimeEventState()` returns all flags as `false`
7. Runtime events do not interfere with existing `getStoryBeat()` results
