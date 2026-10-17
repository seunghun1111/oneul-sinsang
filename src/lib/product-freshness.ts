type Evidence={sourceUrl:string;checkedAt:string};
type Item={sourceUrl:string;lastSeenAt?:string;reviewEvidence?:Evidence;consecutiveMisses?:number};
type Health={status:string;checkedAt?:string};
export const PRODUCT_STALE_MS=36*3600000;
export function productFreshness(product:Item,health:Health|undefined,now:number){
 const valid=(date:unknown):date is string=>typeof date==="string"&&Number.isFinite(Date.parse(date))&&Date.parse(date)<=now;
 const candidates=[product.lastSeenAt,product.reviewEvidence?.sourceUrl===product.sourceUrl?product.reviewEvidence.checkedAt:undefined].filter(valid);
 const confirmedAt=candidates.sort((a,b)=>Date.parse(b)-Date.parse(a))[0];
 const healthValid=health&&valid(health.checkedAt);
 const collectionIssue=!!health&&(!healthValid||health.status!=="success");
 const collectionStale=!!healthValid&&now-Date.parse(health.checkedAt!)>PRODUCT_STALE_MS;
 const stale=!!confirmedAt&&now-Date.parse(confirmedAt)>PRODUCT_STALE_MS;
 const missed=typeof product.consecutiveMisses==="number"&&product.consecutiveMisses>0;
 const status=!confirmedAt?"unknown":missed||stale||collectionIssue||collectionStale?"recheck":"recent";
 const label=status==="unknown"?"상품 확인 근거 미기록":status==="recheck"?"재확인 필요":"최근 공식 확인";
 const reason=!confirmedAt?"상품별 정상 확인 시각이 기록되지 않았습니다.":missed?"최근 정상 수집 목록에서 이 상품이 재확인되지 않아 기존 정보를 유지하고 있습니다.":collectionIssue?"브랜드 수집 실패·부분 실패 또는 유효하지 않은 운영 기록으로 재확인이 필요합니다.":stale||collectionStale?"정상 확인 후 36시간이 지나 재확인이 필요합니다.":"공식 출처에서 확인 당시의 정보이며 현재 판매·매장 재고를 보장하지 않습니다.";
 return {status,label,reason,confirmedAt};
}
