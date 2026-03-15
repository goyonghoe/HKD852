# 시스템 아키텍처

## 전체 구조

```mermaid
C4Context
    title SSBL Art Resource Pipeline - System Context

    Person(artist, "아트 작업자", "게임 아트 리소스 제작")
    Person(pm, "PM/기획자", "명세서 작성 및 관리")

    System(pipeline, "SSBL Pipeline", "아트 리소스 자동화 시스템")

    System_Ext(sheets, "Google Sheets", "명세서 시각화")
    System_Ext(drive, "Google Drive", "이미지 저장")
    System_Ext(slack, "Slack", "알림")

    Rel(pm, pipeline, "명세서 요청", "CSV")
    Rel(pipeline, sheets, "업로드", "API")
    Rel(pipeline, drive, "이미지 참조", "API")
    Rel(pipeline, slack, "알림 전송", "MCP")
    Rel(sheets, artist, "작업 지시", "Web")
```

## 컴포넌트 구조

```mermaid
graph TB
    subgraph "Input Layer"
        I1[CSV Parser]
        I2[Master Data Loader]
        I3[Config Loader]
    end

    subgraph "Processing Layer"
        P1[Data Manager]
        P2[Review Agent]
        P3[Spec Generator]
        P4[Image Validator]
    end

    subgraph "Output Layer"
        O1[CSV Writer]
        O2[Report Generator]
        O3[Sheets Uploader]
    end

    subgraph "Supervision Layer"
        S1[Pipeline Supervisor]
    end

    I1 --> P1
    I2 --> P1
    I3 --> P1

    P1 --> P2
    P2 --> P3
    P3 --> O1

    P4 --> O2

    O1 --> O3
    O2 --> O3

    S1 -.monitors.-> P1
    S1 -.monitors.-> P2
    S1 -.monitors.-> P3
    S1 -.monitors.-> P4

    style I1 fill:#e1f5ff
    style I2 fill:#e1f5ff
    style I3 fill:#e1f5ff
    style P1 fill:#fff4e6
    style P2 fill:#fff4e6
    style P3 fill:#fff4e6
    style P4 fill:#fff4e6
    style O1 fill:#f3e5f5
    style O2 fill:#f3e5f5
    style O3 fill:#f3e5f5
    style S1 fill:#ff9800,color:#fff
```

## 데이터 모델

```mermaid
erDiagram
    ArtResource ||--o{ ResourceSpec : generates
    Artist ||--o{ ArtResource : owns
    Album ||--o{ ArtResource : contains
    Category ||--o{ ArtResource : classifies

    ArtResource {
        string id
        string resource_type
        string category_main
        int size_width
        int size_height
        string artist
        string album
    }

    Artist {
        string name
        string name_kr
        string type
        array members
        string agency
    }

    Album {
        string artist
        string title
        date release_date
        array tracks
    }

    ResourceSpec {
        string category
        string artist
        string album
        array resources
        dict visual_references
    }
```

## 배포 구조

```mermaid
graph LR
    subgraph "Development"
        D1[Local Python]
        D2[VS Code]
        D3[Git]
    end

    subgraph "Data Storage"
        S1[(JSON Files)]
        S2[(CSV Files)]
        S3[Google Drive]
    end

    subgraph "Execution"
        E1[CLI Scripts]
        E2[Python Agents]
    end

    subgraph "Output"
        O1[Google Sheets]
        O2[Reports]
        O3[Slack]
    end

    D1 --> E1
    D2 --> E2
    D3 --> S1

    S1 --> E2
    S2 --> E2
    S3 --> E2

    E1 --> O1
    E2 --> O2
    E2 --> O3

    style D1 fill:#4caf50,color:#fff
    style E2 fill:#ff9800,color:#fff
    style O1 fill:#2196f3,color:#fff
```

---

## 주요 설계 원칙

### 1. 관심사의 분리 (Separation of Concerns)

- **Input Layer**: 데이터 수집 및 파싱
- **Processing Layer**: 비즈니스 로직
- **Output Layer**: 결과 생성
- **Supervision Layer**: 모니터링 및 개선

### 2. 단일 책임 원칙 (Single Responsibility)

- 각 에이전트는 하나의 명확한 역할
- 재사용 가능한 유틸리티 모듈

### 3. 의존성 주입 (Dependency Injection)

- Manager 클래스를 통한 데이터 접근
- 설정 파일 기반 유연한 구성

### 4. 확장성 (Extensibility)

- 새로운 아티스트/앨범 추가 용이
- 플러그인 형태의 검증 규칙

---

## 보안 고려사항

```mermaid
graph TB
    A[Credentials] --> B{Access Control}
    B --> C[Service Account Key]
    B --> D[API Keys]

    C --> E[Google Sheets]
    D --> F[External APIs]

    E --> G[Encrypted Storage]
    F --> G

    style A fill:#f44336,color:#fff
    style G fill:#4caf50,color:#fff
```

### 보안 조치

- ✅ Service Account Key를 `.gitignore`에 포함
- ✅ 환경 변수로 민감 정보 관리
- ✅ 최소 권한 원칙 적용
- ⚠️ 공유 링크는 제한된 접근만 허용

---

**마지막 업데이트**: 2026-02-01
