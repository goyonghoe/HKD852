// SlowFieldCalc.ts — Area Slow Debuff System
// Pure TypeScript, no Phaser imports, immutable state

export interface SlowField {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly slowPercent: number; // 0-1, speed reduction
  readonly duration: number; // ms
  readonly elapsed: number; // ms
  readonly active: boolean;
}

export interface SlowFieldState {
  readonly fields: readonly SlowField[];
  readonly maxFields: number;
}

let _idCounter = 0;

function generateId(): string {
  _idCounter += 1;
  return `sf_${_idCounter}_${Date.now()}`;
}

export function createSlowFieldState(maxFields: number = 10): SlowFieldState {
  return { fields: [], maxFields };
}

export function addField(
  state: SlowFieldState,
  x: number,
  y: number,
  radius: number,
  slowPercent: number,
  duration: number,
): SlowFieldState {
  const clampedSlow = Math.max(0, Math.min(1, slowPercent));
  const newField: SlowField = {
    id: generateId(),
    x,
    y,
    radius: Math.max(0, radius),
    slowPercent: clampedSlow,
    duration: Math.max(0, duration),
    elapsed: 0,
    active: true,
  };

  let fields = [...state.fields, newField];

  // Remove oldest if exceeding maxFields
  while (fields.length > state.maxFields) {
    fields = fields.slice(1);
  }

  return { ...state, fields };
}

export function updateFields(
  state: SlowFieldState,
  deltaMs: number,
): SlowFieldState {
  const fields = state.fields.map((field) => {
    if (!field.active) return field;
    const newElapsed = field.elapsed + deltaMs;
    if (newElapsed >= field.duration) {
      return { ...field, elapsed: newElapsed, active: false };
    }
    return { ...field, elapsed: newElapsed };
  });
  return { ...state, fields };
}

export function removeField(state: SlowFieldState, id: string): SlowFieldState {
  const fields = state.fields.filter((f) => f.id !== id);
  return { ...state, fields };
}

export function isInField(x: number, y: number, field: SlowField): boolean {
  const dx = x - field.x;
  const dy = y - field.y;
  return dx * dx + dy * dy <= field.radius * field.radius;
}

export function getSlowAtPosition(
  state: SlowFieldState,
  x: number,
  y: number,
): number {
  let maxSlow = 0;
  for (const field of state.fields) {
    if (!field.active) continue;
    if (isInField(x, y, field)) {
      if (field.slowPercent > maxSlow) {
        maxSlow = field.slowPercent;
      }
    }
  }
  return maxSlow;
}

export function getActiveFields(state: SlowFieldState): SlowField[] {
  return state.fields.filter((f) => f.active);
}

export function getAffectedFieldCount(
  state: SlowFieldState,
  x: number,
  y: number,
): number {
  let count = 0;
  for (const field of state.fields) {
    if (field.active && isInField(x, y, field)) {
      count++;
    }
  }
  return count;
}

export function clearFields(state: SlowFieldState): SlowFieldState {
  return { ...state, fields: [] };
}

export function getFieldCount(state: SlowFieldState): number {
  return state.fields.filter((f) => f.active).length;
}

export function getSpeedMultiplier(
  state: SlowFieldState,
  x: number,
  y: number,
): number {
  return 1.0 - getSlowAtPosition(state, x, y);
}
