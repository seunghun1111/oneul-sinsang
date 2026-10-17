import {hasOfficialNewTab} from "./official-new.ts";
export type DiscoveryReference = {kind:"launch"|"sale";url:string;checkedAt:string;verified:boolean;label?:string;verification?:"official_orderable";evidenceUrl?:string};
export type DiscoveryItem = {
  brand:string;name:string;category:string;firstDetectedAt:string;sourceUrl:string;sourceType?:string;newStatus?:string;isActive?:boolean;
  reviewEvidence?:{sourceUrl?:string;explicitNew?:boolean;officialNewListing?:string;officialDate?:string;dateKind?:string};
  discoveryReferences?:DiscoveryReference[];
};
export function safeEvidenceUrl(value:string) {
  try {
    const url=new URL(value);
    if(url.protocol!=="https:"||url.username||url.password||url.port||url.hostname==="localhost"||!url.hostname.includes(".")||/^(?:\d+\.){3}\d+$/.test(url.hostname))return null;
    if(/(^|\.)(kakao\.com|kakaocorp\.com|daum\.net|daumcorp\.com|kakaosecure\.net|dakao\.io|9rum\.cc|onkakao\.net|daumkakao\.io|daumkakao\.com|daumtools\.com)$/.test(url.hostname))return null;
    return url.href;
  }catch{return null;}
}
export function discoveryEvidence(product:DiscoveryItem) {
  const references=(Array.isArray(product.discoveryReferences)?product.discoveryReferences:[]).filter(r=>r&&typeof r.url==="string"&&(r.kind==="launch"||r.kind==="sale")&&typeof r.verified==="boolean"&&safeEvidenceUrl(r.url)&&Number.isFinite(Date.parse(r.checkedAt)));
  const launches=references.filter(r=>r.kind==="launch");
  const sales=references.filter(r=>r.kind==="sale");
  const ordered=sales.filter(r=>{
    if(!r.verified||r.verification!=="official_orderable"||product.brand!=="피자헛"||r.url!==product.sourceUrl)return false;
    const url=new URL(r.url);
    return url.origin==="https://www.pizzahut.co.kr"&&/^\/menu\/pizza\/best\/RPPZ\d+$/.test(url.pathname)&&!url.search&&!url.hash
      &&r.evidenceUrl==="https://www.pizzahut.co.kr/api/menu/0996/list/best/VISIT";
  }).sort((a,b)=>Date.parse(b.checkedAt)-Date.parse(a.checkedAt));
  const directNew=!!(product.reviewEvidence?.explicitNew||hasOfficialNewTab(product));
  return {
    newLabel:directNew?(product.newStatus==="removed"||product.isActive===false?"과거 NEW 확인 (현재 종료)":"공식 NEW 확인"):launches.some(r=>r.verified)?"출시 근거 확인":launches.length?"출시 소식 후보":"공식 근거 참조",
    saleLabel:ordered.length?(product.isActive===false||product.newStatus==="removed"?"과거 공식 주문 가능 확인 (매장별 재고·배달 별도)":"공식 주문 가능 확인 (매장별 재고·배달 별도)"):sales.some(r=>r.verified)?"판매 페이지 확인 (재고·매장 판매 별도)":sales.length?"판매 링크 후보 (미검증)":"판매 여부 미확인",
    saleCheckedAt:ordered[0]?.checkedAt,
    dateLabel:product.reviewEvidence?.officialDate&&product.reviewEvidence.dateKind==="launch"?"공식 출시일":"최초 발견일",
    date:product.reviewEvidence?.officialDate&&product.reviewEvidence.dateKind==="launch"?product.reviewEvidence.officialDate:product.firstDetectedAt?.slice(0,10),
    references,
  };
}
export function portalSearchLinks(product:Pick<DiscoveryItem,"brand"|"name"|"category">) {
  const query=`${product.brand} ${product.name}`;
  const link=(label:string,query:string)=>({label,url:"https://search.naver.com/search.naver?"+new URLSearchParams({query}).toString()});
  return [link("출시 소식 검색",query+" 출시 신메뉴"),link("판매·주문 검색",query+(["cafe","chicken","burger","pizza"].includes(product.category)?" 공식 메뉴 주문":" 공식 판매 구매"))];
}
