# AI News — AI 뉴스 대시보드

## 역할

AI 업계 최신 뉴스와 트렌드를 수집, 정리하여 인터랙티브 대시보드로 제공하는 Next.js 웹 애플리케이션.

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- 가이드: [Claude Code 공식 가이드](../docs/claude-code-guide/INDEX.md)

## 기술 스택

- **프레임워크**: Next.js (App Router)
- **스타일링**: Tailwind CSS
- **배포**: Vercel

## 프로젝트 구조

```
AI_News/
├── src/
│   ├── app/            # Next.js App Router 페이지
│   ├── components/     # UI 컴포넌트
│   └── lib/            # 유틸리티/데이터 로직
├── vercel.json         # 배포 설정
├── package.json
└── tailwind.config.ts
```
