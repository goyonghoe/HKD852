import { KanbanTask, TreeNode } from "./types";

/** Build a tree from flat task array */
export function buildTree(tasks: KanbanTask[]): TreeNode[] {
  const taskMap = new Map<string, KanbanTask>();
  for (const t of tasks) taskMap.set(t.id, t);

  const roots: TreeNode[] = [];

  function buildNode(task: KanbanTask, depth: number): TreeNode {
    const childNodes = task.children
      .map((id) => taskMap.get(id))
      .filter((t): t is KanbanTask => t != null)
      .map((t) => buildNode(t, depth + 1));
    return { task, children: childNodes, depth };
  }

  for (const task of tasks) {
    if (!task.parent_id) {
      roots.push(buildNode(task, 0));
    }
  }

  return roots;
}

/** Flatten a tree into a sorted array for table rendering */
export function flattenTree(
  nodes: TreeNode[],
  expandedIds: Set<string>,
): { task: KanbanTask; depth: number }[] {
  const result: { task: KanbanTask; depth: number }[] = [];

  function walk(node: TreeNode) {
    result.push({ task: node.task, depth: node.depth });
    if (expandedIds.has(node.task.id)) {
      for (const child of node.children) {
        walk(child);
      }
    }
  }

  for (const root of nodes) {
    walk(root);
  }

  return result;
}

/** Get all ancestor IDs of a task */
export function getAncestors(taskId: string, tasks: KanbanTask[]): string[] {
  const taskMap = new Map<string, KanbanTask>();
  for (const t of tasks) taskMap.set(t.id, t);

  const ancestors: string[] = [];
  let current = taskMap.get(taskId);
  while (current?.parent_id) {
    ancestors.push(current.parent_id);
    current = taskMap.get(current.parent_id);
  }
  return ancestors;
}

/** Get all descendant IDs of a task */
export function getDescendants(taskId: string, tasks: KanbanTask[]): string[] {
  const taskMap = new Map<string, KanbanTask>();
  for (const t of tasks) taskMap.set(t.id, t);

  const descendants: string[] = [];
  const stack = [taskId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    const task = taskMap.get(id);
    if (task) {
      for (const childId of task.children) {
        descendants.push(childId);
        stack.push(childId);
      }
    }
  }
  return descendants;
}
