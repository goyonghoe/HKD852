#!/usr/bin/env python3
"""
Import 경로 수정 스크립트 v2
숫자로 시작하는 폴더명 문제 해결
"""

import re
from pathlib import Path

ROOT = Path(__file__).parent

# scripts/ 파일들의 sys.path 템플릿
SYSPATH_SCRIPT_TEMPLATE = """import sys
from pathlib import Path

# Add agents directory to Python path
PROJECT_ROOT = Path(__file__).parent.parent
AGENTS_CORE = PROJECT_ROOT / '2_ai_agents' / 'core'
AGENTS_UTILS = PROJECT_ROOT / '2_ai_agents' / 'utils'
sys.path.insert(0, str(AGENTS_CORE))
sys.path.insert(0, str(AGENTS_UTILS))

"""

# 4_human_view/ 파일들의 sys.path 템플릿
SYSPATH_VIEW_TEMPLATE = """import sys
from pathlib import Path

# Add agents directory to Python path
PROJECT_ROOT = Path(__file__).parent.parent.parent
AGENTS_CORE = PROJECT_ROOT / '2_ai_agents' / 'core'
AGENTS_UTILS = PROJECT_ROOT / '2_ai_agents' / 'utils'
OUTPUT_DIR = PROJECT_ROOT / '3_ai_output' / 'generated_specs'
sys.path.insert(0, str(AGENTS_CORE))
sys.path.insert(0, str(AGENTS_UTILS))

"""


def fix_script_file(file_path):
    """scripts/ 파일 수정"""
    if not file_path.exists():
        print(f"  ⚠️  {file_path} (파일 없음)")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 기존 잘못된 sys.path 코드 제거
    content = re.sub(
        r'import sys\nfrom pathlib import Path\n\n# Add project root to Python path\nPROJECT_ROOT.*?sys\.path\.insert.*?\n\n',
        '',
        content,
        flags=re.DOTALL
    )

    # 기존 잘못된 import 제거
    content = re.sub(r'from 2_ai_agents\..*? import', 'from PLACEHOLDER import', content)

    # docstring 찾기
    lines = content.split('\n')
    insert_index = 0
    in_docstring = False

    for i, line in enumerate(lines):
        if line.startswith('#!'):
            insert_index = i + 1
            continue
        if not in_docstring and line.strip().startswith('"""'):
            in_docstring = True
            continue
        if in_docstring and '"""' in line and i > 0:
            insert_index = i + 1
            break

    # 새 sys.path 삽입
    lines.insert(insert_index, SYSPATH_SCRIPT_TEMPLATE)
    content = '\n'.join(lines)

    # import 경로 수정 (간단하게)
    content = content.replace('from PLACEHOLDER import ArtResourceDataManager', 'from data_manager import ArtResourceDataManager')
    content = content.replace('from PLACEHOLDER import InputHandler', 'from input_handler import InputHandler')
    content = content.replace('from PLACEHOLDER import ReviewAgent', 'from review_agent import ReviewAgent')
    content = content.replace('from PLACEHOLDER import SpecGenerator', 'from spec_generator import SpecGenerator')
    content = content.replace('from PLACEHOLDER import', 'from data_manager import')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"  ✅ {file_path}")


def fix_view_file(file_path):
    """4_human_view/ 파일 수정"""
    if not file_path.exists():
        print(f"  ⚠️  {file_path} (파일 없음)")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 기존 잘못된 sys.path 코드 제거
    content = re.sub(
        r'import sys\nfrom pathlib import Path\n\n# Add project root to Python path\nPROJECT_ROOT.*?sys\.path\.insert.*?\n\n',
        '',
        content,
        flags=re.DOTALL
    )

    # 기존 잘못된 import 제거
    content = re.sub(r'from 2_ai_agents\..*? import', 'from PLACEHOLDER import', content)

    # docstring 찾기
    lines = content.split('\n')
    insert_index = 0
    in_docstring = False

    for i, line in enumerate(lines):
        if line.startswith('#!'):
            insert_index = i + 1
            continue
        if not in_docstring and line.strip().startswith('"""'):
            in_docstring = True
            continue
        if in_docstring and '"""' in line and i > 0:
            insert_index = i + 1
            break

    # 새 sys.path 삽입
    lines.insert(insert_index, SYSPATH_VIEW_TEMPLATE)
    content = '\n'.join(lines)

    # import 경로 수정
    content = content.replace('from PLACEHOLDER import', 'from spec_generator import')

    # 경로 수정 (명세서/ → ../../../3_ai_output/generated_specs/)
    content = content.replace('glob.glob("명세서/*', 'glob.glob(str(OUTPUT_DIR) + "/*')
    content = content.replace('"명세서/', 'str(OUTPUT_DIR) + "/')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"  ✅ {file_path}")


def main():
    """메인 실행"""
    print("=" * 70)
    print("  Import 경로 수정 v2")
    print("=" * 70)
    print()

    print("📝 Scripts 파일 수정:")
    fix_script_file(ROOT / "scripts" / "complete_pipeline_demo.py")
    fix_script_file(ROOT / "scripts" / "demo.py")
    fix_script_file(ROOT / "scripts" / "convert_to_layer2.py")

    print("\n📝 View 파일 수정:")
    fix_view_file(ROOT / "4_human_view" / "google_sheets" / "auto_upload_to_sheets.py")
    fix_view_file(ROOT / "4_human_view" / "google_sheets" / "upload_to_sheets.py")

    print()
    print("=" * 70)
    print("  ✅ 수정 완료!")
    print("=" * 70)


if __name__ == "__main__":
    main()
