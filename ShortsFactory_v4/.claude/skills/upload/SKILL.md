---
name: shorts-v4-upload
description: "자동 업로드 큐 + CEO 승인 게이트 + 스케줄링"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# shorts-v4-upload

리뷰를 통과한 영상을 업로드 큐에 등록하고, CEO 승인 후 YouTube에 업로드한다.

## 파라미터

| 파라미터      | 필수   | 기본값 | 설명                          |
| ------------- | ------ | ------ | ----------------------------- |
| `episode_id`  | 예     | —      | 업로드할 에피소드 ID          |
| `channel_id`  | 예     | —      | 대상 채널 ID                  |
| `auto_approve`| 아니오 | false  | 자동 승인 활성화 여부         |

## 실행 절차

### Step 1: 사전 검증

1. 스크립트 파일의 `review.verdict`가 "PASS"인지 확인
2. 렌더링된 MP4 파일이 존재하고 0바이트가 아닌지 확인
3. 메타데이터(title, description, tags)가 완전한지 확인

### Step 2: 채널 프로파일에서 업로드 설정 로드

```
channels/{channel_id}/profile.yaml
```

핵심 필드:
- `youtube_channel_id`: YouTube 채널 ID
- `upload_schedule`: 업로드 시간대 (예: "09:00 KST")
- `auto_approve_hours`: 자동 승인까지 대기 시간 (0이면 즉시)
- `default_visibility`: 기본 공개 설정 ("public", "unlisted", "private")

### Step 3: 업로드 큐 등록

```
pipeline/queue/{episode_id}.json
```

```json
{
  "episode_id": "{episode_id}",
  "channel_id": "{channel_id}",
  "video_path": "pipeline/rendered/{episode_id}.mp4",
  "metadata": {
    "title": "...",
    "description": "...",
    "tags": [],
    "category": "Education",
    "visibility": "private"
  },
  "status": "pending_approval",
  "queued_at": "ISO8601",
  "scheduled_at": "ISO8601",
  "approved_at": null,
  "uploaded_at": null,
  "youtube_video_id": null
}
```

### Step 4: 승인 게이트

**수동 승인 (기본)**:
- `status`를 "pending_approval"로 설정
- CEO가 큐를 확인하고 승인

**자동 승인**:
- `auto_approve_hours`가 설정된 경우, 해당 시간 경과 후 자동 승인
- 자동 승인 시 `status`를 "approved"로 변경

### Step 5: YouTube 업로드 실행

승인된 에피소드에 대해:

```bash
python3 engines/upload/youtube_uploader.py \
  --video {video_path} \
  --title "{title}" \
  --description "{description}" \
  --tags "{tags}" \
  --category "{category}" \
  --visibility "{visibility}" \
  --channel {youtube_channel_id}
```

YouTube Data API v3를 사용한다.

### Step 6: 업로드 결과 기록

```json
{
  "status": "uploaded",
  "uploaded_at": "ISO8601",
  "youtube_video_id": "xxxxxxxxxx",
  "youtube_url": "https://youtube.com/shorts/xxxxxxxxxx"
}
```

## 입력

- `pipeline/scripts/{episode_id}.json` — 스크립트 (리뷰 결과 포함)
- `pipeline/rendered/{episode_id}.mp4` — 렌더링된 영상
- `channels/{channel_id}/profile.yaml` — 채널 프로파일

## 출력

- `pipeline/queue/{episode_id}.json` — 업로드 큐 항목
- 업로드 완료 시 YouTube URL 기록

## 에러 처리

- 리뷰 미통과: 업로드 거부 + 에러 메시지
- MP4 파일 없음/0바이트: 에러 반환
- YouTube API 인증 실패: 에러 반환 + 토큰 갱신 안내
- 업로드 실패 (네트워크 등): 3회 재시도 후 실패 처리
- 중복 업로드 방지: 동일 episode_id로 이미 업로드된 경우 스킵

## 채널 프로파일 참조

업로드 스케줄, 공개 설정, 자동 승인 정책은 `profile.yaml`에서 관리한다.
YouTube 채널 인증 정보는 별도 시크릿으로 관리하며 코드에 포함하지 않는다.
