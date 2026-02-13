#!/usr/bin/env python3
"""
Translate Agent — Excel/CSV 한국어→영어/일본어 번역기
claude CLI를 사용하여 번역합니다 (추가 API 키 불필요).
"""

import argparse
import csv
import json
import subprocess
import sys
import time
from pathlib import Path

try:
    import openpyxl
except ImportError:
    print("Error: openpyxl이 설치되어 있지 않습니다.")
    print("설치: pip3 install openpyxl")
    sys.exit(1)

# 경로 설정
SCRIPT_DIR = Path(__file__).parent.resolve()
AGENT_DIR = SCRIPT_DIR.parent
INPUT_DIR = AGENT_DIR / "input"
OUTPUT_DIR = AGENT_DIR / "outputs"
GLOSSARY_PATH = AGENT_DIR / "config" / "glossary.json"

# 기본 설정
DEFAULT_BATCH_SIZE = 30
DEFAULT_MODEL = "haiku"
MAX_RETRIES = 2

# 컬럼명 후보
KOREAN_NAMES = ["한글", "korean", "ko", "원문", "한국어"]
ENGLISH_NAMES = ["영문", "english", "en", "영어"]
JAPANESE_NAMES = ["일본어", "japanese", "ja", "jp"]


def find_column(headers, candidates):
    """헤더 목록에서 후보 이름과 매칭되는 컬럼 인덱스를 반환합니다."""
    candidates_lower = [c.lower().strip() for c in candidates]
    for i, h in enumerate(headers):
        if h and h.strip().lower() in candidates_lower:
            return i
    return None


def load_glossary():
    """용어집 파일을 로드합니다."""
    if not GLOSSARY_PATH.exists():
        return {}
    try:
        with open(GLOSSARY_PATH, "r", encoding="utf-8") as f:
            entries = json.load(f)
        # { "한글텍스트": {"english": "...", "japanese": "..."} } 형태로 변환
        glossary = {}
        for entry in entries:
            ko = entry.get("korean", "").strip()
            if ko:
                glossary[ko] = {
                    "english": entry.get("english", ""),
                    "japanese": entry.get("japanese", ""),
                }
        return glossary
    except (json.JSONDecodeError, KeyError) as e:
        print(f"Warning: 용어집 파싱 실패 — {e}")
        return {}


def call_claude_translate(korean_texts, model=DEFAULT_MODEL):
    """claude CLI로 한글 텍스트 배치를 영어/일본어로 번역합니다."""
    numbered = "\n".join(f"{i+1}. {t}" for i, t in enumerate(korean_texts))
    prompt = (
        "You are a professional Korean-English-Japanese translator.\n"
        "Translate each Korean text below to English and Japanese.\n"
        "Return ONLY a valid JSON array. Each element must have exactly "
        'these keys: "korean", "english", "japanese".\n'
        "No markdown, no explanation, no code fences — just the raw JSON array.\n\n"
        f"Korean texts:\n{numbered}"
    )

    cmd = ["claude", "-p", "--model", model, "--output-format", "json", prompt]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

    if result.returncode != 0:
        raise RuntimeError(f"claude CLI 실행 실패: {result.stderr}")

    # 외부 JSON 파싱 (claude --output-format json 결과)
    outer = json.loads(result.stdout)
    raw_result = outer.get("result", "")

    # markdown 코드펜스 제거
    cleaned = raw_result.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        lines = lines[1:]  # ```json 제거
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]  # 닫는 ``` 제거
        cleaned = "\n".join(lines)

    return json.loads(cleaned)


def translate_batch_with_retry(texts, model, retries=MAX_RETRIES):
    """재시도 로직이 포함된 배치 번역입니다."""
    for attempt in range(retries + 1):
        try:
            return call_claude_translate(texts, model)
        except Exception as e:
            if attempt < retries:
                print(f"  재시도 중... ({attempt + 1}/{retries})")
                time.sleep(2)
            else:
                print(f"  번역 실패: {e}")
                # 실패 시 빈 결과 반환
                return [
                    {"korean": t, "english": "[TRANSLATION_FAILED]", "japanese": "[TRANSLATION_FAILED]"}
                    for t in texts
                ]


def process_excel(input_path, output_path, batch_size, model):
    """Excel 파일을 처리합니다."""
    wb = openpyxl.load_workbook(input_path)
    ws = wb.active

    # 헤더 찾기
    headers = [cell.value for cell in ws[1]]
    ko_col = find_column(headers, KOREAN_NAMES)
    en_col = find_column(headers, ENGLISH_NAMES)
    ja_col = find_column(headers, JAPANESE_NAMES)

    if ko_col is None:
        print(f"Error: 한글 컬럼을 찾을 수 없습니다. (후보: {KOREAN_NAMES})")
        print(f"  현재 헤더: {headers}")
        sys.exit(1)
    if en_col is None:
        print(f"Error: 영문 컬럼을 찾을 수 없습니다. (후보: {ENGLISH_NAMES})")
        sys.exit(1)
    if ja_col is None:
        print(f"Error: 일본어 컬럼을 찾을 수 없습니다. (후보: {JAPANESE_NAMES})")
        sys.exit(1)

    print(f"컬럼 매핑: 한글={headers[ko_col]}(col {ko_col+1}), "
          f"영문={headers[en_col]}(col {en_col+1}), "
          f"일본어={headers[ja_col]}(col {ja_col+1})")

    # 용어집 로드
    glossary = load_glossary()
    if glossary:
        print(f"용어집 로드: {len(glossary)}개 항목")

    # 번역이 필요한 행 수집
    rows_to_translate = []
    glossary_applied = 0
    for row_idx in range(2, ws.max_row + 1):
        ko_val = ws.cell(row=row_idx, column=ko_col + 1).value
        en_val = ws.cell(row=row_idx, column=en_col + 1).value
        ja_val = ws.cell(row=row_idx, column=ja_col + 1).value

        if not ko_val:
            continue

        ko_text = str(ko_val).strip()

        # 용어집에서 먼저 확인
        if ko_text in glossary:
            entry = glossary[ko_text]
            if not en_val and entry.get("english"):
                ws.cell(row=row_idx, column=en_col + 1, value=entry["english"])
            if not ja_val and entry.get("japanese"):
                ws.cell(row=row_idx, column=ja_col + 1, value=entry["japanese"])
            glossary_applied += 1
            continue

        # 영문 또는 일본어가 비어있으면 번역 대상
        if not en_val or not ja_val:
            rows_to_translate.append((row_idx, ko_text, not en_val, not ja_val))

    print(f"번역 대상: {len(rows_to_translate)}행 (용어집 적용: {glossary_applied}건)")

    if not rows_to_translate:
        print("번역할 행이 없습니다.")
        wb.save(output_path)
        return 0, glossary_applied

    # 배치 번역
    total = len(rows_to_translate)
    translated = 0
    start_time = time.time()

    for i in range(0, total, batch_size):
        batch = rows_to_translate[i : i + batch_size]
        batch_texts = [text for _, text, _, _ in batch]
        batch_num = i // batch_size + 1
        total_batches = (total + batch_size - 1) // batch_size

        print(f"배치 {batch_num}/{total_batches} 번역 중... ({len(batch)}행)")

        translations = translate_batch_with_retry(batch_texts, model)

        # 결과 적용
        for (row_idx, _, need_en, need_ja), trans in zip(batch, translations):
            if need_en:
                ws.cell(row=row_idx, column=en_col + 1, value=trans.get("english", ""))
            if need_ja:
                ws.cell(row=row_idx, column=ja_col + 1, value=trans.get("japanese", ""))
            translated += 1

        # 배치 간 짧은 대기
        if i + batch_size < total:
            time.sleep(1)

    elapsed = time.time() - start_time
    print(f"\n번역 완료: {translated}행, 소요시간: {elapsed:.1f}초")

    wb.save(output_path)
    return translated, glossary_applied


def process_csv(input_path, output_path, batch_size, model):
    """CSV 파일을 처리합니다."""
    with open(input_path, "r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        rows = list(reader)

    if not rows:
        print("Error: CSV 파일이 비어있습니다.")
        sys.exit(1)

    headers = rows[0]
    ko_col = find_column(headers, KOREAN_NAMES)
    en_col = find_column(headers, ENGLISH_NAMES)
    ja_col = find_column(headers, JAPANESE_NAMES)

    if ko_col is None:
        print(f"Error: 한글 컬럼을 찾을 수 없습니다. (후보: {KOREAN_NAMES})")
        sys.exit(1)
    if en_col is None:
        print(f"Error: 영문 컬럼을 찾을 수 없습니다. (후보: {ENGLISH_NAMES})")
        sys.exit(1)
    if ja_col is None:
        print(f"Error: 일본어 컬럼을 찾을 수 없습니다. (후보: {JAPANESE_NAMES})")
        sys.exit(1)

    print(f"컬럼 매핑: 한글={headers[ko_col]}(col {ko_col+1}), "
          f"영문={headers[en_col]}(col {en_col+1}), "
          f"일본어={headers[ja_col]}(col {ja_col+1})")

    glossary = load_glossary()
    if glossary:
        print(f"용어집 로드: {len(glossary)}개 항목")

    # 번역 대상 수집
    rows_to_translate = []
    glossary_applied = 0
    for row_idx in range(1, len(rows)):
        row = rows[row_idx]
        # 컬럼 수 부족 시 패딩
        while len(row) <= max(ko_col, en_col, ja_col):
            row.append("")

        ko_val = row[ko_col].strip()
        en_val = row[en_col].strip()
        ja_val = row[ja_col].strip()

        if not ko_val:
            continue

        if ko_val in glossary:
            entry = glossary[ko_val]
            if not en_val and entry.get("english"):
                row[en_col] = entry["english"]
            if not ja_val and entry.get("japanese"):
                row[ja_col] = entry["japanese"]
            glossary_applied += 1
            continue

        if not en_val or not ja_val:
            rows_to_translate.append((row_idx, ko_val, not en_val, not ja_val))

    print(f"번역 대상: {len(rows_to_translate)}행 (용어집 적용: {glossary_applied}건)")

    if not rows_to_translate:
        print("번역할 행이 없습니다.")
        with open(output_path, "w", encoding="utf-8", newline="") as f:
            writer = csv.writer(f)
            writer.writerows(rows)
        return 0, glossary_applied

    total = len(rows_to_translate)
    translated = 0
    start_time = time.time()

    for i in range(0, total, batch_size):
        batch = rows_to_translate[i : i + batch_size]
        batch_texts = [text for _, text, _, _ in batch]
        batch_num = i // batch_size + 1
        total_batches = (total + batch_size - 1) // batch_size

        print(f"배치 {batch_num}/{total_batches} 번역 중... ({len(batch)}행)")

        translations = translate_batch_with_retry(batch_texts, model)

        for (row_idx, _, need_en, need_ja), trans in zip(batch, translations):
            if need_en:
                rows[row_idx][en_col] = trans.get("english", "")
            if need_ja:
                rows[row_idx][ja_col] = trans.get("japanese", "")
            translated += 1

        if i + batch_size < total:
            time.sleep(1)

    elapsed = time.time() - start_time
    print(f"\n번역 완료: {translated}행, 소요시간: {elapsed:.1f}초")

    with open(output_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerows(rows)

    return translated, glossary_applied


def main():
    parser = argparse.ArgumentParser(
        description="Excel/CSV 한국어→영어/일본어 번역기 (claude CLI 기반)"
    )
    parser.add_argument("input_file", help="번역할 Excel(.xlsx) 또는 CSV 파일 경로")
    parser.add_argument("--output", help="출력 파일 경로 (기본: outputs/translated_<파일명>)")
    parser.add_argument("--batch-size", type=int, default=DEFAULT_BATCH_SIZE, help="배치 크기 (기본: 30)")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="번역 모델 (기본: haiku)")
    args = parser.parse_args()

    input_path = Path(args.input_file)
    if not input_path.exists():
        # input/ 폴더에서 찾기
        alt_path = INPUT_DIR / args.input_file
        if alt_path.exists():
            input_path = alt_path
        else:
            print(f"Error: 파일을 찾을 수 없습니다 — {args.input_file}")
            sys.exit(1)

    # 출력 경로 결정
    output_name = f"translated_{input_path.name}"
    output_path = Path(args.output) if args.output else OUTPUT_DIR / output_name
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"입력: {input_path}")
    print(f"출력: {output_path}")
    print(f"모델: {args.model}, 배치: {args.batch_size}")
    print("-" * 50)

    # 파일 형식에 따라 처리
    ext = input_path.suffix.lower()
    if ext in [".xlsx", ".xls"]:
        translated, glossary_count = process_excel(input_path, output_path, args.batch_size, args.model)
    elif ext == ".csv":
        translated, glossary_count = process_csv(input_path, output_path, args.batch_size, args.model)
    else:
        print(f"Error: 지원하지 않는 형식입니다 — {ext}")
        print("지원 형식: .xlsx, .csv")
        sys.exit(1)

    print("-" * 50)
    print(f"결과 파일: {output_path}")
    print(f"번역 행: {translated}건, 용어집 적용: {glossary_count}건")


if __name__ == "__main__":
    main()
