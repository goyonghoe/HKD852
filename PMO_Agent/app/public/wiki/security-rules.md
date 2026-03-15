# 보안 규칙

HKD852 전체 프로젝트에 적용되는 보안 관리 규칙입니다.

## API 키 관리

### 절대 금지

- `settings.json`, `settings.local.json`에 API 키 직접 입력 금지
- 코드 내 리터럴 키 하드코딩 금지
- 커밋 메시지에 시크릿 포함 금지

### 올바른 방법

```bash
# .env 파일에 저장 (git 추적 제외)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# settings.json에서는 와일드카드 참조
# "apiKey": "KEY=*"
```

## .gitignore 필수 항목

모든 에이전트 프로젝트의 `.gitignore`에 반드시 포함:

```
.env
.env.local
.env.production
*.pem
*.key
serviceAccountKey.json
```

## Bash 명령어 규칙

- 환경 변수 참조 사용: `$API_KEY`, `$DATABASE_URL`
- 리터럴 키 값을 명령어에 직접 입력 금지
- 로그 출력에 시크릿 노출 금지

## 정기 점검

### 시크릿 스캔

```bash
# 코드베이스 내 .env 파일 추적 여부 확인
git ls-files | grep -i '.env'

# API 키 패턴 검색
grep -rn 'sk-ant-\|sk-\|AIza' --include='*.ts' --include='*.json' .
```

### PII(개인식별정보) 규칙

- 사용자 실명, 이메일, 전화번호를 코드/문서에 포함 금지
- 테스트 데이터는 가명 사용
- 로그에 PII 출력 금지

## Shield Agent 점검 항목

| 점검 | 도구 | 설명 |
|------|------|------|
| `/privacy-scan` | Shield | PII 노출 스캔 |
| `/secret-scan` | Shield | API 키/시크릿 스캔 |
| `/security-audit` | Shield | OWASP Top 10 코드 리뷰 |
| `/compliance-check` | Shield | GDPR/COPPA/CCPA 준수 확인 |

## 위반 시 조치

- 시크릿 노출 감지: **즉시 키 회전(rotate)** + CEO 에스컬레이션
- PII 노출 감지: 해당 커밋 `git revert` + 히스토리 정리
