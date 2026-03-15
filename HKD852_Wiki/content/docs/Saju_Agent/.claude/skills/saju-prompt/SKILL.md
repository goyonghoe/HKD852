---
name: saju-prompt
description: "AI 사주 해석 프롬프트 품질 분석 및 개선"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# /saju-prompt — AI 사주 해석 프롬프트 튜닝

## 목적

사주 해석 AI 프롬프트(teaser, full-reading)의 품질을 분석하고 개선합니다.

## 실행 절차

1. **현재 프롬프트 분석**: `lib/ai/prompts/teaser.ts`, `lib/ai/prompts/full-reading.ts` 읽기
2. **품질 평가**: 응답 파서 `lib/ai/response-parser.ts`의 fallback 빈도 확인
3. **개선 제안**: 프롬프트 구조, 톤, 출력 포맷 개선안 제시
4. **A/B 비교**: 기존 vs 개선 프롬프트 결과 비교
5. **적용**: 승인 후 프롬프트 파일 업데이트

## 체크포인트

- JSON 출력 안정성 (파싱 실패율 < 5%)
- 한국어 자연스러움 (MZ세대 톤)
- 섹션별 콘텐츠 충실도 (3문장 이상)
- 성별/오행별 개인화 수준
