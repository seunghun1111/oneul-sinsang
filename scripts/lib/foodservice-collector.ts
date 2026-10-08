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
  releaseDate: string | null;
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

function withinDays(value: string | number | Date, checkedAt: string, days = 30) {
  const time = value instanceof Date ? value.getTime() : typeof value === "number" ? value : Date.parse(value);
  const checked = Date.parse(checkedAt);
  return Number.isFinite(time) && time <= checked && time >= checked - days * 86_400_000;
}

function activeAt(start: string | null | undefined, end: string | null | undefined, checkedAt: string) {
  const checked = Date.parse(checkedAt);
  const startTime = start ? Date.parse(start.replace(" ", "T")) : Number.NEGATIVE_INFINITY;
  const endTime = end ? Date.parse(end.replace(" ", "T")) : Number.POSITIVE_INFINITY;
  return startTime <= checked && checked <= endTime;
}

function candidate(input: {
  slug: string; brand: string; name: string; category: FoodserviceCategory; subCategory: string;
  checkedAt: string; description: string; sourceUrl: string; imageUrl?: string | null; releaseDate?: string | null;
}): FoodserviceCandidate {
  return {
    slug: input.slug, brand: input.brand, name: input.name, normalizedName: normalizeProductName(input.name),
    category: input.category, subCategory: input.subCategory, productType: "new", price: null, retailer: input.brand,
    releaseDate: input.releaseDate ?? null, announcedDate: input.checkedAt.slice(0, 10), description: input.description,
    sourceUrl: input.sourceUrl, sourceType: "official_site", imageUrl: input.imageUrl ?? null,
  };
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

export function extractKyochonNewProducts(html: string, checkedAt: string): FoodserviceCandidate[] {
  const sourceUrl = "https://www.kyochon.com/menu/chicken.asp?code=21";
  const products: FoodserviceCandidate[] = [];
  for (const item of html.split(/<li(?:\s[^>]*)?>/i).slice(1)) {
    const id = item.match(/view\.asp\?id=(\d+)&amp;cg=2/i)?.[1] ?? item.match(/view\.asp\?id=(\d+)&cg=2/i)?.[1];
    const rawName = item.match(/<dt>([\s\S]*?)<\/dt>/i)?.[1];
    const imagePath = item.match(/<img[^>]+src=["']([^"']+)["'][^>]+alt=["'][^"']*제품 이미지/i)?.[1];
    if (!id || !rawName) continue;
    const name = clean(rawName);
    products.push(candidate({
      slug: `kyochon-${id}`, brand: "교촌치킨", name, category: "chicken", subCategory: "치킨", checkedAt,
      description: "교촌치킨 공식 신메뉴 전용 목록에서 현재 판매 상품으로 확인된 메뉴", sourceUrl,
      imageUrl: imagePath ? new URL(imagePath, "https://www.kyochon.com").href : null,
    }));
  }
  return unique(products);
}

type McDonaldsMenuResponse = {
  resultObject?: { list?: Array<Record<string, unknown>> };
};

function parseMcDonaldsDate(value: string) {
  const match = value.match(/^(\d{4})-([A-Za-z]+)-(\d{1,2})(?:st|nd|rd|th)$/);
  return match ? new Date(`${match[2]} ${match[3]}, ${match[1]} 00:00:00 GMT+0900`) : new Date(value);
}

export function extractMcDonaldsNewProducts(data: McDonaldsMenuResponse, checkedAt: string): FoodserviceCandidate[] {
  const sourceUrl = "https://www.mcdonalds.co.kr/kor/menu/list.do";
  return unique((data.resultObject?.list ?? []).flatMap(item => {
    const id = String(item.seq ?? "");
    const rawName = String(item.korName ?? "");
    const registeredAt = parseMcDonaldsDate(String(item.regDate ?? ""));
    if (!id || !rawName || !String(item.nameText ?? "").includes("버거") || !String(item.exposureStatus ?? "").includes("recommend")) return [];
    if (!withinDays(registeredAt, checkedAt) || !activeAt(String(item.openTimeStart ?? ""), String(item.openTimeEnd ?? ""), checkedAt)) return [];
    const name = clean(rawName);
    const imagePath = String(item.pcImageUrl ?? "");
    return [candidate({
      slug: `mcdonalds-${id}`, brand: "맥도날드", name, category: "burger", subCategory: "버거",
      checkedAt, releaseDate: String(item.openTimeStart ?? "").slice(0, 10) || null,
      description: "맥도날드 공식 추천 신메뉴 중 최근 30일 내 등록되고 현재 판매 중인 버거",
      sourceUrl: `${sourceUrl}?seq=${id}`, imageUrl: imagePath ? new URL(imagePath, "https://www.mcdonalds.co.kr").href : null,
    })];
  }));
}

type BurgerKingMenuResponse = {
  body?: { allMenuList?: Array<{ menuCategoryNm?: string; menuInfo?: Array<Record<string, unknown>> }> };
};

export function extractBurgerKingNewProducts(data: BurgerKingMenuResponse, checkedAt: string): FoodserviceCandidate[] {
  const seen = new Set<string>();
  const products: FoodserviceCandidate[] = [];
  for (const group of data.body?.allMenuList ?? []) {
    for (const item of group.menuInfo ?? []) {
      const id = String(item.menuCd ?? "");
      const name = clean(String(item.menuNm ?? ""));
      const imageUrl = String(item.menuImgPath ?? "");
      const imageDate = imageUrl.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//)?.slice(1);
      const isNew = Array.isArray(item.menuFlagList) && item.menuFlagList.some(flag => String((flag as { menuFlagPk?: unknown }).menuFlagPk) === "01");
      if (!id || seen.has(id) || !isNew || /(?:라지)?세트$/.test(name)) continue;
      if (!/(버거|와퍼|크리스퍼|맥시멈|오리지널스)/.test(name)) continue;
      if (!imageDate || !withinDays(`${imageDate[0]}-${imageDate[1]}-${imageDate[2]}T00:00:00+09:00`, checkedAt)) continue;
      seen.add(id);
      products.push(candidate({
        slug: `burgerking-${id}`, brand: "버거킹", name, category: "burger", subCategory: "버거", checkedAt,
        releaseDate: imageDate.join("-"), description: "버거킹 공식 메뉴의 NEW 배지와 최근 30일 내 이미지 등록일로 확인된 단품 버거",
        sourceUrl: `https://www.burgerking.co.kr/menu/detail/${id}`, imageUrl,
      }));
    }
  }
  return products;
}

export function extractMomstouchNewProducts(html: string, checkedAt: string): FoodserviceCandidate[] {
  const products: FoodserviceCandidate[] = [];
  for (const item of html.split(/<li(?:\s[^>]*)?>/i).slice(1)) {
    if (!/<i class=["']new["']>\s*NEW\s*<\/i>/i.test(item)) continue;
    const id = item.match(/go_view\(["'](\d+)["']\)/i)?.[1];
    const rawName = item.match(/<h3[^>]*>[\s\S]*?<\/span>([\s\S]*?)<\/h3>/i)?.[1];
    const imagePath = item.match(/background-image:\s*url\(["']?([^"')]+)/i)?.[1];
    const uploadTimestamp = imagePath?.match(/\/(\d{10})-[^/]+$/)?.[1];
    if (!id || !rawName || !imagePath || !uploadTimestamp || !withinDays(Number(uploadTimestamp) * 1000, checkedAt)) continue;
    const name = clean(rawName);
    const category: FoodserviceCategory | null = /피자/.test(name) ? "pizza" : /치킨/.test(name) && !/버거/.test(name) ? "chicken" : /버거/.test(name) ? "burger" : null;
    if (!category) continue;
    products.push(candidate({
      slug: `momstouch-${id}`, brand: "맘스터치", name, category, subCategory: category === "pizza" ? "피자" : category === "chicken" ? "치킨" : "버거",
      checkedAt, releaseDate: new Date(Number(uploadTimestamp) * 1000).toISOString().slice(0, 10),
      description: "맘스터치 공식 신제품 메뉴의 NEW 배지와 최근 30일 내 이미지 업로드일로 확인된 상품",
      sourceUrl: `https://www.momstouch.co.kr/menu/view.php?idx=${id}&s_sect1=new`, imageUrl: new URL(imagePath, "https://www.momstouch.co.kr").href,
    }));
  }
  return unique(products);
}

type KfcStateEntry = { listData?: { rows?: Array<Record<string, unknown>> } };
type KfcState = Array<unknown | KfcStateEntry>;

export function extractKfcNewProducts(html: string, checkedAt: string): FoodserviceCandidate[] {
  const rawState = html.match(/window\.__INITIAL_COMPONENTS_STATE__\s*=\s*(\[[\s\S]*?\]);\s*window\.__INITIAL_VUEX_STATE__/)?.[1];
  if (!rawState) return [];
  const state = JSON.parse(rawState) as KfcState;
  const products: FoodserviceCandidate[] = [];
  for (const event of state.flatMap(entry => entry && typeof entry === "object" ? ((entry as KfcStateEntry).listData?.rows ?? []) : [])) {
    if (String(event.event_type_nm ?? "") !== "신제품" || String(event.event_show ?? "") !== "Y") continue;
    const start = String(event.event_show_str_date ?? "");
    const end = String(event.event_show_end_date ?? "");
    if (!withinDays(start.replace(" ", "T") + "+09:00", checkedAt) || !activeAt(start, end, checkedAt)) continue;
    const explanation = clean(String(event.event_web_explan ?? ""));
    const names = explanation.match(/출시 메뉴\s*:\s*([^\d]+?)(?=\s*3\.\s*출시 채널|$)/)?.[1]?.split(/\s*,\s*/) ?? [String(event.event_title ?? "")];
    const eventId = String(event.event_index ?? "");
    const imagePath = String(event.event_web_list_img ?? event.event_web_img ?? "");
    for (const rawName of names) {
      const name = clean(rawName);
      if (!name) continue;
      products.push(candidate({
        slug: `kfc-${eventId}-${normalizeProductName(name).replace(/\s+/g, "-")}`, brand: "KFC", name,
        category: /버거|징거/.test(name) ? "burger" : "chicken", subCategory: /버거|징거/.test(name) ? "버거" : "치킨",
        checkedAt, releaseDate: start.slice(0, 10), description: "KFC 공식 신제품 행사에서 최근 30일 내 출시되고 현재 판매 중으로 확인된 메뉴",
        sourceUrl: `https://www.kfckorea.com/promotion/newMenu/detail/${eventId}`,
        imageUrl: imagePath ? new URL(`/nas${imagePath}`, "https://www.kfckorea.com").href : null,
      }));
    }
  }
  return unique(products);
}

type PizzaHutMenu = Array<Record<string, unknown>>;

export function extractPizzaHutNewProducts(data: PizzaHutMenu, checkedAt: string): FoodserviceCandidate[] {
  return data.flatMap(item => {
    const id = String(item.digitalKey ?? "");
    const name = clean(String(item.rpstName ?? ""));
    const entries = Array.isArray(item.items) ? item.items as Array<Record<string, unknown>> : [];
    const started = entries.map(entry => String(entry.saleStartDate ?? "")).filter(Boolean).sort()[0];
    const active = entries.some(entry => String(entry.orderable ?? "") === "YES" && activeAt(String(entry.saleStartDate ?? ""), String(entry.saleEndDate ?? ""), checkedAt));
    if (!id || !name || String(item.badge ?? "") !== "NEW" || !started || !withinDays(started, checkedAt) || !active) return [];
    return [candidate({
      slug: `pizzahut-${id.toLowerCase()}`, brand: "피자헛", name, category: "pizza", subCategory: "피자", checkedAt,
      releaseDate: started.slice(0, 10), description: "피자헛 공식 메뉴 API의 NEW 배지에서 최근 30일 내 판매 시작되고 현재 주문 가능한 피자",
      sourceUrl: `https://www.pizzahut.co.kr/menu/pizza/best/${id}`,
    })];
  });
}

async function fetchHtml(url: string, fetcher: typeof fetch, encoding = "utf-8") {
  const response = await fetcher(url, { headers: { "user-agent": USER_AGENT }, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`${new URL(url).hostname} HTTP ${response.status}`);
  if (encoding === "utf-8") return response.text();
  return new TextDecoder(encoding).decode(await response.arrayBuffer());
}

async function fetchJson<T>(url: string, fetcher: typeof fetch, init?: RequestInit) {
  const response = await fetcher(url, { ...init, headers: { "user-agent": USER_AGENT, ...init?.headers }, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`${new URL(url).hostname} HTTP ${response.status}`);
  return response.json() as Promise<T>;
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

export async function collectKyochon(checkedAt = new Date().toISOString(), fetcher: typeof fetch = fetch) {
  const html = await fetchHtml("https://www.kyochon.com/menu/chicken.asp?code=21", fetcher);
  if (!html.includes("신메뉴") || !html.includes("menuProduct")) throw new Error("교촌치킨 신메뉴 페이지 구조 확인 실패");
  return extractKyochonNewProducts(html, checkedAt);
}

export async function collectMcDonalds(checkedAt = new Date().toISOString(), fetcher: typeof fetch = fetch) {
  const data = await fetchJson<McDonaldsMenuResponse>("https://www.mcdonalds.co.kr/api/v1/kor/product/menu/list", fetcher);
  if (!Array.isArray(data.resultObject?.list)) throw new Error("맥도날드 메뉴 API 구조 확인 실패");
  return extractMcDonaldsNewProducts(data, checkedAt);
}

export async function collectBurgerKing(checkedAt = new Date().toISOString(), fetcher: typeof fetch = fetch) {
  const message = JSON.stringify({ header: { result: true, error_code: "", error_text: "", info_text: "", message_version: "", login_session_id: "", trcode: "BKR0632", cd_call_chnn: "01" }, body: { menuKeywordList: [] } });
  const data = await fetchJson<BurgerKingMenuResponse>("https://web-prd.burgerking.co.kr/burgerking/BKR0632.json", fetcher, {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8", referer: "https://web-prd.burgerking.co.kr/menu/main" },
    body: new URLSearchParams({ message }).toString(),
  });
  if (!Array.isArray(data.body?.allMenuList)) throw new Error("버거킹 메뉴 API 구조 확인 실패");
  return extractBurgerKingNewProducts(data, checkedAt);
}

export async function collectMomstouch(checkedAt = new Date().toISOString(), fetcher: typeof fetch = fetch) {
  const html = await fetchHtml("https://www.momstouch.co.kr/menu/new.php?s_sect1=new", fetcher);
  if (!html.includes("menu-new") || !html.includes("신제품")) throw new Error("맘스터치 신제품 페이지 구조 확인 실패");
  return extractMomstouchNewProducts(html, checkedAt);
}

export async function collectKfc(checkedAt = new Date().toISOString(), fetcher: typeof fetch = fetch) {
  const html = await fetchHtml("https://www.kfckorea.com/promotion/newmenu", fetcher);
  if (!html.includes("__INITIAL_COMPONENTS_STATE__") || !html.includes("신제품")) throw new Error("KFC 신제품 페이지 구조 확인 실패");
  return extractKfcNewProducts(html, checkedAt);
}

export async function collectPizzaHut(checkedAt = new Date().toISOString(), fetcher: typeof fetch = fetch) {
  const data = await fetchJson<PizzaHutMenu>("https://www.pizzahut.co.kr/api/menu/0996/list/best/VISIT", fetcher);
  if (!Array.isArray(data)) throw new Error("피자헛 메뉴 API 구조 확인 실패");
  return extractPizzaHutNewProducts(data, checkedAt);
}
