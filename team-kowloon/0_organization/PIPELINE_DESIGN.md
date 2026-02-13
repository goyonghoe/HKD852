# SSBL 아트 명세서 제작 파이프라인 설계

## 🎯 핵심 개념

**Layer 2 = AI의 작업 테이블 (로우 데이터)**
- 사람이 요청 → Layer 2에 쌓임
- AI가 검토/처리 → Layer 2 업데이트
- 최종 명세서 생성 → Layer 2 기반

---

## 📋 3단계 파이프라인

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Step 1: 요청 작성                                               │
│  ├─ Input: "TAEYANG 컨셉아트 5개 필요"                           │
│  ├─ Process: Input Handler가 Layer 2 형식으로 변환               │
│  └─ Output: Layer 2 데이터에 추가                                │
│                                                                 │
│                          ↓                                       │
│                                                                 │
│  Step 2: 검토 및 평가                                            │
│  ├─ Input: Layer 2 데이터                                       │
│  ├─ Process: Review Agent가 검토                                │
│  │   • 완성도 체크 (사이즈 누락? 담당자 누락?)                    │
│  │   • 우선순위 검증                                             │
│  │   • 의존성 확인                                               │
│  │   • 다음 액션 결정                                            │
│  └─ Output: 검토 결과 + 액션 리스트                              │
│                                                                 │
│                          ↓                                       │
│                                                                 │
│  Step 3: 명세서 제작                                             │
│  ├─ Input: 검증된 Layer 2 데이터                                │
│  ├─ Process: Spec Generator가 명세서 생성                        │
│  │   • 아티스트별 그룹핑                                         │
│  │   • 우선순위별 정렬                                           │
│  │   • 시각화 (차트, 진행률)                                     │
│  │   • Excel/PDF 형식 export                                   │
│  └─ Output: 최종 명세서 (인간용)                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 단계별 상세 설계

### Step 1: 요청 작성 (이미 완성!)

**현재 상태: ✅ 완료**

**도구:**
- `input_handler.py` (이미 구현됨)

**사용 방법:**
```python
handler = InputHandler()

# 방법 1: 빠른 입력
handler.add_resource_quick("TAEYANG 컨셉아트")

# 방법 2: 대화형 입력
handler.add_resource_interactive()  # 단계별 질문
```

**결과:**
- Layer 2에 새 행 추가
- ID, 타임스탬프 자동 생성
- 우선순위 자동 설정

---

### Step 2: 검토 및 평가 (구현 필요)

**목적:** Layer 2 데이터 품질 검증 + 다음 액션 결정

#### 2.1 Review Agent 설계

```python
class ReviewAgent:
    """명세서 검토 Agent"""

    def review(self, resource_id: int) -> ReviewResult:
        """
        리소스 검토

        체크 항목:
        1. 필수 필드 완성도
           - artist, resource_type, category_main 존재?
        2. 선택 필드 완성도
           - size (width, height) 있음?
           - 담당자 지정됨?
        3. 논리적 검증
           - 우선순위와 마감일 일치?
           - 의존성 있는 리소스 먼저 완료?
        4. 다음 액션 제안
           - "사이즈 정보 입력 필요"
           - "아트 담당자 지정 필요"
           - "작업 시작 가능"
        """
        pass

    def review_all(self) -> ProjectReview:
        """
        전체 프로젝트 검토

        산출물:
        1. 완성도 점수 (0-100)
        2. 누락 항목 리스트
        3. 다음 할일 우선순위
        4. 예상 작업 시간
        """
        pass
```

#### 2.2 검토 기준

**완성도 등급:**
- 🟢 **완료 (100%)**: 모든 필드 입력, 작업 시작 가능
- 🟡 **진행 중 (50-99%)**: 일부 필드 누락, 추가 정보 필요
- 🔴 **불완전 (0-49%)**: 필수 필드 누락, 작업 불가

**자동 체크 항목:**
```python
checks = {
    "필수": [
        "artist 존재?",
        "resource_type 존재?",
        "category_main 존재?",
    ],
    "권장": [
        "size_width, size_height 존재?",
        "owner_art 지정됨?",
        "due_date 설정됨?",
    ],
    "검증": [
        "우선순위 high면 마감일 7일 이내?",
        "의존 리소스 완료됨?",
    ]
}
```

#### 2.3 다음 액션 결정

**액션 타입:**
1. **정보 보완**: 사이즈, 담당자 등 누락 정보 입력
2. **승인 대기**: 검토 완료, 승인 필요
3. **작업 시작**: 모든 조건 만족, 아트팀 작업 시작
4. **보류**: 의존성 있는 작업 완료 대기

**예시 출력:**
```
리소스 ID 1: TAEYANG - 포토카드 초상
  완성도: 🟡 75%
  누락 항목:
    - 아트 담당자 미지정
    - 마감일 미설정
  다음 액션:
    1. 아트 담당자 지정 (필수)
    2. 마감일 설정 (권장)
  예상 소요 시간: 2일
```

---

### Step 3: 명세서 제작 (구현 필요)

**목적:** Layer 2 → 인간 친화적 최종 문서

#### 3.1 Spec Generator 설계

```python
class SpecGenerator:
    """명세서 생성기"""

    def generate_excel(self, output_path: str):
        """
        Excel 명세서 생성

        구조:
        - Sheet 1: 요약 (통계, 진행률)
        - Sheet 2: 아티스트별 상세
        - Sheet 3: 우선순위별 정렬
        - Sheet 4: 타임라인 (마감일 기준)
        """
        pass

    def generate_pdf(self, output_path: str):
        """PDF 명세서 생성 (프레젠테이션용)"""
        pass

    def generate_html(self, output_path: str):
        """HTML 대시보드 생성 (실시간 조회용)"""
        pass
```

#### 3.2 명세서 템플릿

**Sheet 1: 프로젝트 요약**
```
┌─────────────────────────────────────────────┐
│  SSBL 아트 리소스 명세서                      │
│  생성일: 2026-02-01                          │
├─────────────────────────────────────────────┤
│  전체 진행률: ████████░░ 80%                 │
│                                             │
│  아티스트별 현황:                             │
│  • TAEYANG:    ████████░░ 12/15 (80%)       │
│  • JEON SOMI:  ██████░░░░ 9/15 (60%)        │
│  • MEOVV:      ████░░░░░░ 6/15 (40%)        │
│  • ADP:        ██████████ 15/15 (100%)      │
│                                             │
│  우선순위별:                                  │
│  • High (29개):    🔴 18개 남음              │
│  • Medium (32개):  🟡 25개 남음              │
│                                             │
│  마감 임박:                                   │
│  • 3일 이내: 5건                             │
│  • 7일 이내: 12건                            │
└─────────────────────────────────────────────┘
```

**Sheet 2: 아티스트별 상세**
```
[TAEYANG - Quintessence]

ID  리소스                사이즈      담당자    상태        마감일      완성도
1   포토카드 초상         380x512     김OO     진행중      2026-02-05   🟡 70%
2   엠블럼 이미지         280x40      미정      대기        -           🔴 30%
3   프로필 이미지         128x128     김OO     완료        -           🟢 100%
...
```

**Sheet 3: 우선순위별 정렬**
```
[High Priority - 긴급]

순서  아티스트      리소스                상태        마감일
1     TAEYANG      포토카드 초상         진행중      D-3
2     JEON SOMI    이벤트 패스 배너      대기        D-5
3     MEOVV        픽업 뽑기 배경        대기        D-7
...
```

---

## 🚀 구현 순서 제안

### Phase A: Review Agent 구현 (1단계)

**목표:** Layer 2 데이터 검토 자동화

```
구현 항목:
├── review_agent.py
│   ├── ReviewAgent 클래스
│   ├── check_completeness() - 완성도 체크
│   ├── validate_logic() - 논리 검증
│   └── suggest_actions() - 다음 액션 제안
│
└── 테스트
    ├── 완성도 75% 리소스 검토
    ├── 누락 항목 자동 감지
    └── 액션 리스트 생성
```

**산출물:**
```python
# 사용 예시
reviewer = ReviewAgent()
result = reviewer.review(resource_id=1)

print(f"완성도: {result.score}%")
print(f"누락 항목: {result.missing_fields}")
print(f"다음 액션: {result.next_actions}")
```

### Phase B: Spec Generator 구현 (2단계)

**목표:** 인간용 명세서 자동 생성

```
구현 항목:
├── spec_generator.py
│   ├── SpecGenerator 클래스
│   ├── generate_excel() - Excel 명세서
│   ├── generate_summary() - 요약 시트
│   └── generate_by_artist() - 아티스트별 시트
│
└── 템플릿
    ├── excel_template.xlsx - Excel 템플릿
    └── styles.py - 스타일 정의
```

**산출물:**
```python
# 사용 예시
generator = SpecGenerator()
generator.generate_excel("SSBL_명세서_최종.xlsx")

# → Excel 파일 자동 생성
# → 아티스트별, 우선순위별 시트 포함
# → 차트, 진행률 자동 생성
```

### Phase C: 자동화 워크플로우 (3단계)

**목표:** 전체 파이프라인 통합

```
워크플로우:
1. 요청 입력 (Input Handler)
   ↓
2. 자동 검토 (Review Agent)
   ↓
3. 승인/수정 (사용자)
   ↓
4. 명세서 생성 (Spec Generator)
   ↓
5. 배포 (이메일, Slack 등)
```

---

## 📝 다음 단계 제안

**어떤 것부터 만들까요?**

### Option 1: Review Agent 먼저 (추천)
- Layer 2 데이터 품질 향상
- 누락 항목 자동 감지
- 바로 실용적

### Option 2: Spec Generator 먼저
- 최종 결과물 먼저 보기
- 시각적으로 만족감
- 데이터 품질은 나중에

### Option 3: 간단한 프로토타입
- Review + Generator 최소 기능
- 전체 흐름 먼저 완성
- 점진적 개선

---

## 🎯 제안하는 다음 액션

**1단계: Review Agent 프로토타입**
```python
# 이런 기능부터 시작
reviewer = ReviewAgent()

# 리소스 1개 검토
result = reviewer.review_one(resource_id=1)
print(result.completeness_score)  # 75%
print(result.missing_fields)      # ["owner_art", "due_date"]

# 전체 프로젝트 검토
summary = reviewer.review_all()
print(summary.total_resources)    # 61개
print(summary.complete_count)     # 12개 완료
print(summary.incomplete_count)   # 49개 미완료
```

**2단계: 간단한 Excel 생성**
```python
# 기본 명세서 생성
generator = SpecGenerator()
generator.generate_simple_excel("명세서.xlsx")

# → 아티스트별 시트 자동 생성
# → 기본 통계 포함
```

어떤 것부터 시작할까요? 🚀
