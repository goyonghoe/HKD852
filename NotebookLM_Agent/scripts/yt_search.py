#!/usr/bin/env python3
"""YouTube Search & Metadata Scraper using yt-dlp.

Usage:
    python3 yt_search.py "query" [--count 10] [--output results.json] [--lang en]
    python3 yt_search.py "base" --multi "en=AI agents,ko=AI 에이전트,ja=AIエージェント,zh=AI代理" --count 10 --output results.json

--lang: Filter by language/region (en, ko, ja, zh)
--multi: Multi-language search with comma-separated lang=query pairs
--min-views: Minimum view count filter (default: 0)

Returns JSON with video metadata: title, url, channel, views, duration, upload_date, lang.
"""

import argparse
import json
import sys
from datetime import datetime

try:
    import yt_dlp
except ImportError:
    print("ERROR: yt-dlp not installed. Run: pip3 install yt-dlp", file=sys.stderr)
    sys.exit(1)

# Language → YouTube geo-bypass country + relevance language hint
LANG_CONFIG = {
    "en": {"geo": "US", "label": "English"},
    "ko": {"geo": "KR", "label": "Korean"},
    "ja": {"geo": "JP", "label": "Japanese"},
    "zh": {"geo": "TW", "label": "Chinese"},
}


def search_youtube(query: str, count: int = 10, lang: str | None = None, min_views: int = 0) -> list[dict]:
    """Search YouTube and return video metadata."""
    # Request extra results to compensate for filtering
    fetch_count = count + 5 if min_views > 0 else count

    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": False,
        "skip_download": True,
        "ignoreerrors": True,
        "default_search": f"ytsearch{fetch_count}",
    }

    if lang and lang in LANG_CONFIG:
        ydl_opts["geo_bypass_country"] = LANG_CONFIG[lang]["geo"]

    # Phase 1: Fast flat search for URLs + basic metadata
    results = []
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        search_results = ydl.extract_info(f"ytsearch{fetch_count}:{query}", download=False)
        if not search_results or "entries" not in search_results:
            return results

        for entry in search_results["entries"]:
            if entry is None:
                continue

            # Parse duration
            duration_sec = entry.get("duration", 0) or 0
            minutes = int(duration_sec // 60)
            seconds = int(duration_sec % 60)

            # Parse upload date
            upload_date = entry.get("upload_date", "")
            if upload_date:
                try:
                    upload_date = datetime.strptime(upload_date, "%Y%m%d").strftime("%Y-%m-%d")
                except ValueError:
                    pass

            views = entry.get("view_count", 0) or 0

            # Skip low-quality results
            if min_views > 0 and views < min_views:
                continue

            # Skip very short videos (< 60s, likely ads/intros)
            if duration_sec > 0 and duration_sec < 60:
                continue

            has_captions = bool(entry.get("subtitles") or entry.get("automatic_captions"))

            results.append({
                "title": entry.get("title", "N/A"),
                "url": entry.get("webpage_url", f"https://www.youtube.com/watch?v={entry.get('id', '')}"),
                "channel": entry.get("channel", entry.get("uploader", "N/A")),
                "views": views,
                "duration": f"{minutes}:{seconds:02d}",
                "duration_seconds": duration_sec,
                "upload_date": upload_date,
                "description": (entry.get("description", "") or "")[:200],
                "lang": lang or "unknown",
                "has_captions": has_captions,
            })

    # Sort by views (higher quality first) and limit to requested count
    results.sort(key=lambda x: x["views"], reverse=True)
    return results[:count]


def deduplicate(results: list[dict]) -> list[dict]:
    """Remove duplicate videos by URL."""
    seen = set()
    deduped = []
    for r in results:
        if r["url"] not in seen:
            seen.add(r["url"])
            deduped.append(r)
    return deduped


def main():
    parser = argparse.ArgumentParser(description="YouTube Search via yt-dlp")
    parser.add_argument("query", help="Search query (or base query for --multi)")
    parser.add_argument("--count", type=int, default=10, help="Number of results per language (default: 10)")
    parser.add_argument("--output", help="Output JSON file path")
    parser.add_argument("--lang", choices=["en", "ko", "ja", "zh"], help="Language/region filter")
    parser.add_argument("--multi", help="Multi-language search: comma-separated lang=query pairs. Example: 'en=AI agents,ko=AI 에이전트,ja=AIエージェント,zh=AI代理'")
    parser.add_argument("--min-views", type=int, default=0, help="Minimum view count filter (default: 0)")
    args = parser.parse_args()

    all_results = []

    if args.multi:
        # Parse lang=query pairs
        pairs = [p.strip() for p in args.multi.split(",")]
        for pair in pairs:
            if "=" not in pair:
                continue
            lang, query = pair.split("=", 1)
            lang = lang.strip()
            query = query.strip()
            if lang not in LANG_CONFIG:
                print(f"WARN: Unknown lang '{lang}', skipping", file=sys.stderr)
                continue
            print(f"Searching [{LANG_CONFIG[lang]['label']}]: {query} (count={args.count})", file=sys.stderr)
            results = search_youtube(query, args.count, lang, args.min_views)
            all_results.extend(results)
            print(f"  Found {len(results)} results", file=sys.stderr)
    else:
        all_results = search_youtube(args.query, args.count, args.lang, args.min_views)

    # Deduplicate
    all_results = deduplicate(all_results)

    output = {
        "query": args.multi or args.query,
        "count": len(all_results),
        "languages": list(set(r["lang"] for r in all_results)),
        "timestamp": datetime.now().isoformat(),
        "results": all_results,
    }

    json_str = json.dumps(output, ensure_ascii=False, indent=2)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(json_str)
        print(f"Saved {len(all_results)} results to {args.output}")
    else:
        print(json_str)


if __name__ == "__main__":
    main()
