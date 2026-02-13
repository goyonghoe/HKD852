# Claude Code 스킬 예제 모음

> **출처**: https://docs.anthropic.com/en/docs/claude-code/skills
> **최종 동기화**: 2026-02-04
> **버전**: v1.0

## 1. 기본 스킬 예제

### 코드 리뷰 스킬
```yaml
---
name: code-reviewer
description: 코드 품질 및 보안 리뷰 전문가
allowed-tools: Read, Glob, Grep
context: fork
agent: Explore
---

# 코드 리뷰

다음 절차로 코드를 검토합니다:

1. Glob과 Grep으로 관련 파일 찾기
2. 코드 읽고 분석
3. 보안 이슈 체크
4. 품질 이슈 체크
5. 파일 참조와 함께 결과 요약
```

### PR 요약 스킬 (동적 컨텍스트 포함)
```yaml
---
name: pr-summary
description: Pull Request 변경사항 요약
context: fork
agent: Explore
allowed-tools: Bash(gh *)
---

## PR 컨텍스트

- PR diff: !`gh pr diff`
- PR 코멘트: !`gh pr view --comments`
- 변경 파일: !`gh pr diff --name-only`

## 작업

이 PR을 요약하고 영향도를 분석하세요.
```

## 2. 이슈 수정 스킬

```yaml
---
name: fix-issue
description: GitHub 이슈를 분석하고 수정
argument-hint: "[이슈번호]"
disable-model-invocation: true
allowed-tools: Read, Edit, Bash(gh *), Bash(npm test *)
---

# 이슈 수정: #$ARGUMENTS

## 절차

1. 이슈 내용 확인: `gh issue view $ARGUMENTS`
2. 관련 코드 분석
3. 수정 구현
4. 테스트 실행
5. 변경사항 커밋
```

## 3. 문서 생성 스킬

```yaml
---
name: generate-docs
description: 코드베이스 문서 자동 생성
allowed-tools: Read, Write, Glob, Grep
---

# 문서 생성

## 분석 대상
- 함수/클래스 시그니처
- JSDoc/Docstring 주석
- README 파일
- 타입 정의

## 출력 형식
- Markdown 문서
- API 레퍼런스
- 사용 예제
```

## 4. 테스트 작성 스킬

```yaml
---
name: write-tests
description: 코드에 대한 테스트 케이스 작성
argument-hint: "[파일경로]"
allowed-tools: Read, Write, Bash(npm test *)
---

# 테스트 작성: $ARGUMENTS

## 절차

1. 대상 파일 분석
2. 기존 테스트 패턴 확인
3. 테스트 케이스 설계:
   - 정상 케이스
   - 엣지 케이스
   - 에러 케이스
4. 테스트 코드 작성
5. 테스트 실행 확인
```

## 5. 리팩토링 스킬

```yaml
---
name: refactor
description: 코드 리팩토링 제안 및 실행
argument-hint: "[파일경로] [리팩토링유형]"
allowed-tools: Read, Edit, Glob, Grep
---

# 리팩토링

대상: $0
유형: $1

## 리팩토링 유형
- `extract`: 함수/메서드 추출
- `rename`: 이름 변경
- `simplify`: 복잡도 감소
- `dry`: 중복 제거

## 절차
1. 현재 코드 분석
2. 리팩토링 계획 수립
3. 단계별 변경 적용
4. 테스트 확인
```

## 6. 배포 스킬 (사용자만 호출)

```yaml
---
name: deploy
description: 프로덕션 배포 실행
disable-model-invocation: true
allowed-tools: Bash(npm *), Bash(docker *), Bash(kubectl *)
---

# 배포

⚠️ 프로덕션 배포입니다. 주의하세요.

## 체크리스트
- [ ] 테스트 통과 확인
- [ ] 버전 태그 확인
- [ ] 롤백 계획 준비

## 배포 절차
1. 빌드: `npm run build`
2. 이미지 생성: `docker build`
3. 배포: `kubectl apply`
```

## 7. 복합 워크플로우 스킬

```yaml
---
name: feature-complete
description: 기능 개발 전체 워크플로우 (코드→테스트→문서→PR)
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
---

# 기능 완성 워크플로우

## 1단계: 구현
$ARGUMENTS 기능을 구현합니다.

## 2단계: 테스트
`/write-tests` 스킬로 테스트 작성

## 3단계: 문서
`/generate-docs` 스킬로 문서 업데이트

## 4단계: PR 생성
변경사항을 PR로 생성
```

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-02-04 | v1.0 | 최초 작성 |
