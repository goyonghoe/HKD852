#!/usr/bin/env python3
"""
배치 렌더링 오케스트레이터 — 서로 다른 에피소드를 일괄 렌더링

v2: 3-Mood(같은 이야기×3무드) → 배치(다른 이야기×만화 스타일)

사용법:
    # 단일 스크립트
    python render_samples.py --script ../pipeline/scripts/whatif_ep010.json

    # 다중 스크립트 (쉼표 구분)
    python render_samples.py --scripts ../pipeline/scripts/whatif_ep010.json,../pipeline/scripts/whatif_ep011.json,../pipeline/scripts/whatif_ep012.json

    # 이미지 재사용
    python render_samples.py --scripts ... --skip-images
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from mood_profiles import RENDER_STYLE
from image_gen import generate_mood_images
from video_composer import render_video

# 디렉토리 설정
AGENT_DIR = Path(__file__).parent.parent
PIPELINE_DIR = AGENT_DIR / "pipeline"
SAMPLES_DIR = PIPELINE_DIR / "rendered" / "samples"
IMAGE_DIR = PIPELINE_DIR / "images"


def render_episode(
    script_path: str,
    skip_images: bool = False,
    style: dict = None,
) -> dict:
    """단일 에피소드를 만화 스타일로 렌더링.

    Args:
        script_path: 스크립트 JSON 경로
        skip_images: True면 이미지 생성 건너뜀 (기존 이미지 재사용)
        style: 렌더 스타일 오버라이드 (기본: RENDER_STYLE)

    Returns:
        {"success": bool, "episode_id": str, "path": str, ...}
    """
    style = style or RENDER_STYLE

    # 스크립트 로드
    with open(script_path, "r", encoding="utf-8") as f:
        script = json.load(f)

    episode_id = script.get("episode_id", "ep_unknown")
    scenes = script.get("scenes", [])
    full_text = script.get("full_text", "")
    display_text = script.get("display_text", full_text)

    if not full_text:
        parts = script.get("script", {})
        full_text = " ".join([
            parts.get("hook", ""),
            " ".join(parts.get("body", [])),
            parts.get("cta", ""),
        ])

    # 출력 디렉토리
    episode_dir = SAMPLES_DIR / episode_id
    episode_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")

    print(f"\n{'─'*60}")
    print(f"[{episode_id}] 렌더링 시작")
    print(f"  보이스: {style['voice_preset']} | 속도: {style['speed']}x")
    print(f"  씬 수: {len(scenes)}")
    print(f"{'─'*60}")

    ep_start = time.time()

    # 1. 이미지 생성 (만화 스타일 프리픽스 결합)
    mood_key = "manga"
    scene_images = []

    if not skip_images and scenes:
        print(f"\n[Step 1] 이미지 생성...")
        img_results = generate_mood_images(
            scenes=scenes,
            output_dir=str(IMAGE_DIR),
            episode_id=episode_id,
            mood_key=mood_key,
            image_prompt_prefix=style["image_prompt_prefix"],
        )
        for r in img_results:
            if r.get("success") and r.get("path"):
                scene_images.append(r["path"])
    else:
        # 기존 이미지 재사용
        mood_image_dir = IMAGE_DIR / mood_key
        for scene in scenes:
            img_path = mood_image_dir / f"{episode_id}_scene{scene['id']:02d}.png"
            if img_path.exists():
                scene_images.append(str(img_path))

    if not scene_images:
        print(f"  [WARN] 이미지 없음 — 단색 배경으로 렌더링")

    # 2. 영상 렌더링 (TTS + DepthFlow + 자막 합성)
    output_path = str(episode_dir / f"{episode_id}_manga_{ts}.mp4")

    print(f"\n[Step 2] 영상 렌더링...")
    render_result = render_video(
        text=full_text,
        output_path=output_path,
        episode_id=episode_id,
        voice_preset=style["voice_preset"],
        speed=style["speed"],
        video_format=style["format"],
        font_size=style["font_size"],
        scene_images=scene_images,
        display_text=display_text,
        depthflow_override=style["depthflow_preset"],
        scenes=scenes,
    )

    ep_elapsed = time.time() - ep_start
    render_result["episode_id"] = episode_id
    render_result["elapsed_sec"] = round(ep_elapsed, 1)

    if render_result.get("success"):
        size_mb = render_result.get("file_size_mb", 0)
        dur = render_result.get("duration", 0)
        print(f"\n  [{episode_id}] 완료: {dur:.1f}초 | {size_mb}MB | {ep_elapsed:.0f}초 소요")
    else:
        print(f"\n  [{episode_id}] 실패: {render_result.get('error', '?')}")

    return render_result


def render_batch(
    script_paths: list[str],
    skip_images: bool = False,
) -> dict:
    """여러 에피소드를 일괄 렌더링 (2단계: 이미지 병렬 → 영상 순차).

    Phase 1: 모든 에피소드 이미지를 병렬 생성 (API I/O 바운드)
    Phase 2: 영상 렌더링 순차 실행 (GPU/CPU 바운드)

    Args:
        script_paths: 스크립트 JSON 경로 리스트
        skip_images: True면 이미지 생성 건너뜀

    Returns:
        {"episodes": [...], "summary_path": "..."}
    """
    from concurrent.futures import ThreadPoolExecutor

    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    style = RENDER_STYLE

    print(f"{'='*60}")
    print(f"배치 렌더링: {len(script_paths)}개 에피소드")
    print(f"스타일: 만화 (일본/한국 애니메이션)")
    print(f"{'='*60}")

    total_start = time.time()

    # ── Phase 1: 이미지 병렬 생성 ──────────────────────────
    scripts = []
    for sp in script_paths:
        with open(sp, "r", encoding="utf-8") as f:
            scripts.append(json.load(f))

    if not skip_images:
        print(f"\n[Phase 1] 이미지 병렬 생성 ({len(scripts)}개 에피소드)...")
        img_start = time.time()

        def _gen_images_for(script_data):
            ep_id = script_data.get("episode_id", "ep_unknown")
            scenes = script_data.get("scenes", [])
            if not scenes:
                return ep_id, []
            results = generate_mood_images(
                scenes=scenes,
                output_dir=str(IMAGE_DIR),
                episode_id=ep_id,
                mood_key="manga",
                image_prompt_prefix=style["image_prompt_prefix"],
            )
            paths = [r["path"] for r in results if r.get("success") and r.get("path")]
            return ep_id, paths

        # 에피소드별 이미지를 동시 생성 (각 에피소드 내부도 ThreadPool)
        ep_images = {}
        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = {executor.submit(_gen_images_for, s): s for s in scripts}
            for future in futures:
                ep_id, paths = future.result()
                ep_images[ep_id] = paths

        img_elapsed = time.time() - img_start
        total_imgs = sum(len(v) for v in ep_images.values())
        print(f"  이미지 생성 완료: {total_imgs}장 ({img_elapsed:.0f}초)")
    else:
        ep_images = {}

    # ── Phase 2: 영상 순차 렌더링 (GPU/CPU 집약) ──────────
    print(f"\n[Phase 2] 영상 렌더링 ({len(scripts)}개 에피소드)...")
    results = []
    for idx, (script_path, script_data) in enumerate(zip(script_paths, scripts)):
        ep_id = script_data.get("episode_id", "ep_unknown")
        print(f"\n[{idx+1}/{len(scripts)}] {ep_id}")
        result = render_episode(
            script_path=script_path,
            skip_images=True,  # Phase 1에서 이미 생성됨
        )
        results.append(result)

    total_elapsed = time.time() - total_start

    # Summary JSON 생성
    summary = {
        "batch_timestamp": ts,
        "total_elapsed_sec": round(total_elapsed, 1),
        "episodes_rendered": len(results),
        "style": "manga (Japanese/Korean anime)",
        "episodes": [
            {
                "episode_id": r.get("episode_id"),
                "success": r.get("success", False),
                "path": r.get("path"),
                "duration": r.get("duration"),
                "file_size_mb": r.get("file_size_mb"),
                "voice_preset": r.get("voice_preset"),
                "elapsed_sec": r.get("elapsed_sec"),
            }
            for r in results
        ],
    }

    summary_path = str(SAMPLES_DIR / f"batch_summary_{ts}.json")
    SAMPLES_DIR.mkdir(parents=True, exist_ok=True)
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    # 최종 리포트
    print(f"\n{'='*60}")
    print(f"배치 렌더링 완료")
    print(f"{'='*60}")
    success_count = sum(1 for r in results if r.get("success"))
    print(f"  성공: {success_count}/{len(results)}")
    print(f"  총 소요: {total_elapsed:.0f}초 ({total_elapsed/60:.1f}분)")
    print(f"  Summary: {summary_path}")
    for r in results:
        status = "OK" if r.get("success") else "FAIL"
        print(f"    [{status}] {r.get('episode_id', '?')}: {r.get('path', '-')}")
    print(f"{'='*60}")

    return {"episodes": results, "summary_path": summary_path}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Batch Episode Renderer (Manga Style)")
    parser.add_argument("--script", type=str, default=None,
                        help="Single script JSON path")
    parser.add_argument("--scripts", type=str, default=None,
                        help="Comma-separated script JSON paths")
    parser.add_argument("--skip-images", action="store_true",
                        help="Skip image generation (reuse existing)")
    args = parser.parse_args()

    # 스크립트 목록 결정
    if args.scripts:
        script_paths = [p.strip() for p in args.scripts.split(",")]
    elif args.script:
        script_paths = [args.script]
    else:
        parser.print_help()
        sys.exit(1)

    # 파일 존재 확인
    for sp in script_paths:
        if not os.path.exists(sp):
            print(f"[ERROR] 스크립트 파일 없음: {sp}")
            sys.exit(1)

    if len(script_paths) == 1:
        result = render_episode(script_path=script_paths[0], skip_images=args.skip_images)
        sys.exit(0 if result.get("success") else 1)
    else:
        result = render_batch(script_paths=script_paths, skip_images=args.skip_images)
        sys.exit(0 if all(e.get("success") for e in result["episodes"]) else 1)
