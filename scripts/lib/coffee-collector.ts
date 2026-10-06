import { createHash } from "node:crypto";
import { normalizeProductName } from "../../src/lib/normalize-product-name.ts";
import type { CoffeeBrandSource, CoffeeSourceKind } from "../../src/data/coffee-sources.ts";
import type { Product, ProductType } from "../../src/types/product.ts";

const BLOCKED_HOSTS = /(^|\.)(kakao\.com|daum\.net|kakaocorp\.com|daumcorp\.com|kakaosecure\.net|dakao\.io|9rum\.cc|onkakao\.net|daumkakao\.io|daumkakao\.com|daumtools\.com)$/i;
const GENERIC_NAMES = /^(new|menu|product|products|신메뉴|메뉴|상품|전체|자세히\s*보기|view\s*more)$/i;
const PRODUCT_WORDS = /라떼|티|커피|에이드|스무디|주스|프라페|아메리카노|에스프레소|콜드\s*브루|케이크|빵|샌드|쿠키|베이글|텀블러|머그|컵|키링|보틀|드립백|원두|블렌드|캡슐|아이스크림|젤라또|latte|tea|coffee|ade|smoothie|juice|frappe|tumbler|mug|bottle|drip\s*bag|blend/i;

export type CoffeeCandidate = Pick<Product, "id"|"brand"|"name"|"normalizedName"|"category"|"subCategory"|"productType"|"currency"|"sourceUrl"|"sourceType"|"firstDetectedAt"|"lastCheckedAt"|"description"|"availabilityStatus"|"availabilityCheckedAt"|"isActive"|"createdAt"|"updatedAt">;

function textOnly(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/&(?:nbsp|amp|quot|#39);/gi, " ").replace(/\s+/g, " ").trim();
}

function productType(name: string): ProductType {
  if (/한정|limited|콜라보/i.test(name)) return "limited";
  if (/시즌|season/i.test(name)) return "seasonal";
  return "new";
}

function subCategory(kind: CoffeeSourceKind, name: string) {
  if (kind === "md" || /텀블러|머그|컵|키링|굿즈|보틀/i.test(name)) return "MD";
  if (/원두|드립백|캡슐|블렌드/i.test(name)) return "원두·캡슐";
  if (/케이크|빵|샌드|디저트|쿠키|베이글/i.test(name)) return "푸드";
  return "음료";
}

function collectJsonLd(value: unknown, output: string[]) {
  if (Array.isArray(value)) return value.forEach(item => collectJsonLd(item, output));
  if (!value || typeof value !== "object") return;
  const item = value as Record<string, unknown>;
  const types = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
  if (types.some(type => type === "Product" || type === "MenuItem") && typeof item.name === "string") output.push(item.name);
  Object.values(item).forEach(child => collectJsonLd(child, output));
}

function extractKnownOfficialCards(html: string, sourceUrl: string, checkedAt: string) {
  const names: string[] = [];
  const url = new URL(sourceUrl, "https://example.com");
  if (url.hostname === "www.ediya.com" && url.pathname.endsWith("/drink.html")) {
    const recommended = html.match(/<ul class=["']pro_n bxSlider["']>([\s\S]*?)<\/ul>/i)?.[1] ?? "";
    for (const match of recommended.matchAll(/<p>\s*<a[^>]*>([\s\S]*?)<\/a>\s*<\/p>/gi)) names.push(textOnly(match[1]));
  }
  if (url.hostname === "paikdabang.com" && url.pathname.includes("menu_new")) {
    const start = html.indexOf('<div class="menu_slider new_menu_slider">');
    const end = html.indexOf("<!-- 고메", start);
    const currentSlider = start >= 0 ? html.slice(start, end > start ? end : start + 100_000) : "";
    for (const match of currentSlider.matchAll(/<p class=["']best_tit["']>([\s\S]*?)<\/p>/gi)) names.push(textOnly(match[1]));
  }
  if (url.hostname === "www.hollys.co.kr" && url.pathname.endsWith("/md.do")) {
    const checked = new Date(checkedAt);
    for (const match of html.matchAll(/menuEtc_(\d{8})\d*\.[a-z]+["']\s+alt=["']([^"']+)["']/gi)) {
      const date = new Date(`${match[1].slice(0,4)}-${match[1].slice(4,6)}-${match[1].slice(6,8)}T00:00:00Z`);
      if (Number.isFinite(date.getTime()) && checked.getTime() - date.getTime() <= 120 * 86_400_000) names.push(textOnly(match[2]));
    }
  }
  return names;
}

export function extractOfficialProductNames(html: string, sourceUrl = "", checkedAt = new Date().toISOString()) {
  const structuredNames: string[] = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { collectJsonLd(JSON.parse(match[1]), structuredNames); } catch { /* 공식 페이지의 잘못된 JSON-LD는 건너뜁니다. */ }
  }
  const markedNames: string[] = [];
  const markedBlocks = [
    ...html.matchAll(/<(?:li|article|div)[^>]*class=["'][^"']*\bnew\b[^"']*["'][^>]*>([\s\S]{0,600}?)<\/(?:li|article|div)>/gi),
    ...html.matchAll(/<(?:li|article|div)[^>]*>([\s\S]{0,120}?(?:>\s*NEW\s*<|>\s*신메뉴\s*<)[\s\S]{0,480}?)<\/(?:li|article|div)>/gi),
  ];
  for (const match of markedBlocks) {
    const block = match[1];
    for (const title of block.matchAll(/<(?:h[1-6]|strong|b|em|span|a)[^>]*>([\s\S]{2,120}?)<\/(?:h[1-6]|strong|b|em|span|a)>/gi)) {
      const name = textOnly(title[1]).replace(/^NEW\s*/i, "");
      if (PRODUCT_WORDS.test(name)) markedNames.push(name);
    }
  }
  return [...new Set([...structuredNames, ...markedNames, ...extractKnownOfficialCards(html, sourceUrl, checkedAt)].map(textOnly).filter(name => name.length >= 2 && name.length <= 80 && !GENERIC_NAMES.test(name) && !/^\d[\d,.]*원?$/.test(name)))];
}

export function toCoffeeCandidates(source: CoffeeBrandSource, kind: CoffeeSourceKind, sourceUrl: string, names: string[], checkedAt: string): CoffeeCandidate[] {
  return names.map((name): CoffeeCandidate => {
    const normalizedName = normalizeProductName(name);
    const suffix = createHash("sha256").update(`${source.id}:${normalizedName}`).digest("hex").slice(0, 12);
    return {
      id:`coffee-${source.id}-${suffix}`, brand:source.brand, name, normalizedName, category:"cafe", subCategory:subCategory(kind, name),
      productType:productType(name), currency:"KRW", sourceUrl, sourceType:"official_site", firstDetectedAt:checkedAt,
      lastCheckedAt:checkedAt, description:`${source.brand} 공식 상품 목록에서 확인된 ${name} 신상품`, availabilityStatus:"on_sale",
      availabilityCheckedAt:checkedAt, isActive:true, createdAt:checkedAt, updatedAt:checkedAt,
    };
  }).filter(candidate => candidate.normalizedName.length >= 2);
}

export async function collectCoffeeSource(source: CoffeeBrandSource, checkedAt: string, fetcher: typeof fetch = fetch) {
  const channels = source.channels.filter(channel => channel.kind === "menu" || channel.kind === "md" || channel.kind === "shop");
  const results = await Promise.allSettled(channels.map(async channel => {
    const url = new URL(channel.url);
    if (BLOCKED_HOSTS.test(url.hostname)) throw new Error("제한 도메인");
    const response = await fetcher(url, { headers:{ "user-agent":"OneulSinsang/1.0 (+non-commercial product index)" }, signal:AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const names = extractOfficialProductNames(await response.text(), channel.url, checkedAt);
    return toCoffeeCandidates(source, channel.kind, channel.url, names, checkedAt);
  }));
  const candidates = results.flatMap(result => result.status === "fulfilled" ? result.value : []);
  const verifiedUrls = results.flatMap((result, index) => result.status === "fulfilled" && result.value.length > 0 ? [channels[index].url] : []);
  return { candidates:[...new Map(candidates.map(candidate => [candidate.normalizedName, candidate])).values()], verifiedUrls, checked:results.filter(result => result.status === "fulfilled").length, failed:results.filter(result => result.status === "rejected").length };
}
