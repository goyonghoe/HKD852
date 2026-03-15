/**
 * Pure weather calculation logic extracted from WeatherManager.
 * NO Phaser imports (M-001). All balance numbers from config (M-002).
 */

/** A point with x, y coordinates. */
export interface Point {
  x: number;
  y: number;
}

/** A rectangle defined by x, y, width, height. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Weather modifier multipliers returned by getWeatherModifiers. */
export interface WeatherModifiers {
  speedMult: number;
  armorMult: number;
  critBonus: number;
  enemySpeedMult: number;
  baseRegenPerSec: number;
}

/** Minimal RNG interface (matches SeededRandom.next()). */
export interface RNG {
  next(): number;
}

/** Config shape for getWeatherModifiers — matches BALANCE.WEATHER subset. */
export interface WeatherConfig {
  speedAllBonus: number;
  rainEnemySpeedMult: number;
  armorAllBonus: number;
  critAllBonus: number;
  shieldRegenHpPerSec: number;
}

/**
 * Calculate flame zone spawn position.
 * The zone is clamped so the circle (of given radius) stays fully within the game area horizontally,
 * and Y is offset within [spawnYMin, spawnYMin + spawnYRange].
 */
export function calculateFlameZonePosition(
  gameWidth: number,
  gameHeight: number,
  radius: number,
  spawnYMin: number,
  spawnYRange: number,
  rng: RNG,
): Point {
  const x = radius + rng.next() * (gameWidth - radius * 2);
  const y = spawnYMin + rng.next() * spawnYRange;
  return { x, y };
}

/**
 * Calculate a zigzag lightning bolt path from (startX, 0) down to (endX, endY).
 * Returns an array of points including the start point and final target.
 *
 * @param startX - X position of bolt start (top of screen), with initial jitter applied
 * @param endX - X position of the strike target
 * @param endY - Y position of the strike target
 * @param segments - Number of zigzag segments (intermediate points = segments - 1)
 * @param segmentJitter - Max random horizontal offset per segment
 * @param rng - Deterministic random source
 * @returns Array of points from bolt start to strike target
 */
export function calculateLightningPath(
  startX: number,
  endX: number,
  endY: number,
  segments: number,
  segmentJitter: number,
  rng: RNG,
): Point[] {
  const path: Point[] = [];

  // Start point at top of screen
  path.push({ x: startX, y: 0 });

  // Intermediate segments
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const px = endX + (rng.next() - 0.5) * segmentJitter;
    const py = endY * t;
    path.push({ x: px, y: py });
  }

  // End point at strike target
  path.push({ x: endX, y: endY });

  return path;
}

/**
 * Calculate 4 rectangles that cover the area outside a vision circle around the player.
 * This creates a "fog of war" effect by blacking out everything except a square
 * region of size 2*fogRadius centered on the player.
 *
 * Layout:
 *   [top strip: full width, from 0 to playerY - fogR]
 *   [bottom strip: full width, from playerY + fogR to bottom]
 *   [left strip: 0 to playerX - fogR, height = 2*fogR]
 *   [right strip: playerX + fogR to right edge, height = 2*fogR]
 */
export function calculateFogMaskRects(
  playerX: number,
  playerY: number,
  fogRadius: number,
  gameW: number,
  gameH: number,
): Rect[] {
  const topH = Math.max(0, playerY - fogRadius);
  const bottomY = playerY + fogRadius;
  const bottomH = Math.max(0, gameH - playerY - fogRadius);
  const leftW = Math.max(0, playerX - fogRadius);
  const rightX = playerX + fogRadius;
  const rightW = Math.max(0, gameW - playerX - fogRadius);
  const midH = fogRadius * 2;

  return [
    // Top strip
    { x: 0, y: 0, w: gameW, h: topH },
    // Bottom strip
    { x: 0, y: bottomY, w: gameW, h: bottomH },
    // Left strip (middle band)
    { x: 0, y: playerY - fogRadius, w: leftW, h: midH },
    // Right strip (middle band)
    { x: rightX, y: playerY - fogRadius, w: rightW, h: midH },
  ];
}

/** A fog ring definition for concentric circle rendering. */
export interface FogRing {
  /** Center X (player position). */
  cx: number;
  /** Center Y (player position). */
  cy: number;
  /** Radius of this ring. */
  radius: number;
  /** Alpha (opacity) for this ring — higher = denser fog. */
  alpha: number;
}

/**
 * Calculate concentric fog rings radiating outward from the player.
 * Outer rings have higher alpha (denser fog), inner rings are nearly transparent.
 * Returns rings sorted outer-to-inner for correct draw order (painter's algorithm).
 *
 * @param playerX - Player X position (ring center)
 * @param playerY - Player Y position (ring center)
 * @param fogRadius - Clear vision radius around player
 * @param gameW - Game width (determines max ring extent)
 * @param gameH - Game height (determines max ring extent)
 * @param ringCount - Number of concentric rings
 * @param alphaMax - Alpha of outermost ring
 * @param alphaMin - Minimum alpha threshold (rings below this are skipped)
 */
export function calculateFogRings(
  playerX: number,
  playerY: number,
  fogRadius: number,
  gameW: number,
  gameH: number,
  ringCount: number,
  alphaMax: number,
  alphaMin: number,
): FogRing[] {
  const rings: FogRing[] = [];
  // Max radius: distance from player to farthest screen corner
  const maxR = Math.sqrt(Math.max(playerX, gameW - playerX) ** 2 + Math.max(playerY, gameH - playerY) ** 2);

  for (let i = 0; i < ringCount; i++) {
    // t=0 is outermost ring, t approaches 1 for innermost
    const t = i / ringCount;
    // Radius shrinks from maxR (outer) toward fogRadius (inner)
    const radius = maxR - (maxR - fogRadius) * t;
    // Alpha decreases from alphaMax (outer) toward 0 (inner)
    const alpha = alphaMax * (1 - t);
    if (alpha < alphaMin) continue;
    rings.push({ cx: playerX, cy: playerY, radius, alpha });
  }

  return rings;
}

/**
 * Get weather stat modifiers for a given weather type.
 * Returns neutral (1x / 0) for unknown weather types.
 */
export function getWeatherModifiers(weatherType: string, config: WeatherConfig): WeatherModifiers {
  const base: WeatherModifiers = {
    speedMult: 1,
    armorMult: 1,
    critBonus: 0,
    enemySpeedMult: 1,
    baseRegenPerSec: 0,
  };

  switch (weatherType) {
    case 'speed_all':
      base.speedMult = 1 + config.speedAllBonus;
      break;
    case 'rain':
      base.enemySpeedMult = config.rainEnemySpeedMult;
      break;
    case 'armor_all':
      base.armorMult = 1 + config.armorAllBonus;
      break;
    case 'crit_all':
      base.critBonus = config.critAllBonus;
      break;
    case 'shield_regen':
      base.baseRegenPerSec = config.shieldRegenHpPerSec;
      break;
    default:
      // fog, flame_zones, lightning_field, void_gravity, unknown — no stat modifiers
      break;
  }

  return base;
}
