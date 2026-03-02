# 추가 리소스 제작 명세서

> 작성일: 2026-03-02
> 현재 보유: 80장 (v3), 프로시저럴 폴백 6장
> 추가 필요: 아래 목록

---

## Priority A — 게임플레이 직접 사용

### A-1. 적 투사체 스프라이트 (1장)

현재 적 원거리 공격(`spawnEnemyProjectile`)이 단색 원으로만 표현됨.

| 키 | 사이즈 | 설명 | 프롬프트 참고 |
|----|--------|------|-------------|
| `projectile_enemy_large` | 16x16 | 보스 전용 대형 투사체 (보라+빨강) | Pixel art, 16x16, glowing purple-red energy orb, dark core with bright purple corona, trailing red particles, transparent background |

### A-2. 스테이지 클리어 이펙트 (1장)

스테이지 클리어 시 전체 화면 플래시 이펙트.

| 키 | 사이즈 | 설명 | 프롬프트 참고 |
|----|--------|------|-------------|
| `fx_stage_clear` | 256x256 | 정화 완료 확산파 (시안+흰) | Pixel art, 256x256, expanding circular shockwave, cyan-white energy ring radiating outward, fading particles, transparent background |

### A-3. 레벨업 이펙트 (1장)

레벨업 시 플레이어 주변 이펙트.

| 키 | 사이즈 | 설명 | 프롬프트 참고 |
|----|--------|------|-------------|
| `fx_levelup` | 128x128 | 레벨업 광환 (금색+시안) | Pixel art, 128x128, golden-cyan ascending light pillar, sparkle particles spiraling upward, radiant glow, transparent background |

---

## Priority B — UI/UX 강화

### B-1. 패시브 아이콘 (8장)

현재 패시브 업그레이드 선택 시 텍스트만 표시. 아이콘으로 직관성 향상.

| 키 | 사이즈 | 설명 |
|----|--------|------|
| `icon_passive_crit` | 48x48 | 크리티컬 확률 — 번개 표식 |
| `icon_passive_crit_dmg` | 48x48 | 크리티컬 데미지 — 이중 번개 |
| `icon_passive_armor` | 48x48 | 방어력 — 방패 |
| `icon_passive_regen` | 48x48 | HP 재생 — 녹색 하트 |
| `icon_passive_magnet` | 48x48 | XP 자석 — 자석 아이콘 |
| `icon_passive_cooldown` | 48x48 | 쿨다운 감소 — 시계 |
| `icon_passive_area` | 48x48 | 범위 증가 — 확산 원 |
| `icon_passive_projectile` | 48x48 | 투사체 추가 — +1 화살 |

**공통 스타일**: 48x48, 사이버펑크 네온 아이콘, 어두운 배경 위 밝은 심볼, 투명 배경

### B-2. 상점 아이콘 (4장)

메타 상점에서 업그레이드 항목 시각화.

| 키 | 사이즈 | 설명 |
|----|--------|------|
| `icon_shop_hp` | 48x48 | HP 강화 — 시안 하트 |
| `icon_shop_armor` | 48x48 | 방어 강화 — 방패+회로 |
| `icon_shop_damage` | 48x48 | 공격력 — 빨간 검 |
| `icon_shop_base_hp` | 48x48 | 기지 HP — 건물+하트 |

### B-3. 크리터 파트너 UI 초상화 (6장)

코덱스/선택 화면에서 크리터 확대 표시용.

| 키 | 사이즈 | 설명 |
|----|--------|------|
| `critter_kite_portrait` | 128x128 | 솔개 초상화 (Wind) |
| `critter_dolphin_portrait` | 128x128 | 돌고래 초상화 (Water) |
| `critter_macaque_portrait` | 128x128 | 원숭이 초상화 (Fire) |
| `critter_lion_portrait` | 128x128 | 사자 초상화 (Light) |
| `critter_pangolin_portrait` | 128x128 | 천산갑 초상화 (Earth) |
| `critter_koi_portrait` | 128x128 | 잉어 초상화 (Dark) |

---

## Priority C — 향후 콘텐츠 대비

### C-1. T3 적 스프라이트 (6장)

스테이지 5~8 진입 시 필요한 고티어 적.

| 키 | 사이즈 | 원소 | 설명 |
|----|--------|------|------|
| `t3_phoenix` | 96x96 | Fire | 불사조형 — 화염 날개 + 사이버 갑옷 |
| `t3_kraken` | 96x96 | Water | 해파리-문어 하이브리드 — 전기 촉수 |
| `t3_golem` | 96x96 | Earth | 바위 골렘 — 회로 균열 |
| `t3_specter` | 96x96 | Dark | 유령형 — 반투명 + 보라 잔상 |
| `t3_seraph` | 96x96 | Light | 천사형 — 홀로그램 날개 |
| `t3_storm` | 96x96 | Wind | 회오리형 — 전기 소용돌이 |

**공통**: 3/4 탑다운 뷰, 화면 하단 향함 (위→아래), 사이버펑크 동물 퓨전

### C-2. 보스 Phase 2 변형 (3장)

현재 3보스의 Phase 2 (HP 50% 이하) 강화 형태.

| 키 | 사이즈 | 설명 |
|----|--------|------|
| `boss_aero_enraged` | 192x192 | 에어로 분노 — 날개 확장 + 빨간 눈 |
| `boss_hydra_enraged` | 192x192 | 히드라 분노 — 촉수 증가 + 전기 방출 |
| `boss_blaze_enraged` | 192x192 | 블레이즈 분노 — 전신 화염 + 용암 흐름 |

---

## 총 추가 수량

| 우선순위 | 수량 | 용도 |
|---------|------|------|
| A (즉시) | 3장 | 게임플레이 이펙트 |
| B (다음) | 18장 | UI/UX 아이콘 + 초상화 |
| C (향후) | 9장 | 콘텐츠 확장 |
| **합계** | **30장** | |

---

## 공통 제작 규칙

1. **Pixel art style** — v3와 동일한 스타일 유지
2. **Transparent background** (PNG RGBA) — 배경 투명
3. **3/4 top-down view** — 적/캐릭터는 게임 시점 준수
4. **NO text** — AI 이미지에 텍스트/숫자 포함 금지
5. **Center composition** — 캔버스 중앙 정렬, 여백 최소화
6. **Cyberpunk neon palette** — 기존 art-style-guide.md 준수
7. **Size exact** — 지정 사이즈 정확히 맞춤 (리사이즈 불가)
