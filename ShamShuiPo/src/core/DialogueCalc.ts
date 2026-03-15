/**
 * DialogueCalc — pure TypeScript, NO Phaser imports.
 * Conversation/dialogue state machine with conditional branching and flag system.
 * All functions are pure and return new state (immutable).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DialogueChoice {
  text: string;
  nextNodeId: string;
  condition?: string;
}

export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  choices: DialogueChoice[];
}

export interface DialogueState {
  currentNodeId: string | null;
  visitedNodes: string[];
  flags: Record<string, boolean>;
  history: string[];
}

export interface DialogueScript {
  nodes: Record<string, DialogueNode>;
  startNodeId: string;
}

// ---------------------------------------------------------------------------
// State creation
// ---------------------------------------------------------------------------

export function createDialogueState(): DialogueState {
  return {
    currentNodeId: null,
    visitedNodes: [],
    flags: {},
    history: [],
  };
}

// ---------------------------------------------------------------------------
// Dialogue control
// ---------------------------------------------------------------------------

export function startDialogue(script: DialogueScript): DialogueState {
  const state = createDialogueState();
  const node = script.nodes[script.startNodeId];
  if (!node) {
    return state;
  }
  return {
    ...state,
    currentNodeId: script.startNodeId,
    visitedNodes: [script.startNodeId],
    history: [script.startNodeId],
  };
}

export function advanceDialogue(
  state: DialogueState,
  choiceIndex: number,
  script: DialogueScript,
): DialogueState {
  if (state.currentNodeId === null) return state;

  const node = script.nodes[state.currentNodeId];
  if (!node) return state;

  const available = getAvailableChoices(state, script);
  if (choiceIndex < 0 || choiceIndex >= available.length) return state;

  const choice = available[choiceIndex];
  const nextNode = script.nodes[choice.nextNodeId];
  if (!nextNode) return state;

  const nextNodeId = choice.nextNodeId;
  const visitedNodes = state.visitedNodes.includes(nextNodeId)
    ? state.visitedNodes
    : [...state.visitedNodes, nextNodeId];

  return {
    ...state,
    currentNodeId: nextNodeId,
    visitedNodes,
    history: [...state.history, nextNodeId],
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function getCurrentNode(
  state: DialogueState,
  script: DialogueScript,
): DialogueNode | null {
  if (state.currentNodeId === null) return null;
  return script.nodes[state.currentNodeId] ?? null;
}

export function isDialogueComplete(
  state: DialogueState,
  script: DialogueScript,
): boolean {
  if (state.currentNodeId === null) return true;

  const node = script.nodes[state.currentNodeId];
  if (!node) return true;

  // No choices at all means complete
  if (node.choices.length === 0) return true;

  // Has choices but none have a valid nextNodeId in the script
  const hasValidNext = node.choices.some(
    (c) => script.nodes[c.nextNodeId] !== undefined,
  );
  if (!hasValidNext) return true;

  return false;
}

export function getAvailableChoices(
  state: DialogueState,
  script: DialogueScript,
): DialogueChoice[] {
  if (state.currentNodeId === null) return [];

  const node = script.nodes[state.currentNodeId];
  if (!node) return [];

  return node.choices.filter((choice) => {
    if (!choice.condition) return true;
    return evaluateCondition(choice.condition, state.flags);
  });
}

// ---------------------------------------------------------------------------
// Flag system
// ---------------------------------------------------------------------------

export function setFlag(
  state: DialogueState,
  key: string,
  value: boolean,
): DialogueState {
  return {
    ...state,
    flags: { ...state.flags, [key]: value },
  };
}

export function getFlag(state: DialogueState, key: string): boolean {
  return state.flags[key] === true;
}

// ---------------------------------------------------------------------------
// Visit tracking
// ---------------------------------------------------------------------------

export function hasVisitedNode(state: DialogueState, nodeId: string): boolean {
  return state.visitedNodes.includes(nodeId);
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

export function getDialogueHistory(state: DialogueState): string[] {
  return [...state.history];
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

export function resetDialogue(
  state: DialogueState,
  script: DialogueScript,
): DialogueState {
  const node = script.nodes[script.startNodeId];
  if (!node) {
    return createDialogueState();
  }
  return {
    currentNodeId: script.startNodeId,
    visitedNodes: [script.startNodeId],
    flags: { ...state.flags },
    history: [script.startNodeId],
  };
}

// ---------------------------------------------------------------------------
// Condition evaluation (internal)
// ---------------------------------------------------------------------------

function evaluateCondition(
  condition: string,
  flags: Record<string, boolean>,
): boolean {
  // Support "flag:keyName" format
  if (condition.startsWith("flag:")) {
    const flagKey = condition.slice(5);
    return flags[flagKey] === true;
  }

  // Support "!flag:keyName" for negation
  if (condition.startsWith("!flag:")) {
    const flagKey = condition.slice(6);
    return flags[flagKey] !== true;
  }

  // Unknown condition format — treat as unmet
  return false;
}
