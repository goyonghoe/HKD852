---
name: secret-scan
description: "API 키/토큰/인증서 등 시크릿 코드베이스 스캔"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
recommended-model: haiku
model-reason: "패턴 매칭 기반 빠른 스캔 — Haiku 최적"
---

# 시크릿 스캔 (/secret-scan)

> 코드베이스 전체에서 하드코딩된 시크릿, API 키, 인증서를 패턴 기반으로 탐지합니다.

## 역할

- 코드/설정 파일 내 하드코딩된 시크릿 패턴 탐지
- Git 히스토리 내 커밋된 시크릿 검사
- 기존 방어선(`.claudeignore` / `.gitignore` / `security-guard.sh`) 갭 분석
- 판정: **CLEAR** / **WARNING** / **CRITICAL**

## 실행 절차

### Step 1: 스캔 대상 결정

사용자가 경로를 지정하면 해당 경로만, 미지정 시 전체 코드베이스를 스캔합니다.

대상: `$ARGUMENTS` (미지정 시 프로젝트 루트)

### Step 2: 시크릿 패턴 스캔

다음 패턴을 `Grep`으로 코드베이스 전체 검색합니다:

#### 2-1. API 키 패턴

| 패턴                              | 설명                  |
| --------------------------------- | --------------------- |
| `sk-ant-[a-zA-Z0-9]{20,}`         | Anthropic API 키      |
| `sk-[a-zA-Z0-9]{20,}`             | OpenAI API 키         |
| `AKIA[0-9A-Z]{16}`                | AWS Access Key ID     |
| `ghp_[a-zA-Z0-9]{36}`             | GitHub Personal Token |
| `gho_[a-zA-Z0-9]{36}`             | GitHub OAuth Token    |
| `glpat-[a-zA-Z0-9\-]{20,}`        | GitLab Personal Token |
| `xoxb-[0-9]{10,}`                 | Slack Bot Token       |
| `xoxp-[0-9]{10,}`                 | Slack User Token      |
| `AIza[0-9A-Za-z\-_]{35}`          | Google API Key        |
| `ya29\.[0-9A-Za-z\-_]+`           | Google OAuth Token    |
| `EAAL[a-zA-Z0-9]+`                | Facebook Access Token |
| `sq0[a-z]{3}-[0-9A-Za-z\-_]{22,}` | Square Token          |

#### 2-2. 인증서/키 파일

| 패턴                    | 설명             |
| ----------------------- | ---------------- |
| `BEGIN.*PRIVATE KEY`    | 개인키 파일 내용 |
| `BEGIN CERTIFICATE`     | 인증서 파일 내용 |
| `BEGIN RSA PRIVATE KEY` | RSA 개인키       |

#### 2-3. 하드코딩 시크릿

| 패턴                                       | 설명                       |
| ------------------------------------------ | -------------------------- |
| `password\s*[:=]\s*['"][^'"]{4,}`          | 하드코딩 비밀번호          |
| `secret\s*[:=]\s*['"][^'"]{4,}`            | 하드코딩 시크릿            |
| `api[_-]?key\s*[:=]\s*['"][^'"]{8,}`       | 하드코딩 API 키            |
| `token\s*[:=]\s*['"][^'"]{8,}`             | 하드코딩 토큰              |
| `auth[_-]?token\s*[:=]\s*['"][^'"]{8,}`    | 하드코딩 인증 토큰         |
| `access[_-]?key\s*[:=]\s*['"][^'"]{8,}`    | 하드코딩 액세스 키         |
| `client[_-]?secret\s*[:=]\s*['"][^'"]{8,}` | 하드코딩 클라이언트 시크릿 |
| `database[_-]?url\s*[:=]\s*['"]postgres`   | DB 연결 문자열             |
| `mongodb(\+srv)?://[^/\s]+`                | MongoDB 연결 문자열        |

### Step 3: Git 히스토리 검사

`Bash`로 git log에서 시크릿이 커밋된 이력을 검사합니다:

```bash
# 최근 100 커밋에서 시크릿 패턴 검색
git log -p -100 --diff-filter=A -- '*.env' '*.pem' '*.key' 2>/dev/null | head -50
```

```bash
# .env 파일이 커밋된 적 있는지 확인
git log --all --oneline -- '*.env' '*.env.*' '*.pem' '*.key' 'credentials*' 'secrets*' 2>/dev/null | head -20
```

### Step 4: 방어선 갭 분석

기존 방어 메커니즘의 커버리지를 확인합니다:

1. **`.claudeignore` 확인**: `Read`로 읽어서 시크릿 관련 패턴 커버리지 확인
2. **`.gitignore` 확인**: `Read`로 읽어서 시크릿 파일 제외 여부 확인
3. **`security-guard.sh` 확인**: `Read`로 읽어서 PreToolUse hook 패턴 확인
4. **갭 식별**: 위 3개에서 놓치고 있는 패턴 리스트업

### Step 5: 오탐 필터링

다음은 스캔 결과에서 **제외**합니다:

- `.example`, `.template`, `.sample` 파일의 플레이스홀더 값
- 테스트 코드의 목(mock) 값 (`test`, `spec`, `__test__` 경로)
- 환경변수 참조 (`process.env.`, `os.environ`, `${VAR_NAME}`)
- 문서/가이드의 예시 코드
- `node_modules/`, `.next/`, `dist/`, `build/` 내 파일

### Step 6: 판정 및 보고

#### 판정 기준

| 판정     | 조건                                             |
| -------- | ------------------------------------------------ |
| CLEAR    | 시크릿 미발견, 방어선 갭 없음                    |
| WARNING  | 의심 패턴 발견 또는 방어선 갭 존재               |
| CRITICAL | 확실한 시크릿 노출 발견 (API 키, 개인키, DB URL) |

#### 출력 형식

```markdown
## Shield_Agent — 시크릿 스캔 결과

**대상**: [스캔 범위]
**일시**: [YYYY-MM-DD HH:MM]
**판정**: [CLEAR / WARNING / CRITICAL]

### 스캔 요약

| 카테고리 | 스캔 파일 수 | 발견 | 심각도 |
| -------- | ------------ | ---- | ------ |

### 발견 사항 (판정이 CLEAR가 아닌 경우)

| #   | 심각도 | 파일 | 라인 | 패턴 유형 | 설명 |
| --- | ------ | ---- | ---- | --------- | ---- |

### Git 히스토리 검사

- 커밋된 시크릿 파일: [있음/없음]
- 상세: [...]

### 방어선 갭 분석

| 방어선              | 커버리지 | 미커버 패턴 |
| ------------------- | -------- | ----------- |
| `.claudeignore`     | [%]      | [...]       |
| `.gitignore`        | [%]      | [...]       |
| `security-guard.sh` | [%]      | [...]       |

### 권고사항

1. [즉시 조치]
2. [방어선 보완]
3. [프로세스 개선]
```

#### CRITICAL 판정 시

**CEO 에스컬레이션 필수**:

- 노출된 키 즉시 로테이션 권고
- git history 정리 필요 여부 안내
- 영향 범위 분석
