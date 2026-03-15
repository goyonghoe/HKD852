"""Daily HTML report generator for K-POP Trends — Regional K-POP Focus."""

import json
import os
import logging
from datetime import date, datetime

import config
from database import db_manager
from analyzer import insight_engine

logger = logging.getLogger(__name__)


def generate(today: str = None) -> str:
    """Generate HTML report and save to outputs/reports/.

    Returns the file path of the generated report.
    """
    today = today or date.today().isoformat()
    os.makedirs(config.REPORTS_DIR, exist_ok=True)

    # Get regional summary from insight engine
    summary = insight_engine.get_regional_summary(today)
    regions = summary["regions"]
    executive = summary["executive"]

    # Build HTML
    html = _build_html(today, regions, executive)

    # Save
    filepath = os.path.join(config.REPORTS_DIR, f"{today}.html")
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(html)

    # Update latest symlink
    latest = os.path.join(config.REPORTS_DIR, "latest.html")
    if os.path.islink(latest) or os.path.exists(latest):
        os.remove(latest)
    os.symlink(f"{today}.html", latest)

    logger.info(f"Report saved: {filepath}")
    return filepath


def _build_html(today, regions, executive):
    now = datetime.now().strftime("%Y-%m-%d %H:%M")

    # --- Executive Summary ---
    exec_html = _build_executive_section(executive)

    # --- Top Artists ---
    artists_html = _build_top_artists(executive.get("top_artists", []))

    # --- Regional Sections ---
    region_sections = ""
    region_nav = ""
    section_idx = 0
    region_order = ["한국", "일본", "중화권", "동남아", "북미", "남미", "유럽", "글로벌"]

    for region_name in region_order:
        if region_name not in regions:
            continue
        region_data = regions[region_name]
        group_info = config.REGION_GROUPS.get(region_name, {"icon": "&#x1F310;", "codes": []})
        icon = group_info.get("icon", "&#x1F310;")
        codes = group_info.get("codes", [])

        has_data = (region_data["stats"]["insight_count"] > 0 or
                    region_data["chart_highlights"] or
                    region_data["trending_keywords"])

        section_idx += 1
        region_id = f"region-{section_idx}"
        region_nav += f'<a href="#{region_id}">{icon} {region_name}</a>'

        region_sections += _build_region_section(
            region_name, region_id, icon, codes, region_data, has_data, section_idx
        )

    # --- News Section ---
    news_html = _build_news_section(executive.get("news", []))

    return f'''<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>K-POP Daily Trend Brief | {today}</title>
<style>
:root {{
  --bg: #0f1117; --surface: #1a1d27; --surface2: #242836;
  --border: #2e3348; --text: #e4e6f0; --text-dim: #8b8fa8;
  --accent: #6c7bff; --accent-light: #8b9aff;
  --success: #3fb950; --warning: #f0883e; --danger: #f85149;
  --gold: #ff9f1a; --purple: #a78bfa;
}}
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg); color: var(--text); line-height: 1.6;
  padding-bottom: 40px;
}}

/* Header */
.header {{
  background: linear-gradient(135deg, #1a1d27 0%, #1e2235 50%, #242836 100%);
  border-bottom: 1px solid var(--border); padding: 28px 20px 20px; text-align: center;
}}
.header .badge {{ display:inline-block; background:var(--accent); color:#fff;
  font-size:10px; font-weight:700; padding:3px 10px; border-radius:20px;
  margin-bottom:8px; letter-spacing:1px; }}
.header h1 {{ font-size:20px; font-weight:800; }}
.header .sub {{ color:var(--text-dim); font-size:12px; margin-top:4px; }}

/* Navigation */
.nav {{
  background:var(--surface); border-bottom:1px solid var(--border);
  padding:8px 16px; overflow-x:auto; white-space:nowrap;
  -webkit-overflow-scrolling: touch;
}}
.nav a {{ display:inline-block; color:var(--text-dim); text-decoration:none;
  font-size:12px; padding:5px 8px; border-radius:6px; }}
.nav a:hover {{ color:var(--text); background:var(--surface2); }}

.container {{ max-width:900px; margin:0 auto; padding:0 16px; }}

/* Executive Summary */
.exec-section {{
  background: linear-gradient(135deg, rgba(108,123,255,0.08) 0%, rgba(167,139,250,0.06) 100%);
  border: 1px solid rgba(108,123,255,0.2); border-radius: 14px;
  padding: 20px; margin: 20px 0;
}}
.exec-title {{
  font-size: 16px; font-weight: 700; margin-bottom: 14px;
  display: flex; align-items: center; gap: 8px;
}}
.exec-title .dot {{ width:8px; height:8px; border-radius:50%; background:var(--accent); }}
.exec-grid {{
  display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px; margin-bottom: 16px;
}}
.exec-stat {{
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 10px; padding: 12px; text-align: center;
}}
.exec-stat .val {{ font-size: 24px; font-weight: 800; color: var(--accent); }}
.exec-stat .lbl {{ font-size: 10px; color: var(--text-dim); margin-top: 2px; }}

.exec-insight {{
  background: var(--surface); border-left: 3px solid var(--danger);
  border-radius: 0 8px 8px 0; padding: 10px 14px; margin: 6px 0;
}}
.exec-insight .badge-hi {{
  display:inline-block; font-size:9px; font-weight:700; padding:2px 6px;
  border-radius:3px; background:rgba(248,81,73,0.15); color:var(--danger); margin-right:6px;
}}
.exec-insight .title {{ font-size:13px; font-weight:600; display:inline; }}
.exec-insight .desc {{ font-size:11px; color:var(--text-dim); margin-top:3px; }}

/* Top Artists */
.artists-bar {{
  display:flex; gap:8px; overflow-x:auto; padding:4px 0; margin:12px 0;
  -webkit-overflow-scrolling: touch;
}}
.artist-chip {{
  flex-shrink:0; background:var(--surface); border:1px solid var(--border);
  border-radius:10px; padding:10px 14px; min-width:140px;
}}
.artist-chip .name {{ font-size:13px; font-weight:700; color:var(--text); }}
.artist-chip .info {{ font-size:10px; color:var(--text-dim); margin-top:4px; line-height:1.4; }}
.artist-chip .tag {{ display:inline-block; font-size:9px; padding:1px 5px;
  border-radius:3px; margin-top:4px; margin-right:3px; }}
.tag-chart {{ background:rgba(108,123,255,0.15); color:var(--accent); }}
.tag-trend {{ background:rgba(63,185,80,0.15); color:var(--success); }}
.tag-news {{ background:rgba(240,136,62,0.15); color:var(--warning); }}

/* Region Sections */
.region {{
  margin: 24px 0; border: 1px solid var(--border);
  border-radius: 14px; overflow: hidden;
}}
.region-header {{
  background: var(--surface); padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  display: flex; justify-content: space-between; align-items: center;
}}
.region-header h2 {{
  font-size: 16px; font-weight: 700; display:flex; align-items:center; gap:8px;
}}
.region-header .region-stats {{
  display:flex; gap:12px; font-size:11px; color:var(--text-dim);
}}
.region-header .region-stats span {{ display:flex; align-items:center; gap:3px; }}

.region-body {{ padding: 14px 16px; }}

/* Insight Cards (compact) */
.insight-compact {{
  padding: 8px 12px; margin: 5px 0;
  border-radius: 8px; font-size: 12px;
}}
.insight-compact.high {{
  background: rgba(248,81,73,0.06); border-left: 3px solid var(--danger);
}}
.insight-compact.medium {{
  background: rgba(240,136,62,0.06); border-left: 3px solid var(--warning);
}}
.insight-sev {{
  display:inline-block; font-size:9px; font-weight:700; padding:1px 5px;
  border-radius:3px; margin-right:5px;
}}
.insight-sev.high {{ background:rgba(248,81,73,0.15); color:var(--danger); }}
.insight-sev.medium {{ background:rgba(240,136,62,0.15); color:var(--warning); }}
.insight-text {{ font-weight:600; }}
.insight-sub {{ color:var(--text-dim); font-size:11px; margin-top:2px; }}

/* Trend Pills */
.trend-pills {{ display:flex; flex-wrap:wrap; gap:6px; margin:8px 0; }}
.trend-pill {{
  display:inline-flex; align-items:center; gap:4px;
  background:var(--surface2); border:1px solid var(--border);
  border-radius:20px; padding:4px 10px; font-size:11px;
}}
.trend-pill.kpop {{
  background:rgba(108,123,255,0.1); border-color:rgba(108,123,255,0.3);
  color:var(--accent-light);
}}
.trend-pill .traffic {{ color:var(--text-dim); font-size:10px; }}

/* Chart Mini Table */
.chart-mini {{ margin:10px 0; }}
.chart-mini-title {{
  font-size:12px; font-weight:600; color:var(--accent-light);
  margin-bottom:6px; padding-bottom:4px; border-bottom:1px solid var(--border);
}}
.chart-row {{
  display:flex; align-items:center; padding:5px 0; font-size:12px;
  border-bottom:1px solid rgba(46,51,72,0.3);
}}
.chart-row:last-child {{ border-bottom:none; }}
.chart-rank {{ width:36px; font-weight:700; color:var(--accent); flex-shrink:0; }}
.chart-change {{ width:44px; flex-shrink:0; font-size:11px; }}
.chart-info {{ flex:1; min-width:0; }}
.chart-info .song {{ font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }}
.chart-info .artist {{ color:var(--text-dim); font-size:11px; }}
.chart-streams {{ flex-shrink:0; font-size:11px; color:var(--text-dim); text-align:right; min-width:60px; }}
.change-up {{ color:var(--success); }}
.change-down {{ color:var(--danger); }}
.change-same {{ color:var(--text-dim); }}
.badge-new {{ color:var(--gold); font-size:9px; font-weight:700; margin-left:4px; }}

/* Sub-section labels */
.sub-label {{
  font-size:11px; font-weight:600; color:var(--text-dim);
  text-transform:uppercase; letter-spacing:0.5px; margin:12px 0 6px;
  padding-bottom:4px; border-bottom:1px dashed var(--border);
}}

/* News */
.news-compact {{ padding:5px 0; border-bottom:1px solid rgba(46,51,72,0.3); }}
.news-compact:last-child {{ border-bottom:none; }}
.news-src {{
  display:inline-block; background:var(--surface2); color:var(--text-dim);
  font-size:9px; padding:1px 5px; border-radius:3px; margin-right:4px;
}}
.news-link {{ color:var(--text); text-decoration:none; font-size:12px; }}
.news-link:hover {{ color:var(--accent); }}

/* Empty */
.empty {{ color:var(--text-dim); font-size:12px; padding:12px 0; text-align:center; }}

/* Footer */
.footer {{
  background:var(--surface); border-top:1px solid var(--border);
  padding:16px; text-align:center; margin-top:28px;
}}
.footer p {{ font-size:10px; color:var(--text-dim); }}

@media (max-width:640px) {{
  .exec-grid {{ grid-template-columns:repeat(2,1fr); }}
  .region-header {{ flex-direction:column; align-items:flex-start; gap:6px; }}
  .chart-row {{ font-size:11px; }}
}}
@media print {{
  :root {{ --bg:#fff; --surface:#f8f9fa; --surface2:#e9ecef; --border:#dee2e6;
    --text:#212529; --text-dim:#6c757d; }}
}}
</style>
</head>
<body>

<div class="header">
  <div class="badge">K-POP TREND BRIEF</div>
  <h1>K-POP 글로벌 트렌드 데일리 브리프</h1>
  <div class="sub">{today} | {now} 기준</div>
</div>

<div class="nav">
  <a href="#executive">&#x1F4CB; 핵심 요약</a>
  <a href="#artists">&#x1F3A4; 주요 아티스트</a>
  {region_nav}
  <a href="#news">&#x1F4F0; 뉴스</a>
</div>

<div class="container">

<!-- Executive Summary -->
<div id="executive">
{exec_html}
</div>

<!-- Top Artists -->
<div id="artists" style="margin:20px 0">
  <div class="sub-label">&#x1F3A4; 오늘의 주요 K-POP 아티스트</div>
  {artists_html}
</div>

<!-- Regional Sections -->
{region_sections}

<!-- News -->
<div id="news" class="region" style="margin-top:24px">
  <div class="region-header">
    <h2>&#x1F4F0; K-POP 뉴스 헤드라인</h2>
  </div>
  <div class="region-body">
    {news_html}
  </div>
</div>

</div>

<div class="footer">
  <p>HKD852 Studio | K-POP Trend Daily Brief | Auto-generated</p>
</div>

<script>
document.querySelectorAll('.nav a').forEach(a => {{
  a.addEventListener('click', function(e) {{
    e.preventDefault();
    const t = document.querySelector(this.getAttribute('href'));
    if (t) t.scrollIntoView({{ behavior:'smooth', block:'start' }});
  }});
}});
</script>
</body>
</html>'''


def _build_executive_section(executive):
    total_insights = executive.get("total_insights", 0)
    total_kpop_trends = executive.get("total_kpop_trends", 0)
    active_regions = executive.get("active_regions", 0)
    total_news = executive.get("total_news", 0)
    high_insights = executive.get("high_insights", [])

    # Stats
    stats_html = f'''<div class="exec-grid">
  <div class="exec-stat"><div class="val">{len(high_insights)}</div><div class="lbl">핵심 인사이트</div></div>
  <div class="exec-stat"><div class="val">{total_kpop_trends}</div><div class="lbl">K-POP 트렌딩</div></div>
  <div class="exec-stat"><div class="val">{active_regions}</div><div class="lbl">활성 지역</div></div>
  <div class="exec-stat"><div class="val">{total_news}</div><div class="lbl">뉴스 기사</div></div>
</div>'''

    # Top insights (high severity only, max 5)
    insights_html = ""
    shown = high_insights[:5]
    if shown:
        for ins in shown:
            desc = ins.get("description", "")
            insights_html += f'''<div class="exec-insight">
  <span class="badge-hi">HIGH</span>
  <span class="title">{ins['title']}</span>
  <div class="desc">{desc}</div>
</div>\n'''
    else:
        insights_html = '<div class="empty">오늘은 HIGH 등급 인사이트가 없습니다.</div>'

    return f'''<div class="exec-section">
  <div class="exec-title"><span class="dot"></span> 오늘의 핵심 요약</div>
  {stats_html}
  <div class="sub-label" style="margin-top:14px">주요 인사이트 (HIGH)</div>
  {insights_html}
</div>'''


def _build_top_artists(top_artists):
    if not top_artists:
        return '<div class="empty">아티스트 데이터가 없습니다.</div>'

    html = '<div class="artists-bar">'
    for a in top_artists[:8]:
        tags = ""
        if a.get("charts"):
            for c in a["charts"][:2]:
                tags += f'<span class="tag tag-chart">{c}</span>'
        if a.get("trend_regions"):
            tags += f'<span class="tag tag-trend">Trend: {", ".join(a["trend_regions"][:3])}</span>'
        if a.get("news_count", 0) > 0:
            tags += f'<span class="tag tag-news">News {a["news_count"]}</span>'

        info_parts = []
        if a.get("charts"):
            info_parts.append(f"{len(a['charts'])} chart entries")
        if a.get("trend_regions"):
            info_parts.append(f"{len(a['trend_regions'])} trending regions")

        html += f'''<div class="artist-chip">
  <div class="name">{a['artist']}</div>
  <div class="info">{' | '.join(info_parts)}</div>
  <div>{tags}</div>
</div>\n'''

    html += '</div>'
    return html


def _build_region_section(region_name, region_id, icon, codes, data, has_data, idx):
    insights = data["insights"]
    chart_highlights = data["chart_highlights"]
    trending_kw = data["trending_keywords"]
    all_trending = data["all_trending"]
    stats = data["stats"]

    # Region stats badges
    stats_html = ""
    if stats["insight_count"] > 0:
        stats_html += f'<span>&#x26A1; {stats["insight_count"]} insights</span>'
    if stats["kpop_trend_count"] > 0:
        stats_html += f'<span>&#x1F525; {stats["kpop_trend_count"]} K-POP trends</span>'
    if chart_highlights:
        stats_html += f'<span>&#x1F4CA; {len(chart_highlights)} chart entries</span>'

    # Body content
    body_html = ""

    if not has_data:
        body_html = '<div class="empty">이 지역에서 오늘 수집된 K-POP 관련 데이터가 없습니다.</div>'
    else:
        # 1. Insights
        if insights:
            body_html += '<div class="sub-label">인사이트</div>\n'
            for ins in insights[:8]:
                sev = ins["severity"]
                desc = ins.get("description", "")
                body_html += f'''<div class="insight-compact {sev}">
  <span class="insight-sev {sev}">{sev.upper()}</span>
  <span class="insight-text">{ins['title']}</span>
  <div class="insight-sub">{desc}</div>
</div>\n'''

        # 2. K-POP Trending keywords
        if trending_kw:
            body_html += '<div class="sub-label">K-POP 트렌딩 키워드</div>\n'
            body_html += '<div class="trend-pills">'
            for t in trending_kw:
                traffic = t.get("traffic", "")
                body_html += f'<span class="trend-pill kpop">{t["keyword"]} <span class="traffic">{traffic}</span></span>'
            body_html += '</div>\n'

        # 3. All trending (non-kpop, to show general context, max 10)
        other_trends = [t for t in all_trending if not t["is_kpop_related"]]
        if other_trends:
            body_html += '<div class="sub-label">전체 트렌딩 (참고)</div>\n'
            body_html += '<div class="trend-pills">'
            for t in other_trends[:10]:
                traffic = t.get("traffic", "")
                body_html += f'<span class="trend-pill">{t["keyword"]} <span class="traffic">{traffic}</span></span>'
            body_html += '</div>\n'

        # 4. Chart highlights
        if chart_highlights:
            # Group by source
            by_source = {}
            for entry in chart_highlights:
                src = entry["source"]
                if src not in by_source:
                    by_source[src] = []
                by_source[src].append(entry)

            for src, entries in by_source.items():
                label = src.replace("billboard_", "Billboard ").replace("global200", "Global 200").replace("hot100", "Hot 100").replace("spotify_kr", "Spotify Korea")
                body_html += f'<div class="chart-mini">'
                body_html += f'<div class="chart-mini-title">{label} K-POP Top {min(len(entries), 10)}</div>'
                for entry in entries[:10]:
                    change_html = _rank_change_html(entry.get("rank"), entry.get("last_pos"))
                    new_badge = '<span class="badge-new">NEW</span>' if entry.get("is_new") else ""
                    streams_html = ""
                    if entry.get("streams"):
                        streams_html = f'<div class="chart-streams">{entry["streams"]:,}</div>'
                    body_html += f'''<div class="chart-row">
  <div class="chart-rank">#{entry['rank']}</div>
  <div class="chart-change">{change_html}</div>
  <div class="chart-info"><div class="song">{entry['title']}{new_badge}</div><div class="artist">{entry['artist']}</div></div>
  {streams_html}
</div>\n'''
                body_html += '</div>\n'

    codes_str = ", ".join(codes) if codes else ""

    return f'''<div class="region" id="{region_id}">
  <div class="region-header">
    <h2>{icon} {region_name} {f'<span style="font-size:11px;color:var(--text-dim);font-weight:400">({codes_str})</span>' if codes_str else ''}</h2>
    <div class="region-stats">{stats_html}</div>
  </div>
  <div class="region-body">{body_html}</div>
</div>\n'''


def _build_news_section(news):
    if not news:
        return '<div class="empty">뉴스 데이터가 없습니다.</div>'

    html = ""
    for n in news:
        link_attr = f'href="{n["link"]}" target="_blank"' if n.get("link") else ""
        html += f'''<div class="news-compact">
  <span class="news-src">{n['source']}</span>
  <a {link_attr} class="news-link">{n['title']}</a>
</div>\n'''
    return html


def _rank_change_html(curr, prev):
    if prev is None or curr is None:
        return '<span class="change-same">-</span>'
    change = prev - curr
    if change > 0:
        return f'<span class="change-up">&#9650;{change}</span>'
    elif change < 0:
        return f'<span class="change-down">&#9660;{abs(change)}</span>'
    return '<span class="change-same">&#8212;</span>'
