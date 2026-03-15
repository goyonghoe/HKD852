import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * M-003 Compliance Test — No hex color literals outside src/config/colors.ts.
 *
 * This test reads all .ts files under src/ (excluding colors.ts itself)
 * and asserts that no hardcoded hex color patterns exist.
 *
 * Allowed exceptions:
 * - src/config/colors.ts (the single source of truth for colors)
 * - Bit-mask / hash constants (e.g., 0xFFFFFFFF, 0x6D2B79F5) — not colors
 */

const SRC_DIR = path.resolve(__dirname, '../../src');
const COLORS_FILE = path.join(SRC_DIR, 'config', 'colors.ts');

// Known non-color hex constants (bit masks, hash seeds)
const ALLOWED_HEX = new Set(['0xFFFFFFFF', '0x6D2B79F5']);

function getAllTsFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllTsFiles(full));
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      files.push(full);
    }
  }
  return files;
}

describe('M-003 Color Audit', () => {
  const tsFiles = getAllTsFiles(SRC_DIR).filter((f) => path.resolve(f) !== path.resolve(COLORS_FILE));

  it('found source files to scan', () => {
    expect(tsFiles.length).toBeGreaterThan(0);
  });

  it('no Phaser hex color literals (0xNNNNNN) outside colors.ts', () => {
    const violations: string[] = [];
    // Match 0x followed by exactly 6 hex digits, not part of a longer hex string
    const hexPattern = /\b0x([0-9A-Fa-f]{6})\b/g;

    for (const file of tsFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let match: RegExpExecArray | null;
        hexPattern.lastIndex = 0;
        while ((match = hexPattern.exec(line)) !== null) {
          const full = match[0].toUpperCase();
          if (ALLOWED_HEX.has(full)) continue;
          // Skip if it's part of a longer hex (e.g., 0xFFFFFFFF matched as 0xFFFFFF)
          const afterIdx = match.index + match[0].length;
          if (afterIdx < line.length && /[0-9A-Fa-f]/.test(line[afterIdx])) continue;
          const rel = path.relative(SRC_DIR, file);
          violations.push(`${rel}:${i + 1} — ${match[0]}`);
        }
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `M-003 VIOLATION: ${violations.length} hex color literal(s) found outside colors.ts:\n` +
          violations.map((v) => `  ${v}`).join('\n'),
      );
    }
  });

  it('no CSS hex color literals (#NNNNNN) outside colors.ts', () => {
    const violations: string[] = [];
    const cssHexPattern = /'#[0-9A-Fa-f]{3,8}'/g;

    for (const file of tsFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let match: RegExpExecArray | null;
        cssHexPattern.lastIndex = 0;
        while ((match = cssHexPattern.exec(line)) !== null) {
          const rel = path.relative(SRC_DIR, file);
          violations.push(`${rel}:${i + 1} — ${match[0]}`);
        }
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `M-003 VIOLATION: ${violations.length} CSS hex color literal(s) found outside colors.ts:\n` +
          violations.map((v) => `  ${v}`).join('\n'),
      );
    }
  });
});
