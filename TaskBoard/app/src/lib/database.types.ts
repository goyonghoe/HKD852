export type TaskStatus =
  | "backlog"
  | "thisweek"
  | "today"
  | "in_progress"
  | "waiting"
  | "done";
export type TaskPriority = "critical" | "high" | "mid" | "low";

export interface Task {
  id: string;
  title: string;
  notes: string | null;
  status: TaskStatus;
  priority: TaskPriority | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  tags: string[];
  sort_order: number;
  scheduled_date: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  parent_id: string | null;
  recurrence: "daily" | "weekly" | "monthly" | null;
  recurrence_source_id: string | null;
  is_pinned: boolean;
  blocked_by: string[];
  user_id: string;
  task_number: number;
  is_archived: boolean;
  archived_at: string | null;
}

export interface TimeLog {
  id: string;
  task_id: string;
  estimated_hours: number;
  actual_hours: number;
  ratio: number;
  category: string;
  logged_at: string;
}

export interface Settings {
  id: number;
  correction_factor: number;
  daily_capacity_hours: number;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: Task;
        Insert: Omit<
          Task,
          | "id"
          | "created_at"
          | "updated_at"
          | "task_number"
          | "is_archived"
          | "archived_at"
        > & {
          id?: string;
        };
        Update: Partial<Omit<Task, "id" | "created_at">>;
      };
      time_logs: {
        Row: TimeLog;
        Insert: Omit<TimeLog, "id" | "logged_at"> & { id?: string };
        Update: Partial<Omit<TimeLog, "id">>;
      };
      settings: {
        Row: Settings;
        Insert: Omit<Settings, "id" | "updated_at">;
        Update: Partial<Omit<Settings, "id">>;
      };
    };
  };
}
