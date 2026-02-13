# HKD852 프로젝트 - Claude Code 표준

> 이 문서는 HKD852 하위 모든 에이전트에 적용되는 공통 표준입니다.

## 프로젝트 개요

HKD852 스튜디오는 AI 에이전트 기반 게임/콘텐츠 제작 조직입니다.

### 조직 구조

```
대표이사 (CEO) ─ 사용자
├─ [직속] 비서실장, 운영총괄(COO), 품질관리 매니저
├─ 게임본부: 기획팀장(PD파트+분석파트), 아트디렉터, 개발팀장
├─ 사업본부: 사업개발 매니저, 마케팅 매니저
└─ 지원본부: 커뮤니케이션 디렉터, 현지화 매니저, 인사팀장, 기술지원
```

### 구성원 (에이전트)

| 소속 | 직책 | 에이전트 | 경로 |
|------|------|---------|------|
| 직속 | 비서실장 | **Secretary_Agent** | `./Secretary_Agent/` |
| 직속 | 운영총괄 (COO) | 오케스트레이터 | `.claude/skills/orchestrator/` |
| 직속 | 품질관리 매니저 | Quality Gate | `.claude/skills/quality-gate/` |
| 게임 | 기획팀장 | **GameDesign_Agent** | `./GameDesign_Agent/` |
| 게임 | 아트디렉터 | **team-kowloon** | `./team-kowloon/` |
| 게임 | 개발팀장 | **Hwatu_Roguelike** | `./Hwatu_Roguelike/` |
| 사업 | 사업개발 매니저 | **Income_Factory** | `./Income_Factory/` |
| 사업 | 마케팅 매니저 | **Marketing_Agent** | `./Marketing_Agent/` |
| 지원 | 커뮤니케이션 디렉터 | **PT_Agent** | `./PT_Agent/` |
| 지원 | 현지화 매니저 | **Translate_Agent** | `./Translate_Agent/` |
| 지원 | 인사팀장 | **HR_Agent** | `./HR_Agent/` |
| 지원 | 기술지원 | **Video_Analyzer** | `./Video_Analyzer/` |

---

## Claude Code 공식 가이드

**모든 스킬 및 에이전트 개발 시 다음 가이드를 준수합니다:**

- **가이드 인덱스**: `docs/claude-code-guide/INDEX.md`
- **스킬 구조**: `docs/claude-code-guide/skills/01-skill-structure.md`
- **스킬 예제**: `docs/claude-code-guide/skills/02-skill-examples.md`
- **Agent SDK**: `docs/claude-code-guide/agent-sdk/01-overview.md`
- **베스트 프랙티스**: `docs/claude-code-guide/best-practices/01-skill-best-practices.md`

### 가이드 업데이트 체크
```
/guide-update-check
```

---

## 공통 스킬 표준

### 필수 YAML Frontmatter
```yaml
---
name: skill-name
description: "스킬 설명 (한글 권장)"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---
```

### 권장 모델 선택 기준
| 작업 유형 | 권장 모델 | 이유 |
|----------|----------|------|
| 비판적 분석, 복잡한 추론 | `opus` | 깊이 있는 사고 필요 |
| 콘텐츠 생성, 코드 작성 | `sonnet` | 균형잡힌 성능 |
| 단순 분류, 라우팅 | `haiku` | 빠른 응답, 비용 효율 |

### 스킬 파일 위치
```
.claude/skills/<skill-name>/SKILL.md
```

---

## 하위 에이전트 규칙

### 모든 하위 에이전트 CLAUDE.md 필수 포함 내용
```markdown
## 공통 표준
이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.
- 가이드: [Claude Code 공식 가이드](../docs/claude-code-guide/INDEX.md)
```

### 새 에이전트 생성 시 체크리스트
- [ ] `.claude/` 폴더 생성
- [ ] `CLAUDE.md` 생성 (루트 가이드 참조 포함)
- [ ] 스킬은 공식 가이드 구조 준수
- [ ] README.md에 에이전트 목적 명시

---

## 모델 설정

현재 기본 모델: **Opus (최신 버전)**

설정 위치: `.claude/settings.local.json`
```json
{
  "model": "opus"
}
```

> `"model": "opus"`는 자동으로 최신 Opus 버전을 사용합니다.

---

## Agent Teams (Opus 4.6 신기능)

> **상태**: 활성화됨 (실험적 기능)

Agent Teams는 여러 Claude Code 인스턴스가 독립적으로 병렬 작업하고 서로 직접 통신하는 기능입니다.

### 언제 사용하나요?

| 적합한 경우 | 부적합한 경우 |
|------------|--------------|
| 병렬 리서치/리뷰 | 순차적 작업 |
| 독립적인 모듈 개발 | 같은 파일 편집 |
| 경쟁 가설 디버깅 | 의존성 많은 작업 |
| 프론트/백엔드/테스트 분리 | 단순 작업 |

### vs 기존 스킬/서브에이전트

| 특성 | 스킬/서브에이전트 | Agent Teams |
|------|-----------------|-------------|
| 컨텍스트 | 공유 (결과만 반환) | 독립적 |
| 통신 | 메인→서브 단방향 | 양방향 메시징 |
| 조율 | 메인 에이전트 | 공유 Task List |
| 비용 | 낮음 | 높음 (각자 인스턴스) |

### 사용 예시

```
# PT_Agent에서 프레젠테이션 제작 시
Create an agent team for this presentation:
- One teammate on research and fact-checking
- One teammate on content structure and storytelling
- One teammate on visual design concepts
Have them collaborate and share findings.
```

```
# GameDesign_Agent에서 게임 기획 시
Create an agent team to analyze this game feature:
- Market analyst reviewing competitor implementations
- Balance designer modeling economic impact
- UX advisor evaluating player experience
Require plan approval before implementation.
```

### 팀 제어 명령

- **Shift+Up/Down**: 팀원 선택
- **Shift+Tab**: 위임 모드 토글 (리드가 조율만 담당)
- **Ctrl+T**: Task List 토글

### 가이드 문서
- `docs/claude-code-guide/agent-teams/01-overview.md`

---

## 유용한 스킬

### 대표 직속 스킬
| 스킬 | 설명 |
|------|------|
| `/orchestrator` | **COO** — 작업 자동 분석, 부서 간 라우팅, 팀 구성 판단 |
| `/quality-gate` | **QA 매니저** — CFMC 매트릭스로 모든 산출물 검증 (Opus) |
| `/daily-brief` | **비서실장** — 프로젝트 변경사항 스캔, 일일 브리핑 생성 |
| `/work-log` | **비서실장** — 작업 내용을 구조화된 일지로 정리 |
| `/guide-update-check` | Claude 공식 가이드 업데이트 확인 |

### 게임본부 — 기획팀장 (GameDesign_Agent)
| 스킬 | 설명 |
|------|------|
| `/requirement` | 요구사항 분석 |
| `/pd-review` | PD 관점 최종 평가 |
| `/art-status` | 아트디렉터(team-kowloon) 리소스 완성도 조회 |
| `/report` | HTML 보고서 생성 |

### 지원본부 — 커뮤니케이션 디렉터 (PT_Agent)
| 스킬 | 설명 |
|------|------|
| `/pt` | 프레젠테이션 전체 파이프라인 실행 |
| `/pt-from-design` | 기획팀장 분석 결과 → 발표자료 자동 변환 |
| `/pt-reception` | 요구사항 분석 |
| `/pt-content` | 콘텐츠 설계 |
| `/pt-visual` | SVG 시각화 |
| `/pt-redteam` | 품질 검토 |

### 사업본부 — 사업개발 매니저 (Income_Factory)
| 스킬 | 설명 | 모델 |
|------|------|------|
| `/factory` | **일일 파이프라인 오케스트레이터** — 전체 사이클 조율 | Sonnet |
| `/idea-scan` | 트렌드 스캔 + 아이디어 10개 생성 | Haiku |
| `/idea-eval` | 5가지 기준 점수화 → Top 3 선별 | Sonnet |
| `/idea-critic` | 악마의 변호인 → Kill or Proceed | Opus |
| `/idea-plan` | 7일 타임박스 실행 계획 수립 | Sonnet |
| `/idea-build` | 실행 계획에 따라 실제 제품 제작 | Sonnet |
| `/idea-review` | 품질 검증 → Pass/Revise/Kill | Opus |
| `/idea-launch` | 플랫폼별 배포 가이드 생성 | Haiku |
| `/idea-analyze` | 주간 성과 분석 및 학습 축적 | Sonnet |

### 사업본부 — 마케팅 매니저 (Marketing_Agent)
| 스킬 | 설명 | 모델 |
|------|------|------|
| `/aso` | 앱스토어/마켓플레이스 키워드 분석, 메타데이터 최적화 | Sonnet |
| `/social-copy` | 플랫폼별(X, Instagram, YouTube) 마케팅 카피 생성 | Sonnet |
| `/launch-plan` | 런칭 D-7~D+30 마케팅 타임라인 + 채널별 전략 | Sonnet |

### 지원본부 — 현지화 매니저 (Translate_Agent)
| 스킬 | 설명 | 모델 |
|------|------|------|
| `/translate` | Excel/CSV 한글→영문/일본어 번역 | Sonnet + Haiku |

### 지원본부 — 인사팀장 (HR_Agent)
| 스킬 | 설명 | 모델 |
|------|------|------|
| `/org-chart` | 조직도 인터랙티브 HTML 생성 | Sonnet |
| `/reorg` | 재조직 분석 및 효율적 업무 분담 제안 | Opus |

---

## 작업 완료 보고 표준

> 모든 작업 완료 시, 아래 형식으로 실행 요약을 제공합니다.

### 보고 형식

```markdown
## 📋 실행 요약

### 작업 정보
- **작업명**: [수행한 작업 제목]
- **완료 시간**: [YYYY-MM-DD HH:MM]
- **실행 방식**: [단독 / 스킬 파이프라인 / Agent Teams]

### 사용된 에이전트
| 에이전트 | 역할 | 주요 작업 |
|----------|------|----------|
| GameDesign_Agent | 기획 분석 | 요구사항 정의 |
| PT_Agent | 시각화 | SVG 슬라이드 생성 |

### 사용된 스킬
| 스킬 | 에이전트 | 목적 |
|------|----------|------|
| `/requirement` | GameDesign_Agent | 요구사항 분석 |
| `/pt-visual` | PT_Agent | 시각 디자인 |

### Agent Teams 구성 (해당 시)
| 팀원 | 담당 영역 | 기여 내용 |
|------|----------|----------|
| Research Agent | 리서치 | 경쟁사 분석 데이터 수집 |
| Design Agent | 디자인 | 레이아웃 및 컬러 제안 |
| Review Agent | 검토 | 품질 검증 및 피드백 |

### 산출물
- `outputs/[파일명]` - [설명]
```

### 실행 방식별 보고 예시

#### 단독 실행
```markdown
## 📋 실행 요약

### 작업 정보
- **작업명**: README.md 오타 수정
- **완료 시간**: 2026-02-07 14:30
- **실행 방식**: 단독

### 산출물
- `README.md` - 오타 3건 수정
```

#### 스킬 파이프라인 실행
```markdown
## 📋 실행 요약

### 작업 정보
- **작업명**: 게임 밸런스 분석 보고서
- **완료 시간**: 2026-02-07 15:00
- **실행 방식**: 스킬 파이프라인

### 사용된 에이전트
| 에이전트 | 역할 | 주요 작업 |
|----------|------|----------|
| GameDesign_Agent | 메인 | 전체 파이프라인 조율 |

### 사용된 스킬
| 스킬 | 에이전트 | 목적 |
|------|----------|------|
| `/requirement` | GameDesign_Agent | 요구사항 분석 |
| `/pd-review` | GameDesign_Agent | PD 관점 평가 |
| `/report` | GameDesign_Agent | HTML 보고서 생성 |

### 산출물
- `outputs/balance_report.html` - 밸런스 분석 보고서
```

#### Agent Teams 실행
```markdown
## 📋 실행 요약

### 작업 정보
- **작업명**: 신규 기능 기획서 작성
- **완료 시간**: 2026-02-07 16:00
- **실행 방식**: Agent Teams

### 사용된 에이전트
| 에이전트 | 역할 | 주요 작업 |
|----------|------|----------|
| GameDesign_Agent | 리드 | 기획 총괄 |
| PT_Agent | 서포트 | 프레젠테이션 제작 |

### Agent Teams 구성
| 팀원 | 담당 영역 | 기여 내용 |
|------|----------|----------|
| Market Analyst | 시장 조사 | 경쟁작 벤치마킹 |
| Balance Designer | 밸런스 | 수치 시뮬레이션 |
| UX Advisor | UX | 사용자 경험 검토 |

### 팀 협업 하이라이트
- Market Analyst → Balance Designer: 경쟁작 과금 데이터 공유
- Balance Designer ↔ UX Advisor: 난이도 곡선 조율 논의

### 산출물
- `outputs/feature_spec.md` - 기능 기획서
- `outputs/feature_presentation.svg` - 발표 자료
```

---

## 문서 링크

- **공식 Anthropic 문서**: https://docs.anthropic.com
- **Claude Code**: https://docs.anthropic.com/en/docs/claude-code
- **Agent SDK**: https://docs.anthropic.com/en/docs/agents
- **API Reference**: https://docs.anthropic.com/en/api

---

## 버전 정보
- 최종 업데이트: 2026-02-12 (v5: 게임본부 확대, 마케팅 매니저 신설)
- 구성원: 12명 / 50 스킬
- 모델: Claude (최신 버전 자동 사용)
