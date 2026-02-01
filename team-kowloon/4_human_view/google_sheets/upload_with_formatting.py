#!/usr/bin/env python3
"""
레퍼런스 스타일 명세서 업로드 (서식 포함)

- 헤더 영역 색상 구분
- 표 테두리 추가
- 체크박스 추가
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

# 샘플 파일들
SAMPLE_FILES = [
    "신규앨범업데이트_ALLDAYPROJECT_ALLDAYPROJECT.csv",
    "한정테마포토카드업데이트_ALLDAYPROJECT_ALLDAYPROJECT.csv",
    "이벤트패스_ALLDAYPROJECT_ALLDAYPROJECT.csv",
    "픽업뽑기상점_ALLDAYPROJECT_ALLDAYPROJECT.csv",
    "신규유저뽑기이벤트_기타_오픈기념신규유저300회뽑기.csv",
]


def apply_formatting(worksheet, data):
    """
    워크시트에 서식 적용

    Args:
        worksheet: gspread worksheet
        data: CSV 데이터 (2D 리스트)
    """

    # 섹션 헤더 위치 찾기
    section_headers = []
    checklist_start_row = None

    for i, row in enumerate(data):
        if row and row[0].startswith('[') and '정보' in row[0]:
            section_headers.append(i + 1)  # gspread는 1-based index
        elif row and row[0].startswith('[') and '체크리스트' in row[0]:
            section_headers.append(i + 1)
            checklist_start_row = i + 1

    # 1. 섹션 헤더 서식 (진한 파란색 배경 + 흰색 글자)
    for row_num in section_headers:
        worksheet.format(f'A{row_num}:F{row_num}', {
            'backgroundColor': {'red': 0.26, 'green': 0.52, 'blue': 0.96},  # 파란색
            'textFormat': {
                'foregroundColor': {'red': 1.0, 'green': 1.0, 'blue': 1.0},  # 흰색
                'fontSize': 12,
                'bold': True
            },
            'horizontalAlignment': 'LEFT'
        })

    # 2. 일감 기본 정보 섹션 서식
    if len(section_headers) >= 1:
        info_section_start = section_headers[0] + 1
        info_section_end = section_headers[1] - 2 if len(section_headers) > 1 else len(data)

        # 구분 컬럼 (A열) - 연한 회색 배경
        worksheet.format(f'A{info_section_start}:A{info_section_end}', {
            'backgroundColor': {'red': 0.95, 'green': 0.95, 'blue': 0.95},
            'textFormat': {'bold': True}
        })

        # 테두리 추가
        worksheet.format(f'A{info_section_start}:B{info_section_end}', {
            'borders': {
                'top': {'style': 'SOLID'},
                'bottom': {'style': 'SOLID'},
                'left': {'style': 'SOLID'},
                'right': {'style': 'SOLID'}
            }
        })

    # 3. 리소스 제작 체크리스트 섹션 서식
    if checklist_start_row:
        checklist_header_row = checklist_start_row + 1
        checklist_data_start = checklist_start_row + 2
        checklist_data_end = len(data)

        # 체크리스트 헤더 (연한 녹색)
        worksheet.format(f'A{checklist_header_row}:F{checklist_header_row}', {
            'backgroundColor': {'red': 0.85, 'green': 0.92, 'blue': 0.83},  # 연한 녹색
            'textFormat': {
                'fontSize': 11,
                'bold': True
            },
            'horizontalAlignment': 'CENTER'
        })

        # 체크리스트 데이터 영역 테두리
        worksheet.format(f'A{checklist_header_row}:F{checklist_data_end}', {
            'borders': {
                'top': {'style': 'SOLID'},
                'bottom': {'style': 'SOLID'},
                'left': {'style': 'SOLID'},
                'right': {'style': 'SOLID'}
            }
        })

        # 4. 작업 완료 컬럼(E열)을 체크박스로 변경
        if checklist_data_start <= checklist_data_end:
            # FALSE 값을 모두 체크박스로 변환
            checkbox_range = f'E{checklist_data_start}:E{checklist_data_end}'

            # 데이터 검증 규칙 추가 (체크박스)
            worksheet.worksheet.batch_update([{
                'setDataValidation': {
                    'range': {
                        'sheetId': worksheet.id,
                        'startRowIndex': checklist_data_start - 1,
                        'endRowIndex': checklist_data_end,
                        'startColumnIndex': 4,  # E열 (0-based)
                        'endColumnIndex': 5
                    },
                    'rule': {
                        'condition': {
                            'type': 'BOOLEAN'
                        },
                        'showCustomUi': True
                    }
                }
            }])

            # FALSE 값들을 boolean으로 변환
            for row_idx in range(checklist_data_start, checklist_data_end + 1):
                cell_value = worksheet.acell(f'E{row_idx}').value
                if cell_value == 'FALSE':
                    worksheet.update_acell(f'E{row_idx}', False)

    # 5. 컬럼 너비 조정
    worksheet.worksheet.batch_update([{
        'updateDimensionProperties': {
            'range': {
                'sheetId': worksheet.id,
                'dimension': 'COLUMNS',
                'startIndex': 0,  # A열
                'endIndex': 1
            },
            'properties': {
                'pixelSize': 250  # 리소스 구분
            },
            'fields': 'pixelSize'
        }
    }, {
        'updateDimensionProperties': {
            'range': {
                'sheetId': worksheet.id,
                'dimension': 'COLUMNS',
                'startIndex': 1,  # B열
                'endIndex': 2
            },
            'properties': {
                'pixelSize': 150  # 구분/내용
            },
            'fields': 'pixelSize'
        }
    }, {
        'updateDimensionProperties': {
            'range': {
                'sheetId': worksheet.id,
                'dimension': 'COLUMNS',
                'startIndex': 2,  # C열
                'endIndex': 3
            },
            'properties': {
                'pixelSize': 120  # 사이즈
            },
            'fields': 'pixelSize'
        }
    }, {
        'updateDimensionProperties': {
            'range': {
                'sheetId': worksheet.id,
                'dimension': 'COLUMNS',
                'startIndex': 3,  # D열
                'endIndex': 4
            },
            'properties': {
                'pixelSize': 200  # 파일명
            },
            'fields': 'pixelSize'
        }
    }, {
        'updateDimensionProperties': {
            'range': {
                'sheetId': worksheet.id,
                'dimension': 'COLUMNS',
                'startIndex': 4,  # E열
                'endIndex': 5
            },
            'properties': {
                'pixelSize': 100  # 작업 완료
            },
            'fields': 'pixelSize'
        }
    }])

    print(f"    📐 서식 적용 완료")


def upload_samples_with_formatting():
    """샘플 파일들을 서식과 함께 업로드"""

    print("=" * 70)
    print("  레퍼런스 스타일 명세서 업로드 (서식 포함)")
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
    print("📤 샘플 파일 업로드 및 서식 적용 중...")
    print("-" * 70)

    uploaded = 0

    for filename in SAMPLE_FILES:
        filepath = OUTPUT_DIR / filename

        if not filepath.exists():
            print(f"  ⚠️  {filename} (파일 없음)")
            continue

        # CSV 읽기
        import csv
        with open(filepath, 'r', encoding='utf-8-sig') as f:
            reader = csv.reader(f)
            data = list(reader)

        # 시트 이름
        sheet_name = filepath.stem

        print(f"  📄 {sheet_name}")

        # 기존 시트 삭제
        try:
            existing_sheet = spreadsheet.worksheet(sheet_name)
            spreadsheet.del_worksheet(existing_sheet)
            print(f"    🗑️  기존 시트 삭제")
        except gspread.exceptions.WorksheetNotFound:
            pass

        # 새 시트 생성
        worksheet = spreadsheet.add_worksheet(
            title=sheet_name,
            rows=len(data) + 100,
            cols=10
        )

        # 데이터 업로드
        worksheet.update(data, 'A1')
        print(f"    ✅ 데이터 업로드")

        # 서식 적용
        apply_formatting(worksheet, data)

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
        upload_samples_with_formatting()
    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
