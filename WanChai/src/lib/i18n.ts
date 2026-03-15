import { en } from '../locales/en';
import { ko } from '../locales/ko';
import { isValidLocale } from '../utils/SettingsCalc';

type SupportedLocale = 'en' | 'ko';

const locales: Record<SupportedLocale, Record<string, string>> = { en, ko };

let currentLocale: SupportedLocale = 'en';

function isSupportedLocale(locale: string): locale is SupportedLocale {
  return isValidLocale(locale);
}

/** Load saved locale from localStorage (if available). */
function loadLocale(): void {
  try {
    const saved = localStorage.getItem('wanchai_locale') ?? localStorage.getItem('wanchai_lang'); // legacy key migration
    if (saved && isSupportedLocale(saved)) {
      currentLocale = saved;
    }
  } catch {
    // localStorage not available (SSR, privacy mode)
  }
}

loadLocale();

/**
 * Translate a key with optional parameter interpolation.
 * Parameters use `{name}` syntax: `t('kills', { count: 42 })` -> "42 Kills"
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const dict = locales[currentLocale] ?? locales['en'];
  let str = dict[key] ?? locales['en'][key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, String(v));
    }
  }
  return str;
}

/** Set the active locale and persist to localStorage. */
export function setLocale(locale: string): void {
  if (isSupportedLocale(locale)) {
    currentLocale = locale;
    try {
      localStorage.setItem('wanchai_locale', locale);
    } catch {
      // ignore
    }
  }
}

/** Get the current locale code. */
export function getLocale(): string {
  return currentLocale;
}
