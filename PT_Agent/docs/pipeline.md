# PT Agent 파이프라인 아키텍처

## 시스템 개요

PT Agent는 프레젠테이션 제작을 자동화하는 멀티 에이전트 시스템입니다.
5개의 전문 에이전트가 협업하여 고품질의 프레젠테이션을 제작합니다.

> **Industry References**:
> - AI Agent Orchestration Patterns (Azure, AWS, LangGraph)
> - Maker-Checker Pattern
> - Sequential + Parallel Orchestration

---

## 🔄 오케스트레이션 패턴

### 적용 패턴: Coordinator + Specialists

```
╔════════════════════════════════════════════════════════════════╗
║  2025 Multi-Agent Best Practices                               ║
║                                                                ║
║  "72% of enterprise AI projects now involve multi-agent        ║
║   architectures, up from 23% in 2024"                          ║
║                                                                ║
║  핵심 원칙:                                                     ║
║  1. 단일 에이전트로 시작 → 필요시 확장                          ║
║  2. 가벼운 커뮤니케이션 (필요한 정보만 공유)                     ║
║  3. State Machine으로 결정론적 동작 보장                        ║
║  4. 명시적 상태, 전환, 재시도, 타임아웃 정의                     ║
╚════════════════════════════════════════════════════════════════╝
```

### 실행 모드

| 모드 | 설명 | 적용 상황 |
|-----|------|----------|
| **Sequential** | A → B → C 순차 실행 | 의존성 있는 작업 |
| **Parallel** | A + B 동시 실행 | 독립적 작업 |
| **Maker-Checker** | 제작 ↔ 검토 반복 | 품질 개선 사이클 |

### 에러 복구 전략

```yaml
에러_복구:
  재시도: "실패 시 최대 2회 재시도"
  대체_경로: "시각화 실패 → 콘텐츠에서 텍스트 버전 생성"
  그레이스풀_저하: "일부 기능 없이 진행 가능하면 진행"
  인간_개입: "3회 실패 시 사용자 확인 요청"
```

---

## 파이프라인 다이어그램

```mermaid
flowchart TB
    subgraph Input["📥 입력"]
        USER[("👤 사용자")]
    end

    subgraph Agents["🤖 PT Agent System"]
        subgraph Reception["1️⃣ 접수 데스크"]
            INTAKE[/"요구사항 접수"/]
            ANALYZE["요구사항 분석"]
            SPEC["스펙 문서 작성"]
        end

        subgraph Content["2️⃣ PT 내용 구성"]
            OUTLINE["개요 작성"]
            STRUCTURE["슬라이드 구조화"]
            SCRIPT["스크립트 작성"]
        end

        subgraph Visual["3️⃣ 시각화 전문가"]
            DESIGN["디자인 가이드"]
            LAYOUT["레이아웃 설계"]
            ASSETS["시각 요소 배치"]
        end

        subgraph RedTeam["4️⃣ 레드팀"]
            REVIEW["품질 검토"]
            CRITIQUE["비판적 평가"]
            SUGGEST["개선점 도출"]
        end

        subgraph Manager["5️⃣ 관리자"]
            EVALUATE["결과 평가"]
            ASSIGN["작업 분담"]
            DECIDE{{"최종 결정"}}
        end
    end

    subgraph Output["📤 출력"]
        FINAL[("✅ 최종 PT")]
    end

    %% 메인 플로우
    USER -->|"요청"| INTAKE
    INTAKE --> ANALYZE --> SPEC
    SPEC -->|"분석 결과"| OUTLINE
    OUTLINE --> STRUCTURE --> SCRIPT
    SCRIPT -->|"콘텐츠"| DESIGN
    DESIGN --> LAYOUT --> ASSETS

    %% 레드팀 검토 사이클
    ASSETS -->|"초안"| REVIEW
    REVIEW --> CRITIQUE --> SUGGEST
    SUGGEST -->|"피드백"| EVALUATE

    %% 관리자 의사결정
    EVALUATE --> DECIDE
    DECIDE -->|"승인"| FINAL
    DECIDE -->|"수정 필요: 내용"| OUTLINE
    DECIDE -->|"수정 필요: 디자인"| DESIGN
    DECIDE -->|"수정 필요: 요구사항"| ANALYZE

    %% 스타일링
    classDef inputStyle fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef outputStyle fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef receptionStyle fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef contentStyle fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef visualStyle fill:#e8eaf6,stroke:#1a237e,stroke-width:2px
    classDef redteamStyle fill:#ffebee,stroke:#b71c1c,stroke-width:2px
    classDef managerStyle fill:#e0f2f1,stroke:#004d40,stroke-width:2px

    class USER inputStyle
    class FINAL outputStyle
    class INTAKE,ANALYZE,SPEC receptionStyle
    class OUTLINE,STRUCTURE,SCRIPT contentStyle
    class DESIGN,LAYOUT,ASSETS visualStyle
    class REVIEW,CRITIQUE,SUGGEST redteamStyle
    class EVALUATE,ASSIGN,DECIDE managerStyle
```

## 상세 시퀀스 다이어그램

```mermaid
sequenceDiagram
    autonumber
    participant U as 👤 사용자
    participant R as 📋 접수 데스크
    participant C as 📝 PT 내용 구성
    participant V as 🎨 시각화 전문가
    participant T as 🔴 레드팀
    participant M as 👔 관리자

    U->>R: 프레젠테이션 요청
    activate R
    R->>R: 요구사항 분석
    R->>R: 스펙 문서 작성
    R-->>M: 분석 완료 보고
    deactivate R

    M->>C: 콘텐츠 작성 지시
    activate C
    C->>C: 개요 작성
    C->>C: 슬라이드 구조화
    C->>C: 스크립트 작성
    C-->>M: 콘텐츠 초안 완료
    deactivate C

    M->>V: 시각화 작업 지시
    activate V
    V->>V: 디자인 가이드 적용
    V->>V: 레이아웃 설계
    V->>V: 시각 요소 배치
    V-->>M: 시각화 초안 완료
    deactivate V

    loop 품질 개선 사이클
        M->>T: 검토 요청
        activate T
        T->>T: 품질 검토
        T->>T: 비판적 평가
        T-->>M: 개선점 피드백
        deactivate T

        alt 수정 필요
            M->>C: 내용 수정 지시
            C-->>M: 수정 완료
            M->>V: 디자인 수정 지시
            V-->>M: 수정 완료
        else 승인
            M->>U: 최종 PT 전달
        end
    end
```

## 에이전트 역할 정의

| 에이전트 | 역할 | 주요 기능 |
|---------|------|----------|
| **접수 데스크** | 요구사항 분석가 | 요청 접수, 분석, 스펙 문서화 |
| **PT 내용 구성** | 콘텐츠 전략가 | 개요/구조/스크립트 작성 |
| **시각화 전문가** | 디자인 전문가 | 심플/깔끔 스타일 시각화 |
| **레드팀** | 품질 검토관 | 비판적 평가, 개선점 도출 |
| **관리자** | 프로젝트 매니저 | 작업 조율, 최종 승인 |

## 데이터 흐름

```mermaid
graph LR
    subgraph Data["📊 데이터 흐름"]
        REQ["요청서"] --> SPEC["스펙 문서"]
        SPEC --> OUTLINE["개요"]
        OUTLINE --> SLIDES["슬라이드 구조"]
        SLIDES --> DRAFT["시각화 초안"]
        DRAFT --> FEEDBACK["피드백"]
        FEEDBACK --> FINAL["최종 PT"]
    end

    style REQ fill:#ffecb3
    style SPEC fill:#fff9c4
    style OUTLINE fill:#f0f4c3
    style SLIDES fill:#dcedc8
    style DRAFT fill:#c8e6c9
    style FEEDBACK fill:#b2dfdb
    style FINAL fill:#80cbc4
```

## 버전 관리 정책

### 출력물 폴더 구조

```
outputs/
├── v1_2026-02-03/          # 버전_날짜 형식
│   ├── slide_01_*.svg
│   ├── slide_02_*.svg
│   └── ...
├── v2_2026-02-04/
│   └── ...
└── latest -> v2_2026-02-04  # 심볼릭 링크 (선택)
```

### 버전 생성 규칙

| 상황 | 버전 처리 |
|-----|----------|
| **신규 PT 요청** | 새 버전 폴더 생성 (`v{N+1}_{날짜}`) |
| **기존 PT 수정** | 새 버전 폴더 생성 (기존 버전 보존) |
| **경미한 수정** | 동일 버전 내 덮어쓰기 가능 |

### 버전 네이밍 컨벤션

```
v{버전번호}_{YYYY-MM-DD}

예시:
- v1_2026-02-03  # 첫 번째 버전
- v2_2026-02-03  # 같은 날 두 번째 버전
- v3_2026-02-04  # 다음 날 세 번째 버전
```

### 워크플로우

```mermaid
flowchart LR
    A[작업 시작] --> B{신규/수정?}
    B -->|신규| C[새 버전 폴더 생성]
    B -->|수정| D{변경 범위?}
    D -->|대규모| C
    D -->|경미| E[기존 폴더에 저장]
    C --> F[산출물 저장]
    E --> F
    F --> G[작업 완료]
```
