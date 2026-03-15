import type { Agent } from "@/lib/types";
import Badge from "./Badge";

const DIVISION_COLORS: Record<string, string> = {
  "ceo-direct": "#f59e0b",
  game: "#10b981",
  business: "#8b5cf6",
  support: "#06b6d4",
};

const DIVISION_LABELS: Record<string, string> = {
  "ceo-direct": "Direct",
  game: "Game",
  business: "Business",
  support: "Support",
};

export default function AgentCard({ agent }: { agent: Agent }) {
  const color = DIVISION_COLORS[agent.division] ?? "#6b7280";
  const divLabel = DIVISION_LABELS[agent.division] ?? agent.division;

  return (
    <a
      href={`/agents/${agent.slug}`}
      className="block rounded-lg border p-4 transition-colors hover:border-current"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-color)",
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
          {agent.name}
        </h3>
        <Badge label={divLabel} color={color} />
      </div>
      <p className="text-xs mb-3" style={{ color: "var(--accent)" }}>
        {agent.role}
      </p>
      <p className="text-xs mb-3 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
        {agent.description}
      </p>
      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
        <span>{agent.skillCount} skills</span>
        <span>|</span>
        <span className="truncate">{agent.path}</span>
      </div>
    </a>
  );
}
