// ── Neon Survivors: Wave Pattern Calculations ──
// Pure TypeScript — NO Phaser imports.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export type PatternType =
  | "circle"
  | "line"
  | "vshape"
  | "random"
  | "spiral"
  | "swarm";

export interface SpawnPoint {
  x: number;
  y: number;
  delay: number; // seconds delay before this enemy spawns
  enemyId: string; // which enemy type to spawn
}

export interface WavePattern {
  type: PatternType;
  points: SpawnPoint[];
  totalDuration: number; // how long the full pattern takes
}

// ════════════════════════════════════════════════════════════════
// § CONSTANTS
// ════════════════════════════════════════════════════════════════

/** Golden angle in radians — produces even angular distribution */
const GOLDEN_ANGLE = 2.399;

/** Default stagger delays per pattern type (seconds) */
const STAGGER: Record<PatternType, number> = {
  circle: 0.1,
  line: 0.15,
  vshape: 0.1,
  spiral: 0.2,
  swarm: 0.05,
  random: 0.1,
};

/** Minute → pattern type mapping */
const MINUTE_PATTERN: [number, number, PatternType][] = [
  [0, 1, "random"],
  [2, 3, "line"],
  [4, 5, "circle"],
  [6, 7, "vshape"],
  [8, 8, "spiral"],
  [9, 9, "swarm"],
];

// ════════════════════════════════════════════════════════════════
// § PATTERN GENERATORS
// ════════════════════════════════════════════════════════════════

/** Enemies spawn in a circle around a center point, 0.1s stagger. */
export function generateCirclePattern(
  cx: number,
  cy: number,
  radius: number,
  count: number,
  enemyId: string,
): WavePattern {
  const points: SpawnPoint[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count;
    points.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      delay: i * STAGGER.circle,
      enemyId,
    });
  }
  return {
    type: "circle",
    points,
    totalDuration: (count - 1) * STAGGER.circle,
  };
}

/** Enemies spawn along a line between two points, 0.15s stagger. */
export function generateLinePattern(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  count: number,
  enemyId: string,
): WavePattern {
  const points: SpawnPoint[] = [];
  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0;
    points.push({
      x: x1 + (x2 - x1) * t,
      y: y1 + (y2 - y1) * t,
      delay: i * STAGGER.line,
      enemyId,
    });
  }
  return {
    type: "line",
    points,
    totalDuration: (count - 1) * STAGGER.line,
  };
}

/** V-formation pointing toward player, 0.1s stagger. */
export function generateVShapePattern(
  tipX: number,
  tipY: number,
  armLength: number,
  count: number,
  enemyId: string,
): WavePattern {
  const points: SpawnPoint[] = [];
  // Tip is the first point
  points.push({ x: tipX, y: tipY, delay: 0, enemyId });

  // Remaining points split between two arms at ±45°
  const armCount = count - 1;
  const leftCount = Math.ceil(armCount / 2);
  const rightCount = armCount - leftCount;

  // Left arm: +45° (up-left from tip)
  for (let i = 0; i < leftCount; i++) {
    const t = (i + 1) / leftCount;
    points.push({
      x: tipX - armLength * t * Math.cos(Math.PI / 4),
      y: tipY - armLength * t * Math.sin(Math.PI / 4),
      delay: (i + 1) * STAGGER.vshape,
      enemyId,
    });
  }

  // Right arm: -45° (up-right from tip)
  for (let i = 0; i < rightCount; i++) {
    const t = (i + 1) / rightCount;
    points.push({
      x: tipX + armLength * t * Math.cos(Math.PI / 4),
      y: tipY - armLength * t * Math.sin(Math.PI / 4),
      delay: (leftCount + i + 1) * STAGGER.vshape,
      enemyId,
    });
  }

  return {
    type: "vshape",
    points,
    totalDuration: (count - 1) * STAGGER.vshape,
  };
}

/** Spiral outward from center, 0.2s stagger. */
export function generateSpiralPattern(
  cx: number,
  cy: number,
  maxRadius: number,
  count: number,
  enemyId: string,
): WavePattern {
  const points: SpawnPoint[] = [];
  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0;
    const radius = maxRadius * t;
    const angle = i * GOLDEN_ANGLE;
    points.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      delay: i * STAGGER.spiral,
      enemyId,
    });
  }
  return {
    type: "spiral",
    points,
    totalDuration: (count - 1) * STAGGER.spiral,
  };
}

/** Tight cluster with deterministic offsets within spread radius, 0.05s stagger. */
export function generateSwarmPattern(
  cx: number,
  cy: number,
  spread: number,
  count: number,
  enemyId: string,
): WavePattern {
  const points: SpawnPoint[] = [];
  for (let i = 0; i < count; i++) {
    const offsetX = spread * Math.sin(i * GOLDEN_ANGLE);
    const offsetY = spread * Math.cos(i * GOLDEN_ANGLE);
    points.push({
      x: cx + offsetX,
      y: cy + offsetY,
      delay: i * STAGGER.swarm,
      enemyId,
    });
  }
  return {
    type: "swarm",
    points,
    totalDuration: (count - 1) * STAGGER.swarm,
  };
}

/** Fully random positions within bounds, 0.1s stagger.
 *  Uses deterministic golden-angle based distribution. */
export function generateRandomPattern(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  count: number,
  enemyId: string,
): WavePattern {
  const points: SpawnPoint[] = [];
  const width = maxX - minX;
  const height = maxY - minY;

  for (let i = 0; i < count; i++) {
    // Deterministic pseudo-random using golden ratio fractions
    const fx = (i * 0.6180339887) % 1;
    const fy = ((i + 1) * 0.6180339887) % 1;
    points.push({
      x: minX + width * fx,
      y: minY + height * fy,
      delay: i * STAGGER.random,
      enemyId,
    });
  }
  return {
    type: "random",
    points,
    totalDuration: (count - 1) * STAGGER.random,
  };
}

// ════════════════════════════════════════════════════════════════
// § PATTERN SELECTION & SCALING
// ════════════════════════════════════════════════════════════════

/** Maps game minute to recommended pattern type. */
export function getPatternForMinute(minute: number): PatternType {
  for (const [minMin, maxMin, type] of MINUTE_PATTERN) {
    if (minute >= minMin && minute <= maxMin) return type;
  }
  // Beyond minute 9: cycle through swarm (hardest)
  return "swarm";
}

/** Increases count by multiplier and reduces delays proportionally. */
export function scalePatternDifficulty(
  pattern: WavePattern,
  multiplier: number,
): WavePattern {
  const scaledCount = Math.round(pattern.points.length * multiplier);
  const delayScale = 1 / multiplier;

  // Rebuild points: keep positions proportional, scale delays
  const points: SpawnPoint[] = [];
  for (let i = 0; i < scaledCount; i++) {
    const srcIdx = Math.min(
      Math.floor((i / scaledCount) * pattern.points.length),
      pattern.points.length - 1,
    );
    const src = pattern.points[srcIdx];
    points.push({
      x: src.x,
      y: src.y,
      delay: i * (src.delay > 0 ? src.delay / srcIdx || 0 : 0) * delayScale,
      enemyId: src.enemyId,
    });
  }

  // Recalculate delays uniformly based on original stagger
  const originalStagger =
    pattern.points.length > 1
      ? pattern.totalDuration / (pattern.points.length - 1)
      : 0;
  const newStagger = originalStagger * delayScale;
  for (let i = 0; i < points.length; i++) {
    points[i].delay = i * newStagger;
  }

  return {
    type: pattern.type,
    points,
    totalDuration: scaledCount > 1 ? (scaledCount - 1) * newStagger : 0,
  };
}
