#!/usr/bin/env python3
"""
YouTube Shorts 메타데이터 생성 유틸리티
타이틀, 설명, 해시태그, 썸네일 텍스트 규칙 검증
"""

import json
import re
from pathlib import Path


# 해시태그 카테고리
HASHTAG_POOLS = {
    "ai-tech": ["#AITools", "#AI", "#TechTips", "#Automation", "#Productivity", "#TechReview", "#AIHacks"],
    "finance": ["#Money", "#Investing", "#Finance", "#PassiveIncome", "#Savings", "#FinanceTips", "#Budget"],
    "productivity": ["#Productivity", "#LifeHacks", "#Workflow", "#Efficiency", "#TimeManagement", "#WorkSmarter"],
    "health": ["#Health", "#Wellness", "#Fitness", "#MentalHealth", "#HealthTips"],
    "entertainment": ["#Entertainment", "#Viral", "#FunFacts", "#Amazing", "#MindBlown"],
}

UNIVERSAL_TAGS = ["#Shorts", "#YouTubeShorts"]


def validate_title(title: str) -> dict:
    """타이틀 규칙 검증 (40자 이내)"""
    issues = []
    if len(title) > 40:
        issues.append(f"타이틀이 {len(title)}자 — 40자 이내로 줄여야 합니다")
    if not any(c.isupper() for c in title):
        issues.append("대문자가 없습니다 — 첫 글자 대문자 권장")

    return {
        "valid": len(issues) == 0,
        "length": len(title),
        "issues": issues,
    }


def validate_thumbnail_text(text: str) -> dict:
    """썸네일 문구 검증 (4~8자)"""
    word_count = len(text.split())
    issues = []
    if word_count < 1 or len(text) < 2:
        issues.append("썸네일 문구가 너무 짧습니다")
    if len(text) > 20:
        issues.append(f"썸네일 문구가 {len(text)}자 — 20자 이내 권장")

    return {
        "valid": len(issues) == 0,
        "char_count": len(text),
        "word_count": word_count,
        "issues": issues,
    }


def validate_description(description: str) -> dict:
    """설명 검증"""
    lines = [l for l in description.strip().split("\n") if l.strip()]
    issues = []

    if len(lines) < 2:
        issues.append("설명이 2줄 이상이어야 합니다")
    if "AI-assisted" not in description and "ai-assisted" not in description.lower():
        issues.append("'AI-assisted production' 라벨이 누락되었습니다")

    return {
        "valid": len(issues) == 0,
        "line_count": len(lines),
        "has_ai_label": "ai-assisted" in description.lower(),
        "issues": issues,
    }


def validate_hashtags(hashtags: list[str]) -> dict:
    """해시태그 검증 (10개 이내)"""
    issues = []
    if len(hashtags) > 10:
        issues.append(f"해시태그가 {len(hashtags)}개 — 10개 이내로 줄여야 합니다")
    if len(hashtags) < 3:
        issues.append("해시태그가 너무 적습니다 — 최소 3개 권장")

    invalid = [h for h in hashtags if not h.startswith("#")]
    if invalid:
        issues.append(f"# 누락: {invalid}")

    return {
        "valid": len(issues) == 0,
        "count": len(hashtags),
        "issues": issues,
    }


def generate_hashtags(niche: str, extra: list[str] = None) -> list[str]:
    """니치 기반 해시태그 자동 생성"""
    tags = []

    # 니치 태그
    pool = HASHTAG_POOLS.get(niche, HASHTAG_POOLS.get("entertainment", []))
    tags.extend(pool[:5])

    # 범용 태그
    tags.extend(UNIVERSAL_TAGS)

    # 추가 태그
    if extra:
        for tag in extra:
            if not tag.startswith("#"):
                tag = f"#{tag}"
            if tag not in tags:
                tags.append(tag)

    return tags[:10]


def validate_metadata(metadata: dict) -> dict:
    """전체 메타데이터 검증"""
    results = {
        "title": validate_title(metadata.get("title", "")),
        "thumbnail_text": validate_thumbnail_text(metadata.get("thumbnail_text", "")),
        "description": validate_description(metadata.get("description", "")),
        "hashtags": validate_hashtags(metadata.get("hashtags", [])),
    }

    all_valid = all(r["valid"] for r in results.values())
    all_issues = []
    for key, result in results.items():
        for issue in result.get("issues", []):
            all_issues.append(f"[{key}] {issue}")

    return {
        "valid": all_valid,
        "results": results,
        "issues": all_issues,
    }


def format_upload_ready(script_json: dict) -> str:
    """업로드용 메타데이터 포맷팅"""
    meta = script_json.get("metadata", {})
    tags = meta.get("hashtags", [])

    return f"""
=== UPLOAD READY ===
Title: {meta.get('title', 'N/A')}
Description:
{meta.get('description', 'N/A')}

{' '.join(tags)}

Thumbnail Text: {meta.get('thumbnail_text', 'N/A')}
===================
""".strip()


# CLI 진입점
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Metadata Validator")
    parser.add_argument("--script", type=str, help="Script JSON path to validate")
    parser.add_argument("--niche", type=str, help="Generate hashtags for niche")
    args = parser.parse_args()

    if args.script:
        with open(args.script, "r", encoding="utf-8") as f:
            script = json.load(f)
        result = validate_metadata(script.get("metadata", {}))
        print(json.dumps(result, indent=2, ensure_ascii=False))
        print()
        print(format_upload_ready(script))
    elif args.niche:
        tags = generate_hashtags(args.niche)
        print(f"Hashtags for '{args.niche}': {' '.join(tags)}")
    else:
        parser.print_help()
