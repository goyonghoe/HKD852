import Parser from "rss-parser";
import { NewsItem, Category, Region } from "./types";

const parser = new Parser({
  timeout: 10000,
  headers: { "User-Agent": "AI-News-Dashboard/1.0" },
});

interface FeedSource {
  url: string;
  source: string;
  tier: number;
  region?: Region;
}

// ── 글로벌/미국 뉴스 소스 ─────────────────────────────────
const MAIN_FEEDS: FeedSource[] = [
  {
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
    source: "TechCrunch",
    tier: 10,
  },
  {
    url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    source: "The Verge",
    tier: 9,
  },
  {
    url: "https://venturebeat.com/category/ai/feed/",
    source: "VentureBeat",
    tier: 7,
  },
  {
    url: "https://www.technologyreview.com/feed/",
    source: "MIT Tech Review",
    tier: 12,
  },
  {
    url: "https://feeds.arstechnica.com/arstechnica/technology-lab",
    source: "Ars Technica",
    tier: 8,
  },
  {
    url: "https://news.google.com/rss/search?q=artificial+intelligence+when:1d&hl=en-US&gl=US&ceid=US:en",
    source: "Google News",
    tier: 4,
  },
  // 커뮤니티 소스
  { url: "https://lobste.rs/t/ai.rss", source: "Lobsters", tier: 6 },
  { url: "https://dev.to/feed/tag/ai", source: "Dev.to", tier: 5 },
  { url: "https://dev.to/feed/tag/machinelearning", source: "Dev.to", tier: 5 },
  { url: "https://www.techmeme.com/feed.xml", source: "TechMeme", tier: 8 },
  { url: "https://www.producthunt.com/feed", source: "Product Hunt", tier: 4 },
];

// ── 지역별 뉴스 소스 (영문 키워드 + 지역 파라미터로 안정성 확보) ──
const REGIONAL_FEEDS: FeedSource[] = [
  // 한국: 주요 기업명 + AI 키워드
  {
    url: "https://news.google.com/rss/search?q=AI+Korea+OR+Samsung+AI+OR+Naver+AI+OR+Kakao+AI+when:3d&hl=en&gl=US&ceid=US:en",
    source: "Korea AI",
    tier: 5,
    region: "kr",
  },
  // 중국: 주요 기업명 + AI 키워드
  {
    url: "https://news.google.com/rss/search?q=AI+China+OR+Baidu+AI+OR+DeepSeek+OR+Alibaba+AI+OR+Tencent+AI+when:3d&hl=en&gl=US&ceid=US:en",
    source: "China AI",
    tier: 5,
    region: "cn",
  },
  // 일본: 주요 기업명 + AI 키워드
  {
    url: "https://news.google.com/rss/search?q=AI+Japan+OR+SoftBank+AI+OR+Sony+AI+OR+NTT+AI+when:3d&hl=en&gl=US&ceid=US:en",
    source: "Japan AI",
    tier: 5,
    region: "jp",
  },
  // 유럽: EU AI Act 및 주요 키워드
  {
    url: "https://news.google.com/rss/search?q=AI+Europe+OR+EU+AI+Act+OR+Mistral+AI+OR+DeepMind+when:3d&hl=en&gl=US&ceid=US:en",
    source: "Europe AI",
    tier: 5,
    region: "eu",
  },
];

// ── 카테고리 분류 ─────────────────────────────────────────
function classifyCategory(title: string, snippet: string): Category {
  const text = `${title} ${snippet}`.toLowerCase();
  if (
    /arxiv|paper|study|research|model|benchmark|training|dataset|neural|transformer|diffusion|fine.?tun/.test(
      text,
    )
  )
    return "research";
  if (
    /regulat|policy|law|ban|\beu\b|congress|senate|legislat|govern|compliance|gdpr|executive order|copyright|ai act/.test(
      text,
    )
  )
    return "regulation";
  if (
    /funding|startup|raised|seed|series [a-d]|valuation|venture|founded|unicorn|acquisition/.test(
      text,
    )
  )
    return "startup";
  if (
    /open.?source|github|release|hugging.?face|weights|llama|mistral|apache|mit license|ollama|self.?host/.test(
      text,
    )
  )
    return "opensource";
  return "industry";
}

// ── 지역 감지 ─────────────────────────────────────────────
function detectRegion(title: string, source: string): Region {
  const t = `${title} ${source}`.toLowerCase();
  if (
    /삼성|네이버|카카오|한국|korea[n]?|samsung|naver|kakao|lg전자|sk텔레콤|현대|hyundai|구글뉴스 kr/.test(
      t,
    )
  )
    return "kr";
  if (
    /百度|baidu|alibaba|tencent|deepseek|中国|china|chinese|bytedance|qwen|zhipu|huawei|구글뉴스 cn/.test(
      t,
    )
  )
    return "cn";
  if (
    /softbank|rakuten|japan|japanese|tokyo|日本|ntt|sony|fujitsu|구글뉴스 jp/.test(
      t,
    )
  )
    return "jp";
  if (
    /europe|european|brussels|gdpr|\buk\b|british|france|french|german|germany|ai act|spain|italy|구글뉴스 eu/.test(
      t,
    )
  )
    return "eu";
  return "us";
}

// ── 유틸리티 ──────────────────────────────────────────────
function hashId(title: string, source: string): string {
  const str = `${title}-${source}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isRecent(dateStr: string, maxHours: number): boolean {
  const age = (Date.now() - new Date(dateStr).getTime()) / 3600000;
  return age >= 0 && age <= maxHours;
}

// ── 중요도 스코어링 ──────────────────────────────────────
const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "their",
  "there",
  "these",
  "those",
  "which",
  "while",
  "would",
  "could",
  "should",
  "being",
  "every",
  "other",
  "under",
  "where",
  "first",
  "https",
  "with",
  "from",
  "that",
  "this",
  "have",
  "been",
  "will",
  "more",
  "than",
  "into",
  "says",
  "said",
  "just",
  "what",
  "when",
  "also",
  "most",
  "some",
  "like",
  "your",
  "they",
  "here",
  "then",
  "each",
  "make",
  "over",
]);

function scoreArticles(articles: NewsItem[]): NewsItem[] {
  return articles.map((article) => {
    let score = 0;

    const keywords = article.title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

    // 1. 다매체 보도 감지
    const relatedSources = new Set<string>();
    articles.forEach((other) => {
      if (other.id === article.id || other.source === article.source) return;
      const otherTitle = other.title.toLowerCase();
      const matches = keywords.filter((w) => otherTitle.includes(w));
      if (matches.length >= 2) relatedSources.add(other.source);
    });
    score += relatedSources.size * 25;

    // 2. 소스 신뢰도
    score += article.score; // tier 점수

    // 3. 커뮤니티 반응
    score += Math.min(article.engagement * 0.05, 20);

    // 4. 시의성
    const hoursAgo =
      (Date.now() - new Date(article.publishedAt).getTime()) / 3600000;
    if (hoursAgo < 3) score += 15;
    else if (hoursAgo < 6) score += 10;
    else if (hoursAgo < 12) score += 5;

    return { ...article, score: Math.round(score) };
  });
}

// ── RSS 피드 수집 ─────────────────────────────────────────
async function fetchFeeds(feeds: FeedSource[]): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    feeds.map(async (feed) => {
      const parsed = await parser.parseURL(feed.url);
      return (parsed.items || []).slice(0, 10).map((item) => {
        const snippet = stripHtml(
          item.contentSnippet || item.content || "",
        ).slice(0, 200);
        const title = (item.title || "").trim();
        const pubDate =
          item.isoDate || item.pubDate || new Date().toISOString();
        return {
          id: hashId(title, feed.source),
          title: title || "Untitled",
          summary: snippet || title,
          source: feed.source,
          url: item.link || "",
          category: classifyCategory(title, snippet),
          region: feed.region || detectRegion(title, feed.source),
          publishedAt: pubDate,
          score: feed.tier,
          engagement: 0,
        };
      });
    }),
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<NewsItem[]> => r.status === "fulfilled",
    )
    .flatMap((r) => r.value);
}

// ── Hacker News 수집 ──────────────────────────────────────
async function fetchHackerNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      "https://hn.algolia.com/api/v1/search?query=AI+LLM+GPT+Claude+artificial+intelligence&tags=story&hitsPerPage=15",
      { next: { revalidate: 21600 } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.hits || [])
      .filter((hit: Record<string, unknown>) => hit.title && hit.url)
      .map((hit: Record<string, string | number>) => ({
        id: `hn-${hit.objectID}`,
        title: String(hit.title),
        summary: String(hit.title),
        source: "Hacker News",
        url: String(
          hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
        ),
        category: classifyCategory(String(hit.title), ""),
        region: detectRegion(String(hit.title), "Hacker News") as Region,
        publishedAt: String(hit.created_at || new Date().toISOString()),
        score: 6,
        engagement: Number(hit.points) || 0,
      }));
  } catch {
    return [];
  }
}

// ── 메인 수집 + 스코어링 ─────────────────────────────────
export async function fetchAllNews(): Promise<NewsItem[]> {
  const [mainArticles, regionalArticles, hnArticles] = await Promise.all([
    fetchFeeds(MAIN_FEEDS),
    fetchFeeds(REGIONAL_FEEDS),
    fetchHackerNews(),
  ]);

  const all = [...mainArticles, ...regionalArticles, ...hnArticles];

  // 72시간 이내 기사만 유지
  const recent = all.filter((a) => isRecent(a.publishedAt, 72));

  // 중복 제거
  const seen = new Set<string>();
  const unique = recent.filter((article) => {
    const key = article.title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]/g, "")
      .slice(0, 40);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return scoreArticles(unique).sort((a, b) => b.score - a.score);
}
