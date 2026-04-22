#!/usr/bin/env python3
"""Scan raw-assets/craftpix-cyberpunk/characters/ and emit a JSON manifest of all
horizontal-strip animation spritesheets, grouped by pack/category/variant.

Usage:
    python3 tools/generate-character-manifest.py

Writes: tools/character-manifest.json
"""

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSET_ROOT = ROOT / "raw-assets/craftpix-cyberpunk/characters"
OUT = ROOT / "tools/character-manifest.json"

SKIP_DIRS = {"PSD"}
SKIP_FILES = {"Free Assets Craftpix!.url"}
# Heuristic bounds for valid horizontal-strip sheets
MIN_FRAME_HEIGHT = 32
MAX_FRAME_HEIGHT = 192
MAX_FRAMES = 24


def png_size(path: Path) -> tuple[int, int] | None:
    try:
        out = subprocess.check_output(["file", str(path)], text=True, stderr=subprocess.DEVNULL)
        m = re.search(r"(\d+)\s*x\s*(\d+)", out)
        if m:
            return int(m.group(1)), int(m.group(2))
    except Exception:
        return None
    return None


def classify(width: int, height: int) -> dict | None:
    """Return {frameSize, frames} if this looks like a horizontal-strip animation."""
    if height < MIN_FRAME_HEIGHT or height > MAX_FRAME_HEIGHT:
        return None
    if width % height != 0:
        return None
    frames = width // height
    if frames < 1 or frames > MAX_FRAMES:
        return None
    return {"frameSize": height, "frames": frames}


def find_variants(pack_dir: Path) -> list[tuple[str, Path, str | None]]:
    """Return list of (variant_name, variant_dir, category_name)."""
    variants = []
    for entry in sorted(pack_dir.iterdir()):
        if not entry.is_dir() or entry.name in SKIP_DIRS:
            continue
        # Check if this is a category (contains subfolders) or a variant (contains PNGs)
        has_pngs = any(p.suffix.lower() == ".png" for p in entry.iterdir() if p.is_file())
        subdirs = [p for p in entry.iterdir() if p.is_dir() and p.name not in SKIP_DIRS]
        if has_pngs:
            variants.append((entry.name, entry, None))
        elif subdirs:
            # Category level — recurse one step
            for sub in sorted(subdirs):
                sub_pngs = any(p.suffix.lower() == ".png" for p in sub.iterdir() if p.is_file())
                if sub_pngs:
                    variants.append((sub.name, sub, entry.name))
    return variants


def scan_variant(variant_dir: Path) -> list[dict]:
    anims = []
    for f in sorted(variant_dir.iterdir()):
        if not f.is_file():
            continue
        if f.suffix.lower() != ".png":
            continue
        if f.name in SKIP_FILES:
            continue
        size = png_size(f)
        if not size:
            continue
        w, h = size
        cls = classify(w, h)
        if not cls:
            continue
        rel = f.relative_to(ROOT)
        anims.append(
            {
                "name": f.stem,
                "path": str(rel),
                "width": w,
                "height": h,
                "frameSize": cls["frameSize"],
                "frames": cls["frames"],
            }
        )
    return anims


def short_pack_name(pack_dir: str) -> str:
    # craftpix-net-142357-prison-wardens-pixel-art-character-pack -> Prison Wardens
    parts = pack_dir.split("-")
    # drop leading craftpix, net, <number>
    meaningful = []
    for p in parts:
        if p.isdigit() or p in ("craftpix", "net"):
            continue
        meaningful.append(p)
    # drop trailing filler words
    drop = {"pixel", "art", "character", "pack", "asset", "free", "sprites", "sprite", "for"}
    keep = [p for p in meaningful if p.lower() not in drop]
    if not keep:
        keep = meaningful
    return " ".join(w.capitalize() for w in keep[:6])


def main() -> int:
    if not ASSET_ROOT.exists():
        print(f"Asset root not found: {ASSET_ROOT}", file=sys.stderr)
        return 1

    packs = []
    total_anims = 0
    for pack_dir in sorted(ASSET_ROOT.iterdir()):
        if not pack_dir.is_dir():
            continue
        variants = find_variants(pack_dir)
        pack_entry = {
            "folder": pack_dir.name,
            "title": short_pack_name(pack_dir.name),
            "variants": [],
        }
        for var_name, var_dir, category in variants:
            anims = scan_variant(var_dir)
            if not anims:
                continue
            pack_entry["variants"].append(
                {
                    "name": var_name,
                    "category": category,
                    "dir": str(var_dir.relative_to(ROOT)),
                    "animations": anims,
                }
            )
            total_anims += len(anims)
        if pack_entry["variants"]:
            packs.append(pack_entry)

    manifest = {
        "version": 1,
        "assetRoot": str(ASSET_ROOT.relative_to(ROOT)),
        "totalPacks": len(packs),
        "totalAnimations": total_anims,
        "packs": packs,
    }

    OUT.write_text(json.dumps(manifest, indent=2, ensure_ascii=False))
    print(f"Wrote {OUT.relative_to(ROOT)}")
    print(f"  Packs: {len(packs)}  Animations: {total_anims}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
