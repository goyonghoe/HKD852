#!/bin/bash
# Claude Usage Monitor — 수동 실행
cd "$(dirname "$0")"
python3 claude_monitor.py &
echo "Claude Usage Monitor started (PID: $!)"
echo "메뉴바에서 'C' 아이콘을 확인하세요."
