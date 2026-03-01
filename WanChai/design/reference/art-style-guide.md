# 아트 스타일 가이드 — WanChai

> 프로시저럴 픽셀아트 퍼즐 게임 아트 디렉션 가이드

---

## 1. 코어 에스테틱

- **스타일**: Procedural Pixel Art (`pixelArt: true` in Phaser config)
- **베이스 컬러**: Dark Navy `#1a1a2e`
- **악센트**: 원소별 고채도 컬러 (아래 컬러 시스템 참조)
- **분위기**: 어두운 배경 위에 빛나는 원소들이 생동감을 주는 구조
- **렌더링**: WebGL, nearest-neighbor 스케일링 (안티앨리어싱 OFF)

---

## 2. 컬러 시스템

### 2.1 배경 팔레트

| 용도 | 컬러 | Hex |
|------|------|-----|
| 메인 배경 | Dark Navy | `#1a1a2e` |
| 보조 배경 | Deep Indigo | `#16213e` |
| 서피스 | Midnight Blue | `#0f3460` |
| 악센트 (UI) | Crimson Rose | `#e94560` |

### 2.2 원소 컬러 (6 Elements x 3 Shades)

각 원소는 base / highlight / shadow 세 단계로 구성됩니다.

| 원소 | 기본 | 하이라이트 | 그림자 |
|---------|------|-----------|--------|
| **Fire** (화) | `#e74c3c` | `#f1756b` | `#a83529` |
| **Water** (수) | `#3498db` | `#6bb5e8` | `#1f6fa0` |
| **Earth** (지) | `#2ecc71` | `#6ee9a0` | `#1e9e55` |
| **Wind** (풍) | `#f1c40f` | `#f7d94e` | `#c49b00` |
| **Light** (광) | `#ecf0f1` | `#ffffff` | `#bdc3c7` |
| **Dark** (암) | `#9b59b6` | `#c39bd3` | `#6c3483` |

### 2.3 컬러 사용 규칙

- 모든 원소 컬러는 `src/config/colors.ts`에서 상수로 관리
- 씬 코드에 직접 hex 리터럴 작성 금지 — 반드시 `colors.ts` 임포트
- highlight는 라이팅/셀렉션 상태, shadow는 그림자/비활성 상태에 사용
- 배경 위에 원소 컬러가 충분한 대비를 갖도록 contrast ratio 4.5:1 이상 유지

---

## 3. 글래스모피즘 상수

UI 패널에 공통 적용되는 글래스모피즘 기본값:

| 속성 | 값 | 설명 |
|------|---|------|
| `panelAlpha` | `0.25` | 패널 배경 투명도 |
| `borderAlpha` | `0.3` | 테두리 투명도 |
| `borderColor` | `#4a6fa5` | 테두리 색상 |
| `radius` | `16` | 모서리 라운드 (px) |

### 패널 드로잉 패턴

```typescript
// 배경
graphics.fillStyle(0x1a1a2e, panelAlpha);   // 0.25
graphics.fillRoundedRect(x, y, w, h, radius); // radius=16

// 테두리
graphics.lineStyle(1, 0x4a6fa5, borderAlpha); // 0.3
graphics.strokeRoundedRect(x, y, w, h, radius);
```

---

## 4. 큐브 스프라이트 스펙

### 4.1 기본 큐브

| 속성 | 값 |
|------|---|
| 크기 | 80 x 80 px |
| 코너 라디우스 | 8 px |
| 이너 베벨 | 2 px (highlight shade 사용) |
| 심벌 | 중앙에 원소 아이콘 (40x40 영역) |

### 4.2 큐브 구조

```
┌──────────────────┐
│  2px bevel (highlight) │
│  ┌──────────────┐ │
│  │              │ │
│  │   Element    │ │
│  │   Symbol     │ │
│  │   (40x40)    │ │
│  │              │ │
│  └──────────────┘ │
│  2px shadow (bottom/right) │
└──────────────────┘
        80x80
```

### 4.3 아머드 큐브 (강화)

- 기본 큐브에 **메탈릭 보더** 추가
- 보더 두께: 4px
- 보더 컬러: `#c0c0c0` (silver) / `#ffd700` (gold, HP3)
- 내부 원소 심벌 유지
- HP 표시: 보더 하단에 도트 인디케이터

### 4.4 큐브 상태

| 상태 | 시각 표현 |
|------|----------|
| 일반 (Normal) | base 컬러 배경 + 심벌 |
| 선택됨 (Selected) | highlight 컬러 + glow 링 |
| 매칭됨 (Matched) | flash white → destroy 애니메이션 |
| 강화됨 (Armored) | 메탈릭 보더 + HP 도트 |

---

## 5. 히어로 스프라이트 스펙

| 속성 | 값 |
|------|---|
| 형태 | 원형 (circle) |
| 지름 | 64 px |
| 하이라이트 크레센트 | 상단 좌측, highlight shade, 호 두께 6px |
| 글로우 링 | 반경 +4px, alpha 0.3, 원소 base 컬러 |
| 눈 | 도트 2개, 8px, 위쪽 1/3 위치, `#ffffff` |

### 히어로 구조

```
      ╭───────╮
    ╭─┤ crescent ├─╮    ← highlight crescent (6px arc)
   │  ╰───────╯  │
   │   ●     ●   │    ← dot eyes (8px, white)
   │              │
   │  (element    │
   │   color)     │    ← base color fill
   ╰──────────────╯
   ┊  glow ring   ┊    ← +4px, alpha 0.3
        64px
```

### 히어로 상태

| 상태 | 시각 표현 |
|------|----------|
| 대기 (Idle, 벨트 위) | 기본 + 글로우 링 |
| 활성 (Active, 발사 중) | scale 1.1x + 트레일 파티클 |
| 매칭됨 (Matched) | bounce 애니메이션 + spark 이펙트 |

---

## 6. 파티클 표준

### 6.1 오브젝트 풀

| 속성 | 값 |
|------|---|
| 풀 크기 | 200 파티클 |
| 관리 | `ParticlePool.ts` 싱글턴 |
| 블렌드 모드 | `Phaser.BlendModes.ADD` |

### 6.2 이펙트별 파티클 수

| 이펙트 | 파티클 수 | 수명 | 설명 |
|--------|----------|------|------|
| 매칭 파괴 (Match Destroy) | 8 ~ 15 | 300ms | 큐브 파괴 시 원소 컬러 파편 |
| 콤보 폭발 (Combo Burst) | 15 ~ 25 | 400ms | 콤보 달성 시 방사형 폭발 |
| 클리어 축하 (Celebration) | 30 ~ 50 | 800ms | 레벨 클리어 시 화면 전체 |
| 잔상 (Trail) | 3 ~ 5 | 150ms | 히어로 이동 시 잔상 |

### 6.3 파티클 공통 속성

```typescript
{
  blendMode: Phaser.BlendModes.ADD,
  lifespan: { min: 200, max: 400 },
  scale: { start: 1, end: 0 },
  alpha: { start: 1, end: 0 },
  speed: { min: 50, max: 200 },
  gravityY: 100
}
```

---

## 7. 애니메이션 타이밍

### 7.1 코어 타이밍

| 애니메이션 | 지속 시간 | 이징 |
|-----------|----------|------|
| 큐브 파괴 (Cube Destroy) | 200ms | Power2.easeOut |
| 중력 낙하 (Gravity Fall) | 150ms (셀당) | Bounce.easeOut |
| 매칭 플래시 (Match Flash) | 100ms | Linear (2회 깜빡임) |
| 히어로 발사 (Hero Launch) | 300ms | Power3.easeOut |
| 히어로 복귀 (Hero Return) | 200ms | Back.easeIn |

### 7.2 UI 애니메이션

| 애니메이션 | 지속 시간 | 이징 |
|-----------|----------|------|
| 스코어 롤 (Score Roll) | 800 ~ 1500ms | Power2.easeOut |
| 별 등장 (Star Reveal) | 300ms (별당) | Back.easeOut |
| 패널 슬라이드 (Panel Slide) | 400ms | Power2.easeInOut |
| 버튼 누름 (Button Press) | 80ms | Linear |

---

## 8. 벨트 트랙 비주얼

### 8.1 트랙 구조

| 속성 | 값 |
|------|---|
| 형태 | 이중 평행 레일 (double parallel rails) |
| 레일 간격 | 히어로 지름 + 8px 마진 |
| 레일 두께 | 3px |
| 레일 컬러 | `#4a6fa5` alpha 0.5 |
| 리벳 도트 | 8px 간격, 3px 지름, `#6b7b8d` |

### 8.2 액티브 슬롯 글로우

- 현재 히어로가 위치한 슬롯에 글로우 표시
- 글로우 컬러: 히어로 원소의 base 컬러
- 글로우 alpha: 0.2
- 글로우 크기: 슬롯 영역 + 12px 패딩

### 8.3 트랙 구조 다이어그램

```
  ● ─ ─ ● ─ ─ ● ─ ─ ● ─ ─ ●    ← 리벳 도트
 ═══════════════════════════════   ← 외부 레일 (3px)
 │  [Hero]  [Hero]  [Hero]   │   ← 히어로 슬롯
 ═══════════════════════════════   ← 내부 레일 (3px)
  ● ─ ─ ● ─ ─ ● ─ ─ ● ─ ─ ●    ← 리벳 도트
```

---

## 9. 프로시저럴 생성 원칙

모든 스프라이트는 **런타임 프로시저럴 생성** (코드로 그림):

1. `TextureFactory.ts`에서 `Phaser.GameObjects.Graphics` 사용
2. `generateTexture()` 메서드로 텍스처 키 등록
3. PreloadScene에서 한 번만 생성 후 캐싱
4. 외부 이미지 파일 사용 최소화 (로딩 최적화)

### 생성 순서 (PreloadScene)

```
1. 배경 텍스처 (Background textures)
2. 큐브 텍스처 (6 원소 x 일반/강화)
3. 히어로 텍스처 (6 원소)
4. 벨트 트랙 텍스처 (Belt track textures)
5. UI 컴포넌트 텍스처 (UI component textures)
6. 파티클 텍스처 (Particle textures)
```

---

## 10. 금지 사항

- 하드코딩된 컬러 값 (반드시 `colors.ts`에서 임포트)
- 하드코딩된 수치 (반드시 `balance.ts`에서 임포트)
- 안티앨리어싱 적용 (pixelArt: true 유지)
- 외부 스프라이트시트 의존 (프로시저럴 우선)
- 블렌드 모드 혼용 (파티클=ADD, 나머지=NORMAL)
