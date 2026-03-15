"""
FeedbackLoop — learns from past video performance to improve future content.

Reads performance data, identifies top-performing topics and patterns,
and suggests next topics based on historical success.

YouTube Analytics API integration is a TODO placeholder.
Currently works with local JSON performance files.
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

# Project root for ShortsFactory_v4
_V4_ROOT = Path(__file__).resolve().parent.parent.parent


class FeedbackLoop:
    """Analytics feedback loop for content optimization.

    Data layout:
        data/performance/<channel_id>/          — raw performance snapshots
        data/performance/<channel_id>/daily/     — daily metrics
        data/learnings/<channel_id>/             — accumulated learnings
    """

    def __init__(self, data_dir: Path | None = None):
        self.data_dir = data_dir or (_V4_ROOT / "data")

    def _perf_dir(self, channel_id: str) -> Path:
        """Get performance data directory for a channel."""
        d = self.data_dir / "performance" / channel_id
        d.mkdir(parents=True, exist_ok=True)
        return d

    def _learnings_dir(self, channel_id: str) -> Path:
        """Get learnings directory for a channel."""
        d = self.data_dir / "learnings" / channel_id
        d.mkdir(parents=True, exist_ok=True)
        return d

    def load_performance(self, channel_id: str) -> dict[str, Any]:
        """Load the latest performance snapshot for a channel.

        Returns a dict with:
            - videos: list of video performance records
            - summary: aggregate metrics
            - last_updated: ISO timestamp

        Falls back to empty structure if no data exists.
        """
        perf_dir = self._perf_dir(channel_id)
        latest_file = self._find_latest_json(perf_dir)

        if latest_file:
            with open(latest_file, "r", encoding="utf-8") as f:
                return json.load(f)

        return {
            "videos": [],
            "summary": {"total_views": 0, "total_videos": 0, "avg_rpm": 0.0},
            "last_updated": None,
        }

    def get_top_topics(
        self,
        channel_id: str,
        days: int = 7,
        limit: int = 10,
        min_age_hours: int = 72,
    ) -> list[dict[str, Any]]:
        """Get top performing topics for a channel within the last N days.

        Ranks by composite score prioritizing LIKE RATE over raw views.
        Score = like_rate * avg_watch_time * retention * sqrt(views)

        DEV.to lesson: Like rate (4-5%) is the real algorithm signal, not views.
        DEV.to lesson: YouTube Analytics needs 72h to stabilize — skip recent videos.

        Args:
            min_age_hours: Minimum hours since publish to include in analysis.
                YouTube Analytics data is unreliable before 72h.

        Returns:
            List of dicts with topic, like_rate, watch_time, views, score.
        """
        perf = self.load_performance(channel_id)
        videos = perf.get("videos", [])

        cutoff_old = datetime.now() - timedelta(days=days)
        cutoff_recent = datetime.now() - timedelta(hours=min_age_hours)
        recent = []
        for v in videos:
            pub_date = v.get("published_at", "")
            if pub_date:
                try:
                    dt = datetime.fromisoformat(pub_date.replace("Z", "+00:00"))
                    dt_naive = dt.replace(tzinfo=None)
                    # Skip too old AND too recent (72h analytics lag)
                    if dt_naive < cutoff_old or dt_naive > cutoff_recent:
                        continue
                except ValueError:
                    pass
            recent.append(v)

        # Score each video — LIKE RATE > VIEWS (DEV.to lesson)
        scored = []
        for v in recent:
            views = max(v.get("views", 1), 1)
            like_rate = v.get("like_rate", v.get("likes", 0) / views * 100 if views > 0 else 0)
            avg_watch_time = v.get("avg_watch_time", v.get("avg_retention", 0.5) * v.get("duration", 60))
            retention = v.get("avg_retention", 0.5)

            # Primary: like_rate (4x weight) + watch_time (2x weight)
            # Secondary: views (sqrt to dampen outliers)
            score = (like_rate * 4.0) * (avg_watch_time * 2.0) * retention * (views ** 0.5 / 100)

            scored.append({
                "topic": v.get("topic", v.get("title", "unknown")),
                "title": v.get("title", ""),
                "views": views,
                "like_rate": round(like_rate, 2),
                "avg_watch_time": round(avg_watch_time, 1),
                "retention": retention,
                "score": round(score, 2),
                "video_id": v.get("video_id", ""),
            })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:limit]

    def suggest_topics(
        self,
        channel_id: str,
        count: int = 5,
    ) -> list[dict[str, Any]]:
        """Suggest next topics based on performance patterns.

        Strategy:
            1. Find top-performing topic categories
            2. Identify underexplored angles within winning categories
            3. Suggest variations that haven't been done

        TODO: Integrate with YouTube Analytics API for real data.
        TODO: Add trend correlation (Google Trends, Reddit, etc).

        Returns:
            List of topic suggestion dicts with rationale.
        """
        top = self.get_top_topics(channel_id, days=14, limit=20)

        if not top:
            return [{
                "topic": "trending_default",
                "rationale": "No performance data yet. Start with trending topics.",
                "confidence": 0.0,
            }]

        # Group by topic category and find patterns
        category_scores: dict[str, list[float]] = {}
        for item in top:
            topic = item["topic"]
            # Simple category extraction (first word or tag)
            category = topic.split("_")[0] if "_" in topic else topic.split()[0]
            category_scores.setdefault(category, []).append(item["score"])

        # Rank categories by average score
        ranked_categories = sorted(
            category_scores.items(),
            key=lambda x: sum(x[1]) / len(x[1]),
            reverse=True,
        )

        suggestions = []
        for category, scores in ranked_categories[:count]:
            avg_score = sum(scores) / len(scores)
            suggestions.append({
                "topic": category,
                "avg_score": round(avg_score, 2),
                "video_count": len(scores),
                "rationale": f"Category '{category}' averages {avg_score:.1f} score across {len(scores)} videos.",
                "confidence": min(len(scores) / 5.0, 1.0),  # More data = more confidence
            })

        return suggestions

    def save_learning(self, channel_id: str, data: dict[str, Any]) -> Path:
        """Save a learning/insight to the channel's learnings directory.

        Args:
            channel_id: Channel identifier.
            data: Learning data (should include 'type', 'insight', 'source').

        Returns:
            Path to the saved learning file.
        """
        learnings_dir = self._learnings_dir(channel_id)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"learning_{timestamp}.json"
        filepath = learnings_dir / filename

        enriched = {
            "timestamp": datetime.now().isoformat(),
            "channel_id": channel_id,
            **data,
        }

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(enriched, f, ensure_ascii=False, indent=2)

        return filepath

    # ── YouTube Analytics API (TODO) ─────────────────────────

    def fetch_youtube_analytics(self, channel_id: str) -> dict:
        """Fetch performance data from YouTube Analytics API.

        TODO: Implement OAuth flow + API calls:
            1. Authenticate with YouTube Analytics API
            2. Fetch video-level metrics (views, watch time, retention)
            3. Save snapshot to data/performance/<channel_id>/
            4. Return parsed data

        Requires:
            - YouTube API OAuth credentials
            - Channel linked to YouTube account
        """
        raise NotImplementedError(
            "YouTube Analytics API integration is not yet implemented. "
            "Manually place performance JSON files in data/performance/<channel_id>/."
        )

    # ── Helpers ───────────────────────────────────────────────

    @staticmethod
    def _find_latest_json(directory: Path) -> Path | None:
        """Find the most recently modified JSON file in a directory."""
        json_files = sorted(
            directory.glob("*.json"),
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )
        return json_files[0] if json_files else None
