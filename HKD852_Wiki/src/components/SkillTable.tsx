"use client";

import { useState } from "react";
import SearchBar from "./SearchBar";
import Badge from "./Badge";

interface SkillRow {
  name: string;
  agent: string;
  description: string;
  model: string;
}

const MODEL_COLORS: Record<string, string> = {
  opus: "#ef4444",
  sonnet: "#3b82f6",
  haiku: "#22c55e",
};

export default function SkillTable({ skills }: { skills: SkillRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = skills.filter((s) => {
    const q = query.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.agent.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="mb-4 max-w-sm">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search skills..."
        />
      </div>
      <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border-color)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: "var(--bg-secondary)" }}>
              <th className="text-left px-4 py-2 font-semibold" style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border-color)" }}>Skill</th>
              <th className="text-left px-4 py-2 font-semibold" style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border-color)" }}>Agent</th>
              <th className="text-left px-4 py-2 font-semibold" style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border-color)" }}>Description</th>
              <th className="text-left px-4 py-2 font-semibold" style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border-color)" }}>Model</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((skill) => (
              <tr
                key={`${skill.agent}-${skill.name}`}
                className="transition-colors"
                style={{ borderBottom: "1px solid var(--border-color)" }}
              >
                <td className="px-4 py-2 font-mono text-xs" style={{ color: "var(--accent)" }}>
                  {skill.name}
                </td>
                <td className="px-4 py-2" style={{ color: "var(--text-secondary)" }}>
                  {skill.agent}
                </td>
                <td className="px-4 py-2" style={{ color: "var(--text-secondary)" }}>
                  {skill.description}
                </td>
                <td className="px-4 py-2">
                  <Badge
                    label={skill.model}
                    color={MODEL_COLORS[skill.model] ?? "#6b7280"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center py-8 text-sm" style={{ color: "var(--text-secondary)" }}>
            No skills found.
          </p>
        )}
      </div>
      <p className="mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>
        {filtered.length} of {skills.length} skills
      </p>
    </div>
  );
}
