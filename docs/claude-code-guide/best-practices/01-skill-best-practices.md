# Claude 스킬 베스트 프랙티스

> **출처**: https://docs.anthropic.com/en/docs/claude-code/skills
> **최종 동기화**: 2026-02-04
> **버전**: v1.0

## 1. 스킬 설계 원칙

### 단일 책임 원칙
```yaml
# ❌ 나쁜 예: 너무 많은 책임
name: do-everything
description: 코드 작성, 테스트, 배포, 문서화 모두 처리

# ✅ 좋은 예: 명확한 단일 책임
name: write-tests
description: 코드에 대한 테스트 케이스 작성
```

### 명확한 입출력 정의
```yaml
---
name: format-json
description: JSON 파일을 정리하고 포맷팅
argument-hint: "[파일경로]"
---

## 입력
- JSON 파일 경로

## 출력
- 포맷팅된 JSON 파일 (2-space 들여쓰기)
- 변경 요약 메시지
```

## 2. YAML Frontmatter 최적화

### 필수 필드 항상 포함
```yaml
---
name: my-skill          # 필수
description: "..."      # 필수
allowed-tools: Read     # 권장
---
```

### 도구 권한 최소화
```yaml
# ❌ 나쁜 예: 과도한 권한
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch

# ✅ 좋은 예: 필요한 것만
allowed-tools: Read, Grep
```

### Bash 패턴 제한
```yaml
# ❌ 나쁜 예: 모든 Bash 명령 허용
allowed-tools: Bash

# ✅ 좋은 예: 특정 명령만 허용
allowed-tools: Bash(npm test *), Bash(git status)
```

## 3. 호출 제어 패턴

### 민감한 작업은 사용자만 호출
```yaml
---
name: deploy-production
description: 프로덕션 배포
disable-model-invocation: true  # Claude 자동 호출 방지
---
```

### 유틸리티 스킬은 Claude만 호출
```yaml
---
name: internal-validator
description: 내부 검증 유틸리티
user-invocable: false  # 메뉴에서 숨김
---
```

## 4. 프롬프트 작성 가이드

### 구조화된 지침
```markdown
# 스킬 제목

## 목적
[스킬의 목적 한 줄 설명]

## 입력
- [예상되는 입력 1]
- [예상되는 입력 2]

## 절차
1. [첫 번째 단계]
2. [두 번째 단계]
3. [세 번째 단계]

## 출력
- [생성될 결과물]

## 주의사항
- [지켜야 할 규칙]
```

### 예시 포함
```markdown
## 예시

### 입력
`/my-skill example.json`

### 기대 출력
```json
{
  "formatted": true
}
```
```

## 5. 에러 처리

### 실패 조건 명시
```markdown
## 실패 조건
- 파일이 존재하지 않음 → 사용자에게 알림
- JSON 파싱 실패 → 원본 유지, 에러 보고
- 권한 부족 → 필요한 권한 안내
```

### 복구 절차 정의
```markdown
## 에러 복구
1. 원본 파일 백업 확인
2. 실패 원인 분석
3. 사용자에게 옵션 제시:
   - 재시도
   - 수동 수정
   - 작업 취소
```

## 6. 파일 구조 최적화

### 대용량 참조 자료 분리
```
my-skill/
├── SKILL.md           # 핵심 지침 (가볍게)
├── reference/
│   ├── patterns.md    # 필요할 때만 로드
│   └── examples.md
└── templates/
    └── output.md
```

### SKILL.md에서 참조
```markdown
## 참고 자료
상세 패턴은 `reference/patterns.md` 참조
예시는 `reference/examples.md` 참조
```

## 7. 테스트 가능한 스킬

### 검증 가능한 출력
```yaml
---
name: validate-config
description: 설정 파일 검증
---

## 출력 형식
```yaml
validation_result:
  status: "pass" | "fail"
  errors: []
  warnings: []
```
```

### 멱등성 보장
```markdown
## 멱등성
이 스킬을 여러 번 실행해도 결과가 동일합니다.
- 이미 포맷팅된 파일 → 변경 없음
- 이미 존재하는 테스트 → 스킵
```

## 8. 문서화

### 스킬 내 문서화
```markdown
## 변경 이력
| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2026-02-04 | 최초 작성 |
| 1.1 | 2026-02-10 | 에러 처리 추가 |
```

### README 포함 (복잡한 스킬)
```
my-complex-skill/
├── SKILL.md
├── README.md          # 상세 사용 가이드
└── CHANGELOG.md       # 변경 이력
```

## 9. 성능 최적화

### 불필요한 파일 읽기 방지
```markdown
## 최적화 규칙
1. Glob으로 먼저 대상 파일 특정
2. 필요한 파일만 Read
3. 대용량 파일은 부분 읽기 (offset, limit)
```

### 병렬 처리 활용
```markdown
## 병렬 처리
독립적인 파일들은 병렬로 처리:
- 파일1, 파일2, 파일3 동시 분석
- 결과 취합 후 보고
```

## 10. 보안 체크리스트

```markdown
□ 민감한 정보 노출 방지 (API 키, 비밀번호)
□ 사용자 입력 검증
□ 파일 경로 검증 (디렉토리 탈출 방지)
□ 외부 명령 실행 제한
□ 네트워크 요청 최소화
```

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-02-04 | v1.0 | 최초 작성 |
