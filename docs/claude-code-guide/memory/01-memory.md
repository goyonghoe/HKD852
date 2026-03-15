# 메모리 및 CLAUDE.md 공식 가이드

> **출처**: https://code.claude.com/docs/en/memory
> **최종 동기화**: 2026-02-24
> **버전**: v2.0

## 1. 개요

Claude Code는 두 가지 영속 메모리를 갖습니다:

- **Auto Memory**: Claude가 자동으로 유용한 컨텍스트를 저장
- **CLAUDE.md 파일**: 사용자가 직접 작성/유지하는 마크다운 지침

둘 다 **모든 세션 시작 시** 로드됩니다.

## 2. 메모리 유형 전체 맵

| 메모리 유형         | 위치                                                                                                                                                  | 용도                  | 공유 대상            |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | -------------------- |
| **Managed 정책**    | macOS: `/Library/Application Support/ClaudeCode/CLAUDE.md`<br>Linux: `/etc/claude-code/CLAUDE.md`<br>Windows: `C:\Program Files\ClaudeCode\CLAUDE.md` | 조직 전체 지침        | 모든 사용자          |
| **프로젝트 메모리** | `./CLAUDE.md` 또는 `./.claude/CLAUDE.md`                                                                                                              | 팀 공유 프로젝트 지침 | 팀 (소스 컨트롤)     |
| **프로젝트 규칙**   | `./.claude/rules/*.md`                                                                                                                                | 모듈형 주제별 지침    | 팀 (소스 컨트롤)     |
| **사용자 메모리**   | `~/.claude/CLAUDE.md`                                                                                                                                 | 개인 전역 설정        | 나만 (모든 프로젝트) |
| **프로젝트 로컬**   | `./CLAUDE.local.md`                                                                                                                                   | 개인 프로젝트별 설정  | 나만 (현재 프로젝트) |
| **Auto Memory**     | `~/.claude/projects/<project>/memory/`                                                                                                                | Claude 자동 메모      | 나만 (프로젝트별)    |

> **로드 규칙**: 상위 디렉토리 CLAUDE.md는 전체 로드. 하위 디렉토리 CLAUDE.md는 요청 시 로드. Auto Memory는 MEMORY.md의 처음 200줄만 로드.
> CLAUDE.local.md는 자동으로 .gitignore에 추가됩니다.

## 3. Auto Memory

### 무엇을 기억하나?

- **프로젝트 패턴**: 빌드 명령, 테스트 규칙, 코드 스타일
- **디버깅 인사이트**: 해결 방법, 흔한 에러 원인
- **아키텍처 메모**: 핵심 파일, 모듈 관계
- **사용자 선호**: 커뮤니케이션 스타일, 워크플로우 습관

### 저장 위치

```
~/.claude/projects/<project>/memory/
├── MEMORY.md          # 간결한 인덱스 (매 세션 로드)
├── debugging.md       # 디버깅 패턴 상세
├── api-conventions.md # API 설계 결정
└── ...                # 기타 주제 파일
```

### 작동 방식

- MEMORY.md의 처음 200줄 → 시스템 프롬프트에 로드
- 주제 파일 → 필요 시 로드 (시작 시 아닌)
- Claude가 세션 중 읽기/쓰기

### 관리 방법

- `/memory` → 파일 선택기 열기
- Claude에게 지시: "remember that we use pnpm, not npm"
- `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` → 강제 끄기
- `CLAUDE_CODE_DISABLE_AUTO_MEMORY=0` → 강제 켜기 (옵트인)

## 4. CLAUDE.md 파일

### 효과적인 CLAUDE.md 작성

`/init` 실행으로 스타터 생성.

```markdown
# Code style

- Use ES modules (import/export) syntax, not CommonJS (require)
- Destructure imports when possible

# Workflow

- Be sure to typecheck when you're done making code changes
- Prefer running single tests, not the whole test suite
```

### 포함할 것 vs 제외할 것

| 포함                              | 제외                      |
| --------------------------------- | ------------------------- |
| Claude가 추측할 수 없는 Bash 명령 | 코드에서 알 수 있는 것    |
| 기본값과 다른 코드 스타일 규칙    | Claude가 아는 표준 관행   |
| 테스트 러너, 테스트 지침          | 상세 API 문서 (링크 대신) |
| 브랜치 네이밍, PR 관행            | 자주 변하는 정보          |
| 아키텍처 결정                     | 긴 튜토리얼               |
| 개발 환경 특이사항                | 자명한 관행               |

### CLAUDE.md 검색 경로

cwd에서 시작하여 루트까지 재귀적으로 올라가며 CLAUDE.md, CLAUDE.local.md를 모두 읽습니다. 하위 디렉토리의 CLAUDE.md는 요청 시에만 로드됩니다.

## 5. CLAUDE.md 임포트

`@path/to/import` 구문으로 다른 파일을 임포트:

```markdown
See @README.md for project overview and @package.json for available npm commands.

# Additional Instructions

- git workflow @docs/git-instructions.md
```

### 규칙

- 상대 경로, 절대 경로 모두 가능
- 상대 경로는 임포트하는 파일 기준으로 해석
- 코드 블록/스팬 안의 @는 무시
- 재귀 임포트 지원 (최대 깊이 5)
- 외부 임포트는 프로젝트당 1회 승인 대화 표시

### Worktree에서 개인 지침 공유

```markdown
# Individual Preferences

- @~/.claude/my-project-instructions.md
```

## 6. 추가 디렉토리에서 메모리 로드

```bash
CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1 claude --add-dir ../shared-config
```

## 7. 모듈형 규칙: `.claude/rules/`

```
your-project/
├── .claude/
│   ├── CLAUDE.md
│   └── rules/
│       ├── code-style.md
│       ├── testing.md
│       └── security.md
```

모든 `.md` 파일이 자동으로 프로젝트 메모리로 로드됩니다.

### 경로별 규칙

```markdown
---
paths:
  - "src/api/**/*.ts"
---

# API Development Rules

- All API endpoints must include input validation
- Use the standard error response format
```

`paths` 없는 규칙은 모든 파일에 적용됩니다.

### Glob 패턴

| 패턴                   | 매칭 대상                       |
| ---------------------- | ------------------------------- |
| `**/*.ts`              | 모든 디렉토리의 TypeScript 파일 |
| `src/**/*`             | src/ 하위 모든 파일             |
| `*.md`                 | 프로젝트 루트의 Markdown 파일   |
| `src/components/*.tsx` | 특정 디렉토리의 React 컴포넌트  |

### 복수 패턴

```markdown
---
paths:
  - "src/**/*.ts"
  - "lib/**/*.ts"
  - "tests/**/*.test.ts"
---
```

### 중괄호 확장

```markdown
---
paths:
  - "src/**/*.{ts,tsx}"
  - "{src,lib}/**/*.ts"
---
```

### 하위 디렉토리 구조

```
.claude/rules/
├── frontend/
│   ├── react.md
│   └── styles.md
├── backend/
│   ├── api.md
│   └── database.md
└── general.md
```

### 심링크

```bash
ln -s ~/shared-claude-rules .claude/rules/shared
ln -s ~/company-standards/security.md .claude/rules/security.md
```

### 사용자 수준 규칙

`~/.claude/rules/` → 모든 프로젝트에 적용. 프로젝트 규칙이 더 높은 우선순위.

## 8. 메모리 베스트 프랙티스

- **구체적으로**: "Format code properly" 대신 "Use 2-space indentation"
- **구조 사용**: 불릿 포인트, 헤딩 그룹화
- **정기 리뷰**: 프로젝트 변화에 맞게 업데이트

---

## 변경 이력

| 날짜       | 버전 | 변경 내용                |
| ---------- | ---- | ------------------------ |
| 2026-02-24 | v2.0 | 공식 문서 기준 전면 작성 |
