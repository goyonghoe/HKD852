# Project WanChai

Pixel Flow 영감의 캐주얼 RPG 퍼즐 게임.

## 코어 메카닉

순환형 컨베이어 벨트가 중앙 큐브 보드를 감싸는 구조.
히어로를 탭하면 벨트를 한 바퀴 돌면서 매칭 큐브를 자동 파괴합니다.

| 개념 | 설명 |
|------|------|
| 히어로 | 원소 속성 (Fire/Water/Earth/Wind) 보유 |
| 순환 벨트 | TOP→RIGHT→BOTTOM→LEFT 사각형 루프 |
| 발사 방향 | 각 엣지에서 안쪽으로 (TOP→아래, RIGHT→왼쪽 등) |
| AP | 공격 횟수. 0이 되면 소진 |
| 슬링 콤보 | 빠른 연속 배치로 보너스 스코어 |

## 빠른 시작

```bash
npm install
npm run dev
```

## 배포

- **Vercel**: https://project-wanchai.vercel.app

```bash
vercel deploy --prod
```

## 기술 스택

Phaser 3 + TypeScript + Vite + Vitest

## 현재 상태

Phase 1: 순환형 컨베이어 코어루프 완성 (3개 스테이지)
