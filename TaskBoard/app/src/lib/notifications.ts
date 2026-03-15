import type { Task } from "./database.types";

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  return result === "granted";
}

export function isNotificationPermitted(): boolean {
  if (!("Notification" in window)) return false;
  return Notification.permission === "granted";
}

export function isNotificationDenied(): boolean {
  if (!("Notification" in window)) return false;
  return Notification.permission === "denied";
}

export function scheduleTaskReminder(task: Task): void {
  if (!isNotificationPermitted()) return;

  const isOverdue = isTaskOverdue(task);
  const isDueToday = isTaskDueToday(task);

  let body: string;
  if (isOverdue) {
    body = `Overdue: "${task.title}"`;
  } else if (isDueToday) {
    body = `Due today: "${task.title}"`;
  } else {
    return;
  }

  const notification = new Notification("TaskBoard", {
    body,
    icon: "/icon-192.png",
    tag: `task-${task.id}`,
    silent: false,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}

export function checkDueTasks(tasks: Task[]): Task[] {
  return tasks.filter(
    (task) =>
      task.status !== "done" &&
      task.scheduled_date &&
      (isTaskDueToday(task) || isTaskOverdue(task)),
  );
}

export function isTaskDueToday(task: Task): boolean {
  if (!task.scheduled_date) return false;
  const today = new Date().toISOString().split("T")[0];
  return task.scheduled_date === today;
}

export function isTaskOverdue(task: Task): boolean {
  if (!task.scheduled_date || task.status === "done") return false;
  const today = new Date().toISOString().split("T")[0];
  return task.scheduled_date < today;
}

// Track which tasks we've already notified about this session
const notifiedTasks = new Set<string>();

export function notifyDueTasks(tasks: Task[]): void {
  const dueTasks = checkDueTasks(tasks);
  for (const task of dueTasks) {
    if (!notifiedTasks.has(task.id)) {
      scheduleTaskReminder(task);
      notifiedTasks.add(task.id);
    }
  }
}
