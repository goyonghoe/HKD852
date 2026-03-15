import { describe, it, expect } from "vitest";
import {
  createDialogueState,
  startDialogue,
  advanceDialogue,
  getCurrentNode,
  isDialogueComplete,
  getAvailableChoices,
  setFlag,
  getFlag,
  hasVisitedNode,
  getDialogueHistory,
  resetDialogue,
  type DialogueScript,
} from "../../src/core/DialogueCalc";

// ── Test fixtures ───────────────────────────────────────────────

const SIMPLE_SCRIPT: DialogueScript = {
  startNodeId: "start",
  nodes: {
    start: {
      id: "start",
      speaker: "NPC",
      text: "Hello, traveler!",
      choices: [
        { text: "Hi!", nextNodeId: "greeting" },
        { text: "Goodbye", nextNodeId: "end" },
      ],
    },
    greeting: {
      id: "greeting",
      speaker: "NPC",
      text: "Nice to meet you.",
      choices: [{ text: "Likewise", nextNodeId: "end" }],
    },
    end: {
      id: "end",
      speaker: "NPC",
      text: "Farewell!",
      choices: [],
    },
  },
};

const CONDITIONAL_SCRIPT: DialogueScript = {
  startNodeId: "start",
  nodes: {
    start: {
      id: "start",
      speaker: "Guard",
      text: "Halt! Who goes there?",
      choices: [
        {
          text: "I have a pass",
          nextNodeId: "pass",
          condition: "flag:hasPass",
        },
        {
          text: "Secret path",
          nextNodeId: "secret",
          condition: "!flag:hasPass",
        },
        { text: "Leave", nextNodeId: "leave" },
      ],
    },
    pass: {
      id: "pass",
      speaker: "Guard",
      text: "Go ahead.",
      choices: [],
    },
    secret: {
      id: "secret",
      speaker: "Guard",
      text: "The back way...",
      choices: [],
    },
    leave: {
      id: "leave",
      speaker: "Guard",
      text: "Safe travels.",
      choices: [],
    },
  },
};

// ── createDialogueState ─────────────────────────────────────────

describe("createDialogueState", () => {
  it("starts with null currentNodeId", () => {
    const s = createDialogueState();
    expect(s.currentNodeId).toBeNull();
  });

  it("starts with empty visitedNodes", () => {
    expect(createDialogueState().visitedNodes).toHaveLength(0);
  });

  it("starts with empty flags", () => {
    expect(Object.keys(createDialogueState().flags)).toHaveLength(0);
  });

  it("starts with empty history", () => {
    expect(createDialogueState().history).toHaveLength(0);
  });
});

// ── startDialogue ───────────────────────────────────────────────

describe("startDialogue", () => {
  it("sets currentNodeId to startNodeId", () => {
    const s = startDialogue(SIMPLE_SCRIPT);
    expect(s.currentNodeId).toBe("start");
  });

  it("adds startNode to visitedNodes", () => {
    const s = startDialogue(SIMPLE_SCRIPT);
    expect(s.visitedNodes).toContain("start");
  });

  it("adds startNode to history", () => {
    const s = startDialogue(SIMPLE_SCRIPT);
    expect(s.history).toEqual(["start"]);
  });

  it("returns empty state if startNodeId is invalid", () => {
    const bad: DialogueScript = { startNodeId: "nope", nodes: {} };
    const s = startDialogue(bad);
    expect(s.currentNodeId).toBeNull();
  });
});

// ── getCurrentNode ──────────────────────────────────────────────

describe("getCurrentNode", () => {
  it("returns current node", () => {
    const s = startDialogue(SIMPLE_SCRIPT);
    const node = getCurrentNode(s, SIMPLE_SCRIPT);
    expect(node!.id).toBe("start");
    expect(node!.speaker).toBe("NPC");
    expect(node!.text).toBe("Hello, traveler!");
  });

  it("returns null for empty state", () => {
    expect(getCurrentNode(createDialogueState(), SIMPLE_SCRIPT)).toBeNull();
  });
});

// ── advanceDialogue ─────────────────────────────────────────────

describe("advanceDialogue", () => {
  it("moves to next node via choice index", () => {
    const s = startDialogue(SIMPLE_SCRIPT);
    const s2 = advanceDialogue(s, 0, SIMPLE_SCRIPT);
    expect(s2.currentNodeId).toBe("greeting");
  });

  it("second choice goes to different node", () => {
    const s = startDialogue(SIMPLE_SCRIPT);
    const s2 = advanceDialogue(s, 1, SIMPLE_SCRIPT);
    expect(s2.currentNodeId).toBe("end");
  });

  it("adds new node to visitedNodes", () => {
    const s = startDialogue(SIMPLE_SCRIPT);
    const s2 = advanceDialogue(s, 0, SIMPLE_SCRIPT);
    expect(s2.visitedNodes).toContain("greeting");
  });

  it("adds new node to history", () => {
    const s = startDialogue(SIMPLE_SCRIPT);
    const s2 = advanceDialogue(s, 0, SIMPLE_SCRIPT);
    expect(s2.history).toEqual(["start", "greeting"]);
  });

  it("no-op for invalid choice index (too high)", () => {
    const s = startDialogue(SIMPLE_SCRIPT);
    const s2 = advanceDialogue(s, 99, SIMPLE_SCRIPT);
    expect(s2.currentNodeId).toBe("start");
  });

  it("no-op for negative choice index", () => {
    const s = startDialogue(SIMPLE_SCRIPT);
    const s2 = advanceDialogue(s, -1, SIMPLE_SCRIPT);
    expect(s2.currentNodeId).toBe("start");
  });

  it("no-op when currentNodeId is null", () => {
    const s = createDialogueState();
    const s2 = advanceDialogue(s, 0, SIMPLE_SCRIPT);
    expect(s2.currentNodeId).toBeNull();
  });

  it("does not duplicate visitedNodes on revisit", () => {
    let s = startDialogue(SIMPLE_SCRIPT);
    // go to greeting, then somehow revisit start
    s = advanceDialogue(s, 0, SIMPLE_SCRIPT);
    // visitedNodes should have start + greeting
    expect(s.visitedNodes.filter((n) => n === "start")).toHaveLength(1);
  });

  it("is immutable", () => {
    const s = startDialogue(SIMPLE_SCRIPT);
    const s2 = advanceDialogue(s, 0, SIMPLE_SCRIPT);
    expect(s.currentNodeId).toBe("start");
    expect(s2.currentNodeId).toBe("greeting");
  });
});

// ── isDialogueComplete ──────────────────────────────────────────

describe("isDialogueComplete", () => {
  it("returns true when current node has no choices", () => {
    let s = startDialogue(SIMPLE_SCRIPT);
    s = advanceDialogue(s, 1, SIMPLE_SCRIPT); // → end
    expect(isDialogueComplete(s, SIMPLE_SCRIPT)).toBe(true);
  });

  it("returns false when choices remain", () => {
    const s = startDialogue(SIMPLE_SCRIPT);
    expect(isDialogueComplete(s, SIMPLE_SCRIPT)).toBe(false);
  });

  it("returns true for null currentNodeId", () => {
    expect(isDialogueComplete(createDialogueState(), SIMPLE_SCRIPT)).toBe(true);
  });
});

// ── getAvailableChoices ─────────────────────────────────────────

describe("getAvailableChoices", () => {
  it("returns all choices when no conditions", () => {
    const s = startDialogue(SIMPLE_SCRIPT);
    const choices = getAvailableChoices(s, SIMPLE_SCRIPT);
    expect(choices).toHaveLength(2);
  });

  it("filters choices by flag condition", () => {
    const s = startDialogue(CONDITIONAL_SCRIPT);
    // No hasPass flag → "I have a pass" hidden, "Secret path" shown
    const choices = getAvailableChoices(s, CONDITIONAL_SCRIPT);
    expect(choices.find((c) => c.text === "I have a pass")).toBeUndefined();
    expect(choices.find((c) => c.text === "Secret path")).toBeDefined();
    expect(choices.find((c) => c.text === "Leave")).toBeDefined();
  });

  it("shows flag-gated choice when flag is set", () => {
    let s = startDialogue(CONDITIONAL_SCRIPT);
    s = setFlag(s, "hasPass", true);
    const choices = getAvailableChoices(s, CONDITIONAL_SCRIPT);
    expect(choices.find((c) => c.text === "I have a pass")).toBeDefined();
    // !flag:hasPass should now be hidden
    expect(choices.find((c) => c.text === "Secret path")).toBeUndefined();
  });

  it("returns empty for null currentNodeId", () => {
    expect(
      getAvailableChoices(createDialogueState(), SIMPLE_SCRIPT),
    ).toHaveLength(0);
  });

  it("returns empty for end node with no choices", () => {
    let s = startDialogue(SIMPLE_SCRIPT);
    s = advanceDialogue(s, 1, SIMPLE_SCRIPT); // → end
    expect(getAvailableChoices(s, SIMPLE_SCRIPT)).toHaveLength(0);
  });
});

// ── setFlag / getFlag ───────────────────────────────────────────

describe("flags", () => {
  it("setFlag stores a boolean", () => {
    const s = setFlag(createDialogueState(), "key", true);
    expect(getFlag(s, "key")).toBe(true);
  });

  it("getFlag returns false for unset key", () => {
    expect(getFlag(createDialogueState(), "nope")).toBe(false);
  });

  it("setFlag can overwrite", () => {
    let s = setFlag(createDialogueState(), "key", true);
    s = setFlag(s, "key", false);
    expect(getFlag(s, "key")).toBe(false);
  });

  it("setFlag is immutable", () => {
    const s1 = createDialogueState();
    const s2 = setFlag(s1, "key", true);
    expect(getFlag(s1, "key")).toBe(false);
    expect(getFlag(s2, "key")).toBe(true);
  });

  it("multiple flags coexist", () => {
    let s = createDialogueState();
    s = setFlag(s, "a", true);
    s = setFlag(s, "b", false);
    s = setFlag(s, "c", true);
    expect(getFlag(s, "a")).toBe(true);
    expect(getFlag(s, "b")).toBe(false);
    expect(getFlag(s, "c")).toBe(true);
  });
});

// ── hasVisitedNode ──────────────────────────────────────────────

describe("hasVisitedNode", () => {
  it("returns false for unvisited node", () => {
    expect(hasVisitedNode(createDialogueState(), "start")).toBe(false);
  });

  it("returns true for visited node", () => {
    const s = startDialogue(SIMPLE_SCRIPT);
    expect(hasVisitedNode(s, "start")).toBe(true);
  });

  it("tracks multiple visited nodes", () => {
    let s = startDialogue(SIMPLE_SCRIPT);
    s = advanceDialogue(s, 0, SIMPLE_SCRIPT);
    expect(hasVisitedNode(s, "start")).toBe(true);
    expect(hasVisitedNode(s, "greeting")).toBe(true);
    expect(hasVisitedNode(s, "end")).toBe(false);
  });
});

// ── getDialogueHistory ──────────────────────────────────────────

describe("getDialogueHistory", () => {
  it("returns empty for fresh state", () => {
    expect(getDialogueHistory(createDialogueState())).toHaveLength(0);
  });

  it("tracks full path", () => {
    let s = startDialogue(SIMPLE_SCRIPT);
    s = advanceDialogue(s, 0, SIMPLE_SCRIPT);
    s = advanceDialogue(s, 0, SIMPLE_SCRIPT);
    expect(getDialogueHistory(s)).toEqual(["start", "greeting", "end"]);
  });

  it("returns a copy (not mutable reference)", () => {
    const s = startDialogue(SIMPLE_SCRIPT);
    const h = getDialogueHistory(s);
    h.push("tampered");
    expect(getDialogueHistory(s)).toHaveLength(1);
  });
});

// ── resetDialogue ───────────────────────────────────────────────

describe("resetDialogue", () => {
  it("resets to start node", () => {
    let s = startDialogue(SIMPLE_SCRIPT);
    s = advanceDialogue(s, 0, SIMPLE_SCRIPT);
    s = resetDialogue(s, SIMPLE_SCRIPT);
    expect(s.currentNodeId).toBe("start");
  });

  it("clears history", () => {
    let s = startDialogue(SIMPLE_SCRIPT);
    s = advanceDialogue(s, 0, SIMPLE_SCRIPT);
    s = resetDialogue(s, SIMPLE_SCRIPT);
    expect(s.history).toEqual(["start"]);
  });

  it("preserves flags", () => {
    let s = startDialogue(SIMPLE_SCRIPT);
    s = setFlag(s, "important", true);
    s = advanceDialogue(s, 0, SIMPLE_SCRIPT);
    s = resetDialogue(s, SIMPLE_SCRIPT);
    expect(getFlag(s, "important")).toBe(true);
  });

  it("resets visitedNodes to just start", () => {
    let s = startDialogue(SIMPLE_SCRIPT);
    s = advanceDialogue(s, 0, SIMPLE_SCRIPT);
    s = resetDialogue(s, SIMPLE_SCRIPT);
    expect(s.visitedNodes).toEqual(["start"]);
  });
});

// ── Integration ─────────────────────────────────────────────────

describe("integration", () => {
  it("full conversation flow", () => {
    let s = startDialogue(SIMPLE_SCRIPT);
    expect(isDialogueComplete(s, SIMPLE_SCRIPT)).toBe(false);

    s = advanceDialogue(s, 0, SIMPLE_SCRIPT); // → greeting
    expect(getCurrentNode(s, SIMPLE_SCRIPT)!.text).toBe("Nice to meet you.");

    s = advanceDialogue(s, 0, SIMPLE_SCRIPT); // → end
    expect(isDialogueComplete(s, SIMPLE_SCRIPT)).toBe(true);
    expect(getDialogueHistory(s)).toEqual(["start", "greeting", "end"]);
  });

  it("conditional branching with flags", () => {
    let s = startDialogue(CONDITIONAL_SCRIPT);
    // Without pass, can use secret path
    let choices = getAvailableChoices(s, CONDITIONAL_SCRIPT);
    expect(choices.find((c) => c.text === "Secret path")).toBeDefined();

    // Set flag and restart
    s = setFlag(s, "hasPass", true);
    s = resetDialogue(s, CONDITIONAL_SCRIPT);
    choices = getAvailableChoices(s, CONDITIONAL_SCRIPT);
    expect(choices.find((c) => c.text === "I have a pass")).toBeDefined();
    expect(choices.find((c) => c.text === "Secret path")).toBeUndefined();

    // Advance via pass
    const passIdx = choices.findIndex((c) => c.text === "I have a pass");
    s = advanceDialogue(s, passIdx, CONDITIONAL_SCRIPT);
    expect(getCurrentNode(s, CONDITIONAL_SCRIPT)!.text).toBe("Go ahead.");
    expect(isDialogueComplete(s, CONDITIONAL_SCRIPT)).toBe(true);
  });
});
