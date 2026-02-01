# SSBL 아트 리소스 관리 시스템 - 전체 구조도

## 📊 시스템 전체 개요

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SSBL 아트 리소스 관리 시스템                          │
│                                                                     │
│  목표: 복잡한 Google Sheets → AI가 쉽게 읽고 쓰는 구조로 변환           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ 3-Layer 아키텍처

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Layer 1: 인간용                               │
│                     (Human-Friendly)                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Google Sheets - 원본 시트                                           │
│  https://docs.google.com/.../edit                                  │
│                                                                     │
│  ┌──────────────────────────────────────────┐                      │
│  │  [SSBL] 런칭 준비                         │                      │
│  ├──────────────────────────────────────────┤                      │
│  │  일감 대분류  │ 일감 그룹      │ 리소스   │                      │
│  │  신규 앨범    │ TAEYANG - Q   │ 포토카드  │  ← 병합 셀          │
│  │  (병합)      │ (병합)        │ 엠블럼   │                      │
│  │  (병합)      │ (병합)        │ 프로필   │                      │
│  └──────────────────────────────────────────┘                      │
│                                                                     │
│  문제점: AI가 읽기 어려움 (병합, 시각 구조)                            │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ ① 변환 스크립트 실행
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Layer 2: AI용                                │
│                      (AI-Friendly)                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Google Sheets - Layer2_Data 탭 + 로컬 CSV                          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ id │ artist  │ album        │ resource_type │ status      │  │
│  ├────┼─────────┼──────────────┼───────────────┼─────────────┤  │
│  │ 1  │ TAEYANG │ Quintessence │ 포토카드 초상   │ pending    │  │
│  │ 2  │ TAEYANG │ Quintessence │ 엠블럼        │ pending    │  │
│  │ 3  │ TAEYANG │ Quintessence │ 프로필        │ pending    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  특징: Flat, 1행=1리소스, 병합 없음                                   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ ② AI Agent가 처리
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Layer 3: 시각화 (예정)                           │
│                    (Visualization)                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  대시보드, 차트, 진행률 표시                                           │
│  (아직 구현 안 됨 - Phase 4)                                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🤖 AI Agent 구조

```
┌─────────────────────────────────────────────────────────────────────┐
│                          AI Agents                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Input Handler (입력 담당)                                     │  │
│  │  [input_handler.py]                                          │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │  • 사용자와 대화                                               │  │
│  │  • "TAEYANG 컨셉아트 추가해줘"                                  │  │
│  │  • 필요한 정보만 물어봄                                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                          │                                          │
│                          │ 전달                                      │
│                          ▼                                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Data Manager (데이터 관리)                                    │  │
│  │  [data_manager.py]                                           │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │  • Layer 2 읽기/쓰기                                           │  │
│  │  • CRUD 작업 (Create, Read, Update, Delete)                 │  │
│  │  • 검색, 필터링, 통계                                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                          │                                          │
│                          │ 저장                                      │
│                          ▼                                          │
│            Layer 2 (Google Sheets + 로컬 CSV)                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 데이터 흐름 (전체 프로세스)

### 초기 설정 (한 번만)

```
Step 1: Layer 1 (원본) 준비
┌─────────────────────────┐
│ Google Sheets           │
│ (원본 아트 명세서)        │  ← 사용자가 이미 가지고 있음
└─────────────────────────┘
          │
          │ ① convert_to_layer2.py 실행
          ▼
┌─────────────────────────┐
│ Layer 2 CSV 생성        │
│ (SSBL_Layer2.csv)       │  ← 자동 생성됨
└─────────────────────────┘
          │
          │ ② Google Sheets에 업로드
          ▼
┌─────────────────────────┐
│ Google Sheets           │
│ Layer2_Data 탭          │  ← Layer 2 데이터 저장
└─────────────────────────┘

✅ 설정 완료! 이제 AI Agent 사용 가능
```

### 일상 사용 (매일)

```
사용자 요청
    │
    │ "TAEYANG 리소스 조회해줘"
    ▼
┌──────────────────┐
│ Input Handler    │  ← 대화형 인터페이스
└──────────────────┘
    │
    │ dm.filter(artist="TAEYANG")
    ▼
┌──────────────────┐
│ Data Manager     │  ← Layer 2 읽기
└──────────────────┘
    │
    │ ① Google Sheets에서 읽기
    ▼
┌──────────────────┐
│ Layer 2 데이터   │
└──────────────────┘
    │
    │ ② 결과 반환
    ▼
┌──────────────────┐
│ 사용자            │  ← "15개 발견!"
└──────────────────┘
```

---

## 👤 당신이 할 일 (사용 시나리오)

### 시나리오 1: 데이터 조회

```python
# Python 코드 3줄
from data_manager import ArtResourceDataManager

dm = ArtResourceDataManager()
resources = dm.filter(artist="TAEYANG")  # TAEYANG 리소스만
print(f"{len(resources)}개 발견!")      # → 15개 발견!
```

**일어나는 일:**
1. Data Manager가 Google Sheets Layer2_Data 탭 읽음
2. TAEYANG만 필터링
3. 결과 반환

### 시나리오 2: 새 리소스 추가

```python
from input_handler import InputHandler

handler = InputHandler()
handler.add_resource_quick("TAEYANG 새리소스")
```

**일어나는 일:**
1. Input Handler가 자동으로 필드 채움:
   - artist = "TAEYANG"
   - resource_type = "새리소스"
   - priority = "high" (자동 설정)
   - status = "pending"
   - ID = 자동 증가
   - 타임스탬프 = 자동 생성
2. Data Manager가 로컬 CSV에 저장
3. 완료!

### 시나리오 3: 상태 변경

```python
handler.update_status(resource_id=1, new_status="in_progress")
```

**일어나는 일:**
1. ID 1번 리소스 찾기
2. status를 "in_progress"로 변경
3. updated_at 자동 갱신
4. 로컬 CSV에 저장

---

## 🎯 핵심 포인트

### 당신은 2가지만 알면 됩니다:

#### 1. **데이터 조회/검색**
```python
dm = ArtResourceDataManager()

# 전체 조회
all_data = dm.fetch()

# 필터링
taeyang = dm.filter(artist="TAEYANG")

# 검색
results = dm.search("포토카드")

# 통계
stats = dm.stats()
```

#### 2. **데이터 추가/수정**
```python
handler = InputHandler()

# 빠른 추가
handler.add_resource_quick("TAEYANG 테스트")

# 상태 변경
handler.update_status(1, "completed")

# 담당자 지정
handler.assign_owner(1, "홍길동", "art")
```

---

## 🗂️ 파일 역할

```
team-kowloon/
│
├── config.json                    ← 설정 (Google Sheets URL)
│
├── convert_to_layer2.py           ← Layer 1 → Layer 2 변환
│   (초기 설정 시 한 번만 실행)
│
├── data_manager.py                ← Layer 2 CRUD
│   (데이터 읽기/쓰기 핵심)
│
├── input_handler.py               ← 대화형 입력
│   (사용자 인터페이스)
│
├── demo.py                        ← 모든 기능 테스트
│   (연습용)
│
└── 명세서/
    ├── SSBL_아트명세서_새시트.csv  ← Layer 1 (원본)
    └── SSBL_Layer2_새시트.csv      ← Layer 2 (AI용)
```

---

## 🚀 실제 사용 예시

### 예시 1: "TAEYANG의 완료되지 않은 작업 보여줘"

```python
dm = ArtResourceDataManager()
tasks = dm.filter(artist="TAEYANG", status="pending")
print(f"{len(tasks)}개 남음")
```

### 예시 2: "새 리소스 3개 추가"

```python
handler = InputHandler()
handler.add_resource_quick("TAEYANG 컨셉아트1")
handler.add_resource_quick("TAEYANG 컨셉아트2")
handler.add_resource_quick("TAEYANG 컨셉아트3")
```

### 예시 3: "포토카드 작업 진행 상황"

```python
dm = ArtResourceDataManager()
photocard = dm.search("포토카드")

pending = [r for r in photocard if r.status == "pending"]
in_progress = [r for r in photocard if r.status == "in_progress"]
completed = [r for r in photocard if r.status == "completed"]

print(f"대기: {len(pending)}개")
print(f"진행중: {len(in_progress)}개")
print(f"완료: {len(completed)}개")
```

---

## 📝 요약

**만든 것:**
1. ✅ 복잡한 Google Sheets → 정규화된 데이터
2. ✅ AI가 쉽게 읽고 쓸 수 있는 구조
3. ✅ Python 코드로 간단하게 사용 가능

**당신이 할 일:**
1. 🎯 `demo.py` 실행해서 연습
2. 🎯 필요할 때 Python 코드 3줄로 조회/추가
3. 🎯 끝!

**핵심:**
```
복잡한 시트 → AI 친화적 데이터 → 간단한 코드로 사용
```
