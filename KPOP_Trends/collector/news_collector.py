"""K-POP news collector via RSS feeds."""

import logging
import ssl
from datetime import date, datetime, timedelta, timezone

import feedparser

import config

# Workaround for macOS SSL certificate issues
if hasattr(ssl, "_create_unverified_context"):
    ssl._create_default_https_context = ssl._create_unverified_context

logger = logging.getLogger(__name__)


def collect(today: str = None) -> list[dict]:
    """Collect K-POP news from RSS feeds.

    Returns list of dicts ready for DB insertion.
    """
    today = today or date.today().isoformat()
    entries = []
    cutoff = datetime.now(timezone.utc) - timedelta(hours=48)

    for source_name, feed_url in config.NEWS_FEEDS:
        logger.info(f"Fetching news from {source_name}...")

        try:
            feed = feedparser.parse(feed_url)
        except Exception as e:
            logger.warning(f"Failed to parse RSS from {source_name}: {e}")
            continue

        if feed.bozo and not feed.entries:
            logger.warning(f"RSS feed error for {source_name}: {feed.bozo_exception}")
            continue

        for item in feed.entries:
            title = item.get("title", "").strip()
            link = item.get("link", "")
            published = item.get("published", item.get("updated", ""))

            # Try to parse date and filter recent
            pub_date = None
            if hasattr(item, "published_parsed") and item.published_parsed:
                try:
                    pub_date = datetime(*item.published_parsed[:6], tzinfo=timezone.utc)
                except Exception:
                    pass

            if pub_date and pub_date < cutoff:
                continue

            if not title:
                continue

            entries.append({
                "date": today,
                "source": source_name,
                "title": title,
                "link": link,
                "published": published,
            })

        logger.info(f"  {source_name}: {len([e for e in entries if e['source'] == source_name])} articles")

    return entries
