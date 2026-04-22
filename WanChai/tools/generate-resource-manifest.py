#!/usr/bin/env python3
"""Scan raw-assets/craftpix-cyberpunk/ and emit a JSON manifest of all assets,
classified by kind (animation strip / static image / tileset / audio).

Usage:
    python3 tools/generate-resource-manifest.py
Writes: tools/resource-manifest.json
"""

import json
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSET_ROOT = ROOT / "raw-assets/craftpix-cyberpunk"
OUT = ROOT / "tools/resource-manifest.json"

SKIP_DIRS = {"PSD", "__MACOSX"}
SKIP_FILES = {"Free Assets Craftpix!.url", ".DS_Store"}

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
AUDIO_EXTS = {".wav", ".mp3", ".ogg", ".m4a", ".aac", ".flac"}

# Animation strip detection
MIN_FRAME_HEIGHT = 16
MAX_FRAME_HEIGHT = 192
MAX_FRAMES = 24
# Tileset detection: large sheets that divide cleanly into tile grids
TILESET_MIN_DIM = 256

CATEGORY_TITLES = {
    "audio": "Audio",
    "backgrounds": "Backgrounds",
    "bosses": "Bosses",
    "characters": "Characters",
    "constructors": "Constructors",
    "decorations": "Decorations",
    "effects": "Effects",
    "enemies": "Enemies",
    "icons": "Icons",
    "tilesets": "Tilesets",
    "ui": "UI",
    "vehicles": "Vehicles",
}

# Categories where horizontal-strip animations dominate
SPRITE_CATEGORIES = {"characters", "bosses", "enemies"}


def png_size(path: Path):
    try:
        with open(path, "rb") as f:
            data = f.read(24)
        if data[:8] != b"\x89PNG\r\n\x1a\n":
            return None
        w, h = struct.unpack(">II", data[16:24])
        return w, h
    except Exception:
        return None


def jpg_size(path: Path):
    try:
        with open(path, "rb") as f:
            if f.read(2) != b"\xff\xd8":
                return None
            while True:
                b = f.read(1)
                while b and b != b"\xff":
                    b = f.read(1)
                while b == b"\xff":
                    b = f.read(1)
                if not b:
                    return None
                marker = b[0]
                if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                    f.read(3)
                    h, w = struct.unpack(">HH", f.read(4))
                    return w, h
                size = struct.unpack(">H", f.read(2))[0]
                f.read(size - 2)
    except Exception:
        return None


def image_size(path: Path):
    ext = path.suffix.lower()
    if ext == ".png":
        return png_size(path)
    if ext in (".jpg", ".jpeg"):
        return jpg_size(path)
    return None


def classify_image(width: int, height: int, category: str):
    """Return a dict with kind and strip metadata if applicable."""
    # Horizontal strip animation — require >1 frame (frames=1 is just a square/tall image)
    if (
        MIN_FRAME_HEIGHT <= height <= MAX_FRAME_HEIGHT
        and width % height == 0
    ):
        frames = width // height
        if 2 <= frames <= MAX_FRAMES:
            return {"kind": "animation", "frameSize": height, "frames": frames}
    # Tileset heuristic (non-sprite categories with large sheets)
    if category not in SPRITE_CATEGORIES and (width >= TILESET_MIN_DIM or height >= TILESET_MIN_DIM):
        return {"kind": "tileset"}
    return {"kind": "static"}


def human_size(num_bytes: float) -> str:
    n = float(num_bytes)
    for unit in ["B", "K", "M", "G"]:
        if n < 1024:
            return f"{n:.1f}{unit}"
        n /= 1024
    return f"{n:.1f}T"


def scan_pack(pack_dir: Path, category: str):
    """Recursively find all assets in a pack, grouped by relative directory."""
    assets = []
    total_bytes = 0
    for f in sorted(pack_dir.rglob("*")):
        if not f.is_file():
            continue
        if f.name in SKIP_FILES:
            continue
        if any(part in SKIP_DIRS for part in f.relative_to(pack_dir).parts):
            continue
        ext = f.suffix.lower()
        rel = str(f.relative_to(ROOT))
        dir_rel = str(f.parent.relative_to(pack_dir))
        try:
            size_bytes = f.stat().st_size
        except Exception:
            size_bytes = 0
        total_bytes += size_bytes
        if ext in IMAGE_EXTS:
            size = image_size(f)
            if size is None:
                continue
            w, h = size
            cls = classify_image(w, h, category)
            entry = {
                "name": f.stem,
                "path": rel,
                "dir": dir_rel,
                "ext": ext[1:],
                "width": w,
                "height": h,
                **cls,
            }
            assets.append(entry)
        elif ext in AUDIO_EXTS:
            assets.append(
                {
                    "name": f.stem,
                    "path": rel,
                    "dir": dir_rel,
                    "ext": ext[1:],
                    "kind": "audio",
                    "bytes": size_bytes,
                }
            )
    return assets, total_bytes


def short_pack_name(folder: str) -> str:
    parts = folder.split("-")
    meaningful = [p for p in parts if not (p.isdigit() or p in ("craftpix", "net"))]
    drop = {"pixel", "art", "pack", "asset", "assets", "free", "sprites", "sprite", "for", "game"}
    keep = [p for p in meaningful if p.lower() not in drop] or meaningful
    return " ".join(w.capitalize() for w in keep[:7])


def scan_category(cat_key: str):
    cat_dir = ASSET_ROOT / cat_key
    if not cat_dir.exists():
        return None
    packs = []
    total_assets = 0
    total_bytes = 0
    for pack_dir in sorted(cat_dir.iterdir()):
        if not pack_dir.is_dir():
            continue
        if pack_dir.name in SKIP_DIRS:
            continue
        assets, pack_bytes = scan_pack(pack_dir, cat_key)
        if not assets:
            continue
        kinds = {}
        for a in assets:
            kinds[a["kind"]] = kinds.get(a["kind"], 0) + 1
        packs.append(
            {
                "folder": pack_dir.name,
                "title": short_pack_name(pack_dir.name),
                "assetCount": len(assets),
                "bytes": pack_bytes,
                "sizeHuman": human_size(pack_bytes),
                "kinds": kinds,
                "files": assets,
            }
        )
        total_assets += len(assets)
        total_bytes += pack_bytes

    if not packs:
        return None

    # Category-level kind aggregation
    agg_kinds = {}
    for p in packs:
        for k, n in p["kinds"].items():
            agg_kinds[k] = agg_kinds.get(k, 0) + n

    # Determine primary type for UI routing
    if cat_key == "audio":
        ctype = "audio"
    elif cat_key in SPRITE_CATEGORIES:
        ctype = "sprites"
    elif agg_kinds.get("tileset", 0) > agg_kinds.get("static", 0):
        ctype = "tilesets"
    else:
        ctype = "images"

    return {
        "key": cat_key,
        "title": CATEGORY_TITLES.get(cat_key, cat_key.title()),
        "type": ctype,
        "packCount": len(packs),
        "assetCount": total_assets,
        "bytes": total_bytes,
        "sizeHuman": human_size(total_bytes),
        "kinds": agg_kinds,
        "packs": packs,
    }


def main() -> int:
    if not ASSET_ROOT.exists():
        print(f"Asset root not found: {ASSET_ROOT}", file=sys.stderr)
        return 1

    categories = []
    grand_assets = 0
    grand_bytes = 0
    for cat_key in sorted(CATEGORY_TITLES):
        print(f"  scanning {cat_key}…", file=sys.stderr)
        cat = scan_category(cat_key)
        if cat is None:
            continue
        categories.append(cat)
        grand_assets += cat["assetCount"]
        grand_bytes += cat["bytes"]

    manifest = {
        "version": 2,
        "assetRoot": str(ASSET_ROOT.relative_to(ROOT)),
        "totalCategories": len(categories),
        "totalAssets": grand_assets,
        "totalBytes": grand_bytes,
        "sizeHuman": human_size(grand_bytes),
        "categories": categories,
    }

    OUT.write_text(json.dumps(manifest, ensure_ascii=False))
    print(f"Wrote {OUT.relative_to(ROOT)}")
    print(f"  Categories: {len(categories)}  Assets: {grand_assets}  Size: {human_size(grand_bytes)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
