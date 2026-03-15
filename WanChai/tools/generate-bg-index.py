#!/usr/bin/env python3
"""Generate bg-sets-index.json for the WanChai Map Editor.
Scans CraftPix backgrounds (main pack + tileset packs) and game parallax sets."""

import json
import os
from pathlib import Path

WANCHAI_ROOT = Path(__file__).parent.parent
CRAFTPIX = WANCHAI_ROOT / "raw-assets" / "craftpix-cyberpunk"

sets = []

# ============================================================
# 1. Main background pack: City 1-8, Day/Night
# ============================================================
main_bg = CRAFTPIX / "backgrounds" / "craftpix-net-832833-free-scrolling-city-backgrounds-pixel-art" / "1 Backgrounds"

LAYER_NAMES = ["sky", "far", "mid", "near", "front"]

for city_num in range(1, 9):
    city_dir = main_bg / str(city_num)
    if not city_dir.is_dir():
        continue
    for variant in ["Day", "Night"]:
        variant_dir = city_dir / variant
        if not variant_dir.is_dir():
            continue
        # Count available layer files (1.png .. N.png)
        layer_files = sorted(variant_dir.glob("*.png"), key=lambda p: p.name)
        if not layer_files:
            continue

        layers = {}
        for i, lname in enumerate(LAYER_NAMES):
            fname = f"{i+1}.png"
            fpath = variant_dir / fname
            if fpath.exists():
                layers[lname] = str(fpath.relative_to(WANCHAI_ROOT))

        set_id = f"city-{city_num}-{variant.lower()}"
        name = f"City {city_num} {variant}"

        sets.append({
            "id": set_id,
            "name": name,
            "source": "craftpix-main",
            "layers": layers,
            "overlay": None,
            "thumbnail": "mid",
        })


# ============================================================
# 2. Tileset packs with Background directories
# ============================================================
TILESET_DIR = CRAFTPIX / "tilesets"

# Human-friendly names from pack directory names
def extract_pack_name(dirname: str) -> str:
    """Extract a short name from craftpix-net-XXXXXX-...-tileset-..."""
    parts = dirname.split("-")
    # Skip "craftpix", "net", number
    if len(parts) > 3:
        name_parts = parts[3:]
        # Remove common suffixes
        remove = {"tileset", "pixel", "art", "pack", "free", "for", "cyberpunk", "2d", "assets", "topic", "32x32"}
        name_parts = [p for p in name_parts if p.lower() not in remove]
        return " ".join(p.capitalize() for p in name_parts if p)
    return dirname

for pack_dir in sorted(TILESET_DIR.iterdir()):
    if not pack_dir.is_dir():
        continue

    # Find background subdirectory (could be "2 Background", "3 Background", "3 Backgrounds")
    bg_dir = None
    for sub in pack_dir.iterdir():
        if sub.is_dir() and "background" in sub.name.lower():
            bg_dir = sub
            break
    if bg_dir is None:
        continue

    pack_name = extract_pack_name(pack_dir.name)

    # Check for overlay
    overlay_file = None
    for f in bg_dir.iterdir():
        if f.is_file() and "overlay" in f.name.lower() and f.suffix == ".png":
            overlay_file = str(f.relative_to(WANCHAI_ROOT))
            break

    has_day = (bg_dir / "Day").is_dir()
    has_night = (bg_dir / "Night").is_dir()

    if has_day or has_night:
        for variant in ["Day", "Night"]:
            variant_dir = bg_dir / variant
            if not variant_dir.is_dir():
                continue
            layer_files = sorted(variant_dir.glob("*.png"), key=lambda p: p.name)
            if not layer_files:
                continue

            layers = {}
            for i, lname in enumerate(LAYER_NAMES):
                fname = f"{i+1}.png"
                fpath = variant_dir / fname
                if fpath.exists():
                    layers[lname] = str(fpath.relative_to(WANCHAI_ROOT))

            # Some packs have 6 layers; assign first 5 to standard names
            # If there are extra layers, ignore them (we use 5 standard)

            slug = pack_dir.name.replace("craftpix-net-", "").split("-")[0]
            set_id = f"ts-{slug}-{variant.lower()}"

            sets.append({
                "id": set_id,
                "name": f"{pack_name} {variant}",
                "source": "craftpix-tileset",
                "layers": layers,
                "overlay": overlay_file,
                "thumbnail": "mid",
            })
    else:
        # Direct PNG layers (no Day/Night), e.g., industrial zone
        layer_files = sorted(
            [f for f in bg_dir.glob("*.png") if "overlay" not in f.name.lower() and "background" not in f.name.lower()],
            key=lambda p: p.name
        )
        if not layer_files:
            continue

        layers = {}
        for i, lname in enumerate(LAYER_NAMES):
            if i < len(layer_files):
                layers[lname] = str(layer_files[i].relative_to(WANCHAI_ROOT))

        slug = pack_dir.name.replace("craftpix-net-", "").split("-")[0]
        set_id = f"ts-{slug}"

        sets.append({
            "id": set_id,
            "name": pack_name,
            "source": "craftpix-tileset",
            "layers": layers,
            "overlay": overlay_file,
            "thumbnail": "mid",
        })


# ============================================================
# 3. Game parallax sets (already loaded as parallax_N_*)
# ============================================================
for n in range(1, 9):
    set_id = f"game-{n}"
    name = f"Game Parallax {n}"
    layers = {}
    for lname in LAYER_NAMES:
        sprite_key = f"parallax_{n}_{lname}"
        layers[lname] = sprite_key  # These are sprite keys, not file paths

    sets.append({
        "id": set_id,
        "name": name,
        "source": "game",
        "layers": layers,
        "overlay": None,
        "thumbnail": "mid",
    })


# ============================================================
# Output
# ============================================================
output = {
    "version": 1,
    "totalSets": len(sets),
    "sets": sets,
}

out_path = Path(__file__).parent / "bg-sets-index.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print(f"Generated {out_path} with {len(sets)} background sets")
for s in sets:
    print(f"  {s['id']:30s}  {s['name']:30s}  layers={len(s['layers'])}")
