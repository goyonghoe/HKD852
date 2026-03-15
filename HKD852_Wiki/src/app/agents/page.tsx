"use client";

import { useState } from "react";
import { AGENTS, DIVISIONS } from "@/lib/data";
import AgentCard from "@/components/AgentCard";

type DivisionFilter = "all" | "ceo-direct" | "game" | "business" | "support";

const TABS: { id: DivisionFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "ceo-direct", label: "Direct" },
  { id: "game", label: "Game" },
  { id: "business", label: "Business" },
  { id: "support", label: "Support" },
];

export default function AgentsPage() {
  const [filter, setFilter] = useState<DivisionFilter>("all");

  const filtered =
    filter === "all"
      ? AGENTS
      : AGENTS.filter((a) => a.division === filter);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
        Agent Catalog
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
        {AGENTS.length} agents across {DIVISIONS.length} divisions
      </p>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor:
                filter === tab.id ? "var(--accent)" : "var(--bg-secondary)",
              color:
                filter === tab.id ? "#ffffff" : "var(--text-secondary)",
              border: "1px solid",
              borderColor:
                filter === tab.id ? "var(--accent)" : "var(--border-color)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Agent grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((agent) => (
          <AgentCard key={agent.slug} agent={agent} />
        ))}
      </div>
    </div>
  );
}
