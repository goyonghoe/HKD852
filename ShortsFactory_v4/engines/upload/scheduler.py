"""
Upload Scheduler — manages upload timing and queue for multi-channel operations.

Determines optimal upload times per channel, queues videos,
and processes the queue in order.
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

# Project root for ShortsFactory_v4
_V4_ROOT = Path(__file__).resolve().parent.parent.parent

# Default upload queue location
_QUEUE_DIR = _V4_ROOT / "pipeline" / "upload_queue"
_QUEUE_DIR.mkdir(parents=True, exist_ok=True)


# Optimal posting hours by region (UTC offsets)
# Based on typical YouTube Shorts engagement patterns
_OPTIMAL_HOURS: dict[str, list[int]] = {
    "US": [13, 17, 20],       # 9AM, 1PM, 4PM EST
    "KR": [7, 12, 18],        # 4PM, 9PM, 3AM KST (next day prime time)
    "JP": [7, 11, 18],        # 4PM, 8PM, 3AM JST
    "EU": [8, 12, 17],        # 9AM, 1PM, 6PM CET
    "global": [12, 16, 20],   # Balanced UTC spread
}


class UploadScheduler:
    """Manages upload scheduling and queue processing.

    Queue files are stored as JSON in pipeline/upload_queue/.
    Each file represents one pending upload with metadata and scheduling info.
    """

    def __init__(self, queue_dir: Path | None = None):
        self.queue_dir = queue_dir or _QUEUE_DIR
        self.queue_dir.mkdir(parents=True, exist_ok=True)

    def get_optimal_time(
        self,
        channel_id: str,
        region: str = "global",
        after: datetime | None = None,
    ) -> datetime:
        """Calculate the next optimal upload time for a channel.

        Considers:
            - Channel's target region for timezone-aware scheduling
            - Avoids scheduling too close to existing queued uploads
            - Returns the next available slot after `after` (default: now)

        Args:
            channel_id: Channel identifier.
            region: Target region ('US', 'KR', 'JP', 'EU', 'global').
            after: Earliest allowed time (default: now UTC).

        Returns:
            Optimal upload datetime in UTC.
        """
        now = after or datetime.now(timezone.utc)
        hours = _OPTIMAL_HOURS.get(region, _OPTIMAL_HOURS["global"])

        # Find existing queued times for this channel to avoid conflicts
        queued_times = self._get_queued_times(channel_id)

        # Try each optimal hour starting from now
        for day_offset in range(3):  # Look up to 3 days ahead
            for hour in hours:
                candidate = now.replace(
                    hour=hour, minute=0, second=0, microsecond=0,
                ) + timedelta(days=day_offset)

                if candidate <= now:
                    continue

                # Ensure at least 2 hours gap from other queued uploads
                too_close = any(
                    abs((candidate - qt).total_seconds()) < 7200
                    for qt in queued_times
                )
                if not too_close:
                    return candidate

        # Fallback: 3 hours from now
        return now + timedelta(hours=3)

    def queue_upload(
        self,
        video_path: Path,
        metadata: dict[str, Any],
        scheduled_time: datetime,
    ) -> Path:
        """Add a video to the upload queue.

        Args:
            video_path: Path to the rendered video file.
            metadata: Upload metadata (title, description, tags, channel_id, etc).
            scheduled_time: When to upload (UTC).

        Returns:
            Path to the queue entry JSON file.
        """
        channel_id = metadata.get("channel_id", "default")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        queue_file = self.queue_dir / f"{channel_id}_{timestamp}.json"

        entry = {
            "video_path": str(video_path),
            "metadata": metadata,
            "scheduled_time": scheduled_time.isoformat(),
            "channel_id": channel_id,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "attempts": 0,
        }

        with open(queue_file, "w", encoding="utf-8") as f:
            json.dump(entry, f, ensure_ascii=False, indent=2)

        return queue_file

    def process_queue(self) -> list[dict[str, Any]]:
        """Process all pending uploads whose scheduled time has passed.

        Iterates through queue files, uploads videos that are due,
        and marks them as completed or failed.

        Returns:
            List of result dicts for each processed upload.
        """
        now = datetime.now(timezone.utc)
        results = []

        for queue_file in sorted(self.queue_dir.glob("*.json")):
            with open(queue_file, "r", encoding="utf-8") as f:
                entry = json.load(f)

            if entry.get("status") != "pending":
                continue

            scheduled = datetime.fromisoformat(entry["scheduled_time"])
            # Ensure timezone-aware comparison
            if scheduled.tzinfo is None:
                scheduled = scheduled.replace(tzinfo=timezone.utc)

            if scheduled > now:
                continue  # Not yet time

            # Attempt upload
            result = self._execute_upload(entry, queue_file)
            results.append(result)

        return results

    def get_queue_status(self) -> list[dict[str, Any]]:
        """Get the status of all items in the upload queue.

        Returns:
            List of queue entry summaries.
        """
        entries = []
        for queue_file in sorted(self.queue_dir.glob("*.json")):
            with open(queue_file, "r", encoding="utf-8") as f:
                entry = json.load(f)
            entries.append({
                "file": queue_file.name,
                "channel_id": entry.get("channel_id"),
                "status": entry.get("status"),
                "scheduled_time": entry.get("scheduled_time"),
                "title": entry.get("metadata", {}).get("title", ""),
            })
        return entries

    # ── Internal helpers ─────────────────────────────────────

    def _execute_upload(
        self,
        entry: dict[str, Any],
        queue_file: Path,
    ) -> dict[str, Any]:
        """Execute a single upload from a queue entry.

        Updates the queue file status on completion.
        """
        video_path = Path(entry["video_path"])
        metadata = entry["metadata"]
        entry["attempts"] = entry.get("attempts", 0) + 1

        if not video_path.exists():
            entry["status"] = "failed"
            entry["error"] = f"Video file not found: {video_path}"
            self._save_entry(queue_file, entry)
            return {"status": "failed", "error": entry["error"]}

        try:
            from .youtube_api import upload_video, UploadConfig

            config = UploadConfig(
                title=metadata.get("title", "Untitled"),
                description=metadata.get("description", ""),
                tags=metadata.get("tags", []),
                category_id=metadata.get("category_id", "22"),
                privacy_status=metadata.get("privacy_status", "public"),
            )

            result = upload_video(
                video_path=str(video_path),
                config=config,
                channel_id=metadata.get("channel_id"),
            )

            entry["status"] = "completed"
            entry["upload_result"] = result
            entry["completed_at"] = datetime.now(timezone.utc).isoformat()
            self._save_entry(queue_file, entry)

            return {"status": "completed", "video_id": result.get("video_id")}

        except Exception as e:
            entry["status"] = "failed" if entry["attempts"] >= 3 else "pending"
            entry["error"] = str(e)
            self._save_entry(queue_file, entry)
            return {"status": "failed", "error": str(e)}

    def _get_queued_times(self, channel_id: str) -> list[datetime]:
        """Get scheduled times for all pending uploads for a channel."""
        times = []
        for queue_file in self.queue_dir.glob("*.json"):
            try:
                with open(queue_file, "r", encoding="utf-8") as f:
                    entry = json.load(f)
                if entry.get("channel_id") == channel_id and entry.get("status") == "pending":
                    dt = datetime.fromisoformat(entry["scheduled_time"])
                    if dt.tzinfo is None:
                        dt = dt.replace(tzinfo=timezone.utc)
                    times.append(dt)
            except (json.JSONDecodeError, KeyError):
                continue
        return times

    @staticmethod
    def _save_entry(queue_file: Path, entry: dict[str, Any]) -> None:
        """Save updated queue entry back to file."""
        with open(queue_file, "w", encoding="utf-8") as f:
            json.dump(entry, f, ensure_ascii=False, indent=2)
