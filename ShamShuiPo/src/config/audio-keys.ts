// ── Neon Survivors: Audio Keys & Manifest ──
// Pure TypeScript — no Phaser imports.

/** BGM track definition */
export interface BgmTrack {
  key: string;
  path: string;
  loop: boolean;
  /** Usage context for this track */
  context: "menu" | "battle" | "boss" | "ambient" | "victory";
}

/** SFX definition */
export interface SfxDef {
  key: string;
  path: string;
  /** Usage context for this sound effect */
  context:
    | "weapon"
    | "enemy"
    | "player"
    | "ui"
    | "pickup"
    | "boss"
    | "feedback";
}

// ── BGM Tracks ──

export const BGM_TRACKS: readonly BgmTrack[] = [
  // Menu / Lobby
  {
    key: "bgm_menu",
    path: "assets/audio/bgm/menu_theme.mp3",
    loop: true,
    context: "menu",
  },
  {
    key: "bgm_game_menu",
    path: "assets/audio/bgm/game_menu.mp3",
    loop: true,
    context: "menu",
  },

  // Battle (main run BGMs — rotate or intensity-layer)
  {
    key: "bgm_battle_main",
    path: "assets/audio/bgm/battle_main.mp3",
    loop: true,
    context: "battle",
  },
  {
    key: "bgm_battle_intense",
    path: "assets/audio/bgm/battle_intense.mp3",
    loop: true,
    context: "battle",
  },
  {
    key: "bgm_battle_alt",
    path: "assets/audio/bgm/battle_alt.mp3",
    loop: true,
    context: "battle",
  },
  {
    key: "bgm_battle_snow",
    path: "assets/audio/bgm/battle_snow.mp3",
    loop: true,
    context: "battle",
  },

  // Boss
  {
    key: "bgm_boss",
    path: "assets/audio/bgm/boss_theme.mp3",
    loop: true,
    context: "boss",
  },

  // Ambient
  {
    key: "bgm_ambient",
    path: "assets/audio/bgm/ambient_dark.mp3",
    loop: true,
    context: "ambient",
  },
] as const;

// ── SFX ──

export const SFX: readonly SfxDef[] = [
  // ── Weapon SFX ──
  {
    key: "sfx_gun_shot",
    path: "assets/audio/sfx/gun_shot.wav",
    context: "weapon",
  },
  {
    key: "sfx_laser_shot",
    path: "assets/audio/sfx/laser_shot.wav",
    context: "weapon",
  },
  {
    key: "sfx_laser_beam",
    path: "assets/audio/sfx/laser_beam.wav",
    context: "weapon",
  },
  {
    key: "sfx_blaster",
    path: "assets/audio/sfx/blaster.wav",
    context: "weapon",
  },
  {
    key: "sfx_blaster_laser",
    path: "assets/audio/sfx/blaster_laser.wav",
    context: "weapon",
  },
  {
    key: "sfx_missile_shot",
    path: "assets/audio/sfx/missile_shot.wav",
    context: "weapon",
  },
  {
    key: "sfx_rocket_launch",
    path: "assets/audio/sfx/rocket_launch.wav",
    context: "weapon",
  },
  {
    key: "sfx_rocket_launch_2",
    path: "assets/audio/sfx/rocket_launch_2.wav",
    context: "weapon",
  },
  {
    key: "sfx_lightning",
    path: "assets/audio/sfx/lightning.wav",
    context: "weapon",
  },
  {
    key: "sfx_flamethrower",
    path: "assets/audio/sfx/flamethrower.wav",
    context: "weapon",
  },
  {
    key: "sfx_flame",
    path: "assets/audio/sfx/flame_1.wav",
    context: "weapon",
  },
  {
    key: "sfx_explosion",
    path: "assets/audio/sfx/explosion.wav",
    context: "weapon",
  },
  {
    key: "sfx_explosion_2",
    path: "assets/audio/sfx/explosion_2.wav",
    context: "weapon",
  },
  {
    key: "sfx_explosion_big",
    path: "assets/audio/sfx/explosion_big.wav",
    context: "weapon",
  },

  // ── Enemy SFX ──
  {
    key: "sfx_enemy_death_1",
    path: "assets/audio/sfx/enemy_death_1.wav",
    context: "enemy",
  },
  {
    key: "sfx_enemy_death_2",
    path: "assets/audio/sfx/enemy_death_2.wav",
    context: "enemy",
  },
  {
    key: "sfx_enemy_death_3",
    path: "assets/audio/sfx/enemy_death_3.wav",
    context: "enemy",
  },
  {
    key: "sfx_cube_death",
    path: "assets/audio/sfx/cube_death.wav",
    context: "enemy",
  },
  {
    key: "sfx_mech_claw",
    path: "assets/audio/sfx/mech_claw.wav",
    context: "enemy",
  },

  // ── Player SFX ──
  {
    key: "sfx_player_hurt",
    path: "assets/audio/sfx/player_hurt.wav",
    context: "player",
  },
  {
    key: "sfx_player_death",
    path: "assets/audio/sfx/player_death.wav",
    context: "player",
  },
  {
    key: "sfx_hit_punch",
    path: "assets/audio/sfx/hit_punch.wav",
    context: "player",
  },

  // ── Pickup SFX ──
  {
    key: "sfx_xp_pickup",
    path: "assets/audio/sfx/xp_pickup.wav",
    context: "pickup",
  },
  {
    key: "sfx_coin_pickup",
    path: "assets/audio/sfx/coin_pickup.wav",
    context: "pickup",
  },
  {
    key: "sfx_coin_pickup_2",
    path: "assets/audio/sfx/coin_pickup_2.wav",
    context: "pickup",
  },
  {
    key: "sfx_levelup",
    path: "assets/audio/sfx/levelup_coin.wav",
    context: "pickup",
  },
  {
    key: "sfx_chest_open",
    path: "assets/audio/sfx/chest_open.wav",
    context: "pickup",
  },

  // ── Boss SFX ──
  {
    key: "sfx_boss_warning",
    path: "assets/audio/sfx/boss_warning.wav",
    context: "boss",
  },
  {
    key: "sfx_boss_death",
    path: "assets/audio/sfx/boss_death.wav",
    context: "boss",
  },
  {
    key: "sfx_bomb_drop",
    path: "assets/audio/sfx/bomb_drop.wav",
    context: "boss",
  },

  // ── UI SFX ──
  {
    key: "sfx_ui_click",
    path: "assets/audio/sfx/ui_click.wav",
    context: "ui",
  },
  {
    key: "sfx_ui_click_2",
    path: "assets/audio/sfx/ui_click_2.wav",
    context: "ui",
  },
  {
    key: "sfx_notification",
    path: "assets/audio/sfx/notification.wav",
    context: "ui",
  },

  // ── Feedback SFX ──
  {
    key: "sfx_glass_break",
    path: "assets/audio/sfx/glass_break.wav",
    context: "feedback",
  },
  {
    key: "sfx_countdown",
    path: "assets/audio/sfx/countdown.wav",
    context: "feedback",
  },
  {
    key: "sfx_victory",
    path: "assets/audio/sfx/victory.wav",
    context: "feedback",
  },
] as const;

// ── Weapon → SFX Mapping ──

/** Maps weapon IDs to their primary fire SFX key */
export const WEAPON_SFX_MAP: Record<string, string> = {
  pistol: "sfx_gun_shot",
  shotgun: "sfx_blaster",
  laser: "sfx_laser_beam",
  missile: "sfx_rocket_launch",
  boomerang: "sfx_blaster_laser",
  lightning: "sfx_lightning",
  flamethrower: "sfx_flamethrower",
  orbital: "sfx_laser_shot",
};

/** Maps weapon IDs to their hit/impact SFX key */
export const WEAPON_HIT_SFX_MAP: Record<string, string> = {
  pistol: "sfx_hit_punch",
  shotgun: "sfx_hit_punch",
  laser: "sfx_cube_death",
  missile: "sfx_explosion",
  boomerang: "sfx_hit_punch",
  lightning: "sfx_explosion_2",
  flamethrower: "sfx_flame",
  orbital: "sfx_cube_death",
};

// ── BGM Intensity Layers ──

/**
 * Battle BGM selection by run phase.
 * The scene can crossfade between these as intensity changes.
 */
export const BGM_PHASE_MAP = {
  early: "bgm_battle_main", // minutes 0-4: standard tempo
  mid: "bgm_battle_intense", // minutes 5-7: higher intensity
  boss: "bgm_boss", // boss encounters
  finale: "bgm_battle_intense", // minutes 8-10: peak pressure
} as const;
