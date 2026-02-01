#!/usr/bin/env python3
"""
Import 경로 자동 수정 스크립트
"""

import re
from pathlib import Path

ROOT = Path(__file__).parent

# 파일별 수정 내용
FIXES = {
    # 2_ai_agents/core/ - 상대 import 사용
    "2_ai_agents/core/input_handler.py": [
        ("from data_manager import", "from ..utils.data_manager import"),
    ],
    "2_ai_agents/core/review_agent.py": [
        ("from data_manager import", "from ..utils.data_manager import"),
    ],
    "2_ai_agents/core/spec_generator.py": [
        ("from data_manager import", "from ..utils.data_manager import"),
        ("from review_agent import", "from .review_agent import"),
    ],

    # scripts/ - sys.path 추가
    "scripts/complete_pipeline_demo.py": "ADD_SYSPATH",
    "scripts/demo.py": "ADD_SYSPATH",
    "scripts/convert_to_layer2.py": "ADD_SYSPATH",

    # 4_human_view/google_sheets/ - 확인 후 결정
    "4_human_view/google_sheets/auto_upload_to_sheets.py": "ADD_SYSPATH",
    "4_human_view/google_sheets/upload_to_sheets.py": "ADD_SYSPATH",
}

SYSPATH_TEMPLATE = """import sys
from pathlib import Path

# Add project root to Python path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

"""


def fix_imports_in_file(file_path, replacements):
    """파일의 import 경로 수정"""
    if not file_path.exists():
        print(f"  ⚠️  {file_path} (파일 없음)")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    for old, new in replacements:
        content = content.replace(old, new)

    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✅ {file_path}")
    else:
        print(f"  ⏭️  {file_path} (변경 없음)")


def add_syspath(file_path):
    """sys.path 추가"""
    if not file_path.exists():
        print(f"  ⚠️  {file_path} (파일 없음)")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # 이미 sys.path 추가되어 있는지 확인
    if any('sys.path.insert' in line or 'PROJECT_ROOT' in line for line in lines):
        print(f"  ⏭️  {file_path} (이미 sys.path 설정됨)")
        return

    # shebang과 docstring 이후에 추가
    insert_index = 0
    in_docstring = False
    docstring_char = None

    for i, line in enumerate(lines):
        # shebang
        if line.startswith('#!'):
            insert_index = i + 1
            continue

        # docstring 시작
        if not in_docstring and (line.strip().startswith('"""') or line.strip().startswith("'''")):
            docstring_char = line.strip()[:3]
            in_docstring = True
            continue

        # docstring 끝
        if in_docstring and docstring_char in line:
            insert_index = i + 1
            in_docstring = False
            break

    # sys.path 코드 삽입
    lines.insert(insert_index, '\n' + SYSPATH_TEMPLATE)

    # import 경로 수정
    content = ''.join(lines)
    content = content.replace('from data_manager import', 'from 2_ai_agents.utils.data_manager import')
    content = content.replace('from input_handler import', 'from 2_ai_agents.core.input_handler import')
    content = content.replace('from review_agent import', 'from 2_ai_agents.core.review_agent import')
    content = content.replace('from spec_generator import', 'from 2_ai_agents.core.spec_generator import')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"  ✅ {file_path} (sys.path 추가)")


def main():
    """메인 실행"""
    print("=" * 70)
    print("  Import 경로 수정")
    print("=" * 70)
    print()

    for file, fix in FIXES.items():
        file_path = ROOT / file

        if fix == "ADD_SYSPATH":
            add_syspath(file_path)
        else:
            fix_imports_in_file(file_path, fix)

    print()
    print("=" * 70)
    print("  ✅ Import 경로 수정 완료!")
    print("=" * 70)


if __name__ == "__main__":
    main()
