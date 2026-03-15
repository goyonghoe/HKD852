---
name: kanban-deploy
description: "칸반 대시보드 빌드 + Vercel 배포"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob
model: opus
---

# /kanban-deploy — 칸반 대시보드 배포

## 목적
최신 kanban.json을 반영하여 칸반 대시보드를 빌드하고 Vercel에 배포합니다.

## 인자
없음 (인자 불필요)

## 버전 관리 규칙
- 단순 태스크 데이터 변경: 버전업 하지 않음
- 새 기능/UI 변경이 있을 때만 `version` 필드를 업데이트하고 `changelog`에 항목 추가
- `deployed_at` 필드는 매 배포마다 갱신

## 실행 절차

### 1. deployed_at 갱신
`PMO_Agent/kanban.json`의 `deployed_at`을 현재 시각(ISO 8601 KST)으로 갱신합니다.

### 2. kanban.json → public 동기화
```bash
cp PMO_Agent/kanban.json PMO_Agent/app/public/kanban.json
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

### 6. Vercel Blob 동기화 (필수)
앱이 Blob을 우선 읽으므로 반드시 동기화합니다:
```bash
cd PMO_Agent/app && BLOB_READ_WRITE_TOKEN="$(grep BLOB_READ_WRITE_TOKEN .env.local | cut -d'"' -f2)" node -e "
const { put } = require('@vercel/blob');
const fs = require('fs');
put('kanban/kanban.json', fs.readFileSync('public/kanban.json','utf-8'), {
  access:'public', contentType:'application/json',
  addRandomSuffix:false, allowOverwrite:true, cacheControlMaxAge:0
}).then(r => console.log('Blob synced:', r.url));
"
```

### 7. 배포 검증 (필수 — 스킵 금지)
배포 후 반드시 라이브 환경에서 데이터와 코드를 검증합니다:
```bash
# 7-1. API 데이터 검증 — version이 kanban.json과 일치하는지
curl -s https://pmo-kanban.vercel.app/api/kanban | python3 -c "
import sys,json
d=json.load(sys.stdin)
print('✅ API version:', d.get('version'))
print('✅ deployed_at:', d.get('deployed_at'))
print('✅ tasks:', len(d.get('tasks',[])))
"

# 7-2. JS 번들 검증 — 이번 배포에서 변경한 핵심 키워드가 포함되어 있는지
curl -s https://pmo-kanban.vercel.app/ | grep -oE '_next/static/chunks/app/page-[^"]+\.js' | head -1 | xargs -I{} curl -s "https://pmo-kanban.vercel.app/{}" | python3 -c "
import sys
js = sys.stdin.read()
checks = ['프로젝트']  # 필수 키워드
for kw in checks:
    found = kw in js
    print(f'  {\"✅\" if found else \"❌\"} JS contains \"{kw}\": {found}')
    if not found:
        print(f'  ⚠️  WARNING: {kw} not found in deployed JS bundle!')
"
```
검증 실패 시 원인을 파악하고 재배포합니다. **검증을 통과하기 전까지 완료 보고하지 않습니다.**

### 8. 출력
```
✅ 칸반 대시보드 배포 완료
- 빌드: ✅ 성공
- 배포 URL: https://pmo-kanban.vercel.app
- 태스크 수: 총 15개 (대기:3 / 진행:5 / 검토:2 / QA:1 / 완료:4)
- 배포 시각: 2026-03-02T15:00:00+09:00
- API 검증: ✅ version 일치
- JS 검증: ✅ 핵심 키워드 확인
```

## 트러블슈팅

### 사용자가 변경이 안 보인다고 할 때
1. **Blob 동기화 누락**: Step 6을 재실행
2. **브라우저 캐시**: Safari `Cmd+Shift+R` / Chrome `Cmd+Shift+R` 안내
3. **Step 7 검증 재실행**: API 데이터 + JS 번들 확인
