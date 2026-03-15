---
name: fleet-analytics
description: "크로스채널 HTML 대시보드 — 생산량, 품질, 큐 상태를 인터랙티브 HTML로 시각화"
user-invocable: true
allowed-tools: Read, Write, Glob, Grep, Bash
recommended-model: sonnet
model-reason: "데이터 집계 + HTML 생성 — Sonnet의 균형잡힌 성능이 적합"
argument-hint: "[--period 7d|30d|all]"
---

# /fleet-analytics — 크로스채널 분석 대시보드

## 역할

전 채널의 생산량, 품질 점수, 업로드 큐 상태를 집계하여 CEO용 인터랙티브 HTML 대시보드를 생성합니다.

## 인자

| 인자       | 필수 | 설명      | 기본값 |
| ---------- | ---- | --------- | ------ |
| `--period` | N    | 분석 기간 | `all`  |

## 실행 흐름

```
[1] ShortsFleet/registry.json 읽기 → 채널 목록
[2] 채널별 데이터 수집:
    ├─ pipeline/scripts/ → 에피소드 수, 생성 날짜 분포
    ├─ pipeline/rendered/samples/ → 렌더링 완료 수
    ├─ pipeline/queue/batch_status.json → 배치 이력
    ├─ pipeline/queue/upload_queue.json → 업로드 상태 분포
    └─ pipeline/analytics/ → 성과 데이터 (있는 경우)
[3] 크로스채널 집계
[4] 인터랙티브 HTML 생성
[5] outputs/ 에 저장
```

## 실행 방법

1. `ShortsFleet/registry.json`을 Read로 읽어 채널 목록을 확인합니다
2. 각 채널별로 다음 데이터를 수집합니다:
   - Glob으로 `{agent_dir}/pipeline/scripts/{series_prefix}*.json` → 에피소드 수
   - Glob으로 `{agent_dir}/pipeline/rendered/samples/{series_prefix}*` → 렌더링 완료 수
   - Read로 `{agent_dir}/pipeline/queue/batch_status.json` → 배치 상태 (없으면 스킵)
   - Read로 `{agent_dir}/pipeline/queue/upload_queue.json` → 업로드 상태 (없으면 스킵)
   - Glob으로 `{agent_dir}/pipeline/analytics/**/*.json` → 성과 데이터 (있으면)
3. 데이터를 집계하여 HTML을 생성합니다
4. `ShortsFleet/outputs/` 디렉토리에 저장합니다

## HTML 디자인 가이드

기존 HKD852 HTML 보고서 패턴을 따릅니다:

### 필수 스타일

- **다크 테마**: `background: #0a0a0f`, 텍스트 `#e0e0e0`
- **인라인 CSS**: 외부 의존 없음 (CDN 금지)
- **반응형**: 모바일/데스크탑 모두 지원
- **한글 폰트**: `'Pretendard', 'Noto Sans KR', sans-serif`

### 대시보드 섹션 구성

```html
1. 헤더 - ShortsFleet 로고/타이틀 - 생성 일시 - 전체 요약 카드 (총 채널수, 총
에피소드, 총 업로드) 2. 채널별 카드 - 채널명 + 상태 배지 (ON/OFF) - 에피소드
진행률 바 - 최근 배치 결과 - 업로드 큐 상태 (pending/uploaded/rejected 색상
구분) 3. 생산 타임라인 - 날짜별 생산량 바 차트 (CSS만으로 구현) - 채널별 색상
구분 4. 품질 요약 - PASS / REVISE / FAIL 비율 - 채널별 비교 5. 업로드 현황 - 큐
상태 분포 (pending/uploaded/rejected) - YouTube 비디오 ID 링크 (uploaded인 경우)
```

### 색상 팔레트

```css
--color-primary: #6366f1; /* 인디고 */
--color-success: #22c55e; /* 초록 - PASS */
--color-warning: #f59e0b; /* 노랑 - REVISE */
--color-danger: #ef4444; /* 빨강 - FAIL/REJECT */
--color-info: #3b82f6; /* 파랑 - 정보 */
--color-muted: #6b7280; /* 회색 - 비활성 */
--card-bg: #1a1a2e;
--border: #2a2a4a;
```

## 출력 형식

```markdown
## Fleet Analytics 대시보드 생성 완료

- **파일**: `ShortsFleet/outputs/fleet_dashboard_{date}.html`
- **채널 수**: {N}개
- **총 에피소드**: {total}편
- **분석 기간**: {period}

브라우저에서 열어 확인하세요:
open ShortsFleet/outputs/fleet*dashboard*{date}.html
```

## 주의사항

- 읽기 전용 데이터 수집 (기존 파일 수정 없음)
- HTML은 단일 파일, 외부 의존 없음
- 데이터가 없는 채널은 "데이터 없음"으로 표시
- 대시보드 파일명에 날짜 포함하여 이력 관리
