import { normalizeProductName } from "../../src/lib/normalize-product-name.ts";

export type IcecreamCandidate = {
  slug: string; brand: string; name: string; normalizedName: string; category: "icecream"; subCategory: string;
  productType: "new"; currency: "KRW"; price: null; retailer: string; sourceUrl: string; sourceType: "official_site";
  releaseDate: string; announcedDate: string; firstDetectedAt: string; lastCheckedAt: string; description: string;
  availabilityStatus: "on_sale"; availabilityCheckedAt: string; isActive: true; createdAt: string; updatedAt: string;
  imageUrl: string | null;
};

const USER_AGENT = "OneulSinsang/1.0 (+non-commercial product index)";

function clean(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/&(?:#58|colon);/gi, ":").replace(/&amp;/gi, "&").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
}

export function extractBaskinRobbinsAnnouncement(html: string) {
  for (const row of html.split(/<tr[^>]*class=["']board-list__table-list["'][^>]*>/i).slice(1)) {
    const title = clean(row.match(/board-list__table-title[\s\S]*?<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i)?.[2] ?? "");
    if (!/\[\d{1,2}월 FOM\].*아이스크림 출시/i.test(title)) continue;
    const sourcePath = row.match(/board-list__table-title[\s\S]*?<a[^>]+href=["']([^"']+)/i)?.[1];
    const date = row.match(/board-list__table-date["'][^>]*>\s*(\d{4}\.\d{2}\.\d{2})/i)?.[1]?.replaceAll(".", "-");
    if (sourcePath && date) return { sourceUrl: new URL(sourcePath, "https://www.baskinrobbins.co.kr").href, date, title };
  }
  return null;
}

export function extractBaskinRobbinsNewProducts(fomHtml: string, announcement: { sourceUrl: string; date: string }, checkedAt: string): IcecreamCandidate[] {
  const products: IcecreamCandidate[] = [];
  const section = fomHtml.match(/<article class=["']menu-fom-new["'][\s\S]*?<\/article>/i)?.[0] ?? "";
  for (const slide of section.split(/<div class=["']swiper-slide["']>/i).slice(1)) {
    const id = slide.match(/menu\/view\.php\?seq=(\d+)/i)?.[1];
    const name = clean(slide.match(/<h5 class=["']menu-fom-new__name["']>([\s\S]*?)<\/h5>/i)?.[1] ?? "");
    const imagePath = slide.match(/<img[^>]+src=["']([^"']+)["'][^>]+menu-fom-new__image/i)?.[1];
    if (!id || !name) continue;
    products.push({
      slug: `baskinrobbins-${id}`, brand: "배스킨라빈스", name, normalizedName: normalizeProductName(name),
      category: "icecream", subCategory: "아이스크림", productType: "new", currency: "KRW", price: null,
      retailer: "배스킨라빈스", sourceUrl: announcement.sourceUrl, sourceType: "official_site",
      releaseDate: announcement.date, announcedDate: announcement.date, firstDetectedAt: checkedAt, lastCheckedAt: checkedAt,
      description: "배스킨라빈스 공식 이달의 맛과 FOM 신제품 공지에서 확인된 아이스크림",
      availabilityStatus: "on_sale", availabilityCheckedAt: checkedAt, isActive: true,
      createdAt: checkedAt, updatedAt: checkedAt,
      imageUrl: imagePath ? new URL(imagePath, "https://www.baskinrobbins.co.kr").href : null,
    });
  }
  return products;
}

async function fetchHtml(url: string, fetcher: typeof fetch) {
  const response = await fetcher(url, { headers: { "user-agent": USER_AGENT }, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`${new URL(url).hostname} HTTP ${response.status}`);
  return response.text();
}

export async function collectBaskinRobbins(checkedAt = new Date().toISOString(), fetcher: typeof fetch = fetch) {
  const noticeHtml = await fetchHtml("https://www.baskinrobbins.co.kr/information-center/notice/list.php?page=1", fetcher);
  const announcement = extractBaskinRobbinsAnnouncement(noticeHtml);
  if (!announcement) throw new Error("배스킨라빈스 FOM 신제품 공지 확인 실패");
  const age = Date.parse(checkedAt) - Date.parse(`${announcement.date}T00:00:00+09:00`);
  if (age < 0 || age >= 30 * 86_400_000) return [];
  const fomHtml = await fetchHtml("https://www.baskinrobbins.co.kr/menu/fom.php", fetcher);
  if (!fomHtml.includes("menu-fom-new")) throw new Error("배스킨라빈스 이달의 맛 페이지 구조 확인 실패");
  return extractBaskinRobbinsNewProducts(fomHtml, announcement, checkedAt);
}
