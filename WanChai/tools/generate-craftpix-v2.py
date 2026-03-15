#!/usr/bin/env python3
"""Generate craftpix-index-v2.json with 3-level taxonomy and tags."""

import json
import re
from collections import defaultdict

with open('craftpix-index.json') as f:
    data = json.load(f)

# ============================================================
# STEP 1: Build pack records with tags
# ============================================================

LOCATION_KEYWORDS = [
    'bar-street', 'chinese-street', 'snow-city', 'desert', 'beach',
    'prison', 'lab', 'sewerage', 'residential', 'industrial',
    'sea-port', 'seaport', 'pirate-bay', 'market-street', 'basement',
    'ghetto', 'exclusion-zone', 'spaceliner', 'power-station', 'dump',
    'factory', 'green-zone', 'farm', 'city', 'underwater',
    'business-center', 'bar-cafe',
]

THEME_KEYWORDS = ['cyberpunk', 'halloween', 'sci-fi', 'free', 'pixel-art']

TYPE_KEYWORDS = [
    'sprite-sheet', 'tileset', 'icon', 'pixel-art', 'animated',
    'constructor', '32x32', 'font', 'gui',
]

# Content tags from subfolder names
CONTENT_TAG_MAP = {
    'background': 'background',
    'backgrounds': 'background',
    'tiles': 'tiles',
    'tile': 'tiles',
    'tileset': 'tiles',
    'objects': 'objects',
    'animated objects': 'animated-objects',
    'animated': 'animated',
    'icons': 'icon',
    'icon': 'icon',
    'spritesheet': 'sprite-sheet',
    'sprite sheet': 'sprite-sheet',
    'sprite-sheet': 'sprite-sheet',
    'idle': 'idle',
    'walk': 'walk',
    'attack': 'attack',
    'death': 'death',
    'hurt': 'hurt',
    'run': 'run',
}

def extract_tags(pack_name, category, files):
    tags = set()
    name_lower = pack_name.lower()

    # Location tags
    for loc in LOCATION_KEYWORDS:
        if loc in name_lower:
            tags.add(loc)

    # Theme tags
    for theme in THEME_KEYWORDS:
        if theme in name_lower:
            tags.add(theme)

    # Type tags
    for typ in TYPE_KEYWORDS:
        if typ in name_lower:
            tags.add(typ)

    # Category as tag
    tags.add(category)

    # Free tag
    if 'free' in name_lower:
        tags.add('free')

    # Content tags from file subfolders
    for f in files[:20]:  # Sample first 20 files
        parts = f.lower().split('/')
        for part in parts:
            # Clean up numbered prefixes like "1 Icons", "2 Background"
            cleaned = re.sub(r'^\d+\s*', '', part).strip().lower()
            if cleaned in CONTENT_TAG_MAP:
                tags.add(CONTENT_TAG_MAP[cleaned])

    return sorted(tags)


def make_short_name(pack_name):
    """Shorten pack name by removing common suffixes."""
    name = pack_name
    for remove in ['pixel-art-', '-pixel-art', '-pixel', 'pixel-', 'craftpix-net-',
                    '-pack', '-asset', '-assets', '-set', '-for-cyberpunk-game',
                    '-for-cyberpunk', '-for-platformer', '-for-cyberpunk-topic',
                    '-for-platformer-game', '-for-sci-fi']:
        name = name.replace(remove, '')
    # Remove trailing dashes
    name = name.strip('-')
    return name


packs = {}

for category, pack_map in data.items():
    if not pack_map:
        continue
    for pack_name, files in pack_map.items():
        if not files:
            continue
        short_name = make_short_name(pack_name)
        tags = extract_tags(pack_name, category, files)
        packs[pack_name] = {
            'category': category,
            'tags': tags,
            'files': files,
            'fileCount': len(files),
        }

# ============================================================
# STEP 2: Build taxonomy - assign packs to 중분류
# ============================================================

# Helper: check if pack name contains any of the keywords
def name_has(pack_name, keywords):
    n = pack_name.lower()
    return any(k in n for k in keywords)

taxonomy = {}

# --- 캐릭터 (Characters) ---
char_sub = {
    '플레이어/히어로': [],
    '보스': [],
    '적': [],
    'NPC': [],
    '동물/펫': [],
}

# Characters category
for pack_name, info in packs.items():
    cat = info['category']
    if cat == 'bosses':
        char_sub['보스'].append(pack_name)
    elif cat == 'enemies':
        char_sub['적'].append(pack_name)
    elif cat == 'characters':
        n = pack_name.lower()
        if any(k in n for k in ['pet-companion', 'street-animal', 'swimming']):
            char_sub['동물/펫'].append(pack_name)
        elif any(k in n for k in ['townspeople', 'trader', 'workers', 'police',
                                     'prison', 'homeless', 'beach-crowd',
                                     'bar-cafe-npc', 'wardens', 'prisoner',
                                     'antagonist']):
            char_sub['NPC'].append(pack_name)
        elif any(k in n for k in ['fighter', 'main', 'free-characters',
                                    'extra-animations', 'guns-for-cyberpunk',
                                    'free-guns-pack', 'melee-attack',
                                    'halloween-character']):
            char_sub['플레이어/히어로'].append(pack_name)
        else:
            # Default: NPC for remaining character packs
            char_sub['NPC'].append(pack_name)

taxonomy['캐릭터'] = {
    'icon': '👤',
    'children': {k: {'packs': sorted(v)} for k, v in char_sub.items() if v},
}

# --- 환경 (Environment) ---
env_sub = {
    '배경': [],
    '타일셋': [],
    '장식': [],
    '건설/모듈': [],
}

for pack_name, info in packs.items():
    cat = info['category']
    if cat == 'backgrounds':
        env_sub['배경'].append(pack_name)
    elif cat == 'tilesets':
        env_sub['타일셋'].append(pack_name)
    elif cat == 'decorations':
        env_sub['장식'].append(pack_name)
    elif cat == 'constructors':
        env_sub['건설/모듈'].append(pack_name)

taxonomy['환경'] = {
    'icon': '🏙️',
    'children': {k: {'packs': sorted(v)} for k, v in env_sub.items() if v},
}

# --- 아이템 (Items) ---
item_sub = {
    '무기': [],
    '장비/방어구': [],
    '소비/음식': [],
    '자원/재료': [],
    '스킬': [],
    '기타 아이콘': [],
}

WEAPON_KW = ['firearm', 'melee-weapon', 'guns', 'ammo', 'weapon']
ARMOR_KW = ['armor', 'clothing', 'clothes', 'suit', 'gloves', 'cloaks', 'protective-suit']
FOOD_KW = ['food', 'fruit', 'vegetable', 'street-food', 'snack', 'medicine', 'street-snacks']
RESOURCE_KW = ['resource', 'mining', 'machine-parts', 'energy']
SKILL_KW = ['skill']
OTHER_ICON_KW = ['implant', 'cyber-implant', 'genetics', 'drone', 'jewelry',
                  'household', 'rank', 'headphones', 'glasses', 'pocket',
                  'social-media', 'artifact', 'artefact', 'vegetation',
                  'gadgets', 'tool']

for pack_name, info in packs.items():
    if info['category'] != 'icons':
        continue
    n = pack_name.lower()
    if any(k in n for k in WEAPON_KW):
        item_sub['무기'].append(pack_name)
    elif any(k in n for k in ARMOR_KW):
        item_sub['장비/방어구'].append(pack_name)
    elif any(k in n for k in FOOD_KW):
        item_sub['소비/음식'].append(pack_name)
    elif any(k in n for k in RESOURCE_KW):
        item_sub['자원/재료'].append(pack_name)
    elif any(k in n for k in SKILL_KW):
        item_sub['스킬'].append(pack_name)
    elif any(k in n for k in OTHER_ICON_KW):
        item_sub['기타 아이콘'].append(pack_name)
    else:
        item_sub['기타 아이콘'].append(pack_name)

taxonomy['아이템'] = {
    'icon': '🎒',
    'children': {k: {'packs': sorted(v)} for k, v in item_sub.items() if v},
}

# --- 이펙트/UI (Effects & UI) ---
fx_sub = {
    '이펙트': [],
    'UI': [],
    '차량/메카': [],
}

for pack_name, info in packs.items():
    cat = info['category']
    if cat == 'effects':
        fx_sub['이펙트'].append(pack_name)
    elif cat == 'ui':
        fx_sub['UI'].append(pack_name)
    elif cat == 'vehicles':
        fx_sub['차량/메카'].append(pack_name)

taxonomy['이펙트/UI'] = {
    'icon': '✨',
    'children': {k: {'packs': sorted(v)} for k, v in fx_sub.items() if v},
}

# ============================================================
# STEP 3: Collect all unique tags by type
# ============================================================

all_locations = set()
all_types = set()
all_themes = set()

for info in packs.values():
    for tag in info['tags']:
        if tag in [t for t in LOCATION_KEYWORDS]:
            all_locations.add(tag)
        elif tag in TYPE_KEYWORDS:
            all_types.add(tag)
        elif tag in THEME_KEYWORDS:
            all_themes.add(tag)

# Add category-based types
all_types.update(['bosses', 'enemies', 'characters', 'icons', 'tilesets',
                   'decorations', 'effects', 'ui', 'vehicles', 'constructors',
                   'backgrounds'])

tags_index = {
    'locations': sorted(all_locations),
    'types': sorted(all_types),
    'themes': sorted(all_themes),
}

# ============================================================
# STEP 4: Output
# ============================================================

output = {
    'version': 2,
    'totalPacks': len(packs),
    'totalFiles': sum(p['fileCount'] for p in packs.values()),
    'packs': packs,
    'taxonomy': taxonomy,
    'tags': tags_index,
}

with open('craftpix-index-v2.json', 'w') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

# Print summary
print(f"Generated craftpix-index-v2.json")
print(f"  Total packs: {len(packs)}")
print(f"  Total files: {sum(p['fileCount'] for p in packs.values())}")
print()
for large_cat, info in taxonomy.items():
    icon = info['icon']
    children = info['children']
    total_packs = sum(len(v['packs']) for v in children.values())
    total_files = sum(
        packs[p]['fileCount']
        for v in children.values()
        for p in v['packs']
    )
    print(f"{icon} {large_cat}: {total_packs} packs, {total_files} files")
    for mid_cat, mid_info in children.items():
        mid_packs = mid_info['packs']
        mid_files = sum(packs[p]['fileCount'] for p in mid_packs)
        print(f"  └ {mid_cat}: {len(mid_packs)} packs, {mid_files} files")

print()
print(f"Tags: {len(tags_index['locations'])} locations, {len(tags_index['types'])} types, {len(tags_index['themes'])} themes")
print(f"  Locations: {', '.join(tags_index['locations'])}")
print(f"  Types: {', '.join(tags_index['types'])}")
print(f"  Themes: {', '.join(tags_index['themes'])}")
