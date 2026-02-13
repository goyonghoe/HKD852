#!/usr/bin/env python3
"""
Google Sheets 자동 업로드 (API 사용)

Google Sheets API를 사용하여 CSV 데이터를 자동으로 업로드합니다.
service account credentials가 필요합니다.
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
import csv
import subprocess
from pathlib import Path
from typing import List, Dict


class GoogleSheetsUploader:
    """Google Sheets API를 통한 자동 업로드"""

    def __init__(self):
        with open('config.json', 'r', encoding='utf-8') as f:
            config = json.load(f)
        self.spreadsheet_id = config['google_sheets']['spreadsheet_id']

    def read_csv(self, file_path: str) -> List[List[str]]:
        """CSV 파일을 2차원 배열로 읽기"""
        with open(file_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.reader(f)
            return list(reader)

    def upload_csv_to_sheet(self, csv_file: str, sheet_name: str):
        """
        CSV 파일을 Google Sheets의 새 탭으로 업로드

        Args:
            csv_file: CSV 파일 경로
            sheet_name: 생성할 시트 이름
        """
        print(f"📤 업로드 중: {csv_file} → {sheet_name}")

        # CSV 데이터 읽기
        data = self.read_csv(csv_file)

        # Google Sheets API 호출 준비
        # 1. 새 시트 생성
        # 2. 데이터 입력

        # 현재는 curl을 사용한 REST API 호출
        # 실제 구현을 위해서는 OAuth2 토큰이 필요합니다

        print(f"   ⚠️  API 호출 구현 필요 (OAuth2 인증 필요)")
        print(f"   💡 수동 업로드: python3 upload_to_sheets.py")

        return False

    def format_sheet(self, sheet_name: str):
        """시트 서식 적용 (헤더, 조건부 서식 등)"""
        print(f"🎨 서식 적용: {sheet_name}")
        # TODO: API 호출로 서식 적용
        pass


def use_gspread_library():
    """
    gspread 라이브러리를 사용한 업로드 (선택 사항)

    설치 필요:
        pip install gspread google-auth

    사용 방법:
        1. Google Cloud Console에서 서비스 계정 생성
        2. JSON 키 파일 다운로드
        3. Google Sheets를 서비스 계정 이메일과 공유
        4. 아래 코드 실행
    """
    try:
        import gspread
        from google.oauth2.service_account import Credentials

        print("✅ gspread 라이브러리 발견")
        print()

        # 서비스 계정 키 파일 확인
        key_file = "service_account_key.json"
        if not Path(key_file).exists():
            print("❌ 서비스 계정 키 파일이 없습니다.")
            print(f"   {key_file} 파일을 생성하세요.")
            print()
            print("📝 서비스 계정 키 생성 방법:")
            print("   1. https://console.cloud.google.com/")
            print("   2. 프로젝트 선택 또는 생성")
            print("   3. API 및 서비스 > 사용자 인증 정보")
            print("   4. 사용자 인증 정보 만들기 > 서비스 계정")
            print("   5. 키 생성 (JSON)")
            print("   6. 다운로드한 JSON을 service_account_key.json으로 저장")
            print()
            return False

        # gspread로 업로드
        print("🔐 서비스 계정으로 인증 중...")
        creds = Credentials.from_service_account_file(
            key_file,
            scopes=['https://www.googleapis.com/auth/spreadsheets']
        )
        client = gspread.authorize(creds)

        # config에서 spreadsheet ID 가져오기
        with open('config.json', 'r', encoding='utf-8') as f:
            config = json.load(f)
        spreadsheet_id = config['google_sheets']['spreadsheet_id']

        # 스프레드시트 열기
        print(f"📊 스프레드시트 열기: {spreadsheet_id}")
        spreadsheet = client.open_by_key(spreadsheet_id)

        # CSV 파일들 업로드
        csv_files = [
            (str(OUTPUT_DIR) + "/명세서_요약.csv", "명세서_요약"),
            (str(OUTPUT_DIR) + "/명세서_전체목록.csv", "명세서_전체목록"),
            (str(OUTPUT_DIR) + "/명세서_우선순위.csv", "명세서_우선순위"),
        ]

        # 앨범별 상세 명세서 추가
        import glob
        album_csvs = glob.glob(str(OUTPUT_DIR) + "/*_*.csv")
        for album_csv in sorted(album_csvs):
            if "요약" not in album_csv and "전체목록" not in album_csv and "우선순위" not in album_csv:
                sheet_name = Path(album_csv).stem  # 파일명에서 확장자 제거
                csv_files.append((album_csv, sheet_name))

        for csv_file, sheet_name in csv_files:
            if not Path(csv_file).exists():
                print(f"⚠️  파일 없음: {csv_file}")
                continue

            print(f"📤 업로드: {csv_file} → {sheet_name}")

            # CSV 읽기
            with open(csv_file, 'r', encoding='utf-8-sig') as f:
                reader = csv.reader(f)
                data = list(reader)

            # 기존 시트 삭제 (있다면)
            try:
                old_sheet = spreadsheet.worksheet(sheet_name)
                spreadsheet.del_worksheet(old_sheet)
                print(f"   🗑️  기존 시트 삭제")
            except gspread.exceptions.WorksheetNotFound:
                pass

            # 새 시트 생성
            rows = len(data)
            cols = max(len(row) for row in data) if data else 1
            worksheet = spreadsheet.add_worksheet(
                title=sheet_name,
                rows=rows + 10,  # 여유 공간
                cols=cols + 5
            )

            # 데이터 입력
            worksheet.update(data, 'A1')
            print(f"   ✅ 업로드 완료 ({rows}행 x {cols}열)")

            # 헤더 서식
            if rows > 0:
                worksheet.format('A1:Z1', {
                    'backgroundColor': {'red': 0.9, 'green': 0.9, 'blue': 0.9},
                    'textFormat': {'bold': True}
                })
                print(f"   🎨 헤더 서식 적용")

        print()
        print("✅ 모든 파일 업로드 완료!")
        print(f"🌐 확인: https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit")
        return True

    except ImportError:
        print("❌ gspread 라이브러리가 설치되지 않았습니다.")
        print()
        print("설치 방법:")
        print("   pip install gspread google-auth")
        print()
        return False
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        return False


if __name__ == "__main__":
    print("=" * 70)
    print("  Google Sheets 자동 업로드")
    print("=" * 70)
    print()

    # gspread 라이브러리 사용 시도
    success = use_gspread_library()

    if not success:
        print()
        print("=" * 70)
        print("  대안: 수동 업로드")
        print("=" * 70)
        print()
        print("다음 스크립트를 실행하세요:")
        print("   python3 upload_to_sheets.py")
        print()
