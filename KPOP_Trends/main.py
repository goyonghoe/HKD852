#!/usr/bin/env python3
"""K-POP Trends Daily Pipeline - Main entry point.

Usage:
    python3 main.py              # Run full pipeline for today
    python3 main.py 2026-02-15   # Run for specific date
    python3 main.py --rerun      # Clear today's data and re-run
"""

import sys
import os
import logging
from datetime import date, datetime

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import config
from database import db_manager
from collector import billboard_collector, spotify_collector, trends_collector, news_collector
from analyzer import insight_engine
from reporter import daily_report

# Setup logging
os.makedirs(config.LOGS_DIR, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(
            os.path.join(config.LOGS_DIR, f"{date.today().isoformat()}.log"),
            encoding="utf-8",
        ),
    ],
)
logger = logging.getLogger("kpop_trends")


def run_pipeline(today: str = None, rerun: bool = False):
    """Execute the full data pipeline: collect -> store -> analyze -> report."""
    today = today or date.today().isoformat()
    start_time = datetime.now()

    logger.info(f"=== K-POP Trends Daily Pipeline | {today} ===")

    # Initialize DB
    db_manager.init_db()

    # Handle re-run
    if rerun or db_manager.has_data_for_date(today):
        if rerun:
            logger.info("Re-run requested, clearing existing data...")
            db_manager.clear_date(today)
        elif db_manager.has_data_for_date(today):
            logger.info("Data already exists for today. Use --rerun to overwrite.")
            logger.info("Skipping collection, regenerating report from existing data...")
            _analyze_and_report(today)
            return

    # === Phase 1: Data Collection ===
    logger.info("--- Phase 1: Data Collection ---")

    # Billboard
    try:
        billboard_entries = billboard_collector.collect(today)
        if billboard_entries:
            db_manager.insert_chart_entries(billboard_entries)
            logger.info(f"Billboard: {len(billboard_entries)} K-POP entries saved")
    except Exception as e:
        logger.error(f"Billboard collection failed: {e}", exc_info=True)

    # Spotify Korea
    try:
        spotify_entries = spotify_collector.collect(today)
        if spotify_entries:
            db_manager.insert_chart_entries(spotify_entries)
            logger.info(f"Spotify KR: {len(spotify_entries)} entries saved")
    except Exception as e:
        logger.error(f"Spotify collection failed: {e}", exc_info=True)

    # Google Trends
    try:
        trends_entries = trends_collector.collect(today)
        if trends_entries:
            db_manager.insert_trends(trends_entries)
            kpop_count = sum(1 for t in trends_entries if t["is_kpop_related"])
            logger.info(f"Google Trends: {len(trends_entries)} total, {kpop_count} K-POP related")
    except Exception as e:
        logger.error(f"Google Trends collection failed: {e}", exc_info=True)

    # News
    try:
        news_entries = news_collector.collect(today)
        if news_entries:
            db_manager.insert_news(news_entries)
            logger.info(f"News: {len(news_entries)} articles saved")
    except Exception as e:
        logger.error(f"News collection failed: {e}", exc_info=True)

    # === Phase 2 & 3: Analysis + Report ===
    _analyze_and_report(today)

    elapsed = (datetime.now() - start_time).total_seconds()
    logger.info(f"=== Pipeline completed in {elapsed:.1f}s ===")


def _analyze_and_report(today: str):
    """Run analysis and generate report."""
    # === Phase 2: Analysis ===
    logger.info("--- Phase 2: Insight Analysis ---")
    try:
        insights = insight_engine.analyze(today)
        if insights:
            db_manager.insert_insights(insights)
            logger.info(f"Insights: {len(insights)} generated")
    except Exception as e:
        logger.error(f"Analysis failed: {e}", exc_info=True)

    # === Phase 3: Report Generation ===
    logger.info("--- Phase 3: Report Generation ---")
    try:
        filepath = daily_report.generate(today)
        logger.info(f"Report: {filepath}")
    except Exception as e:
        logger.error(f"Report generation failed: {e}", exc_info=True)


if __name__ == "__main__":
    target_date = None
    rerun = False

    for arg in sys.argv[1:]:
        if arg == "--rerun":
            rerun = True
        elif arg.startswith("20"):
            target_date = arg

    run_pipeline(today=target_date, rerun=rerun)
