import { normalizeProductName } from "../../src/lib/normalize-product-name.ts";

export type ConvenienceCandidate = {
  slug: string;
  brand: string;
  name: string;
  normalizedName: string;
  category: "convenience";
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

function clean(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/&amp;/gi, "&").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
}

export function extractSevenElevenNewProducts(html: string, checkedAt: string): ConvenienceCandidate[] {
  const products: ConvenienceCandidate[] = [];
  const items = html.split(/<ul class=["']tag_list_01["']>/i).slice(1);
  for (const item of items) {
    if (!/class=["']ico_tag_03["'][^>]*>\s*신상품/i.test(item)) continue;
    const id = item.match(/fncGoView\('([^']+)'\)/i)?.[1];
    const rawName = item.match(/<div class=["']name["'][^>]*>([\s\S]*?)<\/div>/i)?.[1];
    const rawImage = item.match(/<img[^>]+src=["']([^"']+)["'][^>]+alt=["'](?!디폴트 이미지)/i)?.[1];
    if (!id || !rawName) continue;
    const name = clean(rawName);
    products.push({
      slug: `seven-eleven-${id}`, brand: "세븐일레븐", name, normalizedName: normalizeProductName(name),
      category: "convenience", subCategory: "신상품", productType: "new", price: null, retailer: "세븐일레븐",
      releaseDate: null, announcedDate: checkedAt.slice(0, 10),
      description: "세븐일레븐 공식 PB상품/신상품 목록의 신상품 탭에서 확인된 상품",
      sourceUrl: "https://www.7-eleven.co.kr/product/7prodList.asp", sourceType: "official_site",
      imageUrl: rawImage ? new URL(rawImage, "https://www.7-eleven.co.kr").href : null,
    });
  }
  return products;
}

export async function collectSevenEleven(checkedAt = new Date().toISOString(), fetcher: typeof fetch = fetch) {
  const response = await fetcher("https://www.7-eleven.co.kr/product/presentList.asp", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", "user-agent": "OneulSinsang/1.0 (+non-commercial product index)" },
    body: new URLSearchParams({ pTab: "8" }), signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`세븐일레븐 신상품 HTTP ${response.status}`);
  const html = await response.text();
  if (!html.includes("PB상품/신상품") || !html.includes('value="8"')) throw new Error("세븐일레븐 신상품 페이지 구조 확인 실패");
  return extractSevenElevenNewProducts(html, checkedAt);
}

export function extractEmart24NewProducts(html: string, checkedAt: string, section: string, sourceUrl: string): ConvenienceCandidate[] {
  const products: ConvenienceCandidate[] = [];
  const items = html.split(/<div class=["']itemWrap["']>/i).slice(1);
  for (const item of items) {
    if (!/<span class=["']floatL["']>\s*NEW\s*<\/span>/i.test(item)) continue;
    const rawImage = item.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
    const rawName = item.match(/<div class=["']itemtitle["']>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i)?.[1];
    if (!rawName) continue;
    const name = clean(rawName);
    const productCode = rawImage?.match(/\/([0-9]{8,})\.[a-z]+(?:\?|$)/i)?.[1] ?? normalizeProductName(name);
    products.push({
      slug: `emart24-${productCode}`, brand: "이마트24", name, normalizedName: normalizeProductName(name),
      category: "convenience", subCategory: section, productType: "new", price: null, retailer: "이마트24",
      releaseDate: null, announcedDate: checkedAt.slice(0, 10),
      description: `이마트24 공식 ${section} 목록에서 NEW 표시가 확인된 상품`, sourceUrl, sourceType: "official_site",
      imageUrl: rawImage ? new URL(rawImage, "https://emart24.co.kr").href : null,
    });
  }
  return products;
}

export async function collectEmart24(checkedAt = new Date().toISOString(), fetcher: typeof fetch = fetch) {
  const sections = [{ label: "차별화 상품", url: "https://emart24.co.kr/goods/pl" }, { label: "Fresh Food", url: "https://emart24.co.kr/goods/ff" }];
  const results = await Promise.all(sections.map(async section => {
    const response = await fetcher(section.url, { headers: { "user-agent": "OneulSinsang/1.0 (+non-commercial product index)" }, signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error(`이마트24 ${section.label} HTTP ${response.status}`);
    const html = await response.text();
    if (!html.includes("itemList") || !html.includes("최신순")) throw new Error(`이마트24 ${section.label} 페이지 구조 확인 실패`);
    return extractEmart24NewProducts(html, checkedAt, section.label, section.url);
  }));
  return results.flat();
}
