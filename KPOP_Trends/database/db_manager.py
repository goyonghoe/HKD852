"""SQLite database manager for K-POP Trends."""

import sqlite3
import json
import os
from datetime import datetime, timedelta

from database.models import SCHEMA_SQL
import config


def get_connection():
    os.makedirs(os.path.dirname(config.DB_PATH), exist_ok=True)
    conn = sqlite3.connect(config.DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    conn.executescript(SCHEMA_SQL)
    conn.commit()
    conn.close()


# --- Chart Entries ---

def insert_chart_entries(entries: list[dict]):
    """Insert chart entries. Each dict: date, source, rank, title, artist, peak_pos, last_pos, weeks_on_chart, streams, is_new"""
    conn = get_connection()
    conn.executemany(
        """INSERT INTO chart_entries (date, source, rank, title, artist, peak_pos, last_pos, weeks_on_chart, streams, is_new)
           VALUES (:date, :source, :rank, :title, :artist, :peak_pos, :last_pos, :weeks_on_chart, :streams, :is_new)""",
        entries,
    )
    conn.commit()
    conn.close()


def get_chart_entries(date: str, source: str = None) -> list[dict]:
    conn = get_connection()
    if source:
        rows = conn.execute(
            "SELECT * FROM chart_entries WHERE date=? AND source=? ORDER BY rank", (date, source)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM chart_entries WHERE date=? ORDER BY source, rank", (date,)
        ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_previous_chart_date(date: str, source: str) -> str | None:
    conn = get_connection()
    row = conn.execute(
        "SELECT DISTINCT date FROM chart_entries WHERE date < ? AND source = ? ORDER BY date DESC LIMIT 1",
        (date, source),
    ).fetchone()
    conn.close()
    return row["date"] if row else None


# --- Google Trends ---

def insert_trends(entries: list[dict]):
    conn = get_connection()
    conn.executemany(
        """INSERT INTO google_trends (date, region, keyword, traffic, related_news, is_kpop_related)
           VALUES (:date, :region, :keyword, :traffic, :related_news, :is_kpop_related)""",
        entries,
    )
    conn.commit()
    conn.close()


def get_trends(date: str, region: str = None, kpop_only: bool = False) -> list[dict]:
    conn = get_connection()
    q = "SELECT * FROM google_trends WHERE date=?"
    params = [date]
    if region:
        q += " AND region=?"
        params.append(region)
    if kpop_only:
        q += " AND is_kpop_related=1"
    rows = conn.execute(q, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# --- News ---

def insert_news(entries: list[dict]):
    conn = get_connection()
    for entry in entries:
        try:
            conn.execute(
                """INSERT OR IGNORE INTO news_headlines (date, source, title, link, published)
                   VALUES (:date, :source, :title, :link, :published)""",
                entry,
            )
        except sqlite3.IntegrityError:
            pass
    conn.commit()
    conn.close()


def get_news(date: str) -> list[dict]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM news_headlines WHERE date=? ORDER BY published DESC", (date,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# --- Insights ---

def insert_insights(entries: list[dict]):
    conn = get_connection()
    conn.executemany(
        """INSERT INTO daily_insights (date, category, severity, title, description, data_json)
           VALUES (:date, :category, :severity, :title, :description, :data_json)""",
        entries,
    )
    conn.commit()
    conn.close()


def get_insights(date: str, severity: str = None) -> list[dict]:
    conn = get_connection()
    if severity:
        rows = conn.execute(
            "SELECT * FROM daily_insights WHERE date=? AND severity=? ORDER BY id", (date, severity)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM daily_insights WHERE date=? ORDER BY CASE severity WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, id",
            (date,),
        ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def has_data_for_date(date: str) -> bool:
    conn = get_connection()
    row = conn.execute("SELECT COUNT(*) as cnt FROM chart_entries WHERE date=?", (date,)).fetchone()
    conn.close()
    return row["cnt"] > 0


def clear_date(date: str):
    """Remove all data for a specific date (for re-runs)."""
    conn = get_connection()
    for table in ["chart_entries", "google_trends", "news_headlines", "daily_insights"]:
        conn.execute(f"DELETE FROM {table} WHERE date=?", (date,))
    conn.commit()
    conn.close()
