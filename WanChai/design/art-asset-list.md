# WanChai 그래픽 리소스 전체 리스트 + AI 생성 프롬프트

> 작성일: 2026-03-02
> 해상도: 720x1280 (9:16 세로)
> 스타일: 사이버펑크 픽셀아트, 투명 배경 PNG
> 시점: 3/4 탑다운 (위에서 약간 비스듬히 내려다보는 시점)

---

## 게임 내 디스플레이 사이즈 기준

| 카테고리 | 소스 해상도 | 인게임 디스플레이 | 비고 |
|----------|-----------|-----------------|------|
| Player | 48x48 | 96px | 화면 하단 고정, 위를 향해 봄 |
| T1 적 | 48x48 | 96px | 일반 적 |
| T2 적 | 72x72 | 120px | 엘리트급, T1보다 확실히 큼 |
| T1 엘리트 | 48x48 | 134px (96×1.4) | 금색 테두리 |
| T2 엘리트 | 72x72 | 168px (120×1.4) | 금색 테두리 |
| Boss (인게임) | 192x192 | 360px | 화면 절반, 위압감 |
| Boss (코덱스/컷씬) | 384x384 | 원본 | 도감 상세 |
| 크리터 | 48x48 | 72px (예정) | 플레이어 옆 동반자 |
| 캐릭터 초상화 | 128x128 | 원본 | 대화창/결과화면 |
| 캐릭터 인게임 | 48x48 | 96px | 게임 내 플레이어 |
| 배경 | 720x1280 | 전체화면 | 스테이지별 |
| 투사체 | 16~24px | 32~48px | 무기별 차별화 |
| 이펙트 | 128~256px | 원본~2x | VFX용 |
| 로고 | 512x256 | 화면폭 맞춤 | 메인메뉴 |
| UI | 다양 | 원본 | HUD, 패널 |

---

## 세계관 요약 (프롬프트 반영용)

**배경**: 홍콩 — ARIA(도시 AI)가 야생 동물을 기계와 강제 융합한 "최적화체"로 만들어 도시를 지배. 플레이어는 이들을 "정화"하여 동물을 해방하는 항해사.

**적 = 최적화체**: 동물 + 기계 융합체. 보라색(#9b59b6) 에너지 라인이 기계 부분에서 맥동. 눈이 보라색으로 발광.
- T1 (10~20% 기계화): 부품 1~2개 외부 부착, 원래 동물 실루엣 명확
- T2 (40~60% 기계화): 신체 절반 기계, 경계면에서 보라색 에너지 라인
- T3/보스 (80~100%): 거대 기계 내부에 동물 봉인, 기계만 보이고 중심에 빛나는 실루엣

**아군 = 크리터**: 정화되어 해방된 순수 동물 정령. 밝고 귀여운 디자인. 원소색으로 빛남.

**톤**: 다크 배경 위 밝은 네온 — 사이버펑크 홍콩. 적은 으스스+안쓰러움, 아군은 밝고 귀여움.

---

## A. 현재 보유 리소스 (53장)

| # | 키 | 해상도 | 상태 |
|---|-----|--------|------|
| 1 | bg_wanchai | 720x1280 | O |
| 2 | bg_central | 720x1280 | O |
| 3 | bg_aberdeen | 720x1280 | O |
| 4 | bg_mongkok | 720x1280 | O |
| 5 | bg_shamshuipo | 720x1280 | O |
| 6 | bg_wongtaisin | 720x1280 | O |
| 7 | bg_kowloon | 720x1280 | O |
| 8 | bg_lantau | 720x1280 | O |
| 9-14 | t1_moth ~ t1_cat | 48x48 | O (v2) |
| 15-20 | opt_t2_kite ~ opt_t2_koi | 72x72 | O (v2) |
| 21-25 | critter_kite ~ critter_pangolin | 48x48 | O (v2) |
| 26-31 | boss_aero ~ boss_umbra | 192x192 | O (v2) |
| 32-37 | boss_aero_large ~ boss_umbra_large | 384x384 | O (v2) |
| 38-42 | char_hai ~ char_kai | 128x128 | O |
| 43-47 | char_hai_ingame ~ char_kai_ingame | 48x48 | O (v2) |
| 48-50 | fx_mech_debris, fx_purify_burst, fx_glitch_overlay | 다양 | O |
| 51 | ui_mtr_map | 720x1280 | O |
| 52 | ui_aria_panel | 360x200 | O |
| 53-54 | logo_main, logo_small | 512x256, 256x128 | O (v2) |

---

## B. 필요한 신규 리소스

### B-1. 투사체 (Projectiles) — 7장

현재 프로시저럴 생성(TextureFactory)으로 대체 중이나, 픽셀아트로 교체 시 품질 향상.

| # | 키 | 해상도 | 무기 | 설명 |
|---|-----|--------|------|------|
| 1 | `projectile_bullet` | 16x16 | 에너지 샷 / 산탄총 | 기본 에너지 탄환 |
| 2 | `projectile_rapid` | 12x12 | 속사포 | 작고 빠른 연사 탄 |
| 3 | `projectile_shuriken` | 24x24 | 수리검 | 회전하는 별 모양 |
| 4 | `projectile_missile` | 24x12 | 추적 미사일 | 로켓/화살 형태 |
| 5 | `projectile_napalm` | 20x20 | 네이팜탄 | 불덩이 |
| 6 | `projectile_bomb` | 20x20 | 에너지 폭탄 | 구형 폭탄 |
| 7 | `projectile_enemy` | 12x12 | 적 원거리 공격 | 보라색 에너지탄 |

**공통 프롬프트 프리픽스**:
```
16-bit pixel art, cyberpunk style, transparent background, top-down view, glowing neon energy effect, dark navy (#1a1a2e) accents
```

**개별 프롬프트**:

1. **projectile_bullet** (16x16):
```
16-bit pixel art, 16x16 sprite, transparent background, top-down view. A small cyan energy bullet — a compact glowing orb with a bright core and fading energy trail. Neon teal (#00ffd5) glow, slight motion blur upward. Cyberpunk tech aesthetic. No text.
```

2. **projectile_rapid** (12x12):
```
16-bit pixel art, 12x12 sprite, transparent background, top-down view. A tiny rapid-fire pellet — a small concentrated dot of bright white-cyan energy, minimal glow, clean edges. Designed to look fast and numerous. No text.
```

3. **projectile_shuriken** (24x24):
```
16-bit pixel art, 24x24 sprite, transparent background, top-down view. A cyberpunk throwing star (shuriken) — 4 pointed blades with metallic silver edges and neon cyan (#00ffd5) energy lines along the edges. Central hub glows. Designed to look like it spins. No text.
```

4. **projectile_missile** (24x12):
```
16-bit pixel art, 24x12 sprite (wide), transparent background, side view pointing upward. A small homing missile — sleek metallic body, red (#e74c3c) nose cone, tiny fins at the back, orange exhaust flame trail. Cyberpunk tech with panel lines. No text.
```

5. **projectile_napalm** (20x20):
```
16-bit pixel art, 20x20 sprite, transparent background, top-down view. A fireball projectile — swirling orange (#e74c3c) and yellow (#f1c40f) flames forming a sphere, bright white-hot core, embers trailing off. Intense heat glow. No text.
```

6. **projectile_bomb** (20x20):
```
16-bit pixel art, 20x20 sprite, transparent background, top-down view. A spherical energy bomb — dark metallic shell with glowing cyan circuit lines, pulsing energy core visible through cracks. Looks heavy and volatile. No text.
```

7. **projectile_enemy** (12x12):
```
16-bit pixel art, 12x12 sprite, transparent background, top-down view. A small hostile energy bolt — purple (#9b59b6) glowing orb with dark violet core, trailing corrupted purple energy wisps. ARIA's malicious data packet. No text.
```

---

### B-2. 크리터 누락분 — 1장

현재 크리터 5종 보유 (kite, dolphin, macaque, lion, pangolin). 6번째 크리터 누락.

| # | 키 | 해상도 | 원본 동물 | 원소 |
|---|-----|--------|----------|------|
| 1 | `critter_koi` | 48x48 | 잉어 (錦鯉) | Dark |

**프롬프트**:
```
16-bit pixel art, 48x48 sprite, transparent background, 3/4 top-down view facing upward (moving with player, seen from slightly above and behind). A purified koi fish critter — liberated from ARIA's control. Beautiful flowing fins and tail with shimmering dark purple (#9b59b6) and gold (#ffd700) scales. Glowing violet eyes full of life. Ethereal shadow energy wisps trailing behind. Cute, friendly appearance — a loyal companion. Cyberpunk fantasy style. No text.
```

---

### B-3. 적 투사체 이펙트 — 2장

| # | 키 | 해상도 | 설명 |
|---|-----|--------|------|
| 1 | `fx_enemy_shoot_flash` | 32x32 | 적 원거리 발사 시 머즐 플래시 |
| 2 | `fx_napalm_zone` | 64x64 | 네이팜 착탄 화염 지대 |

**프롬프트**:

1. **fx_enemy_shoot_flash** (32x32):
```
16-bit pixel art, 32x32 sprite, transparent background. A purple energy muzzle flash — a burst of corrupted violet (#9b59b6) energy radiating outward from center, with glitch-like digital artifacts at the edges. ARIA's hostile discharge. No text.
```

2. **fx_napalm_zone** (64x64):
```
16-bit pixel art, 64x64 sprite, transparent background, top-down view. A circular napalm fire zone on the ground — burning orange and red flames spread in a circle, bright white-hot center, dark scorch marks, embers floating upward. Viewed from above. No text.
```

---

### B-4. UI 요소 — 4장

| # | 키 | 해상도 | 설명 |
|---|-----|--------|------|
| 1 | `ui_weapon_slot_bg` | 160x36 | 무기 슬롯 배경 (빈 상태) |
| 2 | `ui_weapon_slot_filled` | 160x36 | 무기 슬롯 배경 (장착 상태) |
| 3 | `ui_hp_bar_frame` | 200x20 | HP 바 프레임 |
| 4 | `ui_xp_bar_frame` | 600x16 | XP 바 프레임 |

**프롬프트**:

1. **ui_weapon_slot_bg** (160x36):
```
16-bit pixel art, 160x36 sprite, transparent background. An empty weapon slot UI panel — dark navy (#1a1a2e) background with thin cyan (#00ffd5) border, subtle circuit pattern, slightly transparent. Cyberpunk HUD style. Clean, minimal. No text.
```

2. **ui_weapon_slot_filled** (160x36):
```
16-bit pixel art, 160x36 sprite, transparent background. An active weapon slot UI panel — dark navy background with bright cyan (#00ffd5) glowing border, inner subtle energy pulse, slightly brighter than empty state. Cyberpunk HUD style. No text.
```

3. **ui_hp_bar_frame** (200x20):
```
16-bit pixel art, 200x20 sprite, transparent background. A health bar frame — metallic dark border with small rivets at corners, inner area empty/transparent for fill overlay, subtle cyan accent lines. Cyberpunk HUD style. No text.
```

4. **ui_xp_bar_frame** (600x16):
```
16-bit pixel art, 600x16 sprite, transparent background. A wide experience bar frame — thin dark metallic border with circuit pattern accents, inner area empty/transparent for fill overlay. Cyberpunk HUD, minimalist. No text.
```

---

### B-5. 무기 아이콘 (코덱스/슬롯용) — 10장

| # | 키 | 해상도 | 무기 |
|---|-----|--------|------|
| 1 | `icon_energy_shot` | 48x48 | 에너지 샷 |
| 2 | `icon_napalm` | 48x48 | 네이팜탄 |
| 3 | `icon_laser_beam` | 48x48 | 레이저 빔 |
| 4 | `icon_shuriken` | 48x48 | 수리검 |
| 5 | `icon_shotgun` | 48x48 | 산탄총 |
| 6 | `icon_lightning` | 48x48 | 체인 라이트닝 |
| 7 | `icon_missile` | 48x48 | 추적 미사일 |
| 8 | `icon_bomb` | 48x48 | 에너지 폭탄 |
| 9 | `icon_railgun` | 48x48 | 레일건 |
| 10 | `icon_rapid_fire` | 48x48 | 속사포 |

**공통 프롬프트 프리픽스**:
```
16-bit pixel art, 48x48 icon sprite, transparent background, centered weapon icon, cyberpunk tech style, dark navy (#1a1a2e) with neon glow accents, clean readable silhouette. No text.
```

**개별 프롬프트**:

1. **icon_energy_shot**:
```
[PREFIX] A basic energy pistol — compact futuristic handgun with cyan (#00ffd5) energy core visible through translucent barrel. Simple, iconic shape.
```

2. **icon_napalm**:
```
[PREFIX] A napalm launcher — bulky cylindrical weapon with orange (#e74c3c) flame canister, heat vents glowing. Looks heavy and destructive.
```

3. **icon_laser_beam**:
```
[PREFIX] A laser beam emitter — sleek elongated barrel with crystal lens at the tip, bright cyan (#00ffd5) energy line through the center. Precise and elegant.
```

4. **icon_shuriken**:
```
[PREFIX] A stack of cyberpunk throwing stars — 4-pointed metallic shuriken with cyan energy lines along edges, stacked/fanned arrangement showing multiple.
```

5. **icon_shotgun**:
```
[PREFIX] A cyberpunk shotgun — short wide barrel with spread indicator marks, neon cyan accents, chunky and powerful looking.
```

6. **icon_lightning**:
```
[PREFIX] A chain lightning device — Tesla coil-style cylindrical device with electric arcs, bright yellow-white (#f1c40f) lightning bolts crackling around it.
```

7. **icon_missile**:
```
[PREFIX] A missile launcher — shoulder-mounted tube with red (#e74c3c) targeting reticle, small missile visible inside, military-tech cyberpunk.
```

8. **icon_bomb**:
```
[PREFIX] An energy bomb device — spherical dark metallic bomb with glowing cyan circuit cracks, digital timer display, looks volatile.
```

9. **icon_railgun**:
```
[PREFIX] A railgun — long electromagnetic barrel with twin rails, bright cyan energy building between rails, high-tech and powerful.
```

10. **icon_rapid_fire**:
```
[PREFIX] A rapid-fire minigun — rotating multi-barrel weapon with cyan energy cores, speed lines suggesting high fire rate, compact form.
```

---

### B-6. 보스 T3 누락분 — 2장 (인게임 + 코덱스)

현재 보스 3종만 게임에 사용 (aero, hydra, blaze). 나머지 3종(terra, lumen, umbra)은 스프라이트만 있고 게임 미등장. 최종 보스(Harvester) 없음.

| # | 키 | 해상도 | 보스 |
|---|-----|--------|------|
| 1 | `boss_harvester` | 192x192 | Harvester Core (최종 보스) |
| 2 | `boss_harvester_large` | 384x384 | Harvester Core (코덱스) |

**프롬프트**:

1. **boss_harvester** (192x192):
```
16-bit pixel art, 192x192 sprite, transparent background, 3/4 top-down view facing downward (looming toward viewer from above). The Elemental Harvester — ARIA's ultimate creation. A massive circular mechanical structure built around a corrupted elemental conduit. Six crystalline energy cores (red, blue, green, yellow, white, purple) are embedded around the ring, each pulsing with captured elemental energy. Dark metallic body with exposed gears, pipes, and circuit boards. Central eye-like aperture glows with all six element colors swirling together. Purple (#9b59b6) corruption veins spread across the surface. The original conveyor belt mechanism is visible — this is the prototype that ARIA used to harvest Hong Kong's elemental energy. Imposing, mechanical, eldritch. Cyberpunk meets cosmic horror. No text.
```

2. **boss_harvester_large** (384x384):
```
[Same as above but] 384x384 sprite with more detail — individual rivet heads visible, each of the 6 elemental crystals has internal fracture patterns, corruption veins show micro-circuit patterns, the central aperture reveals a swirling void of mixed elemental energy. Greater detail in the mechanical layers — outer armor, mid structural beams, inner conduit pipes. Shadow of the imprisoned elemental spirits barely visible within each crystal. No text.
```

---

## C. 리소스 총 집계

| 카테고리 | 보유 | 신규 필요 | 합계 |
|----------|------|----------|------|
| 배경 (720x1280) | 8 | 0 | 8 |
| T1 적 (48x48) | 6 | 0 | 6 |
| T2 적 (72x72) | 6 | 0 | 6 |
| 보스 인게임 (192x192) | 6 | 1 | 7 |
| 보스 코덱스 (384x384) | 6 | 1 | 7 |
| 크리터 (48x48) | 5 | 1 | 6 |
| 캐릭터 초상화 (128x128) | 5 | 0 | 5 |
| 캐릭터 인게임 (48x48) | 5 | 0 | 5 |
| 투사체 | 0 | 7 | 7 |
| 이펙트 | 3 | 2 | 5 |
| UI | 2 | 4 | 6 |
| 무기 아이콘 | 0 | 10 | 10 |
| 로고 | 2 | 0 | 2 |
| **합계** | **54** | **26** | **80** |

---

## D. 우선순위

| 우선순위 | 카테고리 | 장수 | 이유 |
|---------|----------|------|------|
| **P0** | 투사체 7장 | 7 | 현재 프로시저럴로 대체 중, 품질 차이 큼 |
| **P0** | 무기 아이콘 10장 | 10 | 코덱스/슬롯에서 텍스트만 표시 중 |
| **P1** | 적 투사체 + 네이팜 이펙트 2장 | 2 | 전투 피드백 강화 |
| **P1** | 크리터 누락 1장 | 1 | 6원소 완성 |
| **P2** | UI 요소 4장 | 4 | 현재 프로시저럴 rect로 대체 |
| **P2** | Harvester 보스 2장 | 2 | Ch.7 구현 시 필요 |
| **합계** | | **26** | |
