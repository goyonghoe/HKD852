# Projectile Orientation Specification

> 발사체 스프라이트 방향 규약 — 아트/코드/QA 공통 참조 문서

## 1. Phaser 회전 규약 (불변)

```
rotation = 0      → 오른쪽 (→)  = 3시 방향
rotation = -π/2   → 위쪽   (↑)  = 12시 방향
rotation = π/2    → 아래쪽 (↓)  = 6시 방향
rotation = π      → 왼쪽   (←)  = 9시 방향
```

## 2. 코드 회전 공식 (불변)

```typescript
// Projectile.ts line 46 — 변경 금지
this.setRotation(Math.atan2(vy, vx));
```

- `atan2(vy, vx)` = 속도 벡터의 각도 (양의 X축 기준)
- 스프라이트가 **RIGHT(→)** 을 바라보면, 이 공식만으로 어떤 방향이든 정확히 회전

## 3. PNG 방향 규칙 ★★★

### 방향성 있는 발사체 (Directional)

PNG 원본에서 **발사체의 "코"(앞머리)가 오른쪽(→)을 향해야 함.**

```
[꼬리/배기] ──────→ [코/탄두]
LEFT                    RIGHT
```

| 키                       | 분류        | PNG 방향  | 비고                                  |
| ------------------------ | ----------- | --------- | ------------------------------------- |
| `projectile_bullet`      | Directional | → (RIGHT) | 탄두가 오른쪽                         |
| `projectile_laser`       | Directional | → (RIGHT) | 빔 끝이 오른쪽                        |
| `projectile_rapid`       | Directional | → (RIGHT) | 총알 끝이 오른쪽                      |
| `projectile_missile`     | Directional | → (RIGHT) | 미사일 노즈가 오른쪽, 배기불꽃이 왼쪽 |
| `projectile_enemy`       | Directional | → (RIGHT) | 적 발사체도 동일 규약                 |
| `projectile_enemy_large` | Directional | → (RIGHT) | 적 대형 발사체                        |

### 방향성 없는 발사체 (Non-directional)

중심 대칭 (회전해도 모양 동일). 방향 무관.

| 키                    | 분류      | PNG 방향  | 비고                 |
| --------------------- | --------- | --------- | -------------------- |
| `projectile_shuriken` | Symmetric | 중심 대칭 | spinRate=12로 회전함 |
| `projectile_bomb`     | Symmetric | 중심 대칭 | 구형 폭탄            |
| `projectile_napalm`   | Symmetric | 중심 대칭 | 화염구               |

## 4. 사이즈 규격

| 키                       | PNG 소스 크기 | 디스플레이 크기 | 가로:세로             |
| ------------------------ | ------------- | --------------- | --------------------- |
| `projectile_bullet`      | 48×24         | ~32×16          | 2:1 (가로로 긴)       |
| `projectile_laser`       | 64×12         | ~48×8           | ~5:1 (매우 가로로 긴) |
| `projectile_rapid`       | 36×18         | ~24×12          | 2:1                   |
| `projectile_missile`     | 48×20         | ~36×15          | ~2.4:1                |
| `projectile_enemy`       | 24×24         | ~20×20          | 1:1 (원형)            |
| `projectile_enemy_large` | 36×36         | ~28×28          | 1:1 (원형)            |
| `projectile_shuriken`    | 48×48         | ~36×36          | 1:1                   |
| `projectile_bomb`        | 48×48         | ~36×36          | 1:1                   |
| `projectile_napalm`      | 48×48         | ~36×36          | 1:1                   |

**핵심**: 방향성 있는 발사체는 **가로가 세로보다 길다** (가로로 뉜 형태).

## 5. 검증 체크리스트

### 아트 생성 후 검증

- [ ] 방향성 발사체: 이미지 뷰어에서 "코"가 오른쪽을 향하는가?
- [ ] 방향성 발사체: 가로 > 세로인가? (가로로 뉜 형태)
- [ ] 비방향성 발사체: 중심 대칭인가?
- [ ] 배경이 투명한가? (rembg 처리)

### 코드 통합 후 검증

- [ ] `npm run build` PASS
- [ ] `npm test -- --run` PASS
- [ ] 게임 실행 → 위쪽으로 발사 시 발사체가 위(↑)를 향하는가?
- [ ] 게임 실행 → 좌상단 적에게 발사 시 발사체가 좌상단을 향하는가?
- [ ] 호밍 미사일: 적을 추적하며 방향이 자연스럽게 바뀌는가?
- [ ] 수리검: 회전하면서 날아가는가?

## 6. 프로시저럴 폴백 방향

TextureFactory에서 생성하는 프로시저럴 텍스처도 동일 규약:

- `projectile_missile`: 24×10, 노즈콘이 오른쪽 (x=w, y=h/2)
- `projectile_laser`: **6×40 세로 → 이 규약에 맞지 않음 (수정 권장)**
- 나머지: 원형/대칭 → 무관

## 7. 생성 파이프라인

```
1. Gemini API로 이미지 생성 (프롬프트에 "pointing RIGHT" 명시)
2. rembg로 배경 제거
3. PIL로 방향 확인:
   - 방향성 발사체: 이미지의 무게중심이 왼쪽(꼬리), 밝은 부분이 오른쪽(코)인지 확인
   - 틀리면 PIL.Image.rotate()로 보정
4. Lanczos 리사이즈 → PNG 저장
5. 검증 체크리스트 수행
```
