# -*- coding: utf-8 -*-
"""
네오서울 2087 - 배경 에셋 구조 정의서
작성: 테크니컬 디렉터팀
버전: 1.0

ID 규칙:
- 장소: LOC_[영문약어]_[번호]
- 소품: PROP_[장소약어]_[카테고리]_[번호]
- 조명: LIGHT_[장소약어]_[타입]_[번호]
- 이펙트: FX_[타입]_[번호]
"""

# =============================================================================
# 프로젝트 메타데이터
# =============================================================================
PROJECT_META = {
    "project_name": "네오서울 2087",
    "version": "1.0",
    "time_period": "2087년",
    "location": "서울",
    "mood": "사이버펑크 느와르",
    "weather_default": "비 오는 밤",
}

# =============================================================================
# 색상 팔레트 정의
# =============================================================================
COLOR_PALETTE = {
    "primary": {
        "deep_navy": "#0a1628",
        "description": "주조색 - 밤하늘, 그림자"
    },
    "accent": {
        "cyber_pink": "#ff2a6d",
        "neon_blue": "#05d9e8",
        "description": "강조색 - 네온사인, 홀로그램"
    },
    "warning": {
        "japan_red": "#d1001c",
        "description": "경고색 - 야쿠자 관련, 위험 지역"
    },
    "ambient": {
        "warm_amber": "#ffb347",
        "description": "한옥 내부 조명"
    }
}

# =============================================================================
# 장소 정의: 골목 (Back Alley)
# =============================================================================
LOCATION_ALLEY = {
    "id": "LOC_ALLEY_001",
    "name_ko": "을지로 네온골목",
    "name_en": "Euljiro Neon Alley",
    "description": "구 을지로 3가, 사이버네틱 수리점 거리",

    "dimensions": {
        "width_m": 1.5,
        "length_m": 50,
        "height_m": 8
    },

    "time_of_day": "자정",
    "weather": "가랑비, 안개(발목 높이)",

    "surfaces": {
        "ground": {
            "id": "PROP_ALLEY_GROUND_001",
            "material": "금이 간 아스팔트",
            "feature": "형광 파란색 배수로 LED 라인",
            "reflection": True,
            "puddles": True
        },
        "wall_left": {
            "id": "PROP_ALLEY_WALL_001",
            "material": "낡은 적벽돌",
            "feature": "한글 그래피티 스프레이"
        },
        "wall_right": {
            "id": "PROP_ALLEY_WALL_002",
            "material": "철제 셔터",
            "feature": "홀로그램 간판 부착"
        }
    },

    "lighting": [
        {
            "id": "LIGHT_ALLEY_NEON_001",
            "type": "neon_sign",
            "text": "修理",
            "color": "red",
            "position": "입구"
        },
        {
            "id": "LIGHT_ALLEY_FLUO_001",
            "type": "fluorescent",
            "state": "flickering",
            "position": "중간"
        },
        {
            "id": "LIGHT_ALLEY_LED_001",
            "type": "led_cross",
            "color": "blue",
            "position": "끝",
            "note": "불법 클리닉 표시"
        }
    ],

    "props": [
        {
            "id": "PROP_ALLEY_BOX_001",
            "name": "플라스틱 상자 더미",
            "count": 5,
            "stackable": True
        },
        {
            "id": "PROP_ALLEY_CYBER_001",
            "name": "녹슨 사이버네틱 팔 폐기물",
            "count": 3,
            "material": "녹슨 금속"
        },
        {
            "id": "PROP_ALLEY_TENT_001",
            "name": "포장마차 비닐",
            "state": "김 서림",
            "transparency": 0.3
        },
        {
            "id": "PROP_ALLEY_DRONE_001",
            "name": "소형 감시 드론",
            "count": 2,
            "feature": "고양이 눈처럼 빛나는 렌즈",
            "animated": True
        }
    ],

    "audio_hints": [
        "빗방울 소리",
        "멀리서 트로트 음악",
        "전선 지지직 소리"
    ]
}

# =============================================================================
# 장소 정의: 아지트 (Hideout)
# =============================================================================
LOCATION_HIDEOUT = {
    "id": "LOC_HIDEOUT_001",
    "name_ko": "삼청동 한옥 세이프하우스",
    "name_en": "Samcheong-dong Hanok Safehouse",
    "description": "북촌 한옥마을, 폐가로 위장된 2층 한옥",

    "dimensions": {
        "floors": 2,
        "yard_size_m": "3x3"
    },

    "exterior": {
        "roof": {
            "id": "PROP_HIDE_ROOF_001",
            "type": "전통 기와지붕",
            "feature": "처마 끝 재밍 안테나 위장"
        },
        "gate": {
            "id": "PROP_HIDE_GATE_001",
            "material": "낡은 목재",
            "hidden_tech": "적외선 스캐너 (문고리 내장)"
        },
        "yard": {
            "id": "PROP_HIDE_YARD_001",
            "features": [
                {"name": "돌확(석조 물그릇)", "state": "이끼, 빗물 고임"},
                {"name": "말라죽은 감나무", "feature": "카메라 드론 둥지"}
            ]
        }
    },

    "interior_floor1": {
        "id": "LOC_HIDEOUT_1F",
        "features": [
            {
                "id": "PROP_HIDE_TABLE_001",
                "name": "좌식 테이블",
                "tech": "홀로그램 지도 디스플레이"
            },
            {
                "id": "PROP_HIDE_WALL_001",
                "name": "한지 창호 벽",
                "behind": "서버 랙 (푸른 LED)"
            },
            {
                "id": "PROP_HIDE_FLOOR_001",
                "name": "온돌 바닥",
                "heat_source": "발전기"
            }
        ]
    },

    "interior_floor2": {
        "id": "LOC_HIDEOUT_2F",
        "ceiling_height": "낮음 (다락형)",
        "features": [
            {
                "id": "PROP_HIDE_WEAPON_001",
                "name": "무기 거치대",
                "items": ["EM 펄스건", "모노와이어 글러브"]
            },
            {
                "id": "PROP_HIDE_ARM_001",
                "name": "예비 사이버네틱 팔",
                "material": "광택 티타늄",
                "owner": "주인공"
            },
            {
                "id": "PROP_HIDE_WINDOW_001",
                "name": "방탄 한지 창문",
                "material": "섬유 강화 한지"
            }
        ]
    },

    "lighting": [
        {
            "id": "LIGHT_HIDE_HANJI_001",
            "type": "한지등",
            "color": "warm_amber",
            "temperature": "따뜻함"
        },
        {
            "id": "LIGHT_HIDE_SERVER_001",
            "type": "서버 LED",
            "color": "neon_blue",
            "temperature": "차가움"
        }
    ],

    "mood_keywords": ["전통과 기술의 공존", "아날로그 속 디지털"]
}

# =============================================================================
# 장소 정의: 광장 (Plaza)
# =============================================================================
LOCATION_PLAZA = {
    "id": "LOC_PLAZA_001",
    "name_ko": "세빛둥둥섬 블랙마켓",
    "name_en": "Sebitseom Black Market",
    "description": "한강 위 인공섬, 야쿠자 점령 암시장",

    "dimensions": {
        "size": "축구장 2개",
        "structure_count": 3,
        "layout": "삼각형 구조물 + 다리 연결"
    },

    "time_of_day": "새벽 2시",
    "weather": "비 갠 직후, 습한 공기",

    "structures": [
        {
            "id": "LOC_PLAZA_A",
            "name": "무기상 구조물",
            "exterior": {
                "wall": "깨진 유리 + 철판 땜질",
                "signage": {
                    "text": "武器",
                    "type": "일본어 네온",
                    "color": "red"
                },
                "decoration": "야쿠자 문신 패턴 홀로그램"
            }
        },
        {
            "id": "LOC_PLAZA_B",
            "name": "정보상 구조물",
            "interior": {
                "atmosphere": "연기 자욱",
                "wall_feature": "구형 브라운관 모니터 벽면",
                "display": "CCTV 다중 화면",
                "center": {
                    "id": "PROP_PLAZA_TABLE_001",
                    "name": "원형 테이블",
                    "activity": "데이터칩 거래"
                }
            }
        },
        {
            "id": "LOC_PLAZA_C",
            "name": "유흥시설 구조물",
            "lighting_color": ["pink", "purple"],
            "feature": {
                "id": "PROP_PLAZA_ANDROID_001",
                "name": "안드로이드 접객원",
                "position": "입구 도열",
                "detail": "인조 피부 아래 메탈릭 관절 비침",
                "mood": "섬뜩함"
            }
        }
    ],

    "center_platform": {
        "id": "LOC_PLAZA_CENTER",
        "name": "수상 플랫폼",
        "shape": "원형",
        "original_use": "홀로그램 분수쇼",
        "current_use": "불법 격투 경기장",
        "audience": "주변 보트들"
    },

    "lighting": [
        {
            "id": "LIGHT_PLAZA_WATER_001",
            "type": "수면 반사광",
            "source": "네온사인",
            "effect": "물결 일렁임"
        },
        {
            "id": "LIGHT_PLAZA_DRONE_001",
            "type": "경찰 드론 탐조등",
            "behavior": "간헐적 스캔"
        }
    ],

    "props": [
        {
            "id": "PROP_PLAZA_PUDDLE_001",
            "name": "물웅덩이",
            "count": "다수",
            "reflection": True
        }
    ],

    "audio_hints": [
        "보트 엔진 소리",
        "일본어+한국어 웅성거림",
        "간헐적 총성"
    ]
}

# =============================================================================
# 공통 FX 이펙트
# =============================================================================
COMMON_FX = [
    {
        "id": "FX_RAIN_001",
        "name": "빗줄기",
        "type": "particle",
        "intensity": "light_to_heavy"
    },
    {
        "id": "FX_PUDDLE_REFLECT_001",
        "name": "물웅덩이 반사",
        "type": "shader",
        "dynamic": True
    },
    {
        "id": "FX_NEON_GLOW_001",
        "name": "네온 글로우",
        "type": "post_process",
        "bloom_intensity": 1.5
    },
    {
        "id": "FX_FOG_001",
        "name": "저층 안개",
        "type": "volumetric",
        "height_m": 0.5
    },
    {
        "id": "FX_HOLOGRAM_001",
        "name": "홀로그램 노이즈",
        "type": "shader",
        "glitch_probability": 0.1
    }
]

# =============================================================================
# 금지 요소 체크리스트
# =============================================================================
PROHIBITED_ELEMENTS = [
    "밝은 대낮 장면",
    "깨끗한 거리",
    "서양식 건축물",
    "맑은 날씨 (기본값)"
]

# =============================================================================
# 전체 에셋 목록 취합
# =============================================================================
ALL_LOCATIONS = [LOCATION_ALLEY, LOCATION_HIDEOUT, LOCATION_PLAZA]

def get_all_asset_ids():
    """모든 에셋 ID를 추출하여 리스트로 반환"""
    asset_ids = []

    for loc in ALL_LOCATIONS:
        asset_ids.append(loc["id"])

        # props
        if "props" in loc:
            for prop in loc["props"]:
                if "id" in prop:
                    asset_ids.append(prop["id"])

        # lighting
        if "lighting" in loc:
            for light in loc["lighting"]:
                if "id" in light:
                    asset_ids.append(light["id"])

    # FX
    for fx in COMMON_FX:
        asset_ids.append(fx["id"])

    return asset_ids


if __name__ == "__main__":
    print("=== 네오서울 2087 에셋 구조 검증 ===")
    print(f"프로젝트: {PROJECT_META['project_name']}")
    print(f"장소 수: {len(ALL_LOCATIONS)}")

    ids = get_all_asset_ids()
    print(f"총 에셋 ID 수: {len(ids)}")
    print("\n등록된 ID 목록:")
    for asset_id in ids:
        print(f"  - {asset_id}")
