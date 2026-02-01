# AI 에이전트 조직도

## 🎯 핵심 목표
SSBL 게임 아트 리소스 제작 명세서를 자동화하고 체계적으로 관리

## 📂 전체 폴더 구조
```
team-kowloon/
├── 0_organization/              🎯 AI 조직도 관리
│   ├── README.md               ← 지금 보고 있는 파일
│   ├── AGENTS_ROLES.md         각 에이전트 역할 및 페르소나
│   ├── PIPELINE_DESIGN.md      파이프라인 설계도
│   └── SYSTEM_DIAGRAM.md       시스템 다이어그램
│
├── 1_human_control/            👤 사람이 관리하는 영역
│   ├── reference_sheets/       레퍼런스 시트 (템플릿)
│   ├── config/                 설정 파일
│   └── credentials/            인증 정보 (gitignore)
│
├── 2_ai_agents/                🤖 AI 에이전트 코드
│   ├── core/                   핵심 에이전트
│   │   ├── input_handler.py   입력 처리
│   │   ├── review_agent.py    검토
│   │   └── spec_generator.py  명세서 생성
│   ├── utils/                  유틸리티
│   │   └── data_manager.py    데이터 관리
│   └── mcp_servers/            MCP 서버 (향후)
│
├── 3_ai_output/                📤 AI 작업 결과물
│   ├── layer2_data/            Layer2 변환 데이터
│   └── generated_specs/        생성된 명세서
│       ├── 요약/
│       ├── 신규앨범업데이트/
│       ├── 한정테마포토카드업데이트/
│       ├── 이벤트패스/
│       └── 픽업뽑기상점/
│
├── 4_human_view/               👁️ 인간용 시각화
│   └── google_sheets/          Google Sheets 연동
│
├── docs/                       📚 프로젝트 문서
│   ├── guides/                 사용 가이드
│   ├── architecture/           아키텍처 문서
│   └── analysis/               분석 문서
│
└── scripts/                    🔧 실행 스크립트
    ├── complete_pipeline_demo.py  전체 파이프라인 데모
    ├── demo.py                    간단 데모
    └── restructure.py             폴더 재구조화 도구
```

---

## 🤖 에이전트 구성

### 1. Input Handler (입력 처리 에이전트)
**위치:** [2_ai_agents/core/input_handler.py](../2_ai_agents/core/input_handler.py)

**역할:** 원본 CSV 데이터 수신 및 정제
- 페르소나: 꼼꼼한 데이터 검증자
- 입력: 사용자 요청, SSBL_Layer1.csv
- 출력: 검증된 ArtResource 객체

**주요 기능:**
- CSV 파일 파싱
- 필수 컬럼 검증
- 데이터 타입 검증
- Layer2 형식으로 변환

### 2. Review Agent (검토 에이전트)
**위치:** [2_ai_agents/core/review_agent.py](../2_ai_agents/core/review_agent.py)

**역할:** 데이터 완성도 검토 및 이슈 발견
- 페르소나: 엄격한 품질 관리자
- 입력: ArtResource 객체 리스트
- 출력: ReviewResult (완성도 점수, 이슈 리스트, 다음 액션)

**주요 기능:**
- 완성도 점수 계산 (0-100%)
- 누락 항목 발견
- 우선순위 이슈 탐지
- 다음 액션 제안

### 3. Spec Generator (명세서 생성 에이전트)
**위치:** [2_ai_agents/core/spec_generator.py](../2_ai_agents/core/spec_generator.py)

**역할:** 검토된 데이터를 바탕으로 인간 친화적인 명세서 생성
- 페르소나: 친절한 문서 작성자
- 입력: ArtResource 객체 리스트, ReviewResult
- 출력: 마크다운/CSV 명세서

**주요 기능:**
- 마크다운 명세서 생성
- CSV 명세서 생성 (Google Sheets용)
- 카테고리+앨범별 상세 시트 생성
- 요약, 우선순위별 정렬

---

## 🔄 파이프라인 흐름

```
[사용자 요청]
    ↓
[Input Handler] ──→ "데이터 정제 완료!"
    ↓
[Review Agent] ──→ "완성도 70%, 이슈 5건 발견"
    ↓
[Spec Generator] ──→ "명세서 20개 생성 완료!"
    ↓
[Google Sheets]
```

---

## 🚀 빠른 시작

### 데모 실행
```bash
cd scripts
python3 demo.py
```

### 전체 파이프라인 실행
```bash
cd scripts
python3 complete_pipeline_demo.py
```

### Google Sheets 업로드
```bash
cd 4_human_view/google_sheets
python3 auto_upload_to_sheets.py
```

---

## 📊 성공 지표

- **정확도**: 데이터 검증 오류율 < 1%
- **완성도**: 평균 완성도 > 80%
- **효율성**: 수동 작업 대비 90% 시간 단축
- **만족도**: 아티스트/기획자 만족도 > 4.5/5

---

## 🎨 향후 확장 계획

### Phase 1 (현재)
- ✅ 3단계 파이프라인 구축
- ✅ Google Sheets 연동
- ✅ 폴더 구조 체계화

### Phase 2 (예정)
- [ ] 레퍼런스 시트 기반 명세서 생성
- [ ] 멤버별 리소스 확장
- [ ] 파일명 자동 생성

### Phase 3 (향후)
- [ ] Image Validator: 이미지 파일 검증
- [ ] Asset Packager: 리소스 패키징
- [ ] Notification Agent: Slack/Discord 알림
- [ ] Dashboard Generator: 실시간 진행률 대시보드

---

## 📚 관련 문서

- [AGENTS_ROLES.md](AGENTS_ROLES.md) - 각 에이전트 역할 및 페르소나 상세
- [PIPELINE_DESIGN.md](PIPELINE_DESIGN.md) - 파이프라인 설계 문서
- [SYSTEM_DIAGRAM.md](SYSTEM_DIAGRAM.md) - 시스템 아키텍처 다이어그램
- [../docs/README.md](../docs/README.md) - 프로젝트 전체 README

---

**마지막 업데이트:** 2026-02-01
**상태:** ✅ 재구조화 완료, 정상 작동 중
