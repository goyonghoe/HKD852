// ── Neon Survivors: Input / Joystick Calculations ──
// Pure TypeScript — NO Phaser imports.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export type SwipeDirection = "up" | "down" | "left" | "right" | "none";

export interface JoystickInput {
  readonly rawX: number;
  readonly rawY: number;
  readonly normalizedX: number;
  readonly normalizedY: number;
  readonly magnitude: number;
  readonly angle: number;
  readonly isActive: boolean;
}

export interface JoystickConfig {
  readonly deadZone: number;
  readonly maxRadius: number;
  readonly sensitivity: number;
  readonly isLeftHanded: boolean;
  readonly centerX: number;
  readonly centerY: number;
}

export interface SwipeGesture {
  readonly startX: number;
  readonly startY: number;
  readonly endX: number;
  readonly endY: number;
  readonly duration: number;
  readonly direction: SwipeDirection;
  readonly velocity: number;
}

// ════════════════════════════════════════════════════════════════
// § CONSTANTS
// ════════════════════════════════════════════════════════════════

const DEFAULT_DEAD_ZONE = 0.15;
const DEFAULT_MAX_RADIUS = 60;
const DEFAULT_SENSITIVITY = 1.0;
const DEFAULT_MIN_SWIPE_DISTANCE = 30;
const DEFAULT_MAX_SWIPE_DURATION = 300;

/** Joystick padding from screen edge (pixels) */
const JOYSTICK_PADDING_X = 100;
const JOYSTICK_PADDING_Y = 200;

const TWO_PI = Math.PI * 2;

// ════════════════════════════════════════════════════════════════
// § createJoystickConfig
// ════════════════════════════════════════════════════════════════

/**
 * Create a joystick configuration with sensible defaults.
 * Defaults: right-handed, deadZone 0.15, maxRadius 60, sensitivity 1.0.
 */
export function createJoystickConfig(
  isLeftHanded?: boolean,
  deadZone?: number,
  maxRadius?: number,
  sensitivity?: number,
): JoystickConfig {
  return {
    isLeftHanded: isLeftHanded ?? false,
    deadZone: deadZone ?? DEFAULT_DEAD_ZONE,
    maxRadius: maxRadius ?? DEFAULT_MAX_RADIUS,
    sensitivity: sensitivity ?? DEFAULT_SENSITIVITY,
    centerX: 0,
    centerY: 0,
  };
}

// ════════════════════════════════════════════════════════════════
// § processJoystickInput
// ════════════════════════════════════════════════════════════════

/**
 * Normalize touch input relative to joystick center, apply dead zone.
 * Returns full JoystickInput with normalized values clamped to 0-1 magnitude.
 */
export function processJoystickInput(
  touchX: number,
  touchY: number,
  config: JoystickConfig,
): JoystickInput {
  const rawX = touchX - config.centerX;
  const rawY = touchY - config.centerY;

  const { x: clampedX, y: clampedY } = clampMagnitude(
    rawX,
    rawY,
    config.maxRadius,
  );

  const rawMagnitude = Math.sqrt(clampedX * clampedX + clampedY * clampedY);
  const normalizedRawMag =
    config.maxRadius > 0 ? rawMagnitude / config.maxRadius : 0;
  const magnitude = applyDeadZone(normalizedRawMag, config.deadZone);

  const angle = Math.atan2(clampedY, clampedX);
  const isActive = magnitude > 0;

  let normalizedX = 0;
  let normalizedY = 0;
  if (isActive && rawMagnitude > 0) {
    const dirX = clampedX / rawMagnitude;
    const dirY = clampedY / rawMagnitude;
    normalizedX = dirX * magnitude * config.sensitivity;
    normalizedY = dirY * magnitude * config.sensitivity;
  }

  return {
    rawX,
    rawY,
    normalizedX,
    normalizedY,
    magnitude,
    angle,
    isActive,
  };
}

// ════════════════════════════════════════════════════════════════
// § applyDeadZone
// ════════════════════════════════════════════════════════════════

/**
 * If magnitude is below dead zone, return 0.
 * Otherwise remap the remaining range to 0-1.
 */
export function applyDeadZone(magnitude: number, deadZone: number): number {
  if (magnitude <= deadZone) return 0;
  if (deadZone >= 1) return 0;
  return Math.min(1, (magnitude - deadZone) / (1 - deadZone));
}

// ════════════════════════════════════════════════════════════════
// § clampMagnitude
// ════════════════════════════════════════════════════════════════

/**
 * Clamp a 2D vector to a maximum radius, preserving direction.
 */
export function clampMagnitude(
  x: number,
  y: number,
  maxRadius: number,
): { x: number; y: number } {
  const mag = Math.sqrt(x * x + y * y);
  if (mag <= maxRadius || mag === 0) return { x, y };
  const scale = maxRadius / mag;
  return { x: x * scale, y: y * scale };
}

// ════════════════════════════════════════════════════════════════
// § getMovementVector
// ════════════════════════════════════════════════════════════════

/**
 * Convert joystick input to a movement delta { dx, dy } for one frame.
 */
export function getMovementVector(
  input: JoystickInput,
  speed: number,
): { dx: number; dy: number } {
  if (!input.isActive) return { dx: 0, dy: 0 };
  return {
    dx: input.normalizedX * speed,
    dy: input.normalizedY * speed,
  };
}

// ════════════════════════════════════════════════════════════════
// § detectSwipe
// ════════════════════════════════════════════════════════════════

/**
 * Classify a touch gesture as a SwipeGesture.
 */
export function detectSwipe(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  duration: number,
): SwipeGesture {
  const dx = endX - startX;
  const dy = endY - startY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const direction = getSwipeDirection(dx, dy);
  const velocity = duration > 0 ? dist / duration : 0;

  return {
    startX,
    startY,
    endX,
    endY,
    duration,
    direction,
    velocity,
  };
}

// ════════════════════════════════════════════════════════════════
// § getSwipeDirection
// ════════════════════════════════════════════════════════════════

/**
 * Determine dominant swipe direction from a delta vector.
 * Returns "none" if both dx and dy are zero.
 */
export function getSwipeDirection(dx: number, dy: number): SwipeDirection {
  if (dx === 0 && dy === 0) return "none";

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx >= absDy) {
    return dx > 0 ? "right" : "left";
  }
  // Screen coordinates: positive Y is down
  return dy > 0 ? "down" : "up";
}

// ════════════════════════════════════════════════════════════════
// § isValidSwipe
// ════════════════════════════════════════════════════════════════

/**
 * Check if a swipe gesture meets minimum distance and maximum duration thresholds.
 * Defaults: minDistance 30px, maxDuration 300ms.
 */
export function isValidSwipe(
  gesture: SwipeGesture,
  minDistance?: number,
  maxDuration?: number,
): boolean {
  const minDist = minDistance ?? DEFAULT_MIN_SWIPE_DISTANCE;
  const maxDur = maxDuration ?? DEFAULT_MAX_SWIPE_DURATION;

  const dx = gesture.endX - gesture.startX;
  const dy = gesture.endY - gesture.startY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  return dist >= minDist && gesture.duration <= maxDur;
}

// ════════════════════════════════════════════════════════════════
// § getJoystickPosition
// ════════════════════════════════════════════════════════════════

/**
 * Calculate the joystick UI anchor position based on handedness and screen size.
 * Left-handed: bottom-left. Right-handed: bottom-right (mirrored for the
 * joystick so the fire button stays on the opposite side).
 */
export function getJoystickPosition(
  config: JoystickConfig,
  screenWidth: number,
  screenHeight: number,
): { x: number; y: number } {
  const y = screenHeight - JOYSTICK_PADDING_Y;
  const x = config.isLeftHanded
    ? JOYSTICK_PADDING_X
    : screenWidth - JOYSTICK_PADDING_X;

  return { x, y };
}

// ════════════════════════════════════════════════════════════════
// § normalizeAngle
// ════════════════════════════════════════════════════════════════

/**
 * Normalize an angle to the range [0, 2*PI).
 */
export function normalizeAngle(angle: number): number {
  let a = angle % TWO_PI;
  if (a < 0) a += TWO_PI;
  return a;
}

// ════════════════════════════════════════════════════════════════
// § angleBetween
// ════════════════════════════════════════════════════════════════

/**
 * Calculate the angle (in radians) from (x1, y1) to (x2, y2).
 */
export function angleBetween(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  return Math.atan2(y2 - y1, x2 - x1);
}

// ════════════════════════════════════════════════════════════════
// § distanceBetween
// ════════════════════════════════════════════════════════════════

/**
 * Euclidean distance between two points.
 */
export function distanceBetween(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

// ════════════════════════════════════════════════════════════════
// § lerpInput
// ════════════════════════════════════════════════════════════════

/**
 * Linearly interpolate between current and target values for smooth input.
 * Smoothing clamped to [0, 1]: 0 = no change, 1 = instant snap.
 */
export function lerpInput(
  current: number,
  target: number,
  smoothing: number,
): number {
  const t = Math.max(0, Math.min(1, smoothing));
  return current + (target - current) * t;
}
