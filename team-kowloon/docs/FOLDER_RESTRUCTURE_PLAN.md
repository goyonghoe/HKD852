# Team Kowloon 폴더 구조 재정비 계획

## 📊 현재 문제점
- 루트 폴더에 42개 파일/폴더가 섞여있음
- 문서, 코드, 설정, 출력물이 구분 없이 혼재
- 역할별/용도별 구분이 불명확

---

## 🎯 새로운 폴더 구조 (제안)

```
team-kowloon/
│
├── 0_organization/                    # AI 에이전트 조직도 관리
│   ├── README.md                      # 🎯 핵심 목표, 조직도 총괄
│   ├── AGENTS_ROLES.md                # 각 에이전트 역할 및 페르소나 정의
│   ├── PIPELINE_DESIGN.md             # 파이프라인 설계도
│   └── SYSTEM_DIAGRAM.md              # 시스템 다이어그램
│
├── 1_human_control/                   # 사람이 관리하는 입력 영역
│   ├── reference_sheets/              # 레퍼런스 시트 (템플릿)
│   │   ├── ref_Constant.csv
│   │   ├── ref_신규앨범_ADP.csv
│   │   └── ref_한정테마_ADP.csv
│   │
│   ├── config/                        # 설정 파일
│   │   └── config.json
│   │
│   └── credentials/                   # 인증 정보 (gitignore)
│       └── service_account_key.json
│
├── 2_ai_agents/                       # AI 에이전트 코드
│   ├── core/                          # 핵심 에이전트
│   │   ├── input_handler.py           # 입력 처리 에이전트
│   │   ├── review_agent.py            # 검토 에이전트
│   │   └── spec_generator.py          # 명세서 생성 에이전트
│   │
│   ├── utils/                         # 유틸리티
│   │   └── data_manager.py            # 데이터 매니저
│   │
│   └── mcp_servers/                   # MCP 서버 (향후 확장)
│       └── (예정)
│
├── 3_ai_output/                       # AI 1차 작업물 결과
│   ├── layer2_data/                   # Layer2 변환 데이터
│   │   └── SSBL_Layer2_새시트.csv
│   │
│   └── generated_specs/               # 생성된 명세서 (CSV/MD)
│       ├── 요약/
│       │   ├── 명세서_요약.csv
│       │   ├── 명세서_전체목록.csv
│       │   └── 명세서_우선순위.csv
│       │
│       ├── 신규앨범업데이트/
│       │   ├── 신규앨범업데이트_ADP_ALLDAYPROJECT.csv
│       │   ├── 신규앨범업데이트_TAEYANG_Quintessence.csv
│       │   └── ...
│       │
│       ├── 한정테마포토카드업데이트/
│       │   └── ...
│       │
│       ├── 이벤트패스/
│       │   └── ...
│       │
│       ├── 픽업뽑기상점/
│       │   └── ...
│       │
│       └── SSBL_명세서.md              # 마크다운 종합 명세서
│
├── 4_human_view/                      # 인간용 시각화
│   ├── google_sheets/                 # Google Sheets 연동
│   │   ├── auto_upload_to_sheets.py
│   │   └── upload_to_sheets.py
│   │
│   └── dashboards/                    # 대시보드 (향후 확장)
│       └── (예정)
│
├── docs/                              # 프로젝트 문서
│   ├── README.md                      # 프로젝트 소개
│   ├── CLAUDE.md                      # Claude Code 가이드
│   │
│   ├── guides/                        # 사용 가이드
│   │   ├── GOOGLE_SHEETS_UPLOAD.md
│   │   ├── JSON_KEY_다운로드_가이드.md
│   │   ├── SERVICE_ACCOUNT_SETUP.md
│   │   └── NEXT_STEPS.md
│   │
│   ├── architecture/                  # 아키텍처 문서
│   │   ├── data-architecture.md
│   │   └── layer2-schema.md
│   │
│   └── analysis/                      # 분석 문서
│       └── ANALYSIS_레퍼런스시트_분석.md
│
├── scripts/                           # 실행 스크립트
│   ├── complete_pipeline_demo.py      # 전체 파이프라인 데모
│   ├── demo.py                        # 간단한 데모
│   └── convert_to_layer2.py           # Layer2 변환
│
├── .gitignore                         # Git 제외 파일
└── __pycache__/                       # Python 캐시 (gitignore)

```

---

## 📋 폴더별 역할 정의

### 0️⃣ `0_organization/` - AI 에이전트 조직도
**목적:** AI 시스템의 전체 구조와 각 에이전트의 역할 정의
**관리자:** AI + 사람 (함께 관리)
**포함:**
- 조직도 및 핵심 목표
- 각 에이전트 역할 및 페르소나
- 파이프라인 설계도
- 시스템 다이어그램

### 1️⃣ `1_human_control/` - 사람이 관리하는 영역
**목적:** 사람이 직접 수정/관리하는 입력 데이터
**관리자:** 사람 (수동 관리)
**포함:**
- 레퍼런스 시트 (템플릿)
- 설정 파일 (config.json)
- 인증 정보 (service_account_key.json)

### 2️⃣ `2_ai_agents/` - AI 에이전트 코드
**목적:** AI 에이전트 실행 코드
**관리자:** AI + 사람 (함께 개발)
**포함:**
- 핵심 에이전트 (input_handler, review_agent, spec_generator)
- 유틸리티 (data_manager)
- MCP 서버 (향후 확장)

### 3️⃣ `3_ai_output/` - AI 작업 결과물
**목적:** AI가 생성한 1차 작업물
**관리자:** AI (자동 생성)
**포함:**
- Layer2 변환 데이터
- 생성된 명세서 (카테고리별 폴더 구분)
- 마크다운 종합 명세서

### 4️⃣ `4_human_view/` - 인간용 시각화
**목적:** 사람이 보기 쉬운 형태로 변환
**관리자:** AI + 사람
**포함:**
- Google Sheets 업로드 스크립트
- 대시보드 (향후)

### 📚 `docs/` - 프로젝트 문서
**목적:** 프로젝트 이해 및 사용법 문서
**관리자:** 사람 + AI
**포함:**
- README, 가이드
- 아키텍처 문서
- 분석 문서

### 🔧 `scripts/` - 실행 스크립트
**목적:** 데모 및 유틸리티 스크립트
**관리자:** AI + 사람
**포함:**
- 파이프라인 데모
- 변환 스크립트

---

## 🎨 대안 제안: 더 심플한 구조

만약 위 구조가 너무 복잡하다면, 다음과 같이 단순화 가능:

```
team-kowloon/
├── agents/                 # AI 에이전트 (코드 + 조직도)
│   ├── README.md          # 조직도
│   ├── input_handler.py
│   ├── review_agent.py
│   ├── spec_generator.py
│   └── data_manager.py
│
├── input/                  # 사람 관리 영역
│   ├── references/
│   ├── config/
│   └── credentials/
│
├── output/                 # AI 결과물
│   ├── layer2/
│   └── specs/
│
├── visualization/          # 시각화
│   └── google_sheets/
│
├── docs/                   # 문서
│   ├── guides/
│   ├── architecture/
│   └── analysis/
│
└── scripts/                # 실행 스크립트
```

---

## ✅ 추천 방안

**더 상세한 구조 (첫 번째)** 추천:
- 역할 구분이 명확함
- 확장성 높음 (MCP, dashboard 등 추가 용이)
- 숫자 prefix로 workflow 순서 표현

---

## 🚀 다음 단계

1. 폴더 구조 승인
2. 자동 이동 스크립트 실행
3. import 경로 수정 (Python 파일들)
4. .gitignore 업데이트

**어떤 구조가 좋으신가요? 혹은 다른 제안이 있으신가요?**
