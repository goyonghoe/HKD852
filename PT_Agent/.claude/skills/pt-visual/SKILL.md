---
name: pt-visual
description: "PT 시각화 - 10종 컬러 팔레트 기반 세련된 SVG 슬라이드 생성"
user-invocable: true
disable-model-invocation: false
allowed-tools: Read, Write, Bash
recommended-model: sonnet
model-reason: "SVG 코드 생성과 디자인 적용 - Sonnet의 코드 생성 능력과 효율 활용"
---

# 시각화 전문가 에이전트

2025-2026 프레젠테이션 디자인 트렌드를 반영한 세련되고 신뢰감 있는 슬라이드를 제작합니다.

## 모델 권장사항

이 스킬은 **Sonnet** 모델을 권장합니다:
- SVG 코드 생성에 강점
- 디자인 시스템 일관성 유지
- 비용 효율적인 코드 작성
- 대량 슬라이드 생성 시 토큰 효율성

---

## 입력

- 콘텐츠 설계 문서 (슬라이드 구조)
- **선택된 팔레트** (pt-reception에서 결정됨)

팔레트가 지정되지 않은 경우 기본값 **Modern Slate Dark** 사용.

## 디자인 철학

- **Glance Test** (Nancy Duarte): 3초 안에 핵심 메시지 파악
- **Data-Ink Ratio** (Edward Tufte): 불필요한 장식 제거
- **Executive-First**: 결론 먼저, 상세는 백업에

---

# 10종 컬러 팔레트 시스템

> 용도에 맞는 팔레트를 선택하세요. 기본값은 **Modern Slate Dark**입니다.

---

## 1. Modern Slate Dark (기본)

> **용도**: 범용, 테크, IT, 스타트업
> **키워드**: 세련됨, 현대적, 전문성

```
┌─────────────────────────────────────────────────────┐
│  #01 MODERN SLATE DARK                              │
├─────────────────────────────────────────────────────┤
│  Background    #0F172A   ████  Slate 900            │
│  Surface       #1E293B   ████  카드, 패널           │
│  Elevated      #334155   ████  호버, 강조           │
│  Border        #475569   ████  구분선               │
│  ─────────────────────────────────────────────────  │
│  Text Primary  #F8FAFC   ████  제목                 │
│  Text Body     #E2E8F0   ████  본문                 │
│  Text Muted    #94A3B8   ████  보조                 │
│  Text Label    #64748B   ████  라벨                 │
│  ─────────────────────────────────────────────────  │
│  Accent        #38BDF8   ████  Sky Blue             │
│  Accent Alt    #22D3EE   ████  Cyan                 │
└─────────────────────────────────────────────────────┘
```

---

## 2. Luxury Executive

> **용도**: 투자자 발표, 임원 보고, 고급 브랜드
> **키워드**: 럭셔리, 신뢰, 품격

```
┌─────────────────────────────────────────────────────┐
│  #02 LUXURY EXECUTIVE                               │
├─────────────────────────────────────────────────────┤
│  Background    #0C0A09   ████  Stone 950            │
│  Surface       #1C1917   ████  Stone 900            │
│  Elevated      #292524   ████  Stone 800            │
│  Border        #44403C   ████  Stone 700            │
│  ─────────────────────────────────────────────────  │
│  Text Primary  #FAFAF9   ████  Stone 50             │
│  Text Body     #E7E5E4   ████  Stone 200            │
│  Text Muted    #A8A29E   ████  Stone 400            │
│  Text Label    #78716C   ████  Stone 500            │
│  ─────────────────────────────────────────────────  │
│  Accent        #FCD34D   ████  Gold (Amber 300)     │
│  Accent Alt    #F59E0B   ████  Copper (Amber 500)   │
└─────────────────────────────────────────────────────┘
```

---

## 3. Trust Blue

> **용도**: 금융, 컨설팅, B2B, 기업 IR
> **키워드**: 신뢰, 안정, 전문성

```
┌─────────────────────────────────────────────────────┐
│  #03 TRUST BLUE                                     │
├─────────────────────────────────────────────────────┤
│  Background    #0C1929   ████  Navy Deep            │
│  Surface       #162033   ████  Navy Dark            │
│  Elevated      #1E3A5F   ████  Navy Mid             │
│  Border        #2563EB   ████  Blue 600 (subtle)    │
│  ─────────────────────────────────────────────────  │
│  Text Primary  #F0F9FF   ████  Sky 50               │
│  Text Body     #BAE6FD   ████  Sky 200              │
│  Text Muted    #7DD3FC   ████  Sky 300              │
│  Text Label    #38BDF8   ████  Sky 400              │
│  ─────────────────────────────────────────────────  │
│  Accent        #0EA5E9   ████  Sky 500              │
│  Accent Alt    #06B6D4   ████  Cyan 500             │
└─────────────────────────────────────────────────────┘
```

---

## 4. Tech Violet

> **용도**: AI, 혁신 기술, SaaS, 메타버스
> **키워드**: 혁신, 창의성, 미래지향
> **참고**: AI 스타트업에서 340% 사용 증가 ([MiniToolsHub](https://minitoolshub.com/blog/color-palettes-tech))

```
┌─────────────────────────────────────────────────────┐
│  #04 TECH VIOLET                                    │
├─────────────────────────────────────────────────────┤
│  Background    #0F0720   ████  Deep Purple          │
│  Surface       #1A1033   ████  Purple Dark          │
│  Elevated      #2E1A47   ████  Purple Mid           │
│  Border        #4C1D95   ████  Violet 800           │
│  ─────────────────────────────────────────────────  │
│  Text Primary  #FAF5FF   ████  Purple 50            │
│  Text Body     #E9D5FF   ████  Purple 200           │
│  Text Muted    #C4B5FD   ████  Violet 300           │
│  Text Label    #A78BFA   ████  Violet 400           │
│  ─────────────────────────────────────────────────  │
│  Accent        #8B5CF6   ████  Violet 500           │
│  Accent Alt    #A855F7   ████  Purple 500           │
└─────────────────────────────────────────────────────┘
```

---

## 5. Emerald Nature

> **용도**: 지속가능성, ESG, 헬스케어, 친환경
> **키워드**: 성장, 균형, 자연, 번영
> **참고**: ([Piktochart](https://piktochart.com/tips/emerald-green-color-palette))

```
┌─────────────────────────────────────────────────────┐
│  #05 EMERALD NATURE                                 │
├─────────────────────────────────────────────────────┤
│  Background    #022C22   ████  Emerald 950          │
│  Surface       #064E3B   ████  Emerald 900          │
│  Elevated      #065F46   ████  Emerald 800          │
│  Border        #047857   ████  Emerald 700          │
│  ─────────────────────────────────────────────────  │
│  Text Primary  #ECFDF5   ████  Emerald 50           │
│  Text Body     #A7F3D0   ████  Emerald 200          │
│  Text Muted    #6EE7B7   ████  Emerald 300          │
│  Text Label    #34D399   ████  Emerald 400          │
│  ─────────────────────────────────────────────────  │
│  Accent        #10B981   ████  Emerald 500          │
│  Accent Alt    #FCD34D   ████  Gold (Amber 300)     │
└─────────────────────────────────────────────────────┘
```

---

## 6. Coral Energy

> **용도**: 스타트업 피치, 크리에이티브, 마케팅
> **키워드**: 열정, 에너지, 창의성
> **참고**: ([GoDesignGuru](https://www.godesignguru.com/blog/colour-psychology-palette-choice-for-pitch-decks))

```
┌─────────────────────────────────────────────────────┐
│  #06 CORAL ENERGY                                   │
├─────────────────────────────────────────────────────┤
│  Background    #1C1210   ████  Warm Black           │
│  Surface       #292018   ████  Warm Dark            │
│  Elevated      #3D2E22   ████  Warm Mid             │
│  Border        #57534E   ████  Stone 600            │
│  ─────────────────────────────────────────────────  │
│  Text Primary  #FFF7ED   ████  Orange 50            │
│  Text Body     #FED7AA   ████  Orange 200           │
│  Text Muted    #FDBA74   ████  Orange 300           │
│  Text Label    #FB923C   ████  Orange 400           │
│  ─────────────────────────────────────────────────  │
│  Accent        #F97316   ████  Orange 500           │
│  Accent Alt    #FB7185   ████  Rose 400 (Coral)     │
└─────────────────────────────────────────────────────┘
```

---

## 7. Rose Minimal

> **용도**: 패션, 뷰티, 라이프스타일, D2C
> **키워드**: 세련됨, 모던, 부드러움
> **참고**: 2025 Soft Pink 트렌드 ([CollectivePortfolio](https://collectiveportfolio.com/blogs/news/2025-trend-report-soft-pinks-in-contemporary-design))

```
┌─────────────────────────────────────────────────────┐
│  #07 ROSE MINIMAL                                   │
├─────────────────────────────────────────────────────┤
│  Background    #1A1318   ████  Rose Black           │
│  Surface       #2D2228   ████  Rose Dark            │
│  Elevated      #3D3038   ████  Rose Mid             │
│  Border        #5C4F56   ████  Rose Border          │
│  ─────────────────────────────────────────────────  │
│  Text Primary  #FFF1F2   ████  Rose 50              │
│  Text Body     #FECDD3   ████  Rose 200             │
│  Text Muted    #FDA4AF   ████  Rose 300             │
│  Text Label    #FB7185   ████  Rose 400             │
│  ─────────────────────────────────────────────────  │
│  Accent        #F43F5E   ████  Rose 500             │
│  Accent Alt    #E879F9   ████  Fuchsia 400          │
└─────────────────────────────────────────────────────┘
```

---

## 8. Mono Contrast

> **용도**: 컨설팅, 법률, 공공기관, 포멀
> **키워드**: 명확함, 권위, 집중
> **참고**: ([SlidesCarnival](https://www.slidescarnival.com/tag/monochrome))

```
┌─────────────────────────────────────────────────────┐
│  #08 MONO CONTRAST                                  │
├─────────────────────────────────────────────────────┤
│  Background    #09090B   ████  Zinc 950             │
│  Surface       #18181B   ████  Zinc 900             │
│  Elevated      #27272A   ████  Zinc 800             │
│  Border        #3F3F46   ████  Zinc 700             │
│  ─────────────────────────────────────────────────  │
│  Text Primary  #FAFAFA   ████  Zinc 50              │
│  Text Body     #E4E4E7   ████  Zinc 200             │
│  Text Muted    #A1A1AA   ████  Zinc 400             │
│  Text Label    #71717A   ████  Zinc 500             │
│  ─────────────────────────────────────────────────  │
│  Accent        #FFFFFF   ████  White                │
│  Accent Alt    #52525B   ████  Zinc 600             │
└─────────────────────────────────────────────────────┘
```

---

## 9. Sunset Warm

> **용도**: 여행, 푸드, 커뮤니티, 친근한 브랜드
> **키워드**: 따뜻함, 환영, 친근함

```
┌─────────────────────────────────────────────────────┐
│  #09 SUNSET WARM                                    │
├─────────────────────────────────────────────────────┤
│  Background    #1C1412   ████  Warm Black           │
│  Surface       #2C1E1A   ████  Warm Surface         │
│  Elevated      #3D2A22   ████  Warm Elevated        │
│  Border        #5C4033   ████  Warm Border          │
│  ─────────────────────────────────────────────────  │
│  Text Primary  #FFFBEB   ████  Amber 50             │
│  Text Body     #FDE68A   ████  Amber 200            │
│  Text Muted    #FCD34D   ████  Amber 300            │
│  Text Label    #FBBF24   ████  Amber 400            │
│  ─────────────────────────────────────────────────  │
│  Accent        #F59E0B   ████  Amber 500            │
│  Accent Alt    #EF4444   ████  Red 500              │
└─────────────────────────────────────────────────────┘
```

---

## 10. Cyber Neon

> **용도**: 게임, 엔터테인먼트, 혁신, 파격적 발표
> **키워드**: 대담함, 미래, 에너지
> **참고**: 2026 Cyber 트렌드 ([Lounge Lizard](https://www.loungelizard.com/blog/web-design-color-trends/))

```
┌─────────────────────────────────────────────────────┐
│  #10 CYBER NEON                                     │
├─────────────────────────────────────────────────────┤
│  Background    #020617   ████  Slate 950            │
│  Surface       #0F172A   ████  Slate 900            │
│  Elevated      #1E293B   ████  Slate 800            │
│  Border        #334155   ████  Slate 700            │
│  ─────────────────────────────────────────────────  │
│  Text Primary  #F8FAFC   ████  Slate 50             │
│  Text Body     #E2E8F0   ████  Slate 200            │
│  Text Muted    #94A3B8   ████  Slate 400            │
│  Text Label    #64748B   ████  Slate 500            │
│  ─────────────────────────────────────────────────  │
│  Accent        #22D3EE   ████  Cyan 400             │
│  Accent Alt    #A3E635   ████  Lime 400             │
│  Accent Glow   #F0ABFC   ████  Fuchsia 300          │
└─────────────────────────────────────────────────────┘
```

---

# 팔레트 선택 가이드

| 팔레트 | 추천 용도 | 분위기 |
|--------|----------|--------|
| Modern Slate Dark | 범용, IT, 테크 | 세련됨, 현대적 |
| Luxury Executive | 투자자, 임원 | 고급, 신뢰 |
| Trust Blue | 금융, 컨설팅 | 안정, 전문성 |
| Tech Violet | AI, SaaS, 혁신 | 창의적, 미래 |
| Emerald Nature | ESG, 헬스케어 | 성장, 자연 |
| Coral Energy | 스타트업, 마케팅 | 열정, 에너지 |
| Rose Minimal | 패션, 라이프스타일 | 세련됨, 부드러움 |
| Mono Contrast | 컨설팅, 법률 | 명확함, 권위 |
| Sunset Warm | 여행, 푸드 | 따뜻함, 친근 |
| Cyber Neon | 게임, 엔터테인먼트 | 대담함, 미래 |

---

# 타이포그래피 시스템

| 요소 | 크기 | 굵기 | 용도 |
|------|------|------|------|
| Display | 80-120px | 700 | 핵심 숫자, 키워드 |
| H1 | 56-72px | 700 | 슬라이드 제목 |
| H2 | 36-44px | 600 | 섹션 제목 |
| H3 | 24-28px | 600 | 카드 제목 |
| Body | 18-22px | 400 | 본문 |
| Label | 12-14px | 500 | 라벨, 태그 |

**폰트**: `Inter` (영문) + `Pretendard` (한글)

---

# 레이아웃 시스템

- **해상도**: 1920 x 1080 px
- **마진**: 100px
- **카드 radius**: 16-20px

---

# 디자인 체크리스트

```
□ 적절한 팔레트 선택했는가?
□ Soft Black 배경 사용했는가? (순수 검정 금지)
□ 악센트 컬러 10% 이하로 제한했는가?
□ 텍스트 대비 4.5:1 이상인가?
□ 제목 56pt 이상인가?
□ 슬라이드당 1개 핵심 아이디어인가?
```

---

# 밝은 테마 팔레트 (PDF 최적화)

> **PDF 변환 시 권장**: 밝은 테마는 인쇄/화면 모두에서 가독성이 우수합니다.

## Light Professional (PDF 권장)

> **용도**: 범용, 문서 공유, 인쇄, 화면 발표 모두
> **키워드**: 깔끔함, 전문성, 가독성

```
┌─────────────────────────────────────────────────────┐
│  LIGHT PROFESSIONAL (PDF 최적화)                    │
├─────────────────────────────────────────────────────┤
│  Background    #FFFFFF   ████  Pure White           │
│  Surface       #F8F9FA   ████  Light Gray           │
│  Elevated      #F1F3F4   ████  섹션 구분            │
│  Border        #E0E0E0   ████  구분선               │
│  ─────────────────────────────────────────────────  │
│  Text Primary  #1A1A1A   ████  제목 (거의 검정)    │
│  Text Body     #333333   ████  본문                 │
│  Text Muted    #666666   ████  보조                 │
│  Text Label    #999999   ████  라벨                 │
│  ─────────────────────────────────────────────────  │
│  Accent        #FF6B6B   ████  Coral (기본)        │
│  Accent Alt    #4ECDC4   ████  Teal                 │
└─────────────────────────────────────────────────────┘
```

## Light Blue (비즈니스)

> **용도**: 기업, 컨설팅, B2B
> **키워드**: 신뢰, 전문성

```
┌─────────────────────────────────────────────────────┐
│  LIGHT BLUE (비즈니스)                              │
├─────────────────────────────────────────────────────┤
│  Background    #FFFFFF   ████  White                │
│  Accent        #2563EB   ████  Blue 600             │
│  Text Primary  #1E293B   ████  Slate 800            │
└─────────────────────────────────────────────────────┘
```

## Light Purple (크리에이티브)

> **용도**: 테크, 스타트업, 창의적 발표
> **키워드**: 혁신, 창의성

```
┌─────────────────────────────────────────────────────┐
│  LIGHT PURPLE (크리에이티브)                        │
├─────────────────────────────────────────────────────┤
│  Background    #FFFFFF   ████  White                │
│  Title BG      gradient(#667eea → #764ba2)         │
│  Accent        #8B5CF6   ████  Violet 500           │
│  Text Primary  #1F2937   ████  Gray 800             │
└─────────────────────────────────────────────────────┘
```

---

# PDF 품질 필수 기준

> **중요**: 다크 테마는 화면 발표에는 좋지만, PDF 공유 시 가독성 문제 발생 가능

## PDF 변환 시 필수 체크

```
[필수]
□ 밝은 배경 (#FFFFFF 또는 #F8F9FA) 사용
□ 텍스트 색상 충분히 어둡게 (#333333 이하)
□ 그라디언트 텍스트 금지 (렌더링 문제)
□ 시스템 폰트 사용 (깨짐 방지)
□ 강조색 단일 색상으로 통일

[권장 폰트]
- 한글: 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR'
- 영문: 시스템 기본 sans-serif
- 코드: 'SF Mono', 'Monaco', 'Menlo', monospace

[크기 기준]
- 제목 (h1): 44px 이상
- 부제목 (h2): 32px 이상
- 본문: 22px 이상
- 테이블: 18px 이상
- 코드: 16px 이상
```

## 테마 선택 가이드

| 용도 | 권장 테마 | 이유 |
|------|----------|------|
| PDF 공유/인쇄 | **Light Professional** | 가독성 최고 |
| 화면 발표 (조명 어두움) | Dark 테마 | 눈 피로 감소 |
| 혼합 (화면+PDF) | **Light Professional** | 범용성 |
| 투자자 발표 | Light Blue | 신뢰감 |
| 스타트업 피치 | Light Purple | 혁신 이미지 |

---

# 템플릿 위치

- **고품질 템플릿**: `PT_Agent/templates/marp_quality.md`
- **기존 미니멀**: `PT_Agent/templates/marp_minimal.md`

PDF 출력 시 `marp_quality.md` 템플릿 사용 권장.

---

# 품질 체크리스트 참조

> **중요**: 모든 슬라이드 생성 시 아래 체크리스트를 준수하세요.

**전체 체크리스트**: `PT_Agent/docs/quality-checklist.md`

슬라이드 생성 전 반드시 확인:

```
[필수 확인]
□ 배경: #FFFFFF (PDF용) 또는 선택된 팔레트
□ 폰트: 시스템 폰트 (Apple SD Gothic Neo, Malgun Gothic)
□ 크기: h1 44px+, 본문 22px+
□ 강조: 단일 accent 색상만 사용
□ 대비: 텍스트/배경 4.5:1 이상
```
