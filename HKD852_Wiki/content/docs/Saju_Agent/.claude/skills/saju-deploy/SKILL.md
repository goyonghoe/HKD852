---
name: saju-deploy
description: "Vercel 배포 실행 및 상태 확인"
user-invocable: true
allowed-tools: Read, Bash, Glob, Grep
---

# /saju-deploy — 배포 관리

## 목적

사주풀이 서비스의 Vercel 배포를 실행하고 상태를 확인합니다.

## 실행 절차

1. **빌드 검증**: `npm run build` 로컬 빌드 확인
2. **환경변수 확인**: 필수 env 설정 상태 점검
3. **배포 실행**: Vercel CLI 또는 Git push 배포
4. **상태 확인**: 배포 URL 접근성, API 헬스체크

## 필수 환경변수

- `ANTHROPIC_API_KEY` — Claude API
- `DATABASE_URL` — Neon PostgreSQL
- `NEXT_PUBLIC_PORTONE_STORE_ID` — PortOne 스토어
- `PORTONE_API_SECRET` — PortOne 서버 시크릿
- `NEXT_PUBLIC_PORTONE_CHANNEL_KEY` — PortOne 채널
- `NEXT_PUBLIC_BASE_URL` — 서비스 URL

## 배포 대상

- Vercel, Seoul (icn1) region
