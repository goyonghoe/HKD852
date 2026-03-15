# 배포 규칙

HKD852 모든 프로젝트의 빌드 및 배포 프로세스입니다.

## 필수 배포 명령

모든 코드 변경 후 반드시 아래 원커맨드 체인을 실행합니다:

```bash
npm run build && npm test -- --run && vercel deploy --prod
```

- 빌드 실패 시 배포 진행 금지
- 테스트 실패 시 배포 진행 금지
- **배포 URL을 반드시 보고에 포함**

## 칸반 JSON 동기화

칸반 데이터 수정 시 반드시 복사 후 배포합니다:

```bash
cp PMO_Agent/kanban.json PMO_Agent/app/public/kanban.json
cd PMO_Agent/app && npm run build && vercel deploy --prod
```

`PMO_Agent/kanban.json`이 단일 진실 소스(Single Source of Truth)입니다.

## Vercel 워크플로

| 환경 | 명령어 | 용도 |
|------|--------|------|
| 프리뷰 | `vercel deploy` | PR 검토용 |
| 프로덕션 | `vercel deploy --prod` | 실서비스 반영 |

## 좀비 프로세스 관리

개발 서버 실행 전 반드시 기존 프로세스를 확인합니다:

```bash
ps aux | grep -E 'next dev|next-server|npm.*dev' | grep -v grep
```

살아있는 프로세스가 있으면 `kill <PID>`로 정리 후 시작합니다.

## 작업 완료 보고 순서

1. 코드 변경 완료
2. WanChai/해당 프로젝트 빌드 + 배포
3. `kanban.json` 업데이트 (해당 시)
4. PMO 빌드 + 배포
5. 배포 URL 포함하여 보고

## 금지 사항

- 빌드 검증 없이 배포 금지
- 배포 URL 누락 금지
- 칸반 JSON 동기화 누락 금지
- 순차 편집 3개 이상 시 순차 처리 금지 — Agent Teams 병렬화 필수
