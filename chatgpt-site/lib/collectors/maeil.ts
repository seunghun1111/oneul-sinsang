import { extractCommerce } from "./commerce.ts";

const ORIGIN = "https://www.maeil.com";
const LIST_URL = `${ORIGIN}/news/press.jsp`;
const MAX_ARTICLES = 12;
const MAX_HTML_BYTES = 1_000_000;

export type MaeilProduct = {
  slug: string;
  brand: "매일유업";
  name: string;
  normalizedName: string;
  category: "drink" | "dessert";
  productType: "new";
  price: number | null;
  retailer: string | null;
  releaseDate: null;
  announcedDate: string;
  description: string;
  sourceUrl: string;
  imageUrl: string | null;
  emoji: "🥤" | "🍨";
};

type Article = { id: string; title: string; date: string; url: string };

function decodeHtml(value: string) {
  const named: Record<string, string> = { amp: "&", quot: '"', apos: "'", nbsp: " ", lt: "<", gt: ">", lsquo: "‘", rsquo: "’" };
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
  if (/출시\s*\d+\s*(?:일|개월|년|주년)/.test(title)) return null;
  return title.match(/[‘'“"]([^’'”"]{2,80})[’'”"](?:\s*(?:\d+종|음료|신제품))*\s*출시/)?.[1]?.trim() ?? null;
}

function categoryFor(name: string): MaeilProduct["category"] | null {
  if (/요거트|푸딩|디저트|그릭/.test(name)) return "dessert";
  if (/음료|두유|우유|오트|라떼|커피|주스|퓨어틴|아몬드/.test(name)) return "drink";
  return null;
}

export function parseMaeilList(html: string): Article[] {
  const rows = [...html.matchAll(/<article\s+class=["']lst_isotope["'][^>]*>([\s\S]*?)<\/article>/g)];
  return rows.map(([, row]) => {
    const link = row.match(/<h1\s+class=["']wBk["'][^>]*>\s*<a\s+href=["']press_view\.jsp\?idx=(\d+)[^"']*["'][^>]*>([\s\S]*?)<\/a>/i);
    const date = row.match(/<p\s+class=["']writer["'][^>]*>[\s\S]*?<span>\s*(\d{4}\.\d{2}\.\d{2})\s*<\/span>/i)?.[1];
    if (!link || !date) return null;
    return { id: link[1], title: plainText(link[2]), date: date.replaceAll(".", "-"), url: `${ORIGIN}/news/press_view.jsp?idx=${link[1]}` };
  }).filter((article): article is Article => article !== null).slice(0, MAX_ARTICLES);
}

export function parseMaeilDetail(html: string, article: Article): MaeilProduct | null {
  const view = html.match(/<div\s+class=["']view ty-thumb["'][^>]*>([\s\S]*?)<footer\b/i)?.[1];
  if (!view) return null;
  const title = plainText(view.match(/<h1\s+class=["']h wBk["'][^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "");
  const date = view.match(/<p\s+class=["']data["'][^>]*>\s*(\d{4}\.\d{2}\.\d{2})/i)?.[1]?.replaceAll(".", "-");
  if (title !== article.title || date !== article.date) return null;
  const name = productNameFromTitle(title);
  if (!name) return null;
  const category = categoryFor(name);
  if (!category) return null;
  const content = view.match(/<section\s+class=["']cont["'][^>]*>([\s\S]*?)<\/section>/i)?.[1];
  if (!content) return null;
  const description = plainText(content).slice(0, 280);
  const commerce = extractCommerce(`${article.title} ${plainText(content)}`);
  if (!description.includes(name)) return null;
  const imageSource = view.match(/<div\s+class=["']thumb["'][^>]*>[\s\S]*?<img\b[^>]*\bsrc=(["'])(.*?)\1/i)?.[2];
  let imageUrl: string | null = null;
  if (imageSource) {
    try {
      const url = new URL(decodeHtml(imageSource), ORIGIN);
      if (url.origin === ORIGIN && url.pathname.startsWith("/UploadedFiles/press/") && !url.search && !url.hash) imageUrl = url.href;
    } catch { /* Invalid image: retain the emoji fallback. */ }
  }
  return {
    slug: `maeil-${article.id}`,
    brand: "매일유업",
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
    emoji: category === "drink" ? "🥤" : "🍨",
  };
}

async function fetchOfficialHtml(url: string, fetcher: typeof fetch) {
  const response = await fetcher(url, { redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(8_000) });
  if (!response.ok || !response.headers.get("content-type")?.toLowerCase().includes("text/html") || !response.body) {
    throw new Error(`매일유업 공식 페이지 응답 오류 (${response.status})`);
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytesRead = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      if (bytesRead > MAX_HTML_BYTES) throw new Error("매일유업 공식 페이지 크기 제한 초과");
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(bytesRead);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder("utf-8").decode(bytes);
}

export async function collectMaeil(fetcher: typeof fetch = fetch): Promise<MaeilProduct[]> {
  const articles = parseMaeilList(await fetchOfficialHtml(LIST_URL, fetcher));
  if (articles.length === 0) throw new Error("매일유업 목록 구조를 확인할 수 없습니다.");
  const products: MaeilProduct[] = [];
  let attempted = 0;
  let failed = 0;
  for (const article of articles) {
    if (!productNameFromTitle(article.title)) continue;
    attempted++;
    try {
      const detail = await fetchOfficialHtml(article.url, fetcher);
      const product = parseMaeilDetail(detail, article);
      if (product) products.push(product);
    } catch {
      failed++;
      console.warn("maeil:detail-failed", article.id);
    }
  }
  if (attempted > 0 && failed === attempted) throw new Error("매일유업 상세 자료를 모두 읽지 못했습니다.");
  return products;
}
