import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface TreeNode {
  name: string;
  type: "dir" | "file";
  path: string;
  children?: TreeNode[];
}

const CONTENT_DIR = path.join(process.cwd(), "content", "docs");
const INDEX_PATH = path.join(process.cwd(), "content", "docs-index.json");

export function getDocsTree(): TreeNode[] {
  const raw = fs.readFileSync(INDEX_PATH, "utf-8");
  return JSON.parse(raw) as TreeNode[];
}

export function getDocFile(
  pathSegments: string[]
): { content: string; frontmatter: Record<string, unknown> } | null {
  const filePath = path.join(CONTENT_DIR, ...pathSegments) + ".md";
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { content, data } = matter(raw);
  return { content, frontmatter: data };
}

export function getAllDocPaths(): string[][] {
  const tree = getDocsTree();
  const paths: string[][] = [];
  function walk(nodes: TreeNode[]) {
    for (const node of nodes) {
      if (node.type === "file") {
        const stripped = node.path.replace(/\.md$/, "");
        paths.push(stripped.split("/"));
      }
      if (node.children) walk(node.children);
    }
  }
  walk(tree);
  return paths;
}

export function countFiles(node: TreeNode): number {
  if (node.type === "file") return 1;
  if (!node.children) return 0;
  return node.children.reduce((sum, child) => sum + countFiles(child), 0);
}

export function getSubtree(
  tree: TreeNode[],
  pathPrefix: string
): TreeNode | null {
  for (const node of tree) {
    if (node.path === pathPrefix) return node;
    if (node.children) {
      const found = getSubtree(node.children, pathPrefix);
      if (found) return found;
    }
  }
  return null;
}
