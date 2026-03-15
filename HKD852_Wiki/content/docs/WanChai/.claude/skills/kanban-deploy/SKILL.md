---
name: kanban-deploy
description: 'WanChai 칸반 대시보드 빌드 + Vercel 배포'
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob
model: haiku
---

# /kanban-deploy — 칸반 대시보드 배포

## 목적

최신 kanban.json을 반영하여 WanChai 칸반 대시보드를 빌드하고 Vercel에 배포합니다.
Vercel Blob Storage에도 최신 데이터를 업로드하여 프로덕션 CRUD가 최신 상태를 반영합니다.

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

### 3. Blob 업로드

로컬 kanban.json을 Vercel Blob에 업로드하여 프로덕션 API가 최신 데이터를 반환하도록 합니다.

```bash
cd PMO_Agent/app && node -e "
const { put } = require('@vercel/blob');
const fs = require('fs');
const data = fs.readFileSync('public/kanban.json', 'utf-8');
put('kanban/kanban.json', data, {
  access: 'public',
  contentType: 'application/json',
  addRandomSuffix: false,
}).then(r => console.log('Blob uploaded:', r.url))
  .catch(e => console.error('Blob upload failed:', e.message));
"
```

> **참고**: `BLOB_READ_WRITE_TOKEN` 환경변수 필요. `vercel env pull`로 `.env.local`에 자동 설정됨.

### 4. 빌드

```bash
cd PMO_Agent/app && npm run build
```

### 5. 빌드 결과 확인

빌드 성공 여부를 확인합니다. 실패 시 에러를 출력하고 중단합니다.

### 6. 배포

```bash
cd PMO_Agent/app && vercel deploy --prod --yes
```

### 7. 출력

```
✅ WanChai 칸반 대시보드 배포 완료
- 빌드: ✅ 성공
- Blob: ✅ 동기화 완료
- 배포 URL: https://pmo-kanban.vercel.app
- 태스크 수: 총 15개 (대기:3 / 진행:5 / 검토:2 / QA:1 / 완료:4)
- 배포 시각: 2026-03-02T15:00:00+09:00
```

## CLI ↔ Web 동기화 규칙

- CLI 스킬(`/kanban-create` 등)은 `WanChai/kanban.json` 직접 편집
- 이 스킬이 로컬 파일을 Blob에 업로드 (로컬 = deploy 시점의 source of truth)
- 웹에서 직접 편집한 내용은 다음 `/kanban-deploy` 실행 시 로컬 데이터로 덮어씌워짐
