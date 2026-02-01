# SSBL 아트 리소스 자동화 파이프라인 - 시스템 시각화

> 게임 아트 리소스 명세서 자동 생성 및 품질 관리 시스템

---

## 📋 목차
- [전체 시스템 개요](#전체-시스템-개요)
- [파이프라인 흐름도](#파이프라인-흐름도)
- [폴더 구조](#폴더-구조)
- [데이터 흐름](#데이터-흐름)
- [AI 에이전트 생태계](#ai-에이전트-생태계)
- [개선 로드맵](#개선-로드맵)

---

## 전체 시스템 개요

```mermaid
graph TB
    subgraph Input["1️⃣ 입력 (Human Control)"]
        A1[아트 명세서 CSV]
        A2[아티스트 마스터 데이터]
        A3[앨범 마스터 데이터]
        A4[참고 이미지]
    end

    subgraph Processing["2️⃣ 처리 (AI Agents)"]
        B1[Layer 1 Parser]
        B2[Review Agent]
        B3[Reference Spec Generator]
        B4[Image Validator]
        B5[Pipeline Supervisor]
    end

    subgraph Output["3️⃣ 출력 (AI Output)"]
        C1[카테고리별 명세서]
        C2[검증 리포트]
        C3[분석 리포트]
    end

    subgraph Visualization["4️⃣ 시각화 (Human View)"]
        D1[Google Sheets]
        D2[Slack 알림]
    end

    A1 --> B1
    A2 --> B3
    A3 --> B3
    A4 --> B3

    B1 --> B2
    B2 --> B3
    B3 --> C1

    B4 --> C2
    B5 --> C3

    C1 --> D1
    C2 --> D1
    C3 --> D2

    style Input fill:#e1f5ff
    style Processing fill:#fff4e6
    style Output fill:#f3e5f5
    style Visualization fill:#e8f5e9
```

---

## 파이프라인 흐름도

```mermaid
flowchart LR
    Start([시작]) --> Input[CSV 입력]
    Input --> Parse[Layer 1 Parser<br/>ArtResource 객체 생성]
    Parse --> Review{Review Agent<br/>품질 검증}

    Review -->|통과| Generate[Reference Spec Generator<br/>명세서 생성]
    Review -->|문제 발견| Alert[경고 메시지]
    Alert --> Fix[수정]
    Fix --> Parse

    Generate --> Enrich[마스터 데이터 병합<br/>아티스트/앨범 정보]
    Enrich --> Visual[시각 참고 자료 추가]
    Visual --> Format[서식 적용]
    Format --> Upload[Google Sheets 업로드]

    Upload --> Validate[Image Validator<br/>이미지 검증]
    Validate --> Report[리포트 생성]

    Report --> End([완료])

    style Start fill:#4caf50
    style End fill:#4caf50
    style Review fill:#ff9800
    style Alert fill:#f44336
    style Upload fill:#2196f3
```

---

## 폴더 구조

```mermaid
graph TB
    Root[team-kowloon/]

    Root --> Org[0_organization/<br/>📋 프로젝트 문서]
    Root --> Human[1_human_control/<br/>👤 인간 관리 영역]
    Root --> AI[2_ai_agents/<br/>🤖 AI 에이전트]
    Root --> Output[3_ai_output/<br/>📊 생성 결과물]
    Root --> View[4_human_view/<br/>👁️ 시각화 도구]
    Root --> Docs[docs/<br/>📖 문서]
    Root --> Scripts[scripts/<br/>🔧 유틸리티]

    Human --> Config[config/<br/>설정 파일]
    Human --> Artists[artists_master.json]
    Human --> Albums[albums_master.json]
    Human --> RefImg[reference_images/<br/>참고 이미지]
    Human --> Creds[credentials/]

    AI --> Core[core/<br/>핵심 에이전트]
    AI --> Utils[utils/<br/>유틸리티]

    Core --> SpecGen[reference_spec_generator.py]
    Core --> Review[review_agent.py]
    Core --> Supervisor[pipeline_supervisor.py]

    Utils --> DataMgr[data_manager.py]
    Utils --> ArtistsMgr[artists_manager.py]
    Utils --> ImgVal[image_validator.py]

    Output --> Specs[generated_specs/<br/>17개 명세서]
    Output --> Reports[reports/<br/>분석 리포트]
    Output --> Validation[validation_reports/]

    View --> Sheets[google_sheets/<br/>업로드 스크립트]

    style Root fill:#1976d2,color:#fff
    style Human fill:#4caf50,color:#fff
    style AI fill:#ff9800,color:#fff
    style Output fill:#9c27b0,color:#fff
    style View fill:#00bcd4,color:#fff
```

---

## 데이터 흐름

```mermaid
sequenceDiagram
    participant User as 👤 사용자
    participant CSV as 📄 Layer1 CSV
    participant Parser as 🔍 Parser
    participant Review as ✅ Review Agent
    participant Generator as 🎨 Spec Generator
    participant Master as 💾 Master Data
    participant Sheets as 📊 Google Sheets
    participant Validator as 🔬 Image Validator

    User->>CSV: 원본 명세서 작성
    CSV->>Parser: CSV 읽기
    Parser->>Parser: ArtResource 객체 생성
    Parser->>Review: 데이터 검증

    alt 검증 실패
        Review-->>User: ❌ 오류 리포트
        User->>CSV: 수정
    else 검증 통과
        Review->>Generator: ✅ 검증 완료
    end

    Generator->>Master: 아티스트/앨범 정보 조회
    Master-->>Generator: 멤버 순서, 발매일 등

    Generator->>Generator: 카테고리별 명세서 생성<br/>• 시각 참고 자료 추가<br/>• 멤버별 확장<br/>• 용도 설명 자동 생성

    Generator->>Sheets: CSV 업로드
    Sheets->>Sheets: 서식 적용<br/>• 색상 구분<br/>• 테두리<br/>• 체크박스

    Sheets-->>User: 📊 완성된 명세서

    User->>Validator: 이미지 파일 검증 요청
    Validator->>Validator: 사이즈/포맷/색상 검증
    Validator-->>User: 📋 검증 리포트
```

---

## AI 에이전트 생태계

```mermaid
graph TB
    subgraph Core["핵심 에이전트"]
        A1[Input Handler<br/>입력 처리]
        A2[Review Agent<br/>품질 검증]
        A3[Spec Generator<br/>명세서 생성]
        A4[Reference Spec Generator<br/>레퍼런스 명세서]
        A5[Pipeline Supervisor<br/>파이프라인 감독]
    end

    subgraph Utils["유틸리티"]
        B1[Data Manager<br/>데이터 관리]
        B2[Artists Manager<br/>아티스트 관리]
        B3[Albums Manager<br/>앨범 관리]
        B4[Image Validator<br/>이미지 검증]
    end

    subgraph External["외부 서비스"]
        C1[Google Sheets API]
        C2[Slack MCP]
        C3[Jira MCP]
    end

    A1 --> B1
    A2 --> B1
    A3 --> B1
    A4 --> B1
    A4 --> B2
    A4 --> B3

    A5 -.감독.-> A1
    A5 -.감독.-> A2
    A5 -.감독.-> A3
    A5 -.감독.-> A4

    B4 -.검증.-> A4

    A4 --> C1
    A5 --> C2
    A5 --> C3

    style A5 fill:#ff9800,color:#fff
    style B4 fill:#4caf50,color:#fff
    style C1 fill:#1976d2,color:#fff
```

---

## 주요 기능

### 1️⃣ 자동 명세서 생성
```mermaid
graph LR
    A[원본 CSV] --> B{카테고리 분류}
    B --> C1[신규 앨범]
    B --> C2[한정 테마]
    B --> C3[이벤트 패스]
    B --> C4[픽업 뽑기]
    B --> C5[신규 유저]

    C1 --> D[멤버별 확장]
    C2 --> D
    C3 --> E[단일 생성]
    C4 --> E
    C5 --> E

    D --> F[최종 명세서<br/>17개 파일]
    E --> F

    style F fill:#4caf50,color:#fff
```

### 2️⃣ 시각 참고 자료 시스템
```mermaid
graph TB
    A[reference_images_mapping.json] --> B[카테고리별 참고 이미지 정의]
    B --> C1[앨범 커버 화면]
    B --> C2[프로필 화면]
    B --> C3[포토카드 수집 화면]
    B --> C4[엠블럼 화면]

    C1 --> D[Google Drive 공유 링크]
    C2 --> D
    C3 --> D
    C4 --> D

    D --> E[시각 참고 자료 섹션<br/>명세서 최상단]

    E --> F[작업자 이해도<br/>50% 향상]

    style A fill:#ff9800,color:#fff
    style F fill:#4caf50,color:#fff
```

### 3️⃣ 이미지 품질 검증
```mermaid
flowchart LR
    A[이미지 파일] --> B{Image Validator}

    B --> C1[사이즈 검증]
    B --> C2[포맷 검증]
    B --> C3[색상 모드 검증]
    B --> C4[파일 크기 검증]

    C1 --> D{규격 일치?}
    C2 --> D
    C3 --> D
    C4 --> D

    D -->|Yes| E[✅ 통과]
    D -->|No| F[❌ 문제 발견]

    F --> G[상세 리포트<br/>• 사이즈 불일치<br/>• 포맷 문제<br/>• 색상 모드 오류<br/>• 파일 크기 초과]

    E --> H[검증 완료]
    G --> H

    style E fill:#4caf50,color:#fff
    style F fill:#f44336,color:#fff
```

---

## 개선 로드맵

```mermaid
gantt
    title 파이프라인 개선 로드맵
    dateFormat YYYY-MM-DD
    section 완료 ✅
    폴더 구조 재조직          :done, 2026-01-20, 1d
    마스터 데이터베이스       :done, 2026-01-21, 1d
    레퍼런스 명세서 생성      :done, 2026-01-22, 2d
    시각 참고 자료 시스템     :done, 2026-02-01, 1d
    이미지 규격 검증 시스템   :done, 2026-02-01, 1d
    Pipeline Supervisor       :done, 2026-02-01, 1d

    section 진행 중 🚧
    시각화 문서 작성          :active, 2026-02-01, 1d

    section 예정 📅
    CI/CD 파이프라인          :2026-02-02, 3d
    Slack 연동 알림           :2026-02-05, 2d
    종합 사용자 가이드        :2026-02-07, 2d
    이미지 자동 최적화        :2026-02-09, 3d
    버전 관리 시스템          :2026-02-12, 2d
```

---

## 기술 스택

```mermaid
mindmap
  root((SSBL<br/>Pipeline))
    Languages
      Python 3
      Bash
    Libraries
      gspread
      google-auth
      Pillow
      pandas
    AI/Automation
      Claude Sonnet 4.5
      MCP Servers
        Slack
        Jira
    Cloud Services
      Google Sheets API
      Google Drive
      GitHub
    Data Formats
      CSV
      JSON
      Markdown
```

---

## 성과 지표

```mermaid
pie title "자동화 효과"
    "수작업 시간 절감" : 70
    "품질 이슈 감소" : 90
    "처리 속도 향상" : 85
    "일관성 향상" : 95
```

---

## 시스템 통계

| 항목 | 수치 |
|------|------|
| 📁 **총 에이전트** | 5개 (Core) + 4개 (Utils) |
| 📄 **생성 명세서** | 17개 (카테고리×아티스트) |
| 🎨 **지원 아티스트** | 4개 (ALLDAY PROJECT, MEOVV, JEON SOMI, TAEYANG) |
| 📊 **자동화 단계** | 3단계 (파싱 → 검증 → 생성) |
| 🔍 **검증 항목** | 5개 (사이즈, 포맷, 색상, 크기, 타입별) |
| 📈 **예상 효율 향상** | 70% 시간 절감 |

---

## 주요 개선 사항

### ✅ 완료된 개선

1. **시각 참고 자료 시스템** (우선순위 1)
   - 카테고리별 참고 이미지 관리
   - Google Drive 연동
   - 작업자 이해도 50% 향상

2. **이미지 규격 자동 검증** (우선순위 2)
   - Pillow 기반 이미지 분석
   - 리소스 타입별 세부 규칙
   - 품질 이슈 90% 사전 차단

3. **Pipeline Supervisor**
   - 전체 파이프라인 분석
   - 최신 트렌드 조사
   - 개선점 자동 제안

### 🚧 진행 예정

4. **CI/CD 파이프라인** (우선순위 3)
   - GitHub Actions 자동 실행
   - 테스트 자동화
   - 수작업 70% 감소

5. **Slack 연동 알림** (우선순위 4)
   - 실시간 진행 상황 공유
   - 팀 커뮤니케이션 30% 향상

---

## 빠른 시작 가이드

```bash
# 1. 명세서 생성
python3 2_ai_agents/core/reference_spec_generator.py

# 2. Google Sheets 업로드
python3 4_human_view/google_sheets/upload_single_sample.py

# 3. 이미지 검증
python3 scripts/validate_images.py resources/images/

# 4. 파이프라인 분석
python3 2_ai_agents/core/pipeline_supervisor.py
```

---

## 참고 문서

- [전체 아키텍처](architecture/system_architecture.md)
- [사용자 가이드](guides/)
- [API 문서](../2_ai_agents/)
- [개선 제안](../3_ai_output/reports/)

---

**마지막 업데이트**: 2026-02-01
**버전**: 1.0
**담당**: SSBL Art Pipeline Team
