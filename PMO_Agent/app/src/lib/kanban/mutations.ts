import { KanbanTask, KanbanData, KanbanMutation, TaskStatus } from "./types";
import { STATUS_TRANSITIONS } from "./constants";

/** Apply a mutation to KanbanData, returning a new copy */
export function applyMutation(
  data: KanbanData,
  mutation: KanbanMutation,
): KanbanData {
  const now = new Date().toISOString();
  const tasks = [...data.tasks];

  switch (mutation.type) {
    case "add_task": {
      const id = `TASK-${String(data.next_id).padStart(3, "0")}`;
      const newTask: KanbanTask = {
        id,
        title: mutation.task.title,
        description: mutation.task.description ?? "",
        status: mutation.task.status ?? "backlog",
        priority: mutation.task.priority ?? "mid",
        assignee: mutation.task.assignee ?? null,
        project: mutation.task.project ?? "WanChai",
        division: mutation.task.division ?? "game",
        created_by: mutation.task.created_by ?? "CEO",
        created_at: now,
        updated_at: now,
        due_date: mutation.task.due_date ?? null,
        tags: mutation.task.tags ?? [],
        sprint: mutation.task.sprint ?? null,
        qa_review: null,
        redteam_review: null,
        token_usage: null,
        history: [
          {
            from: null,
            to: mutation.task.status ?? "backlog",
            by: mutation.task.created_by ?? "CEO",
            at: now,
          },
        ],
        parent_id: mutation.task.parent_id ?? null,
        children: [],
        blocked_by: mutation.task.blocked_by ?? [],
        blocks: mutation.task.blocks ?? [],
        start_date: mutation.task.start_date ?? null,
        estimate_hours: mutation.task.estimate_hours ?? null,
      };
      tasks.push(newTask);

      // Update parent's children array
      if (newTask.parent_id) {
        const parentIdx = tasks.findIndex((t) => t.id === newTask.parent_id);
        if (parentIdx >= 0) {
          tasks[parentIdx] = {
            ...tasks[parentIdx],
            children: [...tasks[parentIdx].children, id],
          };
        }
      }

      return { ...data, tasks, next_id: data.next_id + 1, updated_at: now };
    }

    case "update_task": {
      const idx = tasks.findIndex((t) => t.id === mutation.taskId);
      if (idx < 0) return data;
      tasks[idx] = { ...tasks[idx], ...mutation.fields, updated_at: now };
      return { ...data, tasks, updated_at: now };
    }

    case "update_status": {
      const idx = tasks.findIndex((t) => t.id === mutation.taskId);
      if (idx < 0) return data;
      const task = tasks[idx];
      const validNext = STATUS_TRANSITIONS[task.status] ?? [];
      if (!validNext.includes(mutation.newStatus)) return data;
      tasks[idx] = {
        ...task,
        status: mutation.newStatus,
        updated_at: now,
        history: [
          ...task.history,
          {
            from: task.status,
            to: mutation.newStatus,
            by: mutation.by,
            at: now,
          },
        ],
      };
      return { ...data, tasks, updated_at: now };
    }

    case "delete_task": {
      const task = tasks.find((t) => t.id === mutation.taskId);
      if (!task) return data;
      // Remove from parent's children
      if (task.parent_id) {
        const parentIdx = tasks.findIndex((t) => t.id === task.parent_id);
        if (parentIdx >= 0) {
          tasks[parentIdx] = {
            ...tasks[parentIdx],
            children: tasks[parentIdx].children.filter(
              (c) => c !== mutation.taskId,
            ),
          };
        }
      }
      // Remove dependency references
      for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].blocked_by.includes(mutation.taskId)) {
          tasks[i] = {
            ...tasks[i],
            blocked_by: tasks[i].blocked_by.filter(
              (id) => id !== mutation.taskId,
            ),
          };
        }
        if (tasks[i].blocks.includes(mutation.taskId)) {
          tasks[i] = {
            ...tasks[i],
            blocks: tasks[i].blocks.filter((id) => id !== mutation.taskId),
          };
        }
      }
      return {
        ...data,
        tasks: tasks.filter((t) => t.id !== mutation.taskId),
        updated_at: now,
      };
    }

    case "add_dependency": {
      const fromIdx = tasks.findIndex((t) => t.id === mutation.from);
      const toIdx = tasks.findIndex((t) => t.id === mutation.to);
      if (fromIdx < 0 || toIdx < 0) return data;
      // `from` blocks `to` → `to` is blocked_by `from`
      if (!tasks[toIdx].blocked_by.includes(mutation.from)) {
        tasks[toIdx] = {
          ...tasks[toIdx],
          blocked_by: [...tasks[toIdx].blocked_by, mutation.from],
        };
      }
      if (!tasks[fromIdx].blocks.includes(mutation.to)) {
        tasks[fromIdx] = {
          ...tasks[fromIdx],
          blocks: [...tasks[fromIdx].blocks, mutation.to],
        };
      }
      return { ...data, tasks, updated_at: now };
    }

    case "remove_dependency": {
      const fromIdx = tasks.findIndex((t) => t.id === mutation.from);
      const toIdx = tasks.findIndex((t) => t.id === mutation.to);
      if (fromIdx < 0 || toIdx < 0) return data;
      tasks[toIdx] = {
        ...tasks[toIdx],
        blocked_by: tasks[toIdx].blocked_by.filter(
          (id) => id !== mutation.from,
        ),
      };
      tasks[fromIdx] = {
        ...tasks[fromIdx],
        blocks: tasks[fromIdx].blocks.filter((id) => id !== mutation.to),
      };
      return { ...data, tasks, updated_at: now };
    }

    case "set_parent": {
      const idx = tasks.findIndex((t) => t.id === mutation.taskId);
      if (idx < 0) return data;
      const task = tasks[idx];

      // Remove from old parent
      if (task.parent_id) {
        const oldParentIdx = tasks.findIndex((t) => t.id === task.parent_id);
        if (oldParentIdx >= 0) {
          tasks[oldParentIdx] = {
            ...tasks[oldParentIdx],
            children: tasks[oldParentIdx].children.filter(
              (c) => c !== mutation.taskId,
            ),
          };
        }
      }

      // Set new parent
      tasks[idx] = { ...task, parent_id: mutation.parentId, updated_at: now };

      // Add to new parent's children
      if (mutation.parentId) {
        const newParentIdx = tasks.findIndex((t) => t.id === mutation.parentId);
        if (
          newParentIdx >= 0 &&
          !tasks[newParentIdx].children.includes(mutation.taskId)
        ) {
          tasks[newParentIdx] = {
            ...tasks[newParentIdx],
            children: [...tasks[newParentIdx].children, mutation.taskId],
          };
        }
      }

      return { ...data, tasks, updated_at: now };
    }

    default:
      return data;
  }
}
