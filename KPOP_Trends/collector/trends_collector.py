"""Google Trends collector - fetches trending searches per region, filters K-POP related."""

import logging
import re
from datetime import date

import config

logger = logging.getLogger(__name__)

# Short artist names that need word-boundary matching (4 chars or less: V, RM, BTS, IVE, Rose, Lisa, SUGA, etc.)
_SHORT_ARTISTS = {a.lower() for a in config.TRACKED_ARTISTS if len(a) <= 4}
# Longer artist names safe for substring matching
_LONG_ARTISTS = {a.lower() for a in config.TRACKED_ARTISTS if len(a) > 4}


def _is_kpop_related(keyword: str) -> bool:
    """Check if a trending keyword is K-POP related (strict matching)."""
    kw_lower = keyword.lower()

    # Check against long artist names (4+ chars) — substring match is safe
    for artist in _LONG_ARTISTS:
        if artist in kw_lower:
            return True

    # Check against short artist names (1-3 chars) — require word boundary
    for artist in _SHORT_ARTISTS:
        if re.search(r'\b' + re.escape(artist) + r'\b', kw_lower):
            return True

    # Check against K-POP keywords (already 4+ chars, substring safe)
    for tk in config.TREND_KEYWORDS:
        if tk.lower() in kw_lower:
            return True

    # Common K-POP related terms (only specific, non-ambiguous terms)
    kpop_terms = ["kpop", "k-pop", "korean idol", "컴백", "comeback",
                  "music video", "뮤직비디오", "앨범", "album release",
                  "콘서트", "concert tour", "fandom", "팬미팅",
                  "hallyu", "한류", "kpop comeback", "k-pop idol"]
    for term in kpop_terms:
        if term in kw_lower:
            return True

    return False


def collect(today: str = None) -> list[dict]:
    """Collect Google Trends data for configured regions.

    Returns list of dicts ready for DB insertion.
    """
    today = today or date.today().isoformat()
    all_entries = []

    try:
        from trendspyg import download_google_trends_rss
    except ImportError:
        logger.warning("trendspyg not installed. Skipping Google Trends collection.")
        return all_entries

    for region in config.TREND_REGIONS:
        logger.info(f"Fetching Google Trends for {region}...")

        try:
            trends = download_google_trends_rss(geo=region)
        except Exception as e:
            logger.warning(f"Failed to fetch trends for {region}: {e}")
            continue

        if not trends:
            continue

        for trend in trends:
            keyword = trend.get("trend", trend.get("title", ""))
            traffic = trend.get("traffic", trend.get("approx_traffic", ""))
            news_articles = trend.get("news_articles", [])
            related_news = news_articles[0].get("headline", "") if news_articles else ""
            is_kpop = _is_kpop_related(keyword)

            all_entries.append({
                "date": today,
                "region": region,
                "keyword": keyword,
                "traffic": str(traffic),
                "related_news": related_news,
                "is_kpop_related": 1 if is_kpop else 0,
            })

        kpop_count = sum(1 for e in all_entries if e["region"] == region and e["is_kpop_related"])
        logger.info(f"  {region}: {len([e for e in all_entries if e['region'] == region])} trends, {kpop_count} K-POP related")

    return all_entries
