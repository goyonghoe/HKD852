# 아트 스타일 가이드 — WanChai

> 손그림풍 일러스트 오토슈터 서바이버 게임 아트 디렉션 가이드

---

## 1. 코어 에스테틱

- **스타일**: Hand-drawn Illustration (`pixelArt: false` in Phaser config)
- **베이스 컬러**: Dark Background `#0a0a1a`
- **악센트**: 원소별 고채도 컬러 (아래 컬러 시스템 참조)
- **분위기**: 사이버펑크 홍콩 뒷골목 — 어두운 배경 위에 네온 빛과 투사체가 생동감을 주는 구조
- **렌더링**: WebGL, bilinear 스케일링 (부드러운 스케일링)

---

## 2. 컬러 시스템

### 2.1 배경 팔레트

| 용도        | 컬러          | Hex       |
| ----------- | ------------- | --------- |
| 메인 배경   | Dark Base     | `#0a0a1a` |
| 보조 배경   | Deep Indigo   | `#16213e` |
| 서피스      | Midnight Blue | `#0f3460` |
| 악센트 (UI) | Crimson Rose  | `#e94560` |

### 2.2 원소 컬러 (6 Elements x 3 Shades)

각 원소는 base / highlight / shadow 세 단계로 구성됩니다.

| 원소           | 기본      | 하이라이트 | 그림자    |
| -------------- | --------- | ---------- | --------- |
| **Fire** (화)  | `#e74c3c` | `#f1756b`  | `#a83529` |
| **Water** (수) | `#3498db` | `#6bb5e8`  | `#1f6fa0` |
| **Earth** (지) | `#2ecc71` | `#6ee9a0`  | `#1e9e55` |
| **Wind** (풍)  | `#f1c40f` | `#f7d94e`  | `#c49b00` |
| **Light** (광) | `#ecf0f1` | `#ffffff`  | `#bdc3c7` |
| **Dark** (암)  | `#9b59b6` | `#c39bd3`  | `#6c3483` |

### 2.3 적 컬러키

| 컬러키          | 용도                                         | 설명         |
| --------------- | -------------------------------------------- | ------------ |
| `ENEMY_BASIC`   | 기본 적 (circle)                             | 일반 네온 톤 |
| `ENEMY_FAST`    | 빠른 적 (triangle), 추적자, 군체             | 위협적인 톤  |
| `ENEMY_TANK`    | 탱크 (rect), 수호자, 버스트 보스             | 묵직한 톤    |
| `ENEMY_SPECIAL` | 특수 적 (diamond), 사격수, 저격수, 서클 보스 | 불길한 톤    |
| `ENEMY_ELITE`   | 엘리트, 분열자, 텔레포터, 일반 보스          | 고위험 톤    |

### 2.4 컬러 사용 규칙

- 모든 컬러는 `src/config/colors.ts`에서 상수로 관리
- 씬 코드에 직접 hex 리터럴 작성 금지 — 반드시 `colors.ts` 임포트
- highlight는 라이팅/셀렉션 상태, shadow는 그림자/비활성 상태에 사용
- 배경 위에 원소 컬러가 충분한 대비를 갖도록 contrast ratio 4.5:1 이상 유지

---

## 3. 글래스모피즘 상수

UI 패널에 공통 적용되는 글래스모피즘 기본값:

| 속성          | 값        | 설명               |
| ------------- | --------- | ------------------ |
| `panelAlpha`  | `0.25`    | 패널 배경 투명도   |
| `borderAlpha` | `0.3`     | 테두리 투명도      |
| `borderColor` | `#4a6fa5` | 테두리 색상        |
| `radius`      | `16`      | 모서리 라운드 (px) |

### 패널 드로잉 패턴

```typescript
// 배경
graphics.fillStyle(0x1a1a2e, panelAlpha); // 0.25
graphics.fillRoundedRect(x, y, w, h, radius); // radius=16

// 테두리
graphics.lineStyle(1, 0x4a6fa5, borderAlpha); // 0.3
graphics.strokeRoundedRect(x, y, w, h, radius);
```

---

## 4. 적 스프라이트 스펙

### 4.1 적 형태 (Shape) 매핑

| 형태       | 도형   | 크기 (baseSize) | 대표 적                                   |
| ---------- | ------ | --------------- | ----------------------------------------- |
| `circle`   | 원형   | 8~12px          | basic, swarm                              |
| `triangle` | 삼각형 | 10~12px         | fast, chaser, sniper_enemy                |
| `rect`     | 사각형 | 18~36px         | tank, guardian, boss_burst                |
| `diamond`  | 마름모 | 13~28px         | special, shooter, teleporter, boss_circle |
| `hexagon`  | 육각형 | 16~32px         | splitter, boss                            |

### 4.2 적 상태

| 상태             | 시각 표현                           |
| ---------------- | ----------------------------------- |
| 일반 (Normal)    | colorKey 기반 컬러 + 도형           |
| 엘리트 (Elite)   | 3배 크기 + 밝은 오라 + HP 바 표시   |
| 피격 (Hit)       | hitFlash 80ms 화이트 플래시         |
| 사망 (Death)     | deathFade 200ms + 파티클 버스트 8개 |
| 넉백 (Knockback) | 60px 밀려남 + 150ms 지속            |

### 4.3 보스 시각 연출

- 등장 시: 어둡게 오버레이 + "BOSS" 텍스트 스케일인 + 화면 흔들림
- HP 바: 화면 상단 전체 폭 (680px) 표시
- 사망 시: 강화된 파티클 + 화면 흔들림 + 페이드

---

## 5. 플레이어 스프라이트 스펙

| 속성            | 값                                                            |
| --------------- | ------------------------------------------------------------- |
| 형태            | 캐릭터 스프라이트 (char_hai_ingame) 또는 폴백 프로시저럴 원형 |
| 디스플레이 크기 | 96 x 96 px                                                    |
| 물리 반경       | 14 px                                                         |
| 위치            | 화면 하단 고정 (y=1200), 좌우 이동만 가능                     |
| 조준            | 가장 가까운 적 방향으로 자동 회전                             |

### 플레이어 상태

| 상태          | 시각 표현                   |
| ------------- | --------------------------- |
| 대기 (Idle)   | 기본 스프라이트, 상단 조준  |
| 이동 (Moving) | 좌우 이동, 터치/드래그 추종 |
| 발사 (Firing) | 무기별 투사체 발사 이펙트   |

---

## 6. 투사체 스프라이트 스펙

| 투사체                | 텍스처 키   | 설명                   |
| --------------------- | ----------- | ---------------------- |
| `projectile_bullet`   | 기본 탄환   | 에너지 샷, 산탄총      |
| `projectile_rapid`    | 속사 탄환   | 속사포 전용            |
| `projectile_shuriken` | 회전 수리검 | spinRate 12 적용       |
| `projectile_laser`    | 레이저 빔   | 관통 99, 긴 수명       |
| `projectile_missile`  | 유도 미사일 | 호밍 추적              |
| `projectile_napalm`   | 네이팜 화구 | 착탄 후 화염 지대 생성 |

---

## 7. 파티클 표준

### 7.1 오브젝트 풀

| 속성        | 값                      |
| ----------- | ----------------------- |
| 풀 크기     | 200 파티클              |
| 관리        | `VFXManager.ts`         |
| 블렌드 모드 | `Phaser.BlendModes.ADD` |

### 7.2 이펙트별 파티클 수

| 이펙트                    | 파티클 수 | 수명   | 설명                    |
| ------------------------- | --------- | ------ | ----------------------- |
| 적 사망 (Death Burst)     | 8         | 200ms  | 적 사망 시 컬러 파편    |
| 피격 스파크 (Hit Spark)   | 3         | 80ms   | 적 피격 시 불꽃         |
| XP 픽업 (XP Pickup)       | 4         | 150ms  | XP 오브 수집 시         |
| 체인 라이트닝             | VFX 라인  | 즉시   | 적 사이 전기 연결선     |
| 폭탄 폭발 (Bomb Flash)    | VFX 원형  | 150ms  | 폭발 반경 + 화면 흔들림 |
| 네이팜 지대 (Napalm Zone) | VFX 영역  | 4000ms | 지속 화염 영역          |

### 7.3 파티클 공통 속성

```typescript
{
  blendMode: Phaser.BlendModes.ADD,
  lifespan: { min: 100, max: 300 },
  scale: { start: 1, end: 0 },
  alpha: { start: 1, end: 0 },
  speed: { min: 50, max: 200 },
  gravityY: 100
}
```

---

## 8. 애니메이션 타이밍

### 8.1 코어 타이밍

| 애니메이션                  | 지속 시간 | 이징           |
| --------------------------- | --------- | -------------- |
| 적 사망 페이드 (Death Fade) | 200ms     | Linear         |
| 피격 플래시 (Hit Flash)     | 80ms      | Linear         |
| 넉백 (Knockback)            | 150ms     | Power2.easeOut |
| 레벨업 일시정지             | 100ms     | —              |
| 보스 등장 연출              | 800ms     | Back.easeOut   |
| 스테이지 클리어             | 2000ms    | Power2.easeOut |

### 8.2 UI 애니메이션

| 애니메이션               | 지속 시간 | 이징           |
| ------------------------ | --------- | -------------- |
| XP 바 채움               | 200ms     | Power2.easeOut |
| 레벨업 카드 등장         | 300ms     | Back.easeOut   |
| 버튼 누름 (Button Press) | 80ms      | Linear         |
| 씬 페이드 (Scene Fade)   | 500ms     | Linear         |
| 데미지 넘버 팝업         | 300ms     | Power2.easeOut |

---

## 9. 기지 벽 (Base Wall) 비주얼

### 9.1 기지 구조

| 속성  | 값                              |
| ----- | ------------------------------- |
| 위치  | y=1100                          |
| 높이  | 30px                            |
| 폭    | 화면 전체 (720px)               |
| HP 바 | 상단에 680x16px HP 바           |
| 피격  | damageFlash 200ms (빨간 플래시) |

### 9.2 기지 HP 바

```
┌─────────────────────────────────┐
│  ████████████████░░░░░░░░░░░░  │  ← 기지 HP 바 (680x16)
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │  ← 기지 벽 (720x30)
└─────────────────────────────────┘
          y=1100
```

---

## 10. 텍스처 로딩 원칙

스프라이트는 **PNG 이미지 파일 우선**, 없으면 **프로시저럴 폴백**:

1. PreloadScene에서 `public/assets/sprites/` 내 PNG 파일 로드
2. PNG가 존재하면 PNG 사용, 없으면 `TextureFactory.ts`의 프로시저럴 폴백
3. `scene.textures.exists(key)` 또는 `has()` 체크로 분기
4. 점진적 교체 가능 — PNG를 추가하면 자동으로 프로시저럴 대체

### 로딩 순서 (PreloadScene)

```
1. PNG 이미지 로드 (배경, 캐릭터, 적, 투사체, 이펙트, UI)
2. PNG 미존재 키에 대해 프로시저럴 폴백 생성
3. 파티클 텍스처 (Particle textures)
```

---

## 11. 금지 사항

- 하드코딩된 컬러 값 (반드시 `colors.ts`에서 임포트)
- 하드코딩된 수치 (반드시 `balance.ts`에서 임포트)
- 픽셀아트 스타일 강제 (pixelArt: false 유지, 일러스트 스타일 사용)
- 블렌드 모드 혼용 (파티클=ADD, 나머지=NORMAL)
- nearest-neighbor 스케일링 강제 (bilinear 사용)
