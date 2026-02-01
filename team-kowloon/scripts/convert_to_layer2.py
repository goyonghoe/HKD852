#!/usr/bin/env python3
"""
SSBL 아트 명세서 Layer 1 → Layer 2 변환 스크립트

현재 시트(Layer 1: 인간 친화적) 데이터를 AI 친화적인 Layer 2 형식으로 변환합니다.

주요 기능:
1. 병합된 셀 처리 (빈 셀을 이전 값으로 채우기)
2. 아티스트/앨범 분리 ("TAEYANG - Quintessence" → artist, album)
3. 사이즈 파싱 ("380x512" → width, height)
4. 상태 값 정규화 (한글 → 영어 enum)
5. 우선순위 자동 설정 (카테고리 기반)
6. 타임스탬프 자동 생성
"""
import sys
from pathlib import Path

# Add agents directory to Python path
PROJECT_ROOT = Path(__file__).parent.parent
AGENTS_CORE = PROJECT_ROOT / '2_ai_agents' / 'core'
AGENTS_UTILS = PROJECT_ROOT / '2_ai_agents' / 'utils'
sys.path.insert(0, str(AGENTS_CORE))
sys.path.insert(0, str(AGENTS_UTILS))




import csv
import re
from datetime import datetime
from pathlib import Path

# 설정
INPUT_FILE = Path(__file__).parent / "명세서" / "SSBL_아트명세서.csv"
OUTPUT_FILE = Path(__file__).parent / "명세서" / "SSBL_Layer2.csv"
PROJECT_NAME = "SSBL"

# 우선순위 매핑 (카테고리 기반)
PRIORITY_MAP = {
    "신규 앨범 업데이트": "high",
    "한정 테마 포토카드 업데이트": "medium",
    "이벤트 패스": "high",
    "픽업 뽑기 상점": "medium",
    "신규 유저 뽑기 이벤트": "high",
    "시즌 패스": "medium",
}

# 번역 상태 매핑
TRANSLATION_STATUS_MAP = {
    "불필요": "not_required",
    "미완료": "required",
    "완료": "completed",
    "": "not_required",  # 빈 값은 불필요로 처리
}

# 작업 상태 매핑
STATUS_MAP = {
    "FALSE": "pending",
    "TRUE": "completed",
    "": "pending",  # 빈 값은 대기로 처리
}


def parse_artist_album(group_str):
    """
    "TAEYANG - Quintessence" → ("TAEYANG", "Quintessence")
    "오픈 기념 신규 유저 300회 뽑기" → ("", "오픈 기념 신규 유저 300회 뽑기")
    """
    if not group_str or group_str.strip() == "":
        return "", ""

    # " - " 구분자로 분리
    if " - " in group_str:
        parts = group_str.split(" - ", 1)
        return parts[0].strip(), parts[1].strip()
    else:
        # 분리할 수 없으면 앨범명으로 처리
        return "", group_str.strip()


def parse_size(size_str):
    """
    "380x512" → (380, 512, "")
    "~280x40" → (280, 40, "approximate")
    "(미정)" → (None, None, "TBD")
    "(입력 필요)" → (None, None, "input_required")
    """
    if not size_str or size_str.strip() == "":
        return None, None, ""

    size_str = size_str.strip()

    # (미정), (입력 필요) 등
    if "미정" in size_str:
        return None, None, "TBD"
    if "입력 필요" in size_str or "입력필요" in size_str:
        return None, None, "input_required"

    # ~280x40 (approximate)
    if size_str.startswith("~"):
        size_str = size_str[1:]
        note = "approximate"
    else:
        note = ""

    # 280x40 파싱
    match = re.search(r'(\d+)\s*x\s*(\d+)', size_str)
    if match:
        width = int(match.group(1))
        height = int(match.group(2))
        return width, height, note

    # 파싱 실패
    return None, None, size_str


def parse_languages(lang_str):
    """
    "KR / EN / JP" → "KR,EN,JP"
    "KR" → "KR"
    "" → ""
    """
    if not lang_str or lang_str.strip() == "":
        return ""

    # "/" 또는 "," 로 분리하고 공백 제거
    langs = re.split(r'[/,]', lang_str)
    langs = [lang.strip() for lang in langs if lang.strip()]
    return ",".join(langs)


def fill_merged_cells(rows):
    """
    병합된 셀 처리: 빈 셀을 이전 행의 같은 컬럼 값으로 채우기

    컬럼 인덱스 (0-based):
    - 1: 번역
    - 2: 일감 대분류
    - 3: 일감 그룹 분류
    """
    merge_columns = [1, 2, 3]  # 병합될 가능성이 있는 컬럼

    for row_idx in range(len(rows)):
        for col_idx in merge_columns:
            if col_idx >= len(rows[row_idx]):
                continue

            # 현재 셀이 비어있으면 이전 행의 값 복사
            if rows[row_idx][col_idx].strip() == "" and row_idx > 0:
                if col_idx < len(rows[row_idx - 1]):
                    rows[row_idx][col_idx] = rows[row_idx - 1][col_idx]

    return rows


def convert_row_to_layer2(row, row_id, current_time):
    """
    Layer 1 행을 Layer 2 형식으로 변환

    Layer 1 컬럼 (인덱스):
    0: (빈 컬럼)
    1: 번역
    2: 일감 대분류
    3: 일감 그룹 분류
    4: 리소스 구분
    5: 사이즈 (W x H)
    6: 기획 담당자
    7: 아트 담당자
    8: 상세 설명 시트 바로가기
    9: 아트 작업 완료
    10: 적용 프로젝트
    11: 작업 필요 언어
    12: 비고

    Layer 2 컬럼:
    id,project,category_main,artist,album,resource_type,size_width,size_height,size_note,
    owner_planning,owner_art,detail_link,status,translation_status,languages,priority,
    due_date,notes,created_at,updated_at
    """
    # 컬럼 파싱 (빈 값 처리)
    translation = row[1] if len(row) > 1 else ""
    category_main = row[2] if len(row) > 2 else ""
    group = row[3] if len(row) > 3 else ""
    resource_type = row[4] if len(row) > 4 else ""
    size_str = row[5] if len(row) > 5 else ""
    owner_planning = row[6] if len(row) > 6 else ""
    owner_art = row[7] if len(row) > 7 else ""
    detail_link = row[8] if len(row) > 8 else ""
    work_complete = row[9] if len(row) > 9 else ""
    project = row[10] if len(row) > 10 else PROJECT_NAME
    languages_raw = row[11] if len(row) > 11 else ""
    notes = row[12] if len(row) > 12 else ""

    # 아티스트/앨범 분리
    artist, album = parse_artist_album(group)

    # 사이즈 파싱
    width, height, size_note = parse_size(size_str)

    # 상태 매핑
    translation_status = TRANSLATION_STATUS_MAP.get(translation, "not_required")
    status = STATUS_MAP.get(work_complete, "pending")

    # 언어 파싱
    languages = parse_languages(languages_raw)

    # 우선순위 자동 설정
    priority = PRIORITY_MAP.get(category_main, "medium")

    # Layer 2 행 생성
    layer2_row = {
        "id": row_id,
        "project": project if project else PROJECT_NAME,
        "category_main": category_main,
        "artist": artist,
        "album": album,
        "resource_type": resource_type,
        "size_width": width if width is not None else "",
        "size_height": height if height is not None else "",
        "size_note": size_note,
        "owner_planning": owner_planning,
        "owner_art": owner_art,
        "detail_link": detail_link,
        "status": status,
        "translation_status": translation_status,
        "languages": languages,
        "priority": priority,
        "due_date": "",  # 현재 시트에 마감일 없음
        "notes": notes,
        "created_at": current_time,
        "updated_at": current_time,
    }

    return layer2_row


def main():
    print(f"📖 Reading input file: {INPUT_FILE}")

    # CSV 읽기
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        rows = list(reader)

    print(f"✅ Loaded {len(rows)} rows")

    # 헤더 찾기 (11행: "[요청 이미지 리스트]" 행)
    header_row_idx = None
    for idx, row in enumerate(rows):
        if len(row) > 1 and "[요청 이미지 리스트]" in row[1]:
            header_row_idx = idx + 1  # 다음 행이 실제 헤더
            break

    if header_row_idx is None:
        raise ValueError("헤더를 찾을 수 없습니다: '[요청 이미지 리스트]'")

    print(f"📍 Header found at row {header_row_idx}")

    # 데이터 행 추출 (헤더 다음 행부터)
    data_rows = rows[header_row_idx + 1:]

    # 병합된 셀 처리
    print("🔄 Filling merged cells...")
    data_rows = fill_merged_cells(data_rows)

    # Layer 2 변환
    print("🔄 Converting to Layer 2 format...")
    current_time = datetime.utcnow().isoformat() + "Z"
    layer2_data = []

    for idx, row in enumerate(data_rows, start=1):
        # 빈 행 스킵
        if not any(cell.strip() for cell in row):
            continue

        # 리소스 구분이 없으면 스킵 (실제 데이터가 아님)
        if len(row) < 5 or not row[4].strip():
            continue

        layer2_row = convert_row_to_layer2(row, idx, current_time)
        layer2_data.append(layer2_row)

    print(f"✅ Converted {len(layer2_data)} data rows")

    # CSV 저장
    print(f"💾 Saving to: {OUTPUT_FILE}")

    fieldnames = [
        "id", "project", "category_main", "artist", "album", "resource_type",
        "size_width", "size_height", "size_note", "owner_planning", "owner_art",
        "detail_link", "status", "translation_status", "languages", "priority",
        "due_date", "notes", "created_at", "updated_at"
    ]

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_FILE, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(layer2_data)

    print(f"🎉 Success! Layer 2 data saved to: {OUTPUT_FILE}")
    print(f"📊 Total records: {len(layer2_data)}")

    # 통계 출력
    print("\n📈 Statistics:")
    print(f"  - Artists: {len(set(row['artist'] for row in layer2_data if row['artist']))}")
    print(f"  - Categories: {len(set(row['category_main'] for row in layer2_data))}")
    print(f"  - Priority breakdown:")
    for priority in ["high", "medium", "low"]:
        count = sum(1 for row in layer2_data if row['priority'] == priority)
        print(f"    - {priority}: {count}")


if __name__ == "__main__":
    main()
