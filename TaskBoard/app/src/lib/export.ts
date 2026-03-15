import type { Task } from "./database.types";

function escapeCSV(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export function exportTasksCSV(tasks: Task[]): string {
  const headers = [
    "title",
    "status",
    "priority",
    "tags",
    "scheduled_date",
    "scheduled_start",
    "scheduled_end",
    "estimated_hours",
    "notes",
    "created_at",
    "completed_at",
  ];

  const rows = tasks.map((t) =>
    [
      escapeCSV(t.title),
      t.status,
      t.priority ?? "",
      escapeCSV((t.tags ?? []).join("; ")),
      t.scheduled_date ?? "",
      t.scheduled_start ?? "",
      t.scheduled_end ?? "",
      t.estimated_hours?.toString() ?? "",
      escapeCSV(t.notes ?? ""),
      t.created_at,
      t.completed_at ?? "",
    ].join(","),
  );

  return [headers.join(","), ...rows].join("\n");
}

export function exportTasksICS(tasks: Task[]): string {
  const scheduled = tasks.filter((t) => t.scheduled_date);

  const formatDate = (d: string) => d.replace(/-/g, "");
  const formatDateTime = (d: string) => {
    // "2026-03-15T10:00" => "20260315T100000"
    const clean = d.replace(/[-:]/g, "");
    // Ensure it has seconds
    return clean.length === 13 ? clean + "00" : clean;
  };

  const events = scheduled.map((t) => {
    const uid = `${t.id}@taskboard`;
    const summary = t.title.replace(/\\/g, "\\\\").replace(/[,;]/g, "\\$&");
    const description = (t.notes ?? "")
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/[,;]/g, "\\$&");

    let dtPart: string;
    if (t.scheduled_start && t.scheduled_end) {
      dtPart = `DTSTART:${formatDateTime(t.scheduled_start)}\nDTEND:${formatDateTime(t.scheduled_end)}`;
    } else if (t.scheduled_start) {
      dtPart = `DTSTART:${formatDateTime(t.scheduled_start)}\nDTEND:${formatDateTime(t.scheduled_start)}`;
    } else {
      // All-day event
      const nextDay = new Date(t.scheduled_date! + "T00:00:00");
      nextDay.setDate(nextDay.getDate() + 1);
      const nd = nextDay.toISOString().slice(0, 10);
      dtPart = `DTSTART;VALUE=DATE:${formatDate(t.scheduled_date!)}\nDTEND;VALUE=DATE:${formatDate(nd)}`;
    }

    return [
      "BEGIN:VEVENT",
      `UID:${uid}`,
      dtPart,
      `SUMMARY:${summary}`,
      description ? `DESCRIPTION:${description}` : "",
      t.priority ? `CATEGORIES:${t.priority}` : "",
      "END:VEVENT",
    ]
      .filter(Boolean)
      .join("\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TaskBoard//EN",
    "CALSCALE:GREGORIAN",
    ...events,
    "END:VCALENDAR",
  ].join("\n");
}

const STATUS_ORDER: Task["status"][] = [
  "in_progress",
  "today",
  "thisweek",
  "backlog",
  "waiting",
  "done",
];

const STATUS_LABELS: Record<Task["status"], string> = {
  in_progress: "In Progress",
  today: "Today",
  thisweek: "This Week",
  backlog: "Backlog",
  waiting: "Waiting",
  done: "Done",
};

export function exportTasksMarkdown(tasks: Task[]): string {
  const today = new Date().toISOString().slice(0, 10);
  const lines: string[] = [
    "# Ultra Task Board Export",
    `> Exported: ${today}`,
    "",
  ];

  // Build parent-child map
  const childMap = new Map<string, Task[]>();
  const topLevel: Task[] = [];
  for (const t of tasks) {
    if (t.parent_id) {
      const children = childMap.get(t.parent_id) || [];
      children.push(t);
      childMap.set(t.parent_id, children);
    } else {
      topLevel.push(t);
    }
  }

  // Group top-level by status
  const grouped: Record<string, Task[]> = {};
  for (const t of topLevel) {
    (grouped[t.status] ??= []).push(t);
  }

  for (const status of STATUS_ORDER) {
    const group = grouped[status];
    if (!group?.length) continue;

    lines.push(`## ${STATUS_LABELS[status]}`, "");

    for (const task of group) {
      lines.push(formatTaskLine(task, 0));
      const children = childMap.get(task.id);
      if (children) {
        for (const child of children) {
          lines.push(formatTaskLine(child, 1));
        }
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

function formatTaskLine(task: Task, indent: number): string {
  const prefix = "  ".repeat(indent);
  const checkbox = task.status === "done" ? "[x]" : "[ ]";
  let line = `${prefix}- ${checkbox} ${task.title}`;

  if (task.priority) line += ` @${task.priority}`;
  if (task.tags?.length) line += " " + task.tags.map((t) => `#${t}`).join(" ");
  if (task.estimated_hours) line += ` (${task.estimated_hours}h)`;
  if (task.scheduled_date) line += ` \u{1F4C5} ${task.scheduled_date}`;

  return line;
}

export function exportTasksJSON(tasks: Task[]): string {
  return JSON.stringify(tasks, null, 2);
}

export function downloadFile(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
