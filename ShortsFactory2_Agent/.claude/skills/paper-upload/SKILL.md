---
name: paper-upload
description: "논문 쇼츠 YouTube 업로드 대기열 관리 + CEO 승인 후 업로드"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
recommended-model: haiku
model-reason: "업로드는 Python CLI 실행이므로 Haiku로 충분"
argument-hint: "--add 'paper_ep019' [--lang ko] | --list | --approve --all | --upload | --status"
---

# /paper-upload — YouTube 업로드 매니저

## 역할

논문 쇼츠의 YouTube 업로드 대기열을 관리하고, CEO 승인 후 업로드를 실행합니다.

## 서브커맨드

### --add: 업로드 큐에 추가

```
/paper-upload --add paper_ep019 --lang ko
/paper-upload --add paper_ep019 --lang all    (KO+EN+JA 각각 큐에 추가)
```

에피소드를 업로드 큐에 추가합니다.

- `/paper-review` PASS 판정 필수 (미통과 시 경고 + 확인 요청)
- 기본: KO만 추가
- `--lang all`: 3개 언어 각각 별도 큐 항목으로 추가

### --list: 큐 상태 조회

```
/paper-upload --list
```

```markdown
## 업로드 대기열

| #   | 에피소드    | 언어 | 상태    | 채널          | 파일                                  |
| --- | ----------- | ---- | ------- | ------------- | ------------------------------------- |
| 1   | paper_ep019 | KO   | pending | 논문맨        | rendered/.../paper*ep019_manga*\*.mp4 |
| 2   | paper_ep019 | EN   | blocked | Today's Paper | 채널 미생성                           |
```

### --approve: CEO 승인

```
/paper-upload --approve --all
/paper-upload --approve paper_ep019 --lang ko
```

pending 상태의 항목을 approved로 변경합니다.

### --upload: 업로드 실행

```
/paper-upload --upload
```

approved 상태의 항목을 YouTube에 업로드합니다.

```bash
cd /Users/yong/MainFolder/My_AI_Project/HKD852/ShortsFactory2_Agent
python libs/youtube_uploader.py upload \
  --video "pipeline/rendered/samples/paper_ep019/paper_ep019_manga_*.mp4" \
  --channel paperman \
  --title "..." --description "..." --tags "..." \
  --privacy private
```

### --status: 업로드 이력 조회

```
/paper-upload --status
```

`pipeline/analytics/upload_history.json`의 최근 업로드 기록을 표시합니다.

## 채널 라우팅

`templates/lang_config.json`의 `channel_key`로 자동 라우팅:

| 언어 | 채널 키       | 채널명        | 상태                  |
| ---- | ------------- | ------------- | --------------------- |
| ko   | `paperman`    | 논문맨        | 운영 중               |
| en   | `paperman-en` | Today's Paper | [PLANNED] 채널 미생성 |
| ja   | `paperman-ja` | 今日の論文    | [PLANNED] 채널 미생성 |

**EN/JA 채널 미생성 시**: 큐에는 추가하되 상태를 `blocked`로 표시, 업로드 시도하지 않음.

## 업로드 기록

업로드 성공 시 `pipeline/analytics/upload_history.json`에 append:

```json
{
  "episode_id": "paper_ep019",
  "title": "🧠 혼밥하는 남자, 대사증후군 위험 3배? #오늘의논문",
  "uploaded_at": "2026-02-27",
  "url": "https://youtube.com/shorts/xxxxx",
  "video_id": "xxxxx",
  "language": "ko",
  "privacy_status": "private"
}
```

**`language` 필드 필수** (ko/en/ja).

## 안전 장치

- **일일 한도**: 채널당 3건/일 (YouTube API 쿼터 보호)
- **기본 공개 설정**: `private` (CEO가 YouTube Studio에서 수동 공개)
- **dry-run 모드**: `--upload --dry-run`으로 업로드 없이 시뮬레이션

## 참조

- `libs/youtube_uploader.py` — YouTube OAuth + API
- `libs/upload_queue.py` — 큐 관리 유틸리티
- `pipeline/analytics/upload_history.json` — 업로드 이력
- `templates/lang_config.json` — 채널 라우팅
- `~/.config/shorts-factory/channels.json` — OAuth 토큰
