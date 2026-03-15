// FloatingTextCalc.ts — Floating Damage/XP Text Popup System
// Pure TypeScript, no Phaser imports, immutable state

export type FloatingTextType =
  | "damage"
  | "crit"
  | "heal"
  | "xp"
  | "gold"
  | "miss"
  | "status";

export interface FloatingText {
  readonly id: number;
  readonly type: FloatingTextType;
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly startY: number;
  readonly age: number; // ms
  readonly duration: number; // ms
  readonly scale: number;
  readonly alpha: number;
  readonly color: string; // hex
  readonly active: boolean;
}

export interface FloatingTextState {
  readonly texts: readonly FloatingText[];
  readonly nextId: number;
  readonly maxTexts: number;
  readonly riseSpeed: number; // pixels per second
  readonly fadeDuration: number; // ms
}

export function createFloatingTextState(
  maxTexts: number = 30,
  riseSpeed: number = 60,
  fadeDuration: number = 800,
): FloatingTextState {
  return {
    texts: [],
    nextId: 1,
    maxTexts,
    riseSpeed,
    fadeDuration,
  };
}

export function getDefaultColor(type: FloatingTextType): string {
  switch (type) {
    case "damage":
      return "#FFFFFF";
    case "crit":
      return "#FF4444";
    case "heal":
      return "#44FF44";
    case "xp":
      return "#FFFF00";
    case "gold":
      return "#FFD700";
    case "miss":
      return "#888888";
    case "status":
      return "#44AAFF";
  }
}

export function getDefaultScale(type: FloatingTextType): number {
  switch (type) {
    case "crit":
      return 1.5;
    case "damage":
      return 1.0;
    case "heal":
      return 1.0;
    case "xp":
      return 0.8;
    case "gold":
      return 0.8;
    case "miss":
      return 0.7;
    case "status":
      return 0.9;
  }
}

export function getCurrentY(text: FloatingText, riseSpeed: number): number {
  return text.startY - (text.age / 1000) * riseSpeed;
}

export function getCurrentAlpha(
  text: FloatingText,
  fadeDuration: number,
): number {
  const fadeStart = text.duration - fadeDuration;
  if (text.age <= fadeStart) {
    return 1.0;
  }
  const fadeElapsed = text.age - fadeStart;
  const ratio = 1.0 - fadeElapsed / fadeDuration;
  return Math.max(0, Math.min(1, ratio));
}

export function spawnText(
  state: FloatingTextState,
  type: FloatingTextType,
  text: string,
  x: number,
  y: number,
  color?: string,
): FloatingTextState {
  const newText: FloatingText = {
    id: state.nextId,
    type,
    text,
    x,
    y,
    startY: y,
    age: 0,
    duration: state.fadeDuration + 400, // total duration = visible time + fade
    scale: getDefaultScale(type),
    alpha: 1.0,
    color: color ?? getDefaultColor(type),
    active: true,
  };

  let texts = [...state.texts, newText];

  // Trim oldest if maxTexts exceeded
  if (texts.length > state.maxTexts) {
    texts = texts.slice(texts.length - state.maxTexts);
  }

  return {
    ...state,
    texts,
    nextId: state.nextId + 1,
  };
}

export function updateTexts(
  state: FloatingTextState,
  deltaMs: number,
): FloatingTextState {
  const updatedTexts = state.texts.map((t) => {
    if (!t.active) return t;

    const newAge = t.age + deltaMs;
    const active = newAge < t.duration;
    const y = getCurrentY({ ...t, age: newAge }, state.riseSpeed);
    const alpha = active
      ? getCurrentAlpha({ ...t, age: newAge }, state.fadeDuration)
      : 0;

    return {
      ...t,
      age: newAge,
      y,
      alpha,
      active,
    };
  });

  return {
    ...state,
    texts: updatedTexts,
  };
}

export function getActiveTexts(state: FloatingTextState): FloatingText[] {
  return state.texts.filter((t) => t.active);
}

export function clearTexts(state: FloatingTextState): FloatingTextState {
  return {
    ...state,
    texts: [],
  };
}

export function getTextCount(state: FloatingTextState): number {
  return state.texts.filter((t) => t.active).length;
}
