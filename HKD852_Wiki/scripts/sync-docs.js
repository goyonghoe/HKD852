#!/usr/bin/env node
/**
 * Sync all .md files from HKD852 project root into content/docs/
 * and generate a docs-index.json file tree.
 * Run before Next.js build: node scripts/sync-docs.js
 */

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const WIKI_ROOT = path.resolve(__dirname, "..");
const DOCS_DIR = path.join(WIKI_ROOT, "content", "docs");
const INDEX_FILE = path.join(WIKI_ROOT, "content", "docs-index.json");

// Skip on Vercel - use pre-synced files
if (process.env.VERCEL) {
  if (fs.existsSync(INDEX_FILE)) {
    console.log("Vercel build: using pre-synced docs.");
    process.exit(0);
  }
}

// Directories to skip
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "HKD852_Wiki",
  ".husky",
  "backup",
]);

// File patterns to skip
const SKIP_FILES = new Set(["package-lock.json"]);

function shouldSkip(name) {
  return SKIP_DIRS.has(name) || name.startsWith(".");
}

function scanDir(dir, relativeTo) {
  const entries = [];
  let items;
  try {
    items = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return entries;
  }

  for (const item of items) {
    if (item.name.startsWith(".") && item.name !== ".claude") continue;
    if (SKIP_DIRS.has(item.name)) continue;
    if (SKIP_FILES.has(item.name)) continue;

    const fullPath = path.join(dir, item.name);
    const relPath = path.relative(relativeTo, fullPath);

    if (item.isDirectory()) {
      const children = scanDir(fullPath, relativeTo);
      // Only include dirs that have .md files (directly or nested)
      if (children.length > 0) {
        entries.push({
          name: item.name,
          type: "dir",
          path: relPath,
          children,
        });
      }
    } else if (
      item.isFile() &&
      (item.name.endsWith(".md") || item.name.endsWith(".mdx"))
    ) {
      entries.push({
        name: item.name,
        type: "file",
        path: relPath,
      });
    }
  }

  return entries;
}

function copyMdFiles(tree, srcRoot, destRoot) {
  let count = 0;
  for (const node of tree) {
    if (node.type === "dir") {
      count += copyMdFiles(node.children, srcRoot, destRoot);
    } else {
      const src = path.join(srcRoot, node.path);
      const dest = path.join(destRoot, node.path);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
      count++;
    }
  }
  return count;
}

// Clean previous docs
if (fs.existsSync(DOCS_DIR)) {
  fs.rmSync(DOCS_DIR, { recursive: true });
}
fs.mkdirSync(DOCS_DIR, { recursive: true });

console.log(`Scanning ${PROJECT_ROOT} for .md files...`);
const tree = scanDir(PROJECT_ROOT, PROJECT_ROOT);

// Copy files
const count = copyMdFiles(tree, PROJECT_ROOT, DOCS_DIR);

// Write index
fs.writeFileSync(INDEX_FILE, JSON.stringify(tree, null, 2));

console.log(`Synced ${count} .md files to content/docs/`);
console.log(`Index written to content/docs-index.json`);
