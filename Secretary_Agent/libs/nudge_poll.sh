#!/bin/bash
# [넛지] 진행 중 작업 시간 초과 체크 — Standalone (no Claude Code required)
# Usage: ./nudge_poll.sh
# Cron: 0 */2 9-21 * * * /path/to/Secretary_Agent/libs/nudge_poll.sh
# Data source: Supabase `tasks` table (TaskBoard)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AGENT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# --- Load credentials ---
ENV_FILE="$AGENT_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found" >&2
  exit 1
fi
source "$ENV_FILE"

# --- Load Supabase helper ---
source "$SCRIPT_DIR/supabase_query.sh"

# --- Query in_progress tasks with started_at ---
IP_TASKS=$(supabase_query "tasks?status=eq.in_progress&select=title,estimated_hours,started_at&started_at=not.is.null" 2>/dev/null || echo "[]")

# --- Check for time overruns ---
python3 -c "
import json, sys
from datetime import datetime

raw = '''${IP_TASKS}'''

try:
    tasks = json.loads(raw) if raw.strip() else []
except json.JSONDecodeError:
    sys.exit(0)

now = datetime.now()
for t in tasks:
    started_at = t.get('started_at')
    estimated = t.get('estimated_hours') or 0
    title = t.get('title', 'unnamed')

    if not started_at or estimated <= 0:
        continue

    try:
        start_time = datetime.fromisoformat(started_at.replace('Z', '+00:00')).replace(tzinfo=None)
        elapsed = (now - start_time).total_seconds() / 3600
    except (ValueError, TypeError):
        continue

    if elapsed > estimated * 1.5:
        print(f'critical|{title}|{elapsed:.1f}|{estimated:.1f}')
    elif elapsed > estimated:
        print(f'warn|{title}|{elapsed:.1f}|{estimated:.1f}')
" 2>/dev/null | while IFS='|' read -r LEVEL TASK ELAPSED ADJUSTED; do
  if [ -z "$LEVEL" ]; then
    continue
  fi

  if [ "$LEVEL" = "critical" ]; then
    MSG="🚨 심각한 시간 초과!

「${TASK}」
예상 ${ADJUSTED}h → 현재 ${ELAPSED}h (${ADJUSTED}h의 1.5배 초과)

작업을 분할하거나 중단을 고려하세요."
    "$SCRIPT_DIR/notify.sh" "⏰" "넛지" "$MSG" "critical"

  elif [ "$LEVEL" = "warn" ]; then
    MSG="시간 초과 경고

「${TASK}」
예상 ${ADJUSTED}h → 현재 ${ELAPSED}h

예상보다 오래 걸리고 있습니다. 범위를 줄이거나 도움을 요청하세요."
    "$SCRIPT_DIR/notify.sh" "⏰" "넛지" "$MSG" "warn"
  fi
done
