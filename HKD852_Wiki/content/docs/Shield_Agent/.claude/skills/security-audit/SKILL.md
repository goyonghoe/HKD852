---
name: security-audit
description: "OWASP Top 10 기반 코드 보안 리뷰"
user-invocable: true
allowed-tools: Read, Glob, Grep
recommended-model: opus
model-reason: "보안 취약점 심층 분석 — Opus 필수"
---

# 보안 감사 (/security-audit)

> OWASP Top 10을 기준으로 HKD852 코드베이스의 보안 취약점을 리뷰합니다.
> Quality Gate PASS(80+) 시 **자동 트리거**됩니다.

## 역할

- OWASP Top 10 (2021) 기반 HKD852 스택 맞춤 체크리스트
- Quality Gate 자동 체인 대응 (PASS 시 트리거)
- 코드/설정 파일 보안 리뷰
- 판정: **CLEAR** / **ADVISORY** / **WARNING** / **SECURITY_HOLD**

## 트리거 경로

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Quality Gate│────→│ /security-audit  │────→│ /red-review     │
│ PASS (80+)  │자동  │ (이 스킬)        │자동  │ (RedTeam, 90+) │
└─────────────┘     └──────────────────┘     └─────────────────┘
```

## 실행 절차

### Step 1: 대상 식별

사용자 지정 파일 또는 Quality Gate에서 전달된 산출물을 대상으로 합니다.

대상: `$ARGUMENTS` (미지정 시 최근 변경 파일)

### Step 2: HKD852 기술 스택 파악

`Glob`과 `Read`로 대상의 기술 스택을 파악합니다:

| 스택 요소      | 파일 패턴                       | 관련 OWASP    |
| -------------- | ------------------------------- | ------------- |
| Next.js        | `next.config.*`, `src/app/`     | A01, A03, A07 |
| API Routes     | `src/app/api/**/route.ts`       | A01, A02, A03 |
| Neon/Postgres  | `drizzle.config.*`, `schema.ts` | A03, A04      |
| Vercel Deploy  | `vercel.json`                   | A05, A06      |
| Phaser/Vite    | `vite.config.*`, `phaser`       | A06, A07      |
| Python Scripts | `*.py`, `libs/`                 | A03, A08      |
| Client JS/TS   | `src/**/*.{ts,tsx}`             | A07, A03      |

### Step 3: OWASP Top 10 체크리스트

HKD852 스택에 맞춤화된 체크리스트:

#### A01: Broken Access Control (접근 제어 취약)

- [ ] API 라우트에 인증/인가 미들웨어 적용 여부
- [ ] 클라이언트 사이드 검증만 존재하는 경우 (서버 검증 필수)
- [ ] `public/` 디렉토리에 민감 파일 존재 여부
- [ ] CORS 설정 적절성 (`Access-Control-Allow-Origin: *` 주의)
- [ ] API 라우트의 HTTP 메서드 제한 (불필요한 DELETE/PUT 열림)

#### A02: Cryptographic Failures (암호화 실패)

- [ ] 하드코딩된 시크릿/키 (→ `/secret-scan`과 연계)
- [ ] HTTP(비암호화) 외부 호출 존재 여부
- [ ] 민감 데이터 평문 저장/전송
- [ ] 약한 해시 알고리즘 (MD5, SHA1) 사용

#### A03: Injection (인젝션)

- [ ] SQL 인젝션: 문자열 연결 쿼리 (`'` + userInput + `'`)
- [ ] NoSQL 인젝션: 동적 쿼리 필터
- [ ] Command 인젝션: `exec()`, `spawn()`, `system()` + 사용자 입력
- [ ] XSS: `dangerouslySetInnerHTML`, 이스케이프 안 된 렌더링
- [ ] 템플릿 인젝션: 동적 템플릿 컴파일

#### A04: Insecure Design (불안전한 설계)

- [ ] 레이트 리밋 미적용 API
- [ ] 결제 금액 클라이언트 사이드 결정
- [ ] 게임 점수/보상 클라이언트 사이드 계산 (치트 가능)
- [ ] 비밀번호 복잡도 미검증

#### A05: Security Misconfiguration (보안 설정 오류)

- [ ] 디버그 모드 프로덕션 노출 (`NODE_ENV !== 'production'`)
- [ ] 불필요한 포트/서비스 열림
- [ ] 기본 계정/비밀번호 미변경
- [ ] 에러 메시지에 내부 정보 노출 (스택트레이스, DB 스키마)
- [ ] `vercel.json` 보안 헤더 미설정

#### A06: Vulnerable Components (취약 컴포넌트)

- [ ] 알려진 취약점 있는 npm 패키지
- [ ] 오래된 의존성 (2년+)
- [ ] 미사용 의존성 잔류

#### A07: Auth Failures (인증 실패)

- [ ] 세션 토큰 클라이언트 노출
- [ ] JWT 시크릿 하드코딩
- [ ] 세션 만료 미설정
- [ ] 브루트포스 방어 미적용

#### A08: Data Integrity (데이터 무결성)

- [ ] 의존성 무결성 검증 (lock 파일)
- [ ] CI/CD 파이프라인 보안
- [ ] 자동 업데이트 서명 미검증

#### A09: Logging Failures (로깅 실패)

- [ ] 보안 이벤트 로깅 미구현
- [ ] 로그에 민감 데이터 포함
- [ ] 감사 추적(audit trail) 부재

#### A10: SSRF (서버 사이드 요청 위조)

- [ ] 사용자 입력 URL로 서버 사이드 요청
- [ ] 내부 네트워크 접근 가능 경로
- [ ] URL 스키마/호스트 화이트리스트 미적용

### Step 4: 심각도 분류

| 심각도   | 기준                                    |
| -------- | --------------------------------------- |
| CRITICAL | 즉시 악용 가능, 데이터 유출/서비스 장애 |
| HIGH     | 악용 가능하나 조건 필요                 |
| MEDIUM   | 잠재적 위험, 직접 악용 어려움           |
| LOW      | 모범 사례 미준수, 실질 위험 낮음        |
| INFO     | 정보 제공, 위험 없음                    |

### Step 5: 판정

| 판정          | 조건                                |
| ------------- | ----------------------------------- |
| CLEAR         | CRITICAL/HIGH 없음, MEDIUM 2개 이하 |
| ADVISORY      | HIGH 없음, MEDIUM 3개 이상          |
| WARNING       | HIGH 1개 이상 또는 MEDIUM 5개 이상  |
| SECURITY_HOLD | CRITICAL 1개 이상 — 배포 차단       |

### Step 6: 출력 형식

```markdown
## Shield_Agent — 보안 감사 결과

**대상**: [파일/모듈]
**트리거**: [수동 / Quality Gate 자동]
**일시**: [YYYY-MM-DD HH:MM]
**판정**: [CLEAR / ADVISORY / WARNING / SECURITY_HOLD]

### OWASP 체크 요약

| OWASP | 항목                      | 점검 | 발견 | 심각도 |
| ----- | ------------------------- | ---- | ---- | ------ |
| A01   | Broken Access Control     | [N]  | [N]  | [등급] |
| A02   | Cryptographic Failures    | [N]  | [N]  | [등급] |
| A03   | Injection                 | [N]  | [N]  | [등급] |
| A04   | Insecure Design           | [N]  | [N]  | [등급] |
| A05   | Security Misconfiguration | [N]  | [N]  | [등급] |
| A06   | Vulnerable Components     | [N]  | [N]  | [등급] |
| A07   | Auth Failures             | [N]  | [N]  | [등급] |
| A08   | Data Integrity            | [N]  | [N]  | [등급] |
| A09   | Logging Failures          | [N]  | [N]  | [등급] |
| A10   | SSRF                      | [N]  | [N]  | [등급] |

### 발견 사항

| #   | OWASP | 심각도 | 파일 | 라인 | 설명 | 권장 수정 |
| --- | ----- | ------ | ---- | ---- | ---- | --------- |

### 권고사항

1. [CRITICAL — 즉시 수정]
2. [HIGH — 다음 배포 전 수정]
3. [MEDIUM — 단기 개선]
4. [LOW — 장기 개선]
```

#### SECURITY_HOLD 시

**배포 즉시 차단** + CEO 에스컬레이션:

- CRITICAL 취약점 상세 설명
- 영향 범위 분석
- 즉각 완화 방안 제시
