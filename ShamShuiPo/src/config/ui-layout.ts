// ── Neon Survivors: UI Layout Constants ──
// Pure TypeScript — NO Phaser imports. All pixel values target 720x1280 (9:16 portrait).
// Mobile-first: minimum touch target 44px, large readable text at phone scale.

// ════════════════════════════════════════════════════════════════
// § GAME CANVAS
// ════════════════════════════════════════════════════════════════

export const GAME_W = 720;
export const GAME_H = 1280;

// ════════════════════════════════════════════════════════════════
// § HP BAR
// ════════════════════════════════════════════════════════════════

export const HP_BAR = {
  x: 12,
  y: 16,
  width: 696, // GAME_W - 24 (12px margin each side)
  height: 14,
  borderRadius: 7,
  borderWidth: 2,

  // Colors (numeric for Phaser graphics)
  bgColor: 0x1a1a2e,
  borderColor: 0x333355,
  fillColorHigh: 0x39ff14, // > 50% HP
  fillColorMid: 0xffd700, // 25–50% HP
  fillColorLow: 0xff2d2d, // < 25% HP

  // HP text label (right-aligned inside bar)
  label: {
    x: 704, // right edge - 4px padding
    y: 23, // vertically centered on bar
    fontSize: 11,
    align: "right" as const,
  },

  // Low HP warning pulse
  lowHpThreshold: 0.25,
  lowHpPulseAlpha: { min: 0.4, max: 1.0 },
  lowHpPulseDuration: 400, // ms per pulse cycle
} as const;

// ════════════════════════════════════════════════════════════════
// § XP BAR
// ════════════════════════════════════════════════════════════════

export const XP_BAR = {
  x: 12,
  y: 36, // below HP bar
  width: 696,
  height: 8,
  borderRadius: 4,

  bgColor: 0x1a1a2e,
  fillColor: 0x00f5ff, // bright cyan
  borderColor: 0x222244,

  // Level number (left side, above XP bar)
  levelLabel: {
    x: 16,
    y: 32, // just above XP bar
    fontSize: 13,
    prefix: "Lv.",
  },
} as const;

// ════════════════════════════════════════════════════════════════
// § TIMER / WAVE INDICATOR
// ════════════════════════════════════════════════════════════════

export const TIMER = {
  x: 704, // right-aligned
  y: 56, // below bars
  fontSize: 18,
  align: "right" as const,
  format: "M:SS" as const, // "4:32"

  // Wave/minute sub-label
  waveLabel: {
    x: 704,
    y: 76,
    fontSize: 12,
    align: "right" as const,
    prefix: "Wave ",
  },
} as const;

// ════════════════════════════════════════════════════════════════
// § WEAPON SLOTS (horizontal strip, top-left)
// ════════════════════════════════════════════════════════════════

export const WEAPON_SLOTS = {
  startX: 16,
  y: 56,
  maxSlots: 6,
  iconSize: 36, // 36x36 icon
  spacing: 6, // gap between slots
  borderRadius: 6,

  // Slot background
  bgColorActive: 0x1a1a2e,
  bgColorEmpty: 0x0d0d1a,
  borderColorActive: 0x00f5ff, // cyan border for acquired weapons
  borderColorEmpty: 0x222233,
  borderWidth: 2,

  // Level indicator (small pip below icon)
  levelPip: {
    size: 5,
    spacing: 2,
    yOffset: 40, // below the icon
    colorFilled: 0x00f5ff,
    colorEmpty: 0x333355,
    maxLevel: 5,
  },

  // Slot dimensions (computed convenience)
  slotWidth: 40, // iconSize + 4px padding
  slotHeight: 40,
  totalWidth: 276, // (40 + 6) * 6 - 6
} as const;

// ════════════════════════════════════════════════════════════════
// § KILL COUNTER
// ════════════════════════════════════════════════════════════════

export const KILL_COUNTER = {
  x: 704,
  y: 98,
  fontSize: 14,
  align: "right" as const,
  iconSize: 16, // skull icon
  iconGap: 4, // gap between icon and number
} as const;

// ════════════════════════════════════════════════════════════════
// § VIRTUAL JOYSTICK
// ════════════════════════════════════════════════════════════════

export const JOYSTICK = {
  // Default center (matches balance.ts INPUT config)
  defaultX: 180,
  defaultY: 1050,

  // Outer ring
  outerRadius: 60,
  outerColor: 0xffffff,
  outerAlpha: 0.12,
  outerBorderColor: 0x00f5ff,
  outerBorderAlpha: 0.25,
  outerBorderWidth: 2,

  // Inner knob
  innerRadius: 22,
  innerColor: 0xffffff,
  innerAlpha: 0.35,

  // Floating mode: joystick appears at touch position
  floating: true,

  // Touch zone (bottom half of screen, left side)
  touchZone: {
    x: 0,
    y: 640, // bottom half
    width: 480, // left ~67% of screen
    height: 640,
  },

  // Deadzone (minimum drag to register movement)
  deadzone: 8,
} as const;

// ════════════════════════════════════════════════════════════════
// § LEVEL-UP MODAL (center overlay)
// ════════════════════════════════════════════════════════════════

export const LEVEL_UP_MODAL = {
  // Full-screen dim
  dimColor: 0x000000,
  dimAlpha: 0.7,

  // Title ("LEVEL UP!")
  title: {
    x: 360, // center
    y: 200,
    fontSize: 32,
    text: "LEVEL UP!",
  },

  // Upgrade cards (3 cards stacked vertically)
  card: {
    x: 360, // center-aligned
    width: 620,
    height: 140,
    spacing: 16, // gap between cards
    borderRadius: 12,
    borderWidth: 2,

    // Card Y positions (top of each card)
    startY: 260,
    // card[0].y = 260, card[1].y = 416, card[2].y = 572

    // Background
    bgColor: 0x1a1a2e,
    borderColor: 0x333366,
    borderColorHover: 0x00f5ff, // cyan glow on touch
    bgColorHover: 0x222244,

    // Icon (left side of card)
    icon: {
      x: 80, // from card left edge
      y: 70, // vertically centered in card
      size: 56,
      bgColor: 0x0d0d1a,
      bgRadius: 10,
    },

    // Name (right of icon)
    name: {
      x: 130,
      y: 30,
      fontSize: 20,
      maxWidth: 380,
    },

    // Description (below name)
    description: {
      x: 130,
      y: 58,
      fontSize: 14,
      maxWidth: 440,
      lineHeight: 1.3,
    },

    // Level indicator (right side of card)
    level: {
      x: 580,
      y: 30,
      fontSize: 13,
      prefix: "Lv.",
    },

    // "NEW" badge (for new weapon acquisitions)
    newBadge: {
      x: 580,
      y: 100,
      width: 48,
      height: 22,
      fontSize: 12,
      bgColor: 0xff2d7b, // neon pink
      textColor: 0xffffff,
      borderRadius: 4,
    },

    // Evolution glow (special border for evolution upgrades)
    evolutionBorderColor: 0xb026ff, // neon purple
    evolutionGlowAlpha: 0.6,
  },

  // Reroll button (bottom)
  reroll: {
    x: 360,
    y: 760,
    width: 160,
    height: 48,
    fontSize: 16,
    borderRadius: 8,
    bgColor: 0x222244,
    borderColor: 0xffd700,
    text: "Reroll",
    iconSize: 18, // diamond icon
  },
} as const;

// ════════════════════════════════════════════════════════════════
// § DAMAGE NUMBERS (floating text)
// ════════════════════════════════════════════════════════════════

export const DAMAGE_NUMBERS = {
  // Normal hit
  normal: {
    fontSize: 16,
    color: "#ffffff",
    strokeColor: "#000000",
    strokeWidth: 3,
  },

  // Critical hit
  crit: {
    fontSize: 24,
    color: "#ffd700", // gold/yellow
    strokeColor: "#000000",
    strokeWidth: 4,
    scale: 1.5, // initial pop scale
  },

  // Heal
  heal: {
    fontSize: 16,
    color: "#39ff14", // neon green
    strokeColor: "#000000",
    strokeWidth: 3,
    prefix: "+",
  },

  // Animation
  floatDistance: 40, // px upward
  duration: 600, // ms
  fadeStartAt: 0.6, // start fading at 60% of duration
  randomXSpread: 20, // ±px horizontal offset for variety
} as const;

// ════════════════════════════════════════════════════════════════
// § BOSS WARNING (center screen)
// ════════════════════════════════════════════════════════════════

export const BOSS_WARNING = {
  x: 360,
  y: 500,
  fontSize: 40,
  text: "WARNING",

  // Sub-text (boss name)
  subText: {
    x: 360,
    y: 560,
    fontSize: 22,
  },

  // Stripe overlays (horizontal danger stripes)
  stripes: {
    count: 2,
    height: 48,
    yPositions: [440, 600],
    color: 0xff2d2d,
    alpha: 0.3,
  },

  // Timings
  fadeInDuration: 300, // ms
  holdDuration: 1500, // ms
  fadeOutDuration: 500, // ms
  totalDuration: 2300, // fadeIn + hold + fadeOut
  pulseCount: 3, // text pulses during hold
} as const;

// ════════════════════════════════════════════════════════════════
// § PICKUP TEXT (floating +1, +3, etc.)
// ════════════════════════════════════════════════════════════════

export const PICKUP_TEXT = {
  // XP pickup
  xp: {
    fontSize: 14,
    color: "#00f5ff", // cyan
    strokeColor: "#000000",
    strokeWidth: 2,
    prefix: "+",
    suffix: " XP",
  },

  // Coin pickup
  coin: {
    fontSize: 14,
    color: "#ffd700", // gold
    strokeColor: "#000000",
    strokeWidth: 2,
    prefix: "+",
    suffix: "",
  },

  // Animation (same as damage numbers but faster)
  floatDistance: 30,
  duration: 500,
  offsetY: -20, // initial offset above the pickup
} as const;

// ════════════════════════════════════════════════════════════════
// § PAUSE BUTTON
// ════════════════════════════════════════════════════════════════

export const PAUSE_BUTTON = {
  x: 680, // top-right corner
  y: 58,
  size: 36, // visible icon size
  touchPadding: 12, // extra touch area beyond visible icon
  touchSize: 60, // total touch target (36 + 24)
  iconColor: 0xffffff,
  iconAlpha: 0.6,
  iconAlphaHover: 1.0,
} as const;

// ════════════════════════════════════════════════════════════════
// § GAME OVER / VICTORY SCREEN
// ════════════════════════════════════════════════════════════════

export const GAME_OVER = {
  // Full-screen dim
  dimColor: 0x000000,
  dimAlpha: 0.85,

  // Title
  title: {
    x: 360,
    y: 180,
    fontSizeVictory: 40,
    fontSizeDefeat: 36,
    victoryText: "VICTORY",
    defeatText: "DEFEATED",
  },

  // Stats summary panel
  stats: {
    x: 360,
    y: 300,
    width: 560,
    panelBgColor: 0x1a1a2e,
    panelBorderColor: 0x333366,
    panelBorderRadius: 12,
    panelPadding: 20,

    // Stat rows
    row: {
      height: 36,
      labelX: 120, // left-aligned label
      valueX: 520, // right-aligned value
      fontSize: 16,
      labelColor: "#aaaaaa",
      valueColor: "#ffffff",
    },

    // Stats to display (ordered)
    items: [
      "Time Survived",
      "Enemies Killed",
      "Damage Dealt",
      "Coins Earned",
      "Level Reached",
      "Weapons Used",
    ] as readonly string[],
  },

  // Coins earned (large, highlighted)
  coinSummary: {
    x: 360,
    y: 580,
    fontSize: 28,
    iconSize: 28,
  },

  // Buttons
  buttons: {
    width: 280,
    height: 56,
    borderRadius: 12,
    fontSize: 20,
    spacing: 16,

    // Continue (main action)
    continueBtn: {
      x: 360,
      y: 680,
      bgColor: 0x00f5ff,
      textColor: 0x0a0a0a,
      text: "CONTINUE",
    },

    // Watch Ad for Rewards
    adRewardBtn: {
      x: 360,
      y: 752,
      bgColor: 0xffd700,
      textColor: 0x0a0a0a,
      text: "2x COINS",
      subText: "Watch Ad",
      subFontSize: 12,
    },

    // Exit to Menu
    exitBtn: {
      x: 360,
      y: 824,
      bgColor: 0x333355,
      textColor: 0xffffff,
      text: "EXIT",
    },
  },

  // Revive prompt (shown before game over finalizes, once per run)
  revive: {
    x: 360,
    y: 640,
    width: 320,
    height: 60,
    bgColor: 0xff2d7b,
    textColor: 0xffffff,
    text: "REVIVE",
    subText: "Watch Ad",
    subFontSize: 12,
    borderRadius: 12,
    countdownDuration: 5000, // ms — auto-decline after 5s
  },
} as const;

// ════════════════════════════════════════════════════════════════
// § COIN HUD (persistent during run)
// ════════════════════════════════════════════════════════════════

export const COIN_HUD = {
  x: 704,
  y: 118,
  fontSize: 14,
  align: "right" as const,
  iconSize: 16,
  iconGap: 4,
} as const;

// ════════════════════════════════════════════════════════════════
// § SAFE AREAS & SPACING
// ════════════════════════════════════════════════════════════════

export const SAFE_AREA = {
  /** Top inset for notch/status bar (adjust per device) */
  top: 0,
  /** Bottom inset for home indicator */
  bottom: 0,
  /** Side margins */
  horizontal: 12,
} as const;

// ════════════════════════════════════════════════════════════════
// § Z-DEPTH ORDERING
// ════════════════════════════════════════════════════════════════

export const UI_DEPTH = {
  background: 0,
  gameObjects: 10,
  pickupText: 50,
  damageNumbers: 60,
  hud: 100,
  bossWarning: 150,
  levelUpModal: 200,
  pauseOverlay: 250,
  gameOverScreen: 300,
} as const;
