"""Spotify Korea daily chart collector via kworb.net (no API key needed)."""

import logging
import re
from datetime import date

import requests
from bs4 import BeautifulSoup

import config

logger = logging.getLogger(__name__)


def collect(today: str = None) -> list[dict]:
    """Scrape Spotify Korea daily chart from kworb.net.

    Returns list of dicts ready for DB insertion.
    """
    today = today or date.today().isoformat()
    entries = []

    logger.info("Fetching Spotify Korea chart from kworb.net...")

    try:
        resp = requests.get(
            config.SPOTIFY_KR_URL,
            headers=config.REQUEST_HEADERS,
            timeout=config.REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
    except Exception as e:
        logger.warning(f"Failed to fetch Spotify Korea chart: {e}")
        return entries

    soup = BeautifulSoup(resp.text, "html.parser")
    table = soup.find("table")
    if not table:
        logger.warning("No table found on kworb.net page")
        return entries

    rows = table.find_all("tr")

    for row in rows:
        cells = row.find_all("td")
        if len(cells) < 7:
            continue

        # kworb format: Pos | P+ | Artist-Title | Days | Pk | (x?) | Streams | ...
        pos_text = cells[0].get_text(strip=True)
        if not pos_text.isdigit():
            continue

        rank = int(pos_text)

        # Artist-Title cell (index 2), format: "Artist-Title"
        at_cell = cells[2]
        text = at_cell.get_text(strip=True)
        parts = text.split("-", 1)
        if len(parts) == 2:
            artist, title = parts[0].strip(), parts[1].strip()
        else:
            artist, title = text, ""

        # Streams column (index 6)
        streams = None
        streams_text = cells[6].get_text(strip=True).replace(",", "")
        if streams_text.isdigit():
            streams = int(streams_text)

        # Peak position (index 4)
        peak_text = cells[4].get_text(strip=True)
        peak_pos = int(peak_text) if peak_text.isdigit() else None

        entries.append({
            "date": today,
            "source": "spotify_kr",
            "rank": rank,
            "title": title,
            "artist": artist,
            "peak_pos": peak_pos,
            "last_pos": None,
            "weeks_on_chart": None,
            "streams": streams,
            "is_new": 0,
        })

        if rank >= 200:
            break

    logger.info(f"  Spotify Korea: {len(entries)} entries collected")
    return entries
