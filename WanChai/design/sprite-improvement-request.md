# v3 스프라이트 개선 요청 명세서

> 작성일: 2026-03-02
> 대상: v3 AI 생성 스프라이트 80장 중 문제 있는 리소스

---

## 1. bg_central.png — 완전 재제작 필요 (Critical)

**현재 상태**: 양복 입은 미니 캐릭터 8명이 대리석 바닥에 서있는 이미지
**의도**: 사이버펑크 홍콩 센트럴 지구의 3/4 탑다운 배경 (720x1280)

**문제점**:

- 사이버펑크 요소 전무 — 네온, 회로, 홀로그램 없음
- 캐릭터가 배경에 포함됨 — 배경은 순수 환경만 표현해야 함
- 대리석 바닥은 현대 오피스 느낌으로 세계관 불일치
- 3/4 탑다운 뷰가 아닌 정면 뷰

**재제작 프롬프트 가이드**:

```
Pixel art, 720x1280, 3/4 top-down view looking down at ground.
Cyberpunk Central district, Hong Kong. Gleaming corporate skyscraper canyon.
Ground: polished dark marble with embedded cyan circuit lines, holographic corporate logos projected on floor.
Left/right edges: towering glass-and-steel buildings with neon accent strips, digital billboards (abstract patterns only, NO text).
Center: wide open walkway with glowing floor grid, scattered light particles.
Color palette: dark blue-grey base, cyan and white accent lights, subtle gold highlights.
NO characters, NO people, NO text on signs.
```

---

## 2. bg_wanchai.png — 간판 텍스트 제거 필요 (High)

**현재 상태**: 전체적으로 양호한 완차이 거리 배경이나, AI가 생성한 깨진 한자 텍스트가 간판에 표시됨
**문제 텍스트**: "失面店", "象 酋店", "书码买古" 등 의미 없는 한자 조합

**문제점**:

- AI 생성 텍스트는 항상 부자연스러움 (Memory #12 규칙 위반)
- 한국/중국/일본 시장에서 이상한 한자로 인식될 위험

**수정 방법** (택 1):

1. **간판을 네온 패턴/기하학적 문양으로 교체** — 텍스트 대신 추상적 네온 심볼
2. **간판 영역을 어둡게 처리** — 글자 부분만 어두운 그라데이션으로 덮기
3. **재제작** — 동일 구도에서 텍스트 없이 재생성

**권장**: 옵션 1 (네온 패턴 교체) — 분위기 유지하면서 텍스트 문제 해결

---

## 3. bg_wongtaisin.png — 캐릭터 제거 + 사이버펑크 강화 (High)

**현재 상태**: 전통 사원 + 용 장식 + 행인 캐릭터 포함
**의도**: 사이버펑크화된 황대선 사원 구역의 3/4 탑다운 배경

**문제점**:

- 다수 캐릭터가 배경에 포함됨 — 게임 오브젝트와 혼동
- 사이버펑크 변형 부족 — 순수 전통 사원 느낌
- 용 장식이 화면 중앙을 차지 — 플레이 영역 가독성 저해

**재제작 프롬프트 가이드**:

```
Pixel art, 720x1280, 3/4 top-down view looking down at ground.
Cyberpunk Wong Tai Sin temple district. Ancient temple corrupted by ARIA network.
Ground: weathered red-gold temple tiles with glowing circuit patterns growing through cracks, incense smoke mixed with data particles.
Left/right edges: temple pillars wrapped in fiber optic cables, neon prayer strips, holographic offering flames.
Center: wide open courtyard with cracked tiles, faint dragon pattern embedded in floor (subtle, not 3D).
Color palette: deep red and gold base, magenta and orange neon accents, cyan circuit highlights.
NO characters, NO people, NO text.
```

---

## 4. bg_lantau.png — 사이버펑크 강화 필요 (Medium)

**현재 상태**: 불상 + 자연 경로 + 나비/꽃 — 동화풍
**의도**: ARIA에 침식된 란타우 섬 자연+테크 융합 배경

**문제점**:

- 사이버펑크 요소 거의 없음 — 자연 풍경 그대로
- 정면 뷰 (불상을 정면에서 봄) — 3/4 탑다운 뷰 필요
- 불상이 화면 상단 중앙에 크게 차지 — 플레이 영역 침범
- 색감이 밝고 동화적 — 게임 전체 다크 사이버펑크 톤과 불일치

**재제작 프롬프트 가이드**:

```
Pixel art, 720x1280, 3/4 top-down view looking down at ground.
Cyberpunk Lantau Island. Nature reclaimed by ARIA network, tech-nature fusion.
Ground: overgrown forest path with bioluminescent moss, tree roots intertwined with fiber optic cables, puddles reflecting neon.
Left/right edges: massive ancient trees with circuit bark, hanging vines that glow cyan, mushrooms emitting data particles.
Center: dirt and stone path with scattered fallen leaves and circuit fragments.
Color palette: deep forest green-black base, bioluminescent cyan and green accents, subtle purple ARIA corruption.
NO characters, NO people, NO text, NO statues blocking center.
```

---

## 5. bg_shamshuipo.png — 간판 텍스트 확인 (Low)

**현재 상태**: 전체적으로 양호. 균열 + 네온 + 사이버펑크 폐허.
**경미한 문제**: 좌우 간판에 미세한 AI 생성 텍스트가 보임

**수정 방법**: 간판의 텍스트를 추상적 네온 패턴으로 교체

---

## 6. opt_t2_lion.png — 구도 조정 필요 (Medium)

**현재 상태**: 사자형 사이버펑크 적이지만, 스프라이트 콘텐츠가 한쪽으로 치우치고 빈 투명 영역이 넓음
**의도**: 72x72 캔버스 중앙에 균형 있게 배치된 T2 적

**문제점**:

- 콘텐츠가 캔버스 중심에서 벗어남
- 빈 투명 영역이 과도 → 게임 내 히트박스 대비 시각적 크기 불일치

**수정 방법**: 스프라이트를 캔버스 중앙에 재배치하고, 여백 최소화

---

## 공통 재제작 규칙

1. **NO text/characters in backgrounds** — 텍스트, 숫자, 캐릭터 절대 포함 금지
2. **3/4 top-down view** — 모든 배경은 위에서 내려다보는 시점
3. **Center open** — 중앙은 열린 플레이 영역, 구조물은 좌우 가장자리에만
4. **Cyberpunk aesthetic** — 네온, 회로, 홀로그램, 데이터 파티클 필수
5. **Dark base palette** — 어두운 기조에 네온 하이라이트
6. **720x1280 portrait** — 9:16 비율 유지
7. **Pixel art style** — 16~32px tile 기반 일관성
