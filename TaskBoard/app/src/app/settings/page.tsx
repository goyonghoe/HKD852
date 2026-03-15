"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useDarkMode } from "@/hooks/useDarkMode";

interface SettingsData {
  daily_capacity_hours: number;
  correction_factor: number;
  correction_familiar: number;
  correction_routine: number;
  wip_backlog: number;
  wip_thisweek: number;
  wip_today: number;
  wip_in_progress: number;
  wip_waiting: number;
}

const DEFAULT_SETTINGS: SettingsData = {
  daily_capacity_hours: 8,
  correction_factor: 1.5,
  correction_familiar: 1.2,
  correction_routine: 1.0,
  wip_backlog: 0,
  wip_thisweek: 10,
  wip_today: 5,
  wip_in_progress: 3,
  wip_waiting: 5,
};

const WIP_COLUMNS = [
  { key: "wip_backlog" as const, label: "Backlog", hint: "0 = unlimited" },
  { key: "wip_thisweek" as const, label: "This Week" },
  { key: "wip_today" as const, label: "Today" },
  { key: "wip_in_progress" as const, label: "In Progress" },
  { key: "wip_waiting" as const, label: "Waiting" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clearingDone, setClearingDone] = useState(false);
  const { isDark, toggle: toggleDarkMode } = useDarkMode();

  const loadSettings = useCallback(async () => {
    try {
      const { data, error: err } = await supabase
        .from("settings")
        .select("*")
        .limit(1)
        .single();

      if (err && err.code !== "PGRST116") throw err;

      if (data) {
        const row = data as Record<string, unknown>;
        setSettings({
          daily_capacity_hours:
            (row.daily_capacity_hours as number) ??
            DEFAULT_SETTINGS.daily_capacity_hours,
          correction_factor:
            (row.correction_factor as number) ??
            DEFAULT_SETTINGS.correction_factor,
          correction_familiar:
            (row.correction_familiar as number) ??
            DEFAULT_SETTINGS.correction_familiar,
          correction_routine:
            (row.correction_routine as number) ??
            DEFAULT_SETTINGS.correction_routine,
          wip_backlog:
            (row.wip_backlog as number) ?? DEFAULT_SETTINGS.wip_backlog,
          wip_thisweek:
            (row.wip_thisweek as number) ?? DEFAULT_SETTINGS.wip_thisweek,
          wip_today: (row.wip_today as number) ?? DEFAULT_SETTINGS.wip_today,
          wip_in_progress:
            (row.wip_in_progress as number) ?? DEFAULT_SETTINGS.wip_in_progress,
          wip_waiting:
            (row.wip_waiting as number) ?? DEFAULT_SETTINGS.wip_waiting,
        });
      }

      // Also load WIP limits from localStorage as fallback
      const wipStr = localStorage.getItem("taskboard-wip-limits");
      if (wipStr && !data) {
        try {
          const wip = JSON.parse(wipStr) as Record<string, number>;
          setSettings((prev) => ({
            ...prev,
            wip_backlog: wip.backlog ?? prev.wip_backlog,
            wip_thisweek: wip.thisweek ?? prev.wip_thisweek,
            wip_today: wip.today ?? prev.wip_today,
            wip_in_progress: wip.in_progress ?? prev.wip_in_progress,
            wip_waiting: wip.waiting ?? prev.wip_waiting,
          }));
        } catch {
          // ignore parse errors
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      // Upsert settings row (id=1)
      const { error: err } = await supabase.from("settings").upsert(
        {
          id: 1,
          daily_capacity_hours: settings.daily_capacity_hours,
          correction_factor: settings.correction_factor,
        },
        { onConflict: "id" },
      );
      if (err) throw err;

      // Also persist WIP limits to localStorage for backward compat
      localStorage.setItem(
        "taskboard-wip-limits",
        JSON.stringify({
          backlog: settings.wip_backlog,
          thisweek: settings.wip_thisweek,
          today: settings.wip_today,
          in_progress: settings.wip_in_progress,
          waiting: settings.wip_waiting,
        }),
      );

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleClearCompleted = async () => {
    if (!confirm("Delete all completed tasks? This cannot be undone.")) return;

    setClearingDone(true);
    try {
      const { error: err } = await supabase
        .from("tasks")
        .delete()
        .eq("status", "done");
      if (err) throw err;
      alert("All completed tasks have been deleted.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to clear completed tasks",
      );
    } finally {
      setClearingDone(false);
    }
  };

  const updateField = (field: keyof SettingsData, value: number) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400 dark:text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col pb-20 sm:pb-0">
      {/* Mobile back button */}
      <div className="sm:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a]">
        <button
          onClick={() => router.back()}
          className="text-blue-600 dark:text-blue-400 text-sm flex items-center gap-1"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          뒤로
        </button>
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          설정
        </span>
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a]">
        <div className="flex items-center gap-2 sm:gap-4">
          <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
            Ultra Task Board
          </h1>
          <nav className="hidden sm:flex items-center gap-1 text-sm">
            <Link
              href="/tree"
              className="px-2 sm:px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Tree
            </Link>
            <Link
              href="/"
              className="px-2 sm:px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Board
            </Link>
            <Link
              href="/table"
              className="px-2 sm:px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Table
            </Link>
            <Link
              href="/timeline"
              className="px-2 sm:px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Timeline
            </Link>
            <Link
              href="/calendar"
              className="px-2 sm:px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Calendar
            </Link>
            <Link
              href="/list"
              className="px-2 sm:px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              List
            </Link>
            <Link
              href="/stats"
              className="px-2 sm:px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Stats
            </Link>
            <Link
              href="/activity"
              className="px-2 sm:px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Activity
            </Link>
            <Link
              href="/wiki"
              className="px-2 sm:px-2.5 py-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Wiki
            </Link>
            <Link
              href="/settings"
              className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              title="Settings"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </Link>
          </nav>
        </div>
      </header>

      {/* Error bar */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800 px-6 py-2 text-sm text-red-700 dark:text-red-400">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            x
          </button>
        </div>
      )}

      {/* Settings content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 bg-gray-50 dark:bg-[#0f0f0f]">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Daily Capacity */}
          <section className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Daily Capacity
            </h2>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                Hours per day
              </label>
              <input
                type="number"
                min={1}
                max={24}
                step={0.5}
                value={settings.daily_capacity_hours}
                onChange={(e) =>
                  updateField(
                    "daily_capacity_hours",
                    parseFloat(e.target.value) || 0,
                  )
                }
                className="w-20 px-3 py-1.5 text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#111] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </section>

          {/* Correction Factors */}
          <section className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Correction Factors
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
              Multipliers applied to time estimates based on task familiarity.
            </p>
            <div className="space-y-3">
              {[
                {
                  key: "correction_factor" as const,
                  label: "Unfamiliar",
                  hint: "Tasks you haven't done before",
                },
                {
                  key: "correction_familiar" as const,
                  label: "Familiar",
                  hint: "Tasks you've done a few times",
                },
                {
                  key: "correction_routine" as const,
                  label: "Routine",
                  hint: "Tasks you do regularly",
                },
              ].map((item) => (
                <div key={item.key} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {item.hint}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0.1}
                      max={5}
                      step={0.1}
                      value={settings[item.key]}
                      onChange={(e) =>
                        updateField(item.key, parseFloat(e.target.value) || 1)
                      }
                      className="w-20 px-3 py-1.5 text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#111] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-400">x</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* WIP Limits */}
          <section className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              WIP Limits
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
              Maximum tasks per column. Set to 0 for unlimited.
            </p>
            <div className="space-y-3">
              {WIP_COLUMNS.map((col) => (
                <div key={col.key} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {col.label}
                    </p>
                    {col.hint && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {col.hint}
                      </p>
                    )}
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={settings[col.key]}
                    onChange={(e) =>
                      updateField(col.key, parseInt(e.target.value) || 0)
                    }
                    className="w-20 px-3 py-1.5 text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#111] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Dark Mode */}
          <section className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Appearance
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Dark Mode
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {isDark
                    ? "Currently using dark theme"
                    : "Currently using light theme"}
                </p>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  isDark ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                    isDark ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </section>

          {/* Data Management */}
          <section className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Data Management
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Export Data
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Download all tasks as JSON
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const { data } = await supabase
                      .from("tasks")
                      .select("*")
                      .order("created_at", { ascending: true });
                    if (data) {
                      const blob = new Blob([JSON.stringify(data, null, 2)], {
                        type: "application/json",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `taskboard-export-${new Date().toISOString().slice(0, 10)}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }
                  }}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#222]"
                >
                  Export
                </button>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#2a2a2a]">
                <div>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Clear Completed Tasks
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Permanently delete all tasks marked as done
                  </p>
                </div>
                <button
                  onClick={handleClearCompleted}
                  disabled={clearingDone}
                  className="px-3 py-1.5 text-sm rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50"
                >
                  {clearingDone ? "Clearing..." : "Clear"}
                </button>
              </div>
            </div>
          </section>

          {/* Save button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
            {saved && (
              <span className="text-sm text-green-600 dark:text-green-400">
                Settings saved!
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
