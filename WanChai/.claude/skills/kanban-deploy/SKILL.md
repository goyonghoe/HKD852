---
name: kanban-deploy
description: "WanChai 칸반 대시보드 빌드 + Vercel 배포"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob
model: opus
---

# /kanban-deploy — 칸반 대시보드 배포

## 목적
최신 kanban.json을 반영하여 WanChai 칸반 대시보드를 빌드하고 Vercel에 배포합니다.

## 인자
없음 (인자 불필요)

## 버전 관리 규칙
- 단순 태스크 데이터 변경: 버전업 하지 않음
- 새 기능/UI 변경이 있을 때만 `version` 필드를 업데이트하고 `changelog`에 항목 추가
- `deployed_at` 필드는 매 배포마다 갱신

## 실행 절차

### 1. deployed_at 갱신
`WanChai/kanban.json`의 `deployed_at`을 현재 시각(ISO 8601 KST)으로 갱신합니다.

### 2. kanban.json → public 복사
```bash
cp WanChai/kanban.json PMO_Agent/app/public/kanban.json
```

### 3. 빌드
```bash
cd PMO_Agent/app && npm run build
```

### 4. 빌드 결과 확인
빌드 성공 여부를 확인합니다. 실패 시 에러를 출력하고 중단합니다.

### 5. 배포
```bash
cd PMO_Agent/app && vercel deploy --prod --yes
```

### 6. 출력
```
✅ WanChai 칸반 대시보드 배포 완료
- 빌드: ✅ 성공
- 배포 URL: https://pmo-kanban.vercel.app
- 태스크 수: 총 15개 (대기:3 / 진행:5 / 검토:2 / QA:1 / 완료:4)
- 배포 시각: 2026-03-02T15:00:00+09:00
```
