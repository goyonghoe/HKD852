# 아트 작업 지시서 — NEXT STOP — HK852

> 스테이블 디퓨전용 이미지 생성 프롬프트 + 기술 사양서.
> 세계관: 스마트시티 AI "ARIA"가 폭주한 홍콩. 자연 동물이 기계와 강제 융합된 "최적화체"를 정화하며 도시를 되찾는 퍼즐 게임.

## 게임 개요

- **타이틀**: NEXT STOP — HK852
- **장르**: 원형 컨베이어 퍼즐 (원소 매칭)
- **화면**: 720x1280 (9:16 세로, 모바일)
- **배경**: 사이버펑크 홍콩. 어두운 네이비(#1a1a2e) 위에 네온 + 보라색 글리치
- **키 비주얼**: 홍콩 네온사인 + MTR 지하철 + 야생 동물 정령 vs 기계화 생물
- **톤**: 디스토피아가 아닌 "과잉 편의의 폭주". 어둡지만 희망적

---

## 공통 기술 사양

| 항목 | 값 |
|------|-----|
| 포맷 | PNG (투명 배경, RGBA) |
| 배경 | 반드시 투명 (알파 채널) |
| 스타일 | 픽셀아트 / 도트 그래픽 |
| 스케일링 | Nearest-neighbor (안티앨리어싱 OFF) |
| 방향 | 캐릭터는 **정면 또는 3/4 뷰** |
| 네이밍 | `[카테고리]_[이름].png` |

---

## 공통 SD 프롬프트 프리픽스

모든 프롬프트 앞에 이 스타일 지시를 붙입니다:

```
pixel art, 16-bit retro game sprite, clean pixel edges, limited color palette,
dark navy background removed, transparent background, no anti-aliasing,
cyberpunk Hong Kong aesthetic, neon glow accents,
```

### 네거티브 프롬프트 (전체 공통)

```
blurry, smooth gradients, 3d render, realistic, photograph, text, watermark,
signature, frame, border, UI elements, numbers, letters, low quality,
anti-aliased edges, soft edges, white background
```

---

## 1. 플레이어 캐릭터 (5인)

각 캐릭터는 **정면 상반신** 스프라이트 (128x128).
게임 내 표시: 64px 스케일. 대화창/선택 화면에서 128px 원본 사용.

### HAI (海) — Wind / 리더

```
pixel art game character portrait, young Hong Kong girl age 19,
short messy black hair with cyan wind-streak highlights,
determined bright eyes, Star Ferry worker vest over casual clothes,
wind element aura, cyan and yellow color scheme,
a black kite bird perched on shoulder,
cyberpunk Hong Kong neon city background elements,
cheerful confident expression, adventure-ready pose
```

| 텍스처 키 | 크기 | 원소색 |
|-----------|------|--------|
| `char_hai` | 128x128 | Wind — #f1c40f (gold/yellow) |

### NOVA — Water / 전략가

```
pixel art game character portrait, young Indian-Hong Kong girl age 20,
long dark hair in practical ponytail, analytical calm eyes,
marine biology student, HKU university jacket, waterproof gear elements,
water element aura, blue and teal color scheme,
pink dolphin silhouette nearby,
Chungking Mansions multicultural vibe, scholarly but street-smart
```

| 텍스처 키 | 크기 | 원소색 |
|-----------|------|--------|
| `char_nova` | 128x128 | Water — #3498db (blue) |

### SOL — Fire / 파이터

```
pixel art game character portrait, young Filipino-Hong Kong guy age 21,
athletic build, spiky dark hair, passionate fierce eyes,
Mong Kok night market worker, boxing tape on hands, tank top,
fire element aura, red and orange color scheme,
rhesus macaque monkey companion nearby,
neon-lit street market atmosphere, fighter spirit
```

| 텍스처 키 | 크기 | 원소색 |
|-----------|------|--------|
| `char_sol` | 128x128 | Fire — #e74c3c (red) |

### MEI (梅) — Light / 치유사

```
pixel art game character portrait, young British-Hong Kong mixed girl age 18,
soft wavy light brown hair, gentle empathetic eyes,
temple volunteer, simple modest clothing with light ornaments,
light element aura, white and gold color scheme,
stone lion guardian spirit faintly glowing nearby,
Wong Tai Sin temple atmosphere, warm caring expression
```

| 텍스처 키 | 크기 | 원소색 |
|-----------|------|--------|
| `char_mei` | 128x128 | Light — #ecf0f1 (white/silver) |

### KAI (鎧) — Earth / 해커

```
pixel art game character portrait, young Japanese-Hong Kong guy age 20,
messy dark hair, quiet intense eyes behind small round glasses,
electronics repair worker, utility vest with tools and cables,
earth element aura, green and brown color scheme,
pangolin curled up nearby,
Sham Shui Po Golden Computer Arcade vibe, tech-savvy introvert
```

| 텍스처 키 | 크기 | 원소색 |
|-----------|------|--------|
| `char_kai` | 128x128 | Earth — #2ecc71 (green) |

---

## 2. 크리터 — 파트너 동물 정령 (5종)

자연 원소 에너지와 공존하는 홍콩 야생 동물. 정령화된 상태.
각각 48x48 스프라이트. 원소색 글로우.

### 2.1 흑연 (Black Kite) — Wind

```
pixel art game creature, black kite bird spirit,
glowing cyan-gold wind aura, spread wings,
natural but ethereal, faint elemental particles around wings,
Hong Kong sky raptor, majestic small pixel sprite,
warm golden eyes, wind trail effect
```

### 2.2 핑크 돌고래 (Chinese White Dolphin) — Water

```
pixel art game creature, pink dolphin spirit,
glowing blue-teal water aura, playful jumping pose,
natural but ethereal, water droplet particles,
Hong Kong harbor dolphin, cute small pixel sprite,
luminous blue eyes, splash trail
```

### 2.3 적모원숭이 (Rhesus Macaque) — Fire

```
pixel art game creature, rhesus macaque monkey spirit,
glowing red-orange fire aura, energetic action pose,
natural but ethereal, ember particles around body,
Hong Kong mountain monkey, lively small pixel sprite,
bright orange eyes, flame trail
```

### 2.4 석사자 (Stone Lion) — Light

```
pixel art game creature, Chinese stone lion guardian spirit,
glowing white-gold light aura, noble standing pose,
ancient stone texture with cracks filled with light,
temple guardian awakened, dignified small pixel sprite,
radiant white eyes, light ray particles
```

### 2.5 천산갑 (Pangolin) — Earth

```
pixel art game creature, pangolin spirit,
glowing green earth aura, defensive curled-ready pose,
natural scales with faint circuit-like patterns underneath,
rare Hong Kong pangolin, sturdy small pixel sprite,
emerald green eyes, leaf particle trail
```

| # | 텍스처 키 | 크기 | 동물 | 원소 |
|---|-----------|------|------|------|
| 1 | `critter_kite` | 48x48 | 흑연 | Wind |
| 2 | `critter_dolphin` | 48x48 | 핑크 돌고래 | Water |
| 3 | `critter_macaque` | 48x48 | 적모원숭이 | Fire |
| 4 | `critter_lion` | 48x48 | 석사자 | Light |
| 5 | `critter_pangolin` | 48x48 | 천산갑 | Earth |

---

## 3. 최적화체 (Optimized) — 적 스프라이트

자연 동물이 ARIA에 의해 기계와 강제 융합된 존재.
**핵심 감정**: 무섭다기보다 "불쌍하다". 기계 부품에 포획된 동물.
**보라색 발광**(#9b59b6)이 기계 부분에서 나옴 = ARIA의 오염 시각화.

### 3.1 Tier 1 — 접촉체 (Touched) / 일반 적

원래 동물 형태 유지. 기계 부품 1~2개 부착. 눈이 보라색 발광.
각 48x48 스프라이트.

#### 信號蛾 Signal Moth (中環, Wind)

```
pixel art game enemy sprite, small moth creature,
antenna replaced with mechanical signal receiver, glowing purple eyes,
organic moth body with one metallic antenna attachment,
faint purple ARIA glow on mechanical parts,
sad trapped expression, cyberpunk bio-mechanical hybrid,
mostly natural with minimal tech corruption, Hong Kong urban moth
```

#### 幽光水母 LED Jelly (香港仔, Water)

```
pixel art game enemy sprite, small jellyfish creature,
tentacles partially replaced with LED fiber optic strands,
glowing purple eyes, translucent organic body,
bioluminescent blue mixed with artificial purple LED glow,
floating gracefully despite mechanical tentacles,
sad beautiful cyberpunk bio-mechanical hybrid, ocean creature
```

#### 霓虹鼠 Neon Rat (旺角, Fire)

```
pixel art game enemy sprite, small rat creature,
tail replaced with neon tube that glows purple,
glowing purple eyes, mostly organic furry body,
one ear has small satellite dish attachment,
scurrying pose, urban street rat with neon corruption,
cyberpunk bio-mechanical hybrid, Mong Kok neon aesthetic
```

#### 電路蟻 Circuit Ant (深水埗, Earth)

```
pixel art game enemy sprite, small ant creature,
back shell replaced with circuit board pattern,
glowing purple eyes, six organic legs,
faint purple circuit traces running along body,
marching pose, worker ant with tech parasitism,
cyberpunk bio-mechanical hybrid, electronics district vibe
```

#### 棱鏡蝶 Prism Fly (黃大仙, Light)

```
pixel art game enemy sprite, small butterfly creature,
wings have holographic projector panels replacing natural patterns,
glowing purple eyes, delicate organic body,
wings shimmer between natural iridescence and digital glitch,
fluttering pose, temple butterfly with light corruption,
cyberpunk bio-mechanical hybrid, ethereal but sad
```

#### 代理貓 Proxy Cat (九龍城寨, Dark)

```
pixel art game enemy sprite, small cat creature,
one eye replaced with camera lens server eye glowing purple,
organic fur body with data port on collar area,
prowling pose, alley cat with surveillance corruption,
cyberpunk bio-mechanical hybrid, mysterious dark aesthetic,
Kowloon Walled City shadow cat
```

| # | 텍스처 키 | 크기 | 구역 | 원소 |
|---|-----------|------|------|------|
| 1 | `opt_t1_moth` | 48x48 | 中環 | Wind |
| 2 | `opt_t1_jelly` | 48x48 | 香港仔 | Water |
| 3 | `opt_t1_rat` | 48x48 | 旺角 | Fire |
| 4 | `opt_t1_ant` | 48x48 | 深水埗 | Earth |
| 5 | `opt_t1_butterfly` | 48x48 | 黃大仙 | Light |
| 6 | `opt_t1_cat` | 48x48 | 九龍城寨 | Dark |

### 3.2 Tier 2 — 융합체 (Merged) / 엘리트 적

몸의 절반이 기계화. 동물+기계 실루엣이 공존. 경계면에 보라색 에너지 라인.
각 72x72 스프라이트.

#### 迴旋鳶 Gyro Kite (中環, Wind)

```
pixel art game elite enemy sprite, medium black kite bird,
one wing organic feathered and one wing replaced with drone propeller blades,
half-face organic half-face mechanical with purple visor,
purple energy line crackling along the organic-mechanical boundary,
in pain but forced to fly, trapped raptor,
cyberpunk bio-mechanical hybrid, larger and more threatening,
intermittent spark effects on mechanical wing
```

#### 聲納豚 Sonar Fin (香港仔, Water)

```
pixel art game elite enemy sprite, medium dolphin creature,
front half organic smooth skin, back half mechanical with sonar equipment,
dorsal fin replaced with antenna array, purple energy seam at midpoint,
organic eye showing pain, mechanical eye glowing purple,
swimming pose showing struggle between halves,
cyberpunk bio-mechanical hybrid, ocean tech fusion
```

#### 電弧猴 Arc Ape (旺角, Fire)

```
pixel art game elite enemy sprite, medium monkey creature,
organic torso and head, both arms replaced with mechanical piston limbs,
electrode nodes on shoulders sparking with purple electricity,
face showing anger and pain, fangs visible,
aggressive pose but clearly suffering from fusion,
cyberpunk bio-mechanical hybrid, Mong Kok electric aesthetic
```

#### 鋼甲穿 Steel Pango (深水埗, Earth)

```
pixel art game elite enemy sprite, medium pangolin creature,
natural scales on head and front, back scales replaced with metal armor plates,
mechanical tail with drill attachment, purple circuit lines between plates,
curled defensive pose showing both organic and metal sections,
cyberpunk bio-mechanical hybrid, heavy industrial look,
Sham Shui Po salvage aesthetic
```

#### 光纖獅 Fiber Lion (黃大仙, Light)

```
pixel art game elite enemy sprite, medium stone lion creature,
ancient stone body cracking with fiber optic cables growing through cracks,
mane replaced with flowing fiber optic strands glowing purple,
one eye stone one eye digital purple lens,
noble but corrupted stance, guardian turned prisoner,
cyberpunk bio-mechanical hybrid, temple tech corruption
```

#### 虛像錦 Holo Koi (九龍城寨, Dark)

```
pixel art game elite enemy sprite, medium koi fish creature,
organic head and front fins, body scales flickering between real and holographic,
tail fin is pure hologram projection glowing purple,
swimming through air with holographic water trail,
beautiful but glitching existence, partially real partially digital,
cyberpunk bio-mechanical hybrid, dark server room aesthetic
```

| # | 텍스처 키 | 크기 | 구역 | 원소 |
|---|-----------|------|------|------|
| 1 | `opt_t2_kite` | 72x72 | 中環 | Wind |
| 2 | `opt_t2_dolphin` | 72x72 | 香港仔 | Water |
| 3 | `opt_t2_ape` | 72x72 | 旺角 | Fire |
| 4 | `opt_t2_pango` | 72x72 | 深水埗 | Earth |
| 5 | `opt_t2_lion` | 72x72 | 黃大仙 | Light |
| 6 | `opt_t2_koi` | 72x72 | 九龍城寨 | Dark |

### 3.3 Tier 3 — 코어체 (Core-bound) / 보스

거대 기계 구조물. 내부에 원래 동물의 빛나는 실루엣이 갇혀 있음.
각 192x192 스프라이트. 보스전 컷인용 384x384도 필요.

#### 暴風 Aero (中環, Wind — 기상관리 시스템)

```
pixel art game boss sprite, massive wind machine entity,
giant mechanical weather control station body with turbine fans and wind vanes,
inside the core: faint glowing silhouette of a giant eagle trapped and crying,
purple ARIA energy coursing through all mechanical parts,
wind vortex swirling around the structure,
multiple rotating fan blades as limbs, weather satellite dish crown,
Victoria Peak Hong Kong backdrop aesthetic,
intimidating but the trapped bird inside evokes sympathy,
boss health bar position at top, multi-phase battle design
```

#### 深淵 Hydra (香港仔, Water — 해양관리 시스템)

```
pixel art game boss sprite, massive sea machine entity,
giant mechanical ocean monitoring station body with sonar arrays and water pumps,
inside the core: faint glowing silhouette of a sea dragon trapped,
purple ARIA energy flowing like underwater currents through metal,
water jets and pressure valves as attack appendages,
Aberdeen harbour industrial fishing aesthetic mixed with high tech,
barnacle-covered mechanical hull, depth pressure gauges,
terrifying deep sea machine but the dragon inside yearns for freedom
```

#### 霓虹 Blaze (旺角, Fire — 전력관리 시스템)

```
pixel art game boss sprite, massive neon dragon entity,
hundreds of Hong Kong neon signs fused together into dragon shape,
inside the core: faint glowing silhouette of a fire phoenix trapped,
purple ARIA energy replacing neon gas in the tubes,
Chinese character neon signs forming scales and spines,
Nathan Road Mong Kok neon jungle aesthetic,
crackling electricity between sign segments,
beautiful terrifying neon beast but the phoenix inside flickers for freedom
```

#### 鋼筋 Terra (深水埗, Earth — 건물관리 시스템)

```
pixel art game boss sprite, massive concrete golem entity,
building foundation pillars and rebar as skeleton, concrete slab body,
inside the core: faint glowing silhouette of a mountain spirit trapped,
purple ARIA circuit patterns growing through concrete like veins,
construction crane arm, excavator bucket fist,
Sham Shui Po old building renovation aesthetic,
crumbling but rebuilding itself, unstoppable infrastructure giant,
the mountain spirit inside tries to crack free
```

#### 光明 Lumen (黃大仙, Light — 에너지관리 시스템)

```
pixel art game boss sprite, massive light prism entity,
giant crystalline energy management node with solar panel wings,
inside the core: faint glowing silhouette of a qilin sacred beast trapped,
purple ARIA energy refracting through crystal facets,
light beam attacks from prism surfaces,
Wong Tai Sin temple incense smoke mixed with laser grid aesthetic,
sacred geometry corrupted by technology,
the qilin inside radiates pure white light against purple corruption
```

#### 暗影 Umbra (九龍城寨, Dark — 보안 시스템)

```
pixel art game boss sprite, massive server cluster entity,
server racks and cooling pipes and cables woven into spider-like form,
inside the core: faint glowing silhouette of a shadow phoenix trapped,
purple ARIA energy pulsing through all cable connections,
security camera eyes on multiple stalks, firewall barrier shields,
Kowloon Walled City labyrinth density aesthetic,
claustrophobic tangled mass of technology,
the shadow bird inside is almost invisible, barely a whisper of freedom
```

| # | 텍스처 키 | 크기 | 구역 | 원소 | 보스명 |
|---|-----------|------|------|------|--------|
| 1 | `boss_aero` | 192x192 + 384x384 | 中環 | Wind | 暴風 Aero |
| 2 | `boss_hydra` | 192x192 + 384x384 | 香港仔 | Water | 深淵 Hydra |
| 3 | `boss_blaze` | 192x192 + 384x384 | 旺角 | Fire | 霓虹 Blaze |
| 4 | `boss_terra` | 192x192 + 384x384 | 深水埗 | Earth | 鋼筋 Terra |
| 5 | `boss_lumen` | 192x192 + 384x384 | 黃大仙 | Light | 光明 Lumen |
| 6 | `boss_umbra` | 192x192 + 384x384 | 九龍城寨 | Dark | 暗影 Umbra |

---

## 4. 정화 이펙트 — 해방 시퀀스

적을 정화하면 기계 부품이 분해되고 원래 동물이 풀려나는 연출.

### 4.1 기계 분해 파편

```
pixel art game effect sprite sheet, mechanical debris fragments,
broken metal plates, snapped cables, cracked circuit boards,
shattered purple crystals losing their glow,
sparking loose wires, falling bolts and screws,
cyberpunk tech destruction particles,
multiple small fragments on transparent background,
fading purple glow to neutral grey as corruption leaves
```

| 텍스처 키 | 크기 | 설명 |
|-----------|------|------|
| `fx_mech_debris` | 256x64 (스프라이트시트 8프레임) | 기계 파편 애니메이션 |

### 4.2 정화 빛

```
pixel art game effect, purification light burst,
elemental color energy expanding outward in ring shape,
warm golden-white core fading to element-specific color at edges,
pixel sparkle particles radiating outward,
sacred cleansing light dissolving purple corruption,
transparent background, animation-ready sprite sheet
```

| 텍스처 키 | 크기 | 설명 |
|-----------|------|------|
| `fx_purify_burst` | 256x256 (4프레임) | 정화 빛 폭발 |

---

## 5. 환경 — 홍콩 구역별 배경

각 챕터의 배경 타일/일러스트. 720x1280 풀스크린.
게임 플레이 중에는 어두운 배경이지만, 챕터 선택/스토리 화면에서 사용.

### 5.1 灣仔 Hub (허브)

```
pixel art background, Hong Kong Wan Chai district at twilight,
Blue House old tong lau building in warm amber light,
Star Ferry pier visible in distance, harbor view,
mix of old neighborhood charm and ARIA holographic overlays,
MTR station entrance with "Next Stop" sign glowing,
warm but tense atmosphere, pre-storm calm,
neon signs in traditional Chinese characters,
16-bit retro game background style, detailed pixel scenery
```

### 5.2 中環 Central (Ch.1 — Wind)

```
pixel art background, Hong Kong Central district cyberpunk,
IFC tower and skyscrapers with ARIA hologram advertisements,
Mid-Levels escalator system with purple glitch corruption spreading,
wind-swept clouds between buildings, drone swarms patrolling,
mix of colonial architecture and ultra-modern glass towers,
Victoria Peak visible above, tram tracks below,
purple fog seeping from MTR vents, neon cyan wind streaks,
16-bit retro game background style, vertical city composition
```

### 5.3 香港仔 Aberdeen (Ch.2 — Water)

```
pixel art background, Hong Kong Aberdeen harbor cyberpunk,
fishing boats and sampans mixed with ARIA automated vessels,
Jumbo floating restaurant ruins repurposed as data relay station,
purple-tinted water reflecting corrupted neon lights,
traditional fishing village meeting high-tech ocean monitoring,
misty harbor atmosphere with sonar ping visual effects,
blue water element energy visible beneath surface,
16-bit retro game background style, harbor composition
```

### 5.4 旺角 Mong Kok (Ch.3 — Fire)

```
pixel art background, Hong Kong Mong Kok night market cyberpunk,
Nathan Road packed with neon signs in Chinese characters,
signs flickering between original colors and ARIA purple corruption,
night market stalls with warm lantern light fighting purple fog,
dense urban crowd energy, street food steam mixing with digital haze,
red and orange fire energy crackling along power lines,
Ladies Market and Goldfish Market visual references,
16-bit retro game background style, neon overload composition
```

### 5.5 深水埗 Sham Shui Po (Ch.4 — Earth)

```
pixel art background, Hong Kong Sham Shui Po district cyberpunk,
Golden Computer Arcade building with electronics shop signs,
old tong lau buildings with purple circuit patterns growing on walls,
street-level electronics repair shops and vintage tech stalls,
concrete and rebar exposed, urban decay meeting digital corruption,
green earth energy visible in cracks of old foundations,
Apliu Street flea market aesthetic with cables everywhere,
16-bit retro game background style, gritty urban composition
```

### 5.6 黃大仙 Wong Tai Sin (Ch.5 — Light)

```
pixel art background, Hong Kong Wong Tai Sin temple cyberpunk,
traditional Chinese temple with red pillars and curved roofs,
incense smoke mixing with ARIA holographic interference,
temple lights extinguished except for stubborn candle flames,
Lion Rock visible in background against digital aurora sky,
white and gold light energy emanating from ancient stone,
prayer halls with fortune stick containers, garden ponds dark,
16-bit retro game background style, sacred meets tech composition
```

### 5.7 九龍城寨 Kowloon Walled City (Ch.6 — Dark)

```
pixel art background, Kowloon Walled City reimagined as ARIA server facility,
impossibly dense building cluster converted to server farm,
tangled cables and pipes replacing old water lines,
purple LED server lights visible through narrow alley windows,
claustrophobic vertical composition, no sky visible,
dark purple and black color scheme with occasional data stream lights,
multiple layers of walkways and bridges between server buildings,
16-bit retro game background style, oppressive dark composition
```

### 5.8 大嶼山 Lantau Island (Final)

```
pixel art background, Hong Kong Lantau Island Tian Tan Buddha,
giant bronze Buddha statue with ARIA antenna array installed on top,
Ngong Ping 360 cable car system corrupted with purple energy,
natural mountain greenery fighting against digital corruption,
all six elemental colors visible in the landscape simultaneously,
sunrise breaking through dark clouds, hope returning,
monastery buildings at Buddha's feet, prayer flags,
16-bit retro game background style, epic final stage composition
```

| # | 텍스처 키 | 크기 | 구역 |
|---|-----------|------|------|
| 1 | `bg_wanchai` | 720x1280 | 灣仔 Hub |
| 2 | `bg_central` | 720x1280 | 中環 Ch.1 |
| 3 | `bg_aberdeen` | 720x1280 | 香港仔 Ch.2 |
| 4 | `bg_mongkok` | 720x1280 | 旺角 Ch.3 |
| 5 | `bg_shamshuipo` | 720x1280 | 深水埗 Ch.4 |
| 6 | `bg_wongtaisin` | 720x1280 | 黃大仙 Ch.5 |
| 7 | `bg_kowloon` | 720x1280 | 九龍城寨 Ch.6 |
| 8 | `bg_lantau` | 720x1280 | 大嶼山 Final |

---

## 6. MTR / UI 요소

### 6.1 MTR 노선도 (월드맵)

```
pixel art game map, Hong Kong MTR subway map stylized,
clean geometric line diagram with station dots,
each line in distinct color (red, blue, green, orange, purple, brown),
stations as small diamond or circle nodes,
currently corrupted lines show purple glitch overlay,
cleared lines restored to original color,
dark navy background, neon line glow,
game world map interface design, touchable station nodes
```

### 6.2 ARIA 시스템 UI

```
pixel art game UI element, ARIA AI system interface panel,
holographic transparent panel with purple accent borders,
system status readouts, percentage bars, warning indicators,
clean futuristic minimal design, monospace pixel font,
"NODE HK852" header text, optimization percentage display,
glassmorphism semi-transparent panel on dark background,
cyberpunk tech aesthetic, cold clinical purple theme
```

### 6.3 글리치 오버레이 텍스처

```
pixel art game overlay texture, digital glitch corruption pattern,
purple (#9b59b6) scanlines and data noise,
VHS tracking error aesthetic mixed with circuit board traces,
semi-transparent overlay for corrupted areas,
flickering pixel distortion, data stream fragments,
tileable seamless pattern, cyberpunk digital pollution
```

| # | 텍스처 키 | 크기 | 설명 |
|---|-----------|------|------|
| 1 | `ui_mtr_map` | 720x1280 | MTR 월드맵 |
| 2 | `ui_aria_panel` | 360x200 | ARIA 시스템 UI |
| 3 | `fx_glitch_overlay` | 128x128 (타일링) | 글리치 오버레이 |

---

## 7. 타이틀 로고

```
pixel art game logo, "NEXT STOP" in bold pixel block letters,
"HK852" below in monospace technical font style,
MTR-inspired design with subway line color accents,
dash/em-dash separating the two parts,
neon glow effect on letters, dark navy background,
cyberpunk Hong Kong aesthetic, clean readable at small sizes,
retro game title screen style, 16-bit era aesthetic
```

| 텍스처 키 | 크기 | 설명 |
|-----------|------|------|
| `logo_main` | 512x256 | 메인 타이틀 로고 |
| `logo_small` | 256x128 | 축소 버전 (인게임 코너용) |

---

## 생성 우선순위

### Phase 1 — 즉시 필요 (코어 게임플레이)

| 카테고리 | 장수 | 우선순위 |
|----------|------|---------|
| 타이틀 로고 | 2 | ★★★ |
| 배경 (허브 + 1개 구역) | 2 | ★★★ |
| Tier 1 적 (6종) | 6 | ★★★ |
| 크리터 (5종) | 5 | ★★ |
| 정화 이펙트 | 2 | ★★ |
| **소계** | **17** | |

### Phase 2 — 캐릭터 & 스토리

| 카테고리 | 장수 | 우선순위 |
|----------|------|---------|
| 플레이어 캐릭터 (5인) | 5 | ★★ |
| Tier 2 적 (6종) | 6 | ★★ |
| 나머지 배경 (6개 구역) | 6 | ★★ |
| UI 요소 | 3 | ★ |
| **소계** | **20** | |

### Phase 3 — 보스 & 폴리시

| 카테고리 | 장수 | 우선순위 |
|----------|------|---------|
| 보스 (6종 x 2사이즈) | 12 | ★ |
| NPC 초상화 (5인) | 5 | ★ |
| 추가 이펙트 | TBD | ★ |
| **소계** | **17+** | |

### 총 예상: ~54장+

---

## SD 프롬프트 작성 주의사항

1. **텍스트/숫자 렌더링 금지** — AI가 텍스트를 어색하게 생성함. 간판 문구, UI 텍스트, 숫자 등 제거. 감정/분위기를 조명과 색감으로 표현
2. **투명 배경** — 캐릭터/적/크리터는 반드시 투명 배경. 후처리 배경 제거 필요할 수 있음
3. **일관성** — 같은 seed/스타일로 전체 세트 생성 권장. LoRA나 특정 체크포인트 고정
4. **보라색 = ARIA 오염** — 모든 기계/글리치 요소의 발광색은 보라 (#9b59b6). 통일 필수
5. **원소색 = 자연/정화** — 각 원소의 고유색은 자연 에너지. 보라와 대비
6. **실루엣 우선** — 48~72px로 축소 표시되므로 디테일보다 실루엣 판별성이 중요
7. **동물 원본은 홍콩 실제 동물** — 나방, 해파리, 쥐, 개미, 나비, 고양이 등 홍콩 서식종
