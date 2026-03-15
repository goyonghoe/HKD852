import { describe, it, expect } from 'vitest';
import { createGameEvent, formatEventForGA4, getSessionMetrics, type GameEvent } from '../../src/core/AnalyticsCalc';

describe('AnalyticsCalc', () => {
  describe('createGameEvent', () => {
    it('returns correct structure with all fields', () => {
      const event = createGameEvent('progression', 'stage_clear', 'stage5', 120);
      expect(event.category).toBe('progression');
      expect(event.action).toBe('stage_clear');
      expect(event.label).toBe('stage5');
      expect(event.value).toBe(120);
      expect(typeof event.timestamp).toBe('number');
      expect(event.timestamp).toBeGreaterThan(0);
    });

    it('returns correct structure without optional fields', () => {
      const event = createGameEvent('session', 'start');
      expect(event.category).toBe('session');
      expect(event.action).toBe('start');
      expect(event.label).toBeUndefined();
      expect(event.value).toBeUndefined();
      expect(typeof event.timestamp).toBe('number');
    });

    it('allows zero as a valid value', () => {
      const event = createGameEvent('combat', 'damage', 'miss', 0);
      expect(event.value).toBe(0);
    });
  });

  describe('formatEventForGA4', () => {
    it('produces correct GA4 format with all fields', () => {
      const event: GameEvent = {
        category: 'progression',
        action: 'level_up',
        label: 'weapon_laser',
        value: 5,
        timestamp: 1700000000000,
      };
      const ga4 = formatEventForGA4(event);
      expect(ga4.event_name).toBe('level_up');
      expect(ga4.event_category).toBe('progression');
      expect(ga4.event_label).toBe('weapon_laser');
      expect(ga4.value).toBe(5);
      expect(ga4.timestamp).toBe(1700000000000);
    });

    it('omits event_label when label is undefined', () => {
      const event: GameEvent = {
        category: 'session',
        action: 'start',
        timestamp: 1700000000000,
      };
      const ga4 = formatEventForGA4(event);
      expect(ga4.event_name).toBe('start');
      expect(ga4).not.toHaveProperty('event_label');
      expect(ga4).not.toHaveProperty('value');
    });

    it('includes value of zero', () => {
      const event: GameEvent = {
        category: 'combat',
        action: 'hit',
        value: 0,
        timestamp: 1700000000000,
      };
      const ga4 = formatEventForGA4(event);
      expect(ga4.value).toBe(0);
    });
  });

  describe('getSessionMetrics', () => {
    it('returns zero metrics for empty events', () => {
      const metrics = getSessionMetrics([]);
      expect(metrics.totalEvents).toBe(0);
      expect(metrics.uniqueCategories).toEqual([]);
      expect(metrics.duration).toBe(0);
    });

    it('aggregates single event correctly', () => {
      const events: GameEvent[] = [{ category: 'session', action: 'start', timestamp: 1000 }];
      const metrics = getSessionMetrics(events);
      expect(metrics.totalEvents).toBe(1);
      expect(metrics.uniqueCategories).toEqual(['session']);
      expect(metrics.duration).toBe(0);
    });

    it('aggregates multiple events with correct duration', () => {
      const events: GameEvent[] = [
        { category: 'session', action: 'start', timestamp: 1000 },
        { category: 'progression', action: 'stage_clear', timestamp: 5000 },
        { category: 'combat', action: 'kill', timestamp: 3000 },
        { category: 'progression', action: 'level_up', timestamp: 8000 },
      ];
      const metrics = getSessionMetrics(events);
      expect(metrics.totalEvents).toBe(4);
      expect(metrics.uniqueCategories).toEqual(['combat', 'progression', 'session']);
      expect(metrics.duration).toBe(7000); // 8000 - 1000
    });

    it('deduplicates categories', () => {
      const events: GameEvent[] = [
        { category: 'combat', action: 'hit', timestamp: 1000 },
        { category: 'combat', action: 'kill', timestamp: 2000 },
        { category: 'combat', action: 'miss', timestamp: 3000 },
      ];
      const metrics = getSessionMetrics(events);
      expect(metrics.uniqueCategories).toEqual(['combat']);
      expect(metrics.totalEvents).toBe(3);
      expect(metrics.duration).toBe(2000);
    });
  });
});
