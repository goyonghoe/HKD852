"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
} from "react";
import { KanbanData, KanbanTask, KanbanMutation, ViewMode } from "./types";
import { applyMutation } from "./mutations";

interface KanbanState {
  data: KanbanData;
  viewMode: ViewMode;
  selectedTaskId: string | null;
  expandedIds: Set<string>;
}

type KanbanAction =
  | { type: "SET_DATA"; data: KanbanData }
  | { type: "APPLY_MUTATION"; mutation: KanbanMutation }
  | { type: "SET_VIEW_MODE"; mode: ViewMode }
  | { type: "SELECT_TASK"; taskId: string | null }
  | { type: "TOGGLE_EXPANDED"; taskId: string }
  | { type: "ROLLBACK"; data: KanbanData };

function reducer(state: KanbanState, action: KanbanAction): KanbanState {
  switch (action.type) {
    case "SET_DATA":
      return { ...state, data: action.data };
    case "APPLY_MUTATION":
      return { ...state, data: applyMutation(state.data, action.mutation) };
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.mode };
    case "SELECT_TASK":
      return { ...state, selectedTaskId: action.taskId };
    case "TOGGLE_EXPANDED": {
      const next = new Set(state.expandedIds);
      if (next.has(action.taskId)) next.delete(action.taskId);
      else next.add(action.taskId);
      return { ...state, expandedIds: next };
    }
    case "ROLLBACK":
      return { ...state, data: action.data };
    default:
      return state;
  }
}

interface KanbanContextValue {
  data: KanbanData;
  tasks: KanbanTask[];
  viewMode: ViewMode;
  selectedTaskId: string | null;
  selectedTask: KanbanTask | null;
  expandedIds: Set<string>;
  mutate: (mutation: KanbanMutation) => Promise<void>;
  setViewMode: (mode: ViewMode) => void;
  selectTask: (taskId: string | null) => void;
  toggleExpanded: (taskId: string) => void;
}

const KanbanContext = createContext<KanbanContextValue | null>(null);

interface KanbanProviderProps {
  initialData: KanbanData;
  children: React.ReactNode;
}

export function KanbanProvider({ initialData, children }: KanbanProviderProps) {
  const [state, dispatch] = useReducer(reducer, {
    data: initialData,
    viewMode: "board",
    selectedTaskId: null,
    expandedIds: new Set<string>(),
  });

  const snapshotRef = useRef<KanbanData>(initialData);

  const mutate = useCallback(
    async (mutation: KanbanMutation) => {
      // Save snapshot for rollback
      snapshotRef.current = state.data;
      // Optimistic update
      dispatch({ type: "APPLY_MUTATION", mutation });

      try {
        const res = await fetch("/api/kanban", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mutation),
        });
        if (!res.ok) {
          dispatch({ type: "ROLLBACK", data: snapshotRef.current });
        }
      } catch {
        // Network error — keep optimistic state (offline-first)
      }
    },
    [state.data],
  );

  const setViewMode = useCallback((mode: ViewMode) => {
    dispatch({ type: "SET_VIEW_MODE", mode });
  }, []);

  const selectTask = useCallback((taskId: string | null) => {
    dispatch({ type: "SELECT_TASK", taskId });
  }, []);

  const toggleExpanded = useCallback((taskId: string) => {
    dispatch({ type: "TOGGLE_EXPANDED", taskId });
  }, []);

  const selectedTask = state.selectedTaskId
    ? (state.data.tasks.find((t) => t.id === state.selectedTaskId) ?? null)
    : null;

  return (
    <KanbanContext.Provider
      value={{
        data: state.data,
        tasks: state.data.tasks,
        viewMode: state.viewMode,
        selectedTaskId: state.selectedTaskId,
        selectedTask,
        expandedIds: state.expandedIds,
        mutate,
        setViewMode,
        selectTask,
        toggleExpanded,
      }}
    >
      {children}
    </KanbanContext.Provider>
  );
}

export function useKanban(): KanbanContextValue {
  const ctx = useContext(KanbanContext);
  if (!ctx) throw new Error("useKanban must be used within KanbanProvider");
  return ctx;
}
