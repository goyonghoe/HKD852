"""Insight engine - detects trend changes by comparing today vs previous data."""

import json
import logging
from collections import Counter
from datetime import date

import config
from database import db_manager

logger = logging.getLogger(__name__)


def _source_to_region(source: str) -> str:
    """Map chart source to region group name."""
    for group_name, group_info in config.REGION_GROUPS.items():
        if source in group_info.get("chart_sources", []):
            return group_name
    if source in config.GLOBAL_CHART_SOURCES:
        return "글로벌"
    return "글로벌"


def _code_to_region(region_code: str) -> str:
    """Map country code to region group name."""
    return config.REGION_CODE_TO_GROUP.get(region_code, "기타")


def analyze(today: str = None) -> list[dict]:
    """Run all insight detectors and return insights for the day."""
    today = today or date.today().isoformat()
    insights = []

    insights.extend(_detect_chart_movers(today))
    insights.extend(_detect_new_entries(today))
    insights.extend(_detect_trend_spikes(today))
    insights.extend(_detect_multi_chart(today))
    insights.extend(_detect_region_buzz(today))
    insights.extend(_detect_news_clusters(today))
    insights.extend(_detect_streaming_surge(today))

    logger.info(f"Generated {len(insights)} insights: "
                f"{sum(1 for i in insights if i['severity'] == 'high')} HIGH, "
                f"{sum(1 for i in insights if i['severity'] == 'medium')} MEDIUM")

    return insights


def get_regional_summary(today: str = None) -> dict:
    """Build regional summary with insights, charts, and trends grouped by region.

    Returns dict keyed by region name, each containing:
      - insights: list of insight dicts
      - chart_highlights: list of notable chart entries
      - trending_keywords: list of K-POP trending keywords
      - stats: summary statistics
    """
    today = today or date.today().isoformat()

    insights = db_manager.get_insights(today)
    all_trends = db_manager.get_trends(today)
    kpop_trends = db_manager.get_trends(today, kpop_only=True)
    news = db_manager.get_news(today)

    # Initialize regions
    regions = {}
    for group_name in config.REGION_GROUPS:
        regions[group_name] = {
            "insights": [],
            "chart_highlights": [],
            "trending_keywords": [],
            "all_trending": [],
            "stats": {"insight_count": 0, "kpop_trend_count": 0, "total_trend_count": 0},
        }
    regions["글로벌"] = {
        "insights": [],
        "chart_highlights": [],
        "trending_keywords": [],
        "all_trending": [],
        "stats": {"insight_count": 0, "kpop_trend_count": 0, "total_trend_count": 0},
    }

    # --- Classify insights by region ---
    for ins in insights:
        data = {}
        try:
            data = json.loads(ins.get("data_json", "{}"))
        except (json.JSONDecodeError, TypeError):
            pass

        region_name = None

        # Trend-based insights have region code
        if ins["category"] in ("trend_spike",) and data.get("region"):
            region_name = _code_to_region(data["region"])
        elif ins["category"] == "region_buzz" and data.get("regions"):
            # Multi-region: assign to each region
            for code in data["regions"]:
                rn = _code_to_region(code)
                if rn in regions:
                    regions[rn]["insights"].append(ins)
                    regions[rn]["stats"]["insight_count"] += 1
            continue
        elif ins["category"] in ("chart_mover", "chart_drop", "new_entry") and data.get("source"):
            region_name = _source_to_region(data["source"])
        elif ins["category"] == "multi_chart":
            region_name = "글로벌"
        elif ins["category"] == "streaming_surge":
            region_name = "한국"
        elif ins["category"] == "news_cluster":
            region_name = "글로벌"
        else:
            region_name = "글로벌"

        if region_name and region_name in regions:
            regions[region_name]["insights"].append(ins)
            regions[region_name]["stats"]["insight_count"] += 1

    # --- Chart highlights per region ---
    for group_name, group_info in config.REGION_GROUPS.items():
        for src in group_info.get("chart_sources", []):
            entries = db_manager.get_chart_entries(today, src)
            # Top 10 only for highlights
            regions[group_name]["chart_highlights"].extend(entries[:10])

    # Global charts
    for src in config.GLOBAL_CHART_SOURCES:
        entries = db_manager.get_chart_entries(today, src)
        regions["글로벌"]["chart_highlights"].extend(entries[:20])

    # --- Trends per region ---
    for trend in all_trends:
        region_name = _code_to_region(trend["region"])
        if region_name not in regions:
            continue
        regions[region_name]["all_trending"].append(trend)
        regions[region_name]["stats"]["total_trend_count"] += 1
        if trend["is_kpop_related"]:
            regions[region_name]["trending_keywords"].append(trend)
            regions[region_name]["stats"]["kpop_trend_count"] += 1

    # --- Executive summary: top K-POP insights across all regions ---
    executive = {
        "high_insights": [i for i in insights if i["severity"] == "high"],
        "total_insights": len(insights),
        "total_kpop_trends": len(kpop_trends),
        "total_news": len(news),
        "active_regions": sum(1 for r in regions.values() if r["stats"]["kpop_trend_count"] > 0 or r["chart_highlights"]),
        "top_artists": _get_top_artists(today),
        "news": news[:15],
    }

    return {"regions": regions, "executive": executive}


def _get_top_artists(today: str) -> list[dict]:
    """Get most active K-POP artists across all data sources (tracked artists only)."""
    import re

    artist_score = Counter()
    artist_details = {}
    short_artists = {a.lower() for a in config.TRACKED_ARTISTS if len(a) <= 4}
    long_artists = {a.lower() for a in config.TRACKED_ARTISTS if len(a) > 4}
    # Map lowercase → original case
    artist_display = {a.lower(): a for a in config.TRACKED_ARTISTS}

    def _match_tracked(text_lower):
        """Return matched tracked artist names from text."""
        matched = []
        for a in long_artists:
            if a in text_lower:
                matched.append(artist_display[a])
        for a in short_artists:
            if re.search(r'\b' + re.escape(a) + r'\b', text_lower):
                matched.append(artist_display[a])
        return matched

    # From Billboard charts (already K-POP filtered)
    for source in ["billboard_global200", "billboard_hot100"]:
        entries = db_manager.get_chart_entries(today, source)
        for entry in entries:
            matched = _match_tracked(entry["artist"].lower())
            for a in matched:
                artist_score[a] += 5 if entry["rank"] <= 10 else (3 if entry["rank"] <= 50 else 2)
                if a not in artist_details:
                    artist_details[a] = {"billboard": [], "spotify": [], "trends": [], "news_count": 0}
                label = _format_source(source)
                artist_details[a]["billboard"].append(f"{label} #{entry['rank']}")

    # From Spotify Korea (only tracked artists)
    spotify_entries = db_manager.get_chart_entries(today, "spotify_kr")
    for entry in spotify_entries:
        matched = _match_tracked(entry["artist"].lower())
        for a in matched:
            artist_score[a] += 4 if entry["rank"] <= 10 else (2 if entry["rank"] <= 50 else 1)
            if a not in artist_details:
                artist_details[a] = {"billboard": [], "spotify": [], "trends": [], "news_count": 0}
            artist_details[a]["spotify"].append(f"Spotify KR #{entry['rank']}")

    # From trends
    kpop_trends = db_manager.get_trends(today, kpop_only=True)
    for trend in kpop_trends:
        matched = _match_tracked(trend["keyword"].lower())
        for a in matched:
            artist_score[a] += 3
            if a not in artist_details:
                artist_details[a] = {"billboard": [], "spotify": [], "trends": [], "news_count": 0}
            artist_details[a]["trends"].append(trend["region"])

    # From news (use shared matching)
    news = db_manager.get_news(today)
    for article in news:
        matched = _match_artist_in_text(article["title"].lower())
        for a in matched:
            artist_score[a] += 1
            if a not in artist_details:
                artist_details[a] = {"billboard": [], "spotify": [], "trends": [], "news_count": 0}
            artist_details[a]["news_count"] += 1

    top = []
    for artist, score in artist_score.most_common(10):
        detail = artist_details.get(artist, {})
        charts = detail.get("billboard", [])[:3] + detail.get("spotify", [])[:2]
        top.append({
            "artist": artist,
            "score": score,
            "charts": charts,
            "trend_regions": list(set(detail.get("trends", [])))[:5],
            "news_count": detail.get("news_count", 0),
        })

    return top


def _format_source(source: str) -> str:
    """Format source key to readable label."""
    _map = {
        "billboard_global200": "Billboard G200",
        "billboard_billboardglobal200": "Billboard G200",
        "billboard_hot100": "Billboard H100",
        "spotify_kr": "Spotify KR",
    }
    return _map.get(source, source)


def _detect_chart_movers(today: str) -> list[dict]:
    """Detect songs that moved up/down significantly on charts."""
    insights = []

    for source in ["billboard_global200", "billboard_hot100"]:
        today_entries = db_manager.get_chart_entries(today, source)
        prev_date = db_manager.get_previous_chart_date(today, source)
        if not prev_date:
            continue
        prev_entries = db_manager.get_chart_entries(prev_date, source)
        prev_map = {(e["artist"].lower(), e["title"].lower()): e for e in prev_entries}

        for entry in today_entries:
            key = (entry["artist"].lower(), entry["title"].lower())
            if key not in prev_map:
                continue

            prev_rank = prev_map[key]["rank"]
            rank_change = prev_rank - entry["rank"]  # positive = rose

            if rank_change >= config.CHART_RISE_THRESHOLD:
                chart_label = _format_source(source)
                insights.append({
                    "date": today,
                    "category": "chart_mover",
                    "severity": "high",
                    "title": f"{entry['artist']} - \"{entry['title']}\" {chart_label}에서 {rank_change}위 상승",
                    "description": f"#{prev_rank} -> #{entry['rank']} (전일 대비 +{rank_change})",
                    "data_json": json.dumps({"artist": entry["artist"], "title": entry["title"],
                                             "source": source, "prev_rank": prev_rank,
                                             "curr_rank": entry["rank"], "change": rank_change}),
                })
            elif rank_change <= -config.CHART_DROP_THRESHOLD:
                chart_label = _format_source(source)
                insights.append({
                    "date": today,
                    "category": "chart_drop",
                    "severity": "medium",
                    "title": f"{entry['artist']} - \"{entry['title']}\" {chart_label}에서 {abs(rank_change)}위 하락",
                    "description": f"#{prev_rank} -> #{entry['rank']} (전일 대비 {rank_change})",
                    "data_json": json.dumps({"artist": entry["artist"], "title": entry["title"],
                                             "source": source, "prev_rank": prev_rank,
                                             "curr_rank": entry["rank"], "change": rank_change}),
                })

    return insights


def _detect_new_entries(today: str) -> list[dict]:
    """Detect new chart entries."""
    insights = []

    for source in ["billboard_global200", "billboard_hot100", "spotify_kr"]:
        today_entries = db_manager.get_chart_entries(today, source)
        for entry in today_entries:
            if entry.get("is_new"):
                chart_label = _format_source(source)
                insights.append({
                    "date": today,
                    "category": "new_entry",
                    "severity": "high",
                    "title": f"{entry['artist']} - \"{entry['title']}\" {chart_label} 신규 진입 #{entry['rank']}",
                    "description": f"신규 차트 진입",
                    "data_json": json.dumps({"artist": entry["artist"], "title": entry["title"],
                                             "source": source, "rank": entry["rank"]}),
                })

    return insights


def _detect_trend_spikes(today: str) -> list[dict]:
    """Detect K-POP related Google Trends spikes."""
    insights = []
    kpop_trends = db_manager.get_trends(today, kpop_only=True)

    for trend in kpop_trends:
        insights.append({
            "date": today,
            "category": "trend_spike",
            "severity": "high",
            "title": f"\"{trend['keyword']}\" {trend['region']}에서 트렌딩",
            "description": f"검색량: {trend['traffic']}" + (f" | 관련 뉴스: {trend['related_news']}" if trend.get("related_news") else ""),
            "data_json": json.dumps({"keyword": trend["keyword"], "region": trend["region"],
                                     "traffic": trend["traffic"]}),
        })

    return insights


def _detect_multi_chart(today: str) -> list[dict]:
    """Detect artists appearing on multiple charts simultaneously."""
    insights = []
    all_entries = db_manager.get_chart_entries(today)

    artist_charts = {}
    for entry in all_entries:
        artist_lower = entry["artist"].lower()
        if artist_lower not in artist_charts:
            artist_charts[artist_lower] = {"name": entry["artist"], "charts": set(), "best_rank": {}}
        artist_charts[artist_lower]["charts"].add(entry["source"])
        src = entry["source"]
        if src not in artist_charts[artist_lower]["best_rank"] or entry["rank"] < artist_charts[artist_lower]["best_rank"][src]:
            artist_charts[artist_lower]["best_rank"][src] = entry["rank"]

    for artist_lower, data in artist_charts.items():
        if len(data["charts"]) >= 2:
            chart_labels = []
            for src in sorted(data["charts"]):
                label = _format_source(src)
                chart_labels.append(f"{label} #{data['best_rank'][src]}")

            insights.append({
                "date": today,
                "category": "multi_chart",
                "severity": "high",
                "title": f"{data['name']} — {len(data['charts'])}개 차트 동시 진입",
                "description": " | ".join(chart_labels),
                "data_json": json.dumps({"artist": data["name"],
                                         "charts": list(data["charts"]),
                                         "ranks": data["best_rank"]}),
            })

    return insights


def _detect_region_buzz(today: str) -> list[dict]:
    """Detect artists/keywords trending in multiple regions."""
    insights = []
    kpop_trends = db_manager.get_trends(today, kpop_only=True)

    keyword_regions = {}
    for trend in kpop_trends:
        kw = trend["keyword"].lower()
        if kw not in keyword_regions:
            keyword_regions[kw] = {"name": trend["keyword"], "regions": []}
        keyword_regions[kw]["regions"].append(trend["region"])

    for kw, data in keyword_regions.items():
        if len(data["regions"]) >= config.MULTI_REGION_THRESHOLD:
            insights.append({
                "date": today,
                "category": "region_buzz",
                "severity": "high",
                "title": f"\"{data['name']}\" {len(data['regions'])}개국 동시 트렌딩",
                "description": f"지역: {', '.join(data['regions'])}",
                "data_json": json.dumps({"keyword": data["name"], "regions": data["regions"]}),
            })

    return insights


def _match_artist_in_text(text_lower: str) -> list[str]:
    """Match tracked K-POP artists in text with word-boundary awareness."""
    import re
    matched = []
    for artist in config.TRACKED_ARTISTS:
        a_lower = artist.lower()
        if len(a_lower) <= 2:
            # Tiny names: require standalone word or standard patterns
            if re.search(r'(?:^|\s)' + re.escape(a_lower) + r'(?:\s|$|[\'"])', text_lower):
                matched.append(artist)
        elif len(a_lower) <= 4:
            # Short names: word boundary
            if re.search(r'\b' + re.escape(a_lower) + r'\b', text_lower):
                matched.append(artist)
        else:
            # Long names: substring match
            if a_lower in text_lower:
                matched.append(artist)
    return matched


def _detect_news_clusters(today: str) -> list[dict]:
    """Detect artists with many news mentions."""
    insights = []
    news = db_manager.get_news(today)

    artist_mentions = Counter()
    artist_articles = {}
    for article in news:
        title_lower = article["title"].lower()
        for artist in _match_artist_in_text(title_lower):
            artist_mentions[artist] += 1
            if artist not in artist_articles:
                artist_articles[artist] = []
            artist_articles[artist].append(article["title"])

    for artist, count in artist_mentions.items():
        if count >= config.NEWS_CLUSTER_COUNT:
            insights.append({
                "date": today,
                "category": "news_cluster",
                "severity": "medium",
                "title": f"{artist} — 뉴스 {count}건 집중 보도",
                "description": " | ".join(artist_articles[artist][:3]),
                "data_json": json.dumps({"artist": artist, "count": count,
                                         "articles": artist_articles[artist][:5]}),
            })

    return insights


def _detect_streaming_surge(today: str) -> list[dict]:
    """Detect significant streaming count increases in Spotify Korea."""
    insights = []
    today_entries = db_manager.get_chart_entries(today, "spotify_kr")
    prev_date = db_manager.get_previous_chart_date(today, "spotify_kr")
    if not prev_date:
        return insights

    prev_entries = db_manager.get_chart_entries(prev_date, "spotify_kr")
    prev_map = {(e["artist"].lower(), e["title"].lower()): e for e in prev_entries}

    for entry in today_entries:
        if not entry.get("streams"):
            continue
        key = (entry["artist"].lower(), entry["title"].lower())
        if key not in prev_map or not prev_map[key].get("streams"):
            continue

        prev_streams = prev_map[key]["streams"]
        change_pct = (entry["streams"] - prev_streams) / prev_streams if prev_streams > 0 else 0

        if change_pct >= config.STREAMING_SURGE_PCT:
            insights.append({
                "date": today,
                "category": "streaming_surge",
                "severity": "medium",
                "title": f"{entry['artist']} - \"{entry['title']}\" 스트리밍 {change_pct:.0%} 급증",
                "description": f"Spotify KR: {prev_streams:,} -> {entry['streams']:,}",
                "data_json": json.dumps({"artist": entry["artist"], "title": entry["title"],
                                         "prev_streams": prev_streams, "curr_streams": entry["streams"],
                                         "change_pct": round(change_pct, 3)}),
            })

    return insights
