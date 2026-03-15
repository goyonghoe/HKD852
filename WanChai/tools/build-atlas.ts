#!/usr/bin/env npx tsx
/**
 * Texture Atlas Builder — Groups individual PNGs into Phaser-compatible atlas JSON + PNG.
 *
 * Usage: npx tsx tools/build-atlas.ts
 *
 * Outputs to public/assets/atlas/ as:
 *   - ui-atlas.json + ui-atlas.png    (icons, passive, shop)
 *   - deco-atlas.json + deco-atlas.png (decorations, vending, signs, furniture)
 *   - env-atlas.json + env-atlas.png   (barriers, barricades, floor tiles, env objects)
 *   - fx-atlas.json + fx-atlas.png     (effects, projectiles, gun)
 *   - char-atlas.json + char-atlas.png (character hands, critter portraits)
 *
 * Background images (bg_*) and parallax layers are excluded — they're too large for atlasing.
 */

import { packAsync, TexturePackerOptions } from 'free-tex-packer-core';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SPRITES_DIR = path.resolve(__dirname, '../public/assets/sprites');
const OUTPUT_DIR = path.resolve(__dirname, '../public/assets/atlas');

/** Atlas group definitions: name → prefix patterns */
const ATLAS_GROUPS: Record<string, string[]> = {
  'ui-atlas': ['icon_passive_', 'icon_shop_', 'icon_', 'logo_', 'ui_'],
  'deco-atlas': [
    'deco_sign_',
    'deco_lamp_',
    'deco_vending_',
    'deco_table',
    'deco_chair_',
    'deco_parasol',
    'deco_shop_',
  ],
  'env-atlas': ['barrier_', 'barricade_', 'floor_tile_', 'env_'],
  'fx-atlas': ['fx_', 'projectile_', 'gun_'],
  'char-atlas': ['hand_', 'critter_'],
};

/** Prefixes to exclude from atlasing (too large or already spritesheets) */
const EXCLUDE_PREFIXES = ['bg_', 'parallax_'];

async function buildAtlas(groupName: string, prefixes: string[]): Promise<{ frames: number; size: number }> {
  const images: { path: string; contents: Buffer }[] = [];

  const allFiles = fs.readdirSync(SPRITES_DIR).filter((f) => f.endsWith('.png'));

  for (const file of allFiles) {
    const matchesPrefix = prefixes.some((p) => file.startsWith(p));
    if (!matchesPrefix) continue;

    const filePath = path.join(SPRITES_DIR, file);
    images.push({
      path: file,
      contents: fs.readFileSync(filePath),
    });
  }

  if (images.length === 0) {
    console.log(`  [${groupName}] No images found, skipping`);
    return { frames: 0, size: 0 };
  }

  const options: TexturePackerOptions = {
    textureName: groupName,
    width: 2048,
    height: 2048,
    fixedSize: false,
    powerOfTwo: true,
    padding: 2,
    allowRotation: false,
    allowTrim: true,
    detectIdentical: true,
    exporter: 'Phaser3' as unknown as TexturePackerOptions['exporter'],
    packer: 'MaxRectsBin' as unknown as TexturePackerOptions['packer'],
    packerMethod: 'BestShortSideFit' as unknown as TexturePackerOptions['packerMethod'],
  };

  const result = await packAsync(images, options);

  let totalSize = 0;
  for (const file of result) {
    const outPath = path.join(OUTPUT_DIR, file.name);
    fs.writeFileSync(outPath, file.buffer);
    totalSize += file.buffer.length;
  }

  console.log(`  [${groupName}] ${images.length} sprites → ${(totalSize / 1024).toFixed(1)} KB`);
  return { frames: images.length, size: totalSize };
}

async function main(): Promise<void> {
  console.log('🎨 Building texture atlases...\n');

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let totalFrames = 0;
  let totalSize = 0;

  for (const [name, prefixes] of Object.entries(ATLAS_GROUPS)) {
    const result = await buildAtlas(name, prefixes);
    totalFrames += result.frames;
    totalSize += result.size;
  }

  // Count excluded sprites
  const allFiles = fs.readdirSync(SPRITES_DIR).filter((f) => f.endsWith('.png'));
  const excludedCount = allFiles.filter((f) => EXCLUDE_PREFIXES.some((p) => f.startsWith(p))).length;
  const atlasedFiles = allFiles.filter((f) =>
    Object.values(ATLAS_GROUPS)
      .flat()
      .some((p) => f.startsWith(p)),
  );
  const unatlasedCount = allFiles.length - atlasedFiles.length - excludedCount;

  console.log(`\n✅ Atlas build complete:`);
  console.log(
    `   Atlased: ${totalFrames} sprites in ${Object.keys(ATLAS_GROUPS).length} atlases (${(totalSize / 1024).toFixed(1)} KB)`,
  );
  console.log(`   Excluded (too large): ${excludedCount} files (bg_*, parallax_*)`);
  console.log(`   Unatlased (other): ${unatlasedCount} files`);
}

main().catch((err) => {
  console.error('Atlas build failed:', err);
  process.exit(1);
});
