#!/usr/bin/env python3
"""
Kowloon-Board.md 파서 — Obsidian 칸반 보드를 읽어서 JSON으로 출력
Usage: python3 parse_board.py [board_path] [--section 오늘|진행|백로그|이번주|대기|완료]

Output format:
{
  "sections": {
    "백로그": [{"task": "...", "hours": null, "category": null, "done": false}],
    "이번 주 내": [...],
    "오늘 할 일": [...],
    "진행 중": [...],
    "대기 (승인/응답 필요)": [...],
    "완료": [...]
  },
  "summary": {
    "today_count": 6,
    "in_progress_count": 7,
    "today_total_hours": 12.5,
    "capacity_warning": true
  }
}

태그 형식:
  - [ ] 작업명 ⏱️3h              ← 시간만 (기본 보정 2x 적용)
  - [ ] 작업명 ⏱️?h              ← 추정 불가 (스파이크 제안)
  - [ ] 작업명 ⏱️2h #메모        ← 자유 메모 (나중에 패턴 분석용)
  - [ ] 작업명                    ← 태그 없음 (미추정 경고)
"""

import json
import re
import sys
import os

DEFAULT_BOARD = "/Users/yong/MainFolder/My_AI_Project/HKD852_Vault/Kowloon-Board.md"
DEFAULT_CAPACITY = 8
DEFAULT_CORRECTION = 2.0  # Kowloon 초기 보정계수 (데이터 쌓이면 자동 조정)

def parse_task(line: str) -> dict:
    """Parse a single task line."""
    done = line.strip().startswith("- [x]")

    # Remove checkbox prefix
    text = re.sub(r'^-\s*\[[ x]\]\s*', '', line.strip())

    # Extract hours: #3h or #1.5h or ⏰3h or ⏱️3h
    hours_match = re.search(r'(?:#|[⏰⏱️])\s*([\d.]+)\s*h\b', text)
    unknown_match = re.search(r'(?:#|[⏰⏱️])\s*\?\s*h\b', text)
    hours = float(hours_match.group(1)) if hours_match else None
    unknown = bool(unknown_match)

    # Extract free-form memo tags: #태그 (but not #3h style time tags)
    memos = re.findall(r'#(\S+)', text)
    memos = [m for m in memos if not re.match(r'^[\d.?]+h$', m)]  # exclude time tags
    memo = ' '.join(memos) if memos else None

    # Clean task name (remove all # tags and emoji tags)
    task_name = re.sub(r'\s*[⏰⏱️][\d.?]+h', '', text)
    task_name = re.sub(r'\s*#\S+', '', task_name)
    task_name = task_name.strip()

    return {
        "task": task_name,
        "hours": hours,
        "adjusted_hours": round(hours * DEFAULT_CORRECTION, 1) if hours else None,
        "unknown": unknown,
        "memo": memo,
        "done": done
    }

def parse_board(filepath: str) -> dict:
    """Parse the entire Kowloon-Board.md."""
    if not os.path.isfile(filepath):
        return {"error": f"File not found: {filepath}", "sections": {}, "summary": {}}

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove kanban settings block
    content = re.sub(r'%%\s*kanban:settings.*?%%', '', content, flags=re.DOTALL)
    # Remove YAML frontmatter
    content = re.sub(r'^---.*?---', '', content, flags=re.DOTALL)

    sections = {}
    current_section = None

    for line in content.split('\n'):
        # Section header (must start at column 0)
        header_match = re.match(r'^##\s+(.+)$', line)
        if header_match:
            current_section = header_match.group(1).strip()
            sections[current_section] = []
            continue

        # Task line — top-level only (starts with "- [", not indented)
        if current_section and re.match(r'^- \[[ x]\]', line):
            task = parse_task(line)
            sections[current_section].append(task)

    # Calculate summary
    today_tasks = sections.get("오늘 할 일", [])
    in_progress_tasks = sections.get("진행 중", [])

    # Raw hours (Kowloon's estimate)
    today_hours = sum(t["hours"] for t in today_tasks if t["hours"] is not None)
    in_progress_hours = sum(t["hours"] for t in in_progress_tasks if t["hours"] is not None)

    # Adjusted hours (with correction factor)
    today_adjusted = sum(t["adjusted_hours"] for t in today_tasks if t["adjusted_hours"] is not None)
    in_progress_adjusted = sum(t["adjusted_hours"] for t in in_progress_tasks if t["adjusted_hours"] is not None)

    today_no_estimate = sum(1 for t in today_tasks if t["hours"] is None and not t.get("unknown"))
    today_unknown = sum(1 for t in today_tasks if t.get("unknown"))
    in_progress_no_estimate = sum(1 for t in in_progress_tasks if t["hours"] is None and not t.get("unknown"))
    in_progress_unknown = sum(1 for t in in_progress_tasks if t.get("unknown"))

    total_active = len(today_tasks) + len(in_progress_tasks)
    total_raw = today_hours + in_progress_hours
    total_adjusted = today_adjusted + in_progress_adjusted

    summary = {
        "today_count": len(today_tasks),
        "in_progress_count": len(in_progress_tasks),
        "total_active": total_active,
        "raw_hours": total_raw,
        "adjusted_hours": total_adjusted,
        "correction": DEFAULT_CORRECTION,
        "no_estimate_count": today_no_estimate + in_progress_no_estimate,
        "unknown_count": today_unknown + in_progress_unknown,
        "capacity": DEFAULT_CAPACITY,
        "remaining": DEFAULT_CAPACITY - total_adjusted if total_adjusted > 0 else None,
        "capacity_warning": total_adjusted > DEFAULT_CAPACITY if total_adjusted > 0 else total_active > 5,
        "overloaded": total_active > 8
    }

    return {"sections": sections, "summary": summary}

def format_telegram(data: dict) -> str:
    """Format board data for Telegram message."""
    s = data["summary"]
    sections = data["sections"]

    lines = [f"📅 Kowloon Board 현황\n"]

    # Active tasks
    lines.append(f"📌 활성: {s['total_active']}개 (오늘 {s['today_count']} + 진행 {s['in_progress_count']})")

    # Hours with correction
    if s["raw_hours"] > 0:
        lines.append(f"⏱️ 추정: {s['raw_hours']}h → 보정(x{s['correction']}): {s['adjusted_hours']}h / 가용 {s['capacity']}h")
        if s["remaining"] is not None:
            if s["remaining"] < 0:
                lines.append(f"🚨 용량 초과: {abs(s['remaining'])}h 부족!")
            elif s["remaining"] < 1:
                lines.append(f"⚠️ 빡빡함: 잔여 {s['remaining']}h")
            else:
                lines.append(f"✅ 잔여: {s['remaining']}h")

    if s["unknown_count"] > 0:
        lines.append(f"❔ 추정 불가: {s['unknown_count']}개 (⏱️?h → 30분 스파이크 후 재추정)")

    if s["no_estimate_count"] > 0:
        lines.append(f"❓ 미추정: {s['no_estimate_count']}개 (⏱️Xh 추가 필요)")

    if s["overloaded"]:
        lines.append(f"\n🚧 [관리관] 동시 {s['total_active']}개는 과부하. TOP 3에 집중하세요.")

    # Today's tasks
    today = sections.get("오늘 할 일", [])
    if today:
        lines.append(f"\n📋 오늘 할 일:")
        for t in today:
            if t.get("unknown"):
                h = " (❔추정불가)"
            elif t["hours"]:
                h = f" ({t['hours']}h→{t['adjusted_hours']}h)"
            else:
                h = ""
            memo = f" [{t['memo']}]" if t.get("memo") else ""
            lines.append(f"  ▫️ {t['task']}{h}{memo}")

    # In progress
    wip = sections.get("진행 중", [])
    if wip:
        lines.append(f"\n🔄 진행 중:")
        for t in wip:
            if t.get("unknown"):
                h = " (❔추정불가)"
            elif t["hours"]:
                h = f" ({t['hours']}h→{t['adjusted_hours']}h)"
            else:
                h = ""
            memo = f" [{t['memo']}]" if t.get("memo") else ""
            lines.append(f"  ▶️ {t['task']}{h}{memo}")

    # Waiting
    waiting = sections.get("대기 (승인/응답 필요)", [])
    if waiting:
        lines.append(f"\n⏳ 대기: {len(waiting)}개")

    return "\n".join(lines)


if __name__ == "__main__":
    board_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_BOARD

    # Check for --telegram flag
    telegram_mode = "--telegram" in sys.argv

    # Check for --section filter
    section_filter = None
    if "--section" in sys.argv:
        idx = sys.argv.index("--section")
        if idx + 1 < len(sys.argv):
            section_filter = sys.argv[idx + 1]

    data = parse_board(board_path)

    if telegram_mode:
        print(format_telegram(data))
    elif section_filter:
        filtered = data["sections"].get(section_filter, [])
        print(json.dumps(filtered, ensure_ascii=False, indent=2))
    else:
        print(json.dumps(data, ensure_ascii=False, indent=2))
