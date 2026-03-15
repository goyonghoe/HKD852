---
name: qa-e2e
description: 'Playwright E2E 게임 플로우 자동 검증 — 씬 전환, 게임 상태, 소프트락 탐지'
user-invocable: true
allowed-tools: Read, Bash, Glob, Grep, Edit
---

# /qa-e2e — Playwright E2E 게임 플로우 검증

## 역할

WanChai 게임의 E2E 테스트를 실행하고 실패 항목을 분석합니다. 코드 수정 없이 검증만 수행합니다.

## 절차

### 1. 좀비 프로세스 체크

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
```

### 2. E2E 테스트 실행

```bash
cd /Users/yong/MainFolder/My_AI_Project/HKD852/WanChai
npx playwright test tests/e2e/ --reporter=list
```

- `playwright.config.ts`의 `webServer` 설정이 dev 서버를 자동 시작함
- 별도로 `npm run dev`를 실행할 필요 없음

### 3. 실패 테스트 분석

실패한 테스트가 있으면:

1. **스크린샷 확인**: `/tmp/vqa/` 경로에서 실패 시점 캡처 확인
2. **기대값 vs 실제값 비교**: 에러 메시지에서 `expect`/`received` 추출
3. **원인 파일 특정**: 에러 스택트레이스에서 관련 `src/` 파일 위치 파악. 필요 시 `Grep`으로 해당 로직 확인

### 4. 심각도 분류

| 심각도 | 기준 | 예시 |
|--------|------|------|
| **CRITICAL** | 씬 전환 실패, 게임 멈춤, 소프트락 | 보스 사망 후 다음 스테이지 미진입, 화면 정지 |
| **HIGH** | 게임 상태 불일치 | 적 미스폰, HP 음수, XP 미적용, 무기 미발사 |
| **MEDIUM** | UI 접근 불가 | 버튼 클릭 후 무반응, 패널 미표시, 요소 뷰포트 밖 |

### 5. 결과 요약 출력

```
## E2E 테스트 결과
- PASS: N/M
- FAIL: N/M

### 실패 항목
| 테스트 | 기대 | 실제 | 심각도 | 원인 파일 |
|--------|------|------|--------|-----------|
| ... | ... | ... | CRITICAL | src/scenes/RunScene.ts |
```

### 6. 수정 제안

- CRITICAL 또는 HIGH 이슈가 있으면 원인 분석 + 수정 방향 제안
- 수정 자체는 이 스킬에서 수행하지 않음. 별도 판단 후 `/pg-implement` 등으로 진행

## 참고

- 테스트 파일: `tests/e2e/`
- 스크린샷 저장: `/tmp/vqa/`
- 관련 스킬: `/qa-smoke` (빌드+유닛 검증), `/qa-regression` (변경 영향도 분석)
