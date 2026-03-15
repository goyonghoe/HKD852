---
name: translate-cn
description: "한국어→중국어(간체/번체) 현지화"
user-invocable: true
argument-hint: "[파일 경로] [--variant simplified|traditional]"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
recommended-model: sonnet
model-reason: "중국어 현지화는 맥락 이해 필요 — Sonnet 최적"
---

# /translate-cn — 중국어 현지화

## 목적

한국어 텍스트를 중국어 간체(zh-CN) 또는 번체(zh-TW)로 현지화합니다.

## 입력

- Excel/CSV 파일 경로
- 변형 옵션: simplified (간체, 기본값) / traditional (번체)

## 절차

### Step 1: 파일 읽기

/translate 스킬과 동일한 Excel/CSV 파싱

### Step 2: 중국어 컬럼 식별

- 컬럼명: `中文`, `chinese`, `zh`, `cn`, `중국어` 중 하나
- 간체/번체 구분: `zh-CN`, `zh-TW`, `简体`, `繁體`

### Step 3: 번역 실행

- 배치 크기: 20행 (중국어는 맥락이 중요하므로 더 작은 배치)
- glossary.json의 중국어 고정 번역 적용
- 게임 용어 중국어 관행 준수 (예: HP→生命值, MP→魔力值)

### Step 4: 중국 시장 특화

- 판호 심의 민감 표현 자동 플래그
- 간체↔번체 자동 변환 옵션
- 중국 게임 시장 용어 관행 반영

## 중국 시장 주의사항

- 해골/유혈 표현 → 대체 표현 제안
- 도박 용어 → 우회 표현
- 지도 표현 → 중국 공식 표기 준수
- 정치 민감 표현 → 플래그 + 대안 제시

## 출력

- 번역된 Excel/CSV 파일 (`outputs/`)
- 민감 표현 플래그 보고서
