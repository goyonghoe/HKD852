#!/bin/bash
# Usage: ./telegram_notify.sh "message" [parse_mode]
# Reads TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID from Secretary_Agent/.env

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

if [ -f "$ENV_FILE" ]; then
  source "$ENV_FILE"
fi

MESSAGE="$1"
PARSE_MODE="${2:-MarkdownV2}"

if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
  echo "ERROR: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set in $ENV_FILE"
  exit 1
fi

curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d "chat_id=${TELEGRAM_CHAT_ID}" \
  -d "text=${MESSAGE}" \
  -d "parse_mode=${PARSE_MODE}" \
  > /dev/null 2>&1

echo "Sent."
