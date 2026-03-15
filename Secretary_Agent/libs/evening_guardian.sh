#!/bin/bash
# [감시관] 저녁 에너지 체크 — Standalone (no Claude Code required)
# Usage: ./evening_guardian.sh
# Cron: 0 19 * * * /path/to/Secretary_Agent/libs/evening_guardian.sh
# Data source: Supabase `tasks` table (TaskBoard) + local worklog.json

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

# --- Config ---
WORKLOG_FILE="$AGENT_DIR/data/worklog.json"
TODAY=$(date +%Y-%m-%d)
DAY_OF_WEEK=$(date +%u)  # 1=Mon, 7=Sun

# --- Parse worklog.json for today's hours (still local) ---
WORK_HOURS=$(python3 "$SCRIPT_DIR/_parse_worklog.py" "$WORKLOG_FILE" "$TODAY" 2>/dev/null || echo "0")

# --- Query Supabase for incomplete tasks (today + in_progress) ---
TODAY_TASKS=$(supabase_query "tasks?status=eq.today&select=title" 2>/dev/null || echo "[]")
IP_TASKS=$(supabase_query "tasks?status=eq.in_progress&select=title" 2>/dev/null || echo "[]")

INCOMPLETE_TASKS=$(python3 -c "
import json, sys

today_raw = '''${TODAY_TASKS}'''
ip_raw = '''${IP_TASKS}'''

try:
    today_tasks = json.loads(today_raw) if today_raw.strip() else []
except json.JSONDecodeError:
    today_tasks = []

try:
    ip_tasks = json.loads(ip_raw) if ip_raw.strip() else []
except json.JSONDecodeError:
    ip_tasks = []

all_tasks = ip_tasks + today_tasks
if all_tasks:
    print()
    print('📝 미완료 작업:')
    for t in ip_tasks:
        print(f'  🔄 {t.get(\"title\", \"unnamed\")}')
    for t in today_tasks:
        print(f'  ⬜ {t.get(\"title\", \"unnamed\")}')
" 2>/dev/null || echo "")

# --- Determine message based on hours and context ---
IS_WEEKEND=false
if [ "$DAY_OF_WEEK" -ge 6 ]; then
  IS_WEEKEND=true
fi

# Build energy assessment
ENERGY_MSG=""
URGENCY="info"

HOURS_LEVEL=$(python3 -c "h=float('$WORK_HOURS'); print('critical' if h>10 else 'warn' if h>8 else 'ok')" 2>/dev/null || echo "ok")
if [ "$HOURS_LEVEL" = "critical" ]; then
  ENERGY_MSG="🚨 ${WORK_HOURS}시간! 과부하입니다. 지금 당장 쉬세요."
  URGENCY="critical"
elif [ "$HOURS_LEVEL" = "warn" ]; then
  ENERGY_MSG="오늘 ${WORK_HOURS}시간 작업. 충분히 하셨습니다. 마무리하세요."
  URGENCY="warn"
else
  ENERGY_MSG="오늘 ${WORK_HOURS}시간 작업. 건강한 하루였습니다. 좋은 저녁 되세요."
fi

# Weekend warning
WEEKEND_MSG=""
HAS_HOURS=$(python3 -c "print('yes' if float('$WORK_HOURS') > 0 else 'no')" 2>/dev/null || echo "no")
if [ "$IS_WEEKEND" = true ] && [ "$HAS_HOURS" = "yes" ]; then
  WEEKEND_MSG="
🗓 주말 작업 감지. 정말 급한 건가요?"
  [ "$URGENCY" = "info" ] && URGENCY="warn"
fi

# --- Compose message ---
MESSAGE="저녁 에너지 체크

${ENERGY_MSG}${WEEKEND_MSG}${INCOMPLETE_TASKS}"

# --- Send via notify.sh ---
"$SCRIPT_DIR/notify.sh" "☕" "감시관" "$MESSAGE" "$URGENCY"
