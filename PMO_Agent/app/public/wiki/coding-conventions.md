# 코딩 컨벤션

HKD852 전체 프로젝트에 적용되는 코드 작성 규칙입니다.

## 언어 및 타입

- **TypeScript strict 모드** 필수 (`tsconfig.json`에서 `strict: true`)
- `any` 타입 사용 금지 — 명확한 타입 정의 또는 `unknown` 사용
- 인터페이스는 `I` 접두사 없이 명사형으로 작성 (예: `Task`, `KanbanColumn`)

## 파일 및 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| 파일명 | kebab-case | `damage-calc.ts`, `wave-director.ts` |
| 컴포넌트 파일 | PascalCase | `TaskCard.tsx`, `FilterBar.tsx` |
| 컴포넌트명 | PascalCase | `export function TaskCard()` |
| 변수/함수 | camelCase | `const taskCount`, `function getScore()` |
| 상수 | UPPER_SNAKE | `const MAX_RETRY = 3` |
| 타입/인터페이스 | PascalCase | `type TaskStatus`, `interface GameConfig` |

## 스타일링

- **Tailwind CSS** 사용 — 인라인 스타일(`style={}`) 금지
- 공통 스타일은 `globals.css`에서 `@apply`로 정의
- 반응형 디자인: `sm → md → lg` 순서로 브레이크포인트 적용

## 한글 타이포그래피

- 폰트: **Pretendard** (CDN) → Noto Sans KR → system-ui
- 본문 최소 **15px**, 행간 **1.8**
- `word-break: keep-all` (어절 단위 줄바꿈)
- `<html lang="ko">` 필수
- UI 텍스트는 **한글**, 코드 식별자는 **영문**

## HTML 산출물

- 반드시 `outputs/templates/`에서 주제에 맞는 템플릿을 선택하여 구조/스타일을 따름
- 24종 템플릿 중 자동 선택 기준은 루트 `CLAUDE.md` 참조

## import 정렬

```typescript
// 1. 외부 라이브러리
import { useState } from 'react';
// 2. 내부 모듈 (절대 경로)
import { TaskCard } from '@/components/board/TaskCard';
// 3. 타입
import type { Task } from '@/lib/kanban/types';
```

## 금지 사항

- `console.log` 프로덕션 코드에 남기지 않기
- 미사용 import/변수 방치 금지
- 매직 넘버 금지 — 상수로 추출
