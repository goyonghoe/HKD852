---
name: org-chart
description: "HKD852 전체 에이전트 조직도를 인터랙티브 HTML로 생성합니다"
user-invocable: true
allowed-tools: Read, Write, Bash, Glob, Grep
recommended-model: sonnet
model-reason: "HTML/CSS/JS 코드 생성 — Sonnet의 코드 생성 능력 활용"
---

# 조직도 생성 스킬

## 실행 절차

### Step 1: 프로젝트 구조 스캔

1. `Glob`으로 모든 에이전트 CLAUDE.md 탐색:
   - 패턴: `*/.claude/CLAUDE.md`
   - 패턴: `*/docs/CLAUDE.md` (team-kowloon 등)

2. `Glob`으로 모든 스킬 파일 탐색:
   - 패턴: `*/.claude/skills/*/SKILL.md`
   - 패턴: `*/.claude/skills/*.md` (GameDesign_Agent 등)
   - 패턴: `*/skills/*/skill.py` (team-kowloon 등)

3. `Read`로 각 YAML frontmatter 파싱:
   - name, description, recommended-model, user-invocable 추출

### Step 2: 데이터 구조화

JSON 형태로 조직 데이터 구성:
```json
{
  "root": "HKD852",
  "teams": [...],
  "agents": [...],
  "rootSkills": [...]
}
```

### Step 3: HTML 생성

단일 자체완결 HTML 파일 생성:
- 다크 테마 (#0d1117 팔레트)
- 5개 섹션: 통계, 트리뷰, 파이프라인, 팀구성, 검색
- 반응형 디자인 (768px, 480px 브레이크포인트)
- 키보드 내비게이션 (`/` 검색, `Esc` 접기)

### Step 4: 저장

파일 저장 위치: `HR_Agent/outputs/org_chart_YYYYMMDD.html`

### Step 5: 보고

실행 요약 형식으로 결과 보고.

---

## 산출물

- 단일 HTML 파일 (외부 의존성 없음)
- 인터랙티브: 펼치기/접기, 검색, 필터, 뷰 전환
- 통계: 에이전트 수, 스킬 수, 모델 분포 차트
