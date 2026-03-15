import { supabase } from "./supabase";
import type { TaskStatus, TaskPriority } from "./database.types";
import { createTask, updateTask } from "./tasks";

export interface TemplateItem {
  title: string;
  priority: TaskPriority | null;
  tags: string[];
  estimated_hours: number | null;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description: string | null;
  items: TemplateItem[];
  created_at: string;
  updated_at: string;
}

export async function fetchTemplates(): Promise<TaskTemplate[]> {
  const { data, error } = await supabase
    .from("task_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as TaskTemplate[];
}

export async function createTemplate(
  name: string,
  description: string | null,
  items: TemplateItem[],
): Promise<TaskTemplate> {
  const { data, error } = await supabase
    .from("task_templates")
    .insert({ name, description, items })
    .select()
    .single();

  if (error) throw error;
  return data as TaskTemplate;
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase.from("task_templates").delete().eq("id", id);
  if (error) throw error;
}

export async function applyTemplate(
  templateId: string,
  targetStatus: TaskStatus,
): Promise<void> {
  // Fetch template
  const { data, error } = await supabase
    .from("task_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (error) throw error;

  const template = data as TaskTemplate;
  const items = template.items as TemplateItem[];

  // Create tasks sequentially to maintain order
  for (const item of items) {
    const task = await createTask(item.title, targetStatus);
    const updates: Record<string, unknown> = {};
    if (item.priority) updates.priority = item.priority;
    if (item.tags?.length) updates.tags = item.tags;
    if (item.estimated_hours) updates.estimated_hours = item.estimated_hours;

    if (Object.keys(updates).length > 0) {
      await updateTask(task.id, updates as Parameters<typeof updateTask>[1]);
    }
  }
}
