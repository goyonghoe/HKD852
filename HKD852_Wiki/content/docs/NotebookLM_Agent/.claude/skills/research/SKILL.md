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

### Step 5: 한국어 HTML 인포그래픽 생성 (필수)

> NotebookLM의 인포그래픽은 영문만 지원하므로, **Claude Code가 분석 결과를 기반으로 직접 한국어 HTML 인포그래픽을 생성**한다.

**디자인 규칙:**

- **언어**: 모든 텍스트 한국어. 고유명사(BTS, HYBE, Claude Code 등)만 영어
- **폰트**: `Noto Sans KR` (Google Fonts)
- **테마**: 다크 모드 (#0a0e27 배경, 밝은 텍스트)
- **레이아웃**: 1200px 고정폭, CSS Grid (grid2, grid3)
- **카드**: 반투명 글래스모피즘 (rgba 배경 + 미세 보더)
- **색상 코드**: 보라(#a855f7), 핑크(#ec4899), 앰버(#f59e0b), 에메랄드(#10b981), 블루(#3b82f6), 레드(#ef4444)
- **카드 상단 3px 그라디언트 바**: 각 카드 유형별 색상 구분
- **숫자 강조**: 핵심 수치는 48px 900 weight로 크게 표시
- **구조**: 헤더 → 핵심 수치 카드 → 주요 분석 섹션 → 리스크/전망 → 푸터

**필수 포함 섹션:**

1. **헤더**: 제목 (그라디언트 텍스트) + 서브타이틀 + 날짜 배지
2. **핵심 수치 카드** (grid3): 가장 임팩트 있는 3개 숫자
3. **하이라이트 박스**: 가장 중요한 발견 (그라디언트 배경 특별 카드)
4. **분석 섹션** (grid2): 트렌드 목록 + 사례/데이터 시각화
5. **전략/적용** 섹션: 실행 가능한 인사이트
6. **리스크** 카드: 위험 요소 정리
7. **푸터**: 출처 + 날짜 + HKD852

**출력**: `NotebookLM_Agent/outputs/[slug]_인포그래픽.html`

### Step 6: 한국어 HTML 보고서 생성 (필수)

분석 결과를 읽기 좋은 **인터랙티브 HTML 보고서**로 변환.

**디자인 규칙:**

- 인포그래픽과 동일한 다크 테마 + 색상 코드
- **목차 네비게이션**: 상단 고정, 클릭하면 해당 섹션으로 스크롤
- **섹션별 카드**: 분석 내용을 섹션별로 카드 레이아웃으로 구성
- **데이터 테이블**: 수치 데이터는 테이블로 정리
- **인용**: NotebookLM 분석의 인용 번호 유지
- **반응형**: 모바일에서도 읽을 수 있도록 max-width + 패딩 조정
- **인쇄 친화적**: `@media print` 스타일 포함

**출력**: `NotebookLM_Agent/outputs/[slug]_보고서.html`

### Step 7: 최종 보고

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
