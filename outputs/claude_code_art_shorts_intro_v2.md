---
marp: true
theme: default
paginate: true
style: |
  /* 기본 설정 - 밝은 테마, 높은 가독성 */
  section {
    background: #ffffff;
    color: #222222;
    font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
    padding: 50px 70px;
  }

  /* 제목 스타일 */
  h1 {
    color: #1a1a1a;
    font-size: 44px;
    font-weight: 700;
    margin-bottom: 30px;
    border-bottom: 3px solid #FF6B6B;
    padding-bottom: 15px;
  }

  h2 {
    color: #333333;
    font-size: 32px;
    font-weight: 600;
    margin-bottom: 25px;
  }

  /* 본문 스타일 */
  p, li {
    font-size: 22px;
    line-height: 1.7;
    color: #333333;
  }

  ul, ol {
    margin-left: 15px;
  }

  li {
    margin-bottom: 10px;
  }

  /* 강조 - 명확한 색상 */
  strong {
    color: #FF6B6B;
    font-weight: 700;
  }

  /* 코드 블록 */
  code {
    background: #f5f5f5;
    color: #333333;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 18px;
  }

  pre {
    background: #f8f8f8;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 20px;
  }

  pre code {
    background: transparent;
    font-size: 16px;
  }

  /* 테이블 */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 18px;
    margin: 20px 0;
  }

  th {
    background: #FF6B6B;
    color: white;
    padding: 12px 15px;
    text-align: left;
    font-weight: 600;
  }

  td {
    padding: 12px 15px;
    border-bottom: 1px solid #e0e0e0;
  }

  tr:nth-child(even) {
    background: #f9f9f9;
  }

  /* 타이틀 슬라이드 */
  section.title {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  section.title h1 {
    color: white;
    font-size: 52px;
    border: none;
    margin-bottom: 20px;
  }

  section.title h2 {
    color: rgba(255,255,255,0.9);
    font-size: 28px;
    font-weight: 400;
  }

  section.title p {
    color: rgba(255,255,255,0.8);
    font-size: 22px;
  }

  /* 섹션 구분 슬라이드 */
  section.section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    background: #f8f9fa;
  }

  section.section h1 {
    font-size: 48px;
    border: none;
  }

  /* 페이지 번호 */
  section::after {
    color: #999999;
    font-size: 14px;
  }
---

<!-- _class: title -->
<!-- _paginate: false -->

# 🎨 아트 드로잉 쇼츠
# AI 자동화 가이드

## Claude Code로 콘텐츠 제작 10배 빠르게

틱톡 & 유튜브 쇼츠 크리에이터를 위한 소개서

---

# 이런 고민, 있으신가요?

- 😫 **"오늘은 뭘 그리지?"** — 매일 반복되는 주제 고민
- 🤔 **"요즘 뭐가 핫하지?"** — 트렌드 파악의 어려움
- ⏰ **"스크립트 쓰는 시간이 너무 오래 걸려"**
- 📉 **"조회수 터지는 패턴을 모르겠어"**

---

# Claude Code란?

**AI 기반 콘텐츠 제작 도우미**입니다.

자연어로 대화하듯 요청하면,
AI가 분석하고 결과물을 만들어줍니다.

```
예시 대화:
"아트 드로잉 쇼츠 트렌드 분석해줘"
"이번 주 콘텐츠 주제 5개 추천해줘"
"60초 스크립트 써줘"
```

---

# Before vs After

| 항목 | 기존 방식 | Claude Code |
|------|----------|-------------|
| 트렌드 분석 | 30분 이상 | **2분** |
| 주제 도출 | 1시간 | **즉시 10개** |
| 스크립트 작성 | 30분 | **1분** |
| 해시태그 조합 | 10분 | **즉시** |
| **합계** | **2시간+** | **5분** |

---

<!-- _class: section -->

# 🔄 자동화 파이프라인

---

# 4단계 자동화 흐름

```
[1단계] 트렌드 분석
        "요즘 아트 쇼츠에서 뭐가 핫해?"
              ↓
[2단계] 주제 추천
        "조회수 잘 나올 주제 10개 추천해줘"
              ↓
[3단계] 스크립트 생성
        "이 주제로 60초 스크립트 써줘"
              ↓
[4단계] 해시태그 최적화
        "바이럴 해시태그 조합 추천해줘"
```

---

# 예시 1: 트렌드 분석 요청

**입력:**
```
아트 드로잉 틱톡에서 최근 1주일간
조회수 높은 콘텐츠 유형 분석해줘
```

**결과:**

| 순위 | 콘텐츠 유형 | 평균 조회수 | 핵심 특징 |
|:---:|------------|:---------:|----------|
| 1 | 캐릭터 변환 | 500K+ | "OO를 내 스타일로" |
| 2 | 타임랩스 | 300K+ | 10초 내 완성 |
| 3 | 비포/애프터 | 250K+ | 극적인 대비 |

---

# 예시 2: 스크립트 생성 요청

**입력:**
```
"피카츄를 지브리 스타일로 그리기"
60초 쇼츠 스크립트 써줘.
Hook이 강력해야 해.
```

**결과:**
| 구간 | 시간 | 내용 |
|------|------|------|
| Hook | 0-3초 | "피카츄가 토토로 세계에 있다면?" |
| 스케치 | 3-15초 | 실루엣부터 잡는 과정 |
| 채색 | 15-40초 | 지브리 특유의 파스텔 톤 |
| 디테일 | 40-55초 | 눈에 생기, 빛 표현 |
| 마무리 | 55-60초 | 완성작 + "다음엔 뭘 그릴까요?" |

---

<!-- _class: section -->

# 🎯 조회수 터지는 패턴

---

# 바이럴 공식 3가지

## 1. 변환/크로스오버
- "**OO**를 **XX 스타일**로 그리면?"
- "만약 **디즈니 캐릭터**가 **애니 캐릭터**였다면"

## 2. 챌린지 참여
- 현재 유행하는 밈 + 드로잉 접목

## 3. 감정 자극
- 비포/애프터 극적 대비
- 성장 스토리 (첫 그림 vs 지금)

---

# 매주 절약되는 시간

| 작업 | 수동 | Claude Code | 절약 |
|-----|:---:|:----------:|:---:|
| 주간 트렌드 분석 | 2시간 | 5분 | **115분** |
| 주제 10개 도출 | 1시간 | 2분 | **58분** |
| 스크립트 5개 | 2.5시간 | 10분 | **140분** |
| **주간 합계** | **5.5시간** | **17분** | **5시간+** |

**→ 매주 5시간을 그림 그리는 데 쓰세요!**

---

# 더 많은 활용법

✅ **해시태그 최적화** — 도달률 높은 조합 추천

✅ **댓글 분석** — 시청자가 원하는 콘텐츠 파악

✅ **경쟁 채널 분석** — 성공 패턴 벤치마킹

✅ **업로드 타이밍** — 최적 게시 시간 추천

✅ **시리즈 기획** — 연속 콘텐츠 아이디어

---

# 5분 만에 시작하기

### Step 1: Claude Code 설치
```
npm install -g @anthropic-ai/claude-code
```

### Step 2: 첫 번째 대화
```
"아트 드로잉 쇼츠 트렌드 분석하고
이번 주 콘텐츠 3개 추천해줘"
```

### Step 3: 끝!
결과를 받고, 그림 그리기 시작 🎨

---

# 핵심 요약

> **Claude Code = 당신의 AI 콘텐츠 매니저**

| 기능 | 효과 |
|------|------|
| 트렌드 자동 분석 | 시장 파악 |
| 바이럴 주제 추천 | 조회수 증가 |
| 스크립트 즉시 생성 | 시간 절약 |
| 해시태그 최적화 | 노출 증가 |

**그림 그리는 시간에 집중하세요.**
**나머지는 Claude Code가 할게요.**

---

<!-- _class: title -->
<!-- _paginate: false -->

# 🎨 Happy Creating!

## Claude Code와 함께라면
## 매일이 바이럴 기회입니다

궁금한 점은 이 소개서를 보내준 분에게 문의하세요!
