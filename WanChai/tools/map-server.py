#!/usr/bin/env python3
"""Map Editor dev server — serves files + saves chapter JSON via POST.

On save:
1. Builds a cp_key → filePath lookup from craftpix-index-v2.json
2. For each chapter JSON, resolves cp_* keys to clean texture keys
3. Copies referenced PNGs to public/assets/maps/textures/
4. Writes transformed chapter JSON with a textures[] manifest
"""
import http.server
import hashlib
import json
import os
import re
import shutil

PORT = 8090
WANCHAI_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAPS_DIR = os.path.join(WANCHAI_ROOT, 'public', 'assets', 'maps')
TEXTURES_DIR = os.path.join(MAPS_DIR, 'textures')
INDEX_PATH = os.path.join(WANCHAI_ROOT, 'tools', 'craftpix-index-v2.json')

# Build the cp_key → filepath lookup once at startup
_cp_key_to_path: dict[str, str] = {}


def _build_key_lookup():
    """Build forward lookup: cp_key → raw filepath (relative to WANCHAI_ROOT)."""
    global _cp_key_to_path
    if not os.path.exists(INDEX_PATH):
        print(f'[Map Server] WARNING: {INDEX_PATH} not found — cp_ key resolution disabled')
        return
    with open(INDEX_PATH, 'r', encoding='utf-8') as f:
        index = json.load(f)
    for pack in index.get('packs', {}).values():
        for filepath in pack.get('files', []):
            # Replicate the JS key generation: 'cp_' + path.replace(/[\/\s]/g, '_').replace('.png', '')
            key = 'cp_' + re.sub(r'[/\s]', '_', filepath).replace('.png', '')
            _cp_key_to_path[key] = filepath
    print(f'[Map Server] Built cp_ key lookup: {len(_cp_key_to_path)} entries')


def _make_clean_key(filepath: str) -> str:
    """Create a short, readable texture key from the raw filepath.

    Takes the last 3 meaningful path segments + filename, sanitizes them.
    Appends a short hash to avoid collisions.
    Example: 'cyberpunk_market_street_bg_day_5_a3f2'
    """
    # Remove raw-assets/craftpix-cyberpunk/ prefix and .png suffix
    cleaned = filepath
    for prefix in ['raw-assets/craftpix-cyberpunk/', 'raw-assets/']:
        if cleaned.startswith(prefix):
            cleaned = cleaned[len(prefix):]
            break
    cleaned = cleaned.replace('.png', '')

    # Split into parts, take last 3-4 meaningful segments
    parts = re.split(r'[/\\]', cleaned)
    # Filter out very long craftpix-net-NNNN pack names — keep last part after the number
    meaningful = []
    for p in parts:
        # Skip empty parts
        if not p:
            continue
        # Shorten craftpix-net-NNNN-long-name to just long-name
        m = re.match(r'craftpix-net-\d+-(.*)', p)
        if m:
            p = m.group(1)
        meaningful.append(p)

    # Take last 4 segments max
    tail = meaningful[-4:] if len(meaningful) > 4 else meaningful
    base = '_'.join(tail)
    # Sanitize: lowercase, replace non-alnum with underscore, collapse
    base = re.sub(r'[^a-z0-9]+', '_', base.lower()).strip('_')
    # Truncate to reasonable length
    if len(base) > 50:
        base = base[:50].rstrip('_')
    # Add short hash for uniqueness
    h = hashlib.md5(filepath.encode()).hexdigest()[:4]
    return f'{base}_{h}'


def _transform_chapter(ch_data: dict) -> dict:
    """Transform a chapter JSON: resolve cp_* keys, copy PNGs, add textures manifest."""
    os.makedirs(TEXTURES_DIR, exist_ok=True)
    textures: list[dict[str, str]] = []
    resolved: dict[str, str] = {}  # cp_key → clean_key (cache for dedup)

    def resolve_key(cp_key: str) -> str:
        """Resolve a single cp_* key. Returns clean_key or original if not cp_."""
        if not cp_key.startswith('cp_'):
            return cp_key
        if cp_key in resolved:
            return resolved[cp_key]

        filepath = _cp_key_to_path.get(cp_key)
        if not filepath:
            print(f'[Map Server] WARNING: cp_ key not found in index: {cp_key[:80]}')
            resolved[cp_key] = cp_key  # keep original
            return cp_key

        clean_key = _make_clean_key(filepath)
        src = os.path.join(WANCHAI_ROOT, filepath)
        dst = os.path.join(TEXTURES_DIR, f'{clean_key}.png')

        if os.path.exists(src):
            shutil.copy2(src, dst)
            print(f'[Map Server] Copied: {os.path.basename(src)} → textures/{clean_key}.png')
        else:
            print(f'[Map Server] WARNING: source file missing: {src}')
            resolved[cp_key] = cp_key
            return cp_key

        textures.append({
            'key': clean_key,
            'path': f'assets/maps/textures/{clean_key}.png',
        })
        resolved[cp_key] = clean_key
        return clean_key

    # Transform bgLayers
    for layer in ch_data.get('bgLayers', []):
        if 'id' in layer:
            layer['id'] = resolve_key(layer['id'])

    # Transform ground tiles
    ground = ch_data.get('ground', {})
    if 'surfaceTile' in ground:
        ground['surfaceTile'] = resolve_key(ground['surfaceTile'])
    if 'fillTile' in ground:
        ground['fillTile'] = resolve_key(ground['fillTile'])

    # Transform decorations
    for deco in ch_data.get('decorations', []):
        if 'key' in deco:
            deco['key'] = resolve_key(deco['key'])

    # Add textures manifest
    ch_data['textures'] = textures
    return ch_data


class MapEditorHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WANCHAI_ROOT, **kwargs)

    def do_POST(self):
        if self.path == '/api/save-maps':
            length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(length))
            saved = []
            for ch_num, ch_data in body.items():
                # Transform cp_* keys → clean keys + copy PNGs
                ch_data = _transform_chapter(ch_data)
                fname = f'chapter-{ch_num}.json'
                fpath = os.path.join(MAPS_DIR, fname)
                with open(fpath, 'w', encoding='utf-8') as f:
                    json.dump(ch_data, f, indent=2, ensure_ascii=False)
                saved.append(fname)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'saved': saved}).encode())
            print(f'[Map Server] Saved: {", ".join(saved)}')
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()


if __name__ == '__main__':
    os.makedirs(MAPS_DIR, exist_ok=True)
    _build_key_lookup()
    server = http.server.HTTPServer(('', PORT), MapEditorHandler)
    print(f'[Map Server] http://localhost:{PORT}/tools/map-editor.html')
    print(f'[Map Server] Saves to: {MAPS_DIR}')
    print(f'[Map Server] Textures to: {TEXTURES_DIR}')
    server.serve_forever()
