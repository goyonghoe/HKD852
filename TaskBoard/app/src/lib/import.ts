import type { TaskStatus, TaskPriority } from "./database.types";

export interface ParsedTask {
  title: string;
  status: TaskStatus;
  priority: TaskPriority | null;
  tags: string[];
  estimated_hours: number | null;
  scheduled_date: string | null;
  isSubtask: boolean;
}

const STATUS_MAP: Record<string, TaskStatus> = {
  "in progress": "in_progress",
  today: "today",
  "this week": "thisweek",
  backlog: "backlog",
  waiting: "waiting",
  done: "done",
};

export function parseMarkdown(text: string): ParsedTask[] {
  const lines = text.split("\n");
  const tasks: ParsedTask[] = [];
  let currentStatus: TaskStatus = "backlog";

  for (const line of lines) {
    // Detect section headers like "## In Progress"
    const headerMatch = line.match(/^##\s+(.+)/);
    if (headerMatch) {
      const label = headerMatch[1].trim().toLowerCase();
      if (label in STATUS_MAP) {
        currentStatus = STATUS_MAP[label];
      }
      continue;
    }

    // Parse task lines: "- [x] Title @priority #tag (2h) 📅 2026-03-15"
    // Also support indented subtasks and plain "- Title"
    const taskMatch = line.match(/^(\s*)- (?:\[([ x])\] )?(.+)/);
    if (!taskMatch) continue;

    const indent = taskMatch[1].length;
    const checked = taskMatch[2] === "x";
    let rest = taskMatch[3].trim();

    // Extract scheduled date (📅 YYYY-MM-DD)
    let scheduled_date: string | null = null;
    const dateMatch = rest.match(/\u{1F4C5}\s*(\d{4}-\d{2}-\d{2})/u);
    if (dateMatch) {
      scheduled_date = dateMatch[1];
      rest = rest.replace(dateMatch[0], "").trim();
    }

    // Extract estimated hours (Xh)
    let estimated_hours: number | null = null;
    const hoursMatch = rest.match(/\((\d+(?:\.\d+)?)h\)/);
    if (hoursMatch) {
      estimated_hours = parseFloat(hoursMatch[1]);
      rest = rest.replace(hoursMatch[0], "").trim();
    }

    // Extract tags (#tag)
    const tags: string[] = [];
    const tagRegex = /#(\S+)/g;
    let tagMatch;
    while ((tagMatch = tagRegex.exec(rest)) !== null) {
      tags.push(tagMatch[1]);
    }
    rest = rest.replace(/#\S+/g, "").trim();

    // Extract priority (@critical, @high, @mid, @low)
    let priority: TaskPriority | null = null;
    const prioMatch = rest.match(/@(critical|high|mid|low)/);
    if (prioMatch) {
      priority = prioMatch[1] as TaskPriority;
      rest = rest.replace(prioMatch[0], "").trim();
    }

    const title = rest.replace(/\s+/g, " ").trim();
    if (!title) continue;

    const status: TaskStatus = checked ? "done" : currentStatus;
    const isSubtask = indent >= 2;

    tasks.push({
      title,
      status,
      priority,
      tags,
      estimated_hours,
      scheduled_date,
      isSubtask,
    });
  }

  return tasks;
}

export function parseJSON(text: string): ParsedTask[] {
  const data = JSON.parse(text);
  const arr = Array.isArray(data) ? data : [data];

  return arr.map((item) => ({
    title: item.title || "Untitled",
    status: item.status || "backlog",
    priority: item.priority || null,
    tags: Array.isArray(item.tags) ? item.tags : [],
    estimated_hours: item.estimated_hours ?? null,
    scheduled_date: item.scheduled_date ?? null,
    isSubtask: !!item.parent_id,
  }));
}
