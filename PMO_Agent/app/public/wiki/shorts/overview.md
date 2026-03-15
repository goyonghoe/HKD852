# ShortsFactory 개요

YouTube Shorts 자동 생산 파이프라인을 운영하는 에이전트입니다.

## 프로젝트 정보

| 항목 | 내용 |
|------|------|
| 에이전트 | ShortsFactory_Agent |
| 채널 | What-If (가정 시나리오 숏폼) |
| 파이프라인 | 토픽 선정 → 스크립트 → TTS → 이미지 → 영상 렌더링 |
| 언어 | 한국어, 영어, 일본어 (다국어) |
| 경로 | `ShortsFactory_Agent/` |

## 기술 스택

- **TTS**: Google Cloud TTS (다국어)
- **영상 합성**: FFmpeg + Python
- **이미지 생성**: AI 이미지 생성 (씬별 프롬프트)
- **자막**: Whisper 기반 싱크 + 언어별 최적화
- **업로드**: YouTube Data API v3

## 파이프라인 흐름

```
/topic-mine → /shorts-script → /shorts-render → /shorts-review → 업로드
```

1. **토픽 마이닝**: 트렌드 리서치 + 고RPM 토픽 자동 선정
2. **스크립트 생성**: 대본 + 메타데이터 (제목, 설명, 태그)
3. **렌더링**: TTS 음성 + AI 이미지 + 자막 → MP4 합성
4. **리뷰**: YouTube 정책 준수 + 품질 검증
5. **업로드**: 예약 게시 큐 관리

## 다국어 주의사항

- TTS `language` 파라미터 명시적 전달 (auto 금지)
- 자막 설정: KO 16자/52pt, EN 25자/56pt, JA 14자/56pt
- 일본어는 전용 텍스트 분할 함수 사용
