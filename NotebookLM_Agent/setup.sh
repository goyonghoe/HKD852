#!/bin/bash
# NotebookLM Agent — 원클릭 셋업 스크립트
# Usage: bash NotebookLM_Agent/setup.sh

set -e

echo "=== NotebookLM Agent Setup ==="
echo ""

# 1. yt-dlp 설치
echo "[1/4] Installing yt-dlp..."
pip3 install --quiet yt-dlp
echo "  ✓ yt-dlp installed"

# 2. notebooklm-py 설치
echo "[2/4] Installing notebooklm-py..."
pip3 install --quiet "notebooklm-py[browser]"
playwright install chromium --with-deps 2>/dev/null || playwright install chromium
echo "  ✓ notebooklm-py installed"

# 3. NotebookLM MCP 서버 등록
echo "[3/4] Registering NotebookLM MCP server..."
if command -v claude &> /dev/null; then
    claude mcp add notebooklm -- npx notebooklm-mcp@latest 2>/dev/null && \
        echo "  ✓ MCP server registered" || \
        echo "  ! MCP server registration skipped (may already exist)"
else
    echo "  ! Claude CLI not found — skipping MCP registration"
fi

# 4. NotebookLM 인증
echo "[4/4] NotebookLM authentication..."
echo "  Run this command manually to authenticate:"
echo "  $ notebooklm login"
echo ""
echo "  This will open Chrome for Google login (one-time only)."
echo ""

echo "=== Setup Complete ==="
echo ""
echo "Available skills:"
echo "  /yt-search    — YouTube 검색 + 메타데이터 수집"
echo "  /notebooklm   — NotebookLM 노트북 관리 + 산출물 생성"
echo "  /research     — 전체 파이프라인 (검색→업로드→분석→산출물)"
