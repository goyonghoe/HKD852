import { KanbanTask, ColumnConfig, Priority, Division } from "./types";
import { COLUMNS } from "./constants";

export function getTasksForColumn(
  tasks: KanbanTask[],
  column: ColumnConfig,
): KanbanTask[] {
  return tasks
    .filter((t) => column.statuses.includes(t.status))
    .sort((a, b) => {
      const priorityOrder: Record<Priority, number> = {
        critical: 0,
        high: 1,
        mid: 2,
        low: 3,
      };
      const pa = priorityOrder[a.priority];
      const pb = priorityOrder[b.priority];
      if (pa !== pb) return pa - pb;
      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });
}

export function getColumnCounts(tasks: KanbanTask[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const col of COLUMNS) {
    counts[col.id] = tasks.filter((t) =>
      col.statuses.includes(t.status),
    ).length;
  }
  return counts;
}

export function filterTasks(
  tasks: KanbanTask[],
  filters: {
    division?: Division | "all";
    assignee?: string | "all";
    priority?: Priority | "all";
    search?: string;
    sprint?: string | "all";
  },
): KanbanTask[] {
  return tasks.filter((t) => {
    if (
      filters.division &&
      filters.division !== "all" &&
      t.division !== filters.division
    )
      return false;
    if (
      filters.assignee &&
      filters.assignee !== "all" &&
      t.assignee !== filters.assignee
    )
      return false;
    if (
      filters.priority &&
      filters.priority !== "all" &&
      t.priority !== filters.priority
    )
      return false;
    if (
      filters.sprint &&
      filters.sprint !== "all" &&
      t.sprint !== filters.sprint
    )
      return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      return (
        t.id.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        (t.assignee?.toLowerCase().includes(q) ?? false) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return true;
  });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

export function getUniqueSprints(tasks: KanbanTask[]): string[] {
  const sprints = new Set<string>();
  tasks.forEach((t) => {
    if (t.sprint) sprints.add(t.sprint);
  });
  return Array.from(sprints).sort();
}

export function formatTokens(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return String(count);
}

export function getTotalTokensForTasks(tasks: KanbanTask[]): {
  input: number;
  output: number;
  total: number;
} {
  let input = 0;
  let output = 0;
  for (const t of tasks) {
    if (t.token_usage) {
      for (const e of t.token_usage.entries) {
        input += e.input;
        output += e.output;
      }
    }
  }
  return { input, output, total: input + output };
}

export function getDivisionStats(
  tasks: KanbanTask[],
): Record<string, { total: number; done: number; inProgress: number }> {
  const stats: Record<
    string,
    { total: number; done: number; inProgress: number }
  > = {};
  for (const t of tasks) {
    if (!stats[t.division])
      stats[t.division] = { total: 0, done: 0, inProgress: 0 };
    stats[t.division].total++;
    if (t.status === "final_done" || t.status === "qa_passed")
      stats[t.division].done++;
    if (t.status === "in_progress") stats[t.division].inProgress++;
  }
  return stats;
}

export function isBlocked(task: KanbanTask, tasks: KanbanTask[]): boolean {
  if (!task.blocked_by || task.blocked_by.length === 0) return false;
  return task.blocked_by.some((id) => {
    const blocker = tasks.find((t) => t.id === id);
    return (
      blocker &&
      blocker.status !== "final_done" &&
      blocker.status !== "qa_passed"
    );
  });
}
