---
name: pg-deploy
description: "프로덕션 빌드 + Vercel 배포 (사전 게이트 강제)"
user-invocable: true
allowed-tools: Read, Bash, Glob, Grep
model: haiku
---

# /pg-deploy — 빌드 + 배포

## 역할
Programmer로서 게임을 빌드하고 Vercel에 배포합니다.

## 중요: 사전 게이트 필수 체인

배포 전 아래 게이트를 **반드시 순서대로** 확인해야 합니다. 게이트 미통과 시 배포를 **거부**합니다.

```
/pg-build-check → /pg-wiring-check → /ux-gate → /pg-deploy
```

## 절차

### 0. 사전 게이트 체크 (MANDATORY)

배포를 시작하기 전에 아래 3가지 게이트의 최근 통과 기록을 확인합니다.

#### 0-A. 빌드+테스트 (Gate 1)
```bash
npx tsc --noEmit && npx vitest run
```
- TSC:PASS + TESTS:ALL_PASS 필수
- 하나라도 FAIL → **배포 거부, 즉시 수정**

#### 0-B. 씬 배선 검증 (Gate 5)
새 씬, 새 플래그, 새 모드가 추가된 경우:
```bash
# 씬 전환 배선 검증 — M-008 방지
grep -rn "scene\.start\|scene\.launch" src/scenes/ --include="*.ts"
grep -rn "init(" src/scenes/*.ts
```
- 모든 씬 전환의 페이로드가 대상 씬의 `init()` 파라미터와 매칭 확인
- 새 boolean 플래그가 `true`로 설정되는 코드 경로 존재 확인
- WIRING:FAIL → **배포 거부**

#### 0-C. UX 검증 (Gate 7)
UI 변경이 포함된 경우:
```bash
# 폰트 크기 최소 기준 확인
grep -rn "fontSize" src/scenes/ src/ui/ --include="*.ts"
# 터치 타겟 크기 확인
grep -rn "zone\|Zone\|setInteractive" src/scenes/ src/ui/ --include="*.ts"
```
- 14px 미만 폰트 → **배포 거부**
- 48dp 미만 터치 타겟 → **배포 거부**
- UX-GATE:REVISE → **배포 거부**

**게이트 미통과 시 메시지:**
```
DEPLOY:BLOCKED — 사전 게이트 미통과
- [FAIL] {게이트명}: {사유}
→ 수정 후 /pg-deploy 재실행
```

### 1. 프로덕션 빌드
```bash
npm run build    # 프로덕션 빌드
```

### 2. 빌드 결과 확인
- `dist/` 폴더 생성 확인
- 번들 크기 리포트

### 3. 배포
```bash
vercel deploy --prod
```

### 4. 결과 보고
```
DEPLOY:SUCCESS
- 배포 URL: https://project-wanchai.vercel.app
- 빌드 크기: {size}
- 테스트: {count} PASS
- 게이트: BUILD ✓ | WIRING ✓ | UX ✓
```

### 5. 배포 후 검증 (권장)
- `/pg-playtest-trace` 실행하여 주요 플레이 경로 코드 트레이스
- `/design-status-sync` 실행하여 status.json 갱신

## 규칙
- **게이트 0-A (빌드+테스트)는 항상 필수**
- **게이트 0-B (배선)는 새 씬/플래그/모드 추가 시 필수**
- **게이트 0-C (UX)는 UI 변경 시 필수**
- 게이트 미통과 시 배포 절대 불가 — "나중에 고치겠다" 금지
- 결과를 SESSION_LOG.md에 기록
