import { supabase } from "./supabase";
import type { Task, TaskStatus } from "./database.types";

/**
 * When a recurring task is marked "done":
 * 1. Keep the completed task as-is
 * 2. Create a new copy with status="today", new scheduled_date based on recurrence
 */
export async function handleRecurringCompletion(
  task: Task,
): Promise<Task | null> {
  if (!task.recurrence) return null;

  const baseDate = task.scheduled_date
    ? new Date(task.scheduled_date + "T00:00:00")
    : new Date();

  let nextDate: Date;
  switch (task.recurrence) {
    case "daily":
      nextDate = new Date(baseDate);
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case "weekly":
      nextDate = new Date(baseDate);
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case "monthly":
      nextDate = new Date(baseDate);
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    default:
      return null;
  }

  const scheduledDate = nextDate.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: task.title,
      notes: task.notes,
      status: "today" as TaskStatus,
      priority: task.priority,
      estimated_hours: task.estimated_hours,
      tags: task.tags,
      sort_order: 0,
      scheduled_date: scheduledDate,
      scheduled_start: task.scheduled_start,
      scheduled_end: task.scheduled_end,
      recurrence: task.recurrence,
      recurrence_source_id: task.recurrence_source_id || task.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}
