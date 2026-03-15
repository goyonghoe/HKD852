# Claude Code Usage Monitor — macOS Menu Bar

A macOS menu bar app that shows your Claude Code usage in real-time — the same data as the `/usage` command in Claude Code terminal.

![menu bar](https://img.shields.io/badge/macOS-menu%20bar-black) ![python](https://img.shields.io/badge/python-3.10+-blue)

## What It Shows

```
  80%                          ← status bar (weekly all-models %)
┌─────────────────────────────┐
│ Claude Usage Monitor        │
│─────────────────────────────│
│ CURRENT SESSION (5h)        │
│     11% used                │
│     Resets 11:00pm          │
│─────────────────────────────│
│ CURRENT WEEK (ALL MODELS)   │
│     80% used                │
│     Resets thu 12:59pm      │
│─────────────────────────────│
│ CURRENT WEEK (SONNET)       │
│     7% used                 │
│     Resets thu 6:00pm       │
│─────────────────────────────│
│ EXTRA USAGE                 │
│     55%  ($27.89 / $50.00)  │
│     Resets monthly          │
│─────────────────────────────│
│ Refresh                  ⌘R │
│ Open Console                │
│ Quit                     ⌘Q │
└─────────────────────────────┘
```

## How It Works

### The Key Discovery

Claude Code stores OAuth credentials in **macOS Keychain** (service: `Claude Code-credentials`). Using that token, you can call an undocumented API:

```
GET https://api.anthropic.com/api/oauth/usage
```

**Critical header** (without this, you get 401):

```
anthropic-beta: oauth-2025-04-20
```

### API Response

```json
{
  "five_hour": {
    "utilization": 11.0,
    "resets_at": "2026-03-05T14:00:00+00:00"
  },
  "seven_day": {
    "utilization": 80.0,
    "resets_at": "2026-03-06T03:59:59+00:00"
  },
  "seven_day_sonnet": {
    "utilization": 7.0,
    "resets_at": "2026-03-06T09:00:00+00:00"
  },
  "extra_usage": {
    "is_enabled": true,
    "monthly_limit": 5000,
    "used_credits": 2789.0,
    "utilization": 55.78
  }
}
```

- `utilization` = percentage (0–100)
- `used_credits` / `monthly_limit` = cents (divide by 100 for dollars)
- Rate limit: **~1 request per hour** (`retry-after: 3600`)

### Auth Flow

```bash
# 1. Read OAuth token from Keychain
TOKEN=$(security find-generic-password -s "Claude Code-credentials" -w \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['claudeAiOauth']['accessToken'])")

# 2. Call the API
curl -s "https://api.anthropic.com/api/oauth/usage" \
  -H "Authorization: Bearer $TOKEN" \
  -H "anthropic-beta: oauth-2025-04-20" \
  -H "Content-Type: application/json"
```

> **Prerequisite**: You must be logged into Claude Code (`claude` in terminal). The OAuth token is created during login.

## Quick Start

```bash
# 1. Clone or copy this folder
cd ClaudeUsageMonitor

# 2. Install dependencies
pip3 install rumps requests Pillow

# 3. Run
python3 claude_monitor.py
```

The app reads your existing Claude Code login from Keychain — no additional auth needed.

### Auto-Start on Login

```bash
chmod +x setup.sh
./setup.sh
```

This creates a LaunchAgent that starts the monitor on every login.

## Configuration

Edit `config.json`:

```json
{
  "refresh_interval_seconds": 1800
}
```

Default refresh is 30 minutes (API rate limit is ~1 req/hour, so going lower isn't useful).

## Files

| File                | Purpose                              |
| ------------------- | ------------------------------------ |
| `claude_monitor.py` | Main app (menu bar + API calls)      |
| `config.json`       | Refresh interval config              |
| `cache.json`        | Cached API response (auto-generated) |
| `setup.sh`          | LaunchAgent installer for auto-start |
| `run.sh`            | Manual launch script                 |

## Requirements

- **macOS** (uses Keychain + rumps menu bar framework)
- **Python 3.10+**
- **Claude Code** installed and logged in (`claude` CLI)
- **Claude Pro/Max subscription** (the usage API is for subscription users)

## How I Found the API

1. Claude Code's source (`cli.js`) is minified but searchable
2. Found `oauth/usage` string and traced the function that calls it
3. The auth function adds `anthropic-beta: oauth-2025-04-20` — this is the key that makes OAuth work
4. Without this header → 401 "OAuth authentication is currently not supported"
5. With this header → real usage data, same as `/usage` in terminal

### Other Endpoints Discovered

| Endpoint                          | Auth          | Purpose                    |
| --------------------------------- | ------------- | -------------------------- |
| `GET /api/oauth/profile`          | Bearer        | Account & org info         |
| `GET /api/oauth/usage`            | Bearer + beta | **Usage/utilization data** |
| `GET /api/oauth/claude_cli/roles` | Bearer        | Org role info              |
| `GET /api/hello`                  | Bearer        | Connectivity check         |

All require `Authorization: Bearer <oauth-token>`. The `/usage` endpoint additionally requires the `anthropic-beta` header.

## Limitations

- **macOS only** (Keychain + rumps)
- **~1 API call per hour** rate limit — data may be up to 30–60 min stale
- **Undocumented API** — may change without notice
- OAuth token expires (~24h) but Claude Code auto-refreshes it

## License

MIT — use freely, modify as needed.
