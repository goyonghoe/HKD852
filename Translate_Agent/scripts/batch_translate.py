#!/usr/bin/env python3
"""
SSBL-Localization.xlsx 번역 스크립트
Menu, ItemName 시트의 미번역 행을 claude CLI로 번역합니다.
"""

import json
import subprocess
import sys
import time
import re
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent.resolve()
AGENT_DIR = SCRIPT_DIR.parent
OUTPUT_DIR = AGENT_DIR / "outputs"

BATCH_SIZE = 40
MODEL = "haiku"
MAX_RETRIES = 2


def call_claude_translate(korean_texts, context_info="game UI text"):
    """claude CLI로 번역 배치를 실행합니다."""
    numbered = "\n".join(f"{i+1}. {t}" for i, t in enumerate(korean_texts))
    prompt = f"""You are a professional Korean-English-Japanese game UI translator for a K-pop rhythm game (SuperStar-style).

RULES:
1. Keep translations SHORT and natural for game UI display.
2. Preserve all {{curly_brace_parameters}} exactly as-is — do NOT translate or modify them.
3. Preserve all formatting like \\n, <color=...>, quotes, etc.
4. Song titles in Korean (e.g. 맨날, 비상사태, 차차차) should stay as-is in ALL languages (they are proper nouns).
5. For English: use concise game UI language. For Japanese: use standard polite game UI Japanese.
6. Translate the MEANING, not word-by-word. Game UI should feel native in each language.

Return ONLY a valid JSON array. Each element must have exactly these keys: "idx", "english", "japanese".
The "idx" is the 1-based number from the list below.
No markdown, no explanation, no code fences — just the raw JSON array.

Korean texts ({context_info}):
{numbered}"""

    cmd = ["claude", "-p", "--model", MODEL, "--output-format", "json", prompt]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)

    if result.returncode != 0:
        raise RuntimeError(f"claude CLI failed: {result.stderr[:500]}")

    outer = json.loads(result.stdout)
    raw_result = outer.get("result", "")

    # Strip markdown code fences
    cleaned = raw_result.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        cleaned = "\n".join(lines)

    return json.loads(cleaned)


def translate_batch_with_retry(texts, context_info="game UI text"):
    """재시도 포함 배치 번역."""
    for attempt in range(MAX_RETRIES + 1):
        try:
            results = call_claude_translate(texts, context_info)
            # idx 기반으로 정렬하여 반환
            result_map = {}
            for r in results:
                idx = r.get("idx", 0) - 1
                result_map[idx] = r

            ordered = []
            for i in range(len(texts)):
                if i in result_map:
                    ordered.append(result_map[i])
                else:
                    ordered.append({"idx": i+1, "english": "[FAILED]", "japanese": "[FAILED]"})
            return ordered
        except Exception as e:
            if attempt < MAX_RETRIES:
                print(f"    재시도 {attempt+1}/{MAX_RETRIES}...")
                time.sleep(3)
            else:
                print(f"    번역 실패: {e}")
                return [{"idx": i+1, "english": "[FAILED]", "japanese": "[FAILED]"} for i in range(len(texts))]


def is_song_title_row(key):
    """노래 제목 관련 키인지 판단."""
    song_prefixes = ["Album_", "Music_", "Song_"]
    return any(key.startswith(p) for p in song_prefixes)


def is_pure_korean_song_title(ko_text, key):
    """순수 한국어 노래 제목인지 판단 (번역 대상에서 제외)."""
    if not is_song_title_row(key):
        return False
    # 한글만 있거나, 한글 + 영문 제목 혼합인 경우
    # 괄호 안에 영문이 있는 경우도 노래 제목
    has_korean = any('\uac00' <= c <= '\ud7a3' for c in ko_text)
    return has_korean


def process_sheet(json_path, sheet_name):
    """JSON 파일에서 항목을 읽어 번역합니다."""
    with open(json_path, "r", encoding="utf-8") as f:
        items = json.load(f)

    print(f"\n{'='*60}")
    print(f"  {sheet_name} 시트 번역 시작 ({len(items)}개 항목)")
    print(f"{'='*60}")

    # 번역 불필요 항목 필터링
    to_translate = []
    skipped = []
    for item in items:
        ko = item["ko"]
        key = item.get("key", "")

        # 순수 영문/숫자는 그대로 유지
        if not any('\uac00' <= c <= '\ud7a3' for c in ko):
            skipped.append(item)
            continue

        # 노래 제목은 한글 그대로 유지
        if is_pure_korean_song_title(ko, key):
            skipped.append(item)
            continue

        to_translate.append(item)

    print(f"  번역 대상: {len(to_translate)}개")
    print(f"  스킵 (노래제목/영문): {len(skipped)}개")

    # 스킵된 항목은 ko 그대로 복사
    results = {}
    for item in skipped:
        results[item["row"]] = {
            "english": item["ko"],
            "japanese": item["ko"],
            "skipped": True
        }

    # 배치 번역
    total = len(to_translate)
    for i in range(0, total, BATCH_SIZE):
        batch = to_translate[i:i + BATCH_SIZE]
        batch_texts = [item["ko"] for item in batch]
        batch_num = i // BATCH_SIZE + 1
        total_batches = (total + BATCH_SIZE - 1) // BATCH_SIZE

        print(f"\n  배치 {batch_num}/{total_batches} ({len(batch)}개)...")

        translations = translate_batch_with_retry(batch_texts, f"{sheet_name} game UI")

        for item, trans in zip(batch, translations):
            results[item["row"]] = {
                "english": trans.get("english", "[FAILED]"),
                "japanese": trans.get("japanese", "[FAILED]"),
                "skipped": False
            }

        if i + BATCH_SIZE < total:
            time.sleep(1)

    # 결과 저장
    output_path = OUTPUT_DIR / f"{sheet_name}_translations.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    translated_count = sum(1 for v in results.values() if not v.get("skipped"))
    skipped_count = sum(1 for v in results.values() if v.get("skipped"))
    failed_count = sum(1 for v in results.values() if "[FAILED]" in v.get("english", ""))

    print(f"\n  완료: 번역 {translated_count}개, 스킵 {skipped_count}개, 실패 {failed_count}개")
    print(f"  저장: {output_path}")
    return results


if __name__ == "__main__":
    sheet = sys.argv[1] if len(sys.argv) > 1 else "Menu"
    json_path = OUTPUT_DIR / f"{sheet}_to_translate.json"

    if not json_path.exists():
        print(f"Error: {json_path} not found")
        sys.exit(1)

    process_sheet(json_path, sheet)
