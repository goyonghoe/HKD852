# TsimShaTsui Agent

범용 기본 에이전트 — 확장 가능한 템플릿 에이전트

---

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- **가이드 인덱스**: [Claude Code 공식 가이드](../../docs/claude-code-guide/INDEX.md)
- **스킬 표준**: [스킬 구조 가이드](../../docs/claude-code-guide/skills/01-skill-structure.md)
- **베스트 프랙티스**: [베스트 프랙티스](../../docs/claude-code-guide/best-practices/01-best-practices.md)

---

## 역할

- HKD852 조직 내 범용 기본 에이전트
- 새로운 에이전트/스킬 개발 시 참조할 수 있는 표준 템플릿
- 필요에 따라 역할과 스킬을 확장하여 전문 에이전트로 전환 가능

---

## 스킬 구성

| 스킬   | 명령어        | 권장 모델 | 역할                                          |
| ------ | ------------- | --------- | --------------------------------------------- |
| hello  | `/hello`      | haiku     | 에이전트 상태 확인 및 프로젝트 기본 정보 출력 |
| report | `/tst-report` | sonnet    | 주제별 인터랙티브 HTML 보고서 생성            |

---

## 디렉토리 구조

```
TsimShaTsui/
├── .claude/
│   ├── CLAUDE.md              # 이 파일
│   └── skills/
│       ├── hello/SKILL.md     # 상태 확인 스킬
│       └── report/SKILL.md    # 보고서 생성 스킬
└── outputs/                   # 산출물 저장
```

---

## 워크플로우

```
사용자 요청 → 스킬 선택 → 실행 → outputs/ 저장 (해당 시)
```

---

## 버전 정보

- 생성일: 2026-02-25
- 최종 업데이트: 2026-02-25
- 스킬 수: 2
