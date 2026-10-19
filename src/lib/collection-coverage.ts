export type CoverageProduct={brand:string;category:string;subCategory?:string;sourceType:string};
export type CoverageRow={id:string;group:string;groupLabel:string;brand:string;status:string;checkedAt?:string;newCount?:number};
export function coverageSummary(row:CoverageRow,products:CoverageProduct[],now:number){
 const published=products.filter(p=>p.brand===row.brand&&(row.group==="press"?p.sourceType==="press_release":row.group==="coffee"?p.category==="cafe":row.group==="cu"||row.group==="convenience"?p.category==="convenience":p.sourceType!=="press_release"));
 const checked=typeof row.checkedAt==="string"?Date.parse(row.checkedAt):NaN;
 const invalid=!Number.isFinite(checked)||checked>now;
 const stale=!invalid&&now-checked>36*3600000;
 const state=invalid||row.status==="not_checked"?"unknown":stale?"stale":row.status==="failed"?"failed":row.status==="partial"?"partial":row.status==="success"?"success":"unknown";
 const label=state==="unknown"?"수집 결과 미확인":state==="stale"?"오래된 기록 · 재확인 필요":state==="failed"?"수집 실패 · 상품 없음으로 판단 불가":state==="partial"?"일부 경로 확인 필요":published.length?"정상 확인 · 공개 상품 있음":row.newCount&&row.newCount>0?"후보 수집됨 · 공개 상품 0개":row.newCount===0?"정상 확인 · 공개 NEW 0개":"정상 기록 · NEW 건수 미확인";
 return {state,label,publishedCount:published.length,observed:[...new Set(published.map(p=>p.subCategory?.trim()).filter((s):s is string=>!!s))].sort((a,b)=>a.localeCompare(b,"ko"))};
}
