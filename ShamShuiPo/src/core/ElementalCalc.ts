/**
 * ElementalCalc — pure TypeScript elemental damage types & weaknesses module.
 * NO Phaser imports. Immutable state management.
 *
 * Handles element rock-paper-scissors, damage multipliers, weakness/resistance queries.
 */

// ─── Types ──────────────────────────────────────────────────

export type Element =
  | "fire"
  | "ice"
  | "electric"
  | "poison"
  | "physical"
  | "void";

export interface ElementalModifier {
  readonly source: Element;
  readonly target: Element;
  readonly multiplier: number;
}

export interface ElementalState {
  readonly modifiers: readonly ElementalModifier[];
}

// ─── Constants ──────────────────────────────────────────────

const ALL_ELEMENTS: readonly Element[] = [
  "fire",
  "ice",
  "electric",
  "poison",
  "physical",
  "void",
] as const;

const DEFAULT_MODIFIERS: readonly ElementalModifier[] = [
  // Rock-paper-scissors triangle: fire > ice > electric > fire
  { source: "fire", target: "ice", multiplier: 1.5 },
  { source: "ice", target: "electric", multiplier: 1.5 },
  { source: "electric", target: "fire", multiplier: 1.5 },

  // Poison beats physical
  { source: "poison", target: "physical", multiplier: 1.5 },

  // Void is neutral against everything (1.0)
  { source: "void", target: "fire", multiplier: 1.0 },
  { source: "void", target: "ice", multiplier: 1.0 },
  { source: "void", target: "electric", multiplier: 1.0 },
  { source: "void", target: "poison", multiplier: 1.0 },
  { source: "void", target: "physical", multiplier: 1.0 },
  { source: "void", target: "void", multiplier: 1.0 },

  // Same-element resistance (0.5)
  { source: "fire", target: "fire", multiplier: 0.5 },
  { source: "ice", target: "ice", multiplier: 0.5 },
  { source: "electric", target: "electric", multiplier: 0.5 },
  { source: "poison", target: "poison", multiplier: 0.5 },
  { source: "physical", target: "physical", multiplier: 0.5 },

  // Physical vs elemental = neutral (1.0)
  { source: "physical", target: "fire", multiplier: 1.0 },
  { source: "physical", target: "ice", multiplier: 1.0 },
  { source: "physical", target: "electric", multiplier: 1.0 },
  { source: "physical", target: "poison", multiplier: 1.0 },
  { source: "physical", target: "void", multiplier: 1.0 },

  // Elemental vs void = neutral
  { source: "fire", target: "void", multiplier: 1.0 },
  { source: "ice", target: "void", multiplier: 1.0 },
  { source: "electric", target: "void", multiplier: 1.0 },
  { source: "poison", target: "void", multiplier: 1.0 },
];

// ─── Factory ────────────────────────────────────────────────

export function createElementalState(): ElementalState {
  return { modifiers: [...DEFAULT_MODIFIERS] };
}

// ─── Queries ────────────────────────────────────────────────

export function getModifier(
  state: ElementalState,
  source: Element,
  target: Element,
): number {
  const found = state.modifiers.find(
    (m) => m.source === source && m.target === target,
  );
  return found ? found.multiplier : 1.0;
}

export function applyElementalDamage(
  state: ElementalState,
  baseDamage: number,
  source: Element,
  target: Element,
): number {
  return baseDamage * getModifier(state, source, target);
}

export function isEffective(
  state: ElementalState,
  source: Element,
  target: Element,
): boolean {
  return getModifier(state, source, target) > 1.0;
}

export function isResisted(
  state: ElementalState,
  source: Element,
  target: Element,
): boolean {
  return getModifier(state, source, target) < 1.0;
}

export function getWeaknesses(
  state: ElementalState,
  target: Element,
): Element[] {
  return state.modifiers
    .filter((m) => m.target === target && m.multiplier > 1.0)
    .map((m) => m.source);
}

export function getResistances(
  state: ElementalState,
  target: Element,
): Element[] {
  return state.modifiers
    .filter((m) => m.target === target && m.multiplier < 1.0)
    .map((m) => m.source);
}

export function getAllElements(): Element[] {
  return [...ALL_ELEMENTS];
}

// ─── Mutations (immutable) ──────────────────────────────────

export function addModifier(
  state: ElementalState,
  source: Element,
  target: Element,
  multiplier: number,
): ElementalState {
  // Remove existing modifier for this pair first, then add new one
  const filtered = state.modifiers.filter(
    (m) => !(m.source === source && m.target === target),
  );
  return {
    modifiers: [...filtered, { source, target, multiplier }],
  };
}

export function removeModifier(
  state: ElementalState,
  source: Element,
  target: Element,
): ElementalState {
  return {
    modifiers: state.modifiers.filter(
      (m) => !(m.source === source && m.target === target),
    ),
  };
}
