"use client";

import { useState } from "react";
import type { TreeNode } from "@/lib/docs";

export default function FileTree({
  tree,
  basePath,
  currentPath,
}: {
  tree: TreeNode[];
  basePath?: string;
  currentPath?: string;
}) {
  return (
    <ul className="text-sm" style={{ color: "var(--text-secondary)" }}>
      {tree.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          depth={0}
          currentPath={currentPath}
        />
      ))}
    </ul>
  );
}

function FileTreeNode({
  node,
  depth,
  currentPath,
}: {
  node: TreeNode;
  depth: number;
  currentPath?: string;
}) {
  const [open, setOpen] = useState(false);
  const paddingLeft = depth * 16 + 4;

  if (node.type === "file") {
    const href = `/docs/${node.path.replace(/\.md$/, "")}`;
    const isActive = currentPath === node.path.replace(/\.md$/, "");
    return (
      <li>
        <a
          href={href}
          className="block py-0.5 rounded transition-colors"
          style={{
            paddingLeft,
            color: isActive ? "var(--accent)" : "var(--text-secondary)",
            backgroundColor: isActive ? "var(--bg-secondary)" : "transparent",
          }}
        >
          <span style={{ marginRight: 6, opacity: 0.5 }}>&#9643;</span>
          {node.name}
        </a>
      </li>
    );
  }

  return (
    <li>
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left py-0.5 rounded transition-colors"
        style={{
          paddingLeft,
          color: "var(--text-secondary)",
        }}
      >
        <span style={{ marginRight: 4, fontSize: "0.7em" }}>
          {open ? "\u25BE" : "\u25B8"}
        </span>
        {node.name}
      </button>
      {open && node.children && (
        <ul>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              currentPath={currentPath}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
