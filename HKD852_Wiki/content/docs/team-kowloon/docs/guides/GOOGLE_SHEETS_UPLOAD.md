# Google Sheets 업로드 가이드

명세서를 Google Sheets에 업로드하여 팀원들과 공유하는 방법

---

## 🎯 목표

생성된 명세서 CSV 파일들을 Google Sheets에 업로드하여:

- 팀원들이 쉽게 확인 가능
- 실시간 협업 가능
- 필터링, 정렬 등 Google Sheets 기능 활용

---

## 📋 업로드할 파일

`spec_generator.py` 실행 시 자동으로 생성됩니다:

| 파일                         | 탭 이름          | 내용                  |
| ---------------------------- | ---------------- | --------------------- |
| `명세서/명세서_요약.csv`     | 명세서\_요약     | 프로젝트 전체 통계    |
| `명세서/명세서_전체목록.csv` | 명세서\_전체목록 | 모든 리소스 상세 정보 |
| `명세서/명세서_우선순위.csv` | 명세서\_우선순위 | 우선순위별 작업 목록  |

---

## 🚀 업로드 방법

### 방법 1: 수동 업로드 (추천)

가장 간단하고 확실한 방법입니다.

**단계:**

1. **Google Sheets 열기**

   ```
   https://docs.google.com/spreadsheets/d/1wzyjG6pRK53DnhPAL_XNVeMrclovMGnbWQ4xpBBLEmQ/edit
   ```

2. **CSV 파일 가져오기** (3번 반복)
   - 메뉴: `파일` > `가져오기`
   - `업로드` 탭 클릭
   - CSV 파일 선택 (드래그 또는 찾아보기)
   - 가져오기 위치: **새 시트 삽입** 선택
   - 구분 기호 유형: **쉼표** 또는 **자동 감지**
   - `데이터 가져오기` 클릭

3. **시트 이름 변경**
   - 생성된 시트 탭에서 우클릭 > `이름 바꾸기`
   - 각각 다음 이름으로 변경:
     - `명세서_요약`
     - `명세서_전체목록`
     - `명세서_우선순위`

**완료!** ✅

---

### 방법 2: 스크립트 가이드 사용

대화형 가이드를 따라 업로드합니다.

```bash
python3 upload_to_sheets.py
```

이 스크립트는:

- ✅ CSV 파일 존재 확인
- 📋 단계별 업로드 가이드 제공
- 🌐 Google Sheets를 브라우저에서 자동으로 열기

---

### 방법 3: 자동 업로드 (고급)

Google Sheets API를 사용한 완전 자동화 (선택 사항)

**필요 조건:**

- Python 라이브러리 설치: `gspread`, `google-auth`
- Google Cloud 서비스 계정 생성
- 서비스 계정 JSON 키 파일

**설치:**

```bash
pip install gspread google-auth
```

**서비스 계정 설정:**

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택 또는 생성
3. `API 및 서비스` > `사용자 인증 정보` 이동
4. `사용자 인증 정보 만들기` > `서비스 계정` 선택
5. 서비스 계정 생성 후 `키 추가` > `새 키 만들기` (JSON)
6. 다운로드한 JSON 파일을 `service_account_key.json`으로 저장
7. **중요:** Google Sheets를 서비스 계정 이메일과 공유
   - 예: `your-service-account@project.iam.gserviceaccount.com`
   - 편집 권한 부여

**실행:**

```bash
python3 auto_upload_to_sheets.py
```

---

## 🎨 업로드 후 서식 적용 (선택 사항)

명세서를 더 보기 좋게 만들기:

### 1. 헤더 서식

- 첫 번째 행 선택
- 배경색: 회색 (#eeeeee)
- 글꼴: 굵게
- 텍스트 정렬: 가운데

### 2. 완성도 조건부 서식

`명세서_전체목록` 시트의 "완성도" 열:

- **90% 이상**: 녹색 배경
  - 형식 > 조건부 서식
  - 조건: `텍스트에 포함` > `9` 또는 `100`
  - 배경색: 연한 녹색

- **50-89%**: 노란색 배경
  - 조건: `텍스트에 포함` > `5`, `6`, `7`, `8`
  - 배경색: 연한 노란색

- **50% 미만**: 빨간색 배경
  - 조건: 그 외
  - 배경색: 연한 빨간색

### 3. 열 너비 자동 조정

- 모든 열 선택 (A열 헤더 더블클릭)
- 우클릭 > `열 크기 조정` > `데이터에 맞추기`

### 4. 고정 행

- 첫 번째 행 선택
- 보기 > 고정 > 1개 행

---

## 📊 결과 미리보기

### 명세서\_요약 시트

```
항목              | 값
------------------|----------
생성일            | 2026-02-01
총 리소스         | 61개
완료 (90% 이상)   | 0개
진행 중 (50-89%)  | 60개
불완전 (50% 미만) | 1개
평균 완성도       | 72.9%
```

### 명세서\_전체목록 시트

```
ID | 아티스트 | 리소스 타입 | 완성도 | 다음 액션
---|---------|-----------|--------|----------
1  | TAEYANG | 포토카드   | 85%    | ✅ 작업 시작 가능
2  | TAEYANG | 엠블럼     | 85%    | ✅ 작업 시작 가능
...
```

### 명세서\_우선순위 시트

```
우선순위 | ID | 아티스트 | 리소스 타입 | 완성도
--------|----|---------|-----------|---------
HIGH    | 1  | TAEYANG | 포토카드   | 85%
HIGH    | 2  | TAEYANG | 엠블럼     | 85%
...
```

---

## 🔄 정기 업데이트

명세서를 주기적으로 업데이트하려면:

### 매주 자동 생성 및 업로드

```bash
# 1. 명세서 생성
python3 spec_generator.py

# 2. Google Sheets에 업로드
python3 upload_to_sheets.py
# 또는 (자동화된 경우)
python3 auto_upload_to_sheets.py
```

### 스케줄링 (선택 사항)

**macOS/Linux cron:**

```bash
# 매주 금요일 오전 9시 실행
0 9 * * 5 cd /path/to/team-kowloon && python3 spec_generator.py && python3 auto_upload_to_sheets.py
```

**Windows 작업 스케줄러:**

- 작업 스케줄러 열기
- 새 작업 만들기
- 트리거: 매주 금요일 9:00
- 작업: `python3 spec_generator.py` 실행

---

## 🆘 문제 해결

### Q: CSV 파일이 생성되지 않았습니다

**A:** `spec_generator.py`를 먼저 실행하세요.

```bash
python3 spec_generator.py
```

### Q: 한글이 깨져서 나옵니다

**A:** CSV 파일은 UTF-8 BOM으로 저장되어 있습니다. Google Sheets 가져오기 시 "자동 감지"를 선택하면 정상 표시됩니다.

### Q: 자동 업로드 시 권한 오류가 발생합니다

**A:** Google Sheets를 서비스 계정 이메일과 공유했는지 확인하세요.

- 서비스 계정 이메일: JSON 키 파일의 `client_email` 필드
- 공유: Google Sheets > 공유 > 이메일 추가 > 편집자 권한

### Q: gspread 설치 오류

**A:** pip를 업데이트하고 다시 시도:

```bash
pip install --upgrade pip
pip install gspread google-auth
```

---

## 📝 요약

**가장 빠른 방법:**

1. `python3 spec_generator.py` 실행
2. Google Sheets 열기
3. 파일 > 가져오기로 3개 CSV 업로드
4. 시트 이름 변경

**완전 자동화 방법:**

1. `pip install gspread google-auth`
2. 서비스 계정 설정
3. `python3 auto_upload_to_sheets.py` 실행

✅ 명세서가 Google Sheets에 업로드되어 팀원들과 공유됩니다!
