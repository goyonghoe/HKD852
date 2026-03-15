# CraftPix 그래픽 리소스 인벤토리

> WanChai (NeonSurvivor) 프로젝트에서 사용하는 CraftPix 에셋 전수 조사 문서
>
> 최종 업데이트: 2026-03-08 (폴더 재구성 완료)
> 원본 경로: `raw-assets/craftpix-cyberpunk/`
> 게임 사용 경로: `public/assets/sprites/`
> 스프라이트 키 정의: `src/config/sprite-keys.ts`

---

## 1. 개요

| 항목 | 수치 |
|------|------|
| 총 카테고리 | **12개** |
| 총 CraftPix 팩 수 | **157개** |
| 총 에셋 파일 수 | **14,975개** |
| 현재 배포 중인 스프라이트 (`sprites/`) | **108개** |
| `sprite-keys.ts` 정의 키 수 | **86개** |
| CraftPix 소스 매핑된 키 수 | **0개** |
| 미사용 CraftPix 에셋 비율 | **100%** |

**핵심 요약**: 2026-03-08 기준으로 157개 팩(14,975파일)을 12개 카테고리로 재구성 완료. PSD/PDF 등 불필요 파일 삭제, 중복 제거 완료. 현재 게임에 배포된 108개 스프라이트는 전량 AI 생성 또는 프로시저럴 텍스처이며, CraftPix 에셋은 아직 게임에 매핑되지 않은 상태이다.

### 정리 이력

| 날짜 | 작업 |
|------|------|
| 2026-03-08 | 12개 카테고리 폴더 재구성, 중복 제거, PSD/PDF 삭제 |

### 카테고리별 요약 테이블

| 카테고리 | 팩 수 | 파일 수 | 비율 |
|----------|-------|---------|------|
| icons | 46 | 5,092 | 34.0% |
| tilesets | 21 | 3,244 | 21.7% |
| constructors | 8 | 1,475 | 9.8% |
| ui | 4 | 1,611 | 10.8% |
| characters | 18 | 875 | 5.8% |
| decorations | 11 | 799 | 5.3% |
| enemies | 19 | 692 | 4.6% |
| bosses | 15 | 516 | 3.4% |
| effects | 5 | 234 | 1.6% |
| audio | 5 | 219 | 1.5% |
| vehicles | 4 | 133 | 0.9% |
| backgrounds | 1 | 85 | 0.6% |
| **합계** | **157** | **14,975** | **100%** |

---

## 2. 카테고리별 상세

### 2.1 characters (18팩, 875파일)

플레이어, NPC, 동료 캐릭터 스프라이트. Idle/Walk/Run/Attack/Death 등 풀 애니메이션 포함.

| # | 팩 이름 | 주요 내용 |
|---|---------|-----------|
| 1 | `craftpix-net-142357-prison-wardens-pixel-art-character-pack` | 교도관 캐릭터 |
| 2 | `craftpix-net-144661-free-halloween-character-pixel-art-pack` | 할로윈 캐릭터 |
| 3 | `craftpix-net-199956-free-sci-fi-antagonists-pixel-character-pack` | SF 적대자 |
| 4 | `craftpix-net-283889-cyberpunk-pixel-bar-cafe-npc-asset-pack` | 바/카페 NPC |
| 5 | `craftpix-net-333917-pet-companions-pixel-sprite-pack-for-cyberpunk-game` | 펫 동료 |
| 6 | `craftpix-net-456469-pixel-fighters-asset-pack-for-cyberpunk` | 전투원 |
| 7 | `craftpix-net-481510-free-townspeople-cyberpunk-pixel-art` | 시민 NPC |
| 8 | `craftpix-net-507212-homeless-character-pixel-art-pack` | 노숙자 캐릭터 |
| 9 | `craftpix-net-516420-trader-cyberpunk-pixel-art-pack` | 거래상 NPC |
| 10 | `craftpix-net-550902-police-cyberpunk-characters-pixel-art` | 경찰 캐릭터 |
| 11 | `craftpix-net-598640-free-characters-with-melee-attack-pixel-art` | 근접 공격 캐릭터 |
| 12 | `craftpix-net-626011-free-guns-pack-2-for-main-characters-pixel-art` | 메인 캐릭터+총기 Pack 2 |
| 13 | `craftpix-net-653752-workers-and-drones-pixel-art-character-pack` | 노동자+드론 |
| 14 | `craftpix-net-730561-free-guns-for-cyberpunk-characters-pixel-art` | 메인 캐릭터+총기 Pack 1 |
| 15 | `craftpix-net-750515-cyberpunk-swimming-characters-pixel-art` | 수영 캐릭터 |
| 16 | `craftpix-net-796772-free-extra-animations-for-cyberpunk-characters` | 추가 애니메이션 |
| 17 | `craftpix-net-817509-beach-crowd-pixel-asset-pack-for-platformer` | 해변 군중 |
| 18 | `craftpix-net-950267-prisoner-character-sprites-pixel-art` | 수감자 |

**활용 포인트**: Pack 1/2 (730561, 626011)의 Biker/Punk/Cyborg 3종이 플레이어 캐릭터 핵심 소스. 나머지 16팩은 NPC/환경 캐릭터로 활용 가능.

### 2.2 enemies (19팩, 692파일)

다양한 로케이션별 적 캐릭터. Idle/Walk/Attack/Hurt/Death 풀 애니메이션 포함.

| # | 팩 이름 | 로케이션/테마 |
|---|---------|---------------|
| 1 | `craftpix-net-223841-free-city-enemies-pixel-art-sprite-sheets` | 도시 |
| 2 | `craftpix-net-255422-enemies-chinese-street-pixel-art` | 차이나 스트리트 |
| 3 | `craftpix-net-381725-power-station-enemy-sprite-sheets` | 발전소 |
| 4 | `craftpix-net-386974-bar-street-enemies-pixel-art` | 바 거리 |
| 5 | `craftpix-net-401611-pirate-bay-enemies-for-cyberpunk-pixel-asset-pack` | 해적 만 |
| 6 | `craftpix-net-415058-monsters-from-the-exclusion-zone-pixel-art` | 금지구역 |
| 7 | `craftpix-net-446105-business-enemies-pixel-art` | 비즈니스 지구 |
| 8 | `craftpix-net-488809-basement-enemies-pixel-art-sprite-pack` | 지하실 |
| 9 | `craftpix-net-527764-pixel-art-enemy-character-pack` | 범용 적 |
| 10 | `craftpix-net-533366-cyberpunk-desert-bandits-pixel-art` | 사막 산적 |
| 11 | `craftpix-net-545114-free-pixel-enemies-character-pack-for-seaport-location` | 항구 |
| 12 | `craftpix-net-562606-snow-city-enemies-pixel-art-sprite-pack` | 눈도시 |
| 13 | `craftpix-net-583506-spaceliner-enemies-2d-pixel-art-sci-fi-sprite-pack` | 우주선 |
| 14 | `craftpix-net-583992-sewerage-character-enemies-pixel-art` | 하수도 |
| 15 | `craftpix-net-601813-industrial-zone-enemies-pixel-art` | 산업지대 |
| 16 | `craftpix-net-667785-lab-enemies-pixel-art` | 연구소 |
| 17 | `craftpix-net-772183-enemies-from-exclusion-zone-pixel-art-sprite-pack` | 금지구역 2 |
| 18 | `craftpix-net-823313-residential-area-enemies-pixel-art-pack` | 주거지역 |
| 19 | `craftpix-net-892821-cyberpunk-enemies-asset-pixel-pack-for-beach-location` | 해변 |

**활용 포인트**: 로케이션별 19종 적 팩은 7챕터 각각에 고유 적 디자인 배정 가능. 현재 T1 적 6종(446105 기반)에서 대폭 확장 가능.

### 2.3 bosses (15팩, 516파일)

로케이션별 대형 보스 캐릭터. 다단계 Attack/Death/Hurt/Idle/Sneer/Walk 풀 애니메이션.

| # | 팩 이름 | 로케이션/테마 |
|---|---------|---------------|
| 1 | `craftpix-net-261169-free-bosses-pixel-art-sprite-sheet-pack` | 범용 보스 |
| 2 | `craftpix-net-355913-bosses-chinese-street-pixel-art` | 차이나 스트리트 |
| 3 | `craftpix-net-384116-bar-street-bosses-pixel-art` | 바 거리 |
| 4 | `craftpix-net-406978-sewerage-character-bosses-pixel-art` | 하수도 |
| 5 | `craftpix-net-432685-sea-port-bosses-pixel-sprite-pack-for-cyberpunk-game` | 항구 |
| 6 | `craftpix-net-454345-residential-area-bosses-pixel-art` | 주거지역 |
| 7 | `craftpix-net-536426-industrial-zone-boss-pixel-art-assets` | 산업지대 |
| 8 | `craftpix-net-541373-lab-bosses-pixel-art` | 연구소 |
| 9 | `craftpix-net-584459-basement-bosses-pixel-art-sprite-pack` | 지하실 |
| 10 | `craftpix-net-644444-snow-city-bosses-pixel-art-sprite-pack` | 눈도시 |
| 11 | `craftpix-net-657819-desert-bosses-pixel-art-sprite-sheet-pack` | 사막 |
| 12 | `craftpix-net-713504-various-bosses-pixel-art-pack` | 다양한 보스 |
| 13 | `craftpix-net-787769-prison-bosses-pixel-art-sprite-pack` | 감옥 |
| 14 | `craftpix-net-899060-cyberpunk-bosses-sprites-pixel-pack-for-beach-location` | 해변 |
| 15 | `craftpix-net-999713-cyberpunk-pixel-art-bosses-pack` | 사이버펑크 범용 |

**활용 포인트**: 기존 1팩(999713, 보스 3종)에서 15팩으로 대폭 확장. 7챕터 보스 7종을 완전히 커버하고도 여유 보스 디자인 확보 가능.

### 2.4 tilesets (21팩, 3,244파일)

맵/레벨 구성용 타일셋. 바닥, 벽, 플랫폼, 배경, 오브젝트 포함.

| # | 팩 이름 | 로케이션/테마 |
|---|---------|---------------|
| 1 | `craftpix-net-104941-lab-game-tileset-pixel-art` | 연구소 |
| 2 | `craftpix-net-111332-free-factory-pixel-art-32x32-tileset-for-cyberpunk` | 공장 |
| 3 | `craftpix-net-115897-free-exclusion-zone-tileset-pixel-art` | 금지구역 |
| 4 | `craftpix-net-278498-bar-street-tileset-pixel-art-pack` | 바 거리 |
| 5 | `craftpix-net-314143-free-industrial-zone-tileset-pixel-art` | 산업지대 |
| 6 | `craftpix-net-548066-spaceliner-32x32-pixel-tileset-for-sci-fi` | 우주선 |
| 7 | `craftpix-net-581773-sewerage-platformer-tileset-pixel-art` | 하수도 |
| 8 | `craftpix-net-622073-business-center-tileset-pixel-art` | 비즈니스센터 |
| 9 | `craftpix-net-654794-dump-2d-tileset-pixel-art` | 쓰레기장 |
| 10 | `craftpix-net-668579-desert-cyberpunk-tileset-pixel-art` | 사막 |
| 11 | `craftpix-net-678553-residential-area-tileset-pixel-art` | 주거지역 |
| 12 | `craftpix-net-695574-snow-city-tileset-pixel-art` | 눈도시 |
| 13 | `craftpix-net-716407-chinese-street-tileset-pixel-art` | 차이나 스트리트 |
| 14 | `craftpix-net-822326-prison-tileset-pixel-art-assets` | 감옥 |
| 15 | `craftpix-net-827066-pixel-art-bar-cafe-interior-tileset-for-cyberpunk` | 바/카페 인테리어 |
| 16 | `craftpix-net-846754-free-green-zone-tileset-pixel-art` | 녹지 |
| 17 | `craftpix-net-861263-free-pirate-bay-tileset-pixel-art-for-cyberpunk` | 해적 만 |
| 18 | `craftpix-net-869640-beach-pixel-art-tileset-for-cyberpunk-topic` | 해변 |
| 19 | `craftpix-net-898135-basement-tileset-pixel-art` | 지하실 |
| 20 | `craftpix-net-924041-power-station-free-tileset-pixel-art` | 발전소 |
| 21 | `craftpix-net-995156-ghetto-tileset-pixel-art` | 게토 |

**활용 포인트**: Hill Defense 리디자인 시 지형/장애물/배리어 타일맵의 핵심 소스. 21개 로케이션 테마로 챕터별 고유 환경 구성 가능.

### 2.5 backgrounds (1팩, 85파일)

스크롤링 패럴랙스 도시 배경.

| # | 팩 이름 | 주요 내용 |
|---|---------|-----------|
| 1 | `craftpix-net-832833-free-scrolling-city-backgrounds-pixel-art` | 8종 도시 배경, Day/Night 5레이어 패럴랙스 |

**활용 포인트**: 8종 배경이 게임의 8챕터에 정확히 대응. 5레이어 패럴랙스 스크롤 구현 가능.

### 2.6 icons (46팩, 5,092파일)

32x32 픽셀아트 아이콘. 무기, 방어구, 스킬, 아이템, 자원 등 다양한 카테고리.

| # | 팩 이름 | 아이콘 카테고리 |
|---|---------|----------------|
| 1 | `craftpix-net-101350-drone-32x32-pixel-art-icons` | 드론 |
| 2 | `craftpix-net-114074-the-cyberpunk-32x32-pixel-rank-icons` | 랭크 |
| 3 | `craftpix-net-127812-free-clothing-32x32-pixel-icons` | 의류 |
| 4 | `craftpix-net-138748-the-cyberpunk-gloves-and-cloaks-pixel-icon-set` | 장갑/망토 |
| 5 | `craftpix-net-177646-free-guns-icon-32x32-pixel-pack` | 총기 |
| 6 | `craftpix-net-184808-free-cyberpunk-resource-pixel-art-32x32-icons` | 자원 |
| 7 | `craftpix-net-188212-cyberpunk-armor-icon-game-asset-pixel-pack` | 방어구 |
| 8 | `craftpix-net-209813-jewelry-32x32-pixel-icons-for-cyberpunk-game` | 보석류 |
| 9 | `craftpix-net-223231-machine-parts-32x32-pixel-art-icon-pack` | 기계 부품 |
| 10 | `craftpix-net-259037-fruit-and-vegetables-32x32-icons-pixel-art` | 과일/채소 |
| 11 | `craftpix-net-259753-cyberpunk-skills-pixel-art-32x32-icon-pack` | 스킬 |
| 12 | `craftpix-net-286587-cyberpunk-armor-32x32-icons-pixel-art` | 방어구 2 |
| 13 | `craftpix-net-288077-free-protective-suit-against-radiation-and-things-pixel-art-icons` | 방호복 |
| 14 | `craftpix-net-293029-32x32-resource-icons-pixel-art-for-cyberpunk` | 자원 2 |
| 15 | `craftpix-net-319553-food-pixelated-icons-32x32-pixel-art` | 음식 |
| 16 | `craftpix-net-321799-street-snacks-pixel-art-32x32-icon-pack` | 길거리 간식 |
| 17 | `craftpix-net-326843-cyberpunk-rpg-armor-pixel-icons-set` | RPG 방어구 |
| 18 | `craftpix-net-348285-clothing-32x32-pixel-art-icons-for-cyberpunk` | 의류 2 |
| 19 | `craftpix-net-360771-medicine-and-thematic-things-pixel-art-32x32-icon-pack` | 의약품 |
| 20 | `craftpix-net-362188-free-melee-weapon-pixel-icons-for-cyberpunk` | 근접 무기 |
| 21 | `craftpix-net-364659-cyberpunk-tool-32x32-icons-pixel-art` | 도구 |
| 22 | `craftpix-net-415479-artifact-32x32-icons-pixel-art-for-cyberpunk` | 아티팩트 |
| 23 | `craftpix-net-434981-cyberpunk-artefact-icons-pixel-art` | 아티팩트 2 |
| 24 | `craftpix-net-477421-cyberpunk-gadgets-pixel-art-32x32-icon-pack` | 가젯 |
| 25 | `craftpix-net-501950-street-food-for-cyberpunk-pixel-art-32x32-icons` | 길거리 음식 |
| 26 | `craftpix-net-508962-vegetation-icons-32x32-pixel-art` | 식물 |
| 27 | `craftpix-net-558957-household-stuff-32x32-icons-pixel-art` | 가정용품 |
| 28 | `craftpix-net-572384-resources-for-cyberpunk-topic-pixel-art-32x32-icon-pack` | 자원 3 |
| 29 | `craftpix-net-574978-pixel-armor-32x32-icons-for-cyberpunk-game` | 방어구 3 |
| 30 | `craftpix-net-588685-cyberpunk-firearm-pixel-art-32x32-icons` | 총기 2 |
| 31 | `craftpix-net-615713-cyber-implant-32x32-icons-pixel-art` | 사이버 임플란트 |
| 32 | `craftpix-net-620021-32x32-energy-items-pixel-art-for-cyberpunk` | 에너지 아이템 |
| 33 | `craftpix-net-628761-free-mining-pixel-32x32-icons` | 채굴 |
| 34 | `craftpix-net-711410-skill-icons-for-pixel-art-cyberpunk-platformer` | 스킬 2 |
| 35 | `craftpix-net-715780-pocket-things-pixel-art-32x32-icon-pack` | 소지품 |
| 36 | `craftpix-net-741764-free-skill-32x32-icons-for-cyberpunk-game` | 스킬 3 |
| 37 | `craftpix-net-776585-melee-weapon-32x32-icons` | 근접 무기 2 |
| 38 | `craftpix-net-791436-cyberpunk-weapons-and-ammo-pixel-art-32x32-icon-pack` | 무기/탄약 |
| 39 | `craftpix-net-805026-implants-for-cyberpunk-32x32-pixel-icons` | 임플란트 2 |
| 40 | `craftpix-net-815355-40-skill-icons-for-cyberpunk-pixel-game` | 스킬 4 |
| 41 | `craftpix-net-834374-jewelry-32x32-pixel-art-icons` | 보석류 2 |
| 42 | `craftpix-net-856137-headphones-and-glasses-pixel-icon-set` | 헤드폰/안경 |
| 43 | `craftpix-net-873079-clothing-pixel-icons-for-cyberpunk-game` | 의류 3 |
| 44 | `craftpix-net-884144-cyberpunk-clothes-32x32-pixel-art-icon-pack` | 의류 4 |
| 45 | `craftpix-net-917923-cyberpunk-skills-pixelated-icon-pack` | 스킬 5 |
| 46 | `craftpix-net-960481-genetics-pixel-art-icon-32x32-pack` | 유전자 |

**활용 포인트**: 5,092개 아이콘은 무기/패시브/상점/아이템 UI 전면 리디자인 시 핵심 소스. 특히 스킬 아이콘(5팩), 총기 아이콘(2팩), 임플란트(2팩)가 게임 시스템에 직접 대응.

### 2.7 effects (5팩, 234파일)

에너지, 불, 폭발, 오버레이 등 시각 이펙트.

| # | 팩 이름 | 이펙트 유형 |
|---|---------|-------------|
| 1 | `craftpix-net-168409-energy-sources-for-cyberpunk-pixel-platformers` | 에너지 소스 |
| 2 | `craftpix-net-237444-fire-pixel-art-animation-sprites` | 불꽃 애니메이션 |
| 3 | `craftpix-net-724953-bombs-and-explosions-pixel-art-set` | 폭탄/폭발 |
| 4 | `craftpix-net-901381-free-cyberpunk-overlay-effects-for-platformer-game` | 오버레이 |
| 5 | `craftpix-net-965938-free-effects-for-platformer-pixel-art-pack` | 플랫포머 이펙트 |

**활용 포인트**: 폭발(724953)은 투사체/VFX 교체 핵심. 오버레이(901381)는 글리치/네온 화면 효과. 불꽃/에너지는 스킬 이펙트 활용 가능.

### 2.8 constructors (8팩, 1,475파일)

모듈형 조립 키트. 총기, 차량, 자전거, 그래피티, 다리 등.

| # | 팩 이름 | 구성 키트 |
|---|---------|-----------|
| 1 | `craftpix-net-113236-pixel-art-underwater-submarine-constructor-pack` | 잠수함 |
| 2 | `craftpix-net-312671-free-truck-constructor-pixel-art` | 트럭 |
| 3 | `craftpix-net-325145-bike-constructor-pixel-art` | 자전거 |
| 4 | `craftpix-net-461336-gun-constructor-pixel-art` | 총기 |
| 5 | `craftpix-net-609014-car-constructor-pixel-art` | 자동차 |
| 6 | `craftpix-net-613851-graffiti-constructor-pixel-art-pack-2` | 그래피티 2 |
| 7 | `craftpix-net-634263-bridge-constructor-tileset-pixel-art` | 다리 |
| 8 | `craftpix-net-920510-free-graffiti-constructor-pixel-art` | 그래피티 1 |

**활용 포인트**: 총기 컨스트럭터(461336)는 무기 아이콘+투사체 리디자인 핵심. 차량/자전거는 배경 장식 또는 장애물. 그래피티는 환경 디테일.

### 2.9 ui (4팩, 1,611파일)

게임 GUI, 폰트, 소셜미디어 아이콘.

| # | 팩 이름 | UI 유형 |
|---|---------|---------|
| 1 | `craftpix-net-567068-free-social-media-icons-pixel-art` | 소셜미디어 아이콘 |
| 2 | `craftpix-net-610822-cyberpunk-pixel-art-font-effects` | 폰트 이펙트 |
| 3 | `craftpix-net-618358-cyber-intrusion-free-gui-pixel-art-pack` | GUI (침입 테마) |
| 4 | `craftpix-net-894687-free-gui-for-cyberpunk-pixel-art` | 사이버펑크 GUI |

**활용 포인트**: GUI 팩 2종(618358, 894687)은 메뉴/HUD/인벤토리 UI 리디자인에 활용 가능. 폰트 이펙트(610822)는 타이틀/데미지 텍스트.

### 2.10 audio (5팩, 219파일)

BGM(MP3) + SFX(WAV). 사이버펑크 테마 음악 및 효과음.

| # | 팩 이름 | 테마 | 음악 | SFX |
|---|---------|------|------|-----|
| 1 | `craftpix-net-444477-*-pack-6` | Chinese Street | 5곡 | ~35개 |
| 2 | `craftpix-net-608340-*-futuristic` | Night City | 5곡 | ~35개 |
| 3 | `craftpix-net-648698-*-pack-1` | Industrial/Lab | 5곡 | ~34개 |
| 4 | `craftpix-net-682092-*-pack-5` | Snow City | 5곡 | ~35개 |
| 5 | `craftpix-net-936590-*-pack-3` | Sewerage | 5곡 | ~35개 |

**활용 포인트**: 25곡 BGM + ~174개 SFX. Chinese Street(444477)가 홍콩 배경에 완벽 매칭. 챕터별 BGM 매핑 + 전투/UI SFX 전면 교체 가능.

### 2.11 decorations (11팩, 799파일)

환경 장식물. 광고판, 시장, 간판, 나무, 문/포탈 등.

| # | 팩 이름 | 장식 유형 |
|---|---------|-----------|
| 1 | `craftpix-net-105241-cyberpunk-farm-pixel-art-asset-pack` | 농장 |
| 2 | `craftpix-net-153816-cyberpunk-market-street-pixel-art` | 시장 거리 |
| 3 | `craftpix-net-154211-animated-ads-cyberpunk-pixel-art` | 애니메이션 광고 |
| 4 | `craftpix-net-318273-doors-and-portals-pixel-art-asset-pack` | 문/포탈 |
| 5 | `craftpix-net-321524-city-signs-and-barriers-pixel-art` | 도시 간판/배리어 |
| 6 | `craftpix-net-608215-free-billboards-and-advertising-pixel-art` | 빌보드/광고 |
| 7 | `craftpix-net-610575-free-street-animal-pixel-art-asset-pack` | 길거리 동물 |
| 8 | `craftpix-net-734199-free-halloween-decorations-characters-and-items-pixel-art` | 할로윈 장식 |
| 9 | `craftpix-net-894350-trees-and-bushes-pixel-art-for-platformer` | 나무/덤불 |
| 10 | `craftpix-net-899543-animated-cyberpunk-ads-pixel-art-pack-2` | 애니메이션 광고 2 |
| 11 | `craftpix-net-912307-pixel-art-market-location-for-cyberpunk` | 시장 로케이션 |

**활용 포인트**: 시장(153816, 912307)과 광고(154211, 899543)는 사이버펑크 분위기 강화. 문/포탈(318273)은 스테이지 진입/탈출 연출. 배리어(321524)는 Hill Defense 엄폐물.

### 2.12 vehicles (4팩, 133파일)

전투 메카, 경찰 차량, 드론, 로봇.

| # | 팩 이름 | 차량 유형 |
|---|---------|-----------|
| 1 | `craftpix-net-669945-battle-mecha-sprites-pixel-art-pack` | 전투 메카 |
| 2 | `craftpix-net-687978-police-transport-pixel-art-assets` | 경찰 차량 |
| 3 | `craftpix-net-902201-free-drones-pack-pixel-art` | 드론 |
| 4 | `craftpix-net-909754-robots-pixel-art-sprite-sheet-pack` | 로봇 |

**활용 포인트**: 드론(902201)은 T2 적/보스 미니언. 전투 메카(669945)는 미니보스 또는 배경 연출. 로봇(909754)은 적/NPC 활용 가능.

---

## 3. 게임 적용 현황

### 3.1 현재 배포 스프라이트 소스 분석

`public/assets/sprites/` 의 108개 파일 소스:

| 소스 | 파일 수 | 해당 키 |
|------|---------|---------|
| AI 생성 이미지 | ~85 | 보스, 캐릭터, 크리터, 배경, 로고, 무기 아이콘, UI, FX |
| 프로시저럴 텍스처 (TextureFactory) | ~23 | 레거시 적, 일부 투사체, 파티클, 패시브/상점 아이콘 |
| CraftPix 매핑 | **0** | 없음 |

### 3.2 sprite-keys.ts 키 카테고리 (86키)

| 카테고리 | 키 수 | 현재 소스 | CraftPix 대응 |
|----------|-------|-----------|---------------|
| 플레이어/캐릭터 | 11 | AI 생성 | characters 18팩 |
| T1 적 | 6 | AI 생성 | enemies 19팩 |
| T2 적 | 6 | AI 생성 | vehicles/enemies |
| 레거시 적 | 8 | AI 생성 | enemies |
| 보스 (일반+대형) | 17 | AI 생성 | bosses 15팩 |
| 투사체 | 9 | AI/프로시저럴 | constructors (총기) |
| 파티클 | 3 | 프로시저럴 | 프로시저럴 유지 |
| 크리터 | 12 | AI 생성 | characters (펫 팩) |
| 배경 | 8 | AI 생성 | backgrounds 1팩 |
| 이펙트 | 7 | AI 생성 | effects 5팩 |
| UI | 6 | AI 생성 | ui 4팩 |
| 무기 아이콘 | 10 | AI 생성 | icons 46팩 |
| 패시브/상점 아이콘 | 12 | AI 생성 | icons |
| 로고 | 2 | AI 생성 | 자체 디자인 |

### 3.3 프로시저럴 폴백 (PNG 미배포, 9키)

| 스프라이트 키 | 카테고리 | 상태 |
|--------------|----------|------|
| `player` | 캐릭터 | 의도적 (캐릭터별 ingame으로 대체) |
| `boss_hex/diamond/rect` | 보스 레거시 | 의도적 (프로시저럴 폴백) |
| `enemy_shooter/teleporter` | 적 레거시 | 교체 가능 |
| `particle_square/glow/purify` | 파티클 | 의도적 (1px 프로시저럴) |

---

## 4. 미사용 리소스 요약

현재 CraftPix 에셋 14,975개 중 **게임에 매핑된 것은 0개**이다. 전량 미사용.

### 카테고리별 활용 가능 에셋

| 카테고리 | 보유 | 활용 우선순위 | 활용 방안 |
|----------|------|---------------|-----------|
| **bosses** (15팩, 516) | 전량 미사용 | P0 | 보스 7종 풀 애니메이션 교체 |
| **enemies** (19팩, 692) | 전량 미사용 | P0 | 챕터별 고유 적 디자인 (T1~T3) |
| **backgrounds** (1팩, 85) | 전량 미사용 | P0 | 8챕터 배경 패럴랙스 교체 |
| **characters** (18팩, 875) | 전량 미사용 | P1 | 플레이어 캐릭터 + NPC |
| **effects** (5팩, 234) | 전량 미사용 | P1 | 전투/스킬 VFX |
| **audio** (5팩, 219) | 전량 미사용 | P1 | BGM 25곡 + SFX 174개 |
| **icons** (46팩, 5,092) | 전량 미사용 | P1 | 무기/패시브/아이템 아이콘 |
| **tilesets** (21팩, 3,244) | 전량 미사용 | P2 | Hill Defense 지형 타일맵 |
| **constructors** (8팩, 1,475) | 전량 미사용 | P2 | 총기 파츠, 차량 장식 |
| **ui** (4팩, 1,611) | 전량 미사용 | P2 | GUI/HUD 리디자인 |
| **decorations** (11팩, 799) | 전량 미사용 | P3 | 환경 장식, 엄폐물 |
| **vehicles** (4팩, 133) | 전량 미사용 | P3 | 미니보스, 배경 연출 |

---

## 5. Hill Defense 리디자인 활용 계획

> NeonSurvivor(세로형 오토슈터)에서 Hill Defense(타워 디펜스+슈터 하이브리드)로 피봇 시 에셋 활용 계획

### 5.1 확장된 에셋 풀 (기존 18팩 → 157팩)

폴더 재구성으로 확보된 157팩 에셋을 활용하면 Hill Defense 리디자인의 비주얼 품질을 대폭 향상시킬 수 있다.

| 게임 요소 | 활용 소스 (카테고리) | 활용 방법 |
|-----------|---------------------|-----------|
| **스테이지 배경** | backgrounds (8종) + tilesets (21종) | Day/Night 패럴랙스 + 타일맵 지형 |
| **방어 거점 타일** | tilesets (비즈니스센터, 산업지대, 감옥 등) | 챕터별 고유 방어 타일 |
| **적 웨이브** | enemies (19팩) | 챕터별 고유 적 5~6종 (총 100종+) |
| **보스** | bosses (15팩) | 7챕터 보스 + 미니보스 + 히든보스 |
| **플레이어 캐릭터** | characters (18팩) | Biker/Punk/Cyborg + NPC/상인 |
| **무기/투사체** | constructors (총기) + effects (폭발) | 조립식 총기 + 폭발 VFX |
| **UI/아이콘** | icons (46팩, 5,092개) + ui (4팩) | 무기/스킬/아이템 아이콘 전면 교체 |
| **환경 디테일** | decorations (11팩) + constructors (그래피티, 차량) | 광고판, 시장, 배리어, 엄폐물 |
| **BGM/SFX** | audio (5팩, 25곡+174 SFX) | 챕터별 BGM + 전투/UI SFX |

### 5.2 구현 로드맵

```
Phase 1 (즉시): 배경 + 적 교체
├── backgrounds 8종 → bg_wanchai~lantau 매핑
├── enemies 중 7팩 선별 → 챕터별 적 5~6종 배정
├── bosses 중 7팩 선별 → 챕터별 보스 1종 배정
└── Day/Night 패럴랙스 스크롤 구현

Phase 2 (1주): 캐릭터 + 무기
├── characters → 플레이어 캐릭터 Walk/Run/Attack 애니메이션
├── constructors (총기) → 투사체 + 무기 아이콘 교체
├── effects → 폭발/에너지 VFX 교체
└── icons → 무기/패시브 아이콘 48x48 리사이즈 매핑

Phase 3 (1주): 타일맵 + 환경
├── tilesets → Hill Defense 지형/장애물/배리어 타일맵
├── decorations → 광고판, 시장, 배리어 배치
├── vehicles → 배경 장식/미니보스
└── ui → HUD/메뉴 GUI 리디자인

Phase 4 (1주): 오디오 통합
├── audio BGM → 챕터별 배경음악 매핑
├── audio SFX → 무기/피격/환경 효과음 교체
└── 프로시저럴 RetroAudio → CraftPix 오디오 전환
```

### 5.3 커버리지 예상

| 카테고리 | 필요 | CraftPix 커버 | 추가 제작 | 커버율 |
|----------|------|---------------|-----------|--------|
| 배경 (8종) | 8 | 8 (backgrounds) | 0 | 100% |
| T1~T3 적 (20+종) | 20 | 100+ (enemies 19팩) | 0 | 100% |
| 보스 (7+종) | 7 | 30+ (bosses 15팩) | 0 | 100% |
| 캐릭터 (5종) | 5 | 50+ (characters 18팩) | 0 | 100% |
| 투사체 (9종) | 9 | 46+ (constructors) | 0 | 100% |
| 폭발 VFX | 5 | 50+ (effects) | 0 | 100% |
| 무기 아이콘 (10종) | 10 | 200+ (icons) | 0 | 100% |
| 타일맵 (챕터별) | 7세트 | 21세트 (tilesets) | 0 | 100% |
| BGM (10종+) | 10 | 25 (audio) | 0 | 100% |
| SFX (20종+) | 20 | 174 (audio) | 0 | 100% |
| 크리터 (12종) | 12 | 6+ (characters 펫 팩) | 6 | 50% |
| UI/로고 (20종) | 20 | 1,600+ (ui) | 2 (로고) | 90% |
| **전체** | **~133** | **~2,300+** | **~8** | **~94%** |

---

## 부록: 폴더 구조 참조

```
WanChai/
├── raw-assets/craftpix-cyberpunk/
│   ├── characters/     (18팩, 875파일)   # 플레이어, NPC, 동료 캐릭터
│   ├── enemies/        (19팩, 692파일)   # 로케이션별 적 캐릭터
│   ├── bosses/         (15팩, 516파일)   # 로케이션별 대형 보스
│   ├── tilesets/       (21팩, 3,244파일) # 맵/레벨 타일셋
│   ├── backgrounds/    (1팩, 85파일)     # 스크롤링 패럴랙스 배경
│   ├── icons/          (46팩, 5,092파일) # 32x32 아이콘
│   ├── effects/        (5팩, 234파일)    # 시각 이펙트
│   ├── constructors/   (8팩, 1,475파일)  # 모듈형 조립 키트
│   ├── ui/             (4팩, 1,611파일)  # GUI, 폰트
│   ├── audio/          (5팩, 219파일)    # BGM + SFX
│   ├── decorations/    (11팩, 799파일)   # 환경 장식물
│   └── vehicles/       (4팩, 133파일)    # 메카, 차량, 드론, 로봇
├── public/assets/sprites/                 # 현재 배포 스프라이트 (108개)
└── src/config/sprite-keys.ts              # 스프라이트 키 정의 (86개)
```
