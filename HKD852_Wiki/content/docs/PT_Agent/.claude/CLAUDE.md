# PT Agent

프레젠테이션 자동 제작 멀티에이전트 파이프라인입니다.

---

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- **가이드 인덱스**: [Claude Code 공식 가이드](../../docs/claude-code-guide/INDEX.md)
- **스킬 표준**: [스킬 구조 가이드](../../docs/claude-code-guide/skills/01-skill-structure.md)
- **가이드 업데이트 체크**: `/guide-update-check`

---

## 역할

- 요구사항을 분석하여 고품질 프레젠테이션 자동 생성
- 멀티에이전트 파이프라인으로 단계별 품질 관리
- SVG 기반 세련된 시각화 슬라이드 제작

## 스킬 구성

### 메인 파이프라인

| 스킬           | 명령어 | 권장 모델 | 역할                 |
| -------------- | ------ | --------- | -------------------- |
| 오케스트레이터 | `/pt`  | Sonnet    | 전체 파이프라인 조율 |

### 개별 스킬

| 스킬        | 명령어          | 권장 모델 | 역할                 |
| ----------- | --------------- | --------- | -------------------- |
| 접수 데스크 | `/pt-reception` | Haiku     | 요구사항 5W1H 분석   |
| 리서치      | `/pt-research`  | Sonnet    | 웹 검색 및 정보 종합 |
| 콘텐츠 설계 | `/pt-content`   | Sonnet    | 스토리텔링 구조화    |
| 시각화      | `/pt-visual`    | Sonnet    | SVG 슬라이드 생성    |
| 레드팀      | `/pt-redteam`   | Opus      | 품질 검증 및 피드백  |
| 관리자      | `/pt-manager`   | Haiku     | 최종 승인/수정 지시  |
| 내보내기    | `/pt-export`    | Haiku     | HTML/PDF 통합        |

## 파이프라인

```
[요구사항 입력]
      ↓
/pt-reception → 요구사항 분석 (Haiku)
      ↓
/pt-research → 정보 리서치 (Sonnet)
      ↓
/pt-content → 콘텐츠 설계 (Sonnet)
      ↓
/pt-visual → SVG 시각화 (Sonnet)
      ↓
/pt-redteam → 품질 검토 (Opus)
      ↓
/pt-manager → 최종 승인 (Haiku)
      ↓
/pt-export → HTML/PDF 출력 (Haiku)
```

## 출력 위치

```
PT_Agent/outputs/
└── v[버전]_[날짜]/
    ├── slides/          # 개별 SVG 슬라이드
    ├── presentation.html # 통합 HTML
    └── research_notes.md # 리서치 노트
```

## 로컬 참고 문서

이 에이전트에는 별도의 로컬 가이드 사본이 있습니다:

- `docs/claude-official-guide/` (참조용, 루트 가이드가 최신)

루트 가이드가 정본이므로, 업데이트는 `/guide-update-check`로 확인하세요.
