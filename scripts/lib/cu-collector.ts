import { normalizeProductName } from "../../src/lib/normalize-product-name.ts";

const CU_ORIGIN = "https://cu.bgfretail.com";
const CU_CATALOG_URL = `${CU_ORIGIN}/product/product.do?category=product&depth2=4&sf=N`;

export const CU_CATEGORIES = [
  { code: "10", label: "간편식사", category: "convenience" },
  { code: "20", label: "즉석조리", category: "convenience" },
  { code: "30", label: "과자류", category: "convenience" },
  { code: "40", label: "아이스크림", category: "convenience" },
  { code: "50", label: "식품", category: "convenience" },
  { code: "60", label: "음료", category: "convenience" },
  { code: "70", label: "생활용품", category: "convenience" },
] as const;

export type CuCandidate = {
  slug: string;
  brand: "CU";
  name: string;
  normalizedName: string;
  category: string;
  subCategory: string;
  productType: "new";
  price: null;
  retailer: "CU";
  releaseDate: null;
  announcedDate: string;
  description: string;
  sourceUrl: string;
  sourceType: "official_site";
  imageUrl: string | null;
};

function textOnly(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function extractCuNewProducts(html: string, category: typeof CU_CATEGORIES[number], checkedAt: string): CuCandidate[] {
  const candidates: CuCandidate[] = [];
  for (const match of html.matchAll(/<li\s+class=["']prod_list["'][^>]*>([\s\S]*?)<\/li>/gi)) {
    const item = match[1];
    if (!/<span\s+class=["']new["'][^>]*>/i.test(item)) continue;
    const id = item.match(/onclick=["']view\((\d+)\)/i)?.[1];
    const rawName = item.match(/<div\s+class=["']name["'][^>]*>[\s\S]*?<p>([\s\S]*?)<\/p>/i)?.[1];
    const rawImageUrl = item.match(/<div\s+class=["']prod_img["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i)?.[1];
    if (!id || !rawName) continue;
    const name = textOnly(rawName);
    const normalizedName = normalizeProductName(name);
    if (!normalizedName) continue;
    candidates.push({
      slug: `cu-${id}`,
      brand: "CU",
      name,
      normalizedName,
      category: category.category,
      subCategory: category.label,
      productType: "new",
      price: null,
      retailer: "CU",
      releaseDate: null,
      announcedDate: checkedAt.slice(0, 10),
      description: `CU 공식 전체상품의 ${category.label} 최신등록순에서 NEW 배지가 확인된 상품`,
      sourceUrl: `${CU_ORIGIN}/product/view.do?category=product&gdIdx=${id}`,
      sourceType: "official_site",
      imageUrl: rawImageUrl ? new URL(rawImageUrl, CU_ORIGIN).href : null,
    });
  }
  return candidates;
}

function requestBody(categoryCode: string, pageIndex: number) {
  return new URLSearchParams({
    pageIndex: String(pageIndex),
    searchMainCategory: categoryCode,
    searchSubCategory: "",
    listType: "0",
    searchCondition: "setC",
    searchUseYn: "N",
    gdIdx: "0",
    codeParent: categoryCode,
  });
}

export async function collectCu(checkedAt = new Date().toISOString(), fetcher: typeof fetch = fetch) {
  const products: CuCandidate[] = [];
  for (const category of CU_CATEGORIES) {
    for (let page = 1; page <= 10; page++) {
      const response = await fetcher(`${CU_ORIGIN}/product/productAjax.do`, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          "user-agent": "OneulSinsang/1.0 (+non-commercial product index)",
          referer: CU_CATALOG_URL,
        },
        body: requestBody(category.code, page),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`CU ${category.label} 목록 HTTP ${response.status}`);
      const html = await response.text();
      const pageProducts = extractCuNewProducts(html, category, checkedAt);
      products.push(...pageProducts);

      const hasMore = /class=["']prodListBtn-w["']/i.test(html);
      const itemCount = [...html.matchAll(/<li\s+class=["']prod_list["']/gi)].length;
      if (!hasMore || itemCount === 0 || pageProducts.length === 0) break;
    }
  }
  return [...new Map(products.map(product => [product.slug, product])).values()];
}
