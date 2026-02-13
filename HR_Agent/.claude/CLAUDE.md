# HR Agent - HKD852 조직 관리 에이전트

> AI 에이전트 조직도 자동 생성 및 팀 재조직 분석

---

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.
- **가이드 인덱스**: [Claude Code 공식 가이드](../../docs/claude-code-guide/INDEX.md)
- **스킬 표준**: [스킬 구조 가이드](../../docs/claude-code-guide/skills/01-skill-structure.md)

---

## 역할

- HKD852 전체 에이전트/스킬 조직도를 인터랙티브 HTML로 생성
- 에이전트 간 관계, 스킬 파이프라인, 모델 분포 시각화
- 팀 재조직 제안 및 효율성 분석

---

## 스킬 목록

| 스킬 | 명령어 | 모델 | 역할 |
|------|--------|------|------|
| Org Chart | `/org-chart` | Sonnet | 프로젝트 스캔 → 인터랙티브 HTML 조직도 생성 |
| Reorg | `/reorg` | Opus | 현재 구조 분석 → 팀 재조직 제안 |

---

## 디렉토리 구조

```
HR_Agent/
├── .claude/
│   ├── CLAUDE.md              ← 지금 보고 있는 파일
│   └── skills/
│       ├── org-chart/SKILL.md ← 조직도 생성
│       └── reorg/SKILL.md     ← 재조직 분석
├── README.md
└── outputs/                   ← 생성된 HTML 파일
```

---

## 산출물

- `outputs/org_chart_YYYYMMDD.html` — 인터랙티브 조직도 웹페이지

---

## 버전 정보
- 생성일: 2026-02-12
- 모델: Claude (최신 버전 자동 사용)
