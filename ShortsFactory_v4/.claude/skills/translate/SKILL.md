---
name: shorts-v4-translate
description: "다국어 번역 + 렌더 — KO→EN/JA 자동 파이프라인"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# shorts-v4-translate

소스 스크립트를 대상 언어로 번역하고, 해당 언어의 TTS로 재렌더링한다.
이미지는 소스 채널의 것을 공유하여 재생성하지 않는다.

## 파라미터

| 파라미터        | 필수   | 기본값   | 설명                                |
| --------------- | ------ | -------- | ----------------------------------- |
| `script_path`   | 예     | —        | 소스 스크립트 JSON 경로             |
| `target_lang`   | 예     | —        | 대상 언어 코드 ("en", "ja")         |
| `target_channel`| 아니오 | 자동 매핑 | 번역본을 등록할 대상 채널 ID        |

## 실행 절차

### Step 1: 소스 스크립트 로드

```
pipeline/scripts/{episode_id}.json
```

소스 언어, 씬 구성, 이미지 경로를 확인한다.

### Step 2: 대상 채널 프로파일 로드

```
channels/{target_channel}/profile.yaml
```

대상 채널의 tone, tts_engine, tts_voice, subtitle_style을 확인한다.

### Step 3: 스크립트 번역

각 씬의 `narration`을 대상 언어로 번역:

- 단순 직역이 아닌 자연스러운 의역
- 대상 채널 프로파일의 `tone`에 맞게 어조 조정
- 문화적 맥락 적응 (관용구, 비유 등)
- TTS 기호 규칙 적용:
  - EN: 기호 그대로 유지 (TTS가 자연스럽게 읽음)
  - JA: "-8.5%" → "マイナス8.5パーセント"

### Step 4: 메타데이터 번역

```json
{
  "title": "번역된 제목",
  "description": "번역된 설명",
  "tags": ["번역된", "태그"]
}
```

대상 언어 시장의 SEO 키워드 반영.

### Step 5: 이미지 공유 (재생성 없음)

소스 에피소드의 이미지를 그대로 참조한다:

```
pipeline/rendered/{source_episode_id}/images/
```

심볼릭 링크 또는 경로 참조로 처리. 이미지를 새로 생성하지 않는다.

### Step 6: TTS + 자막 + 영상 합성

번역된 스크립트로 `shorts-v4-render` 스킬의 로직을 실행:

1. 대상 언어 TTS 생성 (language 파라미터 명시적 전달)
2. 자막 생성 (언어별 max_chars/font_size 적용)
3. 소스 이미지 + 새 오디오 + 새 자막으로 영상 합성

언어별 자막 설정:

| 언어 | max_chars | font_size |
| ---- | --------- | --------- |
| KO   | 16        | 52pt      |
| EN   | 25        | 56pt      |
| JA   | 14        | 56pt      |

JA 자막은 전용 분할 함수를 사용한다.

### Step 7: 출력 파일 생성

## 입력

- `pipeline/scripts/{episode_id}.json` — 소스 스크립트
- `pipeline/rendered/{episode_id}/images/` — 소스 이미지
- `channels/{target_channel}/profile.yaml` — 대상 채널 프로파일

## 출력

```
pipeline/scripts/{episode_id}_{lang}.json    # 번역된 스크립트
pipeline/rendered/{episode_id}_{lang}.mp4     # 번역된 영상
pipeline/rendered/{episode_id}_{lang}/
  ├── audio/       # 대상 언어 TTS
  ├── images/      → 소스 이미지 참조 (심링크)
  └── subtitles/   # 대상 언어 자막
```

## 에러 처리

- 소스 스크립트 미존재: 에러 반환
- 소스 이미지 미존재: 에러 반환 (이미지 없이 번역 렌더 불가)
- 대상 채널 프로파일 미존재: 기본 TTS 설정으로 폴백 + 경고
- TTS 언어 미지원: 에러 반환 + 지원 언어 목록 안내

## 채널 프로파일 참조

번역 톤과 TTS 설정은 대상 채널의 `profile.yaml`을 따른다.
소스 채널과 대상 채널의 매핑은 `channels/` 디렉토리 구조로 관리한다.
