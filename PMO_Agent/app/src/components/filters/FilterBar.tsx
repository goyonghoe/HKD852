"use client";

import { Division, Priority } from "@/lib/kanban/types";
import { AGENTS, DIVISION_CONFIG, PRIORITY_CONFIG } from "@/lib/kanban/constants";

interface Filters {
  division: Division | "all";
  assignee: string | "all";
  priority: Priority | "all";
  sprint: string | "all";
  search: string;
}

interface FilterBarProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  sprints: string[];
}

export default function FilterBar({
  filters,
  onFilterChange,
  sprints,
}: FilterBarProps) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onFilterChange({ ...filters, [key]: value });

  const hasActiveFilters =
    filters.division !== "all" ||
    filters.assignee !== "all" ||
    filters.priority !== "all" ||
    filters.sprint !== "all" ||
    filters.search;

  return (
    <div className="border-b border-surface-border bg-bg-elevated/50 backdrop-blur-sm">
      <div className="max-w-[1920px] mx-auto px-5 sm:px-8 py-3 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="검색..."
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
            className="bg-surface border border-surface-border rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 w-full sm:w-48 transition-all"
          />
        </div>

        <div className="hidden sm:block h-5 w-px bg-surface-border" />

        {/* Division Pills */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => set("division", "all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filters.division === "all"
                ? "bg-accent/15 text-accent"
                : "bg-surface text-text-dim hover:text-text-secondary hover:bg-surface-light"
            }`}
          >
            전체
          </button>
          {(
            Object.entries(DIVISION_CONFIG) as [
              Division,
              (typeof DIVISION_CONFIG)["game"],
            ][]
          ).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() =>
                set("division", filters.division === key ? "all" : key)
              }
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filters.division === key
                  ? "text-white"
                  : "bg-surface text-text-dim hover:text-text-secondary hover:bg-surface-light"
              }`}
              style={
                filters.division === key
                  ? { backgroundColor: cfg.color + "30", color: cfg.color }
                  : undefined
              }
            >
              {cfg.labelKo}
            </button>
          ))}
        </div>

        <div className="hidden sm:block h-5 w-px bg-surface-border" />

        {/* Assignee */}
        <select
          value={filters.assignee}
          onChange={(e) => set("assignee", e.target.value)}
          className="select-chevron bg-surface border border-surface-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 appearance-none cursor-pointer font-medium"
        >
          <option value="all">담당자</option>
          {AGENTS.map((a) => (
            <option key={a.name} value={a.name}>
              {a.label}
            </option>
          ))}
        </select>

        {/* Priority */}
        <select
          value={filters.priority}
          onChange={(e) =>
            set("priority", e.target.value as Priority | "all")
          }
          className="select-chevron bg-surface border border-surface-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 appearance-none cursor-pointer font-medium"
        >
          <option value="all">우선순위</option>
          {(
            Object.entries(PRIORITY_CONFIG) as [
              Priority,
              (typeof PRIORITY_CONFIG)["high"],
            ][]
          ).map(([key, cfg]) => (
            <option key={key} value={key}>
              {cfg.label}
            </option>
          ))}
        </select>

        {/* Sprint */}
        {sprints.length > 0 && (
          <select
            value={filters.sprint}
            onChange={(e) => set("sprint", e.target.value)}
            className="select-chevron bg-surface border border-surface-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 appearance-none cursor-pointer font-medium"
          >
            <option value="all">스프린트</option>
            {sprints.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}

        {/* Clear */}
        {hasActiveFilters && (
          <button
            onClick={() =>
              onFilterChange({
                division: "all",
                assignee: "all",
                priority: "all",
                sprint: "all",
                search: "",
              })
            }
            className="px-3 py-1.5 rounded-lg text-xs text-text-dim hover:text-accent hover:bg-accent/10 transition-all flex items-center gap-1.5 font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
            초기화
          </button>
        )}
      </div>
    </div>
  );
}
