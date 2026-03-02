/**
 * All replaceable sprite texture keys.
 * Place PNG files in public/assets/sprites/{key}.png to override procedural textures.
 */
export const SPRITE_KEYS = [
  // Player & allies
  'player',

  // Characters (128x128)
  'char_hai',
  'char_nova',
  'char_sol',
  'char_mei',
  'char_kai',

  // In-game player (48x48, back view)
  'char_hai_ingame',
  'char_nova_ingame',
  'char_sol_ingame',
  'char_mei_ingame',
  'char_kai_ingame',

  // T1 enemies (48x48)
  't1_moth',
  't1_jelly',
  't1_rat',
  't1_ant',
  't1_butterfly',
  't1_cat',

  // T2 enemies (72x72)
  'opt_t2_kite',
  'opt_t2_dolphin',
  'opt_t2_ape',
  'opt_t2_pango',
  'opt_t2_lion',
  'opt_t2_koi',

  // Legacy shape-based (procedural fallback)
  'enemy_circle',
  'enemy_triangle',
  'enemy_rect',
  'enemy_diamond',
  'enemy_hexagon',
  'enemy_chaser',
  'enemy_shooter',
  'enemy_teleporter',

  // Bosses — game (192x192)
  'boss_aero',
  'boss_hydra',
  'boss_blaze',
  'boss_terra',
  'boss_lumen',
  'boss_umbra',
  'boss_harvester',
  // Bosses — cutscene/codex (384x384)
  'boss_aero_large',
  'boss_hydra_large',
  'boss_blaze_large',
  'boss_terra_large',
  'boss_lumen_large',
  'boss_umbra_large',
  'boss_harvester_large',
  // Legacy boss (procedural fallback)
  'boss_hex',
  'boss_diamond',
  'boss_rect',

  // Projectiles
  'projectile_bullet',
  'projectile_laser',
  'projectile_shuriken',
  'projectile_rapid',
  'projectile_missile',
  'projectile_napalm',
  'projectile_bomb',
  'projectile_enemy',

  // Particles
  'particle_square',
  'particle_glow',

  // Critters (48x48)
  'critter_kite',
  'critter_dolphin',
  'critter_macaque',
  'critter_lion',
  'critter_pangolin',
  'critter_koi',

  // Backgrounds (720x1280)
  'bg_wanchai',
  'bg_central',
  'bg_aberdeen',
  'bg_mongkok',
  'bg_shamshuipo',
  'bg_wongtaisin',
  'bg_kowloon',
  'bg_lantau',

  // Effects
  'fx_mech_debris',
  'fx_purify_burst',
  'fx_glitch_overlay',
  'fx_enemy_shoot_flash',
  'fx_napalm_zone',

  // UI
  'ui_mtr_map',
  'ui_aria_panel',
  'ui_weapon_slot_bg',
  'ui_weapon_slot_filled',
  'ui_hp_bar_frame',
  'ui_xp_bar_frame',

  // Weapon icons (48x48)
  'icon_energy_shot',
  'icon_napalm',
  'icon_laser_beam',
  'icon_shuriken',
  'icon_shotgun',
  'icon_lightning',
  'icon_missile',
  'icon_bomb',
  'icon_railgun',
  'icon_rapid_fire',

  // Logo
  'logo_main',
  'logo_small',
] as const;

export type SpriteKey = (typeof SPRITE_KEYS)[number];
