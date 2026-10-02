const ORIGIN = "https://samyangfoods.com";
const LIST_URL = `${ORIGIN}/kor/publicity/press/list.do?searchCateCd=035002&pageUnit=20`;
const MAX_ARTICLES = 20;
const MAX_HTML_BYTES = 1_500_000;

export type SamyangProduct = {
  slug: string;
  brand: "삼양식품";
  name: string;
  normalizedName: string;
  category: "ramen" | "meal" | "etc";
  productType: "new";
  price: null;
  retailer: "삼양식품";
  releaseDate: null;
  announcedDate: string;
  description: string;
  sourceUrl: string;
  imageUrl: string | null;
  emoji: "🍜" | "🍝" | "🍽️" | "🎁";
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
  if (!title.startsWith("삼양식품") || !/출시/.test(title) || /日 신제품|일본 전용|해외 전용|출시\s*\d+\s*(?:일|개월|년)\s*맞/.test(title)) return null;
  return title.match(/[‘'“"]([^’'”"]{2,80})[’'”"]\s*(?:한정\s*)?출시/)?.[1]?.trim() ?? null;
}

export function parseSamyangList(html: string): Article[] {
  const tbody = html.match(/<div\s+class=["']board-list["'][^>]*>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/)?.[1];
  if (!tbody) return [];
  return [...tbody.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(([, row]) => {
    if (!/제품뉴스/.test(row)) return null;
    const id = row.match(/fnView\(['"]\.\/view\.do['"],\s*(\d+)\)/)?.[1];
    const title = plainText(row.match(/<td\s+class=["']subject["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/)?.[1] ?? "");
    const date = row.match(/<td>\s*(\d{4}\.\d{2}\.\d{2})\s*<\/td>/)?.[1];
    if (!id || !title || !date) return null;
    return { id, title, date: date.replaceAll(".", "-"), url: `${ORIGIN}/kor/publicity/press/view.do?seq=${id}` };
  }).filter((article): article is Article => article !== null).slice(0, MAX_ARTICLES);
}

export function parseSamyangDetail(html: string, article: Article): SamyangProduct | null {
  const board = html.match(/<div\s+class=["']board-view["'][^>]*>([\s\S]*?)<!--\s*\/\/board-view\s*-->/)?.[1];
  if (!board) return null;
  const title = plainText(board.match(/<p\s+class=["']title["'][^>]*>([\s\S]*?)<\/p>/)?.[1] ?? "");
  const date = board.match(/<p\s+class=["']date["'][^>]*>\s*(\d{4}\.\d{2}\.\d{2})\s*<\/p>/)?.[1]?.replaceAll(".", "-");
  if (title !== article.title || date !== article.date) return null;
  const name = productNameFromTitle(title);
  if (!name) return null;
  const content = board.split(/<div\s+class=["']con["'][^>]*>/)[1];
  if (!content || !plainText(content).includes(name)) return null;
  let imageUrl: string | null = null;
  for (const match of content.matchAll(/<img\b[^>]*\bsrc=(["'])(.*?)\1/gi)) {
    try {
      const url = new URL(decodeHtml(match[2]), ORIGIN);
      if (url.origin === ORIGIN && url.pathname.startsWith("/upload/") && !url.search && !url.hash) {
        imageUrl = url.href;
        break;
      }
    } catch { /* Invalid or embedded image: keep the emoji fallback. */ }
  }
  const category = /선물세트/.test(name) ? "etc" : /라면|큰컵|짜르르|불닭|볶음면/.test(name) ? "ramen" : /파스타/.test(name) ? "meal" : "etc";
  return {
    slug: `samyang-${article.id}`,
    brand: "삼양식품",
    name,
    normalizedName: name.normalize("NFKC").toLocaleLowerCase("ko-KR").replace(/[^a-z0-9가-힣]/g, ""),
    category,
    productType: "new",
    price: null,
    retailer: "삼양식품",
    releaseDate: null,
    announcedDate: article.date,
    description: `공식 발표 ${article.date} · ${title}`,
    sourceUrl: article.url,
    imageUrl,
    emoji: /선물세트/.test(name) ? "🎁" : category === "ramen" ? "🍜" : category === "meal" ? "🍝" : "🍽️",
  };
}

async function fetchOfficialHtml(url: string, fetcher: typeof fetch) {
  const response = await fetcher(url, { redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(8_000) });
  if (!response.ok || !response.headers.get("content-type")?.toLowerCase().includes("text/html") || !response.body) {
    throw new Error(`삼양식품 공식 페이지 응답 오류 (${response.status})`);
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytesRead = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      if (bytesRead > MAX_HTML_BYTES) throw new Error("삼양식품 공식 페이지 크기 제한 초과");
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(bytesRead);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder("utf-8").decode(bytes);
}

export async function collectSamyang(fetcher: typeof fetch = fetch): Promise<SamyangProduct[]> {
  const articles = parseSamyangList(await fetchOfficialHtml(LIST_URL, fetcher));
  if (articles.length === 0) throw new Error("삼양식품 목록 구조를 확인할 수 없습니다.");
  const products: SamyangProduct[] = [];
  let attempted = 0;
  let failed = 0;
  for (const article of articles) {
    if (!productNameFromTitle(article.title)) continue;
    attempted++;
    try {
      const detail = await fetchOfficialHtml(article.url, fetcher);
      const product = parseSamyangDetail(detail, article);
      if (product) products.push(product);
    } catch {
      failed++;
      console.warn("samyang:detail-failed", article.id);
    }
  }
  if (attempted > 0 && failed === attempted) throw new Error("삼양식품 상세 자료를 모두 읽지 못했습니다.");
  return products;
}
