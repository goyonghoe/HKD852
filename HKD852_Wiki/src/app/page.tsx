import Link from "next/link";
import { AGENTS, DIVISIONS } from "@/lib/data";

const DIVISION_COLORS: Record<string, string> = {
  "ceo-direct": "#f59e0b",
  game: "#10b981",
  business: "#8b5cf6",
  support: "#06b6d4",
};

const STAT_CARDS = [
  { label: "Agents", value: "23", sub: "AI Team Members" },
  { label: "Skills", value: "~112", sub: "Automated Capabilities" },
  { label: "Engine", value: "Unity 6", sub: "6000.3.6f1" },
  { label: "Version", value: "v7.4", sub: "2026-03-07" },
];

export default function HomePage() {
  const agentsByDivision = DIVISIONS.map((div) => ({
    ...div,
    agents: AGENTS.filter((a) => a.division === div.id),
  }));

  return (
    <div>
      {/* Hero */}
      <div className="mb-8">
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          HKD852 Studio Wiki
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          AI 에이전트 기반 게임/콘텐츠 제작 조직 &mdash; 24 Agents, ~112
          Skills
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map((s) => (
          <div
            key={s.label}
            className="rounded-lg p-4"
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
            }}
          >
            <p
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--text-secondary)" }}
            >
              {s.label}
            </p>
            <p
              className="text-2xl font-bold mt-1"
              style={{ color: "var(--accent)" }}
            >
              {s.value}
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-secondary)" }}
            >
              {s.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Org Chart */}
      <div id="org-chart" className="mb-8">
        <h2
          className="text-xl font-semibold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Organization Chart
        </h2>

        {/* CEO */}
        <div className="flex justify-center mb-6">
          <div
            className="rounded-lg px-6 py-3 text-center"
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "2px solid var(--accent)",
            }}
          >
            <p className="text-sm font-bold" style={{ color: "var(--accent)" }}>
              CEO
            </p>
            <p
              className="text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              Human (User)
            </p>
          </div>
        </div>

        {/* Division connectors */}
        <div className="flex justify-center mb-2">
          <div
            className="w-px h-6"
            style={{ backgroundColor: "var(--border-color)" }}
          />
        </div>
        <div
          className="mx-auto max-w-3xl h-px mb-2"
          style={{ backgroundColor: "var(--border-color)" }}
        />

        {/* Divisions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {agentsByDivision.map((div) => (
            <div key={div.id}>
              <div
                className="rounded-t-lg px-3 py-2 text-center text-sm font-semibold text-white"
                style={{ backgroundColor: DIVISION_COLORS[div.id] }}
              >
                {div.nameKo}
              </div>
              <div
                className="rounded-b-lg divide-y"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  border: `1px solid var(--border-color)`,
                  borderTop: "none",
                }}
              >
                {div.agents.map((agent) => (
                  <Link
                    key={agent.slug}
                    href={`/agents/${agent.slug}`}
                    className="block px-3 py-2 text-sm transition-colors"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <span className="font-medium">{agent.role}</span>
                    <span
                      className="text-xs ml-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {agent.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="mb-8">
        <h2
          className="text-xl font-semibold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Quick Links
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "Agent Catalog",
              desc: "Browse all 24 AI agents and their capabilities",
              href: "/agents",
            },
            {
              title: "Skill Directory",
              desc: "Search ~112 skills across all agents",
              href: "/skills",
            },
            {
              title: "Architecture",
              desc: "System design, pipelines, and operational model",
              href: "/architecture",
            },
            {
              title: "Guides",
              desc: "How to create agents, conventions, and standards",
              href: "/guides",
            },
            {
              title: "Quality Pipeline",
              desc: "Quality Gate -> Shield -> RedTeam approval flow",
              href: "/architecture",
            },
            {
              title: "Target Markets",
              desc: "NA > EU > CN > KR > JP priority order",
              href: "/architecture",
            },
          ].map((link) => (
            <Link
              key={link.href + link.title}
              href={link.href}
              className="block rounded-lg p-4 transition-colors"
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
              }}
            >
              <h3
                className="font-semibold text-sm"
                style={{ color: "var(--accent)" }}
              >
                {link.title}
              </h3>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                {link.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Target Markets */}
      <div className="mb-8">
        <h2
          className="text-xl font-semibold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Target Markets
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            { code: "NA", name: "North America", priority: 1 },
            { code: "EU", name: "Europe", priority: 2 },
            { code: "CN", name: "China", priority: 3 },
            { code: "KR", name: "South Korea", priority: 4 },
            { code: "JP", name: "Japan", priority: 5 },
          ].map((m) => (
            <div
              key={m.code}
              className="flex items-center gap-2 rounded-full px-4 py-2"
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
              }}
            >
              <span
                className="text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center text-white"
                style={{ backgroundColor: "var(--accent)" }}
              >
                {m.priority}
              </span>
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {m.code}
              </span>
              <span
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                {m.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        className="text-xs pt-4 mt-8"
        style={{
          color: "var(--text-secondary)",
          borderTop: "1px solid var(--border-color)",
        }}
      >
        HKD852 Studio Wiki v7.4 | Last updated: 2026-03-07 | Powered by Next.js
        + Vercel
      </div>
    </div>
  );
}
