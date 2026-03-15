import { KanbanTask } from "./types";

/** Normalize raw JSON task to match KanbanTask shape (fill missing optional fields) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeTask(raw: any): KanbanTask {
  const t = raw ?? {};
  const pri = t.priority === "medium" ? "mid" : (t.priority ?? "mid");

  // Normalize redteam_review findings
  let rtReview = t.redteam_review ?? null;
  if (rtReview) {
    rtReview = {
      verdict: rtReview.verdict ?? "APPROVE",
      summary: rtReview.summary ?? "",
      reviewed_at: rtReview.reviewed_at ?? "",
      reviewed_by: rtReview.reviewed_by ?? "",
      findings: Array.isArray(rtReview.findings)
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          rtReview.findings.map((f: any) => ({
            severity: f.severity ?? "low",
            category: f.category ?? "",
            detail: f.detail ?? f.description ?? f.title ?? "",
          }))
        : [],
    };
  }

  // Normalize qa_review
  let qaReview = t.qa_review ?? null;
  if (qaReview) {
    const bd = qaReview.breakdown ?? {};
    qaReview = {
      score: qaReview.score ?? 0,
      breakdown: {
        completeness: bd.completeness ?? 0,
        fidelity: bd.fidelity ?? 0,
        maintainability: bd.maintainability ?? 0,
        compliance: bd.compliance ?? 0,
      },
      feedback: qaReview.feedback ?? "",
      reviewed_at: qaReview.reviewed_at ?? "",
      reviewed_by: qaReview.reviewed_by ?? "",
    };
  }

  // Normalize token_usage
  let tokenUsage = t.token_usage ?? null;
  if (
    tokenUsage &&
    typeof tokenUsage === "object" &&
    !Array.isArray(tokenUsage) &&
    tokenUsage.total_tokens != null
  ) {
    tokenUsage = {
      total_tokens: tokenUsage.total_tokens ?? 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      entries: Array.isArray(tokenUsage.entries)
        ? tokenUsage.entries.map((e: any) => ({
            phase: e.phase ?? "",
            input: e.input ?? 0,
            output: e.output ?? 0,
            model: e.model ?? "",
            by: e.by ?? "",
            at: e.at ?? "",
          }))
        : [],
    };
  } else {
    tokenUsage = null;
  }

  // Normalize history
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const history = Array.isArray(t.history)
    ? t.history.map((h: any) => ({
        from: h.from ?? null,
        to:
          h.to ??
          h.status ??
          (h.action === "created"
            ? (t.status ?? "backlog")
            : (t.status ?? "backlog")),
        by: h.by ?? "",
        at: h.at ?? h.timestamp ?? "",
        note: h.note ?? undefined,
      }))
    : [];

  return {
    id: t.id ?? "",
    title: t.title ?? "",
    description: t.description ?? "",
    status: t.status ?? "backlog",
    priority: pri,
    assignee: t.assignee ?? null,
    project: t.project ?? "",
    division: t.division ?? "game",
    created_by: t.created_by ?? "",
    created_at: t.created_at ?? "",
    updated_at: t.updated_at ?? t.created_at ?? "",
    due_date: t.due_date ?? null,
    tags: Array.isArray(t.tags) ? t.tags : [],
    sprint: t.sprint ?? null,
    qa_review: qaReview,
    redteam_review: rtReview,
    token_usage: tokenUsage,
    history,
    // Tree fields
    parent_id: t.parent_id ?? null,
    children: Array.isArray(t.children) ? t.children : [],
    // Dependency fields
    blocked_by: Array.isArray(t.blocked_by) ? t.blocked_by : [],
    blocks: Array.isArray(t.blocks) ? t.blocks : [],
    // Timeline fields
    start_date: t.start_date ?? null,
    estimate_hours: t.estimate_hours ?? null,
  } as KanbanTask;
}
