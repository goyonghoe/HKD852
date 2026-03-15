// ── Neon Survivors: Color Palette ──
// Pure TypeScript — NO Phaser imports.
// All numeric values are 0xRRGGBB for Phaser graphics / tint.
// All string values are "#RRGGBB" for Phaser text styles.

// ════════════════════════════════════════════════════════════════
// § NUMERIC COLORS (for Phaser graphics, tint, fills)
// ════════════════════════════════════════════════════════════════

export const COLORS = {
  // ── Background ──
  BG_DARK: 0x0a0a0a, // deepest black
  BG_PANEL: 0x1a1a2e, // dark navy panel
  BG_DEEP_PURPLE: 0x0d0d1a, // deep purple-black
  BG_OVERLAY: 0x000000, // overlay dimming

  // ── Neon accents ──
  NEON_CYAN: 0x00f5ff,
  NEON_PINK: 0xff2d7b,
  NEON_GREEN: 0x39ff14,
  NEON_YELLOW: 0xffd700,
  NEON_PURPLE: 0xb026ff,
  NEON_ORANGE: 0xff6b2b,

  // ── Health bar gradient ──
  HP_HIGH: 0x39ff14, // > 50% HP — neon green
  HP_MID: 0xffd700, // 25–50% HP — yellow
  HP_LOW: 0xff2d2d, // < 25% HP — red
  HP_BG: 0x333333,
  HP_BORDER: 0x333355,

  // ── XP bar ──
  XP_FILL: 0x00f5ff, // bright cyan
  XP_BG: 0x1a1a2e,
  XP_BORDER: 0x222244,

  // ── UI chrome ──
  UI_BORDER: 0x333366,
  UI_BORDER_ACTIVE: 0x00f5ff,
  UI_PANEL: 0x1a1a2e,
  UI_PANEL_HOVER: 0x222244,
  UI_SLOT_EMPTY: 0x0d0d1a,
  UI_SLOT_BORDER: 0x222233,
  UI_LEVEL_PIP: 0x00f5ff,
  UI_LEVEL_PIP_EMPTY: 0x333355,

  // ── Text ──
  TEXT_WHITE: 0xffffff,
  TEXT_GRAY: 0xaaaaaa,
  TEXT_DIM: 0x666688,

  // ── Economy ──
  COIN_GOLD: 0xffd700,
  DIAMOND_CYAN: 0x00f5ff,

  // ── Damage numbers ──
  DMG_NORMAL: 0xffffff, // white
  DMG_CRIT: 0xffd700, // gold
  DMG_HEAL: 0x39ff14, // neon green
  DMG_ENEMY: 0xff4444, // enemy takes damage (red tint flash)

  // ── Rarity ──
  RARITY_COMMON: 0xaaaaaa,
  RARITY_UNCOMMON: 0x39ff14,
  RARITY_RARE: 0x00f5ff,
  RARITY_EPIC: 0xb026ff,
  RARITY_LEGENDARY: 0xffd700,

  // ── Boss warning ──
  BOSS_DANGER: 0xff2d2d,
  BOSS_STRIPE: 0xff2d2d,

  // ── Joystick ──
  JOYSTICK_OUTER: 0xffffff,
  JOYSTICK_INNER: 0xffffff,
  JOYSTICK_BORDER: 0x00f5ff,

  // ── Buttons ──
  BTN_PRIMARY: 0x00f5ff,
  BTN_SECONDARY: 0x333355,
  BTN_DANGER: 0xff2d7b,
  BTN_REWARD: 0xffd700,
  BTN_TEXT_DARK: 0x0a0a0a,
  BTN_TEXT_LIGHT: 0xffffff,

  // ── Evolution / Special ──
  EVOLUTION_GLOW: 0xb026ff,
  NEW_BADGE: 0xff2d7b,

  // ── Lane (legacy, kept for compatibility) ──
  LANE_BG: 0x16213e,
  LANE_BORDER: 0x0f3460,
  LANE_HIGHLIGHT: 0x1a4080,

  // ── Legacy aliases ──
  HP_GREEN: 0x39ff14,
  HP_RED: 0xff2d2d,
  DMG_HERO: 0xff4444,
} as const;

// ════════════════════════════════════════════════════════════════
// § STRING COLORS (for Phaser text styles — "#RRGGBB")
// ════════════════════════════════════════════════════════════════

export const COLOR_STR = {
  // ── Neon accents ──
  NEON_CYAN: "#00f5ff",
  NEON_PINK: "#ff2d7b",
  NEON_GREEN: "#39ff14",
  NEON_YELLOW: "#ffd700",
  NEON_PURPLE: "#b026ff",
  NEON_ORANGE: "#ff6b2b",

  // ── Text ──
  TEXT_WHITE: "#ffffff",
  TEXT_GRAY: "#aaaaaa",
  TEXT_DIM: "#666688",

  // ── Economy ──
  COIN_GOLD: "#ffd700",
  DIAMOND_CYAN: "#00f5ff",

  // ── Damage numbers ──
  DMG_NORMAL: "#ffffff",
  DMG_CRIT: "#ffd700",
  DMG_HEAL: "#39ff14",

  // ── Health bar ──
  HP_HIGH: "#39ff14",
  HP_MID: "#ffd700",
  HP_LOW: "#ff2d2d",

  // ── XP ──
  XP_FILL: "#00f5ff",

  // ── Boss ──
  BOSS_DANGER: "#ff2d2d",

  // ── Rarity ──
  RARITY_COMMON: "#aaaaaa",
  RARITY_UNCOMMON: "#39ff14",
  RARITY_RARE: "#00f5ff",
  RARITY_EPIC: "#b026ff",
  RARITY_LEGENDARY: "#ffd700",

  // ── Pickup text ──
  PICKUP_XP: "#00f5ff",
  PICKUP_COIN: "#ffd700",

  // ── Stroke ──
  STROKE_DARK: "#000000",
} as const;
