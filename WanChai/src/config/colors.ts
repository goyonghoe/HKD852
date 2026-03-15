// Background
export const BG_COLOR = 0x0a0a1a;
export const BG_CSS = '#0a0a1a';

// Neon palette
export const NEON = {
  PLAYER: 0x00ffcc, // cyan-green
  ENEMY_BASIC: 0xff4444, // red
  ENEMY_FAST: 0xff8800, // orange
  ENEMY_TANK: 0x9944ff, // purple
  ENEMY_SPECIAL: 0xff44aa, // pink
  ENEMY_ELITE: 0xffcc00, // gold
  PROJECTILE: 0xffffff, // white
  XP_ORB: 0x44ff44, // green
  HEALTH: 0xff2244, // health red
  XP_BAR: 0x44ccff, // xp blue
  GOLD: 0xffdd00, // gold
  UI_TEXT: 0xffffff,
  UI_DIM: 0x888899,
  UI_PANEL: 0x1a1a2e,
  UI_BORDER: 0x333355,
  UI_ACCENT: 0x00ffcc,
  BOSS_WARNING: 0xff3300,
  BG_BLACK: 0x000000,
  DESTROYED_TINT: 0x444444,
  BOSS_PHASE2_TINT: 0xff4466, // reddish glow for Phase 2 boss
  BOSS_PHASE2_FLASH: 0xff2200, // screen flash on phase transition
  BOSS_GLOW: 0xff4444, // boss PostFX glow
  BOSS_PHASE2_GLOW: 0xff0000, // boss phase 2 PostFX glow (stronger)
  ELITE_GLOW: 0xffaa00, // elite enemy PostFX glow
  STATUS_FREEZE: 0x4488ff, // freeze status tint
  STATUS_POISON: 0x44ff44, // poison status tint
  STATUS_BURN: 0xff6600, // burn status tint
} as const;

// CSS versions for Text objects
export const NEON_CSS: Record<keyof typeof NEON, string> = {
  PLAYER: '#00ffcc',
  ENEMY_BASIC: '#ff4444',
  ENEMY_FAST: '#ff8800',
  ENEMY_TANK: '#9944ff',
  ENEMY_SPECIAL: '#ff44aa',
  ENEMY_ELITE: '#ffcc00',
  PROJECTILE: '#ffffff',
  XP_ORB: '#44ff44',
  HEALTH: '#ff2244',
  XP_BAR: '#44ccff',
  GOLD: '#ffdd00',
  UI_TEXT: '#ffffff',
  UI_DIM: '#888899',
  UI_PANEL: '#1a1a2e',
  UI_BORDER: '#333355',
  UI_ACCENT: '#00ffcc',
  BOSS_WARNING: '#ff3300',
  BG_BLACK: '#000000',
  DESTROYED_TINT: '#444444',
  BOSS_PHASE2_TINT: '#ff4466',
  BOSS_PHASE2_FLASH: '#ff2200',
  BOSS_GLOW: '#ff4444',
  BOSS_PHASE2_GLOW: '#ff0000',
  ELITE_GLOW: '#ffaa00',
  STATUS_FREEZE: '#4488ff',
  STATUS_POISON: '#44ff44',
  STATUS_BURN: '#ff6600',
};

// Keep these for UI components that reference them
export const UI_COLORS = {
  panel: NEON.UI_PANEL,
  border: NEON.UI_BORDER,
  text: NEON.UI_TEXT,
  accent: NEON.UI_ACCENT,
  success: 0x44ff44,
  warning: 0xffcc00,
  danger: 0xff4444,
} as const;

// Element colors (purification / character themes)
export const ELEMENT = {
  WIND: 0x00ffcc, // cyan-green (same as NEON.PLAYER)
  WATER: 0x4488ff, // blue
  FIRE: 0xff6600, // orange
  LIGHT: 0xffdd00, // gold
  EARTH: 0x44cc44, // green
  DARK: 0x9944ff, // purple
} as const;

export const ELEMENT_CSS: Record<keyof typeof ELEMENT, string> = {
  WIND: '#00ffcc',
  WATER: '#4488ff',
  FIRE: '#ff6600',
  LIGHT: '#ffdd00',
  EARTH: '#44cc44',
  DARK: '#9944ff',
};

// Weather effect colors
export const WEATHER_COLORS = {
  FOG_DARK: 0x0a0a1a,
  FOG_ALPHA: 0.7,
  FLAME_FILL: 0xff4400,
  FLAME_FILL_ALPHA: 0.3,
  FLAME_STROKE: 0xff6600,
  FLAME_STROKE_ALPHA: 0.5,
  RAIN_DROP: 0x4488ff,
  RAIN_DROP_ALPHA: 0.6,
  SHIELD_REGEN_FILL: 0x00ffcc,
  SHIELD_REGEN_FILL_ALPHA: 0.15,
  SHIELD_REGEN_STROKE: 0x00ffcc,
  SHIELD_REGEN_STROKE_ALPHA: 0.4,
  LIGHTNING_FIELD_BOLT: 0xffdd00,
  LIGHTNING_FIELD_FLASH: 0xffffff,
  LIGHTNING_FIELD_FLASH_ALPHA: 0.3,
  VOID_GRAVITY_FILL: 0x9944ff,
  VOID_GRAVITY_FILL_ALPHA: 0.08,
  VOID_GRAVITY_STROKE: 0x9944ff,
  VOID_GRAVITY_STROKE_ALPHA: 0.3,
} as const;

// Ground visual colors (P4)
export const GROUND_COLORS = {
  FILL: 0x1a1a2e, // dark cyberpunk tone (matches UI_PANEL)
  TOP_HIGHLIGHT: 0x333355, // subtle highlight at top edge (matches UI_BORDER)
  DAMAGE_MARK: 0x111122, // darker damage lines
} as const;

// Barricade visual colors (P2)
export const BARRICADE_COLORS = {
  WALL_FILL: 0x2a2a3e, // slightly lighter than ground
  WALL_TOP: 0x444466, // top edge highlight
  DAMAGE_LINE: 0x1a1a2e, // damage marks
  GLOW: 0x5577aa, // glow highlight for visibility
  DAMAGE_FLASH_TINT: 0xff4444, // red tint on damage hit
  DESTROYED_TINT: 0x990000, // dark red tint when destroyed
} as const;

// HUD element colors
export const HUD_COLORS = {
  WEATHER_BG: 0x1a1a2e,
  WEATHER_BG_ALPHA: 0.7,
  CRITTER_CD_BG: 0x1a1a2e,
  CRITTER_CD_BG_ALPHA: 0.7,
  CRITTER_CD_FILL_ALPHA: 0.8,
  DISTRICT_LABEL_ALPHA: 0.9,
} as const;

export const RETRO = {
  panelBg: NEON.UI_PANEL,
  panelBgDark: 0x0f0f1a,
  panelBorder: NEON.UI_BORDER,
  panelShadow: 0x000011,
  textPrimary: NEON.UI_TEXT,
  textDim: NEON.UI_DIM,
  // Legacy fields kept for existing UI components (ButtonFactory, GlassPanel, PauseOverlay)
  borderColor: NEON.UI_BORDER,
  borderWidth: 2,
  shadowColor: 0x000011,
  bevelLight: 0x444466,
  bevelDark: 0x0a0a1a,
  radius: 12,
  textColor: NEON.UI_TEXT,
  textHighlight: NEON.UI_ACCENT,
} as const;

// Toggle / settings UI colors
export const TOGGLE_COLORS = {
  ON_BG: 0x1a3328,
  OFF_BG: 0x3a1520,
  ON_BORDER: 0x48bb78,
  OFF_BORDER: 0xe94560,
  ON_FILL: 0x48bb78,
  OFF_FILL: 0x2d3748,
  ON_FILL_LIGHT: 0x68dba0,
  OFF_FILL_LIGHT: 0x4a5568,
} as const;

export const TOGGLE_CSS = {
  ON: '#48bb78',
  OFF: '#e94560',
} as const;

// CSS versions for text styling (non-NEON palette)
export const UI_CSS = {
  HEADING: '#e2e8f0',
  LABEL: '#a0aec0',
  SUBLABEL: '#718096',
  TEXT_BLACK: '#000000',
  TEXT_WHITE: '#ffffff',
  STROKE_BLACK: '#000000',
} as const;

// Stage Clear glow colors (TASK-217)
export const STAGE_CLEAR_COLORS = {
  OUTER_GLOW: 0x00ffcc, // cyan-green (matches NEON.UI_ACCENT)
  MID_RING: 0x44ffdd, // lighter cyan
  INNER_CORE: 0xffffff, // white hot center
} as const;

// Boss Aero wind VFX colors (TASK-048)
export const BOSS_AERO_COLORS = {
  WIND_PARTICLE: 0x9944ff, // purple wind
  WIND_PARTICLE_P3: 0xffdd00, // gold wind (Phase 3)
  EAGLE_SILHOUETTE: 0xffdd00, // golden eagle
  DIVE_WARNING: 0xff8800, // orange warning flash
} as const;

// Boss Freedom VFX colors (TASK-126)
export const BOSS_FREEDOM_COLORS = {
  DEBRIS_DARK: 0x333344,
  DEBRIS_LIGHT: 0x555566,
  GLOW_CORE: 0xffffff,
  GLOW_RING: 0xffeecc,
} as const;

// Codex card colors
export const CODEX = {
  GLASS_BG: 0x161630,
  GLASS_BG_ALPHA: 0.85,
  GLASS_BORDER_ALPHA: 0.6,
  GLOW_T1: 0xff4444, // ENEMY_BASIC red
  GLOW_T2: 0x9944ff, // ENEMY_TANK purple
  GLOW_BOSS: 0xffdd00, // GOLD
  TAB_ACTIVE: 0x00ffcc, // UI_ACCENT
  TAB_INACTIVE: 0x333355, // UI_BORDER
  DETAIL_BG: 0x0f0f22,
  DETAIL_BG_ALPHA: 0.95,
  BADGE_GROUND: 0x44aa66,
  BADGE_AIR: 0x4488ff,
  BADGE_BOSS: 0xffdd00,
  GLITCH_LINE: 0x00ffcc,
} as const;

// Procedural texture palette (TextureFactory fallback colors)
export const TEX = {
  // Player
  PLAYER_HULL_DARK: 0x005544,
  PLAYER_HULL_MID: 0x008866,
  // Player gun barrel
  GUN_BODY: 0x334455,
  GUN_HIGHLIGHT: 0x667788,
  GUN_MUZZLE: 0x88aacc,
  // Ally sniper
  ALLY_SNIPER_GLOW: 0x4488ff,
  ALLY_SNIPER_BARREL: 0x224488,
  ALLY_SNIPER_BODY: 0x4488ff,
  ALLY_SNIPER_CORE: 0x88ccff,
  // Ally spread
  ALLY_SPREAD_GLOW: 0xff8844,
  ALLY_SPREAD_BARREL: 0x884422,
  ALLY_SPREAD_BODY: 0xff8844,
  ALLY_SPREAD_CORE: 0xffcc88,
  // Enemy basic (circle)
  ENEMY_CIRCLE_SHELL: 0x881111,
  ENEMY_CIRCLE_EYE: 0x220000,
  ENEMY_CIRCLE_IRIS: 0xff8888,
  // Enemy fast (triangle)
  ENEMY_FAST_SHELL: 0x663300,
  ENEMY_FAST_SPEED_LINE: 0xffcc66,
  // Enemy tank (rect)
  ENEMY_TANK_ARMOR: 0x331166,
  ENEMY_TANK_CORE: 0xcc88ff,
  // Enemy special (diamond)
  ENEMY_SPECIAL_SHELL: 0x661144,
  ENEMY_SPECIAL_CORE: 0xff88cc,
  // Enemy elite (hexagon) / teleporter
  ENEMY_ELITE_SHELL: 0x665500,
  ENEMY_ELITE_OUTLINE: 0xffee88,
  // Enemy shooter
  ENEMY_SHOOTER_SHELL: 0x661122,
  ENEMY_SHOOTER_BODY: 0xcc2244,
  ENEMY_SHOOTER_CROSS: 0xff6688,
  ENEMY_SHOOTER_OUTLINE: 0xff4466,
  // Boss diamond
  BOSS_DIAMOND_EYE_BG: 0x220022,
  // Boss rect
  BOSS_RECT_ARMOR: 0x221144,
  // Projectile missile
  MISSILE_BODY: 0xcccccc,
  MISSILE_FINS: 0x888888,
  // Napalm / bomb VFX
  NAPALM_FILL: 0xff4400,
  NAPALM_STROKE: 0xff6600,
  NAPALM_INNER: 0xff8800,
  NAPALM_CORE: 0xffcc00,
  // Codex
  CODEX_SILHOUETTE: 0x111111,
  // Character select
  CHAR_SELECT_BG: 0x1a2a3e,
  // Menu hover
  MENU_HOVER_BG: 0x252547,
  // Bevel
  BEVEL_ACCENT: 0xf87058,
} as const;
