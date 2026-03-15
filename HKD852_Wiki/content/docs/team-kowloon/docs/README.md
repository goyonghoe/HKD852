# SSBL 아트 리소스 관리 시스템

AI가 쉽게 읽고 쓸 수 있는 아트 리소스 명세서 관리 시스템

---

## 🎯 핵심 개념

**3단계 파이프라인:**

```
요청 작성 → 검토 및 평가 → 명세서 제작
```

**Layer 2 = AI의 작업 테이블**

- 병합 없는 Flat 구조
- 1행 = 1리소스
- 19개 표준화된 컬럼

---

## 🚀 빠른 시작

### 전체 파이프라인 테스트

```bash
python3 complete_pipeline_demo.py
```

### 각 단계별 사용법

#### 1️⃣ 요청 작성 (리소스 추가)

```python
from input_handler import InputHandler

handler = InputHandler()

# 빠른 입력
handler.add_resource_quick("TAEYANG 컨셉아트")

# 대화형 입력
handler.add_resource_interactive()

# 상태 변경
handler.update_status(resource_id=1, new_status="in_progress")

# 담당자 지정
handler.assign_owner(resource_id=1, owner_name="홍길동", owner_type="art")
```

#### 2️⃣ 검토 및 평가 (품질 체크)

```python
from review_agent import ReviewAgent

reviewer = ReviewAgent()

# 개별 리소스 검토
result = reviewer.review_one(resource_id=1)
print(f"완성도: {result.completeness_score}%")
print(f"누락 항목: {result.missing_fields}")
print(f"다음 액션: {result.next_actions}")

# 전체 프로젝트 검토
project_review = reviewer.review_all()
print(f"총 리소스: {project_review.total_resources}개")
print(f"평균 완성도: {project_review.average_completeness}%")
```

#### 3️⃣ 명세서 제작 (최종 문서)

```python
from spec_generator import SpecGenerator

generator = SpecGenerator()

# 마크다운 명세서 생성
generator.generate_markdown("명세서/SSBL_명세서.md")

# Google Sheets용 CSV 생성
csv_files = generator.generate_csv_for_sheets()

# 텍스트 리포트
report = generator.generate_text_report()
print(report)
```

#### 4️⃣ Google Sheets 업로드

```bash
# 수동 업로드 가이드
python3 upload_to_sheets.py

# 자동 업로드 (gspread 라이브러리 필요)
python3 auto_upload_to_sheets.py
```

자세한 내용: [GOOGLE_SHEETS_UPLOAD.md](GOOGLE_SHEETS_UPLOAD.md)

---

## 📊 데이터 조회 및 검색

```python
from data_manager import ArtResourceDataManager

dm = ArtResourceDataManager()

# 전체 조회
all_resources = dm.fetch()

# 필터링
taeyang_resources = dm.filter(artist="TAEYANG")
pending_tasks = dm.filter(status="pending")
high_priority = dm.filter(priority="high")

# 검색
photocard = dm.search("포토카드")

# 통계
stats = dm.stats()
print(stats['by_artist'])
print(stats['by_status'])
```

---

## 📁 파일 구조

```
team-kowloon/
│
├── config.json                    # Google Sheets 설정
│
├── convert_to_layer2.py           # Layer 1 → Layer 2 변환 (초기 설정)
├── data_manager.py                # CRUD 작업 (핵심)
├── input_handler.py               # Step 1: 요청 작성
├── review_agent.py                # Step 2: 검토 및 평가
├── spec_generator.py              # Step 3: 명세서 제작
│
├── demo.py                        # 기본 기능 테스트
├── complete_pipeline_demo.py      # 전체 파이프라인 테스트
│
├── layer2-schema.md               # Layer 2 스키마 문서
├── SYSTEM_DIAGRAM.md              # 시스템 구조도
├── PIPELINE_DESIGN.md             # 파이프라인 설계 문서
│
└── 명세서/
    ├── SSBL_아트명세서_새시트.csv  # Layer 1 (원본)
    ├── SSBL_Layer2_새시트.csv      # Layer 2 (AI용)
    └── SSBL_명세서.md              # 생성된 명세서
```

---

## 🎨 실제 사용 예시

### 예시 1: TAEYANG 리소스 작업 현황 확인

```python
from data_manager import ArtResourceDataManager

dm = ArtResourceDataManager()

# TAEYANG 리소스만 필터링
taeyang = dm.filter(artist="TAEYANG")

# 상태별 분류
pending = [r for r in taeyang if r.status == "pending"]
in_progress = [r for r in taeyang if r.status == "in_progress"]
completed = [r for r in taeyang if r.status == "completed"]

print(f"TAEYANG 리소스: {len(taeyang)}개")
print(f"  대기: {len(pending)}개")
print(f"  진행중: {len(in_progress)}개")
print(f"  완료: {len(completed)}개")
```

### 예시 2: 긴급 작업 추가 및 확인

```python
from input_handler import InputHandler
from review_agent import ReviewAgent

# 1. 새 긴급 작업 추가
handler = InputHandler()
new_resource = handler.add_resource_quick("JEON SOMI 이벤트 배너")

# 2. 즉시 검토
reviewer = ReviewAgent()
result = reviewer.review_one(new_resource.id)

# 3. 누락 항목 확인
print(f"완성도: {result.completeness_score}%")
print(f"누락 항목: {result.missing_fields}")
print(f"다음 할일: {result.next_actions}")
```

### 예시 3: 주간 명세서 자동 생성

```python
from spec_generator import SpecGenerator

generator = SpecGenerator()

# 매주 금요일 자동 실행
generator.generate_markdown("명세서/SSBL_명세서_주간.md")
print("✅ 주간 명세서 생성 완료!")
```

---

## 📈 완성도 기준

**🟢 완료 (90% 이상)**

- 모든 필수/권장 필드 입력됨
- 작업 시작 가능

**🟡 진행 중 (50-89%)**

- 필수 필드는 있으나 권장 필드 누락
- 추가 정보 입력 필요

**🔴 불완전 (50% 미만)**

- 필수 필드 누락
- 작업 불가 상태

---

## 🔧 다음 단계 (선택 사항)

현재 시스템은 완전히 작동하며, 다음 기능은 필요시 추가 가능:

1. **자동화 워크플로우**
   - 매일/매주 자동 명세서 생성
   - Slack/이메일 알림

2. **Google Sheets 쓰기 통합**
   - 현재: 로컬 CSV에만 저장
   - 추가: Google Sheets에도 자동 업데이트

3. **대시보드**
   - HTML 실시간 대시보드
   - 차트 및 그래프

---

## 💡 팁

1. **데이터는 로컬 CSV에 저장됩니다**
   - `명세서/SSBL_Layer2_새시트.csv`
   - 필요시 Google Sheets에 수동 업로드

2. **완성도를 높이려면**
   - 사이즈 정보 입력 (size_width, size_height)
   - 담당자 지정 (owner_art, owner_planning)
   - 우선순위 설정 (priority)

3. **명세서는 자동 생성됩니다**
   - `spec_generator.py` 실행
   - 또는 `complete_pipeline_demo.py` 실행

---

## ✅ 시스템 상태

- ✅ Layer 1 → Layer 2 변환 완료 (61개 리소스)
- ✅ CRUD 작업 구현 완료
- ✅ Step 1: 요청 작성 완료
- ✅ Step 2: 검토 및 평가 완료
- ✅ Step 3: 명세서 제작 완료
- ✅ 전체 파이프라인 통합 완료

**현재 상태:** 모든 기능 정상 작동 중 🚀
