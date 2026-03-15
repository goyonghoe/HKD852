---
name: research
description: "리서치 파이프라인 오케스트레이터 — YouTube 검색 → NotebookLM 분석 → 한국어 인포그래픽 + HTML 보고서"
user-invocable: true
allowed-tools: Bash, Read, Write, Glob, Grep, WebSearch
---

# Research Pipeline Skill

YouTube 검색 → NotebookLM 소스 업로드 → 분석 → 한국어 인포그래픽 + HTML 보고서 자동 생성.

## 사용법

```
/research [topic] [--count 10]
```

## 파이프라인 단계

### Step 1: YouTube 다국어 검색

**4개 언어 동시 검색**으로 소스 다양성 극대화. 주제를 각 언어로 번역하여 병렬 검색.

```bash
python3 NotebookLM_Agent/scripts/yt_search.py \
  --multi "en=[topic English],ko=[topic 한국어],ja=[topic 日本語],zh=[topic 中文]" \
  --count [count] \
  --output NotebookLM_Agent/outputs/yt_search_[slug].json
```

**언어별 검색 배분 (기본 count=10 기준):**

| 언어 | 검색어 예시 | 건수 | YouTube 시장 특성 |
|------|------------|------|-------------------|
| EN | AI agent automation | 10 | 글로벌 기준, 최다 콘텐츠 |
| KR | AI 에이전트 자동화 | 10 | IT/비즈니스 분석 활발 |
| JA | AIエージェント 自動化 | 10 | 기술/게임/비즈니스 깊이 우수 |
| ZH | AI代理 企業自動化 | 10 | 대만/홍콩 분석 콘텐츠 (본토는 Bilibili) |

**주제별 언어 가중치 조절:**
- 게임/애니메이션: JA 비중 높이기 (count x1.5)
- KPOP/한류: KR 비중 높이기
- 글로벌 테크/AI: EN 비중 높이기
- 제조/공급망: ZH(대만) 비중 높이기

- 자동 중복 제거 (URL 기반)
- 사용자에게 언어별 결과 수 + 테이블 보여주기
- 사용자 확인 후 진행 (또는 자동 진행 가능)

**단일 언어 검색도 가능:**
```bash
python3 NotebookLM_Agent/scripts/yt_search.py "[query]" --lang ja --count 10 --output output.json
```

### Step 2: NotebookLM 노트북 생성 + 소스 업로드

```bash
NOTEBOOKLM="/Users/yong/Library/Python/3.10/bin/notebooklm"
NB=$($NOTEBOOKLM create "[topic] Research" 2>&1 | grep -oE '[0-9a-f-]{36}')

# 각 URL을 소스로 추가 (최대 50개)
for url in $URLS; do
    $NOTEBOOKLM source add -n "$NB" "$url"
    sleep 2
done
```

### Step 3: NotebookLM 분석 요청

**반드시 한국어로 답변을 요청**. 고유명사만 영어 허용.

```bash
$NOTEBOOKLM ask -n "$NB" "한국어로 답변해주세요. 고유명사만 영어를 허용합니다.
이 소스들을 종합 분석하여 다음을 정리해주세요:
1. 핵심 주제 Top 5
2. 공통적으로 언급되는 트렌드
3. 구체적 사례와 데이터
4. 실행 가능한 인사이트
5. 리스크와 한계
소스에서 구체적인 데이터 포인트를 인용해주세요."
```

- 분석 결과를 `NotebookLM_Agent/outputs/analysis_[slug]_[date].md`에 저장

### Step 4: 팟캐스트 생성

```bash
$NOTEBOOKLM generate audio -n "$NB" "한국어로 대화해주세요. 고유명사만 영어 발음을 허용합니다."
sleep 120
$NOTEBOOKLM download audio NotebookLM_Agent/outputs/[slug]_팟캐스트.wav
```

### Step 5: 템플릿 자동 선택

분석 결과(Step 3)를 `template_selector.py`에 전달하여 **최적 템플릿 유형 + 도메인 색상 테마**를 자동 결정.

```bash
python3 NotebookLM_Agent/scripts/template_selector.py \
  --input NotebookLM_Agent/outputs/analysis_[slug]_[date].md \
  --output /tmp/template_selection.json
```

**자동 선택 결과 (JSON):**
```json
{
  "template_type": "playbook",       // analysis | playbook | comparison | dashboard
  "domain": "tech",                   // finance | tech | business | entertainment | game | marketing
  "template_path": "outputs/templates/playbook.html",
  "colors": { "PRIMARY": "#10b981", "SECONDARY": "#3b82f6", ... }
}
```

**템플릿 유형별 차별화 컴포넌트:**

| 유형 | 핵심 컴포넌트 | 적합한 주제 |
|------|--------------|------------|
| `analysis` | 비교 매트릭스 + 스코어카드 + 데이터 테이블 | 시장 분석, 벤치마킹, 트렌드 |
| `playbook` | 타임라인 + 체크리스트 + 의사결정 트리 + 단계 카드 | 실행 가이드, 수익화 전략, How-to |
| `comparison` | 나란히 비교 + 프로/콘 + 점수 바 + 결론 뱃지 | 도구/제품 비교, A vs B |
| `dashboard` | KPI 카드 + 진행률 바 + 상태 뱃지 + 스파크라인 | 현황 리포트, 성과 추적 |

**도메인별 색상 테마:**

| 도메인 | PRIMARY | GRADIENT |
|--------|---------|----------|
| `tech` | 에메랄드 #10b981 | 에메랄드→블루→퍼플 |
| `finance` | 블루 #60a5fa | 네이비→블루→골드 |
| `business` | 앰버 #f59e0b | 앰버→핑크→퍼플 |
| `entertainment` | 핑크 #ec4899 | 핑크→퍼플→앰버 |
| `game` | 퍼플 #a855f7 | 퍼플→시안→에메랄드 |
| `marketing` | 블루 #3b82f6 | 블루→에메랄드→앰버 |

- 선택 결과를 사용자에게 간략히 보여줌 (템플릿 유형 + 도메인 + 점수)
- 사용자가 원하면 수동 오버라이드 가능

### Step 6: 한국어 HTML 인포그래픽 생성 (필수)

> NotebookLM의 인포그래픽은 영문만 지원하므로, **Claude Code가 분석 결과를 기반으로 직접 한국어 HTML 인포그래픽을 생성**한다.

**Step 5에서 선택된 템플릿 파일(`outputs/templates/[type].html`)을 참조**하여 해당 유형의 고유 컴포넌트를 활용하고, 색상 테마(`colors` dict)의 CSS 변수 값을 적용한다.

**디자인 규칙:**

- **언어**: 모든 텍스트 한국어. 고유명사(BTS, HYBE, Claude Code 등)만 영어
- **폰트**: `Noto Sans KR` (Google Fonts)
- **테마**: 다크 모드 (BG_COLOR 배경, 밝은 텍스트)
- **레이아웃**: 1200px 고정폭, CSS Grid (grid2, grid3)
- **카드**: 반투명 글래스모피즘 (rgba 배경 + 미세 보더)
- **색상**: Step 5의 `colors` dict에서 PRIMARY, SECONDARY, GRADIENT 등 적용
- **카드 상단 3px 그라디언트 바**: PRIMARY→SECONDARY 그라디언트
- **숫자 강조**: 핵심 수치는 48px 900 weight로 크게 표시
- **유형별 구조**: 템플릿 HTML의 주석에 명시된 컴포넌트 구조 따르기

**템플릿별 필수 구조:**

- **analysis**: 헤더 → score-row(핵심수치3~4) → matrix 테이블 → card + quote → 푸터
- **playbook**: hero(핵심메시지) → timeline(여정개요) → step카드(상세단계) → decision(분기점) → checklist(실행항목) → 푸터
- **comparison**: vs-header(A vs B) → side-by-side(좌우비교) → score-compare(점수바) → procon(장단점) → verdict(결론) → 푸터
- **dashboard**: header+LIVE뱃지 → kpi-grid(4열KPI+스파크라인) → progress-row(진행률) → status뱃지(green/yellow/red) → 푸터

**출력**: `NotebookLM_Agent/outputs/[slug]_인포그래픽.html`

### Step 7: 한국어 HTML 보고서 생성 (필수)

분석 결과를 읽기 좋은 **인터랙티브 HTML 보고서**로 변환. **Step 5의 템플릿 + 색상을 동일하게 적용.**

**디자인 규칙:**

- Step 5에서 선택된 색상 테마 적용 (인포그래픽과 일관된 브랜딩)
- **목차 네비게이션**: 상단 고정, 클릭하면 해당 섹션으로 스크롤
- **섹션별 카드**: 분석 내용을 섹션별로 카드 레이아웃으로 구성
- **데이터 테이블**: 수치 데이터는 테이블로 정리
- **유형별 컴포넌트**: 인포그래픽과 같은 유형의 고유 컴포넌트 사용
- **인용**: NotebookLM 분석의 인용 번호 유지
- **반응형**: 모바일에서도 읽을 수 있도록 max-width + 패딩 조정
- **인쇄 친화적**: `@media print` 스타일 포함

**출력**: `NotebookLM_Agent/outputs/[slug]_보고서.html`

### Step 8: 최종 보고

```markdown
## 리서치 완료

- **주제**: [topic]
- **소스**: YouTube 영상 [count]개
- **노트북**: [NotebookLM 노트북명]

### 산출물

| 파일 | 설명 |
|------|------|
| `analysis_[slug]_[date].md` | 분석 원문 (마크다운) |
| `[slug]_팟캐스트.wav` | 한국어 팟캐스트 |
| `[slug]_인포그래픽.html` | 한국어 인포그래픽 |
| `[slug]_보고서.html` | 한국어 HTML 보고서 |
```

## 언어 규칙 (전체 파이프라인 적용)

- **모든 산출물은 한국어**
- 고유명사(BTS, HYBE, Claude Code, n8n, MCP 등)만 영어 허용
- NotebookLM 질의 시 반드시 "한국어로 답변해주세요" 명시
- 팟캐스트: "한국어로 대화해주세요" 명시
- 인포그래픽/보고서: Claude Code가 한국어로 직접 생성

## 토큰 비용 구조

| 단계 | 비용 부담 | 설명 |
|------|-----------|------|
| YouTube 검색 | 무료 | yt-dlp 로컬 실행 |
| NotebookLM 업로드 | 무료 | Google 서버 |
| NotebookLM 분석 | 무료 | Google Gemini가 수행 |
| 팟캐스트 생성 | 무료 | Google 서버 |
| 인포그래픽 HTML | 최소 | Claude Code가 생성 |
| 보고서 HTML | 최소 | Claude Code가 생성 |

## 주의사항

- NotebookLM 소스 최대 50개/노트북
- YouTube 영상은 캡션이 있어야 분석 가능
- 팟캐스트 생성에 1~3분 소요
- 분석 결과는 항상 outputs/ 폴더에 저장
