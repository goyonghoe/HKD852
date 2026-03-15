#!/usr/bin/env python3
"""Parse worklog.json for shell scripts. Usage: python3 _parse_worklog.py <filepath> <today>"""
import json, sys, os

def main():
    if len(sys.argv) < 3:
        print("0")
        return

    filepath, today = sys.argv[1], sys.argv[2]

    if not os.path.isfile(filepath):
        print("0")
        return

    try:
        with open(filepath) as f:
            data = json.load(f)
    except (json.JSONDecodeError, IOError):
        print("0")
        return

    entries = data.get("entries", [])
    total = sum(
        e.get("hours", e.get("actual_hours", 0))
        for e in entries
        if e.get("date", "") == today
    )
    print(f"{total:.1f}")

if __name__ == "__main__":
    main()
