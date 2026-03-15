#!/bin/bash
# [비서실장] 아침 브리핑 — Standalone (no Claude Code required)
# Usage: ./morning_brief.sh
# Cron: 0 9 * * * /path/to/Secretary_Agent/libs/morning_brief.sh
# Data source: Supabase `tasks` table (TaskBoard)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AGENT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$AGENT_DIR/.." && pwd)"

# --- Load credentials ---
ENV_FILE="$AGENT_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found" >&2
  exit 1
fi
source "$ENV_FILE" 2>/dev/null || true

# --- Load Supabase helper ---
source "$SCRIPT_DIR/supabase_query.sh"

# --- Config ---
TODAY=$(date +%Y-%m-%d)
CAPACITY=8

# --- Query Supabase for today's and in_progress tasks ---
TODAY_TASKS=$(supabase_query "tasks?status=eq.today&select=id,title,estimated_hours,priority" 2>/dev/null || echo "[]")
IP_TASKS=$(supabase_query "tasks?status=eq.in_progress&select=id,title,estimated_hours,priority,started_at" 2>/dev/null || echo "[]")

# --- Parse task data via python3 (jq alternative) ---
TASK_INFO=$(python3 -c "
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

all_tasks = today_tasks + ip_tasks
task_count = len(all_tasks)
committed = sum(t.get('estimated_hours') or 0 for t in all_tasks)
remaining = $CAPACITY - committed

lines = []
for t in ip_tasks:
    hrs = t.get('estimated_hours') or '?'
    name = t.get('title', 'unnamed')
    lines.append(f'  🔄 {name} ({hrs}h)')
for t in today_tasks:
    hrs = t.get('estimated_hours') or '?'
    name = t.get('title', 'unnamed')
    lines.append(f'  ⬜ {name} ({hrs}h)')

task_list = chr(10).join(lines) if lines else '  (오늘 등록된 작업 없음)'

print(f'TASKS:{task_count}')
print(f'COMMITTED:{committed}')
print(f'REMAINING:{remaining}')
print(f'CAPACITY:$CAPACITY')
print(f'TASKLIST:{task_list}')
" 2>/dev/null || echo "NO_DATA")

# Handle Supabase query failure gracefully
if [ "$TASK_INFO" = "NO_DATA" ] || [ -z "$TASK_INFO" ]; then
  TASK_COUNT=0
  COMMITTED=0
  REMAINING=$CAPACITY
  TASK_LIST="  (Supabase 조회 실패)"
else
  TASK_COUNT=$(echo "$TASK_INFO" | grep '^TASKS:' | cut -d: -f2)
  COMMITTED=$(echo "$TASK_INFO" | grep '^COMMITTED:' | cut -d: -f2)
  REMAINING=$(echo "$TASK_INFO" | grep '^REMAINING:' | cut -d: -f2)
  CAPACITY=$(echo "$TASK_INFO" | grep '^CAPACITY:' | cut -d: -f2)
  TASK_LIST=$(echo "$TASK_INFO" | grep '^TASKLIST:' | cut -d: -f2-)
fi

# --- Git activity (last 24h) ---
GIT_COMMITS=0
GIT_SUMMARY=""
if [ -d "$PROJECT_ROOT/.git" ]; then
  GIT_COMMITS=$(git -C "$PROJECT_ROOT" log --oneline --since="24 hours ago" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$GIT_COMMITS" -gt 0 ]; then
    GIT_SUMMARY="어제 커밋 ${GIT_COMMITS}건"
  else
    GIT_SUMMARY="어제 커밋 없음"
  fi
else
  GIT_SUMMARY="Git 저장소 아님"
fi

# --- Capacity warning ---
CAPACITY_WARNING=""
IS_OVER=$(python3 -c "r=$REMAINING; print('yes' if r < 0 else 'no')" 2>/dev/null || echo "no")
if [ "$IS_OVER" = "yes" ]; then
  OVER=$(python3 -c "print(abs($REMAINING))")
  CAPACITY_WARNING="
⚠️ 수용량 초과! ${OVER}h 오버커밋 상태입니다."
fi

# --- Kowloon-Board (Obsidian) ---
BOARD_FILE="/Users/yong/MainFolder/My_AI_Project/HKD852_Vault/Kowloon-Board.md"
BOARD_MSG=""
URGENCY="info"
if [ -f "$BOARD_FILE" ]; then
  BOARD_MSG=$(python3 "$SCRIPT_DIR/parse_board.py" "$BOARD_FILE" --telegram 2>/dev/null || echo "")
  # Check if overloaded
  BOARD_WARN=$(python3 -c "
import sys; sys.path.insert(0,'$SCRIPT_DIR')
from parse_board import parse_board
d = parse_board('$BOARD_FILE')
s = d['summary']
if s.get('capacity_warning') or s.get('overloaded'): print('warn')
else: print('ok')
" 2>/dev/null || echo "ok")
  [ "$BOARD_WARN" = "warn" ] && URGENCY="warn"
fi

# --- Compose message ---
MESSAGE="아침 브리핑

📅 ${TODAY}

🔀 Git: ${GIT_SUMMARY}

📌 에이전트 계획 (${TASK_COUNT}건):
${TASK_LIST}

⏱ 에이전트 수용량: ${COMMITTED}/${CAPACITY}h 사용, ${REMAINING}h 여유${CAPACITY_WARNING}"

if [ -n "$BOARD_MSG" ]; then
  MESSAGE="${MESSAGE}

━━━━━━━━━━━━━━━

${BOARD_MSG}"
fi

# --- Send via notify.sh ---
"$SCRIPT_DIR/notify.sh" "📋" "비서실장" "$MESSAGE" "$URGENCY"
