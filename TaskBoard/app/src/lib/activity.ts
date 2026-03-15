import { supabase } from "./supabase";

export interface ActivityEntry {
  id?: string;
  task_id: string | null;
  task_title: string;
  action:
    | "created"
    | "updated"
    | "moved"
    | "completed"
    | "deleted"
    | "restored";
  field_changed?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  created_at?: string;
}

export async function logActivity(
  entry: Omit<ActivityEntry, "id" | "created_at">,
): Promise<void> {
  await supabase.from("activity_log").insert({
    task_id: entry.task_id,
    task_title: entry.task_title,
    action: entry.action,
    field_changed: entry.field_changed ?? null,
    old_value: entry.old_value ?? null,
    new_value: entry.new_value ?? null,
  });
}

export async function fetchActivityLog(
  limit = 20,
  offset = 0,
): Promise<ActivityEntry[]> {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data as ActivityEntry[];
}
