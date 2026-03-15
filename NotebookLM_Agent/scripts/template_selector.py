#!/usr/bin/env python3
"""
Template Selector — 분석 콘텐츠 기반 최적 템플릿 + 색상 테마 자동 선택

Usage:
    python3 template_selector.py --input analysis.md
    python3 template_selector.py --input analysis.md --output result.json
    python3 template_selector.py --topic "AI 에이전트 수익화 전략"
"""

import argparse
import json
import re
import sys
from pathlib import Path

# ── 템플릿 키워드 매핑 ──────────────────────────────────────────

TEMPLATE_KEYWORDS = {
    "playbook": {
        "weight": 0,
        "keywords": [
            "방법", "전략", "가이드", "how to", "how-to", "단계", "step",
            "실행", "플레이북", "playbook", "수익화", "monetiz", "런칭",
            "시작하", "구축", "만들", "세팅", "설정", "워크플로", "workflow",
            "체크리스트", "checklist", "로드맵", "roadmap", "plan", "계획",
            "튜토리얼", "tutorial", "recipe", "레시피", "프레임워크",
            "framework", "methodology", "방법론", "빠르게", "fastest",
        ],
    },
    "comparison": {
        "weight": 0,
        "keywords": [
            "비교", "compar", "vs", "versus", "차이", "differ", "선택",
            "choose", "대안", "alternative", "장단점", "pros", "cons",
            "평가", "evaluat", "review", "rating", "ranking", "랭킹",
            "벤치마크", "benchmark", "top 5", "top 10", "top5", "top10",
            "best", "최고", "추천", "recommend", "어떤 것", "which",
        ],
    },
    "dashboard": {
        "weight": 0,
        "keywords": [
            "현황", "status", "대시보드", "dashboard", "모니터링", "monitor",
            "KPI", "지표", "metric", "추적", "track", "진행", "progress",
            "성과", "perform", "리포트", "report", "실적", "매출", "revenue",
            "통계", "statistic", "수치", "data", "분기", "quarter", "월간",
            "weekly", "daily", "일간", "주간", "점검", "audit", "운영",
        ],
    },
    "analysis": {
        "weight": 0,
        "keywords": [
            "분석", "analy", "시장", "market", "트렌드", "trend", "연구",
            "research", "조사", "survey", "인사이트", "insight", "산업",
            "industry", "생태계", "ecosystem", "전망", "outlook", "예측",
            "forecast", "동향", "landscape", "구조", "structure", "영향",
            "impact", "기회", "opportun", "위험", "risk", "threat",
        ],
    },
}

# ── 도메인 → 색상 테마 ──────────────────────────────────────────

DOMAIN_THEMES = {
    "finance": {
        "keywords": ["금융", "투자", "주식", "배당", "채권", "fintech", "finance",
                     "invest", "stock", "dividend", "bond", "crypto", "부동산",
                     "real estate", "은행", "bank", "자산", "asset", "포트폴리오"],
        "colors": {
            "PRIMARY": "#60a5fa",
            "SECONDARY": "#fbbf24",
            "TERTIARY": "#34d399",
            "BG_COLOR": "#0a0e27",
            "GRADIENT": "#1e3a5f, #60a5fa, #fbbf24",
            "PRIMARY_LIGHT": "#93c5fd",
            "PRIMARY_MID": "#60a5fa",
            "PRIMARY_06": "rgba(96,165,250,.06)",
            "PRIMARY_08": "rgba(96,165,250,.08)",
            "PRIMARY_15": "rgba(96,165,250,.15)",
            "PRIMARY_18": "rgba(96,165,250,.18)",
            "PRIMARY_20": "rgba(96,165,250,.20)",
            "PRIMARY_25": "rgba(96,165,250,.25)",
            "PRIMARY_30": "rgba(96,165,250,.30)",
            "PRIMARY_40": "rgba(96,165,250,.40)",
            "SECONDARY_12": "rgba(251,191,36,.12)",
            "SECONDARY_15": "rgba(251,191,36,.15)",
        },
    },
    "tech": {
        "keywords": ["AI", "인공지능", "기술", "tech", "LLM", "에이전트", "agent",
                     "자동화", "automat", "개발", "develop", "코딩", "coding",
                     "소프트웨어", "software", "SaaS", "API", "클라우드", "cloud",
                     "머신러닝", "machine learning", "GPT", "Claude", "딥러닝"],
        "colors": {
            "PRIMARY": "#10b981",
            "SECONDARY": "#3b82f6",
            "TERTIARY": "#a855f7",
            "BG_COLOR": "#0a0e27",
            "GRADIENT": "#10b981, #3b82f6, #a855f7",
            "PRIMARY_LIGHT": "#6ee7b7",
            "PRIMARY_MID": "#34d399",
            "PRIMARY_06": "rgba(16,185,129,.06)",
            "PRIMARY_08": "rgba(16,185,129,.08)",
            "PRIMARY_15": "rgba(16,185,129,.15)",
            "PRIMARY_18": "rgba(16,185,129,.18)",
            "PRIMARY_20": "rgba(16,185,129,.20)",
            "PRIMARY_25": "rgba(16,185,129,.25)",
            "PRIMARY_30": "rgba(16,185,129,.30)",
            "PRIMARY_40": "rgba(16,185,129,.40)",
            "SECONDARY_12": "rgba(59,130,246,.12)",
            "SECONDARY_15": "rgba(59,130,246,.15)",
        },
    },
    "business": {
        "keywords": ["수익", "비즈니스", "business", "사업", "매출", "revenue",
                     "성장", "growth", "스타트업", "startup", "창업", "경영",
                     "management", "프리랜서", "freelanc", "1인", "솔로", "solo",
                     "부업", "side hustle", "패시브", "passive", "income", "수입"],
        "colors": {
            "PRIMARY": "#f59e0b",
            "SECONDARY": "#ec4899",
            "TERTIARY": "#10b981",
            "BG_COLOR": "#0a0e27",
            "GRADIENT": "#f59e0b, #ec4899, #a855f7",
            "PRIMARY_LIGHT": "#fcd34d",
            "PRIMARY_MID": "#fbbf24",
            "PRIMARY_06": "rgba(245,158,11,.06)",
            "PRIMARY_08": "rgba(245,158,11,.08)",
            "PRIMARY_15": "rgba(245,158,11,.15)",
            "PRIMARY_18": "rgba(245,158,11,.18)",
            "PRIMARY_20": "rgba(245,158,11,.20)",
            "PRIMARY_25": "rgba(245,158,11,.25)",
            "PRIMARY_30": "rgba(245,158,11,.30)",
            "PRIMARY_40": "rgba(245,158,11,.40)",
            "SECONDARY_12": "rgba(236,72,153,.12)",
            "SECONDARY_15": "rgba(236,72,153,.15)",
        },
    },
    "entertainment": {
        "keywords": ["엔터", "KPOP", "K-POP", "한류", "문화", "culture", "음악",
                     "music", "영화", "movie", "콘텐츠", "content", "미디어",
                     "media", "유튜브", "YouTube", "틱톡", "TikTok", "인플루언서",
                     "influencer", "크리에이터", "creator", "팬덤", "fandom"],
        "colors": {
            "PRIMARY": "#ec4899",
            "SECONDARY": "#a855f7",
            "TERTIARY": "#f59e0b",
            "BG_COLOR": "#0a0e27",
            "GRADIENT": "#ec4899, #a855f7, #f59e0b",
            "PRIMARY_LIGHT": "#f9a8d4",
            "PRIMARY_MID": "#f472b6",
            "PRIMARY_06": "rgba(236,72,153,.06)",
            "PRIMARY_08": "rgba(236,72,153,.08)",
            "PRIMARY_15": "rgba(236,72,153,.15)",
            "PRIMARY_18": "rgba(236,72,153,.18)",
            "PRIMARY_20": "rgba(236,72,153,.20)",
            "PRIMARY_25": "rgba(236,72,153,.25)",
            "PRIMARY_30": "rgba(236,72,153,.30)",
            "PRIMARY_40": "rgba(236,72,153,.40)",
            "SECONDARY_12": "rgba(168,85,247,.12)",
            "SECONDARY_15": "rgba(168,85,247,.15)",
        },
    },
    "game": {
        "keywords": ["게임", "game", "퍼즐", "puzzle", "RPG", "로그라이크",
                     "roguelike", "모바일 게임", "mobile game", "인디 게임",
                     "indie", "플레이어", "player", "레벨", "level", "스테이지"],
        "colors": {
            "PRIMARY": "#a855f7",
            "SECONDARY": "#22d3ee",
            "TERTIARY": "#10b981",
            "BG_COLOR": "#0a0e27",
            "GRADIENT": "#a855f7, #22d3ee, #10b981",
            "PRIMARY_LIGHT": "#c4b5fd",
            "PRIMARY_MID": "#a78bfa",
            "PRIMARY_06": "rgba(168,85,247,.06)",
            "PRIMARY_08": "rgba(168,85,247,.08)",
            "PRIMARY_15": "rgba(168,85,247,.15)",
            "PRIMARY_18": "rgba(168,85,247,.18)",
            "PRIMARY_20": "rgba(168,85,247,.20)",
            "PRIMARY_25": "rgba(168,85,247,.25)",
            "PRIMARY_30": "rgba(168,85,247,.30)",
            "PRIMARY_40": "rgba(168,85,247,.40)",
            "SECONDARY_12": "rgba(34,211,238,.12)",
            "SECONDARY_15": "rgba(34,211,238,.15)",
        },
    },
    "marketing": {
        "keywords": ["마케팅", "marketing", "광고", "ads", "SEO", "ASO", "퍼널",
                     "funnel", "전환", "conversion", "브랜딩", "branding", "SNS",
                     "소셜", "social", "타겟", "target", "캠페인", "campaign"],
        "colors": {
            "PRIMARY": "#3b82f6",
            "SECONDARY": "#10b981",
            "TERTIARY": "#f59e0b",
            "BG_COLOR": "#0a0e27",
            "GRADIENT": "#3b82f6, #10b981, #f59e0b",
            "PRIMARY_LIGHT": "#93c5fd",
            "PRIMARY_MID": "#60a5fa",
            "PRIMARY_06": "rgba(59,130,246,.06)",
            "PRIMARY_08": "rgba(59,130,246,.08)",
            "PRIMARY_15": "rgba(59,130,246,.15)",
            "PRIMARY_18": "rgba(59,130,246,.18)",
            "PRIMARY_20": "rgba(59,130,246,.20)",
            "PRIMARY_25": "rgba(59,130,246,.25)",
            "PRIMARY_30": "rgba(59,130,246,.30)",
            "PRIMARY_40": "rgba(59,130,246,.40)",
            "SECONDARY_12": "rgba(16,185,129,.12)",
            "SECONDARY_15": "rgba(16,185,129,.15)",
        },
    },
}

DEFAULT_DOMAIN = "tech"


def count_keyword_matches(text: str, keywords: list[str]) -> int:
    text_lower = text.lower()
    count = 0
    for kw in keywords:
        count += len(re.findall(re.escape(kw.lower()), text_lower))
    return count


def select_template(text: str) -> str:
    scores = {}
    for tpl_id, cfg in TEMPLATE_KEYWORDS.items():
        scores[tpl_id] = count_keyword_matches(text, cfg["keywords"])

    # analysis is default — needs 20% more hits than others to win
    best = max(scores, key=scores.get)
    if best == "analysis":
        return best

    # non-analysis needs to beat analysis by at least 2 hits
    if scores[best] > scores["analysis"] + 1:
        return best
    return "analysis"


def select_domain(text: str) -> str:
    scores = {}
    for domain, cfg in DOMAIN_THEMES.items():
        scores[domain] = count_keyword_matches(text, cfg["keywords"])

    best = max(scores, key=scores.get)
    if scores[best] == 0:
        return DEFAULT_DOMAIN
    return best


def resolve_template(text: str) -> dict:
    template_type = select_template(text)
    domain = select_domain(text)
    colors = DOMAIN_THEMES[domain]["colors"]

    templates_dir = Path(__file__).parent.parent / "outputs" / "templates"
    template_path = templates_dir / f"{template_type}.html"

    return {
        "template_type": template_type,
        "domain": domain,
        "template_path": str(template_path),
        "colors": colors,
        "scores": {
            "template_scores": {
                tid: count_keyword_matches(text, cfg["keywords"])
                for tid, cfg in TEMPLATE_KEYWORDS.items()
            },
            "domain_scores": {
                d: count_keyword_matches(text, cfg["keywords"])
                for d, cfg in DOMAIN_THEMES.items()
            },
        },
    }


def main():
    parser = argparse.ArgumentParser(description="Template Selector")
    parser.add_argument("--input", help="Analysis markdown file path")
    parser.add_argument("--topic", help="Topic string (alternative to --input)")
    parser.add_argument("--output", help="Output JSON path (default: stdout)")
    args = parser.parse_args()

    if args.input:
        text = Path(args.input).read_text(encoding="utf-8")
    elif args.topic:
        text = args.topic
    else:
        parser.error("Either --input or --topic is required")

    result = resolve_template(text)

    output_json = json.dumps(result, ensure_ascii=False, indent=2)
    if args.output:
        Path(args.output).write_text(output_json, encoding="utf-8")
        print(f"Saved to {args.output}", file=sys.stderr)
    else:
        print(output_json)


if __name__ == "__main__":
    main()
