#!/bin/bash
# Usage: ./macos_notify.sh "title" "message" [sound]
# Requires: brew install terminal-notifier (falls back to osascript)

TITLE="$1"
MESSAGE="$2"
SOUND="${3:-default}"

if command -v terminal-notifier &> /dev/null; then
  terminal-notifier -title "$TITLE" -message "$MESSAGE" -sound "$SOUND" -group "hkd852-secretary"
else
  osascript -e "display notification \"$MESSAGE\" with title \"$TITLE\" sound name \"$SOUND\""
fi
