# HKD852 Wiki — 프로젝트 위키

## 역할

HKD852 스튜디오의 에이전트 문서, 스킬 카탈로그, 프로젝트 가이드를 통합 관리하는 Next.js 기반 위키 웹 애플리케이션.

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- 가이드: [Claude Code 공식 가이드](../docs/claude-code-guide/INDEX.md)

## 기술 스택

- **프레임워크**: Next.js (App Router)
- **스타일링**: Tailwind CSS (PostCSS)
- **콘텐츠 동기화**: `scripts/sync-docs.js` (prebuild 시 문서 동기화)
- **배포**: Vercel

## 프로젝트 구조

```
HKD852_Wiki/
├── src/
│   ├── app/            # Next.js App Router 페이지
│   ├── components/     # UI 컴포넌트
│   └── lib/            # 유틸리티/데이터 로직
├── content/            # 위키 콘텐츠 (마크다운 등)
├── scripts/            # 빌드 스크립트 (sync-docs.js)
├── vercel.json         # 배포 설정
└── package.json
```
