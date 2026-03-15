---
name: ai-news-daily
description: "데일리 브리핑 6섹션 — AI·게임·KPOP·앱스토어·숏폼·시장"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch
---

# 데일리 브리핑 (6섹션)

하루 한 번 Kowloon에게 필요한 6개 분야 뉴스를 수집, 요약하여 Obsidian Vault에 한글 마크다운으로 저장합니다.

## 실행 흐름

### 1단계: 뉴스 수집 (WebSearch 8회, 병렬)

```
# AI (3회)
WebSearch: "AI artificial intelligence news today {YYYY}" (글로벌)
WebSearch: "AI 인공지능 뉴스 오늘" (한국)
WebSearch: "AI news China Japan Europe today {YYYY}" (지역별)

# 게임 (2회)
WebSearch: "game industry news {month} {YYYY} mobile console"
WebSearch: "게임업계 뉴스 {YYYY}년 {M}월 모바일 콘솔"

# KPOP (2회)
WebSearch: "KPOP global news {month} {YYYY} chart billboard"
WebSearch: "KPOP 글로벌 뉴스 {YYYY}년 {M}월 빌보드 차트"

# 앱스토어 + 숏폼 + 시장 (1회씩, 필요 시 추가)
WebSearch: "top grossing mobile games {month} {YYYY} Korea Japan"
WebSearch: "YouTube Shorts algorithm trends RPM {YYYY}"
WebSearch: "코스피 환율 USD KRW 게임주 엔터주 {YYYY}년 {M}월"
```

### 2단계: 6섹션 구성

수집된 뉴스에서 **중복 제거** 후 아래 6섹션으로 정리:

#### 🤖 AI 업계 동향

- 종합 동향 (2~3문장) + 헤드라인 TOP 5 + 국가별 TOP 테이블

#### 🎮 게임 업계 동향

- 종합 동향 + 헤드라인 TOP 5 + 주요 출시 일정 테이블

#### 🎤 KPOP 글로벌 동향

- 종합 동향 + 헤드라인 TOP 5 + 주요 일정 테이블

#### 📱 앱스토어 & 경쟁작

- 모바일 게임 매출 동향 + 리듬게임 경쟁작 현황
- SSBL 시사점 박스 (💡) 포함

#### 🎬 숏폼 트렌드

- YouTube Shorts RPM/알고리즘 변화 + 숏폼 전체 트렌드
- What-If/논문 채널 시사점 박스 (💡) 포함

#### 💹 시장 한 줄

- USD/KRW, 코스피 + 특이사항 3줄 이내 테이블

### 3단계: 마크다운 생성

**파일 경로**: `$VAULT/06_Reference/AI_News/YYYY-MM-DD.md`

- `$VAULT` = `/Users/yong/MainFolder/My_AI_Project/HKD852_Vault`

**⚠️ 덮어쓰기 금지**: 파일 존재 여부 먼저 확인. 이미 있으면 Read로 읽은 뒤 Edit으로 섹션별 업데이트 (최신 뉴스로 갱신). 새 파일이면 Write로 생성.

**YAML frontmatter**:

```yaml
---
date: "YYYY-MM-DD"
type: daily-brief
tags: [ai-news, game-news, kpop-news, app-store, shorts, market, daily]
---
```

**제목**: `# 📡 데일리 브리핑 — YYYY-MM-DD`

각 섹션은 `---` 구분선으로 분리.

## 작성 규칙

1. **한글 중심**: 모든 요약/제목은 한글. 고유명사(OpenAI, BTS, Switch 2 등)만 영문 유지
2. **간결함 우선**: 각 섹션 TOP 5 이내. 전체 스캔 5분 이내 분량
3. **중복 제거**: 같은 사건은 가장 신뢰도 높은 소스 1개만
4. **링크 필수**: 원문 URL 항상 포함
5. **시사점 박스**: 앱스토어(SSBL), 숏폼(What-If) 섹션에 💡 시사점 필수
6. **시장 한 줄**: 3줄 테이블. 간결하게. 급등락 시 ⚠️ 경고

## 참고 파일

- 기존 AI_News 웹앱: `AI_News/src/lib/rss.ts` (RSS 소스 목록)
- SSBL 프로젝트: `SSBL/` (런칭 체크리스트)
- 쇼츠 채널: `ShortsFactory_Agent/`, `ShortsFactory2_Agent/`

## `/loop` 연동

```
/loop 24h /ai-news-daily
```

매일 1회 자동 실행. 이미 오늘자 파일이 있으면 스킵.
