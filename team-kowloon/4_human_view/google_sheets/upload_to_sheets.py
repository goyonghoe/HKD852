#!/usr/bin/env python3
"""
Google Sheets 업로드 도우미

생성된 CSV 파일들을 Google Sheets에 업로드하는 가이드와 자동화 스크립트
"""
import sys
from pathlib import Path

# Add agents directory to Python path
PROJECT_ROOT = Path(__file__).parent.parent.parent
AGENTS_CORE = PROJECT_ROOT / '2_ai_agents' / 'core'
AGENTS_UTILS = PROJECT_ROOT / '2_ai_agents' / 'utils'
OUTPUT_DIR = PROJECT_ROOT / '3_ai_output' / 'generated_specs'
sys.path.insert(0, str(AGENTS_CORE))
sys.path.insert(0, str(AGENTS_UTILS))




import json
import webbrowser
from pathlib import Path

def manual_upload_guide():
    """수동 업로드 가이드 출력"""
    print("=" * 70)
    print("  Google Sheets 수동 업로드 가이드")
    print("=" * 70)
    print()

    # config.json에서 spreadsheet ID 가져오기
    with open('config.json', 'r', encoding='utf-8') as f:
        config = json.load(f)

    spreadsheet_id = config['google_sheets']['spreadsheet_id']
    sheets_url = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit"

    print("📋 업로드할 파일:")
    print()

    csv_files = [
        (str(OUTPUT_DIR) + "/명세서_요약.csv", "명세서_요약", "프로젝트 전체 통계 요약"),
        (str(OUTPUT_DIR) + "/명세서_전체목록.csv", "명세서_전체목록", "모든 리소스의 상세 정보"),
        (str(OUTPUT_DIR) + "/명세서_우선순위.csv", "명세서_우선순위", "우선순위별 정렬된 작업 목록"),
    ]

    for file_path, sheet_name, description in csv_files:
        if Path(file_path).exists():
            print(f"  ✅ {file_path}")
            print(f"     → 탭 이름: {sheet_name}")
            print(f"     → 설명: {description}")
            print()

    print("=" * 70)
    print("  업로드 방법 (3가지)")
    print("=" * 70)
    print()

    print("방법 1: Google Sheets UI 사용 (추천)")
    print("-" * 70)
    print("1. Google Sheets 열기:")
    print(f"   {sheets_url}")
    print()
    print("2. 각 CSV 파일마다 반복:")
    print("   a) 파일 > 가져오기")
    print("   b) 업로드 탭에서 CSV 파일 선택")
    print("   c) 가져오기 위치: '새 시트 삽입'")
    print("   d) 구분 기호 유형: '자동 감지' 또는 '쉼표'")
    print("   e) '데이터 가져오기' 클릭")
    print()
    print("3. 생성된 시트 이름 변경:")
    print("   - 명세서_요약")
    print("   - 명세서_전체목록")
    print("   - 명세서_우선순위")
    print()

    print("방법 2: 드래그 앤 드롭")
    print("-" * 70)
    print("1. Finder에서 CSV 파일들 선택")
    print("2. Google Drive 웹사이트로 드래그")
    print("3. Google Sheets로 각 파일 열기")
    print()

    print("방법 3: Google Drive 데스크톱 앱")
    print("-" * 70)
    print("1. Google Drive 폴더에 CSV 파일 복사")
    print("2. 자동 동기화 대기")
    print("3. Google Drive 웹에서 파일 열기")
    print()

    print("=" * 70)
    print()

    # 브라우저로 Google Sheets 열기 옵션
    answer = input("🌐 Google Sheets를 브라우저에서 열까요? (y/n): ").strip().lower()
    if answer == 'y':
        print(f"🌐 브라우저 열기: {sheets_url}")
        webbrowser.open(sheets_url)

    print()
    print("✅ CSV 파일들이 준비되었습니다!")
    print("   위의 방법 중 하나를 선택해서 Google Sheets에 업로드하세요.")
    print()


def check_csv_files():
    """생성된 CSV 파일 확인"""
    csv_files = [
        str(OUTPUT_DIR) + "/명세서_요약.csv",
        str(OUTPUT_DIR) + "/명세서_전체목록.csv",
        str(OUTPUT_DIR) + "/명세서_우선순위.csv",
    ]

    missing = []
    for file_path in csv_files:
        if not Path(file_path).exists():
            missing.append(file_path)

    if missing:
        print("⚠️  다음 파일이 없습니다:")
        for file_path in missing:
            print(f"   • {file_path}")
        print()
        print("먼저 spec_generator.py를 실행하세요:")
        print("   python3 spec_generator.py")
        return False

    return True


if __name__ == "__main__":
    print()
    print("=" * 70)
    print("  Google Sheets 업로드 도우미")
    print("=" * 70)
    print()

    # CSV 파일 확인
    if not check_csv_files():
        exit(1)

    # 수동 업로드 가이드
    manual_upload_guide()

    print()
    print("=" * 70)
    print("  📝 다음 단계")
    print("=" * 70)
    print()
    print("CSV 업로드 후:")
    print("  1. 각 시트의 열 너비 조정")
    print("  2. 헤더 행에 배경색/굵기 적용")
    print("  3. 완성도 열에 조건부 서식 적용:")
    print("     - 90% 이상: 녹색")
    print("     - 50-89%: 노란색")
    print("     - 50% 미만: 빨간색")
    print()
