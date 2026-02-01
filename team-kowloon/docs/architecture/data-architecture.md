# SSBL 아트 명세서 - AI 친화적 데이터 아키텍처 설계

## 문제 정의

**현재 상황**: 인간이 보기 쉬운 Google Sheet ≠ AI가 읽기/쓰기 쉬운 구조
**목표**: AI 워크플로우 최적화 + 인간 가독성 유지

## 3-Layer 아키텍처

### Layer 1: AI 작업 요청 양식 (Input Interface)
**목적**: AI Agent가 필요한 최소한의 정보만 물어보기

**예상 워크플로우**:
```
AI: "어떤 작업을 추가하시겠어요?"
User: "TAEYANG 컨셉 아트"

AI: "우선순위는?" (High/Medium/Low)
User: "High"

AI: "마감일은?"
User: "2024-02-15"

AI: "담당 팀은?"
User: "아트 팀"

AI: ✅ Layer 2에 데이터 저장 완료!
```

**양식 형태 후보**:
- [ ] **Option A**: 대화형 (AI가 단계별 질문)
- [ ] **Option B**: 구조화된 명령어 (`/add-art artist:TAEYANG type:concept priority:high`)
- [ ] **Option C**: 간단한 폼 (Google Forms → Sheet 자동 입력)

**필수 입력 필드** (추후 정의 필요):
- 아티스트명
- 리소스 타입
- 우선순위
- 담당 팀
- 마감일
- ...?

---

### Layer 2: AI 1차 작업물 (Data Layer)
**목적**: AI가 읽고 쓰기 최적화된 정규화된 테이블

**설계 원칙**:
1. **Flat Structure**: 병합 셀 없음, 1행 = 1데이터
2. **명확한 컬럼명**: 영어 또는 한글 일관성 (예: `artist_name`, `resource_type`)
3. **표준 데이터 타입**: 날짜는 ISO 8601, 상태는 Enum
4. **No Formatting**: 색상, 폰트 등 시각 요소 전혀 없음
5. **Auto-generated Fields**: ID, 생성일시, 수정일시 자동 추가

**예시 스키마** (초안):
```
| id | artist | resource_type | priority | status | assignee | due_date | created_at | updated_at |
|----|--------|---------------|----------|--------|----------|----------|------------|------------|
| 1  | TAEYANG| concept_art   | high     | pending| 아트팀    | 2024-02-15| 2024-02-01 | 2024-02-01 |
| 2  | SOMI   | 3d_model      | medium   | in_progress| 아트팀 | 2024-02-20| 2024-02-02 | 2024-02-03 |
```

**실제 컬럼은 함께 정의 필요**:
- [ ] 아티스트명 (TAEYANG, SOMI, MEOVV, ADP)
- [ ] 리소스 타입 (컨셉 아트, 3D 모델, 텍스처, ...)
- [ ] 우선순위 (High/Medium/Low)
- [ ] 상태 (대기/진행중/리뷰/완료)
- [ ] 담당자/팀
- [ ] 마감일
- [ ] 비고/메모
- [ ] ...?

---

### Layer 3: 인간용 시각화 (Presentation Layer)
**목적**: 프로젝트 매니저가 한눈에 현황 파악

**기능**:
- Layer 2 데이터를 읽어서 자동 생성
- 조건부 서식 (마감 임박 → 빨간색)
- 차트/그래프 (아티스트별 진행률, 팀별 워크로드)
- 피벗 테이블 (다차원 분석)
- 필터/정렬 뷰

**예시 시각화**:
```
┌─────────────────────────────────────────┐
│ TAEYANG 진행률: ████████░░ 80%          │
│ SOMI 진행률:    ██████░░░░ 60%          │
│ MEOVV 진행률:   ████░░░░░░ 40%          │
│ ADP 진행률:     ██████████ 100%         │
├─────────────────────────────────────────┤
│ 🔴 마감 임박 (3일 이내): 5건            │
│ 🟡 진행중: 12건                          │
│ 🟢 완료: 23건                            │
└─────────────────────────────────────────┘
```

**Google Sheets 수식 활용**:
- `QUERY()`: Layer 2 데이터 필터링
- `IMPORTRANGE()`: 다른 시트에서 데이터 가져오기
- `SPARKLINE()`: 미니 차트
- 조건부 서식: 자동 색상 변경

---

## AI Agent 역할 설계

### Agent 1: "Input Handler" (입력 담당)
**책임**: 사용자와 대화 → Layer 1 양식 채우기
**도구**: Claude 대화형 인터페이스
**출력**: 구조화된 JSON 또는 직접 Layer 2에 쓰기

### Agent 2: "Data Manager" (데이터 관리)
**책임**: Layer 2 CRUD 작업
**도구**: Google Sheets API/MCP
**기능**:
- Create: 새 행 추가
- Read: 특정 조건 데이터 조회
- Update: 상태 변경, 담당자 수정
- Delete: 데이터 삭제 (또는 archived 플래그)

### Agent 3: "Reporter" (리포트 생성)
**책임**: Layer 2 → Layer 3 자동 업데이트
**도구**: Google Sheets 수식, Apps Script
**트리거**: Layer 2 변경 시 자동 실행

---

## 구현 로드맵

### Phase 1: 데이터 구조 확정 ✅ 여기서 시작
- [ ] 현재 시트 구조 분석
- [ ] Layer 2 스키마 정의 (함께 결정)
- [ ] 필수 필드 vs 선택 필드 구분

### Phase 2: Layer 2 구축
- [ ] 새 Google Sheet 생성 (AI_Data_Layer)
- [ ] 컬럼 헤더 설정
- [ ] 초기 데이터 마이그레이션 (현재 시트 → Layer 2)

### Phase 3: AI Agent 개발
- [ ] Input Handler 에이전트 만들기
- [ ] Data Manager 에이전트 만들기
- [ ] 대화형 입력 테스트

### Phase 4: Layer 3 시각화
- [ ] 대시보드 시트 생성
- [ ] 자동 업데이트 수식 작성
- [ ] 차트/그래프 추가

---

## 다음 단계: 함께 결정할 사항

1. **현재 시트 구조 확인**: 어떤 컬럼들이 있는지 보고 싶습니다
2. **Layer 2 스키마 설계**: 어떤 필드가 정말 필요한가?
3. **AI 입력 방식 선택**: 대화형 vs 명령어 vs 폼?
4. **우선순위 결정**: 어떤 기능부터 만들까?

---

## 예상 효과

**Before (현재)**:
- 사람: 시트 열고 → 수동 입력 → 수동 정리
- AI: 복잡한 구조 파싱 어려움

**After (3-Layer)**:
- 사람: AI에게 "TAEYANG 컨셉 아트 추가해줘" → 끝
- AI: Layer 2에 깔끔하게 저장
- 사람: Layer 3 대시보드에서 한눈에 확인
