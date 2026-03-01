# UI/UX 가이드라인 — WanChai

> 모바일 게임 UI/UX 가이드 (2025-2026 트렌드 반영)

---

## 1. 디자인 랭귀지: Dark Glassmorphism

### 1.1 핵심 원칙

- **반투명 패널**: 배경이 비치는 글래스 효과로 깊이감 연출
- **불투명도 범위**: 0.15 ~ 0.40 (용도별 차등)
- **테두리**: 1px, alpha 0.3, `#4a6fa5`
- **코너 라디우스**: 12 ~ 24px (컴포넌트 크기에 비례)
- **배경 블러**: 네이티브 미지원 시 어두운 반투명으로 대체

### 1.2 패널 불투명도 가이드

| 용도 | Alpha | 라디우스 |
|------|-------|---------|
| 배경 오버레이 (모달) | 0.40 | 24px |
| HUD 패널 | 0.25 | 16px |
| 카드/셀 | 0.20 | 12px |
| 힌트/툴팁 | 0.15 | 8px |

---

## 2. 타이포그래피 시스템

### 2.1 폰트 스케일

| 용도 | 크기 | 굵기 | 비고 |
|------|------|------|------|
| 타이틀 (Title) | 48px | Bold (700) | 화면 타이틀, 레벨 이름 |
| 헤딩 (Heading) | 32px | SemiBold (600) | 섹션 헤딩 |
| 본문 (Body) | 22px | Regular (400) | 일반 텍스트, 설명 |
| 캡션 (Caption) | 14px | Regular (400) | 보조 정보, 라벨 |
| 스코어 (Score) | 42px | Bold (700) | 점수 표시, monospace |

### 2.2 폰트 규칙

- 스코어/숫자: **monospace** 폰트 사용 (자릿수 변경 시 레이아웃 안정)
- 한글 지원: 시스템 폰트 폴백 (`sans-serif`)
- 텍스트 컬러: `#ecf0f1` (기본), `#bdc3c7` (보조), `#e94560` (강조)
- 그림자: `2px 2px 4px rgba(0,0,0,0.5)` — 배경 위 가독성 확보

---

## 3. 터치 인터랙션

### 3.1 터치 타겟

| 규칙 | 값 |
|------|---|
| 최소 터치 영역 | 48 x 48 dp |
| 권장 터치 영역 | 56 x 56 dp |
| 인접 타겟 간격 | 최소 8dp |

### 3.2 액션 배치 (엄지 존)

- **주요 액션 (Primary Actions)**: 화면 하단 1/3 영역 (엄지 도달 범위)
- **보조 액션 (Secondary Actions)**: 화면 상단 또는 좌우 상단
- **파괴적 액션 (Destructive Actions)**: 확인 다이얼로그 필수

### 3.3 터치 피드백

| 인터랙션 | 피드백 | 지속 시간 |
|---------|--------|----------|
| 탭 (Tap) | scale 0.95 + alpha 0.8 | 80ms |
| 길게 누름 (Long Press) | scale 0.98 + 진동(선택) | 200ms |
| 드래그 (Drag) | 오브젝트 추종 + 그림자 | 실시간 |
| 놓기 (Release) | spring back 1.0 | 120ms |

---

## 4. HUD 레이아웃 (720x1280)

### 4.1 구조

```
┌─────────────────────────────┐ y=0
│         Safe Area Top       │
├─────────────────────────────┤ y=40
│ ┌─────────────────────────┐ │
│ │   Glass Panel Top Bar   │ │ height=80
│ │ [Combo]  [Progress] [Score] │
│ └─────────────────────────┘ │
├─────────────────────────────┤ y=130
│                             │
│                             │
│        Game Area            │
│     (Belt + Board)          │
│                             │
│                             │
├─────────────────────────────┤ y=1100
│ ┌─────────────────────────┐ │
│ │  Hero Queue / Controls  │ │ height=140
│ └─────────────────────────┘ │
├─────────────────────────────┤ y=1240
│       Safe Area Bottom      │
└─────────────────────────────┘ y=1280
```

### 4.2 HUD 요소 배치

| 요소 | 위치 | 정렬 | 크기 |
|------|------|------|------|
| 스코어 (Score) | 우측 상단 | 우측 정렬 | 42px monospace |
| 콤보 (Combo) | 좌측 상단 | 좌측 정렬 | 32px bold |
| 진행 바 (Progress Bar) | 중앙 상단 | 가운데 | 200x12px |
| 레벨 이름 (Level Name) | 진행바 아래 | 가운데 | 14px caption |
| 히어로 큐 (Hero Queue) | 하단 패널 | 가운데 | 히어로당 64px |

---

## 5. 패널 컴포넌트 스펙

### 5.1 표준 글래스 패널

```typescript
// 표준 글래스 패널 드로잉
function drawGlassPanel(
  graphics: Phaser.GameObjects.Graphics,
  x: number, y: number,
  w: number, h: number,
  alpha: number = 0.25,
  radius: number = 16
): void {
  // 배경
  graphics.fillStyle(0x1a1a2e, alpha);
  graphics.fillRoundedRect(x, y, w, h, radius);

  // 테두리
  graphics.lineStyle(1, 0x4a6fa5, 0.3);
  graphics.strokeRoundedRect(x, y, w, h, radius);
}
```

### 5.2 패널 변형

| 변형 | Alpha | Border | 용도 |
|------|-------|--------|------|
| 기본형 (Standard) | 0.25 | 1px 0.3 | HUD, 일반 패널 |
| 모달 (Modal) | 0.40 | 1px 0.5 | 팝업, 다이얼로그 |
| 카드 (Card) | 0.20 | 1px 0.2 | 레벨 셀렉트 카드 |
| 미니멀 (Minimal) | 0.15 | none | 툴팁, 힌트 |

---

## 6. 스코어 카운터

### 6.1 롤링 애니메이션

| 속성 | 값 |
|------|---|
| 지속 시간 | 800 ~ 1500ms (점수 차이에 비례) |
| 이징 | Power2.easeOut |
| 스케일 팝 | 1.15x → 1.0x (Back.easeOut, 200ms) |

### 6.2 구현 패턴

```typescript
// 스코어 카운터 롤
tweens.addCounter({
  from: currentScore,
  to: targetScore,
  duration: Math.min(1500, Math.max(800, delta * 2)),
  ease: 'Power2',
  onUpdate: (tween) => {
    scoreText.setText(Math.floor(tween.getValue()).toLocaleString());
  },
  onComplete: () => {
    // scale pop
    tweens.add({
      targets: scoreText,
      scale: { from: 1.15, to: 1.0 },
      duration: 200,
      ease: 'Back.easeOut'
    });
  }
});
```

---

## 7. 별 연출 (Star Reveal)

### 7.1 시퀀셜 등장

| 속성 | 값 |
|------|---|
| 별 간 딜레이 | 300ms |
| 등장 애니메이션 | scale 0 → 1.2 → 1.0 |
| 이징 | Back.easeOut |
| 파티클 버스트 | 별마다 8~12개 파티클 |

### 7.2 구현 패턴

```typescript
// 별 시퀀셜 연출
stars.forEach((star, index) => {
  star.setScale(0);

  tweens.add({
    targets: star,
    scale: { from: 0, to: 1.2 },
    duration: 300,
    delay: index * 300,
    ease: 'Back.easeOut',
    onComplete: () => {
      // settle to 1.0
      tweens.add({
        targets: star,
        scale: 1.0,
        duration: 150,
        ease: 'Power2'
      });
      // particle burst
      emitStarBurst(star.x, star.y, 10);
    }
  });
});
```

---

## 8. 버튼 스타일

### 8.1 주요 버튼 (Primary Button)

| 속성 | 값 |
|------|---|
| 배경색 | Accent `#e94560` |
| 텍스트 | `#ffffff`, 22px Bold |
| 라디우스 | 16px |
| 최소 크기 | 200 x 56 dp |
| 호버 (Hover) | scale 1.05x, 밝기 +10% |
| 누름 (Press) | scale 0.95x, 밝기 -10% |
| 비활성 (Disabled) | alpha 0.4 |

### 8.2 보조 버튼 (Secondary Button)

| 속성 | 값 |
|------|---|
| 배경 | Glass panel (alpha 0.25) |
| 테두리 | 1px `#4a6fa5` alpha 0.3 |
| 텍스트 | `#ecf0f1`, 22px Regular |
| 라디우스 | 16px |
| 호버 (Hover) | scale 1.05x, 테두리 alpha 0.5 |
| 누름 (Press) | scale 0.95x |

### 8.3 아이콘 버튼 (Icon Button)

| 속성 | 값 |
|------|---|
| 크기 | 48 x 48 dp (최소 터치 영역) |
| 배경 | transparent 또는 glass 0.15 |
| 아이콘 | 24x24, `#ecf0f1` |
| 누름 (Press) | scale 0.90x, alpha 0.7 |

---

## 9. 레벨 셀렉트

### 9.1 벤토 그리드 (Bento Grid)

| 속성 | 값 |
|------|---|
| 카드 크기 | 140 x 140 px |
| 카드 간격 | 16px gap |
| 카드 라디우스 | 16px |
| 레이아웃 | 4열 그리드, 스크롤 가능 |
| 배경 | Glass panel alpha 0.20 |

### 9.2 카드 상태

| 상태 | 시각 표현 |
|------|----------|
| 잠김 (Locked) | alpha 0.3, 자물쇠 아이콘 |
| 도전 가능 (Available) | 기본 글래스 카드 + 레벨 번호 |
| 완료됨 (Completed) | 별 표시 (1~3) + 스코어 |
| 현재 (Current) | 글로우 보더 (accent 컬러 pulse) |

### 9.3 카드 내부 구조

```
┌────────────────┐
│  Level 1-3     │ ← 14px caption
│                │
│    ★ ★ ☆      │ ← 별 표시 (완료 시)
│                │
│   12,450       │ ← 최고 점수 (완료 시)
└────────────────┘
      140x140
```

---

## 10. 반응형 설계

### 10.1 기준 해상도

| 속성 | 값 |
|------|---|
| 기준 | 720 x 1280 (9:16) |
| Phaser Scale Mode | `Phaser.Scale.FIT` |
| Auto Center | `Phaser.Scale.CENTER_BOTH` |
| 최소 너비 (Min Width) | 360px |
| 최대 너비 (Max Width) | 1080px |

### 10.2 Safe Area

```typescript
const config: Phaser.Types.Core.GameConfig = {
  width: 720,
  height: 1280,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};
```

### 10.3 적응형 레이아웃 규칙

- 모든 좌표는 **기준 해상도 기반 비율**로 계산
- 노치/펀치홀 영역: 상단 40px, 하단 40px safe area
- 태블릿: 좌우 패딩 자동 증가 (최대 영역 유지)
- 가로 모드: 미지원 (세로 고정)

---

## 11. 장면 전환

### 11.1 전환 패턴

| 전환 | 효과 | 지속 시간 |
|------|------|----------|
| 메뉴 → 레벨 셀렉트 | 좌측 슬라이드 (Slide Left) | 400ms |
| 레벨 셀렉트 → 퍼즐 | 검정 페이드 (Fade Black) | 500ms |
| 퍼즐 → 결과 | 확대 + 페이드 (Scale Up + Fade) | 400ms |
| 결과 → 레벨 셀렉트 | 우측 슬라이드 (Slide Right) | 400ms |

### 11.2 전환 이징

- 모든 장면 전환: `Power2.easeInOut`
- 페이드: 검은색 오버레이 alpha 0→1→0

---

## 12. 접근성

- 색상만으로 정보 구분하지 않음 (아이콘/심벌 병행)
- 터치 타겟 최소 48dp 준수
- 텍스트 대비 비율 4.5:1 이상
- 애니메이션 축소 옵션 (prefers-reduced-motion 존중)
- 스코어/타이머 등 핵심 정보는 여러 채널로 전달 (시각 + 크기 + 위치)
