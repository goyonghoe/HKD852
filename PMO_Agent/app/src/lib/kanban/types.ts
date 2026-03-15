export type TaskStatus =
  | "backlog"
  | "in_progress"
  | "done"
  | "qa_fail"
  | "qa_passed"
  | "redteam_reject"
  | "final_done";

export type Priority = "critical" | "high" | "mid" | "low";

export type Division = "game" | "business" | "support" | "direct";

export interface QAReview {
  score: number;
  breakdown: {
    completeness: number;
    fidelity: number;
    maintainability: number;
    compliance: number;
  };
  feedback: string;
  reviewed_at: string;
  reviewed_by: string;
}

export interface RedTeamFinding {
  severity: "low" | "mid" | "high" | "critical";
  category: string;
  detail: string;
}

export interface RedTeamReview {
  verdict: "APPROVE" | "REJECT";
  findings: RedTeamFinding[];
  summary: string;
  reviewed_at: string;
  reviewed_by: string;
}

export interface HistoryEntry {
  from: TaskStatus | null;
  to: TaskStatus;
  by: string;
  at: string;
  note?: string;
}

export interface TokenEntry {
  phase: string;
  input: number;
  output: number;
  model: string;
  by: string;
  at: string;
}

export interface TokenUsage {
  total_tokens: number;
  entries: TokenEntry[];
}

export interface KanbanTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assignee: string | null;
  project: string;
  division: Division;
  created_by: string;
  created_at: string;
  updated_at: string;
  due_date: string | null;
  tags: string[];
  sprint: string | null;
  qa_review: QAReview | null;
  redteam_review: RedTeamReview | null;
  token_usage: TokenUsage | null;
  history: HistoryEntry[];
  parent_id: string | null;
  children: string[];
  blocked_by: string[];
  blocks: string[];
  start_date: string | null;
  estimate_hours: number | null;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  summary: string;
  changes: string[];
}

export interface TokenBudget {
  monthly_limit: number | null;
  used_this_month: number;
  reset_date: string;
}

export interface KanbanData {
  version: string;
  updated_at: string;
  deployed_at: string;
  next_id: number;
  token_budget: TokenBudget | null;
  changelog: ChangelogEntry[];
  tasks: KanbanTask[];
}

export type ColumnId =
  | "backlog"
  | "in_progress"
  | "review"
  | "qa_passed"
  | "final_done";

export interface ColumnConfig {
  id: ColumnId;
  label: string;
  statuses: TaskStatus[];
  color: string;
  bgColor: string;
}

export type ViewTab = "board" | "task-history" | "version-history";

export type ViewMode = "board" | "table" | "timeline" | "dashboard";

export interface TreeNode {
  task: KanbanTask;
  children: TreeNode[];
  depth: number;
}

export type KanbanMutation =
  | { type: "add_task"; task: Partial<KanbanTask> & { title: string } }
  | { type: "update_task"; taskId: string; fields: Partial<KanbanTask> }
  | { type: "update_status"; taskId: string; newStatus: TaskStatus; by: string }
  | { type: "delete_task"; taskId: string }
  | { type: "add_dependency"; from: string; to: string }
  | { type: "remove_dependency"; from: string; to: string }
  | { type: "set_parent"; taskId: string; parentId: string | null };
