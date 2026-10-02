import { extractCommerce } from "./commerce.ts";

const ORIGIN = "https://www.orionworld.com";
const LIST_URL = `${ORIGIN}/board/list/87`;
const MAX_ARTICLES = 10;
const MAX_HTML_BYTES = 1_000_000;

export type OrionProduct = {
  slug: string;
  brand: "오리온";
  name: string;
  normalizedName: string;
  category: "snack";
  productType: "new";
  price: number | null;
  retailer: string | null;
  releaseDate: null;
  announcedDate: string;
  description: string;
  sourceUrl: string;
  imageUrl: string | null;
  emoji: "🍪";
};

type Article = { id: string; date: string; url: string };

function decodeHtml(value: string) {
  const named: Record<string, string> = {
    amp: "&", quot: '"', apos: "'", nbsp: " ", lt: "<", gt: ">",
    lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", hellip: "…",
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
  const companyAnnouncement = title.split("오리온,")[1];
  if (!companyAnnouncement) return null;
  const match = companyAnnouncement.match(/^\s*(?:신제품\s*)?[‘']([^’']{2,80})[’']\s*출시/);
  return match?.[1]?.trim() || null;
}

function isSnack(name: string) {
  return /포카칩|오감자|고래밥|꼬북칩|초코파이|미쯔|초코칩|그래놀라|핫브레이크|스낵|과자|쿠키|칩|카스타드|마이구미|후레쉬베리/.test(name);
}

export function parseOrionList(html: string): Article[] {
  const list = html.match(/<div\s+class=["']list-wrap["'][^>]*>([\s\S]*?)<\/ul>/)?.[1];
  if (!list) return [];
  return [...list.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map(([, row]) => {
    const id = row.match(/href=["']\/board\/view\/87\?boardno=(\d+)[^"']*["']/)?.[1];
    const date = row.match(/<span\s+class=["']date["'][^>]*>\s*(\d{4}\.\d{2}\.\d{2})\s*<\/span>/)?.[1];
    if (!id || !date) return null;
    return { id, date: date.replaceAll(".", "-"), url: `${ORIGIN}/board/view/87?boardno=${id}` };
  }).filter((article): article is Article => article !== null).slice(0, MAX_ARTICLES);
}

export function parseOrionDetail(html: string, article: Article): OrionProduct | null {
  const view = html.match(/<div\s+class=["']press-view["'][^>]*>([\s\S]*?)<div\s+class=["']btn-wrap["']/)?.[1];
  if (!view) return null;
  const title = plainText(view.match(/<h4>([\s\S]*?)<\/h4>/)?.[1] ?? "");
  const date = view.match(/<p\s+class=["']date["'][^>]*>[\s\S]*?(\d{4}-\d{2}-\d{2})\s*<\/p>/)?.[1];
  if (!title || date !== article.date) return null;
  const name = productNameFromTitle(title);
  if (!name || !isSnack(name)) return null;
  const body = view.match(/<div\s+class=["']content["'][^>]*>([\s\S]*?)<\/div>/)?.[1];
  if (!body) return null;
  const description = plainText(body).slice(0, 280);
  const commerce = extractCommerce(`${title} ${plainText(body)}`);
  if (!description.includes(name)) return null;
  const imageSource = body.match(/<img\b[^>]*\bsrc=(["'])(.*?)\1/i)?.[2];
  let imageUrl: string | null = null;
  if (imageSource) {
    try {
      const url = new URL(decodeHtml(imageSource), ORIGIN);
      if (url.origin === ORIGIN && url.pathname.startsWith("/upload/editor/") && !url.search && !url.hash) imageUrl = url.href;
    } catch { /* Malformed source image: retain the emoji fallback. */ }
  }
  return {
    slug: `orion-${article.id}`,
    brand: "오리온",
    name,
    normalizedName: name.normalize("NFKC").toLocaleLowerCase("ko-KR").replace(/[^a-z0-9가-힣]/g, ""),
    category: "snack",
    productType: "new",
    price: commerce.price,
    retailer: commerce.retailer,
    releaseDate: null,
    announcedDate: article.date,
    description: `공식 발표 ${article.date} · ${description}`,
    sourceUrl: article.url,
    imageUrl,
    emoji: "🍪",
  };
}

async function fetchOfficialHtml(url: string, fetcher: typeof fetch) {
  const response = await fetcher(url, { redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(8_000) });
  if (!response.ok || !response.headers.get("content-type")?.toLowerCase().includes("text/html") || !response.body) {
    throw new Error(`오리온 공식 페이지 응답 오류 (${response.status})`);
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytesRead = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      if (bytesRead > MAX_HTML_BYTES) throw new Error("오리온 공식 페이지 크기 제한 초과");
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(bytesRead);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder("utf-8").decode(bytes);
}

export async function collectOrion(fetcher: typeof fetch = fetch): Promise<OrionProduct[]> {
  const articles = parseOrionList(await fetchOfficialHtml(LIST_URL, fetcher));
  if (articles.length === 0) throw new Error("오리온 목록 구조를 확인할 수 없습니다.");
  const products: OrionProduct[] = [];
  let failed = 0;
  for (const article of articles) {
    try {
      const detail = await fetchOfficialHtml(article.url, fetcher);
      const product = parseOrionDetail(detail, article);
      if (product) products.push(product);
    } catch {
      failed++;
      console.warn("orion:detail-failed", article.id);
    }
  }
  if (failed === articles.length) throw new Error("오리온 상세 자료를 모두 읽지 못했습니다.");
  return products;
}
