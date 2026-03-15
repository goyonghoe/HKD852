---
name: translate-eu
description: "한국어→프랑스어/독일어/스페인어 현지화"
user-invocable: true
argument-hint: "[파일 경로] [--lang fr|de|es|all]"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
recommended-model: sonnet
model-reason: "EU 현지화는 Sonnet 최적"
---

# /translate-eu — EU 언어 현지화

## 목적

한국어 텍스트를 프랑스어(fr), 독일어(de), 스페인어(es)로 현지화합니다.

## 입력

- Excel/CSV 파일 경로
- 언어 옵션: fr / de / es / all (기본값: all)

## 절차

### Step 1: 파일 읽기 및 컬럼 식별

- 프랑스어: `français`, `french`, `fr`
- 독일어: `deutsch`, `german`, `de`
- 스페인어: `español`, `spanish`, `es`

### Step 2: 번역 실행

- 배치 크기: 25행
- glossary.json의 EU 언어 고정 번역 적용
- 성별/격변화 고려 (독일어 특히 중요)

### Step 3: EU 시장 특화

- PEGI 등급 관련 표현 확인
- EU 개인정보 관련 텍스트 GDPR 준수 확인
- 문화적 중립성 유지

## 출력

- 번역된 Excel/CSV 파일 (`outputs/`)
