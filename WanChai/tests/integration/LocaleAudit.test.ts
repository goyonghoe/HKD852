/**
 * TASK-079: Locale Completeness Audit
 * Ensures ko.ts and en.ts have identical key sets,
 * no untranslated copy-paste, and all critical keys exist.
 */
import { describe, it, expect } from 'vitest';
import { ko } from '../../src/locales/ko';
import { en } from '../../src/locales/en';

const koKeys = Object.keys(ko).sort();
const enKeys = Object.keys(en).sort();

// ===============================================================
// 1. Key Parity
// ===============================================================

describe('Locale Audit — Key Parity', () => {
  it('ko.ts and en.ts have identical key sets', () => {
    const missingInEn = koKeys.filter((k) => !(k in en));
    const missingInKo = enKeys.filter((k) => !(k in ko));
    expect(missingInEn).toEqual([]);
    expect(missingInKo).toEqual([]);
  });

  it('ko.ts and en.ts have the same number of keys', () => {
    expect(koKeys.length).toBe(enKeys.length);
  });

  it('every ko key exists in en', () => {
    for (const key of koKeys) {
      expect(en).toHaveProperty(key);
    }
  });

  it('every en key exists in ko', () => {
    for (const key of enKeys) {
      expect(ko).toHaveProperty(key);
    }
  });
});

// ===============================================================
// 2. No Empty Values
// ===============================================================

describe('Locale Audit — No Empty Values', () => {
  it('no en.ts value is an empty string', () => {
    const emptyKeys = enKeys.filter((k) => en[k] === '');
    expect(emptyKeys).toEqual([]);
  });

  it('no ko.ts value is an empty string', () => {
    const emptyKeys = koKeys.filter((k) => ko[k] === '');
    expect(emptyKeys).toEqual([]);
  });
});

// ===============================================================
// 3. No Untranslated Copy-Paste
// ===============================================================

describe('Locale Audit — No Untranslated Copy-Paste', () => {
  // Keys where en=ko is expected (proper nouns, brand names, technical labels, etc.)
  const allowedDuplicates = new Set([
    'preload.loading', // "Loading..." is universal
    'district.central', // District names contain Chinese characters in both
    'district.tst',
    'district.mongkok',
    'district.ssp',
    'district.wts',
    'district.lantau',
    'district.aberdeen',
    'district.kowloon',
    'daily.badge_available', // "Day {day}" pattern is similar
    'daily.badge_claimed', // "Day {day}" pattern is similar
    'challenge.rank', // "#{rank}" is universal
    'evolution.recipe', // "{primary} + {secondary} -> {result}" is a formula
    'gameover.weapon_damage', // "  {name}: {pct}%" is a data template with only parameters
    'stageclear.wave_clear', // "STAGE {stage} CLEAR" is stylized English in all locales
  ]);

  it('en.ts values differ from ko.ts values (detect untranslated copy-paste)', () => {
    const sameValues: string[] = [];
    for (const key of koKeys) {
      if (key in en && ko[key] === en[key] && !allowedDuplicates.has(key)) {
        sameValues.push(key);
      }
    }
    expect(sameValues).toEqual([]);
  });
});

// ===============================================================
// 4. Critical UI Keys Exist
// ===============================================================

describe('Locale Audit — Critical UI Keys', () => {
  const criticalKeys = [
    // Core gameplay
    'levelup.title',
    'levelup.new',
    'levelup.skip',
    'stageclear.next_stage',
    'stageclear.boss_defeated',
    'gameover.victory',
    'gameover.defeat',
    'gameover.retry',
    'gameover.main_menu',
    // Navigation
    'menu.play',
    'menu.settings',
    'charselect.title',
    'charselect.go',
    // HUD
    'hud.kills',
    'hud.remaining',
    // Settings
    'settings.title',
    'settings.bgm',
    'settings.sfx',
    'settings.language',
    // Meta
    'meta.title',
    'meta.main_menu',
    // ARIA messages
    'aria.game_start',
    'aria.boss_spawn',
  ];

  it('all critical UI keys exist in en.ts', () => {
    const missing = criticalKeys.filter((k) => !(k in en));
    expect(missing).toEqual([]);
  });

  it('all critical UI keys exist in ko.ts', () => {
    const missing = criticalKeys.filter((k) => !(k in ko));
    expect(missing).toEqual([]);
  });
});

// ===============================================================
// 5. Parameter Consistency
// ===============================================================

describe('Locale Audit — Parameter Consistency', () => {
  /**
   * Extract parameter names from a localized string.
   * E.g., "Stage: {current} / {max}" -> ["current", "max"]
   */
  function extractParams(str: string): string[] {
    const matches = str.match(/\{(\w+)\}/g);
    if (!matches) return [];
    return matches.map((m) => m.slice(1, -1)).sort();
  }

  it('ko.ts and en.ts use the same parameter names per key', () => {
    const mismatches: string[] = [];
    for (const key of koKeys) {
      if (!(key in en)) continue;
      const koParams = extractParams(ko[key]);
      const enParams = extractParams(en[key]);
      if (JSON.stringify(koParams) !== JSON.stringify(enParams)) {
        mismatches.push(`${key}: ko={${koParams}} en={${enParams}}`);
      }
    }
    expect(mismatches).toEqual([]);
  });
});
