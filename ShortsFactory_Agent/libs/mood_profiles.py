#!/usr/bin/env python3
"""
렌더 스타일 프로파일 — 만화 스타일 통합

v2: 3-Mood(같은 이야기×3무드) → 3-Script(다른 이야기×1스타일)
일본/한국 만화 스타일, 인물 표정 집중.
"""

# ── 기본 렌더 스타일 (모든 에피소드 공통) ──────────────────
RENDER_STYLE = {
    "image_prompt_prefix": (
        "Japanese anime manga style illustration, "
        "expressive character close-up with detailed facial expression, "
        "showing strong emotion, vibrant colors, clean bold line art, "
        "dramatic cinematic lighting, Korean webtoon influence, "
        "no text no numbers no letters no words, "
    ),
    "voice_preset": "whatif-female",
    "speed": 1.0,
    "format": "dark-bg-text",
    "font_size": 52,
    "depthflow_preset": {"name": "orbital", "intensity": 0.3},
    "target": "18-35세, 과학/호기심/엔터테인먼트",
}


# ── 레거시 호환: MOOD_PROFILES / MOOD_KEYS ────────────────
# render_samples.py가 아직 참조하므로 유지 (단일 manga 스타일)
MOOD_PROFILES = {
    "manga": {
        "label": "Manga Style",
        "image_prompt_prefix": RENDER_STYLE["image_prompt_prefix"],
        "voice_preset": RENDER_STYLE["voice_preset"],
        "speed": RENDER_STYLE["speed"],
        "format": RENDER_STYLE["format"],
        "font_size": RENDER_STYLE["font_size"],
        "depthflow_preset": RENDER_STYLE["depthflow_preset"],
        "target": RENDER_STYLE["target"],
    },
}

MOOD_KEYS = list(MOOD_PROFILES.keys())
