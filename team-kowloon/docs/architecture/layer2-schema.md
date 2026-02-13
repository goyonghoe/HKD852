# Layer 2: AI 작업 데이터 스키마

## 설계 원칙
1. **Flat Structure**: 병합 셀 없음, 1행 = 1개의 아트 리소스
2. **명확한 컬럼명**: 영어 snake_case 또는 한글 일관성
3. **표준 데이터 타입**: ISO 8601 날짜, Enum 상태값
4. **No Formatting**: 색상/폰트 없음, 순수 데이터만
5. **Auto-generated Fields**: ID, 타임스탬프 자동 생성

## 스키마 정의

### 주요 테이블: `art_resources`

| 컬럼명 (영문) | 컬럼명 (한글) | 데이터 타입 | 필수 | 설명 | 예시 |
|--------------|-------------|-----------|-----|------|------|
| `id` | ID | INT | ✅ | 자동 증가 고유 ID | 1, 2, 3... |
| `project` | 프로젝트 | STRING | ✅ | 프로젝트명 | SSBL |
| `category_main` | 일감_대분류 | STRING | ✅ | 최상위 카테고리 | 신규 앨범 업데이트, 한정 테마 포토카드 업데이트 |
| `artist` | 아티스트 | STRING | ✅ | 아티스트명 | TAEYANG, JEON SOMI, MEOVV, ADP |
| `album` | 앨범 | STRING | ⚠️ | 앨범/프로젝트명 | Quintessence, Chaotic & Confused, BURNING UP, ALLDAY PROJECT |
| `resource_type` | 리소스_타입 | STRING | ✅ | 구체적 리소스 유형 | 일반 테마 포토카드 초상, 엠블럼 이미지 |
| `size_width` | 너비 | INT | ⚠️ | 이미지 너비 (픽셀) | 380, 512, 1280 |
| `size_height` | 높이 | INT | ⚠️ | 이미지 높이 (픽셀) | 512, 128, 1280 |
| `size_note` | 사이즈_비고 | STRING | ❌ | 사이즈 미정 시 메모 | ~280x40, (미정) |
| `owner_planning` | 기획_담당자 | STRING | ❌ | 기획 담당자명 | 고용회, 박상헌 |
| `owner_art` | 아트_담당자 | STRING | ❌ | 아트 담당자명 | 홍길동 |
| `detail_link` | 상세_설명_링크 | URL | ❌ | 상세 설명 시트 URL | https://... |
| `status` | 상태 | ENUM | ✅ | 작업 상태 | pending, in_progress, completed, blocked |
| `translation_status` | 번역_상태 | ENUM | ✅ | 번역 필요 여부 | required, not_required, completed |
| `languages` | 작업_언어 | STRING | ❌ | 필요한 언어 목록 | KR,EN,JP |
| `priority` | 우선순위 | ENUM | ✅ | 작업 우선순위 | high, medium, low |
| `due_date` | 마감일 | DATE | ❌ | 작업 마감일 | 2026-03-31 |
| `notes` | 비고 | TEXT | ❌ | 기타 메모 | ... |
| `created_at` | 생성일시 | DATETIME | ✅ | 데이터 생성 시각 (자동) | 2026-02-01T13:30:00Z |
| `updated_at` | 수정일시 | DATETIME | ✅ | 데이터 수정 시각 (자동) | 2026-02-01T14:15:00Z |

### Enum 값 정의

**`status` (작업 상태)**:
- `pending`: 대기 중 (시작 안 함)
- `in_progress`: 진행 중
- `review`: 리뷰 중
- `completed`: 완료
- `blocked`: 블로킹 (의존성 문제 등)
- `cancelled`: 취소됨

**`translation_status` (번역 상태)**:
- `not_required`: 번역 불필요
- `required`: 번역 필요 (대기)
- `in_progress`: 번역 진행 중
- `completed`: 번역 완료

**`priority` (우선순위)**:
- `high`: 높음 (긴급)
- `medium`: 보통
- `low`: 낮음

**`languages` 포맷**:
- 쉼표로 구분된 ISO 639-1 코드
- 예: `KR,EN,JP` 또는 `KR` 또는 `EN,JP`

---

## 현재 시트 → Layer 2 매핑 규칙

### 1. 병합 셀 처리
**Before (현재 시트)**:
```
일감 대분류          | 일감 그룹 분류               | 리소스 구분
신규 앨범 업데이트    | TAEYANG - Quintessence      | 일반 테마 포토카드 초상
(병합됨)            | (병합됨)                    | 엠블럼 이미지
(병합됨)            | (병합됨)                    | 프로필 이미지
```

**After (Layer 2)**:
```
id | category_main        | category_group              | resource_type
1  | 신규 앨범 업데이트    | TAEYANG - Quintessence      | 일반 테마 포토카드 초상
2  | 신규 앨범 업데이트    | TAEYANG - Quintessence      | 엠블럼 이미지
3  | 신규 앨범 업데이트    | TAEYANG - Quintessence      | 프로필 이미지
```
→ **모든 행에 명시적으로 값 반복**

### 2. 상태 값 정규화

**Before**: `번역` 컬럼 = "불필요", "미완료", (빈 셀)
**After**: `translation_status` = `not_required`, `required`, `required`

**Before**: `아트 작업 완료` 컬럼 = "FALSE", "TRUE", (빈 셀)
**After**: `status` = `pending`, `completed`, `pending`

### 3. 사이즈 파싱

**Before**: `사이즈 (W x H)` = "380x512", "~280x40", "(미정)"
**After**:
- `380x512` → `size_width=380, size_height=512, size_note=null`
- `~280x40` → `size_width=280, size_height=40, size_note="approximate"`
- `(미정)` → `size_width=null, size_height=null, size_note="TBD"`

### 4. 언어 파싱

**Before**: `작업 필요 언어` = "KR / EN / JP", "KR", (빈 셀)
**After**: `languages` = "KR,EN,JP", "KR", null

### 5. 우선순위 추론

현재 시트에는 우선순위가 명시되어 있지 않음. 초기값 설정 필요:
- **Option A**: 모든 항목 `priority=medium` (기본값)
- **Option B**: `category_main` 기반 자동 설정
  - "신규 앨범 업데이트" → `high`
  - "한정 테마 포토카드 업데이트" → `medium`
  - "이벤트 패스" → `high`
  - "픽업 뽑기 상점" → `medium`
- **Option C**: 사용자가 수동 입력

---

## 예시 데이터 (Layer 2 형식)

```csv
id,project,category_main,artist,album,resource_type,size_width,size_height,size_note,owner_planning,owner_art,detail_link,status,translation_status,languages,priority,due_date,notes,created_at,updated_at
1,SSBL,신규 앨범 업데이트,TAEYANG,Quintessence,일반 테마 포토카드 초상,380,512,,고용회,,,pending,not_required,KR;EN;JP,high,,첫 번째 앨범,2026-02-01T13:30:00Z,2026-02-01T13:30:00Z
2,SSBL,신규 앨범 업데이트,TAEYANG,Quintessence,엠블럼 이미지,280,40,approximate,고용회,,,pending,not_required,,,,,2026-02-01T13:30:00Z,2026-02-01T13:30:00Z
3,SSBL,신규 앨범 업데이트,TAEYANG,Quintessence,프로필 이미지,128,128,,고용회,,,pending,not_required,,,,,2026-02-01T13:30:00Z,2026-02-01T13:30:00Z
```

---

## 다음 단계

1. ✅ 스키마 정의 완료
2. ⏳ **변환 스크립트 작성**: 현재 시트 → Layer 2 데이터 변환
3. ⏳ **새 Google Sheet 생성**: Layer 2 전용 시트 (또는 새 탭)
4. ⏳ **데이터 마이그레이션**: 변환된 데이터 업로드
5. ⏳ **AI Agent 개발**: Layer 2 CRUD 에이전트

---

## 질문 및 결정 사항

### Q1: 컬럼명 언어 선택
- **Option A**: 영어 (`category_main`, `resource_type`) ← AI 친화적
- **Option B**: 한글 (`일감_대분류`, `리소스_타입`) ← 인간 친화적
- **Option C**: 혼합 (영어 컬럼명 + 한글 헤더 주석)

**추천**: Option A (영어) - AI 에이전트가 처리하기 쉬움

### Q2: 우선순위 초기값
- **Option A**: 모두 `medium`
- **Option B**: `category_main` 기반 자동 설정
- **Option C**: 수동 입력

**추천**: Option B (자동 설정) → 이후 수동 조정 가능

### Q3: 데이터 저장 위치
- **Option A**: 새 Google Sheet 생성 (SSBL_Layer2)
- **Option B**: 현재 시트에 새 탭 추가 (Layer2_Data)
- **Option C**: 로컬 CSV 파일 관리

**추천**: Option B (같은 시트 내 새 탭) - 관리 편의성

### Q4: 아티스트 정보 분리
현재 `category_group`에 "TAEYANG - Quintessence" 형식으로 저장됨.

- **Option A**: 그대로 유지
- **Option B**: 아티스트와 앨범 분리
  - `artist` = "TAEYANG"
  - `album` = "Quintessence"

**추천**: Option B (정규화) - 필터링/그룹핑 용이

---

어떤 옵션을 선택하시겠어요? 또는 스키마에 추가/수정할 사항이 있나요?
