import type { RunState } from '../types/game';

/**
 * AriaDialogueCalc — Pure TypeScript logic for ARIA dialogue arc selection.
 * Determines which dialogue key to show based on game events and stage context.
 * No Phaser imports (M-001 compliant).
 *
 * ARIA is the city AI who comments on game events. Her tone shifts across chapters:
 * - Ch.1-2 (stages 1-4): Cold, analytical, dismissive of the resistance
 * - Ch.3-4 (stages 5-8): Noticing anomalies, questioning inefficiency
 * - Ch.5-6 (stages 9-12): Doubt, acknowledging human unpredictability
 * - Ch.7-8 (stages 13-16): Genuine curiosity, almost respectful
 */

/** Event types that trigger ARIA dialogue. */
export type AriaEventType =
  | 'stage_entry'
  | 'boss_warning'
  | 'boss_defeat'
  | 'boss_phase3'
  | 'stage_clear'
  | 'district_change'
  | 'low_hp'
  | 'story_moment'
  // Runtime triggers (SPEC-026)
  | 'first_boss_kill'
  | 'player_death'
  | 'kill_milestone'
  | 'gold_milestone';

/** Story beat definition — triggers narrative dialogue at specific points. */
export interface StoryBeat {
  /** Unique ID for this beat (e.g., 'aria_awakening') */
  id: string;
  /** Stage number when this beat triggers (1-based) */
  stage: number;
  /** Event that activates this beat */
  trigger: 'stage_entry' | 'boss_defeat' | 'stage_clear';
  /** i18n key for the story dialogue */
  localeKey: string;
  /** Optional character portrait key */
  portrait?: string;
  /** Whether this beat pauses gameplay during display */
  pauseGame: boolean;
}

/** Story beats for ARIA's arc across the campaign. */
export const ARIA_STORY_BEATS: StoryBeat[] = [
  // Ch.1 — Cold surveillance
  { id: 'aria_intro', stage: 1, trigger: 'stage_entry', localeKey: 'story.aria_intro', pauseGame: true },
  { id: 'aria_dismiss', stage: 2, trigger: 'stage_clear', localeKey: 'story.aria_dismiss', pauseGame: false },
  // Ch.2 — Noticing anomalies
  { id: 'aria_anomaly', stage: 5, trigger: 'stage_entry', localeKey: 'story.aria_anomaly', pauseGame: true },
  { id: 'aria_question', stage: 6, trigger: 'boss_defeat', localeKey: 'story.aria_question', pauseGame: false },
  // Ch.3 — Doubt
  { id: 'aria_doubt', stage: 9, trigger: 'stage_entry', localeKey: 'story.aria_doubt', pauseGame: true },
  { id: 'aria_concede', stage: 10, trigger: 'boss_defeat', localeKey: 'story.aria_concede', pauseGame: false },
  // Ch.4 — Respect
  { id: 'aria_respect', stage: 13, trigger: 'stage_entry', localeKey: 'story.aria_respect', pauseGame: true },
  { id: 'aria_farewell', stage: 16, trigger: 'boss_defeat', localeKey: 'story.aria_farewell', pauseGame: true },
];

/**
 * Find the story beat that should trigger for the current stage and event.
 * Returns null if no story beat matches or if beat was already seen.
 */
export function getStoryBeat(stage: number, trigger: StoryBeat['trigger'], seenBeatIds: Set<string>): StoryBeat | null {
  const beat = ARIA_STORY_BEATS.find((b) => b.stage === stage && b.trigger === trigger && !seenBeatIds.has(b.id));
  return beat ?? null;
}

/** Chapter index (0-based) derived from stage number. */
export function getChapter(stage: number): number {
  return Math.min(Math.floor((stage - 1) / 4), 3);
}

/**
 * Get the i18n key for an ARIA dialogue event.
 * Returns a key like 'aria.stage_entry.ch0' that must exist in locale files.
 *
 * @param event - The game event type
 * @param stage - Current stage (1-based)
 * @returns The i18n key string
 */
export function getAriaDialogueKey(event: AriaEventType, stage: number): string {
  const chapter = getChapter(stage);
  return `aria.${event}.ch${chapter}`;
}

/**
 * Cooldown tracker to prevent ARIA message spam.
 * Tracks when each event type was last shown and enforces minimum intervals.
 */
export class AriaCooldownTracker {
  private lastShownMs: Map<AriaEventType, number> = new Map();
  private seenKeys: Set<string> = new Set();

  /**
   * Check if an event can fire (not on cooldown).
   * @param event - Event type
   * @param currentTimeMs - Current run time in ms
   * @param cooldownMs - Minimum interval between same event types
   * @returns true if the message can be shown
   */
  canShow(event: AriaEventType, currentTimeMs: number, cooldownMs: number): boolean {
    const lastShown = this.lastShownMs.get(event);
    if (lastShown === undefined) return true;
    return currentTimeMs - lastShown >= cooldownMs;
  }

  /**
   * Mark an event as shown at the given time.
   */
  markShown(event: AriaEventType, currentTimeMs: number): void {
    this.lastShownMs.set(event, currentTimeMs);
  }

  /**
   * Check if a specific dialogue key has been seen this run.
   * Used for one-shot messages like stage_entry that shouldn't repeat.
   */
  hasSeen(key: string): boolean {
    return this.seenKeys.has(key);
  }

  /**
   * Mark a key as seen.
   */
  markSeen(key: string): void {
    this.seenKeys.add(key);
  }

  /**
   * Reset all tracking (e.g., on new run).
   */
  reset(): void {
    this.lastShownMs.clear();
    this.seenKeys.clear();
  }

  /**
   * Reset per-stage flags (called on stage transition).
   * Clears cooldowns but retains seen keys.
   */
  resetForStage(): void {
    this.lastShownMs.clear();
  }
}

/**
 * Determine if ARIA should comment on a low HP event.
 * Only triggers once per stage when HP drops below threshold.
 */
export function shouldShowLowHp(hpRatio: number, threshold: number, alreadyShown: boolean): boolean {
  return hpRatio < threshold && !alreadyShown;
}

// ===================================================================
// SPEC-026: Runtime Story Events
// ===================================================================

/** Runtime story beat — triggers based on gameplay state, not fixed stages. */
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

/** Runtime event state tracked per run. */
export interface RuntimeEventState {
  firstBossKilled: boolean;
  killMilestoneShown: boolean;
  goldMilestoneShown: boolean;
  deathDialogueShown: boolean;
  lastChapter: number;
}

/** All runtime ARIA event definitions (SPEC-026). */
export const ARIA_RUNTIME_EVENTS: RuntimeStoryBeat[] = [
  {
    id: 'aria_first_boss_kill',
    trigger: 'first_boss_kill',
    localeKey: 'story.aria_first_boss_kill',
    pauseGame: false,
    showDuration: 3000,
    onlyOnce: true,
  },
  {
    id: 'aria_district_narration',
    trigger: 'district_change',
    localeKey: 'story.aria_district_narration',
    pauseGame: false,
    showDuration: 4000,
    onlyOnce: false,
  },
  {
    id: 'aria_player_death',
    trigger: 'player_death',
    localeKey: 'story.aria_player_death',
    pauseGame: true,
    showDuration: 4000,
    onlyOnce: true,
  },
  {
    id: 'aria_kill_milestone',
    trigger: 'kill_milestone',
    localeKey: 'story.aria_kill_milestone',
    pauseGame: false,
    showDuration: 2500,
    onlyOnce: true,
  },
  {
    id: 'aria_gold_milestone',
    trigger: 'gold_milestone',
    localeKey: 'story.aria_gold_milestone',
    pauseGame: false,
    showDuration: 2500,
    onlyOnce: true,
  },
];

/** Create a fresh RuntimeEventState for a new run. */
export function createRuntimeEventState(): RuntimeEventState {
  return {
    firstBossKilled: false,
    killMilestoneShown: false,
    goldMilestoneShown: false,
    deathDialogueShown: false,
    lastChapter: 0,
  };
}

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
): RuntimeStoryBeat | null {
  const beat = ARIA_RUNTIME_EVENTS.find((b) => b.trigger === event);
  if (!beat) return null;

  switch (event) {
    case 'first_boss_kill': {
      if (runtimeState.firstBossKilled) return null;
      runtimeState.firstBossKilled = true;
      return beat;
    }
    case 'kill_milestone': {
      if (runtimeState.killMilestoneShown) return null;
      if (runState.kills < 10) return null;
      runtimeState.killMilestoneShown = true;
      return beat;
    }
    case 'gold_milestone': {
      if (runtimeState.goldMilestoneShown) return null;
      if (runState.gold < 100) return null;
      runtimeState.goldMilestoneShown = true;
      return beat;
    }
    case 'player_death': {
      if (runtimeState.deathDialogueShown) return null;
      runtimeState.deathDialogueShown = true;
      return beat;
    }
    case 'district_change': {
      const currentChapter = getChapter(runState.stage);
      if (currentChapter === runtimeState.lastChapter) return null;
      runtimeState.lastChapter = currentChapter;
      return beat;
    }
  }
}

/** Get the chapter-specific locale key for death or district events. */
export function getRuntimeLocaleKey(beat: RuntimeStoryBeat, stage: number): string {
  const chapter = getChapter(stage);
  if (beat.trigger === 'player_death') {
    return `story.aria_death_ch${chapter}`;
  }
  if (beat.trigger === 'district_change') {
    return `story.aria_district_ch${chapter}`;
  }
  return beat.localeKey;
}
