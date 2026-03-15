#!/usr/bin/env python3
"""
Claude Usage Monitor v6 — macOS Menu Bar
Anthropic OAuth API 기반 실시간 사용량 모니터.
~/.claude/ Keychain 인증 자동 사용. 설정 불필요.

표시 항목:
  1. Current session (5h window) %
  2. Current week — all models (7d window) %
  3. Current week — Sonnet only %
  4. Extra usage — % + $ spent / $ limit

v6 changes:
  - Watchdog: exit if no render for 3x refresh interval (KeepAlive restarts)
  - Logging to /tmp/claude-usage-monitor.log
  - Signal handler for clean shutdown
"""

import json
import logging
import os
import signal
import subprocess
import sys
import threading
import time
from datetime import datetime, timezone
from pathlib import Path

import requests
import rumps

# ── Logging ──────────────────────────────────────────────────
LOG_PATH = "/tmp/claude-usage-monitor.log"
logging.basicConfig(
    filename=LOG_PATH,
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("claude-monitor")

# ── Paths & Constants ─────────────────────────────────────────
APP_DIR = Path(__file__).parent
CONFIG_PATH = APP_DIR / "config.json"
CACHE_PATH = APP_DIR / "cache.json"
ICON_PATH = APP_DIR / "icon.png"

API_BASE = "https://api.anthropic.com"
USAGE_ENDPOINT = f"{API_BASE}/api/oauth/usage"
BETA_HEADER = "oauth-2025-04-20"
KEYCHAIN_SERVICE = "Claude Code-credentials"

# API rate limit: ~1 req/hour. Default refresh = 30 min.
DEFAULT_REFRESH_SEC = 1800
# Watchdog: calculated dynamically as refresh_sec * 3 (see __init__)


def load_config():
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH) as f:
            return json.load(f)
    return {}


def load_cache() -> dict | None:
    """Load cached API response."""
    try:
        if CACHE_PATH.exists():
            with open(CACHE_PATH) as f:
                return json.load(f)
    except Exception:
        pass
    return None


def save_cache(data: dict):
    """Save API response to cache."""
    try:
        cache = {"data": data, "ts": time.time()}
        with open(CACHE_PATH, "w") as f:
            json.dump(cache, f)
    except Exception:
        pass


def get_oauth_token() -> str | None:
    """Read OAuth access token from macOS Keychain."""
    try:
        r = subprocess.run(
            ["security", "find-generic-password", "-s", KEYCHAIN_SERVICE, "-w"],
            capture_output=True, text=True, timeout=5,
        )
        if r.returncode != 0:
            return None
        creds = json.loads(r.stdout.strip())
        return creds.get("claudeAiOauth", {}).get("accessToken")
    except Exception:
        return None


def fetch_usage(token: str) -> dict | None:
    """Call Anthropic OAuth usage API. Returns None on rate limit (uses cache)."""
    headers = {
        "Authorization": f"Bearer {token}",
        "anthropic-beta": BETA_HEADER,
        "Content-Type": "application/json",
        "User-Agent": "claude-code/2.1.69",
    }
    resp = requests.get(USAGE_ENDPOINT, headers=headers, timeout=10)
    if resp.status_code == 429:
        log.info("API rate limited (429), using cache")
        return None  # caller should use cache
    resp.raise_for_status()
    data = resp.json()
    if data and "error" not in data:
        save_cache(data)
        log.info("API fetch OK")
    return data


def fmt_reset(iso_str: str) -> str:
    """Format ISO reset time to local readable string."""
    try:
        dt = datetime.fromisoformat(iso_str)
        local = dt.astimezone()
        now = datetime.now().astimezone()
        if local.date() == now.date():
            return f"Resets {local.strftime('%-I:%M%p').lower()}"
        elif (local.date() - now.date()).days <= 6:
            return f"Resets {local.strftime('%a %-I%p').lower()}"
        else:
            return f"Resets {local.strftime('%b %-d')}"
    except Exception:
        return ""


def fmt_cost(v: float) -> str:
    if v >= 100:
        return f"${v:,.0f}"
    return f"${v:.2f}"


def create_icon():
    """22x22 template icon — clean spark."""
    try:
        from PIL import Image, ImageDraw
        s = 22
        img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        cx, cy = s // 2, s // 2
        d.polygon([(cx, 1), (cx + 9, cy), (cx, s - 1), (cx - 9, cy)],
                  fill=(0, 0, 0, 200))
        d.polygon([(cx, 5), (cx + 4, cy), (cx, s - 5), (cx - 4, cy)],
                  fill=(0, 0, 0, 0))
        img.save(str(ICON_PATH))
        return str(ICON_PATH)
    except Exception:
        return None


# ── Menu Bar App ─────────────────────────────────────────────
class ClaudeUsageApp(rumps.App):

    def __init__(self):
        icon = create_icon()
        super().__init__("", icon=icon, template=True, quit_button=None)

        self.cfg = load_config()
        self.refresh_sec = self.cfg.get("refresh_interval_seconds", DEFAULT_REFRESH_SEC)
        self._watchdog_sec = self.refresh_sec * 3  # must be >> refresh interval
        self._last_ts = 0
        self._last_render_ts = time.time()  # watchdog: track last successful render

        log.info("ClaudeUsageApp starting (PID %d)", os.getpid())

        noop = lambda _: None

        self._session_val  = rumps.MenuItem("    Loading...", callback=noop)
        self._session_rst  = rumps.MenuItem("    --", callback=noop)
        self._weekly_val   = rumps.MenuItem("    Loading..  ", callback=noop)
        self._weekly_rst   = rumps.MenuItem("    -- ", callback=noop)
        self._sonnet_val   = rumps.MenuItem("    Loading... ", callback=noop)
        self._sonnet_rst   = rumps.MenuItem("    ---", callback=noop)
        self._extra_val    = rumps.MenuItem("    Loading....", callback=noop)
        self._extra_rst    = rumps.MenuItem("    ----", callback=noop)
        self._updated      = rumps.MenuItem("    -----", callback=noop)

        self.menu = [
            rumps.MenuItem("Claude Usage Monitor", callback=noop),
            None,
            rumps.MenuItem("CURRENT SESSION (5h)", callback=noop),
            self._session_val,
            self._session_rst,
            None,
            rumps.MenuItem("CURRENT WEEK (ALL MODELS)", callback=noop),
            self._weekly_val,
            self._weekly_rst,
            None,
            rumps.MenuItem("CURRENT WEEK (SONNET)", callback=noop),
            self._sonnet_val,
            self._sonnet_rst,
            None,
            rumps.MenuItem("EXTRA USAGE", callback=noop),
            self._extra_val,
            self._extra_rst,
            None,
            self._updated,
            None,
            rumps.MenuItem("Refresh", callback=self.on_refresh, key="r"),
            rumps.MenuItem("Open Console", callback=self.on_open_console),
            None,
            rumps.MenuItem("Quit", callback=self.on_quit, key="q"),
        ]

        self.title = "  ..."
        self._bg_refresh()

    @rumps.timer(60)
    def tick(self, _):
        now = time.time()

        # Watchdog: if no successful render for 3x refresh interval, exit
        # LaunchAgent KeepAlive will restart us cleanly
        if now - self._last_render_ts > self._watchdog_sec:
            log.warning(
                "Watchdog triggered: no render for %ds (limit %ds), exiting for restart...",
                int(now - self._last_render_ts),
                self._watchdog_sec,
            )
            sys.exit(1)

        if now - self._last_ts >= self.refresh_sec:
            self._last_ts = now
            self._bg_refresh()

    def _bg_refresh(self):
        threading.Thread(target=self._fetch_and_update, daemon=True).start()

    def _fetch_and_update(self):
        try:
            self.cfg = load_config()
            token = get_oauth_token()
            if not token:
                self.title = "  !"
                self._updated.title = "    No OAuth token in Keychain"
                log.warning("No OAuth token found in Keychain")
                return

            data = fetch_usage(token)

            # On rate limit (429), fall back to cache
            if data is None:
                cached = load_cache()
                if cached and "data" in cached:
                    data = cached["data"]
                    cache_age = int((time.time() - cached.get("ts", 0)) / 60)
                else:
                    self._updated.title = "    Rate limited, no cache"
                    return

            if not data or "error" in data:
                self.title = "  ?"
                self._updated.title = f"    API: {data.get('error', {}).get('message', 'Unknown')[:30]}"
                return

            self._render(data)

            # Show cache age if using cached data
            cached = load_cache()
            if cached and abs(time.time() - cached.get("ts", 0)) > 5:
                cache_age = int((time.time() - cached["ts"]) / 60)
                if cache_age > 0:
                    self._updated.title = f"    Updated {cache_age}m ago (cached)"
                    return

            local_now = datetime.now()
            self._updated.title = f"    Updated {local_now.strftime('%H:%M')}"

        except requests.exceptions.HTTPError as e:
            status = e.response.status_code if e.response is not None else "?"
            self.title = "  err"
            self._updated.title = f"    HTTP {status}"
            log.error("HTTP error: %s", status)
        except Exception as e:
            self.title = "  err"
            self._updated.title = f"    {str(e)[:40]}"
            log.error("Fetch error: %s", e, exc_info=True)

    def _render(self, data: dict):
        """Update menu items from API data."""
        self._last_render_ts = time.time()  # watchdog: mark successful render
        five_h = data.get("five_hour") or {}
        seven_d = data.get("seven_day") or {}
        sonnet = data.get("seven_day_sonnet") or {}
        extra = data.get("extra_usage") or {}

        sess_pct = int(five_h.get("utilization", 0))
        week_pct = int(seven_d.get("utilization", 0))
        son_pct = int(sonnet.get("utilization", 0))

        # ── Status bar title ──────────────────────────────
        self.title = f"  {week_pct}%"

        # ── Session (5h) ──────────────────────────────────
        self._session_val.title = f"    {sess_pct}% used"
        rst = five_h.get("resets_at", "")
        self._session_rst.title = f"    {fmt_reset(rst)}" if rst else "    "

        # ── Weekly All Models ─────────────────────────────
        self._weekly_val.title = f"    {week_pct}% used"
        rst = seven_d.get("resets_at", "")
        self._weekly_rst.title = f"    {fmt_reset(rst)}" if rst else "     "

        # ── Weekly Sonnet ─────────────────────────────────
        self._sonnet_val.title = f"    {son_pct}% used"
        rst = sonnet.get("resets_at", "")
        self._sonnet_rst.title = f"    {fmt_reset(rst)}" if rst else "      "

        # ── Extra Usage ───────────────────────────────────
        if extra.get("is_enabled"):
            ex_pct = int(extra.get("utilization", 0))
            used = extra.get("used_credits", 0) / 100
            limit = extra.get("monthly_limit", 0) / 100
            self._extra_val.title = (
                f"    {ex_pct}%  "
                f"({fmt_cost(used)} / {fmt_cost(limit)})"
            )
            self._extra_rst.title = "    Resets monthly"
        else:
            self._extra_val.title = "    Disabled"
            self._extra_rst.title = "       "

    # ── Callbacks ────────────────────────────────────────────────
    def on_refresh(self, _):
        self.title = "  ..."
        self._last_ts = time.time()
        self._bg_refresh()

    def on_open_console(self, _):
        subprocess.Popen(["open", "https://console.anthropic.com/settings/usage"])

    def on_quit(self, _):
        rumps.quit_application()


if __name__ == "__main__":
    def _handle_signal(signum, _frame):
        log.info("Received signal %d, shutting down", signum)
        rumps.quit_application()

    signal.signal(signal.SIGTERM, _handle_signal)
    signal.signal(signal.SIGINT, _handle_signal)

    log.info("=== Claude Usage Monitor v6 starting (PID %d) ===", os.getpid())
    ClaudeUsageApp().run()
    log.info("=== Claude Usage Monitor stopped ===")
