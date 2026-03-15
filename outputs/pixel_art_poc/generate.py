#!/usr/bin/env python3
"""
Pixel Art Game Sprite PoC - 빵빵좀비단+ 수준 도트 리소스 AI 생성

Step 1: SDXL + pixel-art-xl LoRA로 기본 캐릭터 생성
Step 2: img2img로 스타일 유지한 채 장비/색상 변형
Step 3: img2img로 포즈 변형 (애니메이션 프레임)
"""

import torch
import os
import time
from pathlib import Path

os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"

OUTPUT_DIR = Path(__file__).parent
DEVICE = "mps"
DTYPE = torch.float16

NEG_PROMPT = (
    "blurry, anti-aliasing, realistic, 3d render, smooth gradient, "
    "photograph, text, watermark, signature, frame, border, "
    "multiple characters, crowd, busy background"
)


def load_pipeline():
    """SDXL + pixel-art-xl LoRA 로딩"""
    from diffusers import StableDiffusionXLPipeline

    print("  모델 로딩 중 (첫 실행 시 ~6.5GB 다운로드)...")
    t0 = time.time()

    pipe = StableDiffusionXLPipeline.from_pretrained(
        "stabilityai/stable-diffusion-xl-base-1.0",
        torch_dtype=DTYPE,
        variant="fp16",
        use_safetensors=True,
    )
    pipe.load_lora_weights("nerijs/pixel-art-xl")
    pipe.to(DEVICE)

    print(f"  모델 로딩 완료 ({time.time() - t0:.0f}초)")
    return pipe


def generate(pipe, prompt, **kwargs):
    """단일 이미지 생성"""
    defaults = dict(
        negative_prompt=NEG_PROMPT,
        num_inference_steps=25,
        guidance_scale=7.5,
        width=1024,
        height=1024,
    )
    defaults.update(kwargs)
    return pipe(prompt=prompt, **defaults).images[0]


def step1_base_sprites(pipe):
    """Step 1: 기본 캐릭터 스프라이트 4종 생성"""
    out = OUTPUT_DIR / "step1_base"
    out.mkdir(parents=True, exist_ok=True)

    characters = [
        (
            "zombie_warrior",
            "pixel art, game character sprite, zombie warrior holding a rusty sword, "
            "dark green skin, tattered medieval armor, menacing red eyes, "
            "idle standing pose, front view, single character centered, "
            "16-bit SNES RPG style, clean sharp pixels, limited color palette, "
            "solid dark background",
        ),
        (
            "skeleton_archer",
            "pixel art, game character sprite, skeleton archer with a bone bow, "
            "white skull, glowing blue eye sockets, brown leather quiver, "
            "idle standing pose, front view, single character centered, "
            "16-bit SNES RPG style, clean sharp pixels, limited color palette, "
            "solid dark background",
        ),
        (
            "slime",
            "pixel art, game character sprite, cute bouncy blue slime monster, "
            "translucent jelly body, happy face, small sparkle highlights, "
            "idle bouncing pose, front view, single character centered, "
            "16-bit SNES RPG style, clean sharp pixels, limited color palette, "
            "solid dark background",
        ),
        (
            "knight_hero",
            "pixel art, game character sprite, heroic knight in shining silver armor, "
            "blue cape flowing, golden sword, determined expression, "
            "idle standing pose, front view, single character centered, "
            "16-bit SNES RPG style, clean sharp pixels, limited color palette, "
            "solid dark background",
        ),
    ]

    for name, prompt in characters:
        t0 = time.time()
        img = generate(pipe, prompt)
        path = out / f"{name}.png"
        img.save(path)
        print(f"  ✓ {name}.png ({time.time() - t0:.0f}초)")

    print(f"  → Step 1 완료: {out}/\n")
    return out


def step2_style_variations(pipe, base_dir):
    """Step 2: 첫 번째 캐릭터(zombie_warrior) 기반 장비/색상 변형"""
    from diffusers import StableDiffusionXLImg2ImgPipeline
    from PIL import Image

    out = OUTPUT_DIR / "step2_variations"
    out.mkdir(parents=True, exist_ok=True)

    # img2img 파이프라인 구성 (같은 모델 재사용)
    pipe_i2i = StableDiffusionXLImg2ImgPipeline(
        vae=pipe.vae,
        text_encoder=pipe.text_encoder,
        text_encoder_2=pipe.text_encoder_2,
        tokenizer=pipe.tokenizer,
        tokenizer_2=pipe.tokenizer_2,
        unet=pipe.unet,
        scheduler=pipe.scheduler,
    )
    pipe_i2i.to(DEVICE)

    base_img = Image.open(base_dir / "zombie_warrior.png").convert("RGB")

    variations = [
        (
            "fire_variant",
            "pixel art, game character sprite, zombie warrior with flaming fire sword, "
            "orange glow, ember particles, same style, front view, "
            "16-bit SNES RPG style, clean sharp pixels, solid dark background",
            0.50,
        ),
        (
            "ice_variant",
            "pixel art, game character sprite, zombie warrior with ice frost armor, "
            "blue tinted frozen crystals, cold aura, same style, front view, "
            "16-bit SNES RPG style, clean sharp pixels, solid dark background",
            0.50,
        ),
        (
            "gold_variant",
            "pixel art, game character sprite, zombie warrior powered up golden glow, "
            "shiny gold armor upgrade, radiant energy, same style, front view, "
            "16-bit SNES RPG style, clean sharp pixels, solid dark background",
            0.50,
        ),
    ]

    for name, prompt, strength in variations:
        t0 = time.time()
        img = pipe_i2i(
            prompt=prompt,
            image=base_img,
            strength=strength,
            negative_prompt=NEG_PROMPT,
            num_inference_steps=25,
            guidance_scale=7.5,
        ).images[0]
        path = out / f"{name}.png"
        img.save(path)
        print(f"  ✓ {name}.png (strength={strength}, {time.time() - t0:.0f}초)")

    print(f"  → Step 2 완료: {out}/\n")
    return out, pipe_i2i


def step3_animation_poses(pipe_i2i, base_dir):
    """Step 3: zombie_warrior 포즈 변형 → 애니메이션 프레임"""
    from PIL import Image

    out = OUTPUT_DIR / "step3_poses"
    out.mkdir(parents=True, exist_ok=True)

    base_img = Image.open(base_dir / "zombie_warrior.png").convert("RGB")

    poses = [
        (
            "01_idle",
            "pixel art, game character sprite, zombie warrior, "
            "relaxed idle standing pose, arms at sides, breathing animation, "
            "front view, 16-bit SNES RPG style, clean sharp pixels, solid dark background",
            0.45,
        ),
        (
            "02_walk_left",
            "pixel art, game character sprite, zombie warrior, "
            "walking pose left foot forward, leaning forward slightly, "
            "front view, 16-bit SNES RPG style, clean sharp pixels, solid dark background",
            0.55,
        ),
        (
            "03_walk_right",
            "pixel art, game character sprite, zombie warrior, "
            "walking pose right foot forward, arms swinging, "
            "front view, 16-bit SNES RPG style, clean sharp pixels, solid dark background",
            0.55,
        ),
        (
            "04_attack",
            "pixel art, game character sprite, zombie warrior, "
            "sword attack swinging pose, dynamic slash motion, aggressive stance, "
            "front view, 16-bit SNES RPG style, clean sharp pixels, solid dark background",
            0.60,
        ),
        (
            "05_hit",
            "pixel art, game character sprite, zombie warrior, "
            "taking damage pose, knocked backwards, pain expression, flinching, "
            "front view, 16-bit SNES RPG style, clean sharp pixels, solid dark background",
            0.60,
        ),
        (
            "06_death",
            "pixel art, game character sprite, zombie warrior, "
            "defeated fallen pose, collapsed on ground, dropped sword, "
            "front view, 16-bit SNES RPG style, clean sharp pixels, solid dark background",
            0.65,
        ),
    ]

    for name, prompt, strength in poses:
        t0 = time.time()
        img = pipe_i2i(
            prompt=prompt,
            image=base_img,
            strength=strength,
            negative_prompt=NEG_PROMPT,
            num_inference_steps=25,
            guidance_scale=7.5,
        ).images[0]
        path = out / f"{name}.png"
        img.save(path)
        print(f"  ✓ {name}.png (strength={strength}, {time.time() - t0:.0f}초)")

    print(f"  → Step 3 완료: {out}/\n")
    return out


def make_sprite_sheet(poses_dir):
    """보너스: 포즈들을 스프라이트시트 한 장으로 합치기"""
    from PIL import Image

    out_path = OUTPUT_DIR / "zombie_warrior_spritesheet.png"
    frames = sorted(poses_dir.glob("*.png"))
    if not frames:
        return

    imgs = [Image.open(f) for f in frames]
    w, h = imgs[0].size
    sheet = Image.new("RGBA", (w * len(imgs), h), (0, 0, 0, 0))

    for i, img in enumerate(imgs):
        sheet.paste(img, (i * w, 0))

    sheet.save(out_path)
    print(f"  ✓ 스프라이트시트: {out_path.name} ({len(imgs)}프레임)")


def main():
    total_start = time.time()

    print("=" * 55)
    print("  Pixel Art PoC — AI 도트 리소스 생성")
    print("  M4 24GB / MPS / SDXL + pixel-art-xl LoRA")
    print("=" * 55)

    # --- Load model ---
    print("\n[0/3] 모델 준비")
    pipe = load_pipeline()

    # --- Step 1 ---
    print("[1/3] 기본 캐릭터 스프라이트 4종")
    step1_dir = step1_base_sprites(pipe)

    # --- Step 2 ---
    print("[2/3] 좀비전사 장비/색상 변형 3종")
    step2_dir, pipe_i2i = step2_style_variations(pipe, step1_dir)

    # --- Step 3 ---
    print("[3/3] 좀비전사 포즈 변형 6종 (애니메이션)")
    step3_dir = step3_animation_poses(pipe_i2i, step1_dir)

    # --- Sprite sheet ---
    print("[보너스] 스프라이트시트 합성")
    make_sprite_sheet(step3_dir)

    elapsed = time.time() - total_start
    print(f"\n{'=' * 55}")
    print(f"  전체 완료! ({elapsed / 60:.1f}분)")
    print(f"  step1_base/        — 캐릭터 4종")
    print(f"  step2_variations/  — 장비 변형 3종")
    print(f"  step3_poses/       — 애니메이션 6프레임")
    print(f"  zombie_warrior_spritesheet.png — 스프라이트시트")
    print(f"{'=' * 55}")


if __name__ == "__main__":
    main()
