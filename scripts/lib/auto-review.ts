import type { Product } from "../../src/types/product.ts";
import {coffeeBrandSources} from "../../src/data/coffee-sources.ts";

// Explicit brand/host pairs, never learned from incoming product data.
const officialHosts: Record<string, string[]> = {
  "네네치킨":["nenechicken.com"],"푸라닭":["puradakchicken.com"],bhc:["www.bhc.co.kr"],BBQ:["dt.bbq.co.kr"],
  CU:["cu.bgfretail.com"],"세븐일레븐":["www.7-eleven.co.kr"],"이마트24":["emart24.co.kr","www.emart24.co.kr"],
  "버거킹":["www.burgerking.co.kr"],"교촌치킨":["www.kyochon.com"],"굽네":["www.goobne.co.kr"],
  "도미노피자":["web.dominos.co.kr"],"롯데리아":["www.lotteeatz.com"],"배스킨라빈스":["www.baskinrobbins.co.kr"],
  "맥도날드":["www.mcdonalds.co.kr"],"맘스터치":["www.momstouch.co.kr"],KFC:["www.kfckorea.com"],
  "풀무원":["news.pulmuone.co.kr"],"오리온":["www.orionworld.com"],"매일유업":["www.maeil.com"],
  "삼양식품":["samyangfoods.com"],"빙그레":["www.bing.co.kr"],"스타벅스":["www.starbucks.co.kr"],
  "할리스":["www.hollys.co.kr"],"빽다방":["paikdabang.com"],"이디야커피":["www.ediya.com"],
  "하겐다즈":["haagendazs-store.co.kr"],"나뚜루":["www.lottesweetmall.com"],"롯데웰푸드":["www.lottesweetmall.com"],"피자헛":["www.pizzahut.co.kr"],
};
for(const source of coffeeBrandSources) officialHosts[source.brand]=[...new Set([...(officialHosts[source.brand]??[]),...source.channels.map(channel=>new URL(channel.url).hostname)])];
export const reasons: Record<string,string> = {
  identity:"상품 식별 정보가 없거나 중복 ID입니다",source:"등록된 공식 출처가 아닙니다",robots:"수집 정책 확인 근거가 부족합니다",
  blocked:"수집 정책에서 제한한 경로입니다",new:"개별 NEW 또는 공식 신제품 발표 근거가 없습니다",
  date:"검증된 공식 출시·발표일이 없습니다 (발견일·수정일은 대체 불가)",future:"공식 출시·발표일이 미래입니다",
  expired:"공식 출시·발표일 기준 30일이 지났습니다",sale:"현재 판매 근거가 없거나 오래되었습니다",
  ended:"공식 NEW 표시 종료 (판매 종료를 의미하지 않습니다)",passed:"공식 상품별 NEW 표시 확인으로 자동 승인했습니다. 출시일·매장 재고는 별도입니다",
};
export type AutoVerdict = { decision:"approved"|"pending"|"rejected"; codes:string[]; reason:string; checkedAt:string; verifiedDate?:string };
export type AutoReport = { version:1; checkedAt:string; products:Record<string,AutoVerdict> };
const newCheckReasons = {
  dynamic_page:"공식 상세 페이지 응답에 상품별 NEW 근거가 없어 확인 보류입니다. 동적 상품 데이터 또는 실제 화면 확인이 필요합니다",
  no_new_mark:"공식 상품 목록은 확인했으나 해당 상품의 현재 NEW 표시를 확인하지 못했습니다. 추천 순서·이미지 수정일만으로 승인하지 않습니다",
  announcement_only:"공식 출시 발표는 확인했으나 현재 NEW 표시를 확인하지 못했습니다. 과거 출시 발표만으로 현재 신상품을 자동 승인하지 않습니다",
  source_unavailable:"공식 출처 또는 수집 정책을 재확인하지 못해 기존 검수 대기를 유지합니다",
};
export function evaluateProducts(products:Product[], now=new Date()): AutoReport {
  const counts=new Map<string,number>();
  products.forEach(p=>counts.set(p.id,(counts.get(p.id)??0)+1));
  const verdicts:Record<string,AutoVerdict>={};
  for(const p of products) {
    const e=p.reviewEvidence;
    const codes:string[]=[];
    let official=false;
    try { const url=new URL(p.sourceUrl); official=url.protocol==="https:" && !url.username && !url.password && (!url.port || url.port==="443") && !!officialHosts[p.brand]?.includes(url.hostname); } catch {}
    if(!p.id || !p.name?.trim() || !p.normalizedName?.trim() || counts.get(p.id)!==1) codes.push("identity");
    if(!official) codes.push("source");
    if(e?.robots==="blocked") codes.push("blocked");
    else if(e && e.sourceUrl!==p.sourceUrl) codes.push("robots");
    const kyochonListing = p.brand==="교촌치킨"
      && p.sourceUrl==="https://www.kyochon.com/menu/chicken.asp?code=21"
      && e?.sourceUrl===p.sourceUrl && e.officialNewListing==="kyochon_code_21";
    if(!e?.explicitNew && !kyochonListing) codes.push("new");
    if(!p.isActive || p.newStatus==="removed") codes.push("ended");
    const rejected=codes.some(code=>["blocked","ended"].includes(code));
    const date=e?.officialDate;
    verdicts[p.id]={decision:rejected?"rejected":codes.length?"pending":"approved",codes:codes.length?codes:["passed"],reason:!codes.length && kyochonListing && !e?.explicitNew ? "교촌치킨 공식 신메뉴 탭(code=21) 등록 확인으로 자동 승인했습니다. 이미지 NEW 문자 인식·출시일·매장 재고 확인과는 별개입니다" : (codes.length?codes:["passed"]).map(code=>code==="new" && e?.newCheckReason ? newCheckReasons[e.newCheckReason]??reasons.new : reasons[code]).join(" · "),checkedAt:now.toISOString(),...(date?{verifiedDate:date}:{})};
  }
  return {version:1,checkedAt:now.toISOString(),products:verdicts};
}
