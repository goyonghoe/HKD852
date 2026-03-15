---
name: yt-search
description: "YouTube 검색 + 메타데이터 수집 (yt-dlp 기반)"
user-invocable: true
allowed-tools: Bash, Read, Write
---

# YouTube Search Skill

YouTube에서 키워드 기반 영상 검색 및 메타데이터 수집.

## 사용법

```
/yt-search [query] [count]
```

- `query`: 검색 키워드 (필수)
- `count`: 결과 수 (기본 10, 최대 50)

## 실행 절차

### 1. 검색 실행

```bash
python3 NotebookLM_Agent/scripts/yt_search.py "검색어" --count 10 --output NotebookLM_Agent/outputs/yt_search_결과.json
```

### 2. 결과 요약

검색 결과를 테이블로 정리하여 사용자에게 보고:

| #   | 제목 | 채널 | 조회수 | 길이 | 업로드일 |
| --- | ---- | ---- | ------ | ---- | -------- |

### 3. 캡션 추출 (선택)

사용자가 특정 영상의 캡션을 원하면:

```bash
python3 NotebookLM_Agent/scripts/yt_captions.py "VIDEO_URL" --lang en --output NotebookLM_Agent/outputs/captions_VIDEO_ID.json
```

## 출력

- `NotebookLM_Agent/outputs/yt_search_*.json` — 검색 결과
- `NotebookLM_Agent/outputs/captions_*.json` — 캡션 (선택)

## 의존성

- `yt-dlp`: `pip3 install yt-dlp`

## 주의사항

- YouTube 검색 결과는 지역/시간에 따라 달라질 수 있음
- 대량 요청 시 YouTube에서 차단될 수 있으므로 count는 50 이하 권장
