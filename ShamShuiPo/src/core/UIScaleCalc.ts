/**
 * UIScaleCalc — pure TypeScript, NO Phaser imports.
 * Responsive UI scaling for 720x1280 cyberpunk bullet heaven.
 */

export interface UIScaleConfig {
  readonly baseWidth: number;
  readonly baseHeight: number;
  readonly minScale: number;
  readonly maxScale: number;
  readonly scaleMode: "fit" | "fill" | "stretch";
}

export interface UIScaleResult {
  readonly scaleX: number;
  readonly scaleY: number;
  readonly uniformScale: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly effectiveWidth: number;
  readonly effectiveHeight: number;
}

const DEFAULT_CONFIG: UIScaleConfig = {
  baseWidth: 720,
  baseHeight: 1280,
  minScale: 0.5,
  maxScale: 2.0,
  scaleMode: "fit",
} as const;

/** Create a UIScaleConfig with defaults, optionally overriding fields. */
export function createUIScaleConfig(
  overrides?: Partial<UIScaleConfig>,
): UIScaleConfig {
  return { ...DEFAULT_CONFIG, ...overrides };
}

/** Clamp value between min and max. */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate scale factors and offsets for the given screen dimensions.
 * - fit: uniform scale to fit inside screen (letterbox).
 * - fill: uniform scale to fill screen (may crop).
 * - stretch: independent x/y scaling.
 */
export function calculateScale(
  config: UIScaleConfig,
  screenWidth: number,
  screenHeight: number,
): UIScaleResult {
  const rawScaleX = screenWidth / config.baseWidth;
  const rawScaleY = screenHeight / config.baseHeight;

  let scaleX: number;
  let scaleY: number;
  let uniformScale: number;

  switch (config.scaleMode) {
    case "fit": {
      uniformScale = clamp(
        Math.min(rawScaleX, rawScaleY),
        config.minScale,
        config.maxScale,
      );
      scaleX = uniformScale;
      scaleY = uniformScale;
      break;
    }
    case "fill": {
      uniformScale = clamp(
        Math.max(rawScaleX, rawScaleY),
        config.minScale,
        config.maxScale,
      );
      scaleX = uniformScale;
      scaleY = uniformScale;
      break;
    }
    case "stretch": {
      scaleX = clamp(rawScaleX, config.minScale, config.maxScale);
      scaleY = clamp(rawScaleY, config.minScale, config.maxScale);
      uniformScale = Math.min(scaleX, scaleY);
      break;
    }
  }

  const effectiveWidth = config.baseWidth * scaleX;
  const effectiveHeight = config.baseHeight * scaleY;
  const offsetX = (screenWidth - effectiveWidth) / 2;
  const offsetY = (screenHeight - effectiveHeight) / 2;

  return {
    scaleX,
    scaleY,
    uniformScale,
    offsetX,
    offsetY,
    effectiveWidth,
    effectiveHeight,
  };
}

/** Transform base-space coordinates to screen-space. */
export function scalePosition(
  x: number,
  y: number,
  result: UIScaleResult,
): { x: number; y: number } {
  return {
    x: x * result.scaleX + result.offsetX,
    y: y * result.scaleY + result.offsetY,
  };
}

/** Transform screen-space coordinates to base-space. */
export function unscalePosition(
  screenX: number,
  screenY: number,
  result: UIScaleResult,
): { x: number; y: number } {
  return {
    x: (screenX - result.offsetX) / result.scaleX,
    y: (screenY - result.offsetY) / result.scaleY,
  };
}

/** Scale a font size by uniform scale, rounded to nearest integer. */
export function scaleFontSize(
  baseFontSize: number,
  result: UIScaleResult,
): number {
  return Math.round(baseFontSize * result.uniformScale);
}

/** Scale a generic value by uniform scale. */
export function scaleValue(baseValue: number, result: UIScaleResult): number {
  return baseValue * result.uniformScale;
}

/** Return the aspect ratio (width / height). */
export function getAspectRatio(width: number, height: number): number {
  return width / height;
}

/** True if height > width. */
export function isPortrait(width: number, height: number): boolean {
  return height > width;
}

/** True if width > height. */
export function isLandscape(width: number, height: number): boolean {
  return width > height;
}

/**
 * Return the size of letterbox bars in pixels (fit mode).
 * horizontal = top/bottom bar height, vertical = left/right bar width.
 */
export function getLetterboxBars(
  config: UIScaleConfig,
  screenWidth: number,
  screenHeight: number,
): { horizontal: number; vertical: number } {
  const result = calculateScale(config, screenWidth, screenHeight);
  return {
    horizontal: Math.max(0, result.offsetY),
    vertical: Math.max(0, result.offsetX),
  };
}
