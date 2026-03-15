---
name: shorts-upload
description: "YouTube Shorts 업로드 대기열 관리 + CEO 승인 후 업로드 실행"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
recommended-model: haiku
model-reason: "업로드는 Python 스크립트 실행이므로 Haiku로 충분"
argument-hint: "--add 'ep024 ep025' | --list | --approve --all | --upload | --status"
---

# /shorts-upload — YouTube 업로드 매니저

## 역할

렌더링 완료된 YouTube Shorts의 업로드 대기열을 관리합니다.
CEO 승인 기반 워크플로: 큐 추가 → 확인 → 승인 → 업로드.

## 전제조건

- GCP OAuth 인증 완료 (`python libs/youtube_uploader.py auth`)
- 토큰: `~/.config/shorts-factory/youtube_token.json`

## 명령어

인자를 파싱하여 해당하는 Python CLI 명령을 실행합니다.

### 1. 큐에 추가 (--add)

```bash
cd ShortsFactory_Agent && python libs/upload_queue.py add --episode whatif_ep024 whatif_ep025
```

- 스크립트 JSON에서 메타데이터 자동 추출
- 최신 렌더링 MP4 자동 탐색
- 상태: `pending`

### 2. 큐 조회 (--list)

```bash
cd ShortsFactory_Agent && python libs/upload_queue.py list [--status pending]
```

마크다운 테이블로 출력. 상태 필터 선택 가능.

### 3. 승인 (--approve)

```bash
# 전체 pending 승인
cd ShortsFactory_Agent && python libs/upload_queue.py approve --all
# 특정 항목 승인
cd ShortsFactory_Agent && python libs/upload_queue.py approve --id uq_20260220_001
```

### 4. 업로드 실행 (--upload)

```bash
# 드라이런 (실제 업로드 없이 검증만)
cd ShortsFactory_Agent && python libs/upload_queue.py upload --dry-run
# 실제 업로드
cd ShortsFactory_Agent && python libs/upload_queue.py upload
```

일일 한도: 3개/일. 초과 시 자동 차단.

### 5. 상태 확인 (--status)

```bash
cd ShortsFactory_Agent && python libs/upload_queue.py status
```

### 6. 거부 (--reject)

```bash
cd ShortsFactory_Agent && python libs/upload_queue.py reject --id uq_20260220_001 --reason "제목 수정 필요"
```

## 일반적인 워크플로

```
CEO: /shorts-upload --add ep025 ep026 ep027
  → 큐에 3개 추가 (pending)

CEO: /shorts-upload --list
  → 테이블로 확인

CEO: /shorts-upload --approve --all
  → 전체 승인 (approved)

CEO: /shorts-upload --upload --dry-run
  → 검증만 실행

CEO: /shorts-upload --upload
  → 실제 YouTube 업로드 (private)

CEO: /shorts-upload --status
  → 결과 + YouTube URL 확인
```

## 상태 전이

```
pending → approved → uploading → uploaded (YouTube URL 기록)
                  ↘ failed → approved (자동 재시도, 최대 3회)
pending → rejected
```

## 보안

- 기본 privacy: `private` (CEO가 YouTube Studio에서 공개 전환)
- 토큰: `~/.config/shorts-factory/` (chmod 600, Git 외부)
- 일일 한도: 3개 (YouTube API 할당량 보호)

## 파이프라인 통합

- `/shorts-review` PASS → `/shorts-upload --add` (자동/수동)
- 업로드 완료 → 스크립트 JSON에 `upload_info` (video_id, URL) 기록
- `/shorts-analyze`에서 video_id로 성과 추적 가능
