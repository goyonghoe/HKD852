import { describe, it, expect, beforeEach } from 'vitest';
import {
  getChapter,
  getAriaDialogueKey,
  AriaCooldownTracker,
  shouldShowLowHp,
  getStoryBeat,
  ARIA_STORY_BEATS,
  ARIA_RUNTIME_EVENTS,
  getRuntimeDialogue,
  getRuntimeLocaleKey,
  createRuntimeEventState,
} from '../../src/core/AriaDialogueCalc';

describe('getChapter', () => {
  it('returns chapter 0 for stages 1-4', () => {
    expect(getChapter(1)).toBe(0);
    expect(getChapter(2)).toBe(0);
    expect(getChapter(3)).toBe(0);
    expect(getChapter(4)).toBe(0);
  });

  it('returns chapter 1 for stages 5-8', () => {
    expect(getChapter(5)).toBe(1);
    expect(getChapter(8)).toBe(1);
  });

  it('returns chapter 2 for stages 9-12', () => {
    expect(getChapter(9)).toBe(2);
    expect(getChapter(12)).toBe(2);
  });

  it('returns chapter 3 for stages 13-16', () => {
    expect(getChapter(13)).toBe(3);
    expect(getChapter(16)).toBe(3);
  });

  it('clamps to chapter 3 for stages beyond 16', () => {
    expect(getChapter(17)).toBe(3);
    expect(getChapter(100)).toBe(3);
  });
});

describe('getAriaDialogueKey', () => {
  it('returns correct key for stage_entry ch0', () => {
    expect(getAriaDialogueKey('stage_entry', 1)).toBe('aria.stage_entry.ch0');
  });

  it('returns correct key for boss_warning ch2', () => {
    expect(getAriaDialogueKey('boss_warning', 10)).toBe('aria.boss_warning.ch2');
  });

  it('returns correct key for low_hp ch3', () => {
    expect(getAriaDialogueKey('low_hp', 15)).toBe('aria.low_hp.ch3');
  });

  it('returns correct key for stage_clear ch1', () => {
    expect(getAriaDialogueKey('stage_clear', 6)).toBe('aria.stage_clear.ch1');
  });

  it('returns correct key for district_change', () => {
    expect(getAriaDialogueKey('district_change', 3)).toBe('aria.district_change.ch0');
  });

  it('returns correct key for boss_defeat', () => {
    expect(getAriaDialogueKey('boss_defeat', 14)).toBe('aria.boss_defeat.ch3');
  });
});

describe('AriaCooldownTracker', () => {
  let tracker: AriaCooldownTracker;

  beforeEach(() => {
    tracker = new AriaCooldownTracker();
  });

  it('allows first show of any event', () => {
    expect(tracker.canShow('low_hp', 0, 8000)).toBe(true);
    expect(tracker.canShow('boss_warning', 0, 8000)).toBe(true);
  });

  it('blocks show within cooldown period', () => {
    tracker.markShown('low_hp', 1000);
    expect(tracker.canShow('low_hp', 5000, 8000)).toBe(false);
  });

  it('allows show after cooldown expires', () => {
    tracker.markShown('low_hp', 1000);
    expect(tracker.canShow('low_hp', 9001, 8000)).toBe(true);
  });

  it('allows show at exact cooldown boundary', () => {
    tracker.markShown('low_hp', 1000);
    expect(tracker.canShow('low_hp', 9000, 8000)).toBe(true);
  });

  it('tracks different event types independently', () => {
    tracker.markShown('low_hp', 1000);
    expect(tracker.canShow('boss_warning', 1000, 8000)).toBe(true);
  });

  it('tracks seen keys', () => {
    expect(tracker.hasSeen('aria.stage_entry.ch0')).toBe(false);
    tracker.markSeen('aria.stage_entry.ch0');
    expect(tracker.hasSeen('aria.stage_entry.ch0')).toBe(true);
  });

  it('reset clears everything', () => {
    tracker.markShown('low_hp', 1000);
    tracker.markSeen('aria.stage_entry.ch0');
    tracker.reset();
    expect(tracker.canShow('low_hp', 1000, 8000)).toBe(true);
    expect(tracker.hasSeen('aria.stage_entry.ch0')).toBe(false);
  });

  it('resetForStage clears cooldowns but retains seen keys', () => {
    tracker.markShown('low_hp', 1000);
    tracker.markSeen('aria.stage_entry.ch0');
    tracker.resetForStage();
    expect(tracker.canShow('low_hp', 1000, 8000)).toBe(true);
    expect(tracker.hasSeen('aria.stage_entry.ch0')).toBe(true);
  });
});

describe('shouldShowLowHp', () => {
  it('returns true when hp is below threshold and not already shown', () => {
    expect(shouldShowLowHp(0.2, 0.3, false)).toBe(true);
  });

  it('returns false when hp is above threshold', () => {
    expect(shouldShowLowHp(0.5, 0.3, false)).toBe(false);
  });

  it('returns false when already shown', () => {
    expect(shouldShowLowHp(0.2, 0.3, true)).toBe(false);
  });

  it('returns false at exact threshold', () => {
    expect(shouldShowLowHp(0.3, 0.3, false)).toBe(false);
  });
});

describe('ARIA_STORY_BEATS', () => {
  it('has 8 story beats covering 4 chapters', () => {
    expect(ARIA_STORY_BEATS).toHaveLength(8);
  });

  it('all beats have required fields', () => {
    for (const beat of ARIA_STORY_BEATS) {
      expect(beat.id).toBeTruthy();
      expect(beat.stage).toBeGreaterThanOrEqual(1);
      expect(beat.stage).toBeLessThanOrEqual(16);
      expect(['stage_entry', 'boss_defeat', 'stage_clear']).toContain(beat.trigger);
      expect(beat.localeKey).toMatch(/^story\./);
      expect(typeof beat.pauseGame).toBe('boolean');
    }
  });

  it('has unique beat IDs', () => {
    const ids = ARIA_STORY_BEATS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('getStoryBeat', () => {
  it('returns matching beat for stage and trigger', () => {
    const seen = new Set<string>();
    const beat = getStoryBeat(1, 'stage_entry', seen);
    expect(beat).not.toBeNull();
    expect(beat!.id).toBe('aria_intro');
    expect(beat!.localeKey).toBe('story.aria_intro');
  });

  it('returns null for unseen stage', () => {
    const seen = new Set<string>();
    expect(getStoryBeat(3, 'stage_entry', seen)).toBeNull();
  });

  it('returns null for already-seen beat', () => {
    const seen = new Set<string>(['aria_intro']);
    expect(getStoryBeat(1, 'stage_entry', seen)).toBeNull();
  });

  it('returns null for wrong trigger type', () => {
    const seen = new Set<string>();
    expect(getStoryBeat(1, 'boss_defeat', seen)).toBeNull();
  });

  it('finds boss_defeat story beats', () => {
    const seen = new Set<string>();
    const beat = getStoryBeat(16, 'boss_defeat', seen);
    expect(beat).not.toBeNull();
    expect(beat!.id).toBe('aria_farewell');
    expect(beat!.pauseGame).toBe(true);
  });

  it('finds stage_clear story beats', () => {
    const seen = new Set<string>();
    const beat = getStoryBeat(2, 'stage_clear', seen);
    expect(beat).not.toBeNull();
    expect(beat!.id).toBe('aria_dismiss');
  });
});

// ===================================================================
// SPEC-026: Runtime Story Events
// ===================================================================

describe('createRuntimeEventState', () => {
  it('returns all flags as false and lastChapter as 0', () => {
    const state = createRuntimeEventState();
    expect(state.firstBossKilled).toBe(false);
    expect(state.killMilestoneShown).toBe(false);
    expect(state.goldMilestoneShown).toBe(false);
    expect(state.deathDialogueShown).toBe(false);
    expect(state.lastChapter).toBe(0);
  });
});

describe('ARIA_RUNTIME_EVENTS', () => {
  it('has 5 runtime events', () => {
    expect(ARIA_RUNTIME_EVENTS).toHaveLength(5);
  });

  it('all events have required fields', () => {
    for (const event of ARIA_RUNTIME_EVENTS) {
      expect(event.id).toBeTruthy();
      expect(event.trigger).toBeTruthy();
      expect(event.localeKey).toMatch(/^story\./);
      expect(typeof event.pauseGame).toBe('boolean');
      expect(typeof event.showDuration).toBe('number');
      expect(typeof event.onlyOnce).toBe('boolean');
    }
  });

  it('has unique event IDs', () => {
    const ids = ARIA_RUNTIME_EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('getRuntimeDialogue — first_boss_kill', () => {
  it('returns beat on first call', () => {
    const state = createRuntimeEventState();
    const beat = getRuntimeDialogue('first_boss_kill', { kills: 1, gold: 0, stage: 2 }, state);
    expect(beat).not.toBeNull();
    expect(beat!.id).toBe('aria_first_boss_kill');
  });

  it('returns null on second call (once per run)', () => {
    const state = createRuntimeEventState();
    getRuntimeDialogue('first_boss_kill', { kills: 1, gold: 0, stage: 2 }, state);
    const beat2 = getRuntimeDialogue('first_boss_kill', { kills: 2, gold: 0, stage: 2 }, state);
    expect(beat2).toBeNull();
  });
});

describe('getRuntimeDialogue — kill_milestone', () => {
  it('returns null when kills < 10', () => {
    const state = createRuntimeEventState();
    const beat = getRuntimeDialogue('kill_milestone', { kills: 9, gold: 0, stage: 1 }, state);
    expect(beat).toBeNull();
  });

  it('returns beat when kills >= 10', () => {
    const state = createRuntimeEventState();
    const beat = getRuntimeDialogue('kill_milestone', { kills: 10, gold: 0, stage: 1 }, state);
    expect(beat).not.toBeNull();
    expect(beat!.id).toBe('aria_kill_milestone');
  });

  it('returns null on second call', () => {
    const state = createRuntimeEventState();
    getRuntimeDialogue('kill_milestone', { kills: 10, gold: 0, stage: 1 }, state);
    const beat2 = getRuntimeDialogue('kill_milestone', { kills: 20, gold: 0, stage: 1 }, state);
    expect(beat2).toBeNull();
  });
});

describe('getRuntimeDialogue — gold_milestone', () => {
  it('returns null when gold < 100', () => {
    const state = createRuntimeEventState();
    const beat = getRuntimeDialogue('gold_milestone', { kills: 0, gold: 99, stage: 1 }, state);
    expect(beat).toBeNull();
  });

  it('returns beat when gold >= 100', () => {
    const state = createRuntimeEventState();
    const beat = getRuntimeDialogue('gold_milestone', { kills: 0, gold: 100, stage: 1 }, state);
    expect(beat).not.toBeNull();
    expect(beat!.id).toBe('aria_gold_milestone');
  });

  it('returns null on second call', () => {
    const state = createRuntimeEventState();
    getRuntimeDialogue('gold_milestone', { kills: 0, gold: 100, stage: 1 }, state);
    const beat2 = getRuntimeDialogue('gold_milestone', { kills: 0, gold: 200, stage: 1 }, state);
    expect(beat2).toBeNull();
  });
});

describe('getRuntimeDialogue — player_death', () => {
  it('returns beat with pauseGame: true', () => {
    const state = createRuntimeEventState();
    const beat = getRuntimeDialogue('player_death', { kills: 5, gold: 30, stage: 3 }, state);
    expect(beat).not.toBeNull();
    expect(beat!.pauseGame).toBe(true);
    expect(beat!.id).toBe('aria_player_death');
  });

  it('returns null on second call', () => {
    const state = createRuntimeEventState();
    getRuntimeDialogue('player_death', { kills: 5, gold: 30, stage: 3 }, state);
    const beat2 = getRuntimeDialogue('player_death', { kills: 5, gold: 30, stage: 3 }, state);
    expect(beat2).toBeNull();
  });
});

describe('getRuntimeDialogue — district_change', () => {
  it('returns beat when chapter changes', () => {
    const state = createRuntimeEventState();
    // Chapter 0 → Chapter 1 (stage 5)
    const beat = getRuntimeDialogue('district_change', { kills: 0, gold: 0, stage: 5 }, state);
    expect(beat).not.toBeNull();
    expect(beat!.id).toBe('aria_district_narration');
  });

  it('returns null when same chapter', () => {
    const state = createRuntimeEventState();
    // lastChapter starts at 0, stage 1 is also chapter 0
    state.lastChapter = 0;
    const beat = getRuntimeDialogue('district_change', { kills: 0, gold: 0, stage: 2 }, state);
    expect(beat).toBeNull();
  });

  it('fires again on next chapter change (not onlyOnce)', () => {
    const state = createRuntimeEventState();
    // Ch 0 → Ch 1
    getRuntimeDialogue('district_change', { kills: 0, gold: 0, stage: 5 }, state);
    // Ch 1 → Ch 2
    const beat2 = getRuntimeDialogue('district_change', { kills: 0, gold: 0, stage: 9 }, state);
    expect(beat2).not.toBeNull();
  });
});

describe('getRuntimeLocaleKey', () => {
  it('returns chapter-specific key for player_death', () => {
    const deathBeat = ARIA_RUNTIME_EVENTS.find((e) => e.trigger === 'player_death')!;
    expect(getRuntimeLocaleKey(deathBeat, 1)).toBe('story.aria_death_ch0');
    expect(getRuntimeLocaleKey(deathBeat, 5)).toBe('story.aria_death_ch1');
    expect(getRuntimeLocaleKey(deathBeat, 9)).toBe('story.aria_death_ch2');
    expect(getRuntimeLocaleKey(deathBeat, 13)).toBe('story.aria_death_ch3');
  });

  it('returns chapter-specific key for district_change', () => {
    const districtBeat = ARIA_RUNTIME_EVENTS.find((e) => e.trigger === 'district_change')!;
    expect(getRuntimeLocaleKey(districtBeat, 5)).toBe('story.aria_district_ch1');
    expect(getRuntimeLocaleKey(districtBeat, 9)).toBe('story.aria_district_ch2');
    expect(getRuntimeLocaleKey(districtBeat, 13)).toBe('story.aria_district_ch3');
  });

  it('returns base localeKey for non-chapter-specific events', () => {
    const killBeat = ARIA_RUNTIME_EVENTS.find((e) => e.trigger === 'kill_milestone')!;
    expect(getRuntimeLocaleKey(killBeat, 1)).toBe('story.aria_kill_milestone');
    expect(getRuntimeLocaleKey(killBeat, 10)).toBe('story.aria_kill_milestone');
  });
});

describe('runtime events do not interfere with getStoryBeat', () => {
  it('getStoryBeat still works after runtime events', () => {
    const state = createRuntimeEventState();
    // Trigger some runtime events
    getRuntimeDialogue('first_boss_kill', { kills: 1, gold: 0, stage: 2 }, state);
    getRuntimeDialogue('kill_milestone', { kills: 10, gold: 0, stage: 2 }, state);

    // Stage story beats should still function independently
    const seen = new Set<string>();
    const beat = getStoryBeat(1, 'stage_entry', seen);
    expect(beat).not.toBeNull();
    expect(beat!.id).toBe('aria_intro');
  });
});
