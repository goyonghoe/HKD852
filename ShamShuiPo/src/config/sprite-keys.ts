// ── Neon Survivors: Sprite Keys & Frame Config ──

/** Spritesheet frame config for Phaser loader */
export interface FrameConfig {
  key: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
  /** optional: override frame count if not full sheet width */
  frameCount?: number;
}

// ── Heroes (48x48 per frame) ──

export const HERO_SPRITES: FrameConfig[] = [
  // Biker
  {
    key: "hero_biker_idle",
    path: "assets/sprites/heroes/biker/Idle.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "hero_biker_run",
    path: "assets/sprites/heroes/biker/Run.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "hero_biker_attack",
    path: "assets/sprites/heroes/biker/Attack.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "hero_biker_death",
    path: "assets/sprites/heroes/biker/Death.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "hero_biker_hurt",
    path: "assets/sprites/heroes/biker/Hurt.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  // Punk
  {
    key: "hero_punk_idle",
    path: "assets/sprites/heroes/punk/Idle.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "hero_punk_run",
    path: "assets/sprites/heroes/punk/Run.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "hero_punk_attack",
    path: "assets/sprites/heroes/punk/Attack.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "hero_punk_death",
    path: "assets/sprites/heroes/punk/Death.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "hero_punk_hurt",
    path: "assets/sprites/heroes/punk/Hurt.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  // Cyborg
  {
    key: "hero_cyborg_idle",
    path: "assets/sprites/heroes/cyborg/Idle.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "hero_cyborg_run",
    path: "assets/sprites/heroes/cyborg/Run.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "hero_cyborg_attack",
    path: "assets/sprites/heroes/cyborg/Attack.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "hero_cyborg_death",
    path: "assets/sprites/heroes/cyborg/Death.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "hero_cyborg_hurt",
    path: "assets/sprites/heroes/cyborg/Hurt.png",
    frameWidth: 48,
    frameHeight: 48,
  },
];

// ── Enemies (48x48 per frame) ──

export const ENEMY_SPRITES: FrameConfig[] = [
  // Enemy type 1 (grunt)
  {
    key: "enemy_grunt_idle",
    path: "assets/sprites/enemies/1/Idle.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "enemy_grunt_walk",
    path: "assets/sprites/enemies/1/Walk.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "enemy_grunt_attack",
    path: "assets/sprites/enemies/1/Attack.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "enemy_grunt_death",
    path: "assets/sprites/enemies/1/Death.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  // Enemy type 2 (brute)
  {
    key: "enemy_brute_idle",
    path: "assets/sprites/enemies/2/Idle.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "enemy_brute_walk",
    path: "assets/sprites/enemies/2/Walk.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "enemy_brute_attack",
    path: "assets/sprites/enemies/2/Attack.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "enemy_brute_death",
    path: "assets/sprites/enemies/2/Death.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  // Enemy type 3 (dasher)
  {
    key: "enemy_dasher_idle",
    path: "assets/sprites/enemies/3/Idle.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "enemy_dasher_walk",
    path: "assets/sprites/enemies/3/Walk.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "enemy_dasher_attack",
    path: "assets/sprites/enemies/3/Attack.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "enemy_dasher_death",
    path: "assets/sprites/enemies/3/Death.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  // Enemy type 4 (ranged)
  {
    key: "enemy_ranged_idle",
    path: "assets/sprites/enemies/4/Idle.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "enemy_ranged_walk",
    path: "assets/sprites/enemies/4/Walk.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "enemy_ranged_attack",
    path: "assets/sprites/enemies/4/Attack.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "enemy_ranged_death",
    path: "assets/sprites/enemies/4/Death.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  // Enemy type 5 (slasher) — City enemies pack
  {
    key: "enemy_slasher_idle",
    path: "assets/sprites/enemies/5/Idle.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "enemy_slasher_walk",
    path: "assets/sprites/enemies/5/Walk.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "enemy_slasher_attack",
    path: "assets/sprites/enemies/5/Attack.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "enemy_slasher_death",
    path: "assets/sprites/enemies/5/Death.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  // Enemy type 6 (worker) — Industrial zone pack
  {
    key: "enemy_worker_idle",
    path: "assets/sprites/enemies/6/Idle.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "enemy_worker_walk",
    path: "assets/sprites/enemies/6/Walk.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "enemy_worker_attack",
    path: "assets/sprites/enemies/6/Attack.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "enemy_worker_death",
    path: "assets/sprites/enemies/6/Death.png",
    frameWidth: 48,
    frameHeight: 48,
  },
];

// ── Bosses (72x72 per frame) ──

export const BOSS_SPRITES: FrameConfig[] = [
  // Boss 1 (original — keys kept as boss_* for backward compat)
  {
    key: "boss_idle",
    path: "assets/sprites/bosses/1/Idle.png",
    frameWidth: 72,
    frameHeight: 72,
  },
  {
    key: "boss_walk",
    path: "assets/sprites/bosses/1/Walk.png",
    frameWidth: 72,
    frameHeight: 72,
  },
  {
    key: "boss_attack",
    path: "assets/sprites/bosses/1/Attack.png",
    frameWidth: 72,
    frameHeight: 72,
  },
  {
    key: "boss_death",
    path: "assets/sprites/bosses/1/Death.png",
    frameWidth: 72,
    frameHeight: 72,
  },
  // Boss 2 (free bosses pack)
  {
    key: "boss2_idle",
    path: "assets/sprites/bosses/2/Idle.png",
    frameWidth: 72,
    frameHeight: 72,
  },
  {
    key: "boss2_walk",
    path: "assets/sprites/bosses/2/Walk.png",
    frameWidth: 72,
    frameHeight: 72,
  },
  {
    key: "boss2_attack",
    path: "assets/sprites/bosses/2/Attack.png",
    frameWidth: 72,
    frameHeight: 72,
  },
  {
    key: "boss2_death",
    path: "assets/sprites/bosses/2/Death.png",
    frameWidth: 72,
    frameHeight: 72,
  },
  // Boss 3 (lab bosses pack)
  {
    key: "boss3_idle",
    path: "assets/sprites/bosses/3/Idle.png",
    frameWidth: 72,
    frameHeight: 72,
  },
  {
    key: "boss3_walk",
    path: "assets/sprites/bosses/3/Walk.png",
    frameWidth: 72,
    frameHeight: 72,
  },
  {
    key: "boss3_attack",
    path: "assets/sprites/bosses/3/Attack.png",
    frameWidth: 72,
    frameHeight: 72,
  },
  {
    key: "boss3_death",
    path: "assets/sprites/bosses/3/Death.png",
    frameWidth: 72,
    frameHeight: 72,
  },
];

// ── Effects ──

export const EFFECT_SPRITES: FrameConfig[] = [
  {
    key: "fx_smoke",
    path: "assets/sprites/effects/smoke.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "fx_explosion",
    path: "assets/sprites/effects/explosion.png",
    frameWidth: 72,
    frameHeight: 72,
  },
  {
    key: "fx_fire",
    path: "assets/sprites/effects/fire.png",
    frameWidth: 64,
    frameHeight: 64,
  },
  {
    key: "fx_blood1",
    path: "assets/sprites/effects/blood1.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "fx_blood2",
    path: "assets/sprites/effects/blood2.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "fx_sparks1",
    path: "assets/sprites/effects/sparks1.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "fx_sparks2",
    path: "assets/sprites/effects/sparks2.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  {
    key: "fx_energy1",
    path: "assets/sprites/effects/energy1.png",
    frameWidth: 160,
    frameHeight: 160,
  },
  {
    key: "fx_energy2",
    path: "assets/sprites/effects/energy2.png",
    frameWidth: 70,
    frameHeight: 70,
  },
];

// ── Backgrounds (576x324 per layer, will be scaled) ──

/** Night city parallax — keys kept as bg_layer* for backward compat */
export const BG_LAYERS = [
  { key: "bg_layer1", path: "assets/bg/night_1.png" },
  { key: "bg_layer2", path: "assets/bg/night_2.png" },
  { key: "bg_layer3", path: "assets/bg/night_3.png" },
  { key: "bg_layer4", path: "assets/bg/night_4.png" },
  { key: "bg_layer5", path: "assets/bg/night_5.png" },
];

/** Day city parallax — alternate theme */
export const BG_LAYERS_DAY = [
  { key: "bg_day_1", path: "assets/bg/day_1.png" },
  { key: "bg_day_2", path: "assets/bg/day_2.png" },
  { key: "bg_day_3", path: "assets/bg/day_3.png" },
  { key: "bg_day_4", path: "assets/bg/day_4.png" },
  { key: "bg_day_5", path: "assets/bg/day_5.png" },
];

// ── Icons (32x32 individual PNGs) ──

export const WEAPON_ICONS = Array.from({ length: 20 }, (_, i) => {
  const idx = String(i + 1).padStart(2, "0");
  return {
    key: `icon_weapon_${idx}`,
    path: `assets/icons/weapons/weapon_${idx}.png`,
  };
});

export const SKILL_ICONS = Array.from({ length: 20 }, (_, i) => {
  const idx = String(i + 1).padStart(2, "0");
  return {
    key: `icon_skill_${idx}`,
    path: `assets/icons/skills/skill_${idx}.png`,
  };
});

// ── All sprites for batch loading ──

export const ALL_SPRITESHEETS: FrameConfig[] = [
  ...HERO_SPRITES,
  ...ENEMY_SPRITES,
  ...BOSS_SPRITES,
  ...EFFECT_SPRITES,
];
