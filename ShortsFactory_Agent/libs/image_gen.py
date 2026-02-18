#!/usr/bin/env python3
"""
AI 이미지 생성기 — Pollinations.ai API
YouTube Shorts 시각자료 생성용
"""

import os
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


# Pollinations.ai 설정
POLLINATIONS_BASE = "https://image.pollinations.ai/prompt"
DEFAULT_WIDTH = 768
DEFAULT_HEIGHT = 1344  # 9:16 비율 (Shorts)
DEFAULT_MODEL = "flux"  # flux, turbo, etc.


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
    """Pollinations.ai로 이미지 생성

    Args:
        prompt: 영어 이미지 프롬프트
        output_path: 저장 경로
        width: 이미지 너비 (기본 768)
        height: 이미지 높이 (기본 1344, 9:16)
        model: 모델 (flux, turbo)
        seed: 시드 (재현성)
        nologo: 워터마크 제거
        enhance: 프롬프트 자동 향상
    """
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    # URL 구성
    encoded_prompt = urllib.parse.quote(prompt)
    url = f"{POLLINATIONS_BASE}/{encoded_prompt}"

    params = {
        "width": width,
        "height": height,
        "model": model,
        "nologo": "true" if nologo else "false",
        "enhance": "true" if enhance else "false",
    }
    if seed is not None:
        params["seed"] = seed

    query_string = urllib.parse.urlencode(params)
    full_url = f"{url}?{query_string}"

    # 이미지 다운로드
    start = time.time()
    try:
        req = urllib.request.Request(full_url, headers={"User-Agent": "ShortsFactory/1.0"})
        with urllib.request.urlopen(req, timeout=60, context=_SSL_CTX) as response:
            image_data = response.read()

        with open(output_path, "wb") as f:
            f.write(image_data)

        elapsed = time.time() - start
        file_size = os.path.getsize(output_path) / 1024

        return {
            "success": True,
            "path": output_path,
            "size_kb": round(file_size, 1),
            "elapsed": round(elapsed, 1),
            "width": width,
            "height": height,
            "model": model,
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "elapsed": round(time.time() - start, 1),
        }


def generate_scene_images(
    scenes: list,
    output_dir: str,
    episode_id: str = "ep",
    width: int = DEFAULT_WIDTH,
    height: int = DEFAULT_HEIGHT,
) -> list:
    """스크립트의 scenes 배열에서 이미지 일괄 생성

    Args:
        scenes: [{"id": 1, "image_prompt": "...", ...}, ...]
        output_dir: 이미지 저장 디렉토리
        episode_id: 에피소드 ID (파일명 접두사)
    """
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

        result = generate_image(
            prompt=prompt,
            output_path=output_path,
            width=width,
            height=height,
        )

        if result["success"]:
            print(f"    완료: {result['size_kb']}KB ({result['elapsed']}초)")
        else:
            print(f"    실패: {result['error']}")

        result["scene_id"] = scene_id
        result["prompt"] = prompt[:80] + "..." if len(prompt) > 80 else prompt
        results.append(result)

        # Pollinations rate limit: 1 req / 5 sec (registered)
        if scene != scenes[-1]:
            time.sleep(5)

    return results


# CLI 진입점
if __name__ == "__main__":
    import argparse
    import json

    parser = argparse.ArgumentParser(description="AI Image Generator (Pollinations.ai)")
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
