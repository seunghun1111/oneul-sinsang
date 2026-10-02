import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import type { Offer, StockStatus } from "../src/types/offer.ts";

type Target = Omit<Offer, "price" | "regularPrice" | "stockStatus" | "observedAt"> & { parser: "oliveyoung" | "kurly" };

const targets: Target[] = [
  { id:"oliveyoung-orion-pokachip-cheese-60g", productSlug:"orion-1423", retailer:"올리브영", title:"포카칩 황치즈맛 60g", url:"https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000268598", quantity:1, unit:"60g", parser:"oliveyoung" },
  { id:"oliveyoung-maeil-puretein-330ml", productSlug:"maeil-3", retailer:"올리브영", title:"퓨어틴 프로틴 쉐이크 330ml 1+1", url:"https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000263160", quantity:2, unit:"330ml", parser:"oliveyoung" },
  { id:"kurly-samyang-1963-pagaejang-115g", productSlug:"samyang-1337", retailer:"컬리", title:"삼양1963 우지파개장 큰컵 115g", url:"https://www.kurly.com/goods/1002224967", quantity:1, unit:"115g", parser:"kurly" },
];

const sourceUrl = new URL("../src/data/offers.json", import.meta.url);
const publicUrl = new URL("../public/data/offers.json", import.meta.url);

function plainText(html:string) {
  return html.replace(/<script\b[\s\S]*?<\/script>/gi," ").replace(/<style\b[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ")
    .replace(/&nbsp;|&#160;/gi," ").replace(/&amp;/gi,"&").replace(/&#x([0-9a-f]+);/gi,(_,hex)=>String.fromCodePoint(parseInt(hex,16)))
    .replace(/&#(\d+);/g,(_,code)=>String.fromCodePoint(Number(code))).replace(/\s+/g," ").trim();
}

function statusFrom(text:string):StockStatus {
  if (/일시품절|품절/.test(text) && !/품절대란/.test(text)) return "out_of_stock";
  if (/장바구니|바로구매|구매수량/.test(text)) return "in_stock";
  return "unknown";
}

export function parseOfferHtml(target:Target, html:string, observedAt:string):Offer {
  const text = plainText(html);
  const anchor = target.title.split(" 1+1")[0];
  const start = text.indexOf(anchor);
  if (start < 0) throw new Error("상품명을 확인할 수 없습니다.");
  const segment = text.slice(start,start+1800);
  let price:number|null = null;
  let regularPrice:number|undefined;
  if (target.parser === "kurly") {
    const structured = html.match(/"showablePrices":\{"salesPrice":(\d+),"basePrice":(\d+)/);
    if (structured) { price=Number(structured[1]); regularPrice=Number(structured[2]); }
    else {
      const match = segment.match(/(\d{1,3}(?:,\d{3})+)원\s+(\d{1,3}(?:,\d{3})+)\s*원/);
      if (match) { regularPrice=Number(match[1].replaceAll(",","")); price=Number(match[2].replaceAll(",","")); }
    }
  } else {
    const match = segment.match(/(\d{1,3}(?:,\d{3})+)\s*원/);
    if (match) price=Number(match[1].replaceAll(",",""));
  }
  if (price == null || price < 100 || price > 1_000_000) throw new Error("판매 가격을 확인할 수 없습니다.");
  return { id:target.id, productSlug:target.productSlug, retailer:target.retailer, title:target.title, url:target.url, price,
    ...(regularPrice && regularPrice > price ? {regularPrice}:{}), quantity:target.quantity, unit:target.unit,
    stockStatus:target.parser === "kurly" && /"isPurchaseStatus":true/.test(html) ? "in_stock" : statusFrom(segment), observedAt };
}

async function fetchHtml(url:string) {
  const response=await fetch(url,{redirect:"follow",headers:{"user-agent":"Mozilla/5.0 (compatible; OneulSinsang/1.0)"},signal:AbortSignal.timeout(12_000)});
  if(!response.ok||!response.headers.get("content-type")?.toLowerCase().includes("text/html")) throw new Error(`판매 페이지 응답 오류 (${response.status})`);
  const html=await response.text();
  if(html.length>2_000_000) throw new Error("판매 페이지 크기 제한 초과");
  return html;
}

async function main(){
  const existing=JSON.parse(await readFile(sourceUrl,"utf8")) as Offer[];
  const byId=new Map(existing.map(offer=>[offer.id,offer]));
  const observedAt=new Date().toISOString();
  const results=await Promise.allSettled(targets.map(async target=>parseOfferHtml(target,await fetchHtml(target.url),observedAt)));
  let succeeded=0;
  results.forEach((result,index)=>{
    if(result.status==="fulfilled"){byId.set(result.value.id,result.value);succeeded++;console.log(`${targets[index].retailer}: ${targets[index].title} 확인`);}
    else console.warn(`${targets[index].retailer}: ${targets[index].title} 갱신 실패, 기존 정보 유지`);
  });
  if(succeeded===0) throw new Error("모든 온라인 판매 정보 갱신에 실패했습니다.");
  const offers=[...byId.values()].sort((a,b)=>a.productSlug.localeCompare(b.productSlug)||a.price-b.price);
  const json=`${JSON.stringify(offers,null,2)}\n`;
  await Promise.all([writeFile(sourceUrl,json,"utf8"),writeFile(publicUrl,json,"utf8")]);
  console.log(`온라인 판매 정보 ${offers.length}건 저장 완료`);
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) await main();
