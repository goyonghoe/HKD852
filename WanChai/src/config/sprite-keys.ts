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
  'projectile_enemy_large',

  // Particles
  'particle_square',
  'particle_glow',
  'particle_purify',

  // Critters (48x48)
  'critter_kite',
  'critter_dolphin',
  'critter_macaque',
  'critter_lion',
  'critter_pangolin',
  'critter_koi',

  // Critter portraits (128x128)
  'critter_kite_portrait',
  'critter_dolphin_portrait',
  'critter_macaque_portrait',
  'critter_lion_portrait',
  'critter_pangolin_portrait',
  'critter_koi_portrait',

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
  'fx_levelup',

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

  // Passive icons (48x48)
  'icon_passive_area',
  'icon_passive_armor',
  'icon_passive_cooldown',
  'icon_passive_crit',
  'icon_passive_crit_dmg',
  'icon_passive_magnet',
  'icon_passive_projectile',
  'icon_passive_regen',

  // Shop icons (48x48)
  'icon_shop_armor',
  'icon_shop_base_hp',
  'icon_shop_damage',
  'icon_shop_hp',

  // Hand+Gun (arm layer, 32x32)
  'hand_biker',
  'hand_punk',
  'hand_cyborg',
  'hand_mei',
  'hand_kai',

  // Gun
  'gun_default',

  // Logo
  'logo_main',
  'logo_small',
] as const;

export type SpriteKey = (typeof SPRITE_KEYS)[number];

// Parallax background layers (per district, 5 layers each)
// District 1 = Central, 2 = Aberdeen, etc.
export const PARALLAX_KEYS = {
  1: {
    sky: 'parallax_1_sky',
    far: 'parallax_1_far',
    mid: 'parallax_1_mid',
    near: 'parallax_1_near',
    front: 'parallax_1_front',
  },
  2: {
    sky: 'parallax_2_sky',
    far: 'parallax_2_far',
    mid: 'parallax_2_mid',
    near: 'parallax_2_near',
    front: 'parallax_2_front',
  },
  3: {
    sky: 'parallax_3_sky',
    far: 'parallax_3_far',
    mid: 'parallax_3_mid',
    near: 'parallax_3_near',
    front: 'parallax_3_front',
  },
  4: {
    sky: 'parallax_4_sky',
    far: 'parallax_4_far',
    mid: 'parallax_4_mid',
    near: 'parallax_4_near',
    front: 'parallax_4_front',
  },
  5: {
    sky: 'parallax_5_sky',
    far: 'parallax_5_far',
    mid: 'parallax_5_mid',
    near: 'parallax_5_near',
    front: 'parallax_5_front',
  },
  6: {
    sky: 'parallax_6_sky',
    far: 'parallax_6_far',
    mid: 'parallax_6_mid',
    near: 'parallax_6_near',
    front: 'parallax_6_front',
  },
  7: {
    sky: 'parallax_7_sky',
    far: 'parallax_7_far',
    mid: 'parallax_7_mid',
    near: 'parallax_7_near',
    front: 'parallax_7_front',
  },
  8: {
    sky: 'parallax_8_sky',
    far: 'parallax_8_far',
    mid: 'parallax_8_mid',
    near: 'parallax_8_near',
    front: 'parallax_8_front',
  },
};

// Floor tiles
export const FLOOR_KEYS = {
  brick: 'floor_tile_brick',
  blue: 'floor_tile_blue',
  edge: 'floor_tile_edge',
};

// Barrier sprites
export const BARRIER_SPRITE_KEYS = {
  metal: 'barrier_metal',
  metal2: 'barrier_metal_2',
  metal3: 'barrier_metal_3',
  metal4: 'barrier_metal_4',
};

// Environment objects
export const ENV_KEYS = {
  barrel: 'env_barrel',
  box: 'env_box',
};
