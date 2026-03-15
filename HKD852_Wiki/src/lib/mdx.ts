import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Agent, Guide } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content");

function readMdxFiles(dir: string) {
  const fullPath = path.join(CONTENT_DIR, dir);
  if (!fs.existsSync(fullPath)) return [];
  return fs
    .readdirSync(fullPath)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .map((filename) => {
      const filePath = path.join(fullPath, filename);
      const raw = fs.readFileSync(filePath, "utf-8");
      const { data, content } = matter(raw);
      const slug = filename.replace(/\.(mdx|md)$/, "");
      return { slug, frontmatter: data, content };
    });
}

export function getAllAgents(): Agent[] {
  const files = readMdxFiles("agents");
  return files.map(({ slug, frontmatter, content }) => ({
    slug,
    name: frontmatter.name ?? slug,
    role: frontmatter.role ?? "",
    division: frontmatter.division ?? "ceo-direct",
    path: frontmatter.path ?? "",
    skillCount: frontmatter.skillCount ?? 0,
    description: frontmatter.description ?? "",
    skills: frontmatter.skills ?? [],
  }));
}

export function getAgent(slug: string) {
  const filePath = path.join(CONTENT_DIR, "agents", `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return {
    slug,
    frontmatter: data,
    content,
  };
}

export function getAllSkills() {
  const files = readMdxFiles("skills");
  return files.map(({ slug, frontmatter }) => ({
    slug,
    name: frontmatter.name ?? slug,
    agent: frontmatter.agent ?? "",
    description: frontmatter.description ?? "",
    model: frontmatter.model ?? "sonnet",
  }));
}

export function getGuide(slug: string): {
  slug: string;
  frontmatter: Record<string, unknown>;
  content: string;
} | null {
  const filePath = path.join(CONTENT_DIR, "guides", `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return { slug, frontmatter: data, content };
}

export function getArchitecture() {
  const filePath = path.join(CONTENT_DIR, "architecture.mdx");
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return { frontmatter: data, content };
}
