"""
SessionMemory — persistent cross-session memory for pattern learning.

DEV.to lesson: Agents maintaining memory across 65+ sessions for pattern
recognition and strategic adaptation was the #1 differentiator.

Each channel has its own memory directory:
    data/memory/{channel_id}/
        session_log.jsonl       — append-only session decisions
        performance_patterns.json — learned patterns (updated weekly)
        failed_experiments.json  — experiments that didn't work (never repeat)
        visual_fatigue.json     — tracks visual style usage to avoid sameness
"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any

_V4_ROOT = Path(__file__).resolve().parent.parent.parent


class SessionMemory:
    """Persistent memory across production sessions."""

    def __init__(self, data_dir: Path | None = None):
        self.data_dir = data_dir or (_V4_ROOT / "data" / "memory")

    def _channel_dir(self, channel_id: str) -> Path:
        d = self.data_dir / channel_id
        d.mkdir(parents=True, exist_ok=True)
        return d

    # ── Session Log (append-only) ────────────────────────────

    def log_session(self, channel_id: str, entry: dict[str, Any]) -> None:
        """Append a session decision to the log.

        Entry should include:
            - action: what was done (mine/script/render/review/upload)
            - decisions: key choices made
            - outcome: result (pass/fail/metrics)
            - lesson: what was learned (optional)
        """
        filepath = self._channel_dir(channel_id) / "session_log.jsonl"
        enriched = {
            "timestamp": datetime.now().isoformat(),
            **entry,
        }
        with open(filepath, "a", encoding="utf-8") as f:
            f.write(json.dumps(enriched, ensure_ascii=False) + "\n")

    def get_recent_sessions(
        self, channel_id: str, limit: int = 20
    ) -> list[dict[str, Any]]:
        """Read the most recent session entries."""
        filepath = self._channel_dir(channel_id) / "session_log.jsonl"
        if not filepath.exists():
            return []

        lines = filepath.read_text(encoding="utf-8").strip().split("\n")
        entries = []
        for line in lines[-limit:]:
            if line.strip():
                entries.append(json.loads(line))
        return entries

    # ── Performance Patterns ─────────────────────────────────

    def get_patterns(self, channel_id: str) -> dict[str, Any]:
        """Load learned performance patterns."""
        filepath = self._channel_dir(channel_id) / "performance_patterns.json"
        if filepath.exists():
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        return {
            "winning_topics": [],
            "winning_hooks": [],
            "optimal_duration_sec": None,
            "best_upload_times": [],
            "like_rate_boosters": [],
            "updated_at": None,
        }

    def save_patterns(self, channel_id: str, patterns: dict[str, Any]) -> Path:
        """Save updated performance patterns."""
        filepath = self._channel_dir(channel_id) / "performance_patterns.json"
        patterns["updated_at"] = datetime.now().isoformat()
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(patterns, f, ensure_ascii=False, indent=2)
        return filepath

    # ── Failed Experiments ───────────────────────────────────

    def get_failed_experiments(self, channel_id: str) -> list[dict[str, Any]]:
        """Load experiments that didn't work — never repeat these."""
        filepath = self._channel_dir(channel_id) / "failed_experiments.json"
        if filepath.exists():
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        return []

    def add_failed_experiment(
        self, channel_id: str, experiment: dict[str, Any]
    ) -> None:
        """Record a failed experiment so it's never repeated."""
        experiments = self.get_failed_experiments(channel_id)
        enriched = {
            "timestamp": datetime.now().isoformat(),
            **experiment,
        }
        experiments.append(enriched)
        filepath = self._channel_dir(channel_id) / "failed_experiments.json"
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(experiments, f, ensure_ascii=False, indent=2)

    # ── Visual Fatigue Tracker ───────────────────────────────

    def get_visual_usage(self, channel_id: str) -> dict[str, int]:
        """Track how many times each visual style variant has been used.

        DEV.to lesson: After 50+ videos, viewers notice AI visual sameness.
        Use this to rotate styles from the channel's visual_variation pool.
        """
        filepath = self._channel_dir(channel_id) / "visual_fatigue.json"
        if filepath.exists():
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}

    def record_visual_usage(self, channel_id: str, style_variant: str) -> None:
        """Increment usage count for a visual style variant."""
        usage = self.get_visual_usage(channel_id)
        usage[style_variant] = usage.get(style_variant, 0) + 1
        filepath = self._channel_dir(channel_id) / "visual_fatigue.json"
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(usage, f, ensure_ascii=False, indent=2)

    def suggest_visual_variant(
        self, channel_id: str, variation_pool: list[str]
    ) -> str:
        """Suggest the least-used visual variant from the pool."""
        usage = self.get_visual_usage(channel_id)
        if not variation_pool:
            return "default"
        # Pick the variant with the lowest usage count
        return min(variation_pool, key=lambda v: usage.get(v, 0))
