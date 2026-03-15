"""Billboard chart collector - fetches Global 200 and Hot 100, filters K-POP artists."""

import logging
import re
from datetime import date

import billboard

import config

logger = logging.getLogger(__name__)

# Short artist names need word-boundary matching (4 chars or less: V, RM, BTS, IVE, Rose, Lisa, etc.)
_SHORT_ARTISTS = {a.lower() for a in config.TRACKED_ARTISTS if len(a) <= 4}
_LONG_ARTISTS = {a.lower() for a in config.TRACKED_ARTISTS if len(a) > 4}


# Very short names (1-2 chars) need even stricter matching
_TINY_ARTISTS = {a.lower() for a in config.TRACKED_ARTISTS if len(a) <= 2}
_SHORT_ARTISTS -= _TINY_ARTISTS


def _is_kpop_artist(artist_name: str) -> bool:
    """Check if artist matches tracked K-POP artists (case-insensitive, word-boundary aware)."""
    artist_lower = artist_name.lower()

    # Long artist names (5+ chars): substring match is safe
    for tracked in _LONG_ARTISTS:
        if tracked in artist_lower:
            return True

    # Medium artist names (3-4 chars): require word boundary
    for tracked in _SHORT_ARTISTS:
        if re.search(r'\b' + re.escape(tracked) + r'\b', artist_lower):
            return True

    # Tiny artist names (1-2 chars like V, RM): only match at start of name or
    # in standard collaboration formats (Featuring, &, x, ,)
    for tracked in _TINY_ARTISTS:
        # Match: "V", "V Featuring...", "... & V", "... Featuring V", "..., V"
        patterns = [
            r'^' + re.escape(tracked) + r'$',                     # exact: "V"
            r'^' + re.escape(tracked) + r'\b',                    # starts with: "V Featuring..."
            r'(?:featuring|feat\.?|ft\.?|&|,|x)\s+' + re.escape(tracked) + r'\b',  # collab: "... Featuring V"
        ]
        for pat in patterns:
            if re.search(pat, artist_lower):
                return True

    return False


def collect(today: str = None) -> list[dict]:
    """Collect K-POP entries from Billboard charts.

    Returns list of dicts ready for DB insertion.
    """
    today = today or date.today().isoformat()
    all_entries = []

    for chart_name in config.BILLBOARD_CHARTS:
        # "billboard-global-200" → "billboard_global200", "hot-100" → "billboard_hot100"
        clean_name = chart_name.replace("billboard-", "").replace("-", "")
        source_key = f"billboard_{clean_name}"
        logger.info(f"Fetching Billboard {chart_name}...")

        try:
            chart = billboard.ChartData(chart_name, timeout=config.REQUEST_TIMEOUT)
        except Exception as e:
            logger.warning(f"Failed to fetch Billboard {chart_name}: {e}")
            continue

        for entry in chart:
            if not _is_kpop_artist(entry.artist):
                continue

            all_entries.append({
                "date": today,
                "source": source_key,
                "rank": entry.rank,
                "title": entry.title,
                "artist": entry.artist,
                "peak_pos": entry.peakPos,
                "last_pos": entry.lastPos if entry.lastPos != 0 else None,
                "weeks_on_chart": entry.weeks,
                "streams": None,
                "is_new": 1 if entry.isNew else 0,
            })

        logger.info(f"  Billboard {chart_name}: {len([e for e in all_entries if e['source'] == source_key])} K-POP entries found")

    return all_entries
