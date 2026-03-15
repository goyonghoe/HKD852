#!/bin/bash
# Claude Usage Monitor — 설치 스크립트
# macOS 메뉴바에서 Anthropic API 사용량을 확인하는 앱

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLIST_NAME="com.hkd852.claude-usage-monitor"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_NAME}.plist"
PYTHON=$(command -v python3)

echo "=== Claude Usage Monitor Setup ==="
echo ""

# 1. Install dependencies
echo "[1/3] Installing Python dependencies..."
pip3 install --user -q rumps requests
echo "  Done."

# 2. Create LaunchAgent (auto-start on login)
echo "[2/3] Creating LaunchAgent for auto-start..."
cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${PLIST_NAME}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${PYTHON}</string>
        <string>${SCRIPT_DIR}/claude_monitor.py</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>ProcessType</key>
    <string>Interactive</string>
    <key>StandardOutPath</key>
    <string>/tmp/claude-usage-monitor.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/claude-usage-monitor.err</string>
</dict>
</plist>
EOF
echo "  Created: $PLIST_PATH"

# 3. Load the agent
echo "[3/3] Starting monitor..."
launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load "$PLIST_PATH"
echo "  Started."

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. 메뉴바에 다이아몬드 아이콘이 보입니다"
echo "  2. Claude Code OAuth 인증이 자동으로 사용됩니다"
echo "  3. KeepAlive 활성화 — 크래시 시 자동 재시작됩니다"
echo ""
echo "Commands:"
echo "  수동 실행:  python3 ${SCRIPT_DIR}/claude_monitor.py"
echo "  로그 확인:  tail -f /tmp/claude-usage-monitor.log"
echo "  중지:       launchctl unload ${PLIST_PATH}"
echo "  제거:       rm ${PLIST_PATH}"
