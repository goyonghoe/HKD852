// Background
export const BG_COLOR = 0x0a0a1a;
export const BG_CSS = '#0a0a1a';

// Neon palette
export const NEON = {
  PLAYER: 0x00ffcc,      // cyan-green
  ENEMY_BASIC: 0xff4444, // red
  ENEMY_FAST: 0xff8800,  // orange
  ENEMY_TANK: 0x9944ff,  // purple
  ENEMY_SPECIAL: 0xff44aa, // pink
  ENEMY_ELITE: 0xffcc00, // gold
  PROJECTILE: 0xffffff,  // white
  XP_ORB: 0x44ff44,      // green
  HEALTH: 0xff2244,      // health red
  XP_BAR: 0x44ccff,      // xp blue
  GOLD: 0xffdd00,        // gold
  UI_TEXT: 0xffffff,
  UI_DIM: 0x888899,
  UI_PANEL: 0x1a1a2e,
  UI_BORDER: 0x333355,
  UI_ACCENT: 0x00ffcc,
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
  radius: 8,
  textColor: NEON.UI_TEXT,
  textHighlight: NEON.UI_ACCENT,
} as const;
