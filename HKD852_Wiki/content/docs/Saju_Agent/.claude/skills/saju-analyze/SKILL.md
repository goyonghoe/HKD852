---
name: saju-analyze
description: "사주풀이 서비스 전환율/결제/사용자 데이터 분석"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# /saju-analyze — 서비스 분석

## 목적

사주풀이 서비스의 전환율, 결제율, 사용자 행동 데이터를 분석합니다.

## 분석 항목

1. **퍼널 분석**: 홈 방문 → 입력 완료 → 티저 조회 → 결제 → 상세 풀이
2. **결제 전환율**: 티저 조회 대비 결제 비율
3. **공유율**: 상세 풀이 완료 → 공유 링크 생성 비율
4. **재방문율**: 공유 링크를 통한 신규 유입
5. **오류율**: API 실패, 결제 실패, 파싱 실패 빈도

## 데이터 소스

- Neon PostgreSQL `orders` 테이블
- Vercel Analytics (배포 시)
- PortOne 결제 대시보드

## 산출물

- `outputs/` 디렉토리에 HTML 분석 보고서 생성
