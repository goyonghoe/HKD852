#!/usr/bin/env python3
"""
AI 이미지 생성기 — 트리플 엔진 (자동 폴백)
YouTube Shorts 시각자료 생성용

폴백 체인:
  1차: Google Gemini Nano Banana (gemini-2.5-flash-image, 최고 퀄리티)
  2차: Pollinations.ai API (flux, 무료)
  3차: HuggingFace Spaces FLUX.1-merged (무료, API키 불필요)
"""

import hashlib
import json as _json
import os
import random
import ssl
import time
import urllib.parse
import urllib.request
from pathlib import Path

# macOS Python SSL 인증서 이슈 대응
_SSL_CTX = ssl.create_default_context()
try:
    import certifi
    _SSL_CTX.load_verify_locations(certifi.where())
except ImportError:
    _SSL_CTX.check_hostname = False
    _SSL_CTX.verify_mode = ssl.CERT_NONE


# ── 설정 ──────────────────────────────────────────────────

# Pollinations.ai
POLLINATIONS_BASE = "https://image.pollinations.ai/prompt"
DEFAULT_WIDTH = 768
DEFAULT_HEIGHT = 1344  # 9:16 비율 (Shorts)
DEFAULT_MODEL = "flux"

# 재시도 (Pollinations 다운 시 빠르게 폴백하도록 1회로 축소)
POLLINATIONS_RETRIES = 1
POLLINATIONS_DELAYS = [5]
POLLINATIONS_FALLBACK_MODELS = ["flux", "turbo", "flux-realism"]

# HuggingFace Spaces (FLUX.1-merged — 무료, API키 불필요)
HF_SPACE_ID = "multimodalart/FLUX.1-merged"
HF_API_NAME = "/infer"

# Google Gemini Nano Banana (고퀄리티, 무료 API키)
GEMINI_MODEL = "gemini-2.5-flash-image"
GEMINI_MODEL_FALLBACK = "gemini-2.0-flash-exp-image-generation"
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")


# ── 프롬프트 해시 기반 로컬 캐시 ─────────────────────────
CACHE_DIR = Path(__file__).parent.parent / "pipeline" / "images" / "_cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)
CACHE_INDEX = CACHE_DIR / "index.json"


def _prompt_hash(prompt: str, width: int, height: int) -> str:
    """프롬프트+해상도 → SHA-256 해시 (앞 16자)"""
    key = f"{prompt}|{width}x{height}"
    return hashlib.sha256(key.encode()).hexdigest()[:16]


def _cache_lookup(prompt: str, width: int, height: int, output_path: str) -> dict | None:
    """캐시에 동일 프롬프트 이미지가 있으면 복사 후 결과 반환."""
    import shutil
    h = _prompt_hash(prompt, width, height)
    cached_file = CACHE_DIR / f"{h}.png"
    if cached_file.exists():
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(str(cached_file), output_path)
        size_kb = round(os.path.getsize(output_path) / 1024, 1)
        return {
            "success": True, "path": output_path,
            "size_kb": size_kb, "elapsed": 0.0,
            "width": width, "height": height,
            "model": "cache", "engine": "local_cache",
        }
    return None


def _cache_store(prompt: str, width: int, height: int, source_path: str):
    """생성된 이미지를 캐시에 저장."""
    import shutil
    h = _prompt_hash(prompt, width, height)
    cached_file = CACHE_DIR / f"{h}.png"
    if not cached_file.exists():
        shutil.copy2(source_path, str(cached_file))


# ── Pollinations 엔진 ────────────────────────────────────

def _pollinations_generate(
    prompt: str,
    output_path: str,
    width: int,
    height: int,
    model: str = DEFAULT_MODEL,
    seed: int = None,
) -> dict:
    """Pollinations.ai로 이미지 생성 (3회 재시도 + 모델 폴백)."""
    models_to_try = [model] + [m for m in POLLINATIONS_FALLBACK_MODELS if m != model]
    start = time.time()
    last_error = None

    for attempt in range(POLLINATIONS_RETRIES):
        try_model = models_to_try[min(attempt, len(models_to_try) - 1)]
        try_seed = seed if attempt < 2 else (seed or random.randint(1, 999999))

        encoded_prompt = urllib.parse.quote(prompt)
        params = {
            "width": width, "height": height,
            "model": try_model,
            "nologo": "true", "enhance": "true",
        }
        if try_seed is not None:
            params["seed"] = try_seed

        full_url = f"{POLLINATIONS_BASE}/{encoded_prompt}?{urllib.parse.urlencode(params)}"

        try:
            req = urllib.request.Request(full_url, headers={"User-Agent": "ShortsFactory/1.0"})
            with urllib.request.urlopen(req, timeout=60, context=_SSL_CTX) as response:
                data = response.read()

            with open(output_path, "wb") as f:
                f.write(data)

            elapsed = time.time() - start
            if attempt > 0:
                print(f"        Pollinations 재시도 {attempt+1}회 성공 (model={try_model})")

            return {
                "success": True, "path": output_path,
                "size_kb": round(os.path.getsize(output_path) / 1024, 1),
                "elapsed": round(elapsed, 1),
                "width": width, "height": height,
                "model": try_model, "engine": "pollinations",
            }
        except Exception as e:
            last_error = str(e)
            if attempt < POLLINATIONS_RETRIES - 1:
                delay = POLLINATIONS_DELAYS[attempt]
                next_model = models_to_try[min(attempt + 1, len(models_to_try) - 1)]
                print(f"        Pollinations 시도 {attempt+1} 실패 → {delay}초 후 재시도 (model={next_model})")
                time.sleep(delay)

    return {"success": False, "error": last_error}


# ── HuggingFace Spaces 엔진 ──────────────────────────────

_hf_client = None  # 싱글톤 (연결 재사용)


def _hf_spaces_generate(
    prompt: str,
    output_path: str,
    width: int = DEFAULT_WIDTH,
    height: int = DEFAULT_HEIGHT,
) -> dict:
    """HuggingFace Spaces FLUX.1-merged로 이미지 생성 (무료, API키 불필요)."""
    global _hf_client

    try:
        from gradio_client import Client
    except ImportError:
        return {"success": False, "error": "gradio_client 미설치"}

    start = time.time()

    try:
        if _hf_client is None:
            print(f"        HF Spaces 연결 중 ({HF_SPACE_ID})...")
            _hf_client = Client(HF_SPACE_ID)

        result = _hf_client.predict(
            prompt=prompt,
            seed=0,
            randomize_seed=True,
            width=width,
            height=height,
            guidance_scale=3.5,
            num_inference_steps=8,
            api_name=HF_API_NAME,
        )

        # result = (image_path, seed) 튜플
        img_path = result[0] if isinstance(result, (tuple, list)) else result

        # webp/jpg → png 변환 후 저장
        from PIL import Image
        img = Image.open(img_path).convert("RGB")
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        img.save(output_path)

        elapsed = time.time() - start
        return {
            "success": True, "path": output_path,
            "size_kb": round(os.path.getsize(output_path) / 1024, 1),
            "elapsed": round(elapsed, 1),
            "width": img.size[0], "height": img.size[1],
            "model": "FLUX.1-merged", "engine": "hf_spaces",
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"HF Spaces: {e}",
            "elapsed": round(time.time() - start, 1),
        }


# ── Google Gemini 엔진 ────────────────────────────────────

def _gemini_generate(
    prompt: str,
    output_path: str,
    width: int = DEFAULT_WIDTH,
    height: int = DEFAULT_HEIGHT,
) -> dict:
    """Google Gemini Nano Banana로 이미지 생성 + 9:16 리사이즈.

    1차: gemini-2.5-flash-image (Nano Banana, 고퀄리티)
    2차: gemini-2.0-flash-exp-image-generation (레거시 폴백)
    """
    api_key = GEMINI_API_KEY
    if not api_key:
        return {"success": False, "error": "GEMINI_API_KEY 미설정"}

    try:
        from google import genai
        from google.genai import types
        from PIL import Image
    except ImportError as ie:
        return {"success": False, "error": f"패키지 미설치: {ie}"}

    start = time.time()
    models_to_try = [GEMINI_MODEL, GEMINI_MODEL_FALLBACK]

    gen_prompt = (
        "Generate a vertical portrait-oriented image (9:16 aspect ratio). "
        "IMPORTANT: Do NOT include any text, letters, numbers, words, labels, "
        "captions, watermarks, or UI elements in the image. Pure visual only. "
        f"Scene: {prompt}"
    )

    for model_id in models_to_try:
        try:
            client = genai.Client(api_key=api_key)

            response = client.models.generate_content(
                model=model_id,
                contents=gen_prompt,
                config=types.GenerateContentConfig(
                    response_modalities=["TEXT", "IMAGE"],
                ),
            )

            img_data = None
            for part in response.candidates[0].content.parts:
                if hasattr(part, "inline_data") and part.inline_data:
                    img_data = part.inline_data.data
                    break

            if not img_data:
                print(f"        Gemini ({model_id}): 이미지 미반환, 다음 모델 시도")
                continue

            # PIL 로드 → 9:16 center-crop → 리사이즈
            import io
            img = Image.open(io.BytesIO(img_data)).convert("RGB")
            img = _crop_to_ratio(img, width, height)
            img = img.resize((width, height), Image.LANCZOS)

            Path(output_path).parent.mkdir(parents=True, exist_ok=True)
            img.save(output_path, quality=95)

            elapsed = time.time() - start
            return {
                "success": True, "path": output_path,
                "size_kb": round(os.path.getsize(output_path) / 1024, 1),
                "elapsed": round(elapsed, 1),
                "width": width, "height": height,
                "model": model_id, "engine": "gemini",
            }
        except Exception as e:
            print(f"        Gemini ({model_id}) 실패: {e}")
            continue

    return {
        "success": False,
        "error": f"Gemini 전체 실패 (시도: {', '.join(models_to_try)})",
        "elapsed": round(time.time() - start, 1),
    }


def _crop_to_ratio(img, target_w: int, target_h: int):
    """이미지를 목표 비율로 center-crop."""
    from PIL import Image
    src_w, src_h = img.size
    target_ratio = target_w / target_h
    src_ratio = src_w / src_h

    if src_ratio > target_ratio:
        # 소스가 더 넓음 → 좌우 크롭
        new_w = int(src_h * target_ratio)
        left = (src_w - new_w) // 2
        img = img.crop((left, 0, left + new_w, src_h))
    elif src_ratio < target_ratio:
        # 소스가 더 좁음 → 상하 크롭
        new_h = int(src_w / target_ratio)
        top = (src_h - new_h) // 2
        img = img.crop((0, top, src_w, top + new_h))
    return img


# ── 통합 generate_image ─────────────────────────────────

def generate_image(
    prompt: str,
    output_path: str,
    width: int = DEFAULT_WIDTH,
    height: int = DEFAULT_HEIGHT,
    model: str = DEFAULT_MODEL,
    seed: int = None,
    nologo: bool = True,
    enhance: bool = True,
) -> dict:
    """이미지 생성 (캐시 → Gemini Nano Banana → Pollinations → HF Spaces 자동 폴백)"""
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    # 0차: 로컬 캐시 조회
    cached = _cache_lookup(prompt, width, height, output_path)
    if cached:
        return cached

    errors = {}

    # 1차: Google Gemini Nano Banana (최고 퀄리티)
    result = _gemini_generate(prompt, output_path, width, height)
    if result.get("success"):
        _cache_store(prompt, width, height, output_path)
        return result
    errors["gemini"] = result.get("error", "?")

    # 2차: Pollinations.ai
    print(f"        Gemini 실패 ({errors['gemini']}) → Pollinations 폴백")
    result = _pollinations_generate(prompt, output_path, width, height, model, seed)
    if result.get("success"):
        _cache_store(prompt, width, height, output_path)
        return result
    errors["pollinations"] = result.get("error", "?")

    # 3차: HuggingFace Spaces FLUX
    print(f"        Pollinations 실패 ({errors['pollinations']}) → HF Spaces 폴백")
    result = _hf_spaces_generate(prompt, output_path, width, height)
    if result.get("success"):
        _cache_store(prompt, width, height, output_path)
        return result
    errors["hf_spaces"] = result.get("error", "?")

    return {
        "success": False,
        "error": f"전체 실패 — Gemini: {errors['gemini']}, Poll: {errors['pollinations']}, HF: {errors['hf_spaces']}",
        "elapsed": result.get("elapsed", 0),
    }


# ── 배치 생성 함수 ──────────────────────────────────────

def generate_scene_images(
    scenes: list,
    output_dir: str,
    episode_id: str = "ep",
    width: int = DEFAULT_WIDTH,
    height: int = DEFAULT_HEIGHT,
) -> list:
    """스크립트의 scenes 배열에서 이미지 일괄 생성"""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    results = []

    for scene in scenes:
        scene_id = scene.get("id", len(results) + 1)
        prompt = scene.get("image_prompt", "")
        if not prompt:
            continue

        output_path = str(output_dir / f"{episode_id}_scene{scene_id:02d}.png")
        print(f"  [Scene {scene_id}] 생성 중...")

        result = generate_image(prompt=prompt, output_path=output_path, width=width, height=height)

        if result["success"]:
            engine = result.get("engine", "?")
            print(f"    완료: {result['size_kb']}KB ({result['elapsed']}초) [{engine}]")
        else:
            print(f"    실패: {result['error']}")

        result["scene_id"] = scene_id
        result["prompt"] = prompt[:80] + "..." if len(prompt) > 80 else prompt
        results.append(result)

        # Gemini 1순위이므로 rate limit 최소화 (1초)
        if scene != scenes[-1]:
            time.sleep(1)

    return results


def generate_mood_images(
    scenes: list,
    output_dir: str,
    episode_id: str,
    mood_key: str,
    image_prompt_prefix: str,
    width: int = DEFAULT_WIDTH,
    height: int = DEFAULT_HEIGHT,
) -> list:
    """무드별 이미지 일괄 생성 — 원본 프롬프트 앞에 스타일 프리픽스 결합."""
    from concurrent.futures import ThreadPoolExecutor, as_completed

    mood_dir = Path(output_dir) / mood_key
    mood_dir.mkdir(parents=True, exist_ok=True)

    # 작업 목록 준비
    tasks = []
    for scene in scenes:
        scene_id = scene.get("id", len(tasks) + 1)
        original_prompt = scene.get("image_prompt", "")
        if not original_prompt:
            continue
        mood_prompt = image_prompt_prefix + original_prompt
        output_path = str(mood_dir / f"{episode_id}_scene{scene_id:02d}.png")
        tasks.append((scene_id, mood_prompt, output_path))

    print(f"  [{mood_key}] 이미지 병렬 생성 시작 ({len(tasks)}장, max_workers=3)...")

    results = [None] * len(tasks)

    def _gen_one(idx, scene_id, prompt, out_path):
        """단일 이미지 생성 (ThreadPool 워커)"""
        r = generate_image(prompt=prompt, output_path=out_path, width=width, height=height)
        r["scene_id"] = scene_id
        r["mood_key"] = mood_key
        return idx, r

    # 최대 3개 동시 생성 (API rate limit 고려)
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = []
        for i, (sid, prompt, out_path) in enumerate(tasks):
            f = executor.submit(_gen_one, i, sid, prompt, out_path)
            futures.append(f)
            time.sleep(1)  # API rate limit: 1초 간격 제출

        for future in as_completed(futures):
            idx, r = future.result()
            results[idx] = r
            sid = r.get("scene_id", "?")
            if r.get("success"):
                engine = r.get("engine", "?")
                print(f"    [Scene {sid}] 완료: {r['size_kb']}KB ({r['elapsed']}초) [{engine}]")
            else:
                print(f"    [Scene {sid}] 실패: {r.get('error', '?')}")

    results = [r for r in results if r is not None]
    success = sum(1 for r in results if r["success"])
    print(f"  [{mood_key}] 완료: {success}/{len(results)}장")
    return results


# CLI 진입점
if __name__ == "__main__":
    import argparse
    import json

    parser = argparse.ArgumentParser(description="AI Image Generator (Pollinations + HF Spaces + Gemini)")
    parser.add_argument("--prompt", type=str, help="Image prompt")
    parser.add_argument("--script", type=str, help="Script JSON with scenes")
    parser.add_argument("--output", type=str, default="output.png")
    parser.add_argument("--output-dir", type=str, default="images")
    parser.add_argument("--width", type=int, default=DEFAULT_WIDTH)
    parser.add_argument("--height", type=int, default=DEFAULT_HEIGHT)
    args = parser.parse_args()

    if args.script:
        with open(args.script, "r", encoding="utf-8") as f:
            script = json.load(f)
        scenes = script.get("scenes", [])
        episode_id = script.get("episode_id", "ep")
        print(f"Generating {len(scenes)} scene images for {episode_id}...")
        results = generate_scene_images(scenes, args.output_dir, episode_id, args.width, args.height)
        success = sum(1 for r in results if r["success"])
        print(f"\n완료: {success}/{len(results)} images generated")
    elif args.prompt:
        result = generate_image(args.prompt, args.output, args.width, args.height)
        print(json.dumps(result, indent=2))
    else:
        parser.print_help()
