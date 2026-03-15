"""SQLite schema definition and initialization."""

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS chart_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    source TEXT NOT NULL,
    rank INTEGER,
    title TEXT,
    artist TEXT,
    peak_pos INTEGER,
    last_pos INTEGER,
    weeks_on_chart INTEGER,
    streams INTEGER,
    is_new BOOLEAN DEFAULT 0,
    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS google_trends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    region TEXT NOT NULL,
    keyword TEXT,
    traffic TEXT,
    related_news TEXT,
    is_kpop_related BOOLEAN DEFAULT 0,
    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS news_headlines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    source TEXT,
    title TEXT,
    link TEXT UNIQUE,
    published TEXT,
    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    category TEXT,
    severity TEXT,
    title TEXT,
    description TEXT,
    data_json TEXT,
    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chart_date ON chart_entries(date, source);
CREATE INDEX IF NOT EXISTS idx_chart_artist ON chart_entries(date, artist);
CREATE INDEX IF NOT EXISTS idx_trends_date ON google_trends(date, region);
CREATE INDEX IF NOT EXISTS idx_news_date ON news_headlines(date);
CREATE INDEX IF NOT EXISTS idx_insights_date ON daily_insights(date, severity);
"""
