#!/usr/bin/env python3
"""
레퍼런스 스타일 명세서 샘플 업로드

각 카테고리별로 샘플 하나씩만 Google Sheets에 업로드
"""

import sys
from pathlib import Path
import gspread
from google.oauth2.service_account import Credentials

# Add project paths
PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT / '2_ai_agents' / 'core'))
sys.path.insert(0, str(PROJECT_ROOT / '2_ai_agents' / 'utils'))

OUTPUT_DIR = PROJECT_ROOT / '3_ai_output' / 'generated_specs'
CREDENTIALS_PATH = PROJECT_ROOT / '1_human_control' / 'credentials' / 'service_account_key.json'
SPREADSHEET_ID = "1wzyjG6pRK53DnhPAL_XNVeMrclovMGnbWQ4xpBBLEmQ"

# 카테고리별로 샘플 하나씩 선택
SAMPLE_FILES = [
    "신규앨범업데이트_ALLDAYPROJECT_ALLDAYPROJECT.csv",
    "한정테마포토카드업데이트_ALLDAYPROJECT_ALLDAYPROJECT.csv",
    "이벤트패스_ALLDAYPROJECT_ALLDAYPROJECT.csv",
    "픽업뽑기상점_ALLDAYPROJECT_ALLDAYPROJECT.csv",
    "신규유저뽑기이벤트_기타_오픈기념신규유저300회뽑기.csv",
]


def upload_samples():
    """샘플 파일들을 Google Sheets에 업로드"""

    print("=" * 70)
    print("  레퍼런스 스타일 명세서 샘플 업로드")
    print("=" * 70)
    print()

    # Google Sheets 인증
    print("🔐 Google Sheets 인증 중...")
    scopes = [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
    ]

    creds = Credentials.from_service_account_file(
        str(CREDENTIALS_PATH),
        scopes=scopes
    )

    client = gspread.authorize(creds)
    spreadsheet = client.open_by_key(SPREADSHEET_ID)

    print(f"✅ 스프레드시트 연결: {spreadsheet.title}")
    print()

    # 각 샘플 파일 업로드
    print("📤 샘플 파일 업로드 중...")
    print("-" * 70)

    uploaded = 0

    for filename in SAMPLE_FILES:
        filepath = OUTPUT_DIR / filename

        if not filepath.exists():
            print(f"⚠️  {filename} (파일 없음)")
            continue

        # CSV 읽기
        import csv
        with open(filepath, 'r', encoding='utf-8-sig') as f:
            reader = csv.reader(f)
            data = list(reader)

        # 시트 이름 (파일명에서 .csv 제거)
        sheet_name = filepath.stem

        # 기존 시트 삭제 (있으면)
        try:
            existing_sheet = spreadsheet.worksheet(sheet_name)
            spreadsheet.del_worksheet(existing_sheet)
            print(f"  🗑️  기존 시트 삭제: {sheet_name}")
        except gspread.exceptions.WorksheetNotFound:
            pass

        # 새 시트 생성
        worksheet = spreadsheet.add_worksheet(
            title=sheet_name,
            rows=len(data) + 100,  # 여유 공간
            cols=max(len(row) for row in data) + 5
        )

        # 데이터 업로드
        worksheet.update(data, 'A1')

        print(f"  ✅ {sheet_name}")
        uploaded += 1

    print()
    print("=" * 70)
    print(f"✅ 업로드 완료! (총 {uploaded}개 시트)")
    print("=" * 70)
    print()
    print(f"🔗 Google Sheets URL:")
    print(f"   https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}")
    print()


if __name__ == "__main__":
    try:
        upload_samples()
    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
