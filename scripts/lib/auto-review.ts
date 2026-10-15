import type { Product } from "../../src/types/product.ts";

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
  "하겐다즈":["haagendazs-store.co.kr"],"나뚜루":["www.lottesweetmall.com"],"롯데웰푸드":["www.lottesweetmall.com"],
};
export const reasons: Record<string,string> = {
  identity:"상품 식별 정보가 없거나 중복 ID입니다",source:"등록된 공식 출처가 아닙니다",robots:"수집 정책 확인 근거가 부족합니다",
  blocked:"수집 정책에서 제한한 경로입니다",new:"개별 NEW 또는 공식 신제품 발표 근거가 없습니다",
  date:"검증된 공식 출시·발표일이 없습니다 (발견일·수정일은 대체 불가)",future:"공식 출시·발표일이 미래입니다",
  expired:"공식 출시·발표일 기준 30일이 지났습니다",sale:"현재 판매 근거가 없거나 오래되었습니다",
  ended:"판매 종료 또는 비활성 상품입니다",passed:"모든 자동 승인 기준을 충족했습니다",
};
export type AutoVerdict = { decision:"approved"|"pending"|"rejected"; codes:string[]; reason:string; checkedAt:string; verifiedDate?:string };
export type AutoReport = { version:1; checkedAt:string; products:Record<string,AutoVerdict> };
const day = (date: Date) => date.toLocaleDateString("en-CA",{timeZone:"Asia/Seoul"});
const validDay = (value?:string) => !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
export function evaluateProducts(products:Product[], now=new Date()): AutoReport {
  const counts=new Map<string,number>();
  products.forEach(p=>counts.set(p.id,(counts.get(p.id)??0)+1));
  const fresh=(value?:string) => !!value && Number.isFinite(Date.parse(value)) && now.getTime()-Date.parse(value)>=0 && now.getTime()-Date.parse(value)<=36*3600000;
  const verdicts:Record<string,AutoVerdict>={};
  for(const p of products) {
    const e=p.reviewEvidence;
    const codes:string[]=[];
    let official=false;
    try { const url=new URL(p.sourceUrl); official=url.protocol==="https:" && !url.username && !url.password && (!url.port || url.port==="443") && !!officialHosts[p.brand]?.includes(url.hostname); } catch {}
    if(!p.id || !p.name?.trim() || !p.normalizedName?.trim() || counts.get(p.id)!==1) codes.push("identity");
    if(!official) codes.push("source");
    if(e?.robots==="blocked") codes.push("blocked");
    else if(e?.robots!=="allowed" || !fresh(e.checkedAt) || e.sourceUrl!==p.sourceUrl) codes.push("robots");
    if(!e?.explicitNew && !e?.officialLaunchAnnouncement) codes.push("new");
    const date=validDay(e?.officialDate) ? e!.officialDate : undefined;
    if(!date || !["launch","announcement"].includes(e?.dateKind??"")) codes.push("date");
    else {
      const age=(Date.parse(day(now))-Date.parse(date))/86400000;
      if(age<0) codes.push("future");
      else if(age>=30) codes.push("expired");
    }
    // Existing collectors' generic on_sale assignment is not proof of actual sale.
    if(p.availabilityStatus!=="on_sale" || !fresh(p.availabilityCheckedAt) || !e?.saleConfirmed || !fresh(e.checkedAt)) codes.push("sale");
    if(!p.isActive || p.availabilityStatus==="ended") codes.push("ended");
    const rejected=codes.some(code=>["blocked","expired","ended"].includes(code));
    verdicts[p.id]={decision:rejected?"rejected":codes.length?"pending":"approved",codes:codes.length?codes:["passed"],reason:(codes.length?codes:["passed"]).map(code=>reasons[code]).join(" · "),checkedAt:now.toISOString(),...(date?{verifiedDate:date}:{})};
  }
  return {version:1,checkedAt:now.toISOString(),products:verdicts};
}
