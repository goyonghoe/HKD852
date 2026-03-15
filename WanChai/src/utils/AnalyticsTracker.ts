/**
 * AnalyticsTracker — Phaser-aware event collector.
 *
 * Collects game events in memory for future backend integration.
 * NO actual network calls — events are stored locally and can be
 * flushed to a backend (GA4, PostHog, etc.) when integration is added.
 *
 * Integration point: Replace flush() with actual HTTP POST to your
 * analytics endpoint (e.g., GA4 Measurement Protocol or PostHog /capture).
 */

import { createGameEvent, type GameEvent } from '../core/AnalyticsCalc';

export class AnalyticsTracker {
  private events: GameEvent[] = [];

  /** Track a generic game event. */
  trackEvent(category: string, action: string, label?: string, value?: number): void {
    this.events.push(createGameEvent(category, action, label, value));
  }

  /** Track stage start. */
  trackStageStart(stage: number, chapter: number): void {
    this.trackEvent('progression', 'stage_start', `ch${chapter}_stage${stage}`, stage);
  }

  /** Track stage clear. */
  trackStageClear(stage: number, survived: boolean, kills: number): void {
    this.trackEvent('progression', 'stage_clear', `stage${stage}_${survived ? 'survived' : 'failed'}`, kills);
  }

  /** Track game over (run end). */
  trackGameOver(survived: boolean, kills: number, stage: number): void {
    this.trackEvent('session', survived ? 'run_complete' : 'game_over', `stage${stage}`, kills);
  }

  /** Track level up. */
  trackLevelUp(level: number, weaponChosen?: string): void {
    this.trackEvent('progression', 'level_up', weaponChosen ?? `level${level}`, level);
  }

  /** Return all collected events. */
  getEvents(): ReadonlyArray<GameEvent> {
    return [...this.events];
  }

  /**
   * Clear all collected events.
   * Future integration point: POST events to analytics backend before clearing.
   */
  flush(): void {
    // TODO: Send this.events to GA4/PostHog before clearing
    this.events = [];
  }
}
