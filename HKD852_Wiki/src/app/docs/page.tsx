import { getDocsTree, countFiles } from "@/lib/docs";
import type { TreeNode } from "@/lib/docs";
import FileTree from "@/components/FileTree";

const AGENT_NAMES = new Set([
  "Secretary_Agent",
  "Growth_Agent",
  "Shield_Agent",
  "RedTeam_Agent",
  "GameDesign_Agent",
  "GameDev_Agent",
  "QATest_Agent",
  "Income_Factory",
  "Marketing_Agent",
  "Community_Agent",
  "ShortsFactory_Agent",
  "ShortsFactory2_Agent",
  "ShortsFactory3_Agent",
  "ShortsFleet",
  "PT_Agent",
  "Translate_Agent",
  "HR_Agent",
  "Video_Analyzer",
  "DevOps_Agent",
  "Invest_Agent",
  "PMO_Agent",
  "Saju_Agent",
  "LangMaster_Agent",
  "NotebookLM_Agent",
  "team-kowloon",
]);

const PROJECT_NAMES = new Set(["WanChai", "SSBL", "CodeFire", "KPOP_Trends", "AI_News", "DividendMonitor", "ClaudeUsageMonitor"]);

function categorize(node: TreeNode): string {
  if (node.name.endsWith("_Agent") || AGENT_NAMES.has(node.name)) return "Agents";
  if (PROJECT_NAMES.has(node.name)) return "Projects";
  if (node.name === "docs" || node.name === "outputs") return "Docs";
  return "Root";
}

function getFirstFile(node: TreeNode): string | null {
  if (node.type === "file") return node.path.replace(/\.md$/, "");
  if (node.children) {
    for (const child of node.children) {
      const found = getFirstFile(child);
      if (found) return found;
    }
  }
  return null;
}

const CATEGORY_ORDER = ["Agents", "Projects", "Docs", "Root"];

export default function DocsPage() {
  const tree = getDocsTree();
  const totalFiles = tree.reduce((sum, node) => sum + countFiles(node), 0);

  const grouped: Record<string, TreeNode[]> = {};
  for (const node of tree) {
    const cat = categorize(node);
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(node);
  }

  return (
    <div>
      <h1
        className="text-2xl font-bold mb-1"
        style={{ color: "var(--text-primary)" }}
      >
        Docs Browser
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
        {totalFiles} documents across {tree.length} top-level folders
      </p>

      {CATEGORY_ORDER.map((cat) => {
        const nodes = grouped[cat];
        if (!nodes || nodes.length === 0) return null;
        return (
          <div key={cat} className="mb-8">
            <h2
              className="text-lg font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              {cat}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {nodes.map((node) => {
                const fileCount = countFiles(node);
                const firstFile = getFirstFile(node);
                return (
                  <a
                    key={node.path}
                    href={firstFile ? `/docs/${firstFile}` : "#"}
                    className="block rounded-lg p-4 transition-colors border"
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      borderColor: "var(--border-color)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="font-medium text-sm"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {node.name}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: "var(--bg-primary)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {fileCount} files
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="mt-10">
        <h2
          className="text-lg font-semibold mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          Full File Tree
        </h2>
        <div
          className="rounded-lg p-4 border overflow-auto"
          style={{
            backgroundColor: "var(--bg-secondary)",
            borderColor: "var(--border-color)",
            maxHeight: "60vh",
          }}
        >
          <FileTree tree={tree} />
        </div>
      </div>
    </div>
  );
}
