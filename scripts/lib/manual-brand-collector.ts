import { normalizeProductName } from "../../src/lib/normalize-product-name.ts";

export type BrandCandidate = {
  slug: string; brand: string; name: string; normalizedName: string; category: "chicken" | "icecream";
  subCategory: string; productType: "new"; price: null; retailer: string; releaseDate: null;
  announcedDate: string; description: string; sourceUrl: string; sourceType: "official_site";
  imageUrl: string | null; reviewStatus: "pending";
};
type Source = { id: string; brand: string; url: string; category: BrandCandidate["category"]; parser: "bhc" | "puradak" | "nene" | "bbq" | "cafe24" };
export const automatedBrandSources: Source[] = [
  {id:"bhc",brand:"bhc",url:"https://www.bhc.co.kr/api/v1/web/categories/22/products",category:"chicken",parser:"bhc"},
  {id:"puradak",brand:"푸라닭",url:"https://puradakchicken.com/menu/product.asp",category:"chicken",parser:"puradak"},
  {id:"nene",brand:"네네치킨",url:"https://nenechicken.com/home_menu.asp",category:"chicken",parser:"nene"},
  {id:"bbq",brand:"BBQ",url:"https://dt.bbq.co.kr/menu/menuList.asp?cidx=113&cname=%EC%8B%A0%EB%A9%94%EB%89%B4",category:"chicken",parser:"bbq"},
  {id:"haagendazs",brand:"하겐다즈",url:"https://haagendazs-store.co.kr/product/list.html?cate_no=25&sort_method=5",category:"icecream",parser:"cafe24"},
  {id:"natuur",brand:"나뚜루",url:"https://www.lottesweetmall.com/product/list_ice.html?cate_no=344&sort_method=5",category:"icecream",parser:"cafe24"},
  {id:"lotteice",brand:"롯데웰푸드",url:"https://www.lottesweetmall.com/product/list_ice.html?cate_no=343&sort_method=5",category:"icecream",parser:"cafe24"},
];
const UA = "OneulSinsang/1.0 (+non-commercial product index)";
const clean = (value: string) => value.replace(/<[^>]*>/g," ").replace(/&amp;/g,"&").replace(/&nbsp;/g," ").replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g," ").trim();
const uncomment = (value: string) => value.replace(/<!--[\s\S]*?-->/g,"").replace(/<script\b[\s\S]*?<\/script>/gi,"");
const hasNew = (item: string) => /<img\b[^>]+(?:alt=["'](?:NEW|New|신상품|NEW메뉴)["']|src=["'][^"']*(?:ico_product_new|img_new|icon_new)[^"']*["'])|<span\b[^>]*>\s*NEW\s*<\/span>/i.test(item);

function candidate(source: Source, id: string, name: string, url: string, image: string | null, checkedAt: string): BrandCandidate {
  return {slug:`${source.id}-${id}`,brand:source.brand,name,normalizedName:normalizeProductName(name),category:source.category,
    subCategory:source.category==="chicken" ? "치킨" : "아이스크림",productType:"new",price:null,retailer:source.brand,releaseDate:null,
    announcedDate:checkedAt.slice(0,10),description:`${source.brand} 공식 상품의 NEW 표시 확인. 실제 출시일·현재 판매 여부 검수 필요`,
    sourceUrl:url,sourceType:"official_site",imageUrl:image ? new URL(image,source.url).href : null,reviewStatus:"pending"};
}

export function extractBrandProducts(source: Source, raw: string, checkedAt: string): BrandCandidate[] {
  const products: BrandCandidate[] = [];
  if(source.parser==="bhc") {
    const data=JSON.parse(raw);
    if(data.status!=="success" || !Array.isArray(data.body)) throw new Error("bhc 공개 메뉴 응답 구조 변경");
    for(const row of data.body) {
      if(row.isNew!=="Y" || !/^\d+$/.test(String(row.productCd)) || typeof row.productNm!=="string") continue;
      products.push(candidate(source,String(row.productCd),clean(row.productNm),"https://www.bhc.co.kr/menu/22",typeof row.mainImg==="string" ? row.mainImg : null,checkedAt));
    }
    return products;
  }
  const html=uncomment(raw);
  const marker=source.parser==="puradak" ? /photo_list/ : source.parser==="nene" ? /MenuInner/ : source.parser==="bbq" ? /<h3>\s*신메뉴\s*<\/h3>/ : /xans-product-listnormal/;
  if(!marker.test(html)) throw new Error(`${source.brand} 공식 목록 구조 변경`);
  const blocks=source.parser==="nene" ? html.split(/<div\b[^>]*class=["']MenuBox\b/i).slice(1)
    : source.parser==="cafe24" ? html.split(/<li\b[^>]*id=["']anchorBoxId_/i).slice(1)
    : html.split(/<li(?:\s[^>]*)?>/i).slice(1);
  for(const item of blocks) {
    if(!hasNew(item)) continue;
    let id: string|undefined, name="", path="", image: string|null=null;
    if(source.parser==="puradak") {
      id=item.match(/view\.asp\?idx=(\d+)/)?.[1];
      name=clean(item.match(/<p\b[^>]*class=["']title\b[^"']*["'][^>]*>([\s\S]*?)<\/p>/i)?.[1]??"");
      path=`/menu/view.asp?idx=${id}`;
      image=item.match(/<img[^>]*src=["']([^"']+)["'][^>]*class=["']bg_thumb/i)?.[1]??null;
    } else if(source.parser==="nene") {
      id=item.match(/home_menu_detail\.asp\?no=(\d+)/)?.[1];
      name=clean(item.match(/class=["']MenuTitle[^"']*["'][^>]*>[\s\S]*?<\/div>\s*([^<]+)<\/div>/i)?.[1]??"");
      path=`/home_menu_detail.asp?no=${id}&GUBUN=MENU`;
      image=item.match(/<img[^>]*src=["']([^"']*\/images\/goods\/[^"']+)/i)?.[1]??null;
    } else if(source.parser==="bbq") {
      id=item.match(/menuView\.asp\?midx=(\d+)/)?.[1];
      name=clean(item.match(/<p\b[^>]*class=["']name["'][^>]*>([\s\S]*?)<\/p>/i)?.[1]??"");
      path=`/menu/menuView.asp?midx=${id}`;
      image=item.match(/<img[^>]*src=["']([^"']+)/i)?.[1]??null;
    } else {
      id=item.match(/^(\d+)/)?.[1];
      if(/<img\b[^>]*alt=["']품절["']/i.test(item)) continue;
      name=clean(item.match(/class=["']name["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i)?.[1]??"").replace(/^상품명\s*:\s*/,"");
      path=`/product/detail.html?product_no=${id}`;
      image=item.match(/<img[^>]*src=["']([^"']*\/web\/product\/[^"']+)/i)?.[1]??null;
      if(source.id==="lotteice" && /나뚜루/.test(name)) continue;
    }
    if(id && name) products.push(candidate(source,id,name,new URL(path,source.url).href,image,checkedAt));
  }
  return [...new Map(products.map(p=>[p.slug,p])).values()];
}

// Match wildcard robots paths against both path and query; explicit Allow wins equal-length ties.
export function robotsAllows(text: string, url: string) {
  const target=new URL(url); const path=target.pathname+target.search;
  const groups: {agents:string[];rules:{allow:boolean;pattern:string}[]}[]=[];
  let group={agents:[] as string[],rules:[] as {allow:boolean;pattern:string}[]};
  for(const raw of text.split(/\r?\n/)) {
    const line=raw.replace(/#.*$/,"").trim(); const index=line.indexOf(":"); if(index<0) continue;
    const key=line.slice(0,index).trim().toLowerCase(), value=line.slice(index+1).trim();
    if(key==="user-agent") { if(group.rules.length) {groups.push(group);group={agents:[],rules:[]};} group.agents.push(value.toLowerCase()); }
    else if((key==="allow"||key==="disallow") && value) group.rules.push({allow:key==="allow",pattern:value});
  }
  groups.push(group);
  const specific=groups.filter(g=>g.agents.some(a=>a!=="*" && UA.toLowerCase().includes(a)));
  const applicable=specific.length?specific:groups.filter(g=>g.agents.includes("*"));
  const matched=applicable.flatMap(g=>g.rules).filter(r=>new RegExp("^"+r.pattern.split("*").map(p=>p.replace(/[.+?^\x24{}()|[\]\\]/g,"\\$&")).join(".*").replace(/\\\x24$/,"$")).test(path))
    .sort((a,b)=>b.pattern.length-a.pattern.length||Number(b.allow)-Number(a.allow));
  return matched[0]?.allow??true;
}

export async function collectAutomatedBrand(source: Source, checkedAt: string, fetcher: typeof fetch=fetch) {
  const init={headers:{"user-agent":UA},signal:AbortSignal.timeout(20000)};
  const policy=await fetcher(new URL("/robots.txt",source.url),init);
  let policyState="not_provided";
  if(policy.ok) {
    const text=await policy.text();
    if(/<html|<!doctype/i.test(text)) throw new Error("robots.txt가 정책 대신 HTML을 반환함");
    if(!robotsAllows(text,source.url)) throw new Error("robots.txt 수집 제한 경로");
    policyState="checked";
  } else if(policy.status!==404 && policy.status!==410) throw new Error(`robots HTTP ${policy.status}`);
  const response=await fetcher(source.url,{headers:{"user-agent":UA},signal:AbortSignal.timeout(20000)});
  if(!response.ok) throw new Error(`상품 목록 HTTP ${response.status}`);
  const candidates=extractBrandProducts(source,await response.text(),checkedAt);
  return {candidates,policyState};
}
