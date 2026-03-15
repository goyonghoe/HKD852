import { supabase } from "./supabase";
import type { Task, TaskStatus } from "./database.types";
import { logActivity } from "./activity";

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export async function fetchTasks(includeArchived = false): Promise<Task[]> {
  let query = supabase
    .from("tasks")
    .select("*")
    .order("sort_order", { ascending: true });

  if (!includeArchived) {
    query = query.eq("is_archived", false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Task[];
}

export async function fetchArchivedTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("is_archived", true)
    .order("archived_at", { ascending: false });

  if (error) throw error;
  return data as Task[];
}

export async function archiveTask(id: string): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .update({ is_archived: true, archived_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  logActivity({
    task_id: id,
    task_title: (data as Task).title,
    action: "updated",
    field_changed: "is_archived",
    old_value: "false",
    new_value: "true",
  }).catch(() => {});

  return data as Task;
}

export async function unarchiveTask(id: string): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .update({ is_archived: false, archived_at: null })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function archiveDoneTasks(olderThanDays = 3): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  const { data, error } = await supabase
    .from("tasks")
    .update({ is_archived: true, archived_at: new Date().toISOString() })
    .eq("status", "done")
    .eq("is_archived", false)
    .lt("completed_at", cutoff.toISOString())
    .select("id");

  if (error) throw error;
  return data?.length ?? 0;
}

export async function archiveAllDone(): Promise<number> {
  const { data, error } = await supabase
    .from("tasks")
    .update({ is_archived: true, archived_at: new Date().toISOString() })
    .eq("status", "done")
    .eq("is_archived", false)
    .select("id");

  if (error) throw error;
  return data?.length ?? 0;
}

export async function createTask(
  title: string,
  status: TaskStatus = "backlog",
): Promise<Task> {
  // Get max sort_order for this status
  const { data: existing } = await supabase
    .from("tasks")
    .select("sort_order")
    .eq("status", status)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder =
    existing && existing.length > 0
      ? (existing[0] as { sort_order: number }).sort_order + 1
      : 0;

  const user_id = await getCurrentUserId();

  const { data, error } = await supabase
    .from("tasks")
    .insert({ title, status, sort_order: nextOrder, tags: [], user_id })
    .select()
    .single();

  if (error) throw error;
  const task = data as Task;

  // Log activity
  logActivity({
    task_id: task.id,
    task_title: task.title,
    action: "created",
    new_value: status,
  }).catch(() => {});

  return task;
}

export async function updateTask(
  id: string,
  updates: Partial<
    Pick<
      Task,
      | "title"
      | "notes"
      | "status"
      | "priority"
      | "estimated_hours"
      | "actual_hours"
      | "tags"
      | "sort_order"
      | "scheduled_date"
      | "scheduled_start"
      | "scheduled_end"
      | "started_at"
      | "completed_at"
      | "recurrence"
      | "parent_id"
      | "is_pinned"
      | "blocked_by"
      | "is_archived"
      | "archived_at"
    >
  >,
  { skipActivityLog = false }: { skipActivityLog?: boolean } = {},
): Promise<Task> {
  // Fetch original for activity logging
  const { data: original } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single();

  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  const task = data as Task;

  // Log field changes (skip sort_order-only updates, skip when caller handles logging)
  if (original && !skipActivityLog) {
    const orig = original as Task;
    const fieldsToTrack: (keyof typeof updates)[] = [
      "title",
      "notes",
      "status",
      "priority",
      "estimated_hours",
      "actual_hours",
      "scheduled_date",
      "recurrence",
    ];
    for (const field of fieldsToTrack) {
      if (
        field in updates &&
        String(updates[field] ?? "") !== String(orig[field] ?? "")
      ) {
        logActivity({
          task_id: id,
          task_title: task.title,
          action: "updated",
          field_changed: field,
          old_value: orig[field] != null ? String(orig[field]) : null,
          new_value: updates[field] != null ? String(updates[field]) : null,
        }).catch(() => {});
      }
    }
  }

  return task;
}

export async function deleteTask(id: string): Promise<void> {
  // Fetch task title for logging before deleting
  const { data: taskData } = await supabase
    .from("tasks")
    .select("title")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;

  if (taskData) {
    logActivity({
      task_id: null,
      task_title: (taskData as { title: string }).title,
      action: "deleted",
    }).catch(() => {});
  }
}

export async function moveTask(
  id: string,
  newStatus: TaskStatus,
): Promise<Task> {
  // Fetch original status for move logging
  const { data: original } = await supabase
    .from("tasks")
    .select("status, title")
    .eq("id", id)
    .single();

  const updates: Record<string, unknown> = { status: newStatus };

  // Auto-set timestamps
  if (newStatus === "in_progress") {
    updates.started_at = new Date().toISOString();
  } else if (newStatus === "done") {
    updates.completed_at = new Date().toISOString();
  }

  const task = await updateTask(id, updates as Partial<Task>, {
    skipActivityLog: true,
  });

  // Log move activity
  if (original) {
    const orig = original as { status: string; title: string };
    if (orig.status !== newStatus) {
      logActivity({
        task_id: id,
        task_title: orig.title,
        action: newStatus === "done" ? "completed" : "moved",
        field_changed: "status",
        old_value: orig.status,
        new_value: newStatus,
      }).catch(() => {});
    }
  }

  return task;
}

// --- Subtask helpers ---

export async function createSubtask(
  parentId: string,
  title: string,
): Promise<Task> {
  const { data: existing } = await supabase
    .from("tasks")
    .select("sort_order")
    .eq("parent_id", parentId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder =
    existing && existing.length > 0
      ? (existing[0] as { sort_order: number }).sort_order + 1
      : 0;

  const user_id = await getCurrentUserId();

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title,
      status: "today" as TaskStatus,
      sort_order: nextOrder,
      tags: [],
      parent_id: parentId,
      user_id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function getSubtasks(parentId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("parent_id", parentId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data as Task[];
}

export function groupByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const groups: Record<TaskStatus, Task[]> = {
    backlog: [],
    thisweek: [],
    today: [],
    in_progress: [],
    waiting: [],
    done: [],
  };

  for (const task of tasks) {
    groups[task.status].push(task);
  }

  return groups;
}
