---
name: cultural-adapt
description: "문화적 맥락 적응 — 단순 번역이 아닌 현지화 컨설팅"
user-invocable: true
argument-hint: "[콘텐츠 경로] [타겟 시장: na/eu/cn/kr/jp]"
allowed-tools: Read, Write, Glob, Grep, WebSearch
recommended-model: opus
model-reason: "문화적 맥락 분석에 Opus의 깊은 이해 필요"
---

# /cultural-adapt — 문화적 적응

## 목적

단순 언어 번역을 넘어, 각 시장의 문화적 맥락에 맞게 콘텐츠를 적응시킵니다.

## 입력

- 콘텐츠 경로 (게임 텍스트, 마케팅 카피, UI 스트링)
- 타겟 시장

## 분석 영역

### 표현 적응

- 숫자 형식 (1,000 vs 1.000)
- 날짜 형식 (MM/DD vs DD/MM)
- 통화 표시 ($, €, ¥, ₩)
- 색상 의미 (빨간색: 행운 vs 위험)

### 문화적 참조

- 속담/관용구 → 현지 동등 표현
- 유머 → 현지 문화에 맞게 조정
- 캐릭터 이름 → 현지화 여부 판단
- 계절/명절 이벤트 → 현지 달력 반영

### 규제 적응

- 연령 등급 체계 (ESRB/PEGI/GRAC/CERO)
- 확률형 아이템 공시 (한국, 중국 의무)
- 개인정보 동의 문구 (시장별 법규)

## 출력

```markdown
## Cultural Adaptation Report

**타겟 시장**: [시장]

### 적응 필요 항목

| 원문 | 현재 번역 | 적응 제안 | 이유 |
| ---- | --------- | --------- | ---- |

### 문화적 리스크

| 항목 | 리스크 수준 | 설명 |
| ---- | ----------- | ---- |

### 권고사항

- [적응 항목]
```
