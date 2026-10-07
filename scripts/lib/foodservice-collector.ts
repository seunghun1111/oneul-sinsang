import { normalizeProductName } from "../../src/lib/normalize-product-name.ts";

export type FoodserviceCategory = "burger" | "pizza" | "chicken";

export type FoodserviceCandidate = {
  slug: string;
  brand: string;
  name: string;
  normalizedName: string;
  category: FoodserviceCategory;
  subCategory: string;
  productType: "new";
  price: null;
  retailer: string;
  releaseDate: null;
  announcedDate: string;
  description: string;
  sourceUrl: string;
  sourceType: "official_site";
  imageUrl: string | null;
};

const USER_AGENT = "OneulSinsang/1.0 (+non-commercial product index)";

function clean(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/&(?:#39|apos);/gi, "'").replace(/&quot;/gi, '"').replace(/&amp;/gi, "&").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
}

function unique(products: FoodserviceCandidate[]) {
  return [...new Map(products.map(product => [product.slug, product])).values()];
}

export function extractLotteriaNewProducts(html: string, checkedAt: string): FoodserviceCandidate[] {
  const sourceUrl = "https://www.lotteeatz.com/brand/ria";
  const products: FoodserviceCandidate[] = [];
  for (const item of html.split(/<li(?:\s[^>]*)?>/i).slice(1)) {
    if (!/aria-label=["']신메뉴["'][\s\S]*?>\s*NEW\s*</i.test(item)) continue;
    const id = item.match(/<div class=["']mn-card-body["'] id=["']([^"']+)/i)?.[1];
    const rawName = item.match(/<p class=["']mn-card-name["']>([\s\S]*?)<\/p>/i)?.[1];
    const rawImage = item.match(/<img[^>]+src=["']([^"']+)["'][^>]+class=["']mn-card-img/i)?.[1];
    if (!id || !rawName) continue;
    const name = clean(rawName);
    products.push({
      slug: `lotteria-${id.toLowerCase()}`, brand: "롯데리아", name, normalizedName: normalizeProductName(name),
      category: "burger", subCategory: "신메뉴", productType: "new", price: null, retailer: "롯데리아",
      releaseDate: null, announcedDate: checkedAt.slice(0, 10), description: "롯데리아 공식 메뉴의 NEW 배지에서 확인된 상품",
      sourceUrl, sourceType: "official_site", imageUrl: rawImage ? clean(rawImage) : null,
    });
  }
  return unique(products);
}

export function extractDominosNewProducts(html: string, checkedAt: string): FoodserviceCandidate[] {
  const products: FoodserviceCandidate[] = [];
  for (const item of html.split(/<li(?:\s[^>]*)?>/i).slice(1)) {
    if (!/<span class=["']label sale["']>\s*NEW\s*<\/span>/i.test(item)) continue;
    const id = item.match(/code_01=([A-Z0-9]+)/i)?.[1];
    const rawName = item.match(/<div class=["']subject["']>([\s\S]*?)<div class=["']label-box["']>/i)?.[1];
    const rawImage = item.match(/<img[^>]+data-src=["']([^"']+)["']/i)?.[1];
    if (!id || !rawName) continue;
    const name = clean(rawName);
    products.push({
      slug: `dominos-${id.toLowerCase()}`, brand: "도미노피자", name, normalizedName: normalizeProductName(name),
      category: "pizza", subCategory: "피자", productType: "new", price: null, retailer: "도미노피자",
      releaseDate: null, announcedDate: checkedAt.slice(0, 10), description: "도미노피자 공식 피자 메뉴의 NEW 배지에서 확인된 상품",
      sourceUrl: `https://web.dominos.co.kr/goods/detail?dsp_ctgr=C0101&code_01=${id}`, sourceType: "official_site",
      imageUrl: rawImage ? clean(rawImage) : null,
    });
  }
  return unique(products);
}

export function extractGoobneNewProducts(html: string, checkedAt: string): FoodserviceCandidate[] {
  const sourceUrl = "https://www.goobne.co.kr/main";
  const products: FoodserviceCandidate[] = [];
  for (const item of html.split(/<div class=["']swiper-slide["']>/i).slice(1)) {
    if (!/<span>\s*NEW\s*<\/span>/i.test(item)) continue;
    const id = item.match(/menu_view\(&quot;([^&]+)&quot;\)/i)?.[1] ?? item.match(/menu_view\(["']([^"']+)/i)?.[1];
    const rawName = item.match(/<h2>([\s\S]*?)<\/h2>/i)?.[1];
    const rawImage = item.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
    if (!id || !rawName) continue;
    const cleanedName = clean(rawName);
    if (/^\[Event\]/i.test(cleanedName)) continue;
    const name = cleanedName.replace(/^\(New\)\s*/i, "");
    const isPizza = /피자/.test(name);
    products.push({
      slug: `goobne-${id}`, brand: "굽네", name, normalizedName: normalizeProductName(name),
      category: isPizza ? "pizza" : "chicken", subCategory: isPizza ? "피자" : /베이크/.test(name) ? "사이드" : "치킨",
      productType: "new", price: null, retailer: "굽네", releaseDate: null, announcedDate: checkedAt.slice(0, 10),
      description: "굽네 공식 메인 신제품 영역의 NEW 배지에서 확인된 상품", sourceUrl, sourceType: "official_site",
      imageUrl: rawImage ? clean(rawImage) : null,
    });
  }
  return unique(products);
}

async function fetchHtml(url: string, fetcher: typeof fetch, encoding = "utf-8") {
  const response = await fetcher(url, { headers: { "user-agent": USER_AGENT }, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`${new URL(url).hostname} HTTP ${response.status}`);
  if (encoding === "utf-8") return response.text();
  return new TextDecoder(encoding).decode(await response.arrayBuffer());
}

export async function collectLotteria(checkedAt = new Date().toISOString(), fetcher: typeof fetch = fetch) {
  const html = await fetchHtml("https://www.lotteeatz.com/brand/ria", fetcher);
  if (!html.includes("mn-card") || !html.includes("추천메뉴")) throw new Error("롯데리아 메뉴 페이지 구조 확인 실패");
  return extractLotteriaNewProducts(html, checkedAt);
}

export async function collectDominos(checkedAt = new Date().toISOString(), fetcher: typeof fetch = fetch) {
  const html = await fetchHtml("https://web.dominos.co.kr/goods/list?dsp_ctgr=C0101", fetcher, "euc-kr");
  if (!html.includes("prd-cont") || !html.includes("피자")) throw new Error("도미노피자 메뉴 페이지 구조 확인 실패");
  return extractDominosNewProducts(html, checkedAt);
}

export async function collectGoobne(checkedAt = new Date().toISOString(), fetcher: typeof fetch = fetch) {
  const html = await fetchHtml("https://www.goobne.co.kr/main", fetcher);
  if (!html.includes("신제품") || !html.includes("slide-info")) throw new Error("굽네 신제품 페이지 구조 확인 실패");
  return extractGoobneNewProducts(html, checkedAt);
}
