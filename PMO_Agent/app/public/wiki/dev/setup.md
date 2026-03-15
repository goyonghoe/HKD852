# 개발 환경 설정

> 필수 도구, 설치 방법, 빌드, 배포

관련 파일: `WanChai/package.json`, `WanChai/.claude/CLAUDE.md`

---

## 필수 도구

| 도구       | 버전 | 목적              |
| ---------- | ---- | ----------------- |
| Node.js    | 20+  | JavaScript 런타임 |
| npm        | 10+  | 패키지 매니저     |
| Git        | 최신 | 버전 관리         |
| Vercel CLI | 최신 | 배포 (선택)       |

---

## 설치 및 실행

```bash
# 프로젝트 클론
git clone <repo-url>
cd WanChai

# 의존성 설치
npm install

# 개발 서버 시작 (localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

---

## 테스트

```bash
# 전체 테스트 실행
npm test

# 단발성 실행 (CI용)
npm test -- --run

# 특정 파일 테스트
npm test -- tests/core/DamageCalc.test.ts

# 테스트 UI
npm test -- --ui
```

---

## 배포

```bash
# Vercel 프로덕션 배포
vercel deploy --prod

# 빌드 + 테스트 + 배포 (권장 전체 파이프라인)
npm run build && npm test -- --run && vercel deploy --prod
```

배포 URL: https://project-wanchai.vercel.app

---

## Phaser 개발 서버 특이사항

- `npm run dev` 후 브라우저에서 `http://localhost:5173` 접속
- 소스 변경 시 자동 Hot Reload (단, 씬 전환이 필요한 변경은 새로고침 필요)
- 모바일 테스트: 같은 Wi-Fi에서 PC IP로 접속 가능

---

## 좀비 프로세스 주의

개발 세션 시작 전:

```bash
ps aux | grep -E 'next|vite|node' | grep -v grep
# 실행 중인 프로세스 있으면 kill <PID>
```

---

## 디렉토리 초기화 구조

```
WanChai/
├── package.json         # 의존성: phaser, typescript, vite, vitest
├── vite.config.ts       # Vite 빌드 설정
├── tsconfig.json        # TypeScript strict 설정
├── index.html           # 진입점 HTML
└── src/
    └── main.ts          # Phaser Game 초기화, 씬 등록
```

---

## 환경 변수

현재 WanChai는 클라이언트 사이드 게임으로 환경 변수가 필요 없습니다. 모든 설정은 `src/config/` 파일에서 관리합니다.
