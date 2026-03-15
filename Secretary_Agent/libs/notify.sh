#!/bin/bash
# Usage: ./notify.sh "persona_emoji" "persona_name" "message" [urgency]
# urgency: info (telegram only), warn (telegram + mac), critical (telegram + mac + sound)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
EMOJI="$1"
PERSONA="$2"
MESSAGE="$3"
URGENCY="${4:-info}"

FULL_MSG="${EMOJI} [${PERSONA}] ${MESSAGE}"

# Always send to Telegram
"$SCRIPT_DIR/telegram_notify.sh" "$FULL_MSG" "HTML"

# Mac notification for warn/critical
if [ "$URGENCY" = "warn" ] || [ "$URGENCY" = "critical" ]; then
  SOUND="default"
  [ "$URGENCY" = "critical" ] && SOUND="Basso"
  "$SCRIPT_DIR/macos_notify.sh" "비서실 — $PERSONA" "$MESSAGE" "$SOUND"
fi
