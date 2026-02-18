# HKD852 프로젝트 - Claude Code 표준

> 이 문서는 HKD852 하위 모든 에이전트에 적용되는 공통 표준입니다.

## 프로젝트 개요

HKD852 스튜디오는 AI 에이전트 기반 게임/콘텐츠 제작 조직입니다.

### 조직 구조 (v7.1: 21 에이전트)

```
대표이사 (CEO) ─ 사용자
├─ [직속] 비서실장, 운영총괄(COO), 품질관리, 성장전략, 프로젝트매니저, 보안책임자, 레드팀
├─ 게임본부: 기획팀장, 아트디렉터, 개발팀장, QA팀장
├─ 사업본부: 사업개발, 마케팅, 커뮤니티, 쇼츠공장
└─ 지원본부: 커뮤니케이션, 현지화, 인사, 기술지원, 빌드엔지니어
```

### 타겟 시장 (우선순위)
NA (북미) > EU (유럽) > CN (중국) > KR (한국) > JP (일본)

### 게임 엔진
**Unity 6000.3.6f1** — 멀티플랫폼 (iOS, Android, Steam, WebGL)

### 구성원 (에이전트)

| 소속 | 직책 | 에이전트 | 경로 | 스킬 수 |
|------|------|---------|------|---------|
| 직속 | 비서실장 | **Secretary_Agent** | `./Secretary_Agent/` | 4 |
| 직속 | 운영총괄 (COO) | 오케스트레이터 | `.claude/skills/orchestrator/` | 1 |
| 직속 | 품질관리 매니저 | Quality Gate | `.claude/skills/quality-gate/` | 1 |
| 직속 | 성장전략 매니저 | **Growth_Agent** | `./Growth_Agent/` | 3 |
| 직속 | 프로젝트매니저 | **PMO_Agent** | `./PMO_Agent/` | 7 |
| 직속 | 보안책임자 (CISO) | **Shield_Agent** | `./Shield_Agent/` | 6 |
| 직속 | 레드팀 | **RedTeam_Agent** | `./RedTeam_Agent/` | 6 |
| 게임 | 기획팀장 | **GameDesign_Agent** | `./GameDesign_Agent/` | 10+ |
| 게임 | 아트디렉터 | **team-kowloon** | `./team-kowloon/` | 6+ |
| 게임 | 개발팀장 | **GameDev_Agent** | `./GameDev_Agent/` | 9 |
| 게임 | QA팀장 | **QATest_Agent** | `./QATest_Agent/` | 6 |
| 사업 | 사업개발 매니저 | **Income_Factory** | `./Income_Factory/` | 9 |
| 사업 | 마케팅 매니저 | **Marketing_Agent** | `./Marketing_Agent/` | 5 |
| 사업 | 커뮤니티 매니저 | **Community_Agent** | `./Community_Agent/` | 5 |
| 사업 | 쇼츠공장 매니저 | **ShortsFactory_Agent** | `./ShortsFactory_Agent/` | 6 |
| 지원 | 커뮤니케이션 디렉터 | **PT_Agent** | `./PT_Agent/` | 9 |
| 지원 | 현지화 매니저 | **Translate_Agent** | `./Translate_Agent/` | 5 |
| 지원 | 인사팀장 | **HR_Agent** | `./HR_Agent/` | 2 |
| 지원 | 기술지원 | **Video_Analyzer** | `./Video_Analyzer/` | 1 |
| 지원 | 빌드엔지니어 | **DevOps_Agent** | `./DevOps_Agent/` | 8 |

### 자동 품질 파이프라인

```
에이전트 산출물 → Quality Gate → Shield_Agent (보안) → RedTeam_Agent (적대적) → 승인
```

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

### 대표 직속 — 핵심 스킬
| 스킬 | 에이전트 | 설명 | 모델 |
|------|----------|------|------|
| `/orchestrator` | COO | 작업 자동 분석, 부서 간 라우팅 (Case A~RT) | Sonnet |
| `/quality-gate` | 품질관리 | CFMC 매트릭스 검증 + 자동 보안/레드팀 체인 | Opus |
| `/debate-synthesize` | 공통 | 다관점 프로필 종합 → 합의 권고안 도출 | Opus |
| `/daily-brief` | 비서실장 | 일일 브리핑 | Sonnet |
| `/work-log` | 비서실장 | 작업 일지 정리 | Sonnet |
| `/weekly-report` | 비서실장 | CEO 주간 요약 보고서 | Sonnet |
| `/escalation-brief` | 비서실장 | 블로커/리스크 CEO 긴급 보고 | Sonnet |

### 대표 직속 — 성장전략 (Growth_Agent)
| 스킬 | 설명 | 모델 |
|------|------|------|
| `/funnel-audit` | AAARRR 퍼널 KPI 진단 → 병목 식별 → 개선안 | Opus |
| `/onboarding-review` | 온보딩 9단계 리뷰 → 이탈 포인트 분석 | Sonnet |
| `/kpi-dashboard` | 핵심 지표 인터랙티브 HTML 대시보드 | Sonnet |

### 대표 직속 — 프로젝트매니저 (PMO_Agent)
| 스킬 | 설명 | 모델 |
|------|------|------|
| `/sprint-plan` | 2주 스프린트 백로그 생성 | Sonnet |
| `/sprint-review` | 스프린트 회고 + 다음 스프린트 초안 | Sonnet |
| `/milestone-track` | 마일스톤 진행률 업데이트 | Haiku |
| `/dep-map` | 에이전트 간 태스크 의존성 맵 | Sonnet |
| `/risk-register` | 프로젝트 리스크 식별 및 점수화 | Opus |
| `/roadmap` | 인터랙티브 HTML 로드맵 | Sonnet |
| `/standup` | 전체 에이전트 상태 빠른 체크 | Haiku |

### 대표 직속 — 보안책임자 (Shield_Agent)
| 스킬 | 설명 | 모델 |
|------|------|------|
| `/privacy-scan` | PII 노출 스캔 (코드+문서+데이터) | Opus |
| `/compliance-check` | GDPR/COPPA/CCPA/PIPL/APPI/PIPA 준수 | Opus |
| `/security-audit` | 코드 보안 리뷰 (OWASP Top 10) | Opus |
| `/threat-model` | STRIDE 위협 모델링 | Opus |
| `/data-flow` | 데이터 수집/저장/전송 경로 매핑 | Sonnet |
| `/secret-scan` | API 키/시크릿 코드베이스 스캔 | Haiku |

### 대표 직속 — 레드팀 (RedTeam_Agent)
| 스킬 | 설명 | 모델 |
|------|------|------|
| `/red-review` | 범용 적대적 리뷰 (4관점) | Opus |
| `/exploit-hunt` | 게임 경제/치트 익스플로잇 탐색 | Opus |
| `/narrative-attack` | 논리 불일치, 메시징 결함 탐색 | Opus |
| `/comp-tear` | 경쟁사 관점 약점 분석 | Opus |
| `/cultural-review` | 5개 시장 문화적 민감도 검토 | Opus |
| `/devils-advocate` | 반대 논증 전개 | Opus |

### 게임본부 — 기획팀장 (GameDesign_Agent)
| 스킬 | 설명 |
|------|------|
| `/requirement` | 요구사항 분석 |
| `/pd-review` | PD 관점 최종 평가 |
| `/art-status` | 아트디렉터 리소스 완성도 조회 |
| `/report` | HTML 보고서 생성 |

### 게임본부 — 아트디렉터 (team-kowloon)
| 스킬 | 설명 | 모델 |
|------|------|------|
| `/game-art-spec` | 게임용 아트 스펙 (스프라이트, 타일셋, UI) | Sonnet |
| `/art-export` | 플랫폼별 해상도 내보내기 (iOS/Android/PC) | Haiku |

### 게임본부 — 개발팀장 (GameDev_Agent)
| 스킬 | 설명 | 모델 |
|------|------|------|
| `/unity-init` | Unity 프로젝트 스캐폴딩 + 패키지 설정 | Sonnet |
| `/unity-arch` | 시스템 아키텍처 설계 (ECS/MVC) | Opus |
| `/unity-scene` | 씬/프리팹 스크립트 생성 | Sonnet |
| `/unity-script` | C# MonoBehaviour/ScriptableObject | Sonnet |
| `/unity-shader` | URP/ShaderGraph 셰이더 | Sonnet |
| `/unity-ui` | UI Toolkit / uGUI 구성 | Sonnet |
| `/unity-build` | Unity CLI 빌드 실행 (headless) | Haiku |
| `/unity-review` | 다관점 코드 리뷰 (성능/보안/유지보수) | Opus |
| `/unity-refactor` | 리팩토링 | Sonnet |

### 게임본부 — QA팀장 (QATest_Agent)
| 스킬 | 설명 | 모델 |
|------|------|------|
| `/test-plan` | 게임 디자인 기반 테스트 계획 | Sonnet |
| `/test-script` | C# 유닛 테스트 (NUnit) | Sonnet |
| `/platform-check` | Apple/Google/Steam 정책 준수 검증 | Sonnet |
| `/perf-profile` | Unity Profiler 성능 분석 | Sonnet |
| `/bug-report` | 구조화된 버그 리포트 | Haiku |
| `/compat-matrix` | 디바이스/OS 호환성 매트릭스 | Haiku |

### 사업본부 — 사업개발 (Income_Factory)
| 스킬 | 설명 | 모델 |
|------|------|------|
| `/factory` | 일일 파이프라인 오케스트레이터 | Sonnet |
| `/idea-scan` | 트렌드 스캔 + 아이디어 생성 | Haiku |
| `/idea-eval` | 5기준 점수화 → Top 3 | Sonnet |
| `/idea-critic` | 악마의 변호인 → Kill/Proceed | Opus |
| `/idea-plan` | 7일 실행 계획 | Sonnet |
| `/idea-build` | 실제 제품 제작 | Sonnet |
| `/idea-review` | 품질 검증 → Pass/Revise/Kill | Opus |
| `/idea-launch` | 배포 가이드 | Haiku |
| `/idea-analyze` | 주간 성과 분석 | Sonnet |

### 사업본부 — 마케팅 (Marketing_Agent)
| 스킬 | 설명 | 모델 |
|------|------|------|
| `/aso` | 앱스토어 키워드/메타데이터 최적화 | Sonnet |
| `/social-copy` | SNS 마케팅 카피 | Sonnet |
| `/launch-plan` | 런칭 D-7~D+30 타임라인 | Sonnet |
| `/steam-page` | Steam 스토어 페이지 최적화 | Sonnet |
| `/influencer-brief` | 크리에이터 아웃리치 브리프 | Sonnet |

### 사업본부 — 커뮤니티 (Community_Agent)
| 스킬 | 설명 | 모델 |
|------|------|------|
| `/sentiment-scan` | 플레이어 리뷰/피드백 감성 분석 | Sonnet |
| `/community-post` | 패치노트/업데이트 공지 작성 | Sonnet |
| `/review-response` | 앱스토어 리뷰 답변 | Haiku |
| `/discord-plan` | Discord 서버 구조 설계 | Sonnet |
| `/crisis-comms` | 부정적 PR/논란 대응 | Opus |

### 사업본부 — 쇼츠공장 (ShortsFactory_Agent)
| 스킬 | 설명 | 모델 |
|------|------|------|
| `/shorts-factory` | 일일 파이프라인 오케스트레이터 | Sonnet |
| `/topic-mine` | 트렌드 리서치 + 고RPM 토픽 자동 선정 | Sonnet |
| `/shorts-script` | 스크립트 + 메타데이터 생성 | Sonnet |
| `/shorts-render` | TTS + FFmpeg 영상 렌더링 | Haiku |
| `/shorts-review` | YouTube 정책 준수 + 품질 검증 | Opus |
| `/shorts-analyze` | 주간 성과 분석 + 전략 조정 | Sonnet |

### 지원본부 — 커뮤니케이션 디렉터 (PT_Agent)
| 스킬 | 설명 |
|------|------|
| `/pt` | 프레젠테이션 전체 파이프라인 |
| `/pt-from-design` | 기획 분석 → 발표자료 변환 |
| `/pt-reception` | 요구사항 분석 |
| `/pt-content` | 콘텐츠 설계 |
| `/pt-visual` | SVG 시각화 |
| `/pt-redteam` | 품질 검토 |

### 지원본부 — 현지화 (Translate_Agent)
| 스킬 | 설명 | 모델 |
|------|------|------|
| `/translate` | 한글→영문/일본어 번역 | Sonnet+Haiku |
| `/translate-cn` | 한글→중국어 (간체/번체) | Sonnet |
| `/translate-eu` | 한글→프랑스어/독일어/스페인어 | Sonnet |
| `/localize-validate` | UI 텍스트 길이/깨짐 검증 | Haiku |
| `/cultural-adapt` | 문화적 맥락 적응 컨설팅 | Opus |

### 지원본부 — 빌드엔지니어 (DevOps_Agent)
| 스킬 | 설명 | 모델 |
|------|------|------|
| `/pipeline-config` | GitHub Actions CI/CD 설정 | Sonnet |
| `/build-ios` | iOS 빌드 + App Store Connect | Sonnet |
| `/build-android` | Android AAB + Play Console | Sonnet |
| `/build-steam` | Steam + Steamworks SDK | Sonnet |
| `/deploy-stage` | 스테이징 배포 (TestFlight/내부트랙/Beta) | Haiku |
| `/deploy-prod` | 프로덕션 배포 + 롤백 (CEO 승인 필수) | Sonnet |
| `/platform-status` | 전체 플랫폼 빌드/리뷰 상태 | Haiku |
| `/hotfix` | 긴급 핫픽스 파이프라인 | Sonnet |

### 지원본부 — 인사 (HR_Agent)
| 스킬 | 설명 | 모델 |
|------|------|------|
| `/org-chart` | 조직도 인터랙티브 HTML | Sonnet |
| `/reorg` | 재조직 분석 | Opus |

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

## 자율 운영 모델

### 스프린트 기반 자율 사이클
```
월요일: PMO_Agent /sprint-plan
주중: Secretary /daily-brief + PMO /standup (매일) + 전 에이전트 태스크 수행
금요일: PMO_Agent /sprint-review
CEO 리뷰: 주간 요약 확인, 에스컬레이션 블로커만 처리
```

### 예외 기반 에스컬레이션
**자동 처리**: Quality Gate A/B (80+), 일반 코드 리뷰, 스토어 메타데이터 업데이트
**CEO 에스컬레이션**: RedTeam REJECT, Shield SECURITY_HOLD, Quality Gate F, 프로덕션 배포, 게임 컨셉 승인

---

## 버전 정보
- 최종 업데이트: 2026-02-18 (v7.1: ShortsFactory_Agent 추가)
- 구성원: 21명 / ~106 스킬
- 게임 엔진: Unity 6000.3.6f1
- 모델: Claude (최신 버전 자동 사용)
