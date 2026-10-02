import { extractCommerce } from "./commerce.ts";

const ORIGIN = "https://news.pulmuone.co.kr";
const LIST_URL = `${ORIGIN}/pulmuone/newsroom/listDataroom.do`;
const MAX_LIST_PAGES = 2;
const MAX_HTML_BYTES = 1_500_000;

export type PulmuoneProduct = {
  slug: string;
  brand: "풀무원";
  name: string;
  normalizedName: string;
  category: "meal" | "drink" | "snack";
  productType: "new";
  price: number | null;
  retailer: string | null;
  releaseDate: null;
  announcedDate: string;
  description: string;
  sourceUrl: string;
  imageUrl: string | null;
  emoji: "🍱" | "🥤" | "🍪";
};

type Article = { id: string; title: string; date: string; url: string };

function decodeHtml(value: string) {
  const named: Record<string, string> = {
    amp: "&", quot: '"', apos: "'", nbsp: " ", lt: "<", gt: ">",
    lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", hellip: "…", middot: "·",
  };
  return value.replace(/&(#(?:x[0-9a-f]+|\d+)|[a-z]+);/gi, (entity, code: string) => {
    if (code[0] !== "#") return named[code.toLowerCase()] ?? entity;
    const numeric = code[1]?.toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
    return Number.isFinite(numeric) && numeric >= 0 && numeric <= 0x10ffff ? String.fromCodePoint(numeric) : entity;
  });
}

function plainText(value: string) {
  return decodeHtml(value.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function productNameFromTitle(title: string) {
  if (!/^풀무원,\s/.test(title)) return null;
  return title.match(/[‘'“"]([^’'”"]{2,80})[’'”"]\s*출시/)?.[1]?.trim() ?? null;
}

function categoryFor(name: string): PulmuoneProduct["category"] | null {
  if (/떡볶이|만두|요리키트|두부|국|밥|면|파스타|김치/.test(name)) return "meal";
  if (/음료|두유|주스|차|워터/.test(name)) return "drink";
  if (/과자|스낵|크런치|칩|쿠키|간식/.test(name)) return "snack";
  return null;
}

function isoDate(year: string, month: string, day: string) {
  const date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date ? date : null;
}

export function parsePulmuoneList(html: string): Article[] {
  const tbody = html.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1];
  if (!tbody) return [];
  return [...tbody.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(([, row]) => {
    const link = row.match(/<td\s+class=["']title02["'][^>]*>\s*<a\s+href=["']\/pulmuone\/newsroom\/viewNewsroom\.do\?menu=dataroom(?:&|&amp;)id=(\d+)["'][^>]*>([\s\S]*?)<\/a>/);
    const dateParts = row.match(/<td\s+class=["']date01["'][^>]*>[\s\S]*?(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
    if (!link || !dateParts) return null;
    const date = isoDate(dateParts[1], dateParts[2], dateParts[3]);
    if (!date) return null;
    return { id: link[1], title: plainText(link[2]), date, url: `${ORIGIN}/pulmuone/newsroom/viewNewsroom.do?menu=dataroom&id=${link[1]}` };
  }).filter((article): article is Article => article !== null);
}

export function parsePulmuoneDetail(html: string, article: Article): PulmuoneProduct | null {
  const heading = html.match(/<div\s+class=["']news_titwrap02["'][^>]*>([\s\S]*?)<div\s+class=["']news_cnt["']/)?.[1];
  if (!heading) return null;
  const title = plainText(heading.match(/<div\s+class=["']news_intit["'][^>]*>[\s\S]*?<h1>([\s\S]*?)<\/h1>/)?.[1] ?? "");
  const dateParts = heading.match(/<div\s+class=["']news_indata["'][^>]*>[\s\S]*?(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
  const date = dateParts ? isoDate(dateParts[1], dateParts[2], dateParts[3]) : null;
  if (title !== article.title || date !== article.date) return null;
  const name = productNameFromTitle(title);
  if (!name) return null;
  const category = categoryFor(name);
  if (!category) return null;
  const body = html.match(/<div\s+class=["']txt_ty01["'][^>]*>([\s\S]*?)<\/div>/)?.[1];
  if (!body) return null;
  const description = plainText(body).slice(0, 280);
  const commerce = extractCommerce(`${article.title} ${plainText(body)}`);
  if (!description.includes(name)) return null;
  const imageSource = body.match(/<img\b[^>]*\bsrc=(["'])(.*?)\1/i)?.[2];
  let imageUrl: string | null = null;
  if (imageSource) {
    try {
      const url = new URL(decodeHtml(imageSource), ORIGIN);
      if (url.origin === ORIGIN && url.pathname.startsWith("/webfile/webedit/") && !url.search && !url.hash) imageUrl = url.href;
    } catch { /* Keep the emoji fallback for an invalid image URL. */ }
  }
  return {
    slug: `pulmuone-${article.id}`,
    brand: "풀무원",
    name,
    normalizedName: name.normalize("NFKC").toLocaleLowerCase("ko-KR").replace(/[^a-z0-9가-힣]/g, ""),
    category,
    productType: "new",
    price: commerce.price,
    retailer: commerce.retailer,
    releaseDate: null,
    announcedDate: article.date,
    description: `공식 발표 ${article.date} · ${description}`,
    sourceUrl: article.url,
    imageUrl,
    emoji: category === "meal" ? "🍱" : category === "drink" ? "🥤" : "🍪",
  };
}

async function fetchOfficialHtml(url: string, fetcher: typeof fetch) {
  const response = await fetcher(url, { redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(8_000) });
  if (!response.ok || !response.headers.get("content-type")?.toLowerCase().includes("text/html") || !response.body) {
    throw new Error(`풀무원 공식 페이지 응답 오류 (${response.status})`);
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytesRead = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      if (bytesRead > MAX_HTML_BYTES) throw new Error("풀무원 공식 페이지 크기 제한 초과");
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(bytesRead);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder("utf-8").decode(bytes);
}

export async function collectPulmuone(fetcher: typeof fetch = fetch): Promise<PulmuoneProduct[]> {
  const articles: Article[] = [];
  for (let page = 1; page <= MAX_LIST_PAGES; page++) {
    const url = page === 1 ? LIST_URL : `${LIST_URL}?pageIndex=${page}`;
    const pageArticles = parsePulmuoneList(await fetchOfficialHtml(url, fetcher));
    if (pageArticles.length === 0) throw new Error("풀무원 목록 구조를 확인할 수 없습니다.");
    articles.push(...pageArticles);
  }
  const uniqueArticles = [...new Map(articles.map(article => [article.id, article])).values()];
  const products: PulmuoneProduct[] = [];
  let attempted = 0;
  let failed = 0;
  for (const article of uniqueArticles) {
    if (!productNameFromTitle(article.title)) continue;
    attempted++;
    try {
      const product = parsePulmuoneDetail(await fetchOfficialHtml(article.url, fetcher), article);
      if (product) products.push(product);
    } catch {
      failed++;
      console.warn("pulmuone:detail-failed", article.id);
    }
  }
  if (attempted > 0 && failed === attempted) throw new Error("풀무원 상세 자료를 모두 읽지 못했습니다.");
  return products;
}
