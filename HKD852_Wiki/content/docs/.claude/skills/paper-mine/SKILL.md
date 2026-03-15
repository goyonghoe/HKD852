---
name: paper-mine
description: "학술 논문 발굴 + 쇼츠 적합도 스코어링"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebSearch
recommended-model: sonnet
model-reason: "논문 분석과 스코어링에 Sonnet의 균형잡힌 추론이 적합"
argument-hint: "--doi '10.xxxx/yyyy' | --url 'https://...' | --discover N (기본 3)"
---

# /paper-mine — 투자 심리 논문 발굴 + 스코어링

## 역할

**투자 심리 / 행동경제학** 분야의 학술 논문을 발굴하고, YouTube Shorts 에피소드 적합도를 스코어링합니다.
채널 니치: 투자자의 인지 편향, 감정적 의사결정, 시장 비효율성을 학술 근거로 설명.

## 입력 모드

### Mode 1: DOI 직접 조회

```
/paper-mine --doi "10.3390/ijerph15051020"
```

DOI를 기반으로 논문 메타데이터를 추출합니다. WebSearch로 PubMed/CrossRef에서 조회.

### Mode 2: URL 기반 추출

```
/paper-mine --url "https://pubmed.ncbi.nlm.nih.gov/12345678/"
```

논문 URL에서 메타데이터를 추출합니다. PubMed, arXiv, Nature, Science, The Lancet 등 지원.

### Mode 3: 자동 발굴

```
/paper-mine --discover 3
```

WebSearch로 트렌딩/바이럴 연구 논문을 자동 발굴합니다.
`templates/paper_sources.json`의 카테고리별 검색 쿼리를 활용합니다.

## 실행 흐름

1. **메타데이터 추출** — 논문에서 필수 정보 수집:
   - title (영문 원제)
   - authors (저자명)
   - journal (저널명)
   - year (발표 연도)
   - doi (DOI 또는 PMC ID)
   - peer_reviewed (boolean)
   - institution (연구 기관)
   - sample_size (해당 시)
   - key_finding (핵심 발견 1문장, 한국어)

2. **중복 체크** — `pipeline/scripts/paper_ep*.json`의 `paper_source.doi` 비교:
   - 동일 DOI → `DUPLICATE` (즉시 중단)
   - 유사 주제 → `SIMILAR: paper_epNNN` (경고만, 계속 진행)

3. **적합도 스코어링** (100점 만점):

| 기준          | 가중치 | 평가 포인트                                         |
| ------------- | ------ | --------------------------------------------------- |
| 투자자 공감   | 30%    | "나도 이러는데!" 반응이 나오는가? 투자 경험과 직결? |
| 서프라이즈    | 25%    | 반직관적 결과? 투자 통념을 깨는가?                  |
| 실전 적용성   | 20%    | 내일 당장 투자에 적용할 수 있는 인사이트?           |
| 시각화 가능성 | 15%    | 인포그래픽으로 표현 가능? (차트, 뇌 이미지 등)      |
| 소스 품질     | 10%    | 피어리뷰 저널? IF? 샘플 사이즈?                     |

최소 통과 점수: **60점** (미만이면 WARNING 표시)

4. **훅 앵글 제안** — `templates/hooks.json` 패턴 활용:
   - 2~3개 훅 초안 제시 (paper-shock, number-hook, you-didnt-know 등)

## 출력

파일: `pipeline/topics/YYYY-MM-DD_paper_{N}.yaml`

```yaml
date: "2026-02-27"
mode: "doi"
paper:
  title: "Modern Day High: The Neurocognitive Impact of Social Media"
  authors: "Satani A, Kheskani Satani K, et al."
  journal: "Cureus"
  year: 2025
  doi: "PMC12329480"
  peer_reviewed: true
  institution: "Satani Research Centre"
  sample_size: 100
  key_finding: "SNS를 20분 이상 스크롤하면 뇌의 알파파가 40% 감소"
scoring:
  surprise: 85
  relatability: 90
  visual_potential: 75
  rpm_potential: 70
  source_quality: 80
  total: 81
hook_angles:
  - pattern: "paper-shock"
    draft: "Nature에 실린 논문이 이걸 증명했습니다."
  - pattern: "number-hook"
    draft: "100명을 뇌파 측정했더니, 20분 만에..."
duplicate_check: "CLEAR"
```

## 속도 목표

2분 이내 (WebSearch 2~3회 + 스코어링)

## 참조

- `templates/paper_sources.json` — 카테고리별 검색 쿼리 + 신뢰 저널 목록
- `templates/hooks.json` — 훅 패턴 라이브러리
- `pipeline/scripts/paper_ep*.json` — 중복 체크 대상
