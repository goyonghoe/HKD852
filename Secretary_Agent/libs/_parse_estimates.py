#!/usr/bin/env python3
"""Parse estimates.json for shell scripts. Usage: python3 _parse_estimates.py <filepath> <today> <mode>
Modes: morning, evening_incomplete, nudge_overrun
"""
import json, sys, os
from datetime import datetime

def main():
    if len(sys.argv) < 4:
        print("NO_FILE")
        return

    filepath, today, mode = sys.argv[1], sys.argv[2], sys.argv[3]

    if not os.path.isfile(filepath):
        if mode == "morning":
            print("NO_FILE")
        return

    try:
        with open(filepath) as f:
            data = json.load(f)
    except (json.JSONDecodeError, IOError):
        if mode == "morning":
            print("NO_FILE")
        return

    records = data.get("records", [])
    capacity = data.get("daily_capacity_hours", 8)

    if mode == "morning":
        tasks = [r for r in records
                 if r.get("date") == today and r.get("status") in ("planned", "in_progress")]
        committed = sum(r.get("adjusted_hours", 0) for r in tasks)
        remaining = capacity - committed

        lines = []
        for t in tasks:
            icon = "\U0001f504" if t.get("status") == "in_progress" else "\u2b1c"
            hrs = t.get("adjusted_hours", "?")
            name = t.get("task", "unnamed")
            lines.append(f"  {icon} {name} ({hrs}h)")

        task_list = "\n".join(lines) if lines else "  (\uc624\ub298 \ub4f1\ub85d\ub41c \uc791\uc5c5 \uc5c6\uc74c)"

        print(f"TASKS:{len(tasks)}")
        print(f"COMMITTED:{committed}")
        print(f"REMAINING:{remaining}")
        print(f"CAPACITY:{capacity}")
        print(f"TASKLIST:{task_list}")

    elif mode == "evening_incomplete":
        incomplete = [r for r in records
                      if r.get("date") == today and r.get("status") in ("planned", "in_progress")]
        if incomplete:
            print("")
            print("\U0001f4dd \ubbf8\uc644\ub8cc \uc791\uc5c5:")
            for t in incomplete:
                icon = "\U0001f504" if t.get("status") == "in_progress" else "\u2b1c"
                name = t.get("task", "unnamed")
                print(f"  {icon} {name}")

    elif mode == "nudge_overrun":
        now = datetime.now()
        for r in records:
            if r.get("date") != today or r.get("status") != "in_progress":
                continue
            started_at = r.get("started_at")
            if not started_at:
                continue
            adjusted = r.get("adjusted_hours", 0)
            if adjusted <= 0:
                continue
            try:
                start_time = datetime.fromisoformat(started_at)
                elapsed = (now - start_time).total_seconds() / 3600
            except (ValueError, TypeError):
                continue
            name = r.get("task", "unnamed")
            if elapsed > adjusted * 1.5:
                print(f"critical|{name}|{elapsed:.1f}|{adjusted:.1f}")
            elif elapsed > adjusted:
                print(f"warn|{name}|{elapsed:.1f}|{adjusted:.1f}")

if __name__ == "__main__":
    main()
