import { extractCommerce } from "./commerce.ts";

const ORIGIN = "https://www.bing.co.kr";
const LIST_URL = `${ORIGIN}/news/news_announced`;
const MAX_ARTICLES = 10;
const MAX_HTML_LENGTH = 1_000_000;

export type CollectedProduct = {
  slug: string;
  brand: "빙그레";
  name: string;
  normalizedName: string;
  category: "drink" | "icecream" | "dessert";
  productType: "new";
  price: number | null;
  retailer: string | null;
  releaseDate: null;
  announcedDate: string;
  description: string;
  sourceUrl: string;
  imageUrl: string | null;
  emoji: string;
};

type Article = { id: string; title: string; date: string; url: string };

function decodeHtml(value: string) {
  return value.replace(/&#(x[0-9a-f]+|\d+);|&(?:amp|quot|apos|lt|gt|nbsp);/gi, entity => {
    const named: Record<string, string> = { "&amp;": "&", "&quot;": '"', "&apos;": "'", "&lt;": "<", "&gt;": ">", "&nbsp;": " " };
    if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
    const raw = entity.slice(2, -1);
    const code = raw[0]?.toLowerCase() === "x" ? parseInt(raw.slice(1), 16) : parseInt(raw, 10);
    return Number.isFinite(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
  });
}

function plainText(value: string) {
  return decodeHtml(value.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function categoryFor(name: string): CollectedProduct["category"] | null {
  if (/더위사냥|메로나|붕어싸만코|부라보콘|아이스크림|아이스바/.test(name)) return "icecream";
  if (/워터|아이스티|커피|드링크|우유|주스|음료|에이드/.test(name)) return "drink";
  if (/스낵|과자|초콜릿|젤리|쿠키|빙과/.test(name)) return "dessert";
  return null;
}

function productNameFromTitle(title: string) {
  if (!/출시/.test(title) || /출시\s*\d+\s*(?:일|개월|년|주년)/.test(title)) return null;
  const match = title.match(/[‘'“"]([^’'”"]{2,80})[’'”"](?=[^\n]{0,30}출시)/);
  return match?.[1]?.trim() || null;
}

export function parseBinggraeList(html: string): Article[] {
  const rows = html.match(/<li\b[^>]*class=["'][^"']*\btd_line\b[^"']*["'][^>]*>[\s\S]*?<\/li>/g) ?? [];
  return rows.map(row => {
    const link = row.match(/<a\s+href=["']\/news\/news_announced_view\?anno_idx=(\d+)["'][^>]*>([\s\S]*?)<\/a>/);
    const date = row.match(/<div\s+class=["'][^"']*\bdate\b[^"']*["'][^>]*>\s*(\d{4}-\d{2}-\d{2})\s*<\/div>/);
    if (!link || !date || Number.isNaN(Date.parse(date[1]))) return null;
    return { id: link[1], title: plainText(link[2]), date: date[1], url: `${ORIGIN}/news/news_announced_view?anno_idx=${link[1]}` };
  }).filter((article): article is Article => article !== null).slice(0, MAX_ARTICLES);
}

export function parseBinggraeDetail(html: string, article: Article): CollectedProduct | null {
  const title = html.match(/<span\s+class=["']tit["'][^>]*>([\s\S]*?)<\/span>/);
  const date = html.match(/<p\s+class=["']date["'][^>]*>\s*(\d{4}-\d{2}-\d{2})\s*<\/p>/);
  if (!title || !date || plainText(title[1]) !== article.title || date[1] !== article.date) return null;
  const name = productNameFromTitle(article.title);
  if (!name) return null;
  const category = categoryFor(name);
  if (!category) return null;
  const content = html.match(/<div\s+class=["'][^"']*\btxt_box\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/);
  if (!content) return null;
  const description = plainText(content[1]).slice(0, 280);
  const commerce = extractCommerce(`${article.title} ${plainText(content[1])}`);
  if (!description.includes(name)) return null;
  const imageTag = [...content[1].matchAll(/<img\b[^>]*>/gi)]
    .find(match => decodeHtml(match[0].match(/\balt=(["'])(.*?)\1/i)?.[2] ?? "").includes(name));
  const imageSource = imageTag?.[0].match(/\bsrc=(["'])(.*?)\1/i)?.[2];
  let imageUrl: string | null = null;
  if (imageSource) {
    try {
      const url = new URL(decodeHtml(imageSource), ORIGIN);
      if (url.origin === ORIGIN && url.pathname.startsWith("/upload/ckeditor/") && !url.search && !url.hash) imageUrl = url.href;
    } catch { /* Invalid source image: retain the emoji fallback. */ }
  }
  return {
    slug: `binggrae-${article.id}`,
    brand: "빙그레",
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
    emoji: category === "icecream" ? "🍦" : category === "drink" ? "🥤" : "🍪",
  };
}

async function fetchOfficialHtml(url: string, fetcher: typeof fetch) {
  const response = await fetcher(url, { redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(8_000) });
  if (!response.ok || !response.headers.get("content-type")?.toLowerCase().includes("text/html")) {
    throw new Error(`빙그레 공식 페이지 응답 오류 (${response.status})`);
  }
  if (!response.body) throw new Error("빙그레 공식 페이지 본문이 없습니다.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_HTML_LENGTH) throw new Error("빙그레 공식 페이지 크기 제한 초과");
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder("utf-8").decode(bytes);
}

export async function collectBinggrae(fetcher: typeof fetch = fetch): Promise<CollectedProduct[]> {
  const articles = parseBinggraeList(await fetchOfficialHtml(LIST_URL, fetcher));
  if (articles.length === 0) throw new Error("빙그레 목록 구조를 확인할 수 없습니다.");
  const products: CollectedProduct[] = [];
  let attempted = 0;
  let failed = 0;
  for (const article of articles) {
    if (!productNameFromTitle(article.title)) continue;
    attempted++;
    try {
      const detail = await fetchOfficialHtml(article.url, fetcher);
      const product = parseBinggraeDetail(detail, article);
      if (product) products.push(product);
    } catch {
      failed++;
      console.warn("binggrae:detail-failed", article.id);
    }
  }
  if (attempted > 0 && failed === attempted) throw new Error("빙그레 상세 자료를 모두 읽지 못했습니다.");
  return products;
}
