#!/bin/bash
# [Supabase] 재사용 가능한 Supabase REST API 헬퍼
# Usage: source supabase_query.sh
#        supabase_query "tasks?status=eq.today&select=title,estimated_hours"
#
# Requires SUPABASE_URL and SUPABASE_KEY in Secretary_Agent/.env

# Load .env if not already loaded
_SQ_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
_SQ_AGENT_DIR="$(cd "$_SQ_SCRIPT_DIR/.." && pwd)"
_SQ_ENV_FILE="$_SQ_AGENT_DIR/.env"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  if [ -f "$_SQ_ENV_FILE" ]; then
    source "$_SQ_ENV_FILE" 2>/dev/null || true
  fi
fi

if [ -z "$SUPABASE_URL" ]; then
  SUPABASE_URL="https://xdzfbhkermzprpsefacs.supabase.co"
fi

# Query Supabase REST API
# $1: endpoint path + query params (e.g. "tasks?status=eq.today&select=title,estimated_hours")
# Returns: JSON response from Supabase
supabase_query() {
  local endpoint="$1"
  curl -s "${SUPABASE_URL}/rest/v1/${endpoint}" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: application/json"
}
