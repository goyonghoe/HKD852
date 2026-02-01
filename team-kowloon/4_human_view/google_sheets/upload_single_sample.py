#!/usr/bin/env python3
"""
단일 샘플 업로드 (서식 포함)
"""

import sys
from pathlib import Path
import gspread
from google.oauth2.service_account import Credentials

PROJECT_ROOT = Path(__file__).parent.parent.parent
OUTPUT_DIR = PROJECT_ROOT / '3_ai_output' / 'generated_specs'
CREDENTIALS_PATH = PROJECT_ROOT / '1_human_control' / 'credentials' / 'service_account_key.json'
SPREADSHEET_ID = "1wzyjG6pRK53DnhPAL_XNVeMrclovMGnbWQ4xpBBLEmQ"

# 샘플 파일 (하나만)
SAMPLE_FILE = "신규앨범업데이트_ALLDAYPROJECT_ALLDAYPROJECT.csv"


def upload_single_sample():
    """단일 샘플 업로드"""

    print("=" * 70)
    print("  단일 샘플 업로드 (신규앨범업데이트 - ALLDAY PROJECT)")
    print("=" * 70)
    print()

    # 인증
    print("🔐 인증 중...")
    scopes = [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
    ]

    creds = Credentials.from_service_account_file(str(CREDENTIALS_PATH), scopes=scopes)
    client = gspread.authorize(creds)
    spreadsheet = client.open_by_key(SPREADSHEET_ID)

    print(f"✅ {spreadsheet.title}")
    print()

    # CSV 읽기
    filepath = OUTPUT_DIR / SAMPLE_FILE

    import csv
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        data = list(reader)

    sheet_name = "SAMPLE_신규앨범_ALLDAY_PROJECT"

    print(f"📄 {sheet_name} 생성 중...")

    # 기존 시트 삭제
    try:
        existing = spreadsheet.worksheet(sheet_name)
        spreadsheet.del_worksheet(existing)
        print(f"  🗑️  기존 삭제")
    except:
        pass

    # 새 시트 생성
    worksheet = spreadsheet.add_worksheet(
        title=sheet_name,
        rows=len(data) + 50,
        cols=12
    )

    # 데이터 업로드
    worksheet.update(data, 'A1')
    print(f"  📝 데이터 업로드 완료")
    print()

    # 서식 적용
    print("🎨 서식 적용 중...")

    # 섹션 헤더 찾기
    section_rows = []
    visual_ref_row = None
    checklist_row = None

    for i, row in enumerate(data):
        if row and row[0].startswith('['):
            section_rows.append(i + 1)
            if '시각' in row[0] or '참고' in row[0]:
                visual_ref_row = i + 1
            elif '체크리스트' in row[0]:
                checklist_row = i + 1

    # 1. 섹션 헤더 (파란색)
    for row_num in section_rows:
        worksheet.format(f'A{row_num}:I{row_num}', {
            'backgroundColor': {'red': 0.26, 'green': 0.52, 'blue': 0.96},
            'textFormat': {
                'foregroundColor': {'red': 1.0, 'green': 1.0, 'blue': 1.0},
                'fontSize': 12,
                'bold': True
            }
        })
    print("  ✅ 섹션 헤더")

    # 1-1. 시각 참고 자료 섹션 (주황색 헤더)
    if visual_ref_row:
        ref_header_row = visual_ref_row + 1
        ref_data_start = visual_ref_row + 2

        # 다음 섹션 찾기
        next_section = None
        for row_num in section_rows:
            if row_num > visual_ref_row:
                next_section = row_num
                break

        ref_data_end = (next_section - 2) if next_section else len(data)

        # 헤더 서식 (주황색)
        worksheet.format(f'A{ref_header_row}:C{ref_header_row}', {
            'backgroundColor': {'red': 1.0, 'green': 0.8, 'blue': 0.4},
            'textFormat': {'fontSize': 11, 'bold': True},
            'horizontalAlignment': 'CENTER'
        })

        # 테두리
        worksheet.format(f'A{ref_header_row}:C{ref_data_end}', {
            'borders': {
                'top': {'style': 'SOLID'},
                'bottom': {'style': 'SOLID'},
                'left': {'style': 'SOLID'},
                'right': {'style': 'SOLID'}
            }
        })
        print("  ✅ 시각 참고 자료")

    # 2. 일감 기본 정보 (회색 + 테두리)
    if len(section_rows) >= 1:
        info_start = section_rows[0] + 1
        info_end = section_rows[1] - 2 if len(section_rows) > 1 else len(data)

        worksheet.format(f'A{info_start}:A{info_end}', {
            'backgroundColor': {'red': 0.95, 'green': 0.95, 'blue': 0.95},
            'textFormat': {'bold': True}
        })

        worksheet.format(f'A{info_start}:B{info_end}', {
            'borders': {
                'top': {'style': 'SOLID'},
                'bottom': {'style': 'SOLID'},
                'left': {'style': 'SOLID'},
                'right': {'style': 'SOLID'}
            }
        })
    print("  ✅ 일감 기본 정보")

    # 3. 체크리스트 헤더 (녹색)
    if checklist_row:
        header_row = checklist_row + 1
        data_start = checklist_row + 2
        data_end = len(data)

        worksheet.format(f'A{header_row}:I{header_row}', {
            'backgroundColor': {'red': 0.85, 'green': 0.92, 'blue': 0.83},
            'textFormat': {'fontSize': 11, 'bold': True},
            'horizontalAlignment': 'CENTER'
        })

        # 테두리
        worksheet.format(f'A{header_row}:I{data_end}', {
            'borders': {
                'top': {'style': 'SOLID'},
                'bottom': {'style': 'SOLID'},
                'left': {'style': 'SOLID'},
                'right': {'style': 'SOLID'}
            }
        })
    print("  ✅ 체크리스트 헤더")

    # 4. 체크박스
    if checklist_row and data_start <= data_end:
        sheet_id = worksheet.id

        requests = [{
            'setDataValidation': {
                'range': {
                    'sheetId': sheet_id,
                    'startRowIndex': data_start - 1,
                    'endRowIndex': data_end,
                    'startColumnIndex': 7,  # H열 (작업 완료)
                    'endColumnIndex': 8
                },
                'rule': {
                    'condition': {'type': 'BOOLEAN'},
                    'showCustomUi': True
                }
            }
        }]

        spreadsheet.batch_update({'requests': requests})

        # FALSE → boolean 변환
        for row_idx in range(data_start, data_end + 1):
            try:
                cell = worksheet.acell(f'H{row_idx}').value
                if cell == 'FALSE':
                    worksheet.update_acell(f'H{row_idx}', False)
            except:
                pass
    print("  ✅ 체크박스")

    # 5. 컬럼 너비
    sheet_id = worksheet.id
    requests = [
        {'updateDimensionProperties': {'range': {'sheetId': sheet_id, 'dimension': 'COLUMNS', 'startIndex': 0, 'endIndex': 1}, 'properties': {'pixelSize': 250}, 'fields': 'pixelSize'}},
        {'updateDimensionProperties': {'range': {'sheetId': sheet_id, 'dimension': 'COLUMNS', 'startIndex': 1, 'endIndex': 2}, 'properties': {'pixelSize': 120}, 'fields': 'pixelSize'}},
        {'updateDimensionProperties': {'range': {'sheetId': sheet_id, 'dimension': 'COLUMNS', 'startIndex': 2, 'endIndex': 3}, 'properties': {'pixelSize': 100}, 'fields': 'pixelSize'}},
        {'updateDimensionProperties': {'range': {'sheetId': sheet_id, 'dimension': 'COLUMNS', 'startIndex': 3, 'endIndex': 4}, 'properties': {'pixelSize': 180}, 'fields': 'pixelSize'}},
        {'updateDimensionProperties': {'range': {'sheetId': sheet_id, 'dimension': 'COLUMNS', 'startIndex': 4, 'endIndex': 5}, 'properties': {'pixelSize': 250}, 'fields': 'pixelSize'}},  # 용도 설명
        {'updateDimensionProperties': {'range': {'sheetId': sheet_id, 'dimension': 'COLUMNS', 'startIndex': 5, 'endIndex': 6}, 'properties': {'pixelSize': 200}, 'fields': 'pixelSize'}},  # 게임 내 위치
        {'updateDimensionProperties': {'range': {'sheetId': sheet_id, 'dimension': 'COLUMNS', 'startIndex': 6, 'endIndex': 7}, 'properties': {'pixelSize': 200}, 'fields': 'pixelSize'}},  # 참고 이미지
        {'updateDimensionProperties': {'range': {'sheetId': sheet_id, 'dimension': 'COLUMNS', 'startIndex': 7, 'endIndex': 8}, 'properties': {'pixelSize': 100}, 'fields': 'pixelSize'}},  # 작업 완료
        {'updateDimensionProperties': {'range': {'sheetId': sheet_id, 'dimension': 'COLUMNS', 'startIndex': 8, 'endIndex': 9}, 'properties': {'pixelSize': 150}, 'fields': 'pixelSize'}},  # 비고
    ]

    spreadsheet.batch_update({'requests': requests})
    print("  ✅ 컬럼 너비")

    print()
    print("=" * 70)
    print("✅ 업로드 완료!")
    print("=" * 70)
    print()
    print(f"🔗 https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}")
    print()


if __name__ == "__main__":
    try:
        upload_single_sample()
    except Exception as e:
        print(f"\n❌ 오류: {e}")
        import traceback
        traceback.print_exc()
