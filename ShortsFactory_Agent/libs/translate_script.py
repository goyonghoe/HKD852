#!/usr/bin/env python3
"""
translate_script.py — 논문 쇼츠 스크립트 KO→EN/JA 번역기

한국어 paper_ep JSON을 영어/일본어 버전으로 번역합니다.
claude CLI를 사용하여 번역합니다 (추가 API 키 불필요).

Usage:
    python3 translate_script.py pipeline/scripts/paper_ep018.json
    python3 translate_script.py pipeline/scripts/paper_ep018.json --lang en
    python3 translate_script.py pipeline/scripts/paper_ep018.json --lang ja
    python3 translate_script.py pipeline/scripts/paper_ep018.json --lang all
"""

import argparse
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent.resolve()
AGENT_DIR = SCRIPT_DIR.parent
LANG_CONFIG_PATH = AGENT_DIR / "templates" / "lang_config.json"

# 번역은 Sonnet이 비용 대비 품질 최적 (Opus 대비 78% 절감, 품질 차이 미미)
DEFAULT_MODEL = "sonnet"
MAX_RETRIES = 2

# 지원 언어 (확장 시 여기에 추가)
SUPPORTED_LANGS = {
    "en": "English",
    "ja": "Japanese",
}


def load_lang_config():
    """언어별 설정을 로드합니다."""
    if not LANG_CONFIG_PATH.exists():
        raise FileNotFoundError(f"lang_config.json이 없습니다: {LANG_CONFIG_PATH}")
    with open(LANG_CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _strip_code_fences(text: str) -> str:
    """마크다운 코드펜스를 제거합니다."""
    cleaned = text.strip()
    cleaned = re.sub(r'^```\w*\n?', '', cleaned)
    cleaned = re.sub(r'\n?```\s*$', '', cleaned)
    return cleaned.strip()


def _validate_translation(translated: dict, expected_scene_count: int, expected_body_count: int):
    """번역 결과의 스키마를 검증합니다. (C-2, H-5, H-6 fix)"""
    required_keys = ["hook", "body", "closer", "scene_texts", "title", "description", "hashtags", "thumbnail_text"]

    # 필수 키 검증
    missing = [k for k in required_keys if k not in translated]
    if missing:
        raise ValueError(f"번역 결과에 필수 키 누락: {missing}")

    # 타입 검증
    if not isinstance(translated["body"], list):
        raise TypeError(f"body는 list여야 합니다 (실제: {type(translated['body']).__name__})")
    if not isinstance(translated["scene_texts"], list):
        raise TypeError(f"scene_texts는 list여야 합니다 (실제: {type(translated['scene_texts']).__name__})")
    if not isinstance(translated["hashtags"], list):
        raise TypeError(f"hashtags는 list여야 합니다 (실제: {type(translated['hashtags']).__name__})")

    # 씬 수 일치 검증 (H-5: hard fail)
    actual_scenes = len(translated["scene_texts"])
    if actual_scenes != expected_scene_count:
        raise ValueError(
            f"scene_texts 개수 불일치: 원본 {expected_scene_count}개, 번역 {actual_scenes}개. "
            f"혼합 언어 영상 방지를 위해 중단합니다."
        )

    # body 개수 검증
    actual_body = len(translated["body"])
    if actual_body != expected_body_count:
        raise ValueError(
            f"body 개수 불일치: 원본 {expected_body_count}개, 번역 {actual_body}개."
        )

    # 빈 문자열 검증
    if not translated["hook"].strip():
        raise ValueError("hook이 빈 문자열입니다.")
    if not translated["closer"].strip():
        raise ValueError("closer가 빈 문자열입니다.")


def call_claude_translate(ko_script_json: dict, target_lang: str, lang_config: dict, model=DEFAULT_MODEL) -> dict:
    """claude CLI로 논문 스크립트를 번역합니다."""
    lang_name = SUPPORTED_LANGS.get(target_lang, target_lang)
    tone_guide = lang_config.get(target_lang, {}).get("tone_guide", "")
    series_name = lang_config.get(target_lang, {}).get("series_name", "")

    # 번역할 텍스트 추출
    script = ko_script_json["script"]
    scenes = ko_script_json["scenes"]
    metadata = ko_script_json["metadata"]

    body_count = len(script["body"])
    scene_count = len(scenes)

    translate_payload = {
        "hook": script["hook"],
        "body": script["body"],
        "closer": script["closer"],
        "scene_texts": [s["text"] for s in scenes],
        "title": metadata["title"],
        "description": metadata["description"],
        "hashtags": metadata.get("hashtags", []),
        "thumbnail_text": metadata.get("thumbnail_text", ""),
    }

    # H-7 fix: 반환각 방지 프롬프트 강화
    prompt = f"""You are a professional Korean-to-{lang_name} translator specializing in science communication for YouTube Shorts.

CONTEXT:
- This is a 30-second YouTube Short script summarizing an academic paper
- Series name: "{series_name}"
- Target audience: Young adults (20-35) interested in science
- Tone: {tone_guide}

CRITICAL RULES:
1. Translate FAITHFULLY. Do NOT add claims, statistics, adjectives, or context not in the original Korean text.
2. Do NOT embellish, explain, or expand beyond what is written. Translate ONLY what is there.
3. Keep translations concise — this is for 30-second video narration.
4. Preserve ALL numbers and statistics EXACTLY as digits (e.g., 구천 → 9,000 / 51퍼센트 → 51%).
5. Do NOT translate proper nouns (journal names, institution names).
6. Title must include the series hashtag (#{series_name}).
7. Description: keep the paper citation section (DOI, journal, authors) in English.
8. Hashtags: keep #{series_name} and #Shorts, add 3-4 topic-relevant tags in {lang_name}.
9. body array MUST have exactly {body_count} elements.
10. scene_texts array MUST have exactly {scene_count} elements.

INPUT (Korean):
{json.dumps(translate_payload, ensure_ascii=False, indent=2)}

OUTPUT FORMAT:
Return ONLY a valid JSON object with these exact keys:
{{
  "hook": "translated hook",
  "body": ["line 1", "line 2", ...],
  "closer": "translated closer",
  "scene_texts": ["scene 1", "scene 2", ...],
  "title": "translated title",
  "description": "translated description",
  "hashtags": ["#tag1", "#tag2", ...],
  "thumbnail_text": "2-4 words"
}}

IMPORTANT: body must have exactly {body_count} elements. scene_texts must have exactly {scene_count} elements.
No markdown, no explanation, no code fences — just the raw JSON object."""

    # S-03 fix: 프롬프트를 stdin으로 전달 (프로세스 테이블 노출 방지 + ARG_MAX 회피)
    cmd = ["claude", "-p", "--model", model, "--output-format", "json"]
    result = subprocess.run(cmd, input=prompt, capture_output=True, text=True, timeout=180)

    if result.returncode != 0:
        raise RuntimeError(f"claude CLI 실행 실패: {result.stderr[:200]}")

    # 응답 파싱
    outer = json.loads(result.stdout)
    raw_result = outer.get("result")
    if not raw_result:
        raise ValueError("Claude 응답에 'result' 키가 없거나 비어있습니다.")

    cleaned = _strip_code_fences(raw_result)
    translated = json.loads(cleaned)

    # C-2, H-5, H-6 fix: 스키마 검증
    _validate_translation(translated, scene_count, body_count)

    return translated


def translate_with_retry(ko_script: dict, target_lang: str, lang_config: dict, model=DEFAULT_MODEL) -> dict:
    """재시도 로직이 포함된 번역입니다."""
    for attempt in range(MAX_RETRIES + 1):
        try:
            return call_claude_translate(ko_script, target_lang, lang_config, model)
        except subprocess.TimeoutExpired:
            if attempt < MAX_RETRIES:
                wait = 3 * (attempt + 1)  # 지수 백오프: 3s, 6s
                print(f"  타임아웃 — {wait}초 후 재시도 ({attempt + 1}/{MAX_RETRIES})")
                time.sleep(wait)
            else:
                raise RuntimeError("번역 타임아웃 (최종)")
        except (json.JSONDecodeError, ValueError, TypeError) as e:
            if attempt < MAX_RETRIES:
                wait = 3 * (attempt + 1)
                print(f"  파싱/검증 오류 — {wait}초 후 재시도 ({attempt + 1}/{MAX_RETRIES}): {e}")
                time.sleep(wait)
            else:
                raise RuntimeError(f"번역 파싱 실패 (최종): {e}")
        except Exception as e:
            # FileNotFoundError, PermissionError 등은 재시도 불필요
            raise


def build_translated_script(ko_script: dict, translated: dict, target_lang: str, lang_config: dict) -> dict:
    """번역 결과를 원본 구조에 맞게 조립합니다."""
    lc = lang_config.get(target_lang, {})
    ep_id = ko_script["episode_id"]

    # 씬 조립: image_prompt 제거, image_ref로 공유 이미지 참조
    translated_scenes = []
    for i, scene in enumerate(ko_script["scenes"]):
        sid = scene["id"]
        new_scene = {
            "id": sid,
            "text": translated["scene_texts"][i],
            "image_prompt": None,
            "image_ref": f"pipeline/images/manga/{ep_id}_scene{sid:02d}.png",
            "duration_hint": scene.get("duration_hint", "body"),
        }
        translated_scenes.append(new_scene)

    # full_text / display_text 재조립
    all_texts = [translated["hook"]] + translated["body"] + [translated["closer"]]
    full_text = " ".join(all_texts)

    # YouTube 메타데이터 조립
    ko_youtube = ko_script.get("metadata", {}).get("youtube", {})
    youtube_meta = {
        "title": translated["title"],
        "description": translated["description"],
        "tags": [h.lstrip("#") for h in translated["hashtags"]],
        "category_id": ko_youtube.get("category_id", "27"),
        "privacy_status": "private",
        "language": target_lang,
        "made_for_kids": ko_youtube.get("made_for_kids", False),
    }

    output = {
        "episode_id": ep_id,
        "series": lc.get("series_name", ko_script.get("series", "")),
        "topic_id": ko_script.get("topic_id", ""),
        "language": target_lang,
        "source_language": "ko",
        "paper_source": ko_script.get("paper_source", {}),
        "paper_source_lang": "ko",
        "visual_style": ko_script.get("visual_style", ""),
        "script": {
            "hook": translated["hook"],
            "body": translated["body"],
            "closer": translated["closer"],
            "cta": "",
        },
        "full_text": full_text,
        "display_text": full_text,
        "scenes": translated_scenes,
        "metadata": {
            "title": translated["title"],
            "thumbnail_text": translated.get("thumbnail_text", ""),
            "description": translated["description"],
            "hashtags": translated["hashtags"],
            "youtube": youtube_meta,
        },
        "render_config": {
            "voice_preset": lc.get("voice_preset", "en-narrator"),
            "ref_audio": lc.get("ref_audio", ""),
            "speed": lc.get("speed", 1.0),
            "format": lc.get("format", "dark-bg-text"),
            "font_size": lc.get("font_size", 48),
        },
        "quality_check": {
            "source": "ko",
            "needs_recheck": True,
            "note": "KO 원본 기준 점수. 번역본은 별도 검증 필요.",
        },
    }

    return output


def _atomic_write_json(path: Path, data: dict):
    """H-8 fix: crash-safe 파일 쓰기 (tmp → rename)."""
    tmp_path = path.with_suffix(".json.tmp")
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(str(tmp_path), str(path))


def translate_script(script_path: str, target_langs: list[str], model=DEFAULT_MODEL) -> list[str]:
    """메인 번역 함수. 번역된 파일 경로 리스트를 반환합니다."""
    script_path = Path(script_path)
    if not script_path.exists():
        raise FileNotFoundError(f"스크립트 파일을 찾을 수 없습니다: {script_path}")

    with open(script_path, "r", encoding="utf-8") as f:
        ko_script = json.load(f)

    if ko_script.get("language", "ko") != "ko":
        print(f"Warning: 원본이 한국어가 아닙니다 (language={ko_script.get('language')})")

    lang_config = load_lang_config()
    output_paths = []

    for lang in target_langs:
        if lang == "ko":
            continue
        if lang not in SUPPORTED_LANGS:
            print(f"[SKIP] 지원하지 않는 언어: {lang}")
            continue

        print(f"\n{'='*50}")
        print(f"  번역 시작: {ko_script['episode_id']} → {lang.upper()}")
        print(f"  모델: {model}")
        print(f"{'='*50}")

        # 번역 실행
        start = time.time()
        translated = translate_with_retry(ko_script, lang, lang_config, model)
        elapsed = time.time() - start
        print(f"  번역 완료 ({elapsed:.1f}s)")

        # 결과 조립
        output = build_translated_script(ko_script, translated, lang, lang_config)

        # H-8 fix: atomic write
        out_name = f"{ko_script['episode_id']}_{lang}.json"
        out_path = script_path.parent / out_name
        _atomic_write_json(out_path, output)
        print(f"  저장: {out_path}")
        output_paths.append(str(out_path))

    return output_paths


def main():
    parser = argparse.ArgumentParser(description="논문 쇼츠 스크립트 KO→EN/JA 번역기")
    parser.add_argument("script", help="번역할 한국어 스크립트 JSON 경로")
    parser.add_argument("--lang", default="all", choices=["en", "ja", "all"],
                        help="번역 대상 언어 (default: all)")
    parser.add_argument("--model", default=DEFAULT_MODEL,
                        choices=["opus", "sonnet", "haiku"],
                        help=f"번역 모델 (default: {DEFAULT_MODEL})")

    args = parser.parse_args()

    if args.lang == "all":
        target_langs = ["en", "ja"]
    else:
        target_langs = [args.lang]

    try:
        paths = translate_script(args.script, target_langs, args.model)
    except (FileNotFoundError, RuntimeError) as e:
        print(f"\n[ERROR] {e}")
        sys.exit(1)

    print(f"\n{'='*50}")
    print(f"  번역 완료: {len(paths)}개 파일 생성")
    for p in paths:
        print(f"    → {p}")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
