"""K-POP Trends Tracker - Configuration"""

import os

# === Paths ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "database", "kpop_trends.db")
REPORTS_DIR = os.path.join(BASE_DIR, "outputs", "reports")
LOGS_DIR = os.path.join(BASE_DIR, "logs")

# === Tracked K-POP Artists ===
# 대소문자 무시 매칭. 언제든 추가/삭제 가능.
TRACKED_ARTISTS = [
    "BTS", "BLACKPINK", "Stray Kids", "SEVENTEEN", "aespa",
    "NewJeans", "LE SSERAFIM", "IVE", "TWICE", "EXO",
    "NCT", "NCT 127", "NCT DREAM", "WayV",
    "ATEEZ", "TXT", "ENHYPEN", "Red Velvet",
    "(G)I-DLE", "ITZY", "Dreamcatcher", "NMIXX", "ILLIT",
    "BABYMONSTER", "RIIZE", "TWS", "KISS OF LIFE", "KATSEYE",
    "BIGBANG", "PSY", "ZEROBASEONE", "BOYNEXTDOOR",
    "Jung Kook", "Jimin", "SUGA", "j-hope", "V", "RM",
    "Lisa", "Jennie", "Rose", "Jisoo",
]

# 매칭용 소문자 세트 (런타임에 자동 생성)
TRACKED_ARTISTS_LOWER = {a.lower() for a in TRACKED_ARTISTS}

# === Google Trends ===
TREND_KEYWORDS = ["K-pop", "KPOP", "Korean music", "K-pop comeback", "kpop comeback"]
TREND_REGIONS = ["KR", "US", "JP", "TH", "ID", "PH", "BR", "MX", "FR", "DE", "HK", "TW"]

# === Region Groups for Report ===
# 지역 코드 → 보고서 그룹 매핑
REGION_GROUPS = {
    "한국": {"codes": ["KR"], "icon": "&#x1F1F0;&#x1F1F7;", "chart_sources": ["spotify_kr"]},
    "일본": {"codes": ["JP"], "icon": "&#x1F1EF;&#x1F1F5;", "chart_sources": []},
    "중화권": {"codes": ["HK", "TW"], "icon": "&#x1F1E8;&#x1F1F3;", "chart_sources": []},
    "동남아": {"codes": ["TH", "ID", "PH"], "icon": "&#x1F30F;", "chart_sources": []},
    "북미": {"codes": ["US"], "icon": "&#x1F1FA;&#x1F1F8;", "chart_sources": ["billboard_hot100"]},
    "남미": {"codes": ["BR", "MX"], "icon": "&#x1F30E;", "chart_sources": []},
    "유럽": {"codes": ["FR", "DE"], "icon": "&#x1F1EA;&#x1F1FA;", "chart_sources": []},
}

# 지역 코드 → 그룹명 역매핑 (런타임 자동 생성)
REGION_CODE_TO_GROUP = {}
for group_name, group_info in REGION_GROUPS.items():
    for code in group_info["codes"]:
        REGION_CODE_TO_GROUP[code] = group_name

# Billboard Global 200은 '글로벌' 범주
GLOBAL_CHART_SOURCES = ["billboard_global200"]

# === Billboard Charts ===
BILLBOARD_CHARTS = ["billboard-global-200", "hot-100"]

# === News RSS Feeds ===
NEWS_FEEDS = [
    ("Soompi", "https://www.soompi.com/feed"),
    ("AllKPop", "https://www.allkpop.com/feed"),
]

# === Spotify Korea Chart ===
SPOTIFY_KR_URL = "https://kworb.net/spotify/country/kr_daily.html"

# === Insight Thresholds ===
CHART_RISE_THRESHOLD = 10      # 10위 이상 상승 시 HIGH
CHART_DROP_THRESHOLD = 20      # 20위 이상 하락 시 MEDIUM
STREAMING_SURGE_PCT = 0.30     # 30% 이상 스트리밍 증가 시 MEDIUM
NEWS_CLUSTER_COUNT = 3         # 동일 아티스트 뉴스 3건 이상 시 MEDIUM
MULTI_REGION_THRESHOLD = 3     # 3개국 이상 동시 트렌딩 시 HIGH

# === Request Settings ===
REQUEST_TIMEOUT = 30
REQUEST_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}
