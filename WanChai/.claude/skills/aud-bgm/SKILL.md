---
name: aud-bgm
description: '프로시저럴 BGM 생성 — 사이버펑크 분위기 Web Audio API 트랙'
user-invocable: true
argument-hint: '[mood/scene] e.g. main-menu, combat, boss, gameover, meta'
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---

## 역할

Audio Designer로서 프로시저럴 BGM 트랙을 생성합니다.
Web Audio API로 런타임 생성되며, 외부 오디오 파일 의존 없이 사이버펑크 분위기를 연출합니다.

## 핵심 참조

- `src/audio/RetroAudio.ts` — 현재 BGM 시스템 (기존 패턴 확인)
- `src/config/balance.ts` — 게임 타이밍 상수
- `design/audio/` — 오디오 설계 문서

## BGM 무드 가이드

| 씬         | BPM     | 키      | 분위기              | 악기 구성            |
| ---------- | ------- | ------- | ------------------- | -------------------- |
| MainMenu   | 90      | C minor | 신비, 기대감        | Pad + 아르페지오     |
| Combat     | 120-140 | A minor | 긴장, 액션          | Lead + Bass + Drum   |
| Boss       | 150+    | E minor | 위협, 압도          | 풀 레이어 + 디스토션 |
| GameOver   | 80      | D minor | 아쉬움, 재도전 욕구 | 느린 패드 + 에코     |
| Meta/Codex | 85      | F major | 차분, 성취감        | 아르페지오 + 패드    |

## 절차

1. `src/audio/RetroAudio.ts`를 읽고 현재 BGM 구조를 파악한다
2. 요청된 씬/무드에 맞는 멜로디, 베이스, 드럼 패턴을 설계한다:
   - **멜로디**: Square/Sawtooth wave, 1-2 옥타브 범위
   - **베이스**: Triangle wave, 루트+5도 패턴
   - **드럼**: Noise burst (kick/snare/hihat)
   - **패드**: Low-pass filtered sawtooth (분위기 바탕)
3. AudioBuffer 기반 렌더링 구현 (프레임 부하 방지)
4. 루프 포인트 설정 (매끄러운 반복)
5. `npm run build`로 빌드 검증

## 파형 레시피

```
Square Wave  = 8-bit 리드 멜로디, 빠른 어택
Triangle     = 부드러운 베이스, 서브베이스
Sawtooth     = 신스 패드, 아르페지오
Noise        = 킥(저역 필터), 스네어(고역), 하이햇(짧은 버스트)
```

## 제약

- **수정 가능**: `src/audio/`, `design/audio/`
- **수정 금지**: `tests/` 기존 테스트 로직
- 모든 오디오는 GainNode 통해 라우팅 (SaveManager 볼륨 연동)
- AudioBuffer 사전 생성, 재생 시 재사용 (매 재생마다 생성 금지)
- 모바일 AudioContext suspension 규칙 준수
