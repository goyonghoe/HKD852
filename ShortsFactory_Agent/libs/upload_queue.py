#!/usr/bin/env python3
"""
YouTube Shorts 업로드 대기열 관리
파일 기반 큐 — JSON 상태 파일 + 파일 잠금
"""

import argparse
import fcntl
import json
import os
import re
import tempfile
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

# ── Paths ─────────────────────────────────────────────────
AGENT_DIR = Path(__file__).resolve().parent.parent
PIPELINE_DIR = AGENT_DIR / "pipeline"
QUEUE_DIR = PIPELINE_DIR / "queue"
QUEUE_FILE = QUEUE_DIR / "upload_queue.json"
SCRIPTS_DIR = PIPELINE_DIR / "scripts"
RENDERED_DIR = PIPELINE_DIR / "rendered" / "samples"

# ── Defaults ──────────────────────────────────────────────
MAX_DAILY_UPLOADS = 3
MAX_RETRIES = 3


@dataclass
class QueueEntry:
    """업로드 대기열 항목."""

    queue_id: str
    episode_id: str
    status: str  # pending, approved, uploading, uploaded, failed, rejected
    added_at: str
    script_path: str
    video_path: str
    metadata: dict
    approved_at: Optional[str] = None
    uploaded_at: Optional[str] = None
    upload_result: Optional[dict] = None
    error: Optional[str] = None
    retry_count: int = 0
    max_retries: int = MAX_RETRIES


# ── Internal helpers ──────────────────────────────────────


def _now_iso() -> str:
    """현재 시간을 ISO 8601 형식으로 반환 (KST)."""
    from datetime import timedelta

    kst = timezone(timedelta(hours=9))
    return datetime.now(kst).isoformat(timespec="seconds")


def _ensure_queue_dir():
    QUEUE_DIR.mkdir(parents=True, exist_ok=True)


def _load_queue() -> dict:
    """큐 파일 로드 (파일 잠금 적용)."""
    _ensure_queue_dir()
    if not QUEUE_FILE.exists():
        return {"version": "1.0", "updated_at": _now_iso(), "entries": []}

    with open(QUEUE_FILE, "r", encoding="utf-8") as f:
        fcntl.flock(f, fcntl.LOCK_SH)
        try:
            data = json.load(f)
        finally:
            fcntl.flock(f, fcntl.LOCK_UN)
    return data


def _save_queue(queue_data: dict):
    """큐 파일 저장 (원자적 쓰기 — temp → rename)."""
    _ensure_queue_dir()
    queue_data["updated_at"] = _now_iso()

    # 원자적 쓰기: temp 파일에 먼저 쓰고 rename
    fd, tmp_path = tempfile.mkstemp(
        dir=str(QUEUE_DIR), suffix=".tmp", prefix="queue_"
    )
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            fcntl.flock(f, fcntl.LOCK_EX)
            json.dump(queue_data, f, ensure_ascii=False, indent=2)
            fcntl.flock(f, fcntl.LOCK_UN)
        os.rename(tmp_path, str(QUEUE_FILE))
    except Exception:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        raise


def _find_entry(queue_data: dict, queue_id: str) -> Optional[dict]:
    """큐 ID로 항목 찾기."""
    for entry in queue_data["entries"]:
        if entry["queue_id"] == queue_id:
            return entry
    return None


def _find_latest_video(episode_id: str) -> Optional[str]:
    """에피소드의 최신 렌더링 MP4 파일 찾기."""
    ep_dir = RENDERED_DIR / episode_id
    if not ep_dir.exists():
        return None

    mp4_files = sorted(ep_dir.glob("*.mp4"), key=lambda p: p.stat().st_mtime)
    if mp4_files:
        return str(mp4_files[-1])
    return None


def _load_script_metadata(script_path: str) -> dict:
    """스크립트 JSON에서 메타데이터 추출 (메타데이터 전략 v2).

    metadata_gen.format_for_youtube()를 사용하여 일관된 포맷 보장.
    """
    with open(script_path, "r", encoding="utf-8") as f:
        script = json.load(f)

    try:
        from metadata_gen import format_for_youtube
        return format_for_youtube(script)
    except ImportError:
        # fallback: metadata_gen을 임포트할 수 없는 경우
        import sys
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        from metadata_gen import format_for_youtube
        return format_for_youtube(script)


# ── Public API ────────────────────────────────────────────


def generate_queue_id() -> str:
    """고유 큐 ID 생성 — uq_YYYYMMDD_NNN 형식."""
    queue_data = _load_queue()
    today = datetime.now().strftime("%Y%m%d")
    prefix = f"uq_{today}_"

    existing = [
        e["queue_id"]
        for e in queue_data["entries"]
        if e["queue_id"].startswith(prefix)
    ]
    if existing:
        nums = []
        for qid in existing:
            m = re.search(r"_(\d+)$", qid)
            if m:
                nums.append(int(m.group(1)))
        next_num = max(nums) + 1 if nums else 1
    else:
        next_num = 1

    return f"{prefix}{next_num:03d}"


def add_to_queue(
    episode_id: str,
    video_path: Optional[str] = None,
    script_path: Optional[str] = None,
) -> QueueEntry:
    """에피소드를 업로드 대기열에 추가."""
    queue_data = _load_queue()

    # 이미 큐에 있는지 확인 (uploaded/rejected 제외)
    active_statuses = {"pending", "approved", "uploading"}
    for entry in queue_data["entries"]:
        if entry["episode_id"] == episode_id and entry["status"] in active_statuses:
            raise ValueError(
                f"{episode_id}은 이미 큐에 있습니다 (status: {entry['status']})"
            )

    # 스크립트 경로 자동 탐색
    if not script_path:
        script_path = str(SCRIPTS_DIR / f"{episode_id}.json")
    if not os.path.exists(script_path):
        raise FileNotFoundError(f"스크립트 파일 없음: {script_path}")

    # 비디오 경로 자동 탐색
    if not video_path:
        video_path = _find_latest_video(episode_id)
    if not video_path or not os.path.exists(video_path):
        raise FileNotFoundError(
            f"비디오 파일 없음: {video_path or f'rendered/samples/{episode_id}/'}"
        )

    # 메타데이터 추출
    metadata = _load_script_metadata(script_path)

    entry = QueueEntry(
        queue_id=generate_queue_id(),
        episode_id=episode_id,
        status="pending",
        added_at=_now_iso(),
        script_path=script_path,
        video_path=video_path,
        metadata=metadata,
    )

    queue_data["entries"].append(asdict(entry))
    _save_queue(queue_data)

    print(f"  + {entry.queue_id}: {episode_id} → pending")
    return entry


def list_queue(status_filter: Optional[str] = None) -> list[dict]:
    """대기열 목록 조회."""
    queue_data = _load_queue()
    entries = queue_data["entries"]

    if status_filter:
        entries = [e for e in entries if e["status"] == status_filter]

    return entries


def approve_entry(queue_id: str) -> dict:
    """항목 승인 (pending → approved)."""
    queue_data = _load_queue()
    entry = _find_entry(queue_data, queue_id)
    if not entry:
        raise ValueError(f"큐 ID 없음: {queue_id}")
    if entry["status"] != "pending":
        raise ValueError(
            f"{queue_id}는 pending 상태가 아님 (현재: {entry['status']})"
        )

    entry["status"] = "approved"
    entry["approved_at"] = _now_iso()
    _save_queue(queue_data)
    print(f"  ✓ {queue_id}: approved")
    return entry


def approve_all_pending() -> list[dict]:
    """모든 pending 항목 일괄 승인."""
    queue_data = _load_queue()
    approved = []

    for entry in queue_data["entries"]:
        if entry["status"] == "pending":
            entry["status"] = "approved"
            entry["approved_at"] = _now_iso()
            approved.append(entry)
            print(f"  ✓ {entry['queue_id']}: approved")

    if approved:
        _save_queue(queue_data)
    return approved


def reject_entry(queue_id: str, reason: str = "") -> dict:
    """항목 거부 (pending → rejected)."""
    queue_data = _load_queue()
    entry = _find_entry(queue_data, queue_id)
    if not entry:
        raise ValueError(f"큐 ID 없음: {queue_id}")

    entry["status"] = "rejected"
    entry["error"] = reason or "CEO 거부"
    _save_queue(queue_data)
    print(f"  ✗ {queue_id}: rejected ({reason})")
    return entry


def mark_uploading(queue_id: str) -> dict:
    """업로드 시작 (approved → uploading)."""
    queue_data = _load_queue()
    entry = _find_entry(queue_data, queue_id)
    if not entry:
        raise ValueError(f"큐 ID 없음: {queue_id}")

    entry["status"] = "uploading"
    _save_queue(queue_data)
    return entry


def mark_uploaded(queue_id: str, upload_result: dict) -> dict:
    """업로드 완료 (uploading → uploaded)."""
    queue_data = _load_queue()
    entry = _find_entry(queue_data, queue_id)
    if not entry:
        raise ValueError(f"큐 ID 없음: {queue_id}")

    entry["status"] = "uploaded"
    entry["uploaded_at"] = _now_iso()
    entry["upload_result"] = upload_result

    _save_queue(queue_data)

    # 스크립트 JSON에 upload_info 기록
    _write_upload_info_to_script(entry)

    print(
        f"  ✓ {queue_id}: uploaded → {upload_result.get('youtube_url', 'N/A')}"
    )
    return entry


def mark_failed(queue_id: str, error: str) -> dict:
    """업로드 실패 (uploading → failed 또는 approved로 재시도)."""
    queue_data = _load_queue()
    entry = _find_entry(queue_data, queue_id)
    if not entry:
        raise ValueError(f"큐 ID 없음: {queue_id}")

    entry["retry_count"] = entry.get("retry_count", 0) + 1
    entry["error"] = error

    if entry["retry_count"] < entry.get("max_retries", MAX_RETRIES):
        entry["status"] = "approved"  # 자동 재시도 대상
        print(
            f"  ⟳ {queue_id}: retry {entry['retry_count']}/{entry.get('max_retries', MAX_RETRIES)}"
        )
    else:
        entry["status"] = "failed"
        print(f"  ✗ {queue_id}: failed (max retries) — {error}")

    _save_queue(queue_data)
    return entry


def get_upload_ready() -> list[dict]:
    """approved 상태 항목 반환 (업로드 대상)."""
    return list_queue(status_filter="approved")


def get_daily_upload_count() -> int:
    """오늘 업로드된 건수."""
    queue_data = _load_queue()
    today = datetime.now().strftime("%Y-%m-%d")
    count = 0
    for entry in queue_data["entries"]:
        uploaded_at = entry.get("uploaded_at", "")
        if uploaded_at and today in uploaded_at:
            count += 1
    return count


def get_queue_summary() -> dict:
    """큐 상태 요약."""
    queue_data = _load_queue()
    summary = {
        "total": len(queue_data["entries"]),
        "pending": 0,
        "approved": 0,
        "uploading": 0,
        "uploaded": 0,
        "failed": 0,
        "rejected": 0,
    }
    for entry in queue_data["entries"]:
        status = entry.get("status", "unknown")
        if status in summary:
            summary[status] += 1

    summary["daily_uploads"] = get_daily_upload_count()
    summary["daily_limit"] = MAX_DAILY_UPLOADS
    summary["daily_remaining"] = MAX_DAILY_UPLOADS - summary["daily_uploads"]

    return summary


def format_queue_table(entries: list[dict]) -> str:
    """큐를 마크다운 테이블로 포맷."""
    if not entries:
        return "큐가 비어 있습니다."

    lines = [
        "| # | Queue ID | Episode | Title | Status | Added |",
        "|---|----------|---------|-------|--------|-------|",
    ]
    for i, e in enumerate(entries, 1):
        title = e.get("metadata", {}).get("title", "N/A")
        if len(title) > 25:
            title = title[:22] + "..."
        added = e.get("added_at", "")[:16].replace("T", " ")

        url = ""
        if e.get("upload_result", {}) and e["upload_result"].get("youtube_url"):
            url = f" | [{e['upload_result']['youtube_url']}]"
        else:
            url = " |"

        lines.append(
            f"| {i} | {e['queue_id']} | {e['episode_id']} | {title} | {e['status']} | {added}{url}"
        )

    return "\n".join(lines)


def _write_upload_info_to_script(entry: dict):
    """스크립트 JSON에 upload_info 기록."""
    script_path = entry.get("script_path", "")
    if not script_path or not os.path.exists(script_path):
        return

    try:
        with open(script_path, "r", encoding="utf-8") as f:
            script = json.load(f)

        script["upload_info"] = {
            "youtube_video_id": entry["upload_result"].get("video_id"),
            "youtube_url": entry["upload_result"].get("youtube_url"),
            "uploaded_at": entry["uploaded_at"],
            "privacy_status": entry["upload_result"].get("privacy_status", "private"),
        }

        with open(script_path, "w", encoding="utf-8") as f:
            json.dump(script, f, ensure_ascii=False, indent=2)
            f.write("\n")
    except Exception as e:
        print(f"  [warn] upload_info 기록 실패: {e}")


# ── CLI ───────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="YouTube Shorts 업로드 대기열 관리"
    )
    subparsers = parser.add_subparsers(dest="command", help="명령")

    # add
    add_p = subparsers.add_parser("add", help="에피소드를 큐에 추가")
    add_p.add_argument(
        "--episode", "-e", nargs="+", required=True,
        help="에피소드 ID (복수 가능)",
    )
    add_p.add_argument("--video", help="비디오 파일 경로 (자동 탐색)")

    # list
    list_p = subparsers.add_parser("list", help="큐 목록 조회")
    list_p.add_argument("--status", "-s", help="상태 필터")

    # approve
    approve_p = subparsers.add_parser("approve", help="항목 승인")
    approve_p.add_argument("--id", help="큐 ID")
    approve_p.add_argument("--all", action="store_true", help="전체 pending 승인")

    # reject
    reject_p = subparsers.add_parser("reject", help="항목 거부")
    reject_p.add_argument("--id", required=True, help="큐 ID")
    reject_p.add_argument("--reason", default="", help="거부 사유")

    # upload
    upload_p = subparsers.add_parser("upload", help="승인된 항목 업로드")
    upload_p.add_argument(
        "--dry-run", action="store_true", help="실제 업로드 없이 검증만"
    )

    # status
    subparsers.add_parser("status", help="큐 요약")

    args = parser.parse_args()

    if args.command == "add":
        print("=== 큐에 추가 ===")
        for ep_id in args.episode:
            try:
                add_to_queue(ep_id, video_path=args.video)
            except (ValueError, FileNotFoundError) as e:
                print(f"  ! {ep_id}: {e}")

    elif args.command == "list":
        entries = list_queue(status_filter=args.status)
        print(format_queue_table(entries))

    elif args.command == "approve":
        if args.all:
            approved = approve_all_pending()
            print(f"\n{len(approved)}개 항목 승인 완료")
        elif args.id:
            approve_entry(args.id)
        else:
            print("--id 또는 --all 필요")

    elif args.command == "reject":
        reject_entry(args.id, reason=args.reason)

    elif args.command == "upload":
        _execute_uploads(dry_run=args.dry_run)

    elif args.command == "status":
        summary = get_queue_summary()
        print("=== 업로드 큐 상태 ===")
        for k, v in summary.items():
            print(f"  {k}: {v}")

    else:
        parser.print_help()


def _execute_uploads(dry_run: bool = False):
    """승인된 항목 업로드 실행."""
    ready = get_upload_ready()
    if not ready:
        print("업로드 대상 없음 (approved 항목이 없습니다)")
        return

    daily_count = get_daily_upload_count()
    remaining = MAX_DAILY_UPLOADS - daily_count
    if remaining <= 0:
        print(f"일일 한도 초과 ({MAX_DAILY_UPLOADS}개/일). 내일 다시 시도하세요.")
        return

    # 한도 내에서만 업로드
    to_upload = ready[:remaining]
    print(f"=== 업로드 {'(DRY RUN) ' if dry_run else ''}===")
    print(f"대상: {len(to_upload)}개 (일일 잔여: {remaining}개)")

    if dry_run:
        for entry in to_upload:
            print(f"  [dry-run] {entry['queue_id']}: {entry['episode_id']}")
            print(f"    video: {entry['video_path']}")
            print(f"    title: {entry['metadata'].get('title', 'N/A')}")
            # ffprobe 검증
            try:
                from youtube_uploader import validate_video_for_shorts

                result = validate_video_for_shorts(entry["video_path"])
                status = "OK" if result["valid"] else f"FAIL: {result['issues']}"
                print(f"    validate: {status}")
            except ImportError:
                print("    validate: youtube_uploader.py 필요")
        return

    # 실제 업로드
    try:
        from youtube_uploader import upload_video, UploadRequest, resolve_channel
    except ImportError:
        print("ERROR: youtube_uploader.py를 찾을 수 없습니다")
        return

    for entry in to_upload:
        queue_id = entry["queue_id"]
        episode_id = entry["episode_id"]

        # 채널 라우팅: 스크립트의 series 필드 또는 episode_id로 결정
        series = ""
        script_path = entry.get("script_path", "")
        if script_path and os.path.exists(script_path):
            try:
                with open(script_path, "r", encoding="utf-8") as f:
                    script_data = json.load(f)
                series = script_data.get("series", "")
            except Exception:
                pass

        channel_id = resolve_channel(episode_id=episode_id, series=series)
        channel_label = f" → {channel_id}" if channel_id else ""
        print(f"\n  [{queue_id}] {episode_id} 업로드 중...{channel_label}")
        mark_uploading(queue_id)

        try:
            request = UploadRequest(
                video_path=entry["video_path"],
                title=entry["metadata"]["title"],
                description=entry["metadata"]["description"],
                tags=entry["metadata"]["tags"],
                category_id=entry["metadata"].get("category_id", "24"),
                privacy_status=entry["metadata"].get("privacy_status", "private"),
            )
            result = upload_video(request, channel_id=channel_id)

            if result.success:
                mark_uploaded(
                    queue_id,
                    {
                        "video_id": result.video_id,
                        "youtube_url": result.url,
                        "upload_timestamp": result.upload_timestamp,
                        "privacy_status": result.privacy_status,
                    },
                )
            else:
                mark_failed(queue_id, result.error or "Unknown error")

        except Exception as e:
            mark_failed(queue_id, str(e))

    # 결과 요약
    summary = get_queue_summary()
    print(f"\n=== 완료 ===")
    print(f"  uploaded: {summary['uploaded']}")
    print(f"  failed: {summary['failed']}")
    print(f"  일일 잔여: {summary['daily_remaining']}개")


if __name__ == "__main__":
    main()
